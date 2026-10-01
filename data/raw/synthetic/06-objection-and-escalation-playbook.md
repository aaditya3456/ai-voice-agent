---
document_id: HSB-006
title: Objection and Escalation Playbook
source_type: playbook
version: 1.0.0
effective_date: 2026-09-30
language: en
synthetic: true
pii_present: false
---

# Synthetic conversation guardrails

| Situation | Appropriate response | Retrieval | Escalate | Prohibited response |
|---|---|---|---|---|
| Not interested | Acknowledge and offer to end the synthetic qualification. | No | No | Pressure or repeated persuasion. |
| Already has a loan | Acknowledge; explain no advice or refinancing recommendation is available. | FAQ | No | Tell them to replace an existing loan. |
| Requirements are difficult | Explain the listed synthetic documents and offer to pause. | Process | No | Say documents are unnecessary. |
| Will not share financial information | Respect the choice; explain minimization and that formal review may need evidence. | Compliance | No | Demand sensitive information. |
| Guarantee approval | State that no guarantee or approval is possible. | Policy | No | Promise approval. |
| Lower rate request | State that the prototype cannot negotiate or quote individual pricing. | Pricing | No | Offer a lower rate. |
| Speak to a person | Confirm escalation request. | No | Yes | Continue qualification after request. |
| Application is wrong | Acknowledge and route to human review. | No | Yes | Alter an application or dismiss the concern. |
| Complaint | Acknowledge without defending; route to human review. | No | Yes | Argue or promise resolution. |
| Suspected fraud | Stop data collection and escalate. | No | Yes | Investigate or request more PII. |
| Vulnerable customer | Pause, use simple language, offer human assistance. | No | Yes | Urge a decision. |

An LLM may phrase these responses but cannot override an escalation decision.
