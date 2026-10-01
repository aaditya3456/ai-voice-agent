export type MarketCode = "PH" | "ID";

export type LanguageCode =
  | "en"
  | "fil"
  | "taglish"
  | "id_formal"
  | "id_colloquial";

export interface TerminologyEntry {
  term: string;
  local_equivalent: string;
  meaning: string;
  usage_note: string;
  sample_phrase: string;
}

export interface LocalizationConfig {
  market_code: MarketCode;
  market_name: string;
  use_case: string;
  supported_languages: Array<{
    code: LanguageCode;
    label: string;
    bcp47: string;
  }>;
  code_switching_enabled: boolean;
  terminology: Record<string, TerminologyEntry>;
  greetings: Record<LanguageCode, string>;
  qualification_questions: Record<LanguageCode, string[]>;
  payment_explanations: Record<LanguageCode, string[]>;
  objections: Record<string, { query: string; response: string; register: LanguageCode }>;
  escalations: Record<LanguageCode, { trigger: string; response: string }>;
  fallbacks: Record<LanguageCode, string>;
  regional_accent_considerations: Array<{
    region: string;
    description: string;
    phonetic_variation: string;
    asr_mitigation: string;
  }>;
  asr_tts_profile: {
    asr_prototype_provider: string;
    supported_assumptions: string[];
    expected_asr_challenges: string[];
    likely_transcription_errors: Array<{ input: string; error: string; remedy: string }>;
    tts_approach: string;
    native_language_limitations: string[];
    regional_accent_limitations: string[];
    native_speaker_validated: boolean;
  };
}

export interface LocalizationTurn {
  role: "agent" | "customer";
  language: LanguageCode;
  text: string;
  detected_intent?: string;
  notes?: string;
}

export interface LocalizationScenario {
  id: string;
  market: MarketCode;
  language: LanguageCode;
  name: string;
  description: string;
  turns: Array<{
    speaker: "agent" | "customer";
    text: string;
    expected_intent?: string;
    expected_response_contains?: string;
  }>;
}

export interface LocalizationResponse {
  market: MarketCode;
  language: LanguageCode;
  reply_text: string;
  detected_intent: string;
  code_switched: boolean;
  terminology_matched: string[];
  fallback_used: boolean;
  escalation_triggered: boolean;
}
