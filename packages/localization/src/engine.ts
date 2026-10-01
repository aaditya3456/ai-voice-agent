import { PHILIPPINES_CONFIG } from "./philippines.js";
import { INDONESIA_CONFIG } from "./indonesia.js";
import type {
  MarketCode,
  LanguageCode,
  LocalizationConfig,
  LocalizationResponse,
} from "./types.js";

export class LocalizationEngine {
  private configs: Record<MarketCode, LocalizationConfig>;

  constructor() {
    this.configs = {
      PH: PHILIPPINES_CONFIG,
      ID: INDONESIA_CONFIG,
    };
  }

  public getConfig(market: MarketCode): LocalizationConfig {
    const config = this.configs[market];
    if (!config) {
      throw new Error(`Unsupported market code: ${market}`);
    }
    return config;
  }

  public getAllConfigs(): Record<MarketCode, LocalizationConfig> {
    return this.configs;
  }

  public getGreeting(market: MarketCode, language: LanguageCode): string {
    const config = this.getConfig(market);
    return config.greetings[language] || config.greetings.en;
  }

  public detectCodeSwitching(text: string, market: MarketCode): boolean {
    const lower = text.toLowerCase();

    if (market === "PH") {
      const tagalogMarkers = [
        "po", "opo", "ba", "mga", "ito", "ang", "ng", "sa", "na",
        "kung", "paano", "magkano", "gusto", "wala", "meron", "kami",
        "tayo", "kayo", "namin", "ninyo", "puwede", "pwede", "salamat",
      ];
      const englishMarkers = [
        "insurance", "premium", "coverage", "policy", "plan", "loan",
        "explain", "apply", "detail", "details", "check", "inquire",
        "benefit", "rider", "lapse", "advisor", "quote",
      ];

      const hasTagalog = tagalogMarkers.some((m) => new RegExp(`\\b${m}\\b`, "i").test(lower));
      const hasEnglish = englishMarkers.some((m) => new RegExp(`\\b${m}\\b`, "i").test(lower));
      const hasHybridAffix = /\b(mag|nag|i|ipag)-[a-z]+/i.test(lower);

      return (hasTagalog && hasEnglish) || hasHybridAffix;
    }

    if (market === "ID") {
      const indoMarkers = [
        "ini", "itu", "yang", "dan", "di", "ke", "dari", "untuk",
        "apakah", "bisa", "mau", "ada", "saya", "kami", "anda",
        "bapak", "ibu", "cuma", "aja", "nggak", "gak", "udah", "kalo",
        "sebentar", "soal", "saja",
      ];
      const financeLoanwords = [
        "dp", "tenor", "installment", "approval", "payment", "rate",
        "credit", "multifinance", "offer", "apply", "simulation",
      ];

      const hasIndo = indoMarkers.some((m) => new RegExp(`\\b${m}\\b`, "i").test(lower));
      const hasLoanword = financeLoanwords.some((m) => new RegExp(`\\b${m}\\b`, "i").test(lower));

      return hasIndo && hasLoanword;
    }

    return false;
  }

  public detectTerminology(text: string, market: MarketCode): string[] {
    const config = this.getConfig(market);
    const lower = text.toLowerCase();
    const matched: string[] = [];

    for (const [key, entry] of Object.entries(config.terminology)) {
      const mainTerm = entry.term.toLowerCase();
      // Test terms and partial splits (e.g. "cicilan / angsuran")
      const candidates = mainTerm.split(/[/(),]/).map((s) => s.trim()).filter(Boolean);
      candidates.push(key.toLowerCase());

      const isFound = candidates.some((candidate) => {
        if (candidate.length <= 2) {
          return new RegExp(`\\b${candidate}\\b`, "i").test(lower);
        }
        return lower.includes(candidate);
      });

      if (isFound) {
        matched.push(entry.term);
      }
    }

    return matched;
  }

