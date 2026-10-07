import { describe, expect, test } from "bun:test";
import { isRetryableGeminiError, isUnavailableGeminiModelError, withGeminiRetry } from "../../chatbot.ts";

describe("Gemini transient error handling", () => {
  test("recognizes provider availability and quota errors", () => {
    expect(isRetryableGeminiError({ status: 503 })).toBe(true);
    expect(isRetryableGeminiError({ status: 429 })).toBe(true);
    expect(isRetryableGeminiError({ status: 400 })).toBe(false);
    expect(isUnavailableGeminiModelError({ status: 404 })).toBe(true);
  });

  test("retries a transient error and returns the successful result", async () => {
    let attempts = 0;
    const result = await withGeminiRetry(async () => {
      attempts++;
      if (attempts === 1) throw { status: 503 };
      return "ok";
    }, [0]);

    expect(result).toBe("ok");
    expect(attempts).toBe(2);
  });

  test("does not retry non-transient errors", async () => {
    let attempts = 0;
    const operation = withGeminiRetry(async () => {
      attempts++;
      throw { status: 400 };
    }, [0]);

    await expect(operation).rejects.toMatchObject({ status: 400 });
    expect(attempts).toBe(1);
  });
});
