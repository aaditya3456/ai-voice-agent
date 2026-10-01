import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { detectPii, redactPii } from "./pii.js";
import { normalizeWhitespace } from "./normalization.js";
import type { SourceDocument, SourceMetadata } from "./types.js";

type ManifestEntry = Omit<SourceMetadata, "source_hash" | "ingestion_timestamp" | "status" | "metadata" | "source_path"> & { path: string; content_hash: string };
function sha256(content: string) { return createHash("sha256").update(content).digest("hex"); }
function frontMatter(content: string): Record<string, string> { const match = content.match(/^---\n([\s\S]*?)\n---/); if (!match) return {}; return Object.fromEntries(match[1].split("\n").map((line) => { const index = line.indexOf(":"); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; })); }
function markdownBody(content: string) { return content.replace(/^---\n[\s\S]*?\n---\n?/, ""); }
function csvToText(content: string): string { const lines = content.trim().split(/\r?\n/).filter((line) => !line.startsWith("#")); const [header, ...rows] = lines.map((line) => line.split(",").map((cell) => cell.trim())); return rows.map((row) => header.map((key, i) => `${key}: ${row[i] ?? ""}`).join("; ")).join("\n"); }
function jsonToText(content: string): string { const { metadata: _metadata, ...businessData } = JSON.parse(content) as Record<string, unknown>; return JSON.stringify(businessData, null, 2).replace(/_/g, " ").replace(/[{}[\]",]/g, " ").replace(/\s+/g, " ").trim(); }

export function ingestSourcePack(root: string, now = new Date().toISOString()): SourceDocument[] {
  const manifestPath = resolve(root, "data/raw/synthetic/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { documents: ManifestEntry[] };
  return manifest.documents.map((entry) => {
    const absolutePath = resolve(root, entry.path); const raw = readFileSync(absolutePath, "utf8");
    const sourceHash = sha256(raw); if (sourceHash !== entry.content_hash) throw new Error(`Source hash mismatch for ${entry.document_id}; run validate:source-pack:write first.`);
    const metadata = entry.path.endsWith(".md") ? frontMatter(raw) : entry.path.endsWith(".json") ? (JSON.parse(raw) as { metadata: Record<string, string> }).metadata : JSON.parse(raw.split(/\r?\n/, 1)[0].replace("# provenance: ", ""));
    const extracted = entry.path.endsWith(".md") ? markdownBody(raw) : entry.path.endsWith(".csv") ? csvToText(raw) : jsonToText(raw);
    const pii = detectPii(extracted);
    return { document_id: entry.document_id, title: entry.title, source_path: entry.path, source_type: entry.source_type, version: entry.version, effective_date: entry.effective_date, language: entry.language, source_hash: sourceHash, ingestion_timestamp: now, synthetic: true, pii_present: entry.pii_present || pii.length > 0, duplicate_of: entry.duplicate_of, canonical_document_id: entry.canonical_document_id, status: entry.duplicate_of ? "duplicate" : "indexed", metadata: { ...metadata, manifest_pii_present: entry.pii_present, detected_pii_types: pii.map((item) => item.type) }, normalized_content: normalizeWhitespace(extracted), searchable_text: redactPii(normalizeWhitespace(extracted)), pii_findings: pii };
  });
}
