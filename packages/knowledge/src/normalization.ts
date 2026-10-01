const synonymGroups: Record<string, string[]> = {
  "business loan": ["sme loan", "harborspring sme business loan", "working capital", "business funding"],
  "monthly revenue": ["monthly sales", "average revenue"],
  "documents": ["documentation", "paperwork", "requirements", "evidence"],
  "request": ["require", "required", "requirements"],
  "preliminary eligible": ["preliminary eligibility"],
  "pricing fee": ["loan fees", "charges", "pricing", "costs", "fees", "interest", "charge", "cost", "fee"]
};

export function normalizeWhitespace(value: string): string { return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(); }
export function normalizeQuery(query: string): string {
  let normalized = normalizeWhitespace(query).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
  for (const [canonical, aliases] of Object.entries(synonymGroups)) {
    if (aliases.some((alias) => normalized.includes(alias))) normalized += ` ${canonical}`;
  }
  return normalized;
}
export function tokenize(value: string): string[] {
  const stop = new Set(["a", "an", "the", "is", "are", "am", "do", "i", "can", "you", "what", "how", "my", "to", "for", "of", "and", "or", "in", "on", "if", "with", "that", "this", "it", "about", "should", "would", "worried", "expect", "tell", "me"]);
  const stem = (token: string) => token.endsWith("ing") && token.length > 5 ? token.slice(0, -3) : token.endsWith("ed") && token.length > 4 ? token.slice(0, -2) : token.endsWith("s") && token.length > 3 && !token.endsWith("ss") ? token.slice(0, -1) : token;
  return [...new Set(normalizeQuery(value).split(/\s+/).filter((token) => token.length > 1 && !stop.has(token)).map(stem))];
}
export function categoryFor(sourceType: string): import("./types.js").KnowledgeCategory {
  const map: Record<string, import("./types.js").KnowledgeCategory> = { notice: "notice", product_catalog: "product", product_catalog_variant: "product", policy: "policy", business_rules: "qualification", process: "process", pricing_policy: "pricing", faq: "faq", playbook: "objection", compliance_policy: "compliance", field_dictionary: "form", localization_script: "localization" };
  return map[sourceType] ?? "notice";
}
