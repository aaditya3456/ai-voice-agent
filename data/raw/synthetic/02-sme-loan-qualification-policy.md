---
document_id: HSB-002
title: SME Loan Preliminary Qualification Policy
source_type: policy
version: 1.0.0
effective_date: 2026-09-30
language: en
synthetic: true
pii_present: false
---

# Synthetic preliminary qualification policy

This is a deterministic prototype rule set, not real lending policy. The applicant must provide consent before qualification. Required facts are business age, registration status, monthly revenue, requested amount, intended use, and contact preference.

A business must be registered in Harbor Market, have operated for at least 12 months, state average monthly revenue of at least 100,000 HSC, and request between 50,000 and 1,000,000 HSC inclusive. Missing facts result in `needs_information`; mutually inconsistent facts result in `needs_clarification`.

When all rules pass, the result is `preliminary_eligible`. It never means approved; final approval requires a formal application and review. A failed deterministic rule produces `preliminary_not_eligible`. Human assistance, a complaint, suspected fraud, customer vulnerability, or unsupported high-impact questions produce `escalation_required`.
