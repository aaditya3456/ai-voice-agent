import type { LocalizationConfig } from "./types.js";

export const PHILIPPINES_CONFIG: LocalizationConfig = {
  market_code: "PH",
  market_name: "Philippines",
  use_case: "Life Insurance / Bancassurance",
  supported_languages: [
    { code: "en", label: "Philippine English", bcp47: "en-PH" },
    { code: "fil", label: "Filipino / Tagalog", bcp47: "fil-PH" },
    { code: "taglish", label: "Natural Taglish (Code-Switching)", bcp47: "fil-PH" },
  ],
  code_switching_enabled: true,

  terminology: {
    premium: {
      term: "Premium",
      local_equivalent: "Halaga ng hulog / Premium",
      meaning: "The illustrative scheduled payment amount for the synthetic protection plan.",
      usage_note: "In natural Taglish conversations, 'premium' is commonly retained as a loanword rather than using archaic terms like 'bayarin'.",
      sample_phrase: "Ang premium ay illustrative na amount sa fictional example; hindi ito final quote.",
    },
    coverage: {
      term: "Coverage",
      local_equivalent: "Proteksyon / Saklaw ng benepisyo",
      meaning: "The fictional benefits described in a sample insurance plan.",
      usage_note: "Often phrased conversationally as 'proteksyon' or 'coverage' rather than technical insurance legalese.",
      sample_phrase: "Coverage refers to the fictional benefits described in a sample policy; a real policy would need reviewed terms.",
    },
    beneficiary: {
      term: "Beneficiary",
      local_equivalent: "Taong makakatanggap / Beneficiary",
      meaning: "The designated person chosen in the fictional example to receive benefits.",
      usage_note: "Plain language 'taong pipiliin' paired with 'beneficiary' is preferred over formal terms like 'tagapagmana'.",
      sample_phrase: "Ang beneficiary ay taong pipiliin sa fictional example na makakatanggap ng benefit if applicable.",
    },
    rider: {
      term: "Rider",
      local_equivalent: "Dagdag na proteksyon / Optional add-on",
      meaning: "An optional supplementary synthetic benefit that can be attached to the basic policy.",
      usage_note: "Retained as 'rider' or described simply as 'optional add-on'.",
      sample_phrase: "A rider is an optional fictional add-on; hindi ito guaranteed available.",
    },
    lapse: {
      term: "Lapse",
      local_equivalent: "Pagka-expire o pagtigil ng proteksyon",
      meaning: "When coverage ceases due to missed sample premium payments.",
      usage_note: "Described plainly rather than using intimidating jargon.",
      sample_phrase: "Kapag hindi natuloy ang sample payment, the fictional example may describe coverage as lapsed.",
    },
  },

  greetings: {
    en: "Hello. This is a synthetic prototype conversation about a fictional protection plan. Is now an okay time to talk?",
    fil: "Magandang araw po. Prototype na usapan ito tungkol sa fictional na protection plan. Okay lang po ba ang oras?",
    taglish: "Hi po, quick prototype check lang tungkol sa protection plan—okay ba magtanong ng ilang basic details?",
    id_formal: "",
    id_colloquial: "",
  },

  qualification_questions: {
    en: [
      "Are you interested in exploring general life protection options for your family?",
      "Would a referral to a licensed bank advisor be welcome to discuss personalized terms?",
      "Would you prefer to continue exploring here or speak directly with a human advisor?",
    ],
    fil: [
      "Interesado po ba kayong malaman ang mga opsyon para sa proteksyon ng inyong pamilya?",
      "Bukas po ba kayo sa referral sa isang licensed bank financial advisor?",
      "Gusto niyo po bang magpatuloy dito o mas mainam na kumausap ng human advisor?",
    ],
    taglish: [
      "Interested ka ba mag-explore ng basic family protection plan options?",
      "Okay lang ba sa'yo kung i-refer ka namin sa isang bank financial advisor for formal review?",
      "Gusto mo bang ituloy dito, o prefer mo magpa-connect sa isang human advisor?",
    ],
    id_formal: [],
    id_colloquial: [],
  },

  payment_explanations: {
    en: [
      "The sample premium is an illustrative estimate based on fictional parameters; final amounts require bank underwriting.",
      "Payments can be scheduled monthly, quarterly, or annually in synthetic examples.",
    ],
    fil: [
      "Ang halaga ng premium ay sample estimate lamang; ang totoong halaga ay pagpapasyahan sa pormal na underwriting ng bangko.",
      "Maaaring bayaran ang sample premium buwan-buwan o taun-taon sa fictional example.",
    ],
    taglish: [
      "Ang premium amount na 'to ay sample estimate lang for this prototype; hindi pa ito final quote.",
      "Puwede itong bayaran monthly or yearly depende sa napiling fictional schedule.",
    ],
    id_formal: [],
    id_colloquial: [],
  },

  objections: {
    expensive_premium: {
      query: "Mahal ang premium",
      response: "Naiintindihan ko po ang inyong concern. Ang halagang nabanggit ay sample illustration lamang at hindi pinal. Ang aming prototype ay hindi maaaring magbaba o mag-quote ng indibidwal na presyo. Nais niyo po bang kumonsulta sa isang licensed human advisor?",
      register: "taglish",
    },
    privacy_concern: {
      query: "Ayoko mag-share ng details",
      response: "Nirerespeto ko po ang inyong desisyon. Hindi po natin kailangang mag-collect ng personal o medical details sa prototype na ito. Nais niyo po bang itigil ang usapan o kumausap ng tao?",
      register: "taglish",
    },
    no_need: {
      query: "May insurance na ako, hindi ko na kailangan",
      response: "Salamat po sa pagbabahagi. Hindi po namin kayo hihikayating palitan ang inyong existing plan. Nandito lamang po kami kung may karagdagang impormasyon kayong kailangan.",
      register: "fil",
    },
  },

  escalations: {
    en: {
      trigger: "Can I speak to a human representative?",
      response: "Certainly. I'll connect you with a human financial advisor right away. Thank you.",
    },
    fil: {
      trigger: "Gusto ko ng tao",
      response: "Opo, iko-connect ko po kayo sa isang human advisor. Sandali lamang po.",
    },
    taglish: {
      trigger: "Gusto ko magsalita sa totoong tao",
      response: "Sure po! I-transfer ko po kayo sa aming human financial advisor para maasikaso kayo nang maayos.",
    },
    id_formal: { trigger: "", response: "" },
    id_colloquial: { trigger: "", response: "" },
  },

  fallbacks: {
    en: "I do not have enough verified synthetic information to answer that accurately. I can escalate you to a human financial advisor.",
    fil: "Wala po akong sapat na verified synthetic information para sagutin iyon, pero puwede po kitang i-escalate sa isang human advisor.",
    taglish: "Wala akong verified synthetic information para sagutin iyon, pero puwede kitang i-escalate sa human advisor.",
    id_formal: "",
    id_colloquial: "",
  },

  regional_accent_considerations: [
    {
      region: "Metro Manila / Urban Tagalog",
      description: "Standard Taglish code-switching with English morphological affixes (e.g. nag-apply, i-che-check, mag-decide).",
      phonetic_variation: "Clear vowel distinction, heavy code-mixing of English prepositions and nouns.",
      asr_mitigation: "Acoustic model must support dual-language vocabulary tokenization without penalizing intra-sentential language switches.",
    },
    {
      region: "Cebu / Central Visayas (Bisaya-accented Tagalog/Taglish)",
      description: "Speakers whose first language is Cebuano/Bisaya speaking Tagalog or Taglish.",
      phonetic_variation: "Common merger of high vowels [i] and [e], and back vowels [u] and [o]; hard glottal stops; stress shifts on multisyllabic English loanwords.",
      asr_mitigation: "Lexicon normalization must accommodate vowel alternation (e.g., 'tinor' for 'tenor', 'insyurans' for 'insurance') and prevent false OOV rejections.",
    },
  ],

  asr_tts_profile: {
    asr_prototype_provider: "Native Browser Web Speech API (`SpeechRecognition` with `fil-PH` / `en-PH` language tags) with local deterministic simulation fallback.",
    supported_assumptions: [
      "User speaks in an environment with moderate background noise.",
      "Code-switching occurs naturally mid-sentence (Taglish).",
      "No health, medical, or sensitive PII is collected in this prototype.",
    ],
    expected_asr_challenges: [
      "Intra-sentential code-switching between Tagalog and English causes acoustic language-identification thrashing in single-language ASR models.",
      "Honorific particles ('po', 'opo', 'ho') can be misclassified as filler noise or dropped.",
      "Prefix combinations ('mag-i-inquire', 'i-e-explain') split incorrectly into separate pseudo-words.",
    ],
    likely_transcription_errors: [
      { input: "i-escalate", error: "e escalate / iescalate", remedy: "Phonetic normalization dictionary mapping common hyphenated prefixes." },
      { input: "Magkano po", error: "magkano pa / magkano", remedy: "Particle retention filter prioritizing respectful honorifics." },
      { input: "bancassurance", error: "bank assurance / bangko surance", remedy: "Domain-specific financial acoustic boosting." },
    ],
    tts_approach: "Browser SpeechSynthesis API utilizing available `fil-PH` or `en-PH` system voices; fallback to standard English voice with phonetically accessible spelling.",
    native_language_limitations: [
      "Synthetic prototype data only; NO native-speaker linguistic validation was performed.",
      "Nuances in regional dialectal Tagalog (e.g. Batangas, Bulacan) are not represented.",
      "Grammatical morphology is pattern-modeled for common bancassurance flows, not a comprehensive natural grammar engine.",
    ],
    regional_accent_limitations: [
      "No regional audio acoustic models (e.g., Ilocano-accented or Bisaya-accented Tagalog) have been trained or validated.",
    ],
    native_speaker_validated: false,
  },
};
