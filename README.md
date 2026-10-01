# HarborSpring assessment prototype

This is a work-in-progress AI engineering assessment prototype for **HarborSpring Business Finance**, a fictional company. The primary future use case is SME business-loan qualification.

> **Synthetic-data notice:** The assessment supplied no business PDFs, policies, websites, forms, FAQs, or rules. All company information, HSC currency values, product descriptions, thresholds, pricing illustrations, and localization material in this repository are fictional and synthetic. No real customer information is used and no financial approval decision is made.

## Current status

## Current status

All four assessment modules are fully implemented, verified, and passing 100% of all unit, regression, and evaluation suites (36/36 tests passing):

- **Q1 Voice Agent**: Interactive browser-based voice application connecting speech input/output to conversation state machine, deterministic qualification engine, Q2 knowledge retrieval, and real-time debug/assessment evidence panel.
- **Q2 Knowledge Base**: 13 synthetic source records, 12 canonical documents, 58 indexed chunks, hybrid lexical + local hashing-vector retrieval, citations/provenance, 0.72 confidence threshold, 100% Top-1/Top-3 retrieval accuracy, 100% safe rejection of unsupported queries.
- **Q3 Native-Language Voice Bots**: Dedicated localization engine for Philippines (Bancassurance) and Indonesia (Consumer Finance), supporting natural code-switching (Taglish and Indonesian finance loanwords), formal/colloquial registers, domain terminology dictionaries, objection handling, human escalations, regional accent considerations, localized fallbacks, and an interactive demo UI (`/localization.html`).
- **Q4 Live Insights & Nudge Engine**: Real-time signal detection (`COMPLIANCE_RISK`, `FRUSTRATION`, `BUYING_SIGNAL`, `CALLBACK_HUMAN_REQUEST`, `NO_NUDGE`) processing incremental transcript chunks, duplicate suppression, 15s cooldown windows, priority classification, latency tracking (P50/P95), and an interactive Live Dashboard (`/insights.html`).

## Structure

- `apps/voice-agent/` — Browser-based voice agent frontend and Node.js HTTP server:
  - `apps/voice-agent/public/index.html` — Q1 Voice agent interface, live transcript, microphone controls, and debug inspector.
  - `apps/voice-agent/public/insights.html` — Q4 Live Insights Dashboard with real-time stream, active nudges, duplicate suppression metrics, latency stats, and replay simulator.
  - `apps/voice-agent/public/localization.html` — Q3 Native-Language Voice Localization demo page with market and register switching, live dialogue bench, terminology dictionary, and ASR/TTS profiles.
  - `apps/voice-agent/src/server.ts` — Voice agent session endpoint (`/api/conversation`), live insights APIs (`/api/insights/*`), localization APIs (`/api/localization/*`), and static file server.
- `apps/api/` — Knowledge Base API service foundation.
- `packages/localization/` — Q3 native-language localization engine and configurations:
  - `packages/localization/src/types.ts` — Market contracts, language codes, terminology schema, scenarios, and ASR/TTS profile types.
  - `packages/localization/src/philippines.ts` — Philippines Bancassurance localization configuration (English, Filipino, Taglish).
  - `packages/localization/src/indonesia.ts` — Indonesia Multifinance localization configuration (Formal Bahasa, Colloquial Bahasa, loanwords).
  - `packages/localization/src/engine.ts` — LocalizationEngine implementing intent parsing, code-switching detection, objection handling, escalations, and strict native-language fallbacks.
  - `packages/localization/src/index.ts` — Public package exports.
