import type { PiiFinding } from "./types.js";

const patterns: Array<[PiiFinding["type"], RegExp]> = [
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["phone", /(?<!\d)(?:\+?\d[\d .()-]{7,}\d)(?!\d)/g],
  ["government_id", /\b(?:[A-Z]{2,4}-?\d{6,}|\d{3}-\d{2}-\d{4})\b/g],
  ["account_number", /\b(?:account|acct)\s*(?:number|no)?\s*[:#]?\s*\d{6,}\b/gi],
  ["address", /\b\d{1,5}\s+[A-Z][\w.-]+\s+(?:street|st|road|rd|avenue|ave|lane|ln)\b/gi],
  ["explicit_name", /\b(?:name)\s*:\s*[A-Z][a-z]+\s+[A-Z][a-z]+\b/g]
];
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
export function detectPii(text: string): PiiFinding[] { const findings: PiiFinding[] = []; for (const [type, pattern] of patterns) { for (const match of text.matchAll(pattern)) { if (type === "phone" && isIsoDate(match[0])) continue; findings.push({ type, start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }); } } return findings; }
export function redactPii(text: string): string { let result = text; for (const [type, pattern] of patterns) result = result.replace(pattern, (match) => type === "phone" && isIsoDate(match) ? match : `[REDACTED_${type.toUpperCase()}]`); return result; }
