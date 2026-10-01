import type { SearchResponse } from "../../knowledge/src/types.js";

/* ── Qualification fields collected from the user ── */

export interface QualificationFields {
  consent: boolean | null;
  business_age_months: number | null;
  registration_status: "registered" | "not_registered" | null;
  monthly_revenue: number | null;
  requested_amount: number | null;
  intended_use: string | null;
  contact_preference: string | null;
}

export function emptyFields(): QualificationFields {
  return { consent: null, business_age_months: null, registration_status: null, monthly_revenue: null, requested_amount: null, intended_use: null, contact_preference: null };
}

/* ── Deterministic qualification result ── */

export type QualificationOutcome =
  | "needs_information"
  | "needs_clarification"
  | "preliminary_eligible"
  | "preliminary_not_eligible"
  | "escalation_required";

export interface QualificationResult {
  outcome: QualificationOutcome;
  missing_fields: string[];
  failing_criteria: string[];
  disclaimer: string;
}

/* ── Business rules loaded from business-rules.json ── */

export interface BusinessRules {
  metadata: Record<string, unknown>;
  required_fields: string[];
  rules: {
    consent_required: boolean;
    supported_market: string;
    registered_business_required: boolean;
    minimum_business_age_months: number;
    minimum_monthly_revenue_hsc: number;
    minimum_requested_amount_hsc: number;
    maximum_requested_amount_hsc: number;
  };
  outcomes: string[];
  escalation_triggers: string[];
  mandatory_disclaimer: string;
}

/* ── Conversation state machine ── */

export type ConversationState =
  | "GREETING"
  | "CONSENT"
  | "COLLECT_BUSINESS_INFO"
  | "COLLECT_FINANCIAL_INFO"
  | "COLLECT_LOAN_REQUEST"
  | "DETERMINE_QUALIFICATION"
  | "ANSWER_KB_QUESTION"
  | "HANDLE_OBJECTION"
  | "ESCALATION"
  | "COMPLETE";

export type UserIntent =
  | "greeting"
  | "consent_given"
  | "consent_denied"
  | "provide_info"
  | "kb_question"
  | "objection"
  | "escalation_request"
  | "complaint"
  | "end_call";

/* ── Conversation turn and response ── */

export interface ConversationTurn {
  role: "user" | "agent";
  text: string;
  timestamp: string;
}

export interface KbRetrievalDebug {
  query: string;
  grounded: boolean;
  confidence: number;
  source_document_id: string | null;
  chunk_id: string | null;
  source_title: string | null;
  fallback: boolean;
  fallback_message: string | null;
}

export interface ConversationResponse {
  agent_text: string;
  state: ConversationState;
  fields: QualificationFields;
  qualification: QualificationResult | null;
  kb_retrieval: KbRetrievalDebug | null;
  escalation: { triggered: boolean; reason: string | null };
  transcript: ConversationTurn[];
  conflicts: Record<string, { old_value: unknown; new_value: unknown }>;
}

export type { SearchResponse };
