import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chunkDocument, findDuplicates, ingestSourcePack, FileKnowledgeRepository } from "../packages/knowledge/src/index.js";

const root = resolve(process.cwd());
const output = resolve(root, "data/processed/knowledge");
const documents = ingestSourcePack(root);
const duplicateFindings = findDuplicates(documents);
const chunks = documents.filter((document) => document.status === "indexed").flatMap(chunkDocument);
new FileKnowledgeRepository(resolve(output, "documents.json"), resolve(output, "chunks.json")).save(documents, chunks);
mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, "deduplication-report.json"), `${JSON.stringify({ generated_at: new Date().toISOString(), canonical_selection: "Manifest-declared canonical documents take precedence; HSB-009 is retained for audit but excluded from indexing.", findings: duplicateFindings }, null, 2)}\n`);
writeFileSync(resolve(output, "index-metadata.json"), `${JSON.stringify({ adapter: "prototype/local-hashing-embedding-adapter", vector_dimensions: 192, indexed_document_count: documents.filter((document) => document.status === "indexed").length, duplicate_document_count: documents.filter((document) => document.status === "duplicate").length, chunk_count: chunks.length, generated_at: new Date().toISOString() }, null, 2)}\n`);
console.log(`Ingested ${documents.length} source records; indexed ${chunks.length} chunks from ${documents.filter((document) => document.status === "indexed").length} canonical documents; excluded ${documents.filter((document) => document.status === "duplicate").length} duplicate document.`);