- `packages/insights/` — Real-time live insights, signal detection, and nudge engine (Q4).
- `packages/qualification/` — Deterministic qualification engine, state machine, and entity extractor (Q1).
- `packages/knowledge/` — Ingestion, normalization, section chunking, and hybrid retrieval (Q2).
- `packages/shared/` — Central safety policy and escalation definitions.
- `data/raw/synthetic/` — Fictional source-of-truth documents (including `10-philippines-bancassurance-localization.md` and `11-indonesia-consumer-finance-localization.md`), business rules (`business-rules.json`), and provenance manifest.
- `data/processed/knowledge/` — Canonical documents, chunks, and index metadata.
- `data/evaluations/retrieval/` — Q2 retrieval evaluation set and regression benchmark.
- `data/evaluations/q1/` — Q1 scenario definitions, turn-by-turn transcripts, and evaluation results.
- `data/evaluations/q3/` — Q3 scenario definitions (`scenarios.json`) and automated evaluation results (`results.json`).
- `data/evaluations/q4/` — Q4 Live Insights evaluation benchmark and duplicate suppression results.
- `tests/` — Automated test suite (`knowledge.test.mjs`, `qualification.test.mjs`, `localization.test.mjs`, `insights.test.mjs`, `source-pack.test.mjs`).

## Setup and Quick Start

Prerequisites: Node.js 22+ (tested on Node v26).

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript packages and applications
npm run build

# 3. Ingest synthetic knowledge base (Q2)
npm run kb:ingest

# 4. Run full test suite (36/36 tests passing across Q1, Q2, Q3, and Q4)
npm run test

# 5. Run Q1 conversation evaluations (6/6 scenarios passing)
npm run q1:evaluate

# 6. Run Q2 retrieval evaluations (7/7 queries passing)
npm run kb:evaluate

# 7. Run Q3 localization evaluations (11/11 scenarios passing)
npm run q3:evaluate

# 8. Run Q4 live insights evaluations (5/5 scenarios passing, 100% precision)
npm run q4:evaluate

# 9. Verify synthetic source pack
npm run validate:source-pack

# 10. Launch the Voice Agent & Localization Web Application
npm run voice-agent
```

Once running:
- **Voice Agent (Q1)**: Open `http://localhost:3001`
- **Live Insights Dashboard (Q4)**: Open `http://localhost:3001/insights.html`
- **Native Localization Demo (Q3)**: Open `http://localhost:3001/localization.html`

---

## Q3 Native-Language Voice Bots Architecture

The Q3 Localization Layer provides domain-specific speech interaction for two Southeast Asian markets:
1. **Philippines**: Bancassurance / Life Protection (`PH`)
2. **Indonesia**: Consumer Finance / Multifinance (`ID`)

```
   [ User Speech Input (Web Speech API / Text Input) ]
                           ↓
     [ Language & Market Context Router (engine.ts) ]
                           ↓
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
 [ Market 1: Philippines ]          [ Market 2: Indonesia ]
  • Use Case: Bancassurance          • Use Case: Multifinance
  • Registers:                       • Registers:
    - Philippine English               - Formal Bahasa Indonesia
    - Filipino / Tagalog               - Colloquial Bahasa (Gaul)
    - Natural Taglish (Code-Switch)    - Mixed Finance Loanwords
  • Code-Switching Morphology        • Loanwords (DP, Tenor, Approval)
  • Visayas Accent Consideration     • Javanese / Sundanese Shifts
         └─────────────────┬─────────────────┘
                           ↓
 [ Intent & Pragmatic Matcher ]
  • Greetings & Respectful Politeness (po/opo, Bapak/Ibu)
  • Discovery & Qualification Inquiries
  • Payment & Premium Explanations (illustrative estimates)
  • Objection Handling ("Mahal ang premium", "Cicilannya berat")
  • Human Escalation ("Gusto ko ng tao", "Bicara dengan orang")
  • Localized Fallback Gate (STRICT: never switch unexpectedly to English)
                           ↓
 [ Browser Speech Synthesis (TTS) / Localized Response Display ]
```

---

### Market 1 — Philippines (Bancassurance)

- **Use case:** Life Insurance / Bancassurance (synthetic protection plans).
- **Supported registers:**
  1. *Philippine English (`en-PH`)*: Professional banking register.
  2. *Filipino / Tagalog (`fil-PH`)*: Respectful standard Filipino with honorifics (*po*, *opo*).
  3. *Natural Taglish (`fil-PH` code-switching)*: Colloquial conversational register blending Tagalog grammatical scaffolding with English financial nouns.

