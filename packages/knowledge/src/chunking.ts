import { categoryFor, normalizeWhitespace } from "./normalization.js";
import type { KnowledgeChunk, SourceDocument } from "./types.js";

function countTokens(text: string) { return text.split(/\s+/).filter(Boolean).length; }
function chunksFromMarkdown(document: SourceDocument): Array<{ headings: string[]; text: string }> {
  const lines = document.searchable_text.split("\n"); const chunks: Array<{ headings: string[]; text: string }> = []; let headings: string[] = []; let buffer: string[] = [];
  const flush = () => { const text = normalizeWhitespace(buffer.join("\n")); if (text) chunks.push({ headings: [...headings], text }); buffer = []; };
  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flush(); headings = headings.slice(0, heading[1].length - 1); headings.push(heading[2].trim()); continue; }
    if (document.source_type === "faq" && /^\d+\.\s+\*\*/.test(line)) { flush(); buffer.push(line); continue; }
    buffer.push(line);
  }
  flush(); return chunks;
}
function chunkLongSection(section: { headings: string[]; text: string }, maxChars = 1300) {
  if (section.text.length <= maxChars || section.text.includes("|---")) return [section];
  const paragraphs = section.text.split(/\n\n+/); const output: Array<{ headings: string[]; text: string }> = []; let buffer = "";
  for (const paragraph of paragraphs) { if (buffer && buffer.length + paragraph.length > maxChars) { output.push({ headings: section.headings, text: buffer }); buffer = paragraph; } else buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph; }
  if (buffer) output.push({ headings: section.headings, text: buffer }); return output;
}
export function chunkDocument(document: SourceDocument): KnowledgeChunk[] {
  const sections = document.source_path.endsWith(".md") ? chunksFromMarkdown(document) : document.source_type === "field_dictionary" ? document.searchable_text.split("\n").map((text) => ({ headings: [document.title], text })) : [{ headings: [document.title], text: document.searchable_text }];
  return sections.flatMap((section) => chunkLongSection(section)).map((section, index) => ({ chunk_id: `${document.document_id}::${String(index + 1).padStart(3, "0")}`, document_id: document.document_id, source_path: document.source_path, source_hash: document.source_hash, title: document.title, heading_path: section.headings.length ? section.headings : [document.title], text: section.text, language: document.language, version: document.version, effective_date: document.effective_date, synthetic: true, pii_present: document.pii_present, chunk_index: index, character_count: section.text.length, token_count: countTokens(section.text), category: categoryFor(document.source_type), priority: ["policy", "business_rules", "compliance_policy", "playbook"].includes(document.source_type) ? "high" : "normal", metadata: { source_type: document.source_type, canonical_document_id: document.canonical_document_id, ingestion_timestamp: document.ingestion_timestamp } }));
}
