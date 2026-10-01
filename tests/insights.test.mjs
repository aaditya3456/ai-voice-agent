import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

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

const insights = await import("../dist/packages/insights/src/index.js");

test("Q4 Signal 1: detects buying/expansion signal from customer", () => {
  const detector = new insights.SignalDetector();
  const chunk = {
    chunk_id: "chk-1",
    speaker: "customer",
    text: "That sounds great! What are the next steps to apply, and can I borrow more if business grows?",
    timestamp: new Date().toISOString(),
    is_final: true,
  };

  const result = detector.detect(chunk);
  assert.equal(result.signal_type, "BUYING_SIGNAL");
  assert.ok(result.confidence >= 0.70);
  assert.equal(result.priority, "MEDIUM");
  assert.ok(result.message.includes("Buying"));
});

test("Q4 Signal 2: detects compliance risk when agent claims approval without disclaimer", () => {
  const detector = new insights.SignalDetector();
  const chunk = {
    chunk_id: "chk-2",
    speaker: "agent",
    text: "Great news! Your loan is guaranteed to be approved today.",
    timestamp: new Date().toISOString(),
    is_final: true,
  };

  const result = detector.detect(chunk);
  assert.equal(result.signal_type, "COMPLIANCE_RISK");
  assert.ok(result.confidence >= 0.70);
  assert.equal(result.priority, "CRITICAL");
  assert.ok(result.message.includes("Compliance alert"));
});

test("Q4 Signal 2 (safe): no compliance risk when mandatory disclaimer is present", () => {
  const detector = new insights.SignalDetector();
  const chunk = {
    chunk_id: "chk-2b",
    speaker: "agent",
    text: "Based on the information provided, you appear to meet criteria. This is not an approval. Final review is required.",
    timestamp: new Date().toISOString(),
    is_final: true,
  };

  const result = detector.detect(chunk);
  assert.notEqual(result.signal_type, "COMPLIANCE_RISK");
});

test("Q4 Signal 3: detects customer frustration and suppresses duplicates within cooldown", () => {
  const engine = new insights.LiveNudgeEngine({
    confidence_threshold: 0.70,
    cooldown_window_ms: 10000,
    enable_duplicate_suppression: true,
  });

  const chunk1 = {
    chunk_id: "chk-3a",
    speaker: "customer",
    text: "I already told you that twice! Why are you asking me again?",
    timestamp: new Date().toISOString(),
    is_final: true,
  };

  const res1 = engine.processChunk(chunk1);
  assert.ok(res1.nudge !== null);
  assert.equal(res1.nudge.signal_type, "FRUSTRATION");
  assert.equal(res1.state.suppressed_duplicates_count, 0);

  // Repeated frustration immediately in next turn within cooldown
  const chunk2 = {
    chunk_id: "chk-3b",
    speaker: "customer",
    text: "This is taking too long and is ridiculous. You are not listening to me!",
    timestamp: new Date().toISOString(),
    is_final: true,
  };

  const res2 = engine.processChunk(chunk2);
  // Duplicate suppressed by cooldown window
  assert.equal(res2.nudge, null);
  assert.equal(res2.state.suppressed_duplicates_count, 1);
});

test("Q4 Signal 4: noisy/ambiguous transcript produces NO_NUDGE", () => {
  const detector = new insights.SignalDetector();
  const engine = new insights.LiveNudgeEngine();

  const noisyChunks = ["uh huh", "okay, um, let me see", "yeah", "just thinking"];

  for (const text of noisyChunks) {
    const chunk = {
      chunk_id: `chk-noise-${Date.now()}`,
      speaker: "customer",
      text,
      timestamp: new Date().toISOString(),
      is_final: true,
    };
    const det = detector.detect(chunk);
    assert.equal(det.signal_type, "NO_NUDGE");

    const res = engine.processChunk(chunk);
    assert.equal(res.nudge, null);
  }
});

test("Q4 Signal 5: detects callback and human representative request", () => {
  const detector = new insights.SignalDetector();
  const chunk = {
    chunk_id: "chk-5",
    speaker: "customer",
    text: "I have complex commercial questions. Can a human representative call me back tomorrow?",
    timestamp: new Date().toISOString(),
    is_final: true,
  };

  const result = detector.detect(chunk);
  assert.equal(result.signal_type, "CALLBACK_HUMAN_REQUEST");
  assert.ok(result.confidence >= 0.70);
  assert.equal(result.priority, "HIGH");
  assert.ok(result.message.includes("Callback"));
});

test("Q4 Replay Simulator: verifies all 5 preset scenarios", () => {
  const engine = new insights.LiveNudgeEngine({
    confidence_threshold: 0.70,
    cooldown_window_ms: 5000,
  });
  const simulator = new insights.TranscriptReplaySimulator(engine);

  for (const scenario of insights.PRESET_SCENARIOS) {
    const result = simulator.replayScenario(scenario);
    assert.ok(result.passed, `Scenario ${scenario.id} failed to trigger ${scenario.expected_signal}`);
  }
});

test("Q4 Latency Measurement: measures end-to-end processing and computes statistics", () => {
  const engine = new insights.LiveNudgeEngine();
  const chunk = {
    chunk_id: "chk-lat",
    speaker: "customer",
    text: "What are the next steps to apply for financing?",
    timestamp: new Date().toISOString(),
    is_final: true,
  };

  const { nudge, state } = engine.processChunk(chunk);
  assert.ok(nudge !== null);
  assert.ok(nudge.latency_ms.detection_ms >= 0);
  assert.ok(nudge.latency_ms.generation_ms >= 0);
  assert.ok(nudge.latency_ms.end_to_end_ms >= 0);
  assert.ok(state.latency_stats.p50_latency_ms >= 0);
  assert.ok(state.latency_stats.p95_latency_ms >= 0);
});