#### Terminology Dictionary
- `Premium`: *Halaga ng hulog / Premium*. The illustrative scheduled payment amount. In natural Taglish, *premium* is standard rather than archaic *bayarin*.
- `Coverage`: *Proteksyon / Saklaw ng benepisyo*. Synthetic protection benefits. Phrased as *proteksyon* or *coverage*.
- `Beneficiary`: *Taong makakatanggap / Beneficiary*. Plain language *taong pipiliin* paired with *beneficiary* rather than legalistic *tagapagmana*.
- `Rider`: *Dagdag na proteksyon / Optional add-on*. Optional supplementary synthetic benefit.
- `Lapse`: *Pagka-expire o pagtigil ng proteksyon*. Clear descriptive phrasing for missed payments.

#### Localization Examples (Natural vs. Literal Translation)
1. **Greeting:**
   - *Natural Taglish:* "Hi po, quick prototype check lang tungkol sa protection plan—okay ba magtanong ng ilang basic details?"
   - *Literal translation avoided:* "Magandang araw. Ito ay isang prototipo..."
2. **Premium Explanation:**
   - *Natural Taglish:* "Ang premium amount na 'to ay sample estimate lang for this prototype; hindi pa ito final quote. Puwede itong bayaran monthly or yearly."
3. **Objection Handling ("Mahal ang premium"):**
   - *Natural Taglish:* "Naiintindihan ko po ang inyong concern. Ang halagang nabanggit ay sample illustration lamang at hindi pinal. Ang aming prototype ay hindi maaaring magbaba o mag-quote ng indibidwal na presyo. Nais niyo po bang kumonsulta sa isang licensed human advisor?"
4. **Human Escalation ("Gusto ko ng tao"):**
   - *Natural Taglish:* "Sure po! I-transfer ko po kayo sa aming human financial advisor para maasikaso kayo nang maayos."

---

### Market 2 — Indonesia (Consumer Finance / Multifinance)

- **Use case:** Consumer Finance / Multifinance (synthetic asset and consumer financing).
- **Supported registers:**
  1. *Formal Bahasa Indonesia (`id-ID`)*: Respectful commercial address using *Bapak/Ibu*.
  2. *Colloquial Bahasa Indonesia (`id-ID`)*: Conversational informal register (*"Halo, ini cuma demo prototipe ya. Boleh cek sebentar soal cicilan dan tenor?"*).
  3. *Mixed English Loanwords (`en-ID` / `id-ID`)*: Natural adoption of industry loanwords (*DP, tenor, installment, approval*).

#### Terminology Dictionary
- `Cicilan` / `Angsuran`: Monthly installment in illustrative schedules. Both terms are natural; *cicilan* in speech, *angsuran* in formal agreements.
- `Tenor`: Repayment period in months. Retained directly as a loanword throughout Indonesian banking and fintech.
- `DP (Down Payment)`: Illustrative down payment. Commonly abbreviated as *DP* rather than strictly translated as *uang muka*.
- `Denda`: Late payment charge. Described strictly as an illustrative sample; prototype never demands payments.
- `Jatuh Tempo`: Sample due date milestone, never a live demand for payment.
- `Pembiayaan`: Generic consumer financing context used by multifinance companies instead of generic *pinjaman*.
- `Approval`: Synthetic credit approval status, commonly spoken directly as *approval* or *di-approve*.

#### Regional Accent & Speech Considerations
1. **Jawa Tengah & Jawa Timur (Javanese-influenced Indonesian):**
   - *Phonetic variation:* Articulation of voiced stops [b], [d], [g] with heavy breathy phonation (e.g. *Bapak*, *duit*, *gaji*); vowel coloring on /e/ and /o/; honorific pragmatic particles (*Mas, Mbak, Pak, Nggih, lho, to*).
   - *ASR mitigation:* Acoustic models must be trained on breathy-stop corpora. Language models must not drop regional honorific tags as noise.
