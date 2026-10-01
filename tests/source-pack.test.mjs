import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

test("synthetic source pack validates", () => {
  const output = execFileSync(process.execPath, ["scripts/validate-source-pack.mjs"], { encoding: "utf8" });
  assert.match(output, /Source-pack validation passed for 13 documents/);
});
