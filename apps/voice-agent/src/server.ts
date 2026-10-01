import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import { FileKnowledgeRepository, HybridKnowledgeRetriever } from "../../../packages/knowledge/src/index.js";
import { loadBusinessRules } from "../../../packages/qualification/src/index.js";
import { ConversationSession } from "../../../packages/qualification/src/conversation.js";
import type { ConversationResponse } from "../../../packages/qualification/src/types.js";
import { LiveNudgeEngine, PRESET_SCENARIOS, TranscriptReplaySimulator } from "../../../packages/insights/src/index.js";
import { LocalizationEngine } from "../../../packages/localization/src/index.js";

const port = Number(process.env.PORT ?? 3001);
const root = resolve(process.cwd());
const publicDir = resolve(root, "apps/voice-agent/public");

/* ── Load Q2 knowledge base ── */
const chunksPath = resolve(root, "data/processed/knowledge/chunks.json");
if (!existsSync(chunksPath)) {
  console.error("Knowledge index not found. Run `npm run kb:ingest` first.");
  process.exit(1);
}
const repository = new FileKnowledgeRepository(
  resolve(root, "data/processed/knowledge/documents.json"),
  chunksPath,
);
const retriever = new HybridKnowledgeRetriever(repository.loadChunks());

/* ── Load business rules ── */
const rules = loadBusinessRules(root);

/* ── Q4 Live Insights Nudge Engine ── */
const nudgeEngine = new LiveNudgeEngine({
  confidence_threshold: 0.70,
  cooldown_window_ms: 15000,
  default_expiry_ms: 30000,
  enable_duplicate_suppression: true,
});
const replaySimulator = new TranscriptReplaySimulator(nudgeEngine);

/* ── Q3 Native-Language Voice Localization Engine ── */
const localizationEngine = new LocalizationEngine();

/* ── Session store (in-memory, prototype only) ── */
const sessions = new Map<string, ConversationSession>();

function getOrCreateSession(sessionId: string): ConversationSession {
  let session = sessions.get(sessionId);
  if (!session) {
    session = new ConversationSession(rules, retriever);
    sessions.set(sessionId, session);
  }
  return session;
}

/* ── MIME types for static file serving ── */
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

