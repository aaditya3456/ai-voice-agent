import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { LiveNudgeEngine, PRESET_SCENARIOS, TranscriptReplaySimulator } from "../packages/insights/src/index.js";

const root = resolve(process.cwd());
const evalDir = resolve(root, "data/evaluations/q4");
mkdirSync(evalDir, { recursive: true });

const engine = new LiveNudgeEngine({
  confidence_threshold: 0.70,
  cooldown_window_ms: 15000,
  default_expiry_ms: 30000,
  enable_duplicate_suppression: true,
});
const simulator = new TranscriptReplaySimulator(engine);

const records = [];
let totalNudgesGenerated = 0;
let truePositiveNudges = 0;

for (const sc of PRESET_SCENARIOS) {
  const result = simulator.replayScenario(sc);
  records.push(result);

  if (sc.expected_signal !== "NO_NUDGE") {
    totalNudgesGenerated += result.nudges_emitted;
    if (result.detected_signals.includes(sc.expected_signal)) {
      truePositiveNudges += 1;
    }
  }
}

const finalState = engine.getState("eval-summary");
const passedCount = records.filter((r) => r.passed).length;
const passRate = Number((passedCount / records.length).toFixed(4));
const nudgePrecision = Number((truePositiveNudges / Math.max(1, totalNudgesGenerated)).toFixed(4));

// Test duplicate suppression specifically on frustration scenario
const frustrationScenario = PRESET_SCENARIOS.find((s) => s.id === "scenario-frustration")!;
const frustrationRun = simulator.replayScenario(frustrationScenario);

const summary = {
  generated_at: new Date().toISOString(),
  phase: "Q4",
  description: "Real-time Live Insights / Nudge Engine Evaluation",
  total_scenarios: records.length,
  passed_scenarios: passedCount,
  pass_rate: passRate,
  nudge_precision: nudgePrecision,
  duplicate_suppression_result: {
    tested_scenario: "scenario-frustration",
    chunks_with_frustration: 2,
    nudges_emitted: frustrationRun.nudges_emitted,
    duplicates_suppressed: frustrationRun.suppressed_count,
    suppression_working: frustrationRun.suppressed_count >= 1 && frustrationRun.nudges_emitted === 1,
  },
  p50_latency_ms: finalState.latency_stats.p50_latency_ms,
  p95_latency_ms: finalState.latency_stats.p95_latency_ms,
  average_latency_ms: finalState.latency_stats.average_latency_ms,
  signals_evaluated: [
    "BUYING_SIGNAL",
    "COMPLIANCE_RISK",
    "FRUSTRATION",
    "NO_NUDGE",
    "CALLBACK_HUMAN_REQUEST"
  ]
};

writeFileSync(resolve(evalDir, "scenarios.json"), JSON.stringify(PRESET_SCENARIOS, null, 2) + "\n");
writeFileSync(resolve(evalDir, "results.json"), JSON.stringify({ summary, records }, null, 2) + "\n");

console.log("Q4 Live Insights Evaluation Complete:");
console.log(JSON.stringify(summary, null, 2));
