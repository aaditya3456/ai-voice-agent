export type InsightSignalType =
  | "COMPLIANCE_RISK"
  | "FRUSTRATION"
  | "BUYING_SIGNAL"
  | "CALLBACK_HUMAN_REQUEST"
  | "NO_NUDGE";

export type NudgePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type CallStatus = "NORMAL" | "NEEDS_ATTENTION" | "CRITICAL_INTERVENTION" | "OPPORTUNITY";

export interface LatencyBreakdown {
  chunk_received_at: number;
  detection_ms: number;
  generation_ms: number;
  delivery_ms: number;
  end_to_end_ms: number;
}

export interface Nudge {
  id: string;
  timestamp: string;
  signal_type: InsightSignalType;
  priority: NudgePriority;
  confidence: number;
  message: string;
  source_transcript: string;
  expiry: string;
  expiry_ms: number;
  latency_ms: LatencyBreakdown;
  topic_group: string;
}

export interface SignalDetectionResult {
  signal_type: InsightSignalType;
  confidence: number;
  priority: NudgePriority;
  message: string;
  topic_group: string;
  rationale: string;
}

export interface TranscriptChunk {
  chunk_id: string;
  speaker: "agent" | "customer" | "user";
  text: string;
  timestamp: string;
  is_final: boolean;
}

export interface NudgeEngineConfig {
  confidence_threshold: number;
  cooldown_window_ms: number;
  default_expiry_ms: number;
  enable_duplicate_suppression: boolean;
}

export interface LiveInsightsState {
  session_id: string;
  call_status: CallStatus;
  chunks: TranscriptChunk[];
  detected_signals: Array<{
    chunk_id: string;
    signal_type: InsightSignalType;
    confidence: number;
    timestamp: string;
  }>;
  active_nudges: Nudge[];
  suppressed_duplicates_count: number;
  latency_stats: {
    samples_count: number;
    last_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    average_latency_ms: number;
  };
}

export interface ReplayScenario {
  id: string;
  name: string;
  expected_signal: InsightSignalType;
  description: string;
  chunks: Array<{
    speaker: "agent" | "customer" | "user";
    text: string;
    delay_ms?: number;
  }>;
}