/* ── HTTP server ── */
const server = createServer(async (request, response) => {
  const url = request.url ?? "/";

  // ── CORS headers for local development ──
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") { response.writeHead(204); response.end(); return; }

  // ── Health check ──
  if (request.method === "GET" && url === "/health") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ status: "ok", phase: 1, synthetic: true }));
    return;
  }

  // ── Conversation API ──
  if (request.method === "POST" && url === "/api/conversation") {
    let body = "";
    for await (const chunk of request) body += String(chunk);
    try {
      const payload = JSON.parse(body) as { action: string; session_id: string; text?: string };
      const { action, session_id, text } = payload;

      if (!session_id) throw new Error("session_id is required.");

      let result: ConversationResponse;
      const session = getOrCreateSession(session_id);

      if (action === "start") {
        result = session.start();
        nudgeEngine.processChunk({
          chunk_id: `init-${Date.now()}`,
          speaker: "agent",
          text: result.agent_text,
          timestamp: new Date().toISOString(),
          is_final: true,
        });
      } else if (action === "message") {
        if (typeof text !== "string" || !text.trim()) throw new Error("Non-empty text is required.");
        nudgeEngine.processChunk({
          chunk_id: `user-${Date.now()}`,
          speaker: "customer",
          text: text.trim(),
          timestamp: new Date().toISOString(),
          is_final: true,
        });
        result = session.processMessage(text.trim());
        nudgeEngine.processChunk({
          chunk_id: `agent-${Date.now()}`,
          speaker: "agent",
          text: result.agent_text,
          timestamp: new Date().toISOString(),
          is_final: true,
        });
      } else if (action === "end") {
        result = session.processMessage("goodbye");
        sessions.delete(session_id);
      } else {
        throw new Error("action must be 'start', 'message', or 'end'.");
      }

      const insightsState = nudgeEngine.getState(session_id);
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ ...result, insights: insightsState }));
    } catch (error) {
      response.statusCode = 400;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" }));
    }
    return;
  }

  // ── Q4 Live Insights APIs ──
  if (request.method === "GET" && url === "/api/insights/state") {
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify(nudgeEngine.getState()));
    return;
  }

  if (request.method === "POST" && url === "/api/insights/reset") {
    nudgeEngine.reset();
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ status: "reset", state: nudgeEngine.getState() }));
    return;
  }

  if (request.method === "GET" && url === "/api/insights/scenarios") {
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify(PRESET_SCENARIOS));
    return;
  }

  if (request.method === "POST" && url === "/api/insights/chunk") {
    let body = "";
    for await (const chunk of request) body += String(chunk);
    try {
      const payload = JSON.parse(body) as {
        speaker?: "agent" | "customer" | "user";
        text: string;
        chunk_id?: string;
      };
      if (!payload.text) throw new Error("text is required.");
      const chunkRecord = {
        chunk_id: payload.chunk_id ?? `chk-${Date.now()}`,
        speaker: payload.speaker ?? "customer",
        text: payload.text,
        timestamp: new Date().toISOString(),
        is_final: true,
      };
      const result = nudgeEngine.processChunk(chunkRecord);
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify(result));
    } catch (err) {
      response.statusCode = 400;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: err instanceof Error ? err.message : "Invalid request" }));
    }
    return;
  }

  if (request.method === "POST" && url === "/api/insights/replay") {
    let body = "";
    for await (const chunk of request) body += String(chunk);
    try {
      const payload = JSON.parse(body) as { scenario_id: string };
      const scenario = PRESET_SCENARIOS.find((s) => s.id === payload.scenario_id);
      if (!scenario) throw new Error(`Scenario not found: ${payload.scenario_id}`);
      const summary = replaySimulator.replayScenario(scenario);
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ summary, state: nudgeEngine.getState(scenario.id) }));
    } catch (err) {
      response.statusCode = 400;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: err instanceof Error ? err.message : "Invalid request" }));
    }
    return;
  }

  // ── Q3 Localization APIs ──
  if (request.method === "GET" && url.startsWith("/api/localization/config")) {
    const parsedUrl = new URL(url, `http://localhost:${port}`);
    const market = (parsedUrl.searchParams.get("market") ?? "PH").toUpperCase() as "PH" | "ID";
    try {
      const config = localizationEngine.getConfig(market);
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify(config));
    } catch (err) {
      response.statusCode = 400;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: err instanceof Error ? err.message : "Invalid market" }));
    }
    return;
  }

  if (request.method === "POST" && url === "/api/localization/turn") {
    let body = "";
    for await (const chunk of request) body += String(chunk);
    try {
      const payload = JSON.parse(body) as {
        market: "PH" | "ID";
        language: "en" | "fil" | "taglish" | "id_formal" | "id_colloquial";
        text: string;
      };
      if (!payload.text) throw new Error("text is required");
      const turnResult = localizationEngine.processTurn({
        market: payload.market,
        language: payload.language,
        customer_input: payload.text,
      });
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify(turnResult));
    } catch (err) {
      response.statusCode = 400;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: err instanceof Error ? err.message : "Invalid request" }));
    }
    return;
  }

  // ── Static file serving ──
  if (request.method === "GET") {
    const filePath = url === "/" ? resolve(publicDir, "index.html") : resolve(publicDir, url.slice(1));
    if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }
    const ext = extname(filePath);
    response.setHeader("content-type", MIME[ext] ?? "application/octet-stream");
    response.end(readFileSync(filePath));
    return;
  }

  response.statusCode = 404;
  response.end("Not found");
});

server.listen(port, () => {
  console.log(`Voice agent started at http://localhost:${port}`);
  console.log(`Synthetic prototype — no real financial decisions are made.`);
});
