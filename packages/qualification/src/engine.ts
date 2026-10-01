import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BusinessRules, QualificationFields, QualificationResult } from "./types.js";

/**
 * Load business rules from the synthetic source pack.
 * This is the single source of truth for deterministic qualification criteria.
 */
export function loadBusinessRules(root: string): BusinessRules {
  const rulesPath = resolve(root, "data/raw/synthetic/business-rules.json");
  return JSON.parse(readFileSync(rulesPath, "utf8")) as BusinessRules;
}

/**
 * Deterministic qualification engine.
 *
 * The LLM must NOT decide eligibility — this function is the sole authority.
 * It evaluates collected fields against the business rules and returns a
 * deterministic outcome: needs_information, needs_clarification,
 * preliminary_eligible, or preliminary_not_eligible.
 */
export function evaluate(fields: QualificationFields, rules: BusinessRules): QualificationResult {
  const missing: string[] = [];

  // Check consent first — it is mandatory
  if (fields.consent === null || fields.consent === false) {
    return {
      outcome: "needs_information",
      missing_fields: ["consent"],
      failing_criteria: [],
      disclaimer: rules.mandatory_disclaimer,
    };
  }

  // Check each required field
  if (fields.business_age_months === null) missing.push("business_age_months");
  if (fields.registration_status === null) missing.push("registration_status");
  if (fields.monthly_revenue === null) missing.push("monthly_revenue");
  if (fields.requested_amount === null) missing.push("requested_amount");
  if (fields.intended_use === null) missing.push("intended_use");
  if (fields.contact_preference === null) missing.push("contact_preference");

  if (missing.length > 0) {
    return {
      outcome: "needs_information",
      missing_fields: missing,
      failing_criteria: [],
      disclaimer: rules.mandatory_disclaimer,
    };
  }

  // All fields are present — evaluate against deterministic criteria
  const failing: string[] = [];

  if (rules.rules.registered_business_required && fields.registration_status !== "registered") {
    failing.push("Business must be registered in the fictional Harbor Market.");
  }
  if (fields.business_age_months! < rules.rules.minimum_business_age_months) {
    failing.push(`Business must have been operating for at least ${rules.rules.minimum_business_age_months} months.`);
  }
  if (fields.monthly_revenue! < rules.rules.minimum_monthly_revenue_hsc) {
    failing.push(`Minimum stated average monthly revenue is ${rules.rules.minimum_monthly_revenue_hsc.toLocaleString("en-US")} HSC.`);
  }
  if (fields.requested_amount! < rules.rules.minimum_requested_amount_hsc) {
    failing.push(`Minimum requested amount is ${rules.rules.minimum_requested_amount_hsc.toLocaleString("en-US")} HSC.`);
  }
  if (fields.requested_amount! > rules.rules.maximum_requested_amount_hsc) {
    failing.push(`Maximum requested amount is ${rules.rules.maximum_requested_amount_hsc.toLocaleString("en-US")} HSC.`);
  }

  if (failing.length > 0) {
    return {
      outcome: "preliminary_not_eligible",
      missing_fields: [],
      failing_criteria: failing,
      disclaimer: rules.mandatory_disclaimer,
    };
  }

  return {
    outcome: "preliminary_eligible",
    missing_fields: [],
    failing_criteria: [],
    disclaimer: rules.mandatory_disclaimer,
  };
}
