/**
 * Phase 1 placeholder entry point. HTTP routes are intentionally deferred.
 */
import { SAFETY_POLICY } from "../../../packages/shared/src/index.js";

export function getFoundationStatus() {
  return {
    status: "foundation-only",
    syntheticMode: SAFETY_POLICY.syntheticMode,
    groundedAnsweringRequired: SAFETY_POLICY.groundedAnsweringRequired
  };
}
