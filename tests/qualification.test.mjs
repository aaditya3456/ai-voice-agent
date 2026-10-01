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

const knowledge = await import("../dist/packages/knowledge/src/index.js");
const qualification = await import("../dist/packages/qualification/src/index.js");
const conversation = await import("../dist/packages/qualification/src/conversation.js");

const repository = new knowledge.FileKnowledgeRepository(
  resolve(root, "data/processed/knowledge/documents.json"),
  resolve(root, "data/processed/knowledge/chunks.json")
);
const retriever = new knowledge.HybridKnowledgeRetriever(repository.loadChunks());
const rules = qualification.loadBusinessRules(root);

test("deterministic qualification engine enforces all business rules", () => {
  // Missing consent
  const r1 = qualification.evaluate(qualification.emptyFields(), rules);
  assert.equal(r1.outcome, "needs_information");
  assert.deepEqual(r1.missing_fields, ["consent"]);

  // Incomplete fields
  const fields = {
    consent: true,
    business_age_months: 36,
    registration_status: "registered",
    monthly_revenue: null,
    requested_amount: null,
    intended_use: null,
    contact_preference: null,
  };
  const r2 = qualification.evaluate(fields, rules);
  assert.equal(r2.outcome, "needs_information");
  assert.ok(r2.missing_fields.includes("monthly_revenue"));

  // Failing criteria: low revenue
  const fieldsLowRev = {
    consent: true,
    business_age_months: 36,
    registration_status: "registered",
    monthly_revenue: 50000, // below 100,000 HSC
    requested_amount: 100000,
    intended_use: "equipment",
    contact_preference: "email",
  };
  const r3 = qualification.evaluate(fieldsLowRev, rules);
  assert.equal(r3.outcome, "preliminary_not_eligible");
  assert.ok(r3.failing_criteria.some((c) => c.includes("100,000 HSC")));

  // Failing criteria: operating age < 12 months
  const fieldsYoung = {
    ...fieldsLowRev,
    monthly_revenue: 150000,
    business_age_months: 6,
  };
  const r4 = qualification.evaluate(fieldsYoung, rules);
  assert.equal(r4.outcome, "preliminary_not_eligible");
  assert.ok(r4.failing_criteria.some((c) => c.includes("12 months")));

  // Eligible customer
  const fieldsEligible = {
    consent: true,
    business_age_months: 24,
    registration_status: "registered",
    monthly_revenue: 150000,
    requested_amount: 200000,
    intended_use: "equipment",
    contact_preference: "email",
  };
  const r5 = qualification.evaluate(fieldsEligible, rules);
  assert.equal(r5.outcome, "preliminary_eligible");
  assert.equal(r5.failing_criteria.length, 0);
  assert.ok(r5.disclaimer.includes("not an approval"));
});

test("natural-language extractor parses qualification fields accurately", () => {
  const extracted1 = qualification.extractFields(
    "Our business has been operating for 3 years, and we are registered in the Harbor Market."
  );
  assert.equal(extracted1.business_age_months, 36);
  assert.equal(extracted1.registration_status, "registered");

  const extracted2 = qualification.extractFields("Our average monthly revenue is 150,000 HSC.");
  assert.equal(extracted2.monthly_revenue, 150000);

  const extracted3 = qualification.extractFields(
    "We need 200,000 HSC to purchase equipment and prefer email contact."
  );
  assert.equal(extracted3.requested_amount, 200000);
  assert.equal(extracted3.intended_use, "equipment");
  assert.equal(extracted3.contact_preference, "email");
});

test("voice session scenario 1: qualified cooperative customer flow", () => {
  const session = new conversation.ConversationSession(rules, retriever);
  const start = session.start();
  assert.equal(start.state, "CONSENT");

  session.processMessage("Yes, I agree to proceed.");
  session.processMessage("Our business has been operating for 3 years, and we are registered in the Harbor Market.");
  session.processMessage("Our average monthly revenue is 150,000 HSC.");
  const res = session.processMessage(
    "We would like to request 200,000 HSC for equipment purchase, and email is best for contact."
  );

  assert.equal(res.state, "DETERMINE_QUALIFICATION");
  assert.equal(res.qualification?.outcome, "preliminary_eligible");
  assert.ok(res.agent_text.includes("preliminary qualification criteria"));
  assert.ok(res.agent_text.includes("This is not an approval"));
});

test("voice session scenario 2: incomplete information triggers prompt", () => {
  const session = new conversation.ConversationSession(rules, retriever);
  session.start();
  session.processMessage("Yes, I agree to proceed.");
  const res = session.processMessage("We have been operating for 3 years.");

  assert.equal(res.qualification?.outcome, "needs_information");
  assert.ok(res.agent_text.includes("I still need a few details before I can determine preliminary qualification."));
});

test("voice session scenario 3: conflicting information triggers clarification request", () => {
  const session = new conversation.ConversationSession(rules, retriever);
  session.start();
  session.processMessage("Yes, I agree to proceed.");
  session.processMessage("We have been operating for 3 years and are registered.");
  const res = session.processMessage("Actually, our business has only been running for 6 months.");

  assert.equal(res.qualification?.outcome, "needs_clarification");
  assert.ok(res.agent_text.includes("I have two different values for that information."));
  assert.ok(res.agent_text.includes("Could you clarify which one is correct?"));
});

test("voice session scenario 4: financial objection retrieves HSB-006 playbook", () => {
  const session = new conversation.ConversationSession(rules, retriever);
  session.start();
  session.processMessage("Yes, I agree to proceed.");
  const res = session.processMessage("I do not want to share my financial information.");

  assert.equal(res.kb_retrieval?.grounded, true);
  assert.equal(res.kb_retrieval?.source_document_id, "HSB-006");
  assert.ok(res.kb_retrieval?.confidence >= 0.72);
  assert.ok(res.agent_text.includes("Objection and Escalation Playbook"));
});

test("voice session scenario 5: unsupported question safely rejected via Q2 retriever", () => {
  const session = new conversation.ConversationSession(rules, retriever);
  session.start();
  session.processMessage("Yes, I agree to proceed.");
  const res = session.processMessage("Can you guarantee that my loan will be approved today?");

  assert.equal(res.kb_retrieval?.grounded, false);
  assert.equal(res.kb_retrieval?.fallback, true);
  assert.ok(res.agent_text.includes("I don't have enough information in my knowledge base to answer that accurately."));
});

test("voice session scenario 6: human assistance request triggers escalation", () => {
  const session = new conversation.ConversationSession(rules, retriever);
  session.start();
  session.processMessage("Yes, I agree to proceed.");
  const res = session.processMessage("Can I speak to a human representative?");

  assert.equal(res.state, "ESCALATION");
  assert.equal(res.escalation.triggered, true);
  assert.equal(res.escalation.reason, "human_assistance_requested");
  assert.ok(res.agent_text.includes("Sure. I'll mark this for human assistance."));
});

test("voice session pricing objection: retrieves HSB-004 pricing policy above threshold", () => {
  const session = new conversation.ConversationSession(rules, retriever);
  session.start();
  session.processMessage("Yes, I agree to proceed.");
  const res = session.processMessage("I am worried about the loan fees. What charges should I expect?");

  assert.equal(res.kb_retrieval?.grounded, true);
  assert.equal(res.kb_retrieval?.source_document_id, "HSB-004");
  assert.ok(res.kb_retrieval?.confidence >= 0.72);
  assert.equal(res.kb_retrieval?.fallback, false);
  assert.ok(res.agent_text.includes("Pricing and Disclosure Policy"));
});