2. **Jawa Barat (Sundanese-influenced Indonesian):**
   - *Phonetic variation:* Labiodental fricative /f/ and /v/ frequently realized as bilabial plosive /p/ (e.g., *fiktif* -> *piktip*, *finansial* -> *pinansial*); characteristic rising-falling melodic intonation.
   - *ASR mitigation:* Lexical phonetic aliasing mapping /f/ <-> /p/ pairs for finance loanwords to avoid Out-Of-Vocabulary rejection.

#### Localization Examples
1. **Colloquial Greeting:**
   - "Halo, ini cuma demo prototipe ya. Boleh cek sebentar soal cicilan dan tenor?"
2. **Financing Explanation with Loanwords:**
   - "Untuk contoh ini, DP, tenor, dan angsuran semuanya illustrative—bukan offer yang sebenarnya."
3. **Sector Objection Handling ("Cicilannya berat"):**
   - "Kami sangat memahami kekhawatiran Bapak/Ibu. Simulasi cicilan ini hanyalah angka contoh dan kami tidak menyarankan mengambil pembiayaan yang membebani anggaran Anda. Apakah Bapak/Ibu ingin mencoba simulasi tenor yang lebih panjang, atau ingin saya hubungkan ke petugas resmi?"
4. **Human Escalation ("Saya mau bicara dengan orang"):**
   - "Baik Bapak/Ibu, saya akan segera menghubungkan Anda ke petugas resmi kami. Mohon ditunggu sebentar."

---

### Voice / ASR / TTS Engineering Documentation

| Dimension | Philippines Specification | Indonesia Specification |
|---|---|---|
| **Primary Language Codes** | `en-PH`, `fil-PH` | `id-ID` |
| **Code-Switching Mechanism** | Natural intra-sentential Taglish | Indonesian grammatical frame + English finance loanwords |
| **Current Prototype ASR** | Browser Web Speech API (`SpeechRecognition`) with local deterministic simulation fallback | Browser Web Speech API (`SpeechRecognition`) with local deterministic simulation fallback |
| **Current Prototype TTS** | Browser Web Speech API (`SpeechSynthesis`) with `fil-PH` / `en-PH` system voices | Browser Web Speech API (`SpeechSynthesis`) with `id-ID` system voices |
| **Native-Speaker Validated?** | **NO** (Strictly declared as synthetic prototype) | **NO** (Strictly declared as synthetic prototype) |
| **External Cloud Credentials** | None used; entirely self-contained client/local architecture | None used; entirely self-contained client/local architecture |

#### Expected ASR Challenges & Likely Errors

1. **Philippines:**
   - *Language identification thrashing:* Rapid mid-sentence switching between Tagalog and English degrades single-language acoustic models.
   - *Honorific clipping:* Polite particles (*po*, *opo*, *ho*) clipped or mistaken for background noise.
   - *Morphological prefix splitting:* Hyphenated Taglish verbs (e.g., *i-escalate*, *mag-apply*, *i-che-check*) split into nonsensical pseudo-words (*e escalate*, *iescalate*).
   - *Remedy:* Phonetic normalization dictionary and bilingual acoustic biasing.

2. **Indonesia:**
   - *Morphological agglutination:* Word segmentation errors with Indonesian prefixes and suffixes (*me-*, *ber-*, *di-*, *-kan*, *-nya*), transcribing *diangsur* as *di angsur*.
   - *Colloquial abbreviations:* Informal spoken terms (*gak/nggak*, *udah*, *kalo*, *aja*) misrecognized by standard formal Indonesian models.
   - *Loanword acoustic mismatch:* Words like *tenor*, *approval*, *installment* pronounced with Indonesian phonetics, failing strict English language models.
   - *Remedy:* Morphological lexicon binding and financial N-gram language model biasing.

