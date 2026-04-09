import { describe, expect, it } from "vitest";
import { GoogleAdapterError, executeWithRetry, isTransientGoogleError } from "@kharon/google";

describe("google adapter retry behavior", () => {
  it("retries transient failures and then succeeds", async () => {
    let attempts = 0;

    const value = await executeWithRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new GoogleAdapterError({
            message: "Transient API failure",
            code: "google_transient_error",
            service: "gmail",
            transient: true,
            status: 503
          });
        }
        return "ok";
      },
      {
        maxAttempts: 4,
        baseDelayMs: 1,
        maxDelayMs: 2,
        jitterRatio: 0,
        shouldRetry: (error) => isTransientGoogleError(error)
      }
    );

    expect(value).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry permanent failures", async () => {
    let attempts = 0;

    await expect(
      executeWithRetry(
        async () => {
          attempts += 1;
          throw new GoogleAdapterError({
            message: "Forbidden",
            code: "google_forbidden",
            service: "drive",
            transient: false,
            status: 403
          });
        },
        {
          maxAttempts: 4,
          shouldRetry: (error) => isTransientGoogleError(error)
        }
      )
    ).rejects.toThrow(/Forbidden/);

    expect(attempts).toBe(1);
  });
});
