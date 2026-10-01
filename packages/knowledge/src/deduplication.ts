import { createHash } from "node:crypto";
import { tokenize } from "./normalization.js";
import type { SourceDocument } from "./types.js";

export interface DuplicateFinding { document_id: string; canonical_document_id: string; method: "manifest" | "exact" | "normalized" | "near"; similarity: number; }
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function jaccard(left: string, right: string): number { const a = new Set(tokenize(left)); const b = new Set(tokenize(right)); const union = new Set([...a, ...b]); return union.size ? [...a].filter((token) => b.has(token)).length / union.size : 0; }
export function findDuplicates(documents: SourceDocument[], nearThreshold = 0.52): DuplicateFinding[] {
  const findings: DuplicateFinding[] = []; const canonical = documents.filter((item) => !item.duplicate_of);
  for (const document of documents) {
    if (document.duplicate_of) { findings.push({ document_id: document.document_id, canonical_document_id: document.canonical_document_id, method: "manifest", similarity: jaccard(document.normalized_content, documents.find((item) => item.document_id === document.canonical_document_id)?.normalized_content ?? "") }); continue; }
    for (const prior of canonical.slice(0, canonical.indexOf(document))) {
      const exact = document.normalized_content === prior.normalized_content;
      const normalized = hash(document.normalized_content) === hash(prior.normalized_content);
      const similarity = jaccard(document.normalized_content, prior.normalized_content);
      if (exact || normalized || similarity >= nearThreshold) findings.push({ document_id: document.document_id, canonical_document_id: prior.document_id, method: exact ? "exact" : normalized ? "normalized" : "near", similarity });
    }
  }
  return findings;
}
