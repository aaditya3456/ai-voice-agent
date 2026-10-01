import { createServer } from "node:http";
import { resolve } from "node:path";
import { FileKnowledgeRepository, HybridKnowledgeRetriever, redactPii } from "../../../packages/knowledge/src/index.js";

const port = Number(process.env.PORT ?? 3000); const root = resolve(process.cwd());
function loadRetriever() { const repository = new FileKnowledgeRepository(resolve(root, "data/processed/knowledge/documents.json"), resolve(root, "data/processed/knowledge/chunks.json")); return new HybridKnowledgeRetriever(repository.loadChunks()); }
const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  if (request.method === "GET" && request.url === "/health") { response.end(JSON.stringify({ status: "ok", phase: 2, synthetic: true })); return; }
  if (request.method === "POST" && request.url === "/api/knowledge/search") {
    let body = ""; for await (const chunk of request) body += String(chunk);
    try { const query = JSON.parse(body).query; if (typeof query !== "string" || !query.trim()) throw new Error("A non-empty query is required."); const result = loadRetriever().search(query, { includeTrace: true }); response.end(JSON.stringify(result)); } catch (error) { response.statusCode = 400; response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" })); }
    return;
  }
  response.statusCode = 404; response.end(JSON.stringify({ error: "Not found" }));
});
server.listen(port, () => console.log(JSON.stringify({ event: "api_started", port, synthetic: true, query_logging: redactPii("omitted") })));
