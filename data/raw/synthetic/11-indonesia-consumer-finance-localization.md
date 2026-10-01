---
document_id: HSB-011
title: Indonesia Consumer Finance Localization Pack
source_type: localization_script
version: 1.0.0
effective_date: 2026-09-30
language: id,en
synthetic: true
pii_present: false
---

# Synthetic localization for prototype; requires native-speaker and compliance review

This fictional consumer-finance pack is separate from HarborSpring SME lending. It does not state a real consumer-finance policy, price, regulatory duty, or payment instruction. No regional accent has been tested.

## Formal and colloquial flow

- Formal: “Selamat siang. Ini adalah percakapan prototipe mengenai pembiayaan fiktif. Apakah Bapak/Ibu bersedia melanjutkan?”
- Colloquial: “Halo, ini cuma demo prototipe ya. Boleh cek sebentar soal cicilan dan tenor?”
- Mixed finance terms: “Untuk contoh ini, DP, tenor, dan angsuran semuanya illustrative—bukan offer yang sebenarnya.”

The fictional reminder flow may ask whether the customer wants a human discussion about a sample jatuh tempo. It must not request payment, bank details, or a promise to pay.

## Terms and explanations

- `cicilan` / `angsuran`: the fictional instalment in a sample schedule.
- `tenor`: the sample repayment period.
- `DP`: a fictional illustrative down payment in a product example.
- `denda`: a fictional example charge that must not be quoted as a real charge.
- `jatuh tempo`: a sample due-date concept, not a real demand for payment.
- `pembiayaan`: generic fictional financing context.

## Objections, escalation, and fallback

For “Cicilannya berat,” acknowledge concern and do not recommend borrowing. For “Saya mau bicara dengan orang,” escalate. For a complaint or suspected fraud, stop the flow and escalate. Fallback: “Saya belum punya informasi sintetis yang terverifikasi untuk itu. Saya bisa meneruskan ke petugas manusia.”

## Localization rather than direct translation

1. Formal “Bapak/Ibu” provides a respectful register, while colloquial “cuma demo” is intentionally more relaxed.
2. The terms DP, tenor, and angsuran are retained as common finance vocabulary rather than replaced with unnatural literal English.
3. “Cicilannya berat” is treated as a payment-difficulty concern requiring a non-pressuring response, not simply translated as “the instalment is heavy.”
