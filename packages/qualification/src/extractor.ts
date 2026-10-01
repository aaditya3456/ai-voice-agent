import type { QualificationFields, UserIntent } from "./types.js";

/**
 * Detect user intent from natural-language text.
 *
 * Priority order (highest first):
 *   1. Escalation / complaint (terminal safety triggers)
 *   2. End call
 *   3. Objection (privacy, guarantee, not interested)
 *   4. KB question (what / how / why / can I …)
 *   5. Consent given / denied
 *   6. Provide info (default)
 */
export function detectIntent(text: string): UserIntent {
  const lower = text.toLowerCase().trim();

  // ── Escalation / human request ──
  if (/\b(speak|talk)\s*(to|with)\s*(a\s*)?(person|human|agent|representative|someone)\b/.test(lower) ||
      /\bhuman\s*(assistance|help)\b/.test(lower) ||
      /\bconnect\s*me\b/.test(lower) ||
      /\blet\s*me\s*(speak|talk)\b/.test(lower)) {
    return "escalation_request";
  }

  // ── Complaint ──
  if (/\bcomplaint\b/.test(lower) ||
      /\bwrong\b.*\b(application|information)\b/.test(lower) ||
      /\b(application|info)\b.*\bwrong\b/.test(lower)) {
    return "complaint";
  }

  // ── End call ──
  if (/^(bye|goodbye|end\s*call|hang\s*up|stop|no\s*thanks?|done|that'?s?\s*all)\b/.test(lower)) {
    return "end_call";
  }

  // ── Objection ──
  if (/\b(don'?t|do\s*not|won'?t|will\s*not|refuse\s*to)\b.*\b(share|give|provide|disclose|send)\b/.test(lower) ||
      /\bnot\s+interested\b/.test(lower) ||
      /\b(worried|concerned|hesitant|uncomfortable)\b.*\b(fee|charge|cost|pricing|rate|interest)\b/.test(lower) ||
      /\b(fee|charge|cost|pricing|rate|interest)\b.*\b(worried|concerned|hesitant|high|too\s+much)\b/.test(lower)) {
    return "objection";
  }

  // ── KB question (starts with a question word or contains question patterns) ──
  if (/^(what|how|why|when|where|who|which|do\s+i|can\s+(i|you)|is\s+(it|there|the)|are\s+there)\b/.test(lower) ||
      /\bwhat\s+(charges?|fees?|costs?|rates?|pricing|documents?|do\s+i\s+need|is\s+the|are\s+the)\b/.test(lower) ||
      /\b(charges?|fees?|costs?|rates?|pricing)\b.*\b(expect|incur|pay|apply)\b/.test(lower) ||
      /\bapplication\s+process\b/.test(lower) ||
      /\bwhy\s+do\s+you\s+need\b/.test(lower) ||
      /\bhow\s+long\s+(does|will|do)\b/.test(lower) ||
      /\bguarantee\b.*\b(approv|loan|eligib)\b/.test(lower) ||
      /\b(approv|eligib)\b.*\bguarantee\b/.test(lower) ||
      /\?$/.test(lower)) {
    return "kb_question";
  }

  // ── Consent ──
  if (/\b(yes|yep|yeah|sure|ok|okay|agree|i\s+agree|i\s+consent|i\s+do|go\s+ahead|proceed|absolutely|certainly|of\s+course)\b/.test(lower) &&
      !/\b(no|not|don'?t|never)\b/.test(lower)) {
    return "consent_given";
  }
  if (/\b(no(?!\w)|nope|decline|refuse|disagree|i\s+don'?t)\b/.test(lower) &&
      !/\b(yes|agree|consent|sure)\b/.test(lower)) {
    return "consent_denied";
  }

  return "provide_info";
}

/**
 * Extract qualification-relevant fields from a natural-language utterance.
 *
 * Returns only the fields that were detected in the text, so the caller
 * can merge them into the session's accumulated fields.
 */
export function extractFields(text: string): Partial<QualificationFields> {
  const lower = text.toLowerCase();
  const extracted: Partial<QualificationFields> = {};

  // ── Business age ──
  const yearMatch = lower.match(/\b(\d+)\s*(?:\+\s*)?years?\b/);
  const monthMatch = lower.match(/\b(\d+)\s*months?\b/);
  if (yearMatch && /\b(operat|running|business|old|been|started|establish)\b/.test(lower)) {
    extracted.business_age_months = parseInt(yearMatch[1], 10) * 12;
  } else if (monthMatch && /\b(operat|running|business|old|been|started|establish)\b/.test(lower)) {
    extracted.business_age_months = parseInt(monthMatch[1], 10);
  } else if (yearMatch && !monthMatch) {
    // Fallback: standalone "X years" likely refers to business age in context
    extracted.business_age_months = parseInt(yearMatch[1], 10) * 12;
  }

  // ── Registration status ──
  if (/\b(not\s+registered|unregistered|not\s+a\s+registered)\b/.test(lower)) {
    extracted.registration_status = "not_registered";
  } else if (/\bregistered\b/.test(lower)) {
    extracted.registration_status = "registered";
  }

  // ── Monthly revenue ──
  const revenuePatterns = [
    /(?:revenue|earn|mak(?:e|es|ing)|income|sales|turnover).*?(\d[\d,]*)\s*(?:hsc)?/,
    /(\d[\d,]*)\s*(?:hsc)?\s*(?:a|per|each|every)\s*month/,
    /(?:monthly|month)\s*(?:revenue|income|sales|earnings?)?\s*(?:is|of|about|around|approximately)?\s*(\d[\d,]*)\s*(?:hsc)?/,
  ];
  for (const pattern of revenuePatterns) {
    const m = lower.match(pattern);
    if (m) {
      const value = parseInt(m[1].replace(/,/g, ""), 10);
      if (value > 0) { extracted.monthly_revenue = value; break; }
    }
  }

  // ── Requested amount ──
  const amountPatterns = [
    /(?:need|want|borrow|request|looking\s+for|loan\s+(?:of|for|amount)).*?(\d[\d,]*)\s*(?:hsc)?/,
    /(\d[\d,]*)\s*(?:hsc)?\s*(?:loan|to\s+(?:buy|purchase|borrow|fund|finance))/,
  ];
  for (const pattern of amountPatterns) {
    const m = lower.match(pattern);
    if (m) {
      const value = parseInt(m[1].replace(/,/g, ""), 10);
      if (value > 0 && !extracted.monthly_revenue) { extracted.requested_amount = value; break; }
      // Guard against matching revenue number as amount
      if (value > 0 && extracted.monthly_revenue && value !== extracted.monthly_revenue) {
        extracted.requested_amount = value;
        break;
      }
    }
  }

  // ── Intended use / loan purpose ──
  const purposes: Record<string, string> = {
    equipment: "equipment", inventory: "inventory", "working capital": "working capital",
    expansion: "expansion", renovation: "renovation", marketing: "marketing",
    payroll: "payroll", "raw materials": "raw materials", supplies: "supplies",
    machinery: "machinery", technology: "technology", vehicle: "vehicle",
  };
  for (const [keyword, purpose] of Object.entries(purposes)) {
    if (lower.includes(keyword)) { extracted.intended_use = purpose; break; }
  }
  // "buy X" / "purchase X" fallback
  if (!extracted.intended_use) {
    const buyMatch = lower.match(/(?:buy|purchase|acquire|fund|finance)\s+(?:some\s+)?(\w+)/);
    if (buyMatch && !["a", "an", "the", "my", "some", "new"].includes(buyMatch[1])) {
      extracted.intended_use = buyMatch[1];
    }
  }

  // ── Contact preference ──
  if (/\b(email|e-?mail)\b/.test(lower)) extracted.contact_preference = "email";
  else if (/\bphone\b/.test(lower) && !/\bphone\s*number\b/.test(lower)) extracted.contact_preference = "phone";
  else if (/\b(sms|text\s*message|text)\b/.test(lower)) extracted.contact_preference = "sms";

  return extracted;
}