#### Strict Localized Fallback Behavior
When an out-of-scope or unsupported question is asked:
- **Philippines:** Fallback strictly remains in Filipino/Taglish:
  *"Wala akong verified synthetic information para sagutin iyon, pero puwede kitang i-escalate sa human advisor."*
- **Indonesia:** Fallback strictly remains in Indonesian:
  *"Saya belum punya informasi sintetis yang terverifikasi untuk itu. Saya bisa meneruskan ke petugas manusia."*
- **Zero Unexpected Language Switching:** The system guarantees never switching unexpectedly to English during native-language or code-switched dialogues.

---

## Automated Test & Evaluation Results

All evaluation suites execute cleanly and output structured JSON evidence:

```
Command                     Status    Key Metrics
-----------------------------------------------------------------------------------------
npm run test                PASS      36/36 tests passing (100%)
npm run q1:evaluate         PASS      6/6 scenarios passing (100% pass rate)
npm run kb:evaluate         PASS      7/7 queries passing (100% Top-1, 100% Top-3)
npm run q3:evaluate         PASS      11/11 scenarios passing (100% pass rate)
npm run q4:evaluate         PASS      5/5 scenarios passing (100% precision, P95: 0.03 ms)
npm run validate:source-pack PASS     13/13 documents verified
```

### Q3 Evaluation Breakdown (`npm run q3:evaluate`)
- **Total scenarios:** 11 / 11 passed (100% pass rate).
- **Philippines localization coverage:** 5 / 5 passed (100%).
- **Indonesia localization coverage:** 6 / 6 passed (100%).
- **Code-switching tests:** 2 / 2 passed (100%).
- **Fallback-language tests:** 2 / 2 passed (100% — verified native language retention, 0 unexpected English switches).
- **Domain terminology coverage:** 7 / 12 core terms matched across evaluation queries.
- **Evidence artifacts:** `data/evaluations/q3/scenarios.json` and `data/evaluations/q3/results.json`.

---

## Manual Demonstration Guide (Browser)

1. Start the application:
   ```bash
   npm run voice-agent
   ```
2. Navigate to `http://localhost:3001/localization.html`.
3. **Philippines Demonstration:**
   - Select **🇵🇭 Philippines (Bancassurance)**.
   - Select **Natural Taglish** register.
   - Click **🔊 Speak Greeting** to hear the spoken greeting via browser speech synthesis.
   - Click the prompt chip **Cooperative (Taglish)**: *"Pwede po ba i-explain kung magkano ang monthly premium at paano ang coverage?"*
     - Observe: Agent responds with natural Taglish premium explanation, badges display `PAYMENT_EXPLANATION`, `CODE-SWITCHING`, and highlights terms `Premium` and `Coverage`.
   - Click the prompt chip **Objection (Mahal)**: *"Mahal ang premium niyan, baka hindi ko kayang bayaran buwan-buwan."*
     - Observe: Agent acknowledges the affordability concern without quoting live prices, offering human consultation.
   - Click the prompt chip **Human Escalation**: *"Gusto ko ng tao, ayoko makipag-usap sa bot."*
     - Observe: Immediate escalation transfer to a human financial advisor (`HUMAN_ESCALATION` badge).
   - Click **Fallback Test**: *"Ano ang stock price ng HarborSpring sa New York exchange ngayon?"*
     - Observe: Agent delivers localized Taglish fallback without switching to English.
4. **Indonesia Demonstration:**
   - Click **🇮🇩 Indonesia (Consumer Finance)**.
   - Toggle between **Formal Bahasa** and **Colloquial Bahasa**.
   - Click prompt chip **Colloquial (Cicilan & Tenor)**: *"Halo, mau cek dong soal cicilan per bulan dan simulasi tenornya."*
     - Observe: Relaxed register response retaining loanwords *DP, tenor, dan angsuran*.
   - Click prompt chip **Objection (Cicilan Berat)**: *"Cicilannya berat sekali, apakah ada opsi yang lebih ringan?"*
     - Observe: Gentle, non-pressuring response acknowledging affordability.
   - Click prompt chip **Human Escalation**: *"Saya mau bicara dengan orang sekarang juga."*
     - Observe: Immediate transfer to *petugas resmi*.
