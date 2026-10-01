import { randomUUID } from "node:crypto";
import { SignalDetector } from "./detector.js";
import type {
  CallStatus,
  LiveInsightsState,
  Nudge,
  NudgeEngineConfig,
  TranscriptChunk,
} from "./types.js";

const DEFAULT_CONFIG: NudgeEngineConfig = {
  confidence_threshold: 0.70,
  cooldown_window_ms: 15000,
  default_expiry_ms: 30000,
  enable_duplicate_suppression: true,
};

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return Number((sorted[lower] + (sorted[upper] - sorted[lower]) * weight).toFixed(2));
}

export class LiveNudgeEngine {
  private readonly config: NudgeEngineConfig;
  private readonly detector: SignalDetector;
  private chunks: TranscriptChunk[] = [];
  private activeNudges: Nudge[] = [];
  private detectedSignals: LiveInsightsState["detected_signals"] = [];
  private lastFiredByTopic = new Map<string, number>();
  private suppressedDuplicatesCount = 0;
  private latencies: number[] = [];

  constructor(
    config: Partial<NudgeEngineConfig> = {},
    detector: SignalDetector = new SignalDetector()
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.detector = detector;
  }

  /**
   * Process an incoming transcript chunk incrementally in real time.
   * Returns a new Nudge if a signal triggers and passes threshold/cooldown checks,
   * or null if no nudge was generated/it was suppressed.
   */
  processChunk(
    chunk: TranscriptChunk,
    deliveryCallback?: (nudge: Nudge) => void
  ): { nudge: Nudge | null; state: LiveInsightsState } {
    const chunkReceivedAt = performance.now();
    this.chunks.push(chunk);

    // 1. Purge expired nudges
    this.purgeExpiredNudges();

    // 2. Run signal detection
    const detectStart = performance.now();
    const result = this.detector.detect(chunk, this.chunks);
    const detectEnd = performance.now();
    const detectionMs = Number((detectEnd - detectStart).toFixed(2));

    this.detectedSignals.push({
      chunk_id: chunk.chunk_id,
      signal_type: result.signal_type,
      confidence: result.confidence,
      timestamp: new Date().toISOString(),
    });

    let generatedNudge: Nudge | null = null;
    const now = Date.now();

    // 3. Evaluate Nudge emission conditions
    if (
      result.signal_type !== "NO_NUDGE" &&
      result.confidence >= this.config.confidence_threshold
    ) {
      const lastFired = this.lastFiredByTopic.get(result.topic_group) ?? 0;
      const timeSinceLastFired = now - lastFired;

      if (
        this.config.enable_duplicate_suppression &&
        lastFired > 0 &&
        timeSinceLastFired < this.config.cooldown_window_ms
      ) {
        // Suppress duplicate within cooldown window
        this.suppressedDuplicatesCount += 1;
      } else {
        // Emit new Nudge
        const genStart = performance.now();
        const expiryMs = now + this.config.default_expiry_ms;
        const genEnd = performance.now();
        const generationMs = Number((genEnd - genStart).toFixed(2));

        // Delivery measurement
        const deliveryStart = performance.now();
        const nudgeId = `nudge-${randomUUID().slice(0, 8)}`;

        generatedNudge = {
          id: nudgeId,
          timestamp: new Date().toISOString(),
          signal_type: result.signal_type,
          priority: result.priority,
          confidence: result.confidence,
          message: result.message,
          source_transcript: chunk.text,
          expiry: new Date(expiryMs).toISOString(),
          expiry_ms: expiryMs,
          topic_group: result.topic_group,
          latency_ms: {
            chunk_received_at: Number(chunkReceivedAt.toFixed(2)),
            detection_ms: detectionMs,
            generation_ms: generationMs,
            delivery_ms: 0,
            end_to_end_ms: 0,
          },
        };

        if (deliveryCallback) {
          deliveryCallback(generatedNudge);
        }
        const deliveryEnd = performance.now();
        const deliveryMs = Number((deliveryEnd - deliveryStart).toFixed(2));
        const endToEndMs = Number((performance.now() - chunkReceivedAt).toFixed(2));

        generatedNudge.latency_ms.delivery_ms = deliveryMs;
        generatedNudge.latency_ms.end_to_end_ms = endToEndMs;

        this.latencies.push(endToEndMs);
        this.lastFiredByTopic.set(result.topic_group, now);
        this.activeNudges.push(generatedNudge);
      }
    } else {
      // Latency measurement for non-nudge chunk
      const endToEndMs = Number((performance.now() - chunkReceivedAt).toFixed(2));
      this.latencies.push(endToEndMs);
    }

    return {
      nudge: generatedNudge,
      state: this.getState(chunk.chunk_id),
    };
  }

  purgeExpiredNudges(currentTime: number = Date.now()): void {
    this.activeNudges = this.activeNudges.filter((n) => n.expiry_ms > currentTime);
  }

  reset(sessionId?: string): void {
    this.chunks = [];
    this.activeNudges = [];
    this.detectedSignals = [];
    this.lastFiredByTopic.clear();
    this.suppressedDuplicatesCount = 0;
    this.latencies = [];
  }

  computeCallStatus(): CallStatus {
    this.purgeExpiredNudges();
    const hasCritical = this.activeNudges.some((n) => n.priority === "CRITICAL");
    if (hasCritical) return "CRITICAL_INTERVENTION";

    const hasFrustration = this.activeNudges.some((n) => n.signal_type === "FRUSTRATION");
    const hasCallback = this.activeNudges.some((n) => n.signal_type === "CALLBACK_HUMAN_REQUEST");
    if (hasFrustration || hasCallback) return "NEEDS_ATTENTION";

    const hasOpportunity = this.activeNudges.some((n) => n.signal_type === "BUYING_SIGNAL");
    if (hasOpportunity) return "OPPORTUNITY";

    return "NORMAL";
  }

  getState(sessionId: string = "live-session"): LiveInsightsState {
    this.purgeExpiredNudges();
    const samples = this.latencies;
    const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;

    return {
      session_id: sessionId,
      call_status: this.computeCallStatus(),
      chunks: [...this.chunks],
      detected_signals: [...this.detectedSignals],
      active_nudges: [...this.activeNudges],
      suppressed_duplicates_count: this.suppressedDuplicatesCount,
      latency_stats: {
        samples_count: samples.length,
        last_latency_ms: samples.length ? Number(samples[samples.length - 1].toFixed(2)) : 0,
        p50_latency_ms: percentile(samples, 0.5),
        p95_latency_ms: percentile(samples, 0.95),
        average_latency_ms: Number(avg.toFixed(2)),
      },
    };
  }

  getConfig(): NudgeEngineConfig {
    return { ...this.config };
  }
}
