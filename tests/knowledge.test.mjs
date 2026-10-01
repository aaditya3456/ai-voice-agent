import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
if (process.platform === "win32") {
  execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm run build"], {
    cwd: root,
    stdio: "inherit",
  });
} else {
  execFileSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
  });
}
const knowledge = await import("../dist/packages/knowledge/src/index.js");

test("ingests Markdown, CSV, and JSON with provenance", () => {
  const docs = knowledge.ingestSourcePack(root, "2026-09-30T00:00:00.000Z");
  assert.equal(docs.length, 13);
  assert.ok(docs.some((doc) => doc.source_path.endsWith(".md")));
  assert.ok(docs.some((doc) => doc.source_path.endsWith(".csv")));
  assert.ok(docs.some((doc) => doc.source_path.endsWith(".json")));
  assert.equal(docs[0].synthetic, true);
});
test("normalization preserves headings and table content", () => {
  const docs = knowledge.ingestSourcePack(root);
  const playbook = docs.find((doc) => doc.document_id === "HSB-006");
  assert.match(playbook.normalized_content, /# Synthetic conversation guardrails/);
  assert.match(playbook.normalized_content, /\| Situation \| Appropriate response/);
  assert.equal(knowledge.normalizeWhitespace("a \n\n\n b"), "a \n\n b");
});
test("PII is detected and redacted before debug use", () => {
  const value = "Name: Ada Example; ada@example.test; +1 555 010 9911";
  assert.ok(knowledge.detectPii(value).length >= 2);
  const redacted = knowledge.redactPii(value);
  assert.doesNotMatch(redacted, /ada@example\.test|555 010 9911/);
  assert.equal(knowledge.redactPii("effective date 2026-09-30"), "effective date 2026-09-30");
});
test("duplicate detection identifies exact and declared near duplicate", () => {
  const docs = knowledge.ingestSourcePack(root);
  const report = knowledge.findDuplicates(docs);
  assert.ok(report.some((finding) => finding.document_id === "HSB-009" && finding.canonical_document_id === "HSB-001"));
  const clone = { ...docs[0], document_id: "CLONE", duplicate_of: null, canonical_document_id: "CLONE" };
  assert.ok(knowledge.findDuplicates([docs[0], clone]).some((finding) => finding.document_id === "CLONE" && finding.method === "exact"));
});
test("section chunking keeps FAQ and policy rules intact", () => {
  const docs = knowledge.ingestSourcePack(root);
  const faq = knowledge.chunkDocument(docs.find((doc) => doc.document_id === "HSB-005"));
  assert.ok(faq.some((chunk) => /Who can be preliminarily qualified/.test(chunk.text) && /final review/.test(chunk.text)));
  const policy = knowledge.chunkDocument(docs.find((doc) => doc.document_id === "HSB-002"));
  assert.ok(policy.some((chunk) => /at least 12 months/.test(chunk.text) && /100,000 HSC/.test(chunk.text)));
});
test("hybrid retrieval returns citations and safely rejects unsupported approval guarantee", () => {
  const docs = knowledge.ingestSourcePack(root); const chunks = docs.filter((doc) => doc.status === "indexed").flatMap(knowledge.chunkDocument); const retriever = new knowledge.HybridKnowledgeRetriever(chunks);
  const supported = retriever.search("What monthly revenue do I need?", { includeTrace: true });
  assert.equal(supported.grounded, true); assert.ok(supported.citations.some((citation) => citation.document_id === "HSB-002"));
  const unsupported = retriever.search("Can you guarantee that my loan will be approved?");
  assert.equal(unsupported.fallback, true); assert.equal(unsupported.citations.length, 0);
});
