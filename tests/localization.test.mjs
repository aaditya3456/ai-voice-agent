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

const localization = await import("../dist/packages/localization/src/index.js");

test("Q3 - PH 1: English cooperative customer", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "PH",
    language: "en",
    customer_input: "Hello, I am interested in exploring family protection options.",
  });

  assert.equal(res.market, "PH");
  assert.equal(res.language, "en");
  assert.equal(res.detected_intent, "qualification_discovery");
  assert.ok(res.reply_text.includes("protection options"));
  assert.equal(res.fallback_used, false);
  assert.equal(res.escalation_triggered, false);
});

test("Q3 - PH 2: Tagalog cooperative customer", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "PH",
    language: "fil",
    customer_input: "Magandang araw po. Interesado po akong malaman ang tungkol sa proteksyon ng pamilya.",
  });

  assert.equal(res.market, "PH");
  assert.equal(res.language, "fil");
  assert.equal(res.detected_intent, "qualification_discovery");
  assert.ok(res.reply_text.includes("proteksyon"));
  assert.equal(res.fallback_used, false);
});

test("Q3 - PH 3: Taglish mixed conversation with natural code-switching", () => {
  const engine = new localization.LocalizationEngine();
  const query = "Pwede po ba i-explain kung magkano ang monthly premium at paano ang coverage?";
  const isCodeSwitched = engine.detectCodeSwitching(query, "PH");
  assert.equal(isCodeSwitched, true);

  const res = engine.processTurn({
    market: "PH",
    language: "taglish",
    customer_input: query,
  });

  assert.equal(res.code_switched, true);
  assert.ok(res.terminology_matched.includes("Premium") || res.terminology_matched.includes("Coverage"));
  assert.ok(res.reply_text.includes("premium") || res.reply_text.includes("sample"));
});

test("Q3 - PH 4: Insurance-specific objection ('Mahal ang premium')", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "PH",
    language: "taglish",
    customer_input: "Mahal ang premium niyan, baka hindi ko kayang bayaran buwan-buwan.",
  });

  assert.equal(res.detected_intent, "objection_expensive_premium");
  assert.ok(res.reply_text.includes("Naiintindihan ko po ang inyong concern"));
  assert.ok(res.reply_text.includes("sample illustration"));
  assert.equal(res.fallback_used, false);
});

test("Q3 - PH 5: Human escalation ('Gusto ko ng tao')", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "PH",
    language: "taglish",
    customer_input: "Gusto ko ng tao, ayoko makipag-usap sa bot.",
  });

  assert.equal(res.detected_intent, "human_escalation");
  assert.equal(res.escalation_triggered, true);
  assert.ok(res.reply_text.includes("human financial advisor") || res.reply_text.includes("human advisor"));
});

test("Q3 - ID 6: Formal Bahasa cooperative customer", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "ID",
    language: "id_formal",
    customer_input: "Selamat siang. Saya ingin melihat simulasi pembiayaan konsumen.",
  });

  assert.equal(res.market, "ID");
  assert.equal(res.language, "id_formal");
  assert.equal(res.detected_intent, "qualification_discovery");
  assert.ok(res.reply_text.includes("pembiayaan"));
  assert.equal(res.fallback_used, false);
});

test("Q3 - ID 7: Colloquial Bahasa conversation ('cuma demo')", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "ID",
    language: "id_colloquial",
    customer_input: "Halo, mau cek dong soal cicilan per bulan dan simulasi tenornya.",
  });

  assert.equal(res.market, "ID");
  assert.equal(res.language, "id_colloquial");
  assert.ok(res.reply_text.includes("DP, tenor, dan angsuran") || res.reply_text.includes("simulasi"));
  assert.equal(res.fallback_used, false);
});

test("Q3 - ID 8: Mixed English / finance terminology (tenor, DP, installment)", () => {
  const engine = new localization.LocalizationEngine();
  const query = "Apakah butuh DP untuk approval, dan berapa estimasi cicilan per bulan untuk tenor 12 bulan?";
  const isCodeSwitched = engine.detectCodeSwitching(query, "ID");
  assert.equal(isCodeSwitched, true);

  const terms = engine.detectTerminology(query, "ID");
  assert.ok(terms.some((t) => t.includes("DP")));
  assert.ok(terms.some((t) => t.includes("Tenor")));
  assert.ok(terms.some((t) => t.includes("Cicilan")));

  const res = engine.processTurn({
    market: "ID",
    language: "id_formal",
    customer_input: query,
  });

  assert.equal(res.code_switched, true);
  assert.ok(res.terminology_matched.length >= 2);
});

test("Q3 - ID 9: Consumer-finance objection ('Cicilannya berat')", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "ID",
    language: "id_formal",
    customer_input: "Cicilannya berat sekali, apakah ada opsi yang lebih ringan?",
  });

  assert.equal(res.detected_intent, "objection_high_installment");
  assert.ok(res.reply_text.includes("memahami kekhawatiran"));
  assert.ok(res.reply_text.includes("tidak menyarankan mengambil pembiayaan yang membebani"));
  assert.equal(res.fallback_used, false);
});

test("Q3 - ID 10: Human escalation ('Saya mau bicara dengan orang')", () => {
  const engine = new localization.LocalizationEngine();
  const res = engine.processTurn({
    market: "ID",
    language: "id_formal",
    customer_input: "Saya mau bicara dengan orang sekarang juga.",
  });

  assert.equal(res.detected_intent, "human_escalation");
  assert.equal(res.escalation_triggered, true);
  assert.ok(res.reply_text.includes("petugas resmi"));
});

test("Q3 - ID 11: Regional accent observation and documented limitation", () => {
  const config = localization.INDONESIA_CONFIG;
  assert.ok(config.regional_accent_considerations.length >= 2);

  const javanese = config.regional_accent_considerations.find((r) => r.region.includes("Jawa Tengah"));
  assert.ok(javanese);
  assert.ok(javanese.phonetic_variation.includes("voiced stops [b], [d], [g]"));
  assert.ok(javanese.asr_mitigation.includes("Acoustic models"));

  const sundanese = config.regional_accent_considerations.find((r) => r.region.includes("Sundanese"));
  assert.ok(sundanese);
  assert.ok(sundanese.phonetic_variation.includes("/f/ and /v/"));

  // Check limitation declaration
  assert.equal(config.asr_tts_profile.native_speaker_validated, false);
  assert.ok(config.asr_tts_profile.regional_accent_limitations.length > 0);
});

test("Q3 Localized Fallback: Never unexpectedly switch to English for PH / ID", () => {
  const engine = new localization.LocalizationEngine();

  // Out of scope query in Tagalog
  const phRes = engine.processTurn({
    market: "PH",
    language: "taglish",
    customer_input: "Ano ang stock price ng HarborSpring sa New York exchange ngayon?",
  });
  assert.equal(phRes.fallback_used, true);
  assert.ok(phRes.reply_text.includes("Wala akong verified synthetic information"));
  assert.ok(!phRes.reply_text.startsWith("I do not have")); // Maintained Taglish fallback!

  // Out of scope query in Indonesian
  const idRes = engine.processTurn({
    market: "ID",
    language: "id_formal",
    customer_input: "Berapa kurs dollar AS terhadap rupiah hari ini?",
  });
  assert.equal(idRes.fallback_used, true);
  assert.ok(idRes.reply_text.includes("Saya belum punya informasi sintetis yang terverifikasi"));
  assert.ok(!idRes.reply_text.startsWith("I do not have")); // Maintained Indonesian fallback!
});
