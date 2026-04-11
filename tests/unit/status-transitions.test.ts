import { describe, it, expect } from "vitest";
import { canTransitionStatus, ensureStatusTransition } from "@kharon/domain";

describe("Job Status Transitions", () => {
  it("allows valid transitions", () => {
    expect(canTransitionStatus("draft", "performed")).toBe(true);
    expect(canTransitionStatus("performed", "approved")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionStatus("draft", "certified")).toBe(false);
    expect(() => ensureStatusTransition("draft", "certified")).toThrowError(/Invalid status transition/);
  });
});
