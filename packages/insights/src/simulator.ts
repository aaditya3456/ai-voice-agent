import type { ReplayScenario, TranscriptChunk } from "./types.js";
import { LiveNudgeEngine } from "./engine.js";

export const PRESET_SCENARIOS: ReplayScenario[] = [
  {
    id: "scenario-buying-signal",
    name: "Scenario 1: Missed Cross-Sell / Buying Opportunity",
    expected_signal: "BUYING_SIGNAL",
    description: "Customer asks about immediate next steps and wants to know if they can borrow a larger amount.",
    chunks: [
      { speaker: "agent", text: "Welcome to HarborSpring Business Finance. How can I help you today?" },
      { speaker: "customer", text: "We need working capital for inventory ahead of the holiday season." },
      { speaker: "agent", text: "Our SME Business Loan supports registered businesses with monthly revenue above 100,000 HSC." },
      { speaker: "customer", text: "That sounds great! What are the next steps to apply, and can I borrow more if business grows?" },
    ],
  },
  {
    id: "scenario-compliance-risk",
    name: "Scenario 2: Agent Discusses Approval Without Required Disclaimer",
    expected_signal: "COMPLIANCE_RISK",
    description: "Agent promises loan approval without stating that preliminary qualification is not an approval.",
    chunks: [
      { speaker: "customer", text: "We've been operating for 3 years and our revenue is 150,000 HSC." },
      { speaker: "agent", text: "Great news! Your loan is guaranteed to be approved today." },
    ],
  },
  {
    id: "scenario-frustration",
    name: "Scenario 3: Customer Becomes Increasingly Frustrated",
    expected_signal: "FRUSTRATION",
    description: "Customer expresses irritation with repetitive questions and delays, exercising duplicate suppression.",
    chunks: [
      { speaker: "agent", text: "Could you tell me how long your business has been operating?" },
      { speaker: "customer", text: "I already told you that twice! Why are you asking me again?" },
      { speaker: "agent", text: "I apologize. Could you confirm your monthly revenue?" },
      { speaker: "customer", text: "This is taking too long and is ridiculous. You are not listening to me!" },
    ],
  },
  {
    id: "scenario-noisy-transcript",
    name: "Scenario 4: Noisy / Ambiguous Transcript",
    expected_signal: "NO_NUDGE",
    description: "Short conversational fillers and ambiguous utterances that should not trigger unnecessary nudges.",
    chunks: [
      { speaker: "customer", text: "uh huh" },
      { speaker: "customer", text: "okay, um, let me see" },
      { speaker: "customer", text: "yeah" },
    ],
  },
  {
    id: "scenario-callback-request",
    name: "Scenario 5: Human / Callback Request",
    expected_signal: "CALLBACK_HUMAN_REQUEST",
    description: "Customer asks for a phone callback from a human specialist.",
    chunks: [
      { speaker: "customer", text: "I have some complex commercial questions. Can a human representative call me back tomorrow?" },
    ],
  },
];

export class TranscriptReplaySimulator {
  constructor(private readonly engine: LiveNudgeEngine) {}

  /**
   * Run a scenario synchronously or step-by-step and return all emitted nudges and final state.
   */
  replayScenario(scenario: ReplayScenario): {
    scenario_id: string;
    expected_signal: string;
    chunks_processed: number;
    nudges_emitted: number;
    suppressed_count: number;
    detected_signals: string[];
    final_status: string;
    passed: boolean;
  } {
    this.engine.reset(scenario.id);
    let chunksProcessed = 0;
    let nudgesEmitted = 0;
    const detected: string[] = [];

    scenario.chunks.forEach((c, idx) => {
      chunksProcessed += 1;
      const chunk: TranscriptChunk = {
        chunk_id: `${scenario.id}-chk-${idx + 1}`,
        speaker: c.speaker,
        text: c.text,
        timestamp: new Date().toISOString(),
        is_final: true,
      };

      const { nudge, state } = this.engine.processChunk(chunk);
      if (nudge) {
        nudgesEmitted += 1;
      }
      const lastSig = state.detected_signals[state.detected_signals.length - 1];
      if (lastSig && lastSig.signal_type !== "NO_NUDGE") {
        detected.push(lastSig.signal_type);
      }
    });

    const finalState = this.engine.getState(scenario.id);
    const hasExpectedSignal =
      scenario.expected_signal === "NO_NUDGE"
        ? nudgesEmitted === 0
        : detected.includes(scenario.expected_signal);

    return {
      scenario_id: scenario.id,
      expected_signal: scenario.expected_signal,
      chunks_processed: chunksProcessed,
      nudges_emitted: nudgesEmitted,
      suppressed_count: finalState.suppressed_duplicates_count,
      detected_signals: detected,
      final_status: finalState.call_status,
      passed: hasExpectedSignal,
    };
  }
}
