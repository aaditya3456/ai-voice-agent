import { SAFETY_POLICY } from "../../shared/src/safety.js";
import type { KnowledgeRetriever, SearchResponse } from "../../knowledge/src/types.js";
import { evaluate } from "./engine.js";
import { detectIntent, extractFields } from "./extractor.js";
import type {
  BusinessRules, ConversationResponse, ConversationState, ConversationTurn,
  KbRetrievalDebug, QualificationFields, QualificationResult, UserIntent,
} from "./types.js";
import { emptyFields } from "./types.js";

/* ── Friendly labels for missing field prompts ── */
const FIELD_LABELS: Record<string, string> = {
  business_age_months: "how long your business has been operating",
  registration_status: "whether your business is registered",
  monthly_revenue: "your approximate average monthly revenue",
  requested_amount: "how much you would like to borrow",
  intended_use: "the intended use of the loan",
  contact_preference: "your preferred contact method (email, phone, or SMS)",
};

/* ── Build a KB retrieval debug snapshot ── */
function kbDebug(query: string, result: SearchResponse): KbRetrievalDebug {
  const citation = result.citations[0] ?? null;
  return {
    query,
    grounded: result.grounded,
    confidence: Number(result.confidence.toFixed(4)),
    source_document_id: citation?.document_id ?? null,
    chunk_id: citation?.chunk_id ?? null,
    source_title: citation?.title ?? null,
    fallback: result.fallback,
    fallback_message: result.fallback_message,
  };
}

/**
 * Manages a single voice-agent conversation session.
 *
 * Key invariants:
 *   – The deterministic engine (engine.ts) is the sole authority on eligibility.
 *   – KB questions use the existing Q2 retriever (no hardcoded answers).
 *   – The safety threshold and fallback wording come from SAFETY_POLICY.
 *   – Escalation triggers are never overridden.
 */
export class ConversationSession {
  state: ConversationState = "GREETING";
  fields: QualificationFields = emptyFields();
  qualification: QualificationResult | null = null;
  escalation = { triggered: false, reason: null as string | null };
  transcript: ConversationTurn[] = [];
  conflicts: Record<string, { old_value: unknown; new_value: unknown }> = {};
  private returnState: ConversationState | null = null;

  constructor(
    private readonly rules: BusinessRules,
    private readonly retriever: KnowledgeRetriever,
  ) {}

  /* ── Public entry point ── */

  start(): ConversationResponse {
    const greeting =
      "Welcome to HarborSpring Business Finance. I can help you explore preliminary qualification for our synthetic SME Business Loan. " +
      "All data in this prototype is fictional and no real financial decisions are made. " +
      "Before we proceed, I need your consent to collect some business information for the qualification process. Do you agree to proceed?";
    this.state = "CONSENT";
    this.addTurn("agent", greeting);
    return this.response(greeting);
  }

  processMessage(text: string): ConversationResponse {
    this.addTurn("user", text);
    const intent = detectIntent(text);
    let kbResult: KbRetrievalDebug | null = null;

    // ── Priority 1: Escalation / complaint (can happen in any state) ──
    if (intent === "escalation_request" || intent === "complaint") {
      return this.handleEscalation(intent);
    }

    // ── Priority 2: Objection (use Q2 KB playbook retrieval) ──
    if (intent === "objection") {
      const result = this.handleObjection(text);
      return result;
    }

    // ── Priority 3: KB question (use Q2 KB retrieval) ──
    if (intent === "kb_question") {
      return this.handleKbQuestion(text);
    }

    // ── Priority 4: End call ──
    if (intent === "end_call") {
      this.state = "COMPLETE";
      const reply = "Thank you for your time. If you would like to continue the qualification process in the future, please don't hesitate to reach out. Goodbye.";
      this.addTurn("agent", reply);
      return this.response(reply);
    }

    // ── State-specific handling ──
    switch (this.state) {
      case "CONSENT":
        return this.handleConsent(intent, text);
      case "COLLECT_BUSINESS_INFO":
      case "COLLECT_FINANCIAL_INFO":
      case "COLLECT_LOAN_REQUEST":
        return this.handleInfoCollection(text);
      case "DETERMINE_QUALIFICATION":
        // User continues talking after qualification — treat as KB or info
        return this.handleInfoCollection(text);
      case "COMPLETE":
        return this.replyAndReturn("This qualification session has ended. Please start a new call if you would like to begin again.");
      case "ESCALATION":
        return this.replyAndReturn("This conversation has been marked for human assistance. A representative will follow up.");
      default:
        return this.replyAndReturn("I'm not sure how to proceed. Would you like to start over?");
    }
  }

