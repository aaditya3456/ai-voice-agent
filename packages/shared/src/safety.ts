export const SAFETY_POLICY = {
  syntheticMode: true,
  groundedAnsweringRequired: true,
  minimumRetrievalConfidence: 0.72,
  noApprovalLanguage: "A preliminary qualification result is not an approval. Final review is required.",
  unsupportedQuestionFallback: "I do not have enough verified synthetic prototype information to answer that.",
  piiLogging: "redact_or_omit",
  escalationTriggers: [
    "human_assistance_requested",
    "complaint",
    "suspected_fraud",
    "vulnerability",
    "unsupported_high_impact_question"
  ] as const
} as const;

export type EscalationTrigger = (typeof SAFETY_POLICY.escalationTriggers)[number];