5. **Microphone Voice Interaction:**
   - Click the **🎤 Voice** button on supported browsers (Chrome, Edge) to speak directly in Taglish or Indonesian.

---

## Known Limitations

- **Browser-Based Voice Demo:** The prototype uses native browser Web Speech APIs (`SpeechRecognition` and `SpeechSynthesis`) for local demonstration without external telephony credentials or cloud API keys.
- **Native-Speaker Validation:** **NO native-speaker linguistic validation was performed.** All dialogues and terminology dictionaries are synthetic prototypes based on localization guidelines (`HSB-010` and `HSB-011`).
- **Regional Dialects:** Regional accents (Bisaya-accented Tagalog, Javanese-influenced Indonesian, Sundanese /f/-/p/ shifts) are documented conceptually and structurally with mitigation architectures, but have not been trained on regional acoustic recordings.
- **Synthetic Data Prototype:** All company information, financial policies, currency figures (HSC), and regulatory disclosures are fictional and for prototype evaluation only.

---

## Production Improvement Plan

To transition this synthetic localization prototype into a production-grade enterprise voice solution, the following engineering steps must be taken:

1. **Market-Specific Bilingual ASR Benchmarking:**
   - Replace browser speech recognition with enterprise dual-language streaming ASR (e.g. customized Whisper Large v3, Google Cloud Speech-to-Text with multi-language code-switching models, or Azure Speech bilingual models).
   - Establish benchmark datasets measuring Character Error Rate (CER) and Word Error Rate (WER) specifically on intra-sentential Taglish and Indonesian colloquial loanwords.
2. **Native-Speaker Evaluation:**
   - Conduct structured qualitative listening and conversation evaluations with native speakers in Manila, Cebu, Jakarta, and Surabaya.
   - Evaluate pragmatic naturalness, tone respectfulness (honorific particles *po/opo* and *Bapak/Ibu*), and regional idiomatic accuracy.
3. **Native Neural TTS Voices:**
   - Deploy studio-grade neural TTS engines with native phonetic lexicons (e.g. ElevenLabs Multilingual v2 or Azure Neural Voice for `fil-PH` and `id-ID`).
   - Implement custom phonetic pronunciation dictionaries for finance loanwords (e.g., ensuring *tenor* and *approval* are articulated with natural localized phonology).
4. **Regional Accent Acoustic Testing:**
   - Test and fine-tune models against distinct regional accents:
     - Philippines: Cebuano/Bisaya, Ilocano, and Hiligaynon speakers speaking Tagalog/Taglish.
     - Indonesia: Javanese (Central/East Java), Sundanese (West Java), Batak (Sumatra), and eastern Indonesian accents.
5. **Regulatory & Compliance Review:**
   - Conduct formal legal reviews with licensed financial compliance officers in each jurisdiction:
     - Philippines: Insurance Commission (IC) regulations regarding bancassurance disclosures, cooling-off periods, and non-guaranteed dividend illustrations.
     - Indonesia: Otoritas Jasa Keuangan (OJK) regulations for consumer multifinance disclosures, interest rate transparency, and late fee policies.
6. **Telephony & Acoustic Noise Robustness:**
   - Integrate with SIP/PSTN telephony trunks via WebRTC using 8kHz G.711 / G.722 audio codecs.
   - Benchmark acoustic noise suppression and voice activity detection (VAD) against realistic background noise (street traffic, market ambiance, call center crosstalk).
7. **End-to-End Latency Measurement:**
   - Measure real-world pipeline latency: Streaming ASR chunking -> LLM token streaming -> Neural TTS audio buffer generation.
   - Enforce an end-to-end conversational turnaround latency target of **< 800 ms** to ensure natural conversational pacing.