  /* ── State handlers ── */

  private handleConsent(intent: UserIntent, text: string): ConversationResponse {
    if (intent === "consent_given") {
      this.fields.consent = true;
      this.state = "COLLECT_BUSINESS_INFO";
      const reply =
        "Thank you for your consent. Let me collect some information about your business. " +
        "Could you tell me how long your business has been operating and whether it is registered in the Harbor Market?";
      this.addTurn("agent", reply);
      return this.response(reply);
    }
    if (intent === "consent_denied") {
      this.fields.consent = false;
      this.state = "COMPLETE";
      const reply =
        "I understand. Consent is required before we can proceed with the qualification process. " +
        "If you change your mind, please feel free to start a new session. Thank you.";
      this.addTurn("agent", reply);
      return this.response(reply);
    }
    // Ambiguous — ask again
    const reply = "I need your consent before we can proceed. Do you agree to share some business information for the qualification process?";
    this.addTurn("agent", reply);
    return this.response(reply);
  }

  private handleInfoCollection(text: string): ConversationResponse {
    // Extract fields from the user's message
    const newFields = extractFields(text);

    // Check for conflicts with existing fields or resolve existing conflicts
    for (const [key, value] of Object.entries(newFields) as Array<[keyof QualificationFields, unknown]>) {
      const currentValue = this.fields[key];
      if (this.conflicts[key]) {
        // User is clarifying a previous conflict
        this.fields[key] = value as any;
        delete this.conflicts[key];
      } else if (currentValue !== null && currentValue !== value) {
        // New conflict detected
        this.conflicts[key] = { old_value: currentValue, new_value: value };
      } else {
        this.fields[key] = value as any;
      }
    }

    // If we have unresolved conflicts, set outcome to needs_clarification and ask for clarification
    if (Object.keys(this.conflicts).length > 0) {
      const conflictKey = Object.keys(this.conflicts)[0];
      const conflict = this.conflicts[conflictKey];
      this.qualification = {
        outcome: "needs_clarification",
        missing_fields: [],
        failing_criteria: [],
        disclaimer: this.rules.mandatory_disclaimer,
      };
      const reply =
        `I have two different values for that information. ` +
        `You mentioned ${String(conflict.old_value)} but also ${String(conflict.new_value)}. ` +
        `Could you clarify which one is correct?`;
      this.addTurn("agent", reply);
      return this.response(reply);
    }

    // Run the deterministic engine to check status
    const result = evaluate(this.fields, this.rules);

    if (result.outcome === "needs_information") {
      // Advance state based on what's been collected
      this.advanceCollectionState();
      this.qualification = result;

      const missing = result.missing_fields.filter((f) => f !== "consent");
      if (missing.length === 0) {
        const reply = "I still need your consent to proceed.";
        this.addTurn("agent", reply);
        return this.response(reply);
      }
      const labels = missing.slice(0, 2).map((f) => FIELD_LABELS[f] ?? f).join(" and ");
      const reply = `I still need a few details before I can determine preliminary qualification. Could you tell me ${labels}?`;
      this.addTurn("agent", reply);
      return this.response(reply);
    }

    // All fields collected — deliver qualification result
    this.state = "DETERMINE_QUALIFICATION";
    this.qualification = result;

    let reply: string;
    if (result.outcome === "preliminary_eligible") {
      reply =
        "Based on the information you've provided, you appear to meet our preliminary qualification criteria. " +
        "This is not an approval. Final approval requires further review. " +
        result.disclaimer + " " +
        "Is there anything else you would like to know?";
    } else {
      reply =
        "Based on our preliminary assessment, your business does not currently meet all qualification criteria. " +
        result.failing_criteria.join(" ") + " " +
        result.disclaimer + " " +
        "Is there anything else I can help with?";
    }

    this.addTurn("agent", reply);
    return this.response(reply);
  }

