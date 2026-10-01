import type { LocalizationConfig } from "./types.js";

export const INDONESIA_CONFIG: LocalizationConfig = {
  market_code: "ID",
  market_name: "Indonesia",
  use_case: "Consumer Finance / Multifinance",
  supported_languages: [
    { code: "id_formal", label: "Formal Bahasa Indonesia", bcp47: "id-ID" },
    { code: "id_colloquial", label: "Colloquial Bahasa Indonesia (Bahasa Gaul/Santai)", bcp47: "id-ID" },
    { code: "en", label: "Indonesian English / Mixed Finance Loanwords", bcp47: "en-ID" },
  ],
  code_switching_enabled: true,

  terminology: {
    cicilan: {
      term: "Cicilan / Angsuran",
      local_equivalent: "Angsuran bulanan / Monthly installment",
      meaning: "The fictional scheduled installment amount in an illustrative repayment schedule.",
      usage_note: "Both 'cicilan' and 'angsuran' are standard in consumer finance; 'cicilan' is common colloquially, while 'angsuran' appears in formal agreements.",
      sample_phrase: "Cicilan atau angsuran di sini adalah contoh simulasi fiktif; bukan penawaran pinjaman sebenarnya.",
    },
    tenor: {
      term: "Tenor",
      local_equivalent: "Jangka waktu pembiayaan / Repayment period",
      meaning: "The illustrative duration of the synthetic financing agreement in months.",
      usage_note: "Retained directly as an English loanword throughout Indonesian multifinance contracts and everyday banking conversation.",
      sample_phrase: "Pilihan tenor 6, 12, atau 24 bulan ini hanyalah ilustrasi sintetis.",
    },
    dp: {
      term: "DP (Down Payment)",
      local_equivalent: "Uang muka",
      meaning: "The illustrative down payment percentage or value in a sample product calculation.",
      usage_note: "Commonly abbreviated as 'DP' in spoken Indonesian rather than translated strictly as 'uang muka'.",
      sample_phrase: "Besaran DP adalah parameter contoh dan tidak mengikat persetujuan apa pun.",
    },
    denda: {
      term: "Denda",
      local_equivalent: "Biaya keterlambatan / Late charge",
      meaning: "A fictional example penalty fee that must never be quoted as a real obligation.",
      usage_note: "Described strictly as an illustrative example; prototype never demands payment or levies actual charges.",
      sample_phrase: "Denda keterlambatan yang disebutkan hanyalah contoh edukasi prototipe.",
    },
    jatuh_tempo: {
      term: "Jatuh Tempo",
      local_equivalent: "Batas waktu pembayaran / Due date",
      meaning: "A synthetic sample due-date milestone, never a live demand for payment.",
      usage_note: "Used in synthetic customer reminder flows without requesting bank credentials or commitments to pay.",
      sample_phrase: "Pengingat jatuh tempo ini bersifat simulasi prototipe, bukan tagihan resmi.",
    },
    pembiayaan: {
      term: "Pembiayaan",
      local_equivalent: "Pembiayaan konsumen / Consumer financing",
      meaning: "The general multifinance credit facility context.",
      usage_note: "Standard regulatory and industry term used by multifinance companies in Indonesia rather than generic 'pinjaman'.",
      sample_phrase: "Prototipe ini mengeksplorasi percakapan simulasi produk pembiayaan konsumen.",
    },
    approval: {
      term: "Approval",
      local_equivalent: "Persetujuan pembiayaan",
      meaning: "The synthetic decision status of an illustrative financing request.",
      usage_note: "Often spoken directly as 'approval' or 'di-approve' in conversational finance context.",
      sample_phrase: "Persetujuan atau approval hanya dapat diberikan oleh analis resmi perusahaan pembiayaan.",
    },
  },

  greetings: {
    en: "Good day. This is a synthetic prototype conversation regarding fictional consumer financing. Would you be open to continuing?",
    fil: "",
    taglish: "",
    id_formal: "Selamat siang. Ini adalah percakapan prototipe mengenai pembiayaan fiktif. Apakah Bapak/Ibu bersedia melanjutkan?",
    id_colloquial: "Halo, ini cuma demo prototipe ya. Boleh cek sebentar soal cicilan dan tenor?",
  },

  qualification_questions: {
    en: [
      "Are you interested in exploring synthetic consumer financing simulation options?",
      "Would you like an illustrative breakdown of sample tenor and monthly installment figures?",
      "Would you prefer to continue the prototype here or be connected to a human representative?",
    ],
    fil: [],
    taglish: [],
    id_formal: [
      "Apakah Bapak/Ibu berminat untuk melihat simulasi contoh pembiayaan konsumen kami?",
      "Berapa estimasi tenor yang ingin Bapak/Ibu eksplorasi dalam simulasi ini?",
      "Apakah Bapak/Ibu ingin melanjutkan percakapan di sini atau terhubung langsung dengan petugas kami?",
    ],
    id_colloquial: [
      "Tertarik buat cek simulasi cicilan atau mau lihat contoh tenor dulu?",
      "Mau coba simulasi tenor berapa bulan nih, misal 12 atau 24 bulan?",
      "Mau lanjut ngobrol di sini atau prefer disambungkan ke customer care langsung?",
    ],
  },

  payment_explanations: {
    en: [
      "For this sample, DP, tenor, and installments are entirely illustrative—not an actual credit offer.",
      "Monthly installments are calculated purely as synthetic demonstrations without real interest rates.",
    ],
    fil: [],
    taglish: [],
    id_formal: [
      "Untuk contoh ini, DP, tenor, dan angsuran semuanya illustrative—bukan penawaran pembiayaan yang sebenarnya.",
      "Perhitungan angsuran bulanan ini didasarkan pada parameter sintetis dan memerlukan verifikasi analis kredit.",
    ],
    id_colloquial: [
      "Untuk contoh ini, DP, tenor, dan angsuran semuanya cuma ilustrasi ya—bukan offer yang beneran.",
      "Angka cicilan per bulannya itu simulasi aja, jadi nggak mengikat komitmen apa-apa.",
    ],
  },

  objections: {
    cicilan_berat: {
      query: "Cicilannya berat",
      response: "Kami sangat memahami kekhawatiran Bapak/Ibu. Simulasi cicilan ini hanyalah angka contoh dan kami tidak menyarankan mengambil pembiayaan yang membebani anggaran Anda. Apakah Bapak/Ibu ingin mencoba simulasi tenor yang lebih panjang, atau ingin saya hubungkan ke petugas resmi?",
      register: "id_formal",
    },
    cicilan_berat_colloquial: {
      query: "Cicilannya kemahalan nih, berat banget",
      response: "Paham banget, Kak. Ini kan cuma contoh simulasi aja ya, jadi santai. Kita nggak nyaranin paksakan ambil cicilan kalau berat. Mau coba hitung tenor lain atau mau sudahi saja?",
      register: "id_colloquial",
    },
    denda_query: {
      query: "Dendanya berapa kalau telat bayar?",
      response: "Dalam prototipe sintetis ini, kami tidak menetapkan atau mengutip denda riil. Segala ketentuan denda resmi hanya tercantum pada perjanjian kontrak pembiayaan berlisensi. Apakah Anda ingin berbicara dengan petugas manusia?",
      register: "id_formal",
    },
    privacy_concern: {
      query: "Saya takut data pribadi saya disalahgunakan",
      response: "Tenang saja Bapak/Ibu, sistem prototipe ini beroperasi secara anonim dan sintetis. Kami tidak meminta KTP, rekening bank, atau informasi pribadi sensitif. Anda dapat mengakhiri percakapan kapan saja.",
      register: "id_formal",
    },
  },

  escalations: {
    en: {
      trigger: "I want to speak with a real human agent",
      response: "Understood. I will immediately redirect you to an official customer service officer.",
    },
    fil: { trigger: "", response: "" },
    taglish: { trigger: "", response: "" },
    id_formal: {
      trigger: "Saya mau bicara dengan orang",
      response: "Baik Bapak/Ibu, saya akan segera menghubungkan Anda ke petugas resmi kami. Mohon ditunggu sebentar.",
    },
    id_colloquial: {
      trigger: "Bisa oper ke manusia aja gak?",
      response: "Siap, langsung saya sambungkan ke customer service manusia ya. Ditunggu sebentar.",
    },
  },

  fallbacks: {
    en: "I do not have verified synthetic information to answer that question. I can transfer you to a human customer representative.",
    fil: "",
    taglish: "",
    id_formal: "Saya belum punya informasi sintetis yang terverifikasi untuk itu. Saya bisa meneruskan ke petugas manusia.",
    id_colloquial: "Wah, untuk pertanyaan itu saya belum punya info sintetis yang terverifikasi nih. Mau saya terusin ke petugas manusia aja?",
  },

  regional_accent_considerations: [
    {
      region: "Jawa Tengah & Jawa Timur (Javanese-influenced Indonesian)",
      description: "Speakers whose mother tongue is Javanese (Semarang, Solo, Yogyakarta, Surabaya, Malang) speaking Indonesian.",
      phonetic_variation: "Heavier articulation of voiced stops [b], [d], [g] with breathy phonation (e.g., 'Bapak', 'duit', 'gaji'); vowel coloring on /e/ and /o/; frequent colloquial pragmatic particles and honorific address tags ('Mas', 'Mbak', 'Pak', 'Nggih', 'lho', 'to').",
      asr_mitigation: "Acoustic models must be tuned with breathy-stop training corpora. Language models must not discard regional honorific particles as noise tokens.",
    },
    {
      region: "Jawa Barat (Sundanese-influenced Indonesian)",
      description: "Speakers from Sundanese linguistic backgrounds (Bandung, Bogor, Priangan) exhibiting characteristic phonological substitutions.",
      phonetic_variation: "Voiceless labiodental fricative /f/ and /v/ frequently realized as bilabial plosive /p/ (e.g., 'fiktif' -> 'piktip', 'finansial' -> 'pinansial', 'verifikasi' -> 'peripikasi'); melodic intonation contour (intonasi mendayu-dayu).",
      asr_mitigation: "Phonetic lexicon aliasing to map /f/ <-> /p/ pairs for finance loanwords to avoid high Out-Of-Vocabulary (OOV) error rates.",
    },
  ],

  asr_tts_profile: {
    asr_prototype_provider: "Native Browser Web Speech API (`SpeechRecognition` with `id-ID` language tag) with local deterministic simulated transcript fallback.",
    supported_assumptions: [
      "Conversational consumer finance dialogue in standard Indonesian or informal register.",
      "Integration of natural finance loanwords (tenor, DP, approval, installment).",
      "No actual credit underwriting, bank details, or PII collection.",
    ],
    expected_asr_challenges: [
      "Affixation complexity: Indonesian agglutinative morphology (prefixes me-, ber-, di- and suffixes -kan, -an, -nya) frequently transcribed with incorrect word segmentation (e.g. 'di angsur' instead of 'diangsur').",
      "Colloquial informal abbreviations: Shortened terms ('gak/nggak', 'udah', 'kalo', 'aja', 'dgn') often misrecognized by models trained strictly on formal news Indonesian.",
      "Loanword acoustic mismatch: Words like 'tenor', 'approval', 'installment' pronounced with Indonesian phonetic patterns, leading to English-model mismatch.",
    ],
    likely_transcription_errors: [
      { input: "angsuran", error: "ang suran / ansuran", remedy: "Agglutinative morphological dictionary binding." },
      { input: "jatuh tempo", error: "jatu tempo / jatuh tembo", remedy: "Financial N-gram language model biasing." },
      { input: "DP", error: "de pe / tv / deep", remedy: "Finance acronym boosting in vocabulary lexicon." },
      { input: "tenor", error: "tenar / tenor", remedy: "Domain vocabulary biasing for multifinance context." },
    ],
    tts_approach: "Browser SpeechSynthesis API utilizing Indonesian system voices (`id-ID`, e.g. Indonesian Google or Microsoft voices); fallback to phonetically matched regional voice.",
    native_language_limitations: [
      "Synthetic prototype data only; NO native-speaker linguistic validation was performed.",
      "Colloquial registers vary significantly across urban centers (Jakarta slang vs. Medan slang vs. Surabaya slang); prototype only implements central urban Indonesian.",
      "Formal vs. colloquial register transitions in the same call require careful acoustic tone matching which basic browser TTS cannot dynamically modulate.",
    ],
    regional_accent_limitations: [
      "No regional Indonesian acoustic models (e.g., Javanese medok or Sundanese /p/-/f/ shifts) have been trained or validated in this prototype.",
    ],
    native_speaker_validated: false,
  },
};