  public processTurn(params: {
    market: MarketCode;
    language: LanguageCode;
    customer_input: string;
  }): LocalizationResponse {
    const { market, language, customer_input } = params;
    const config = this.getConfig(market);
    const lower = customer_input.toLowerCase().trim();

    const codeSwitched = this.detectCodeSwitching(customer_input, market);
    const terminologyMatched = this.detectTerminology(customer_input, market);

    // 1. Human Escalation Detection
    const escalationTriggers = {
      PH: [
        "tao", "human", "agent", "representative", "totoong tao", "magsalita sa tao",
        "kausapin ang tao", "customer service", "human advisor", "real person",
      ],
      ID: [
        "orang", "manusia", "petugas", "customer service", "cs", "bicara dengan orang",
        "oper ke manusia", "agen manusia", "petugas resmi", "human", "real agent",
      ],
    };

    const triggers = escalationTriggers[market] || [];
    const isEscalation = triggers.some((t) => new RegExp(`\\b${t}\\b`, "i").test(lower));

    if (isEscalation) {
      let reply = "";
      if (market === "PH") {
        if (language === "taglish") {
          reply = config.escalations.taglish.response;
        } else if (language === "fil") {
          reply = config.escalations.fil.response;
        } else {
          reply = config.escalations.en.response;
        }
      } else {
        if (language === "id_colloquial") {
          reply = config.escalations.id_colloquial.response;
        } else if (language === "id_formal") {
          reply = config.escalations.id_formal.response;
        } else {
          reply = config.escalations.en.response;
        }
      }

      return {
        market,
        language,
        reply_text: reply,
        detected_intent: "human_escalation",
        code_switched: codeSwitched,
        terminology_matched: terminologyMatched,
        fallback_used: false,
        escalation_triggered: true,
      };
    }

    // 2. Objection Handling
    if (market === "PH") {
      if (lower.includes("mahal") || lower.includes("expensive") || lower.includes("too high") || lower.includes("mabigat ang premium")) {
        return {
          market,
          language,
          reply_text: config.objections.expensive_premium.response,
          detected_intent: "objection_expensive_premium",
          code_switched: codeSwitched,
          terminology_matched: terminologyMatched,
          fallback_used: false,
          escalation_triggered: false,
        };
      }
      if (lower.includes("ayoko") || lower.includes("privacy") || lower.includes("share") || lower.includes("personal")) {
        return {
          market,
          language,
          reply_text: config.objections.privacy_concern.response,
          detected_intent: "objection_privacy",
          code_switched: codeSwitched,
          terminology_matched: terminologyMatched,
          fallback_used: false,
          escalation_triggered: false,
        };
      }
      if (lower.includes("may insurance na") || lower.includes("hindi kailangan") || lower.includes("already have")) {
        return {
          market,
          language,
          reply_text: config.objections.no_need.response,
          detected_intent: "objection_existing_coverage",
          code_switched: codeSwitched,
          terminology_matched: terminologyMatched,
          fallback_used: false,
          escalation_triggered: false,
        };
      }
    }

    if (market === "ID") {
      if (lower.includes("berat") || lower.includes("kemahalan") || lower.includes("tidak sanggup") || lower.includes("cicilannya berat")) {
        const resp = language === "id_colloquial"
          ? config.objections.cicilan_berat_colloquial.response
          : config.objections.cicilan_berat.response;
        return {
          market,
          language,
          reply_text: resp,
          detected_intent: "objection_high_installment",
          code_switched: codeSwitched,
          terminology_matched: terminologyMatched,
          fallback_used: false,
          escalation_triggered: false,
        };
      }
      if (lower.includes("denda") || lower.includes("late fee") || lower.includes("keterlambatan")) {
        return {
          market,
          language,
          reply_text: config.objections.denda_query.response,
          detected_intent: "objection_denda_policy",
          code_switched: codeSwitched,
          terminology_matched: terminologyMatched,
          fallback_used: false,
          escalation_triggered: false,
        };
      }
      if (lower.includes("data") || lower.includes("bocor") || lower.includes("privasi") || lower.includes("ktp")) {
        return {
          market,
          language,
          reply_text: config.objections.privacy_concern.response,
          detected_intent: "objection_privacy",
          code_switched: codeSwitched,
          terminology_matched: terminologyMatched,
          fallback_used: false,
          escalation_triggered: false,
        };
      }
    }

    // 3. Payment / Installment / Premium Explanations
    const paymentKeywords = [
      "magkano", "payment", "bayad", "hulog", "premium", "presyo",
      "cicilan", "angsuran", "bayaran", "per bulan", "bulanan", "installment", "dp", "down payment",
    ];
    const isPaymentQuery = paymentKeywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower));

    if (isPaymentQuery) {
      const explanations = config.payment_explanations[language] || config.payment_explanations.en;
      const reply = explanations.length > 0 ? explanations[0] : config.fallbacks[language];
      return {
        market,
        language,
        reply_text: reply,
        detected_intent: "payment_explanation",
        code_switched: codeSwitched,
        terminology_matched: terminologyMatched,
        fallback_used: false,
        escalation_triggered: false,
      };
    }

    // 4. Discovery / Qualification Inquiry
    const discoveryKeywords = [
      "protection", "insurance", "coverage", "proteksyon", "saklaw", "family",
      "pembiayaan", "tenor", "kredit", "pinjaman", "simulasi", "bancassurance",
      "rider", "beneficiary", "approval",
    ];
    const isDiscovery = discoveryKeywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower));

    if (isDiscovery) {
      const questions = config.qualification_questions[language] || config.qualification_questions.en;
      const reply = questions.length > 0 ? questions[0] : config.fallbacks[language];
      return {
        market,
        language,
        reply_text: reply,
        detected_intent: "qualification_discovery",
        code_switched: codeSwitched,
        terminology_matched: terminologyMatched,
        fallback_used: false,
        escalation_triggered: false,
      };
    }

    // 5. Greeting / Politeness / Cooperative Customer Initiation
    const greetingKeywords = [
      "hello", "hi", "good morning", "good afternoon", "magandang",
      "halo", "selamat siang", "selamat pagi", "pagi", "siang", "sore",
      "yes", "oo", "opo", "pwede", "boleh", "ya", "bersedia", "ok", "okay",
    ];
    const isGreeting = greetingKeywords.some((k) => new RegExp(`\\b${k}\\b`, "i").test(lower));

    if (isGreeting) {
      const reply = config.greetings[language] || config.greetings.en;
      return {
        market,
        language,
        reply_text: reply,
        detected_intent: "greeting_acknowledgment",
        code_switched: codeSwitched,
        terminology_matched: terminologyMatched,
        fallback_used: false,
        escalation_triggered: false,
      };
    }

    // 6. Localized Fallback (Guaranteed to NOT switch unexpectedly to English!)
    const fallbackReply = config.fallbacks[language] || (market === "PH" ? config.fallbacks.fil : config.fallbacks.id_formal);
    return {
      market,
      language,
      reply_text: fallbackReply,
      detected_intent: "unsupported_fallback",
      code_switched: codeSwitched,
      terminology_matched: terminologyMatched,
      fallback_used: true,
      escalation_triggered: false,
    };
  }
}
