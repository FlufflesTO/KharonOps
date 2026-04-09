import { describe, expect, it } from "vitest";
import { canTransitionStatus, ensureStatusTransition } from "@kharon/domain";

describe("status transitions", () => {
  it("accepts valid transition path", () => {
    expect(canTransitionStatus("assigned", "en_route")).toBe(true);
    expect(canTransitionStatus("on_site", "completed")).toBe(true);
  });

  it("rejects invalid transition", () => {
    expect(canTransitionStatus("open", "completed")).toBe(false);
    expect(() => ensureStatusTransition("open", "completed")).toThrowError(/Invalid status transition/);
  });
});
