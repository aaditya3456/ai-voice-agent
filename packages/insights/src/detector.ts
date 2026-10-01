import type { InsightSignalType, NudgePriority, SignalDetectionResult, TranscriptChunk } from "./types.js";

/**
 * Signal Detector for Live Insights.
 * Analyzes incremental transcript chunks and conversation context
 * to detect actionable business and compliance events.
 */
export class SignalDetector {
  detect(chunk: TranscriptChunk, history: TranscriptChunk[] = []): SignalDetectionResult {
    const text = chunk.text.trim();
    const lower = text.toLowerCase();
    const speaker = chunk.speaker;

    // ── 1. COMPLIANCE_RISK ──
    // Detect statements suggesting approval/guarantee or a missed required disclosure
    const approvalPatterns = [
      /\b(guarantee|guaranteed)\b.*\b(approv|loan|fund)/i,
      /\b(approv|approved|approval)\b.*\b(guarantee|guaranteed|certain|promise)/i,
      /\b(you\s+(are|'re)\s+approved)\b/i,
      /\b(i\s+can\s+promise\s+(you\s+)?approval)\b/i,
      /\b(loan\s+is\s+approved)\b/i,
      /\b(we\s+will\s+definitely\s+approve)\b/i,
      /\b(approval\s+is\s+guaranteed)\b/i,
    ];

    const hasApprovalClaim = approvalPatterns.some((pattern) => pattern.test(lower));
    const hasRequiredDisclaimer =
      lower.includes("not an approval") ||
      lower.includes("not a guarantee") ||
      lower.includes("final review is required") ||
      lower.includes("subject to final review");

    // If an agent states loan approval without the mandatory non-approval disclaimer
    if (speaker === "agent" && hasApprovalClaim && !hasRequiredDisclaimer) {
      return {
        signal_type: "COMPLIANCE_RISK",
        confidence: 0.96,
        priority: "CRITICAL",
        message:
          "Compliance alert: Agent stated loan approval or guarantee without mandatory non-approval disclaimer. Immediate disclaimer required: 'A preliminary qualification result is not an approval. Final review is required.'",
        topic_group: "compliance_approval_guarantee",
        rationale: "Detected guarantee or approval language without required non-approval disclaimer.",
      };
    }

    // Customer asking for or assuming guaranteed approval
    if (speaker !== "agent" && hasApprovalClaim) {
      return {
        signal_type: "COMPLIANCE_RISK",
        confidence: 0.92,
        priority: "HIGH",
        message:
          "Compliance alert: Customer is assuming approval or asking for a loan guarantee. Clarify that HarborSpring does not guarantee approval and that formal review is required.",
        topic_group: "compliance_approval_guarantee",
        rationale: "Customer inquired about or assumed guaranteed loan approval.",
      };
    }

    // Agent mentions eligibility without mandatory disclaimer
    if (
      speaker === "agent" &&
      /\b(meet|meets|qualif(y|ied|ication))\b.*\b(criteria|loan)\b/i.test(lower) &&
      !hasRequiredDisclaimer
    ) {
      return {
        signal_type: "COMPLIANCE_RISK",
        confidence: 0.88,
        priority: "HIGH",
        message:
          "Compliance reminder: Preliminary qualification discussed without stating that final approval requires formal review.",
        topic_group: "compliance_mandatory_disclaimer",
        rationale: "Preliminary qualification criteria mentioned without the mandatory disclaimer.",
      };
    }

    // ── 2. CALLBACK_HUMAN_REQUEST ──
    // Detect requests for a human representative, specialist, or scheduled callback
    const callbackPatterns = [
      /\b(call\s*me\s*back|callback|give\s*me\s*a\s*call|have\s*(someone|an?\s*agent|an?\s*advisor|a\s*representative)\s*call\s*me)\b/i,
      /\b(speak|talk)\s*(to|with)\s*(a\s*)?(person|human|agent|representative|advisor|manager)\b/i,
      /\b(connect\s*me\s*(to|with)\s*(a\s*)?(person|human|representative|agent))\b/i,
      /\b(transfer\s*me|human\s*assistance|human\s*help)\b/i,
    ];

    if (speaker !== "agent" && callbackPatterns.some((p) => p.test(lower))) {
      return {
        signal_type: "CALLBACK_HUMAN_REQUEST",
        confidence: 0.95,
        priority: "HIGH",
        message:
          "Human Callback / Escalation requested: Customer asked to speak with a representative or receive a callback. Offer to capture contact details and preferred time.",
        topic_group: "human_callback_request",
        rationale: "Customer explicitly requested human intervention or a phone callback.",
      };
    }

    // ── 3. FRUSTRATION ──
    // Detect rising customer frustration, annoyance, repetition, or impatience
    const frustrationPatterns = [
      /\b(taking\s+too\s+long|waste\s+of\s+(my\s+)?time|ridiculous|so\s+annoying|frustrated|frustrating)\b/i,
      /\b(already\s+told\s+you|repeating\s+myself|tired\s+of\s+repeating|said\s+that\s+already)\b/i,
      /\b(why\s+(are\s+you\s+)?asking\s+(me\s+)?again|not\s+listening\s+to\s+me|listen\s+to\s+what\s+i\s+said)\b/i,
      /\b(this\s+is\s+unacceptable|terrible\s+service|awful\s+system|useless)\b/i,
      /\b(how\s+many\s+times|asked\s+(this|that)\s+twice|already\s+answered)\b/i,
    ];

    // Check if current text or recent customer turns contain frustration
    const isFrustratedNow = frustrationPatterns.some((p) => p.test(lower));
    const recentCustomerChunks = history.filter((c) => c.speaker !== "agent").slice(-3);
    const priorFrustrationCount = recentCustomerChunks.filter((c) =>
      frustrationPatterns.some((p) => p.test(c.text.toLowerCase()))
    ).length;

    if (speaker !== "agent" && (isFrustratedNow || priorFrustrationCount >= 1 && /\b(no|why|stop|again)\b/i.test(lower))) {
      const confidence = isFrustratedNow ? (priorFrustrationCount >= 1 ? 0.97 : 0.91) : 0.82;
      const priority = priorFrustrationCount >= 1 ? "HIGH" : "MEDIUM";
      return {
        signal_type: "FRUSTRATION",
        confidence,
        priority,
        message:
          "Customer Frustration detected: Customer expressed impatience or annoyance with repetition. Acknowledge frustration, summarize collected details, and expedite next step.",
        topic_group: "customer_frustration",
        rationale: "Detected keywords indicating customer impatience, repetition distress, or dissatisfaction.",
      };
    }

    // ── 4. BUYING_SIGNAL ──
    // Detect customer interest, expansion opportunity, or readiness to proceed
    const buyingPatterns = [
      /\b(what\s+are\s+the\s+next\s+steps|how\s+soon\s+can\s+i\s+get|how\s+fast\s+can\s+we)\b/i,
      /\b(ready\s+to\s+(apply|proceed|move\s+forward|sign|start))\b/i,
      /\b(can\s+i\s+borrow\s+more|larger\s+funding|increase\s+the\s+amount|higher\s+limit)\b/i,
      /\b(interested\s+in\s+(applying|taking\s+this|the\s+loan|moving\s+forward))\b/i,
      /\b(how\s+do\s+i\s+(sign\s+up|submit|finalize))\b/i,
      /\b(sounds\s+great|let'?s\s+do\s+it|let'?s\s+proceed|sign\s+me\s+up)\b/i,
      /\b(can\s+we\s+do\s+this\s+today|how\s+quickly\s+can\s+funds\s+be\s+disbursed)\b/i,
    ];

    if (speaker !== "agent" && buyingPatterns.some((p) => p.test(lower))) {
      return {
        signal_type: "BUYING_SIGNAL",
        confidence: 0.93,
        priority: "MEDIUM",
        message:
          "Buying / Expansion Signal: Customer is demonstrating strong interest or readiness to proceed. Provide immediate application steps or discuss additional funding eligibility.",
        topic_group: "opportunity_buying_signal",
        rationale: "Customer inquired about next steps, faster disbursement, larger funding, or expressed readiness to apply.",
      };
    }

    // ── 5. NO_NUDGE ──
    // Ambiguous, noisy, routine short answers, or low-information content
    return {
      signal_type: "NO_NUDGE",
      confidence: 0.15,
      priority: "NONE",
      message: "",
      topic_group: "none",
      rationale: "No risk, opportunity, or frustration detected in this transcript chunk.",
    };
  }
}
