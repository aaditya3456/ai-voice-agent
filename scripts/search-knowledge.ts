import { resolve } from "node:path";
import { FileKnowledgeRepository, HybridKnowledgeRetriever } from "../packages/knowledge/src/index.js";

const query = process.argv.slice(2).join(" ").trim();
if (!query) { console.error("Usage: npm run kb:search -- \"What is the minimum monthly revenue?\""); process.exit(1); }
const root = resolve(process.cwd());
const repository = new FileKnowledgeRepository(resolve(root, "data/processed/knowledge/documents.json"), resolve(root, "data/processed/knowledge/chunks.json"));
try { console.log(JSON.stringify(new HybridKnowledgeRetriever(repository.loadChunks()).search(query, { includeTrace: true }), null, 2)); } catch { console.error("Knowledge index unavailable. Run npm run kb:ingest first."); process.exit(1); }
