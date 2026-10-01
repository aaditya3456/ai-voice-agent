import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rawRoot = resolve(root, "data/raw/synthetic");
const manifestPath = resolve(rawRoot, "manifest.json");
const writeHashes = process.argv.includes("--write-hashes");
const failures = [];

const fail = (message) => failures.push(message);
const sha256 = (content) => createHash("sha256").update(content).digest("hex");
const read = (path) => readFileSync(path, "utf8");

function parseMetadata(path, content) {
  if (path.endsWith(".json")) return JSON.parse(content).metadata;
  if (path.endsWith(".csv")) {
    const firstLine = content.split(/\r?\n/, 1)[0];
    const match = firstLine.match(/^# provenance: (.+)$/);
    if (!match) throw new Error("CSV provenance header is missing");
    return JSON.parse(match[1]);
  }
  const block = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) throw new Error("Markdown front matter is missing");
  return Object.fromEntries(block[1].split(/\r?\n/).map((line) => {
    const separator = line.indexOf(":");
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
}

function validateCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const header = lines[1]?.split(",") ?? [];
  const expected = ["field_name", "display_name", "type", "required", "validation", "pii_classification", "description"];
  if (expected.some((column, index) => header[index] !== column)) fail("Field dictionary has an invalid header.");
  if (lines.length < 11) fail("Field dictionary must include at least nine fields.");
}

function validateNoRealPii(path, content) {
  const directEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /\+?\d[\d\s()-]{7,}\d/;
  const withoutIsoDates = content.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "");
  if (directEmail.test(content)) fail(`${relative(root, path)} appears to contain an email address.`);
  if (phone.test(withoutIsoDates)) fail(`${relative(root, path)} appears to contain a phone number.`);
}

let manifest;
try {
  manifest = JSON.parse(read(manifestPath));
} catch (error) {
  fail(`Manifest is invalid JSON: ${error.message}`);
}

if (manifest) {
  const ids = new Set();
  for (const document of manifest.documents ?? []) {
    const required = ["document_id", "title", "path", "source_type", "version", "effective_date", "language", "synthetic", "pii_present", "canonical_document_id", "content_hash"];
    for (const field of required) if (!(field in document)) fail(`${document.document_id ?? "unknown"} is missing ${field}.`);
    if (ids.has(document.document_id)) fail(`Duplicate document ID: ${document.document_id}.`);
    ids.add(document.document_id);
    if (document.synthetic !== true) fail(`${document.document_id} is not marked synthetic.`);
    const path = resolve(root, document.path);
    if (!path.startsWith(rawRoot) || !existsSync(path)) {
      fail(`${document.document_id} references a missing or out-of-pack path: ${document.path}.`);
      continue;
    }
    const content = read(path);
    const actualHash = sha256(content);
    if (writeHashes) document.content_hash = actualHash;
    if (!writeHashes && document.content_hash !== actualHash) fail(`${document.document_id} content hash does not match manifest.`);
    try {
      const metadata = parseMetadata(path, content);
      for (const key of ["document_id", "title", "source_type", "version", "effective_date", "language", "synthetic", "pii_present"]) {
        if (String(metadata[key]) !== String(document[key])) fail(`${document.document_id} provenance mismatch for ${key}.`);
      }
    } catch (error) {
      fail(`${document.document_id} metadata error: ${error.message}`);
    }
    if (path.endsWith(".csv")) validateCsv(content);
    validateNoRealPii(path, content);
    if (document.duplicate_of && !manifest.documents.some((candidate) => candidate.document_id === document.duplicate_of)) fail(`${document.document_id} points to an unknown duplicate source.`);
  }
  if (writeHashes && failures.length === 0) writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

const samplePath = resolve(root, "data/samples/synthetic/test-customers.json");
try {
  const samples = JSON.parse(read(samplePath));
  if (samples.metadata?.synthetic !== true || samples.customers?.length !== 7) fail("Synthetic customer scenarios are incomplete.");
  validateNoRealPii(samplePath, read(samplePath));
} catch (error) {
  fail(`Synthetic customer validation failed: ${error.message}`);
}

if (failures.length) {
  console.error("Source-pack validation failed:");
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(`Source-pack validation passed for ${manifest.documents.length} documents${writeHashes ? "; hashes updated" : ""}.`);
}