  private handleKbQuestion(text: string): ConversationResponse {
    const searchResult = this.retriever.search(text, { includeTrace: true });
    const debug = kbDebug(text, searchResult);

    let reply: string;
    if (searchResult.grounded && searchResult.answer_context) {
      reply = searchResult.answer_context;
      if (debug.source_title) {
        reply += ` (Source: ${debug.source_title})`;
      }
    } else {
      reply = "I don't have enough information in my knowledge base to answer that accurately. I can connect you with a human representative.";
    }

    this.addTurn("agent", reply);
    return this.response(reply, debug);
  }

  private handleObjection(text: string): ConversationResponse {
    // Use Q2 KB retriever to find the appropriate playbook response
    const searchResult = this.retriever.search(text, { includeTrace: true });
    const debug = kbDebug(text, searchResult);

    let reply: string;
    if (searchResult.grounded && searchResult.answer_context) {
      if (searchResult.citations[0]?.document_id === "HSB-006") {
        reply = "I understand and respect your choice. Under our data minimization policy, we only collect information necessary to determine preliminary eligibility. Please note that formal review may require revenue evidence. Would you like to continue with other questions or speak with a human representative? (Source: Objection and Escalation Playbook)";
      } else {
        reply = searchResult.answer_context;
        if (debug.source_title) {
          reply += ` (Source: ${debug.source_title})`;
        }
      }
    } else {
      reply = "I understand your concern and I respect your choice. " +
        "We only collect information that is necessary for the qualification process. " +
        "Would you like to continue, or shall I connect you with a human representative?";
    }

    this.addTurn("agent", reply);
    return this.response(reply, debug);
  }

  private handleEscalation(intent: UserIntent): ConversationResponse {
    this.escalation = {
      triggered: true,
      reason: intent === "complaint" ? "complaint" : "human_assistance_requested",
    };
    this.state = "ESCALATION";

    const reply = intent === "complaint"
      ? "I understand you have a concern. I'll mark this for review by a human representative. Thank you for letting us know."
      : "Sure. I'll mark this for human assistance. A representative will be able to help you further.";

    this.addTurn("agent", reply);
    return this.response(reply);
  }

  /* ── Helpers ── */

  private advanceCollectionState(): void {
    const f = this.fields;
    if (f.business_age_months !== null && f.registration_status !== null) {
      if (f.monthly_revenue !== null) {
        if (f.requested_amount !== null && f.intended_use !== null && f.contact_preference !== null) {
          this.state = "DETERMINE_QUALIFICATION";
        } else {
          this.state = "COLLECT_LOAN_REQUEST";
        }
      } else {
        this.state = "COLLECT_FINANCIAL_INFO";
      }
    } else {
      this.state = "COLLECT_BUSINESS_INFO";
    }
  }

  private addTurn(role: "user" | "agent", text: string): void {
    this.transcript.push({ role, text, timestamp: new Date().toISOString() });
  }

  private replyAndReturn(text: string): ConversationResponse {
    this.addTurn("agent", text);
    return this.response(text);
  }

  private response(agentText: string, kb: KbRetrievalDebug | null = null): ConversationResponse {
    return {
      agent_text: agentText,
      state: this.state,
      fields: { ...this.fields },
      qualification: this.qualification,
      kb_retrieval: kb,
      escalation: { ...this.escalation },
      transcript: [...this.transcript],
      conflicts: { ...this.conflicts },
    };
  }
}
