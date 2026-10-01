import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { KnowledgeChunk, SourceDocument } from "./types.js";
export class FileKnowledgeRepository {
  constructor(private readonly documentsPath: string, private readonly chunksPath: string) {}
  save(documents: SourceDocument[], chunks: KnowledgeChunk[]) { mkdirSync(dirname(this.documentsPath), { recursive: true }); writeFileSync(this.documentsPath, `${JSON.stringify(documents, null, 2)}\n`); writeFileSync(this.chunksPath, `${JSON.stringify(chunks, null, 2)}\n`); }
  loadChunks(): KnowledgeChunk[] { return JSON.parse(readFileSync(this.chunksPath, "utf8")) as KnowledgeChunk[]; }
}
