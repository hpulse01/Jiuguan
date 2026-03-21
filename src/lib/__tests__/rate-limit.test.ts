import { describe, it, expect } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, { limit: 5, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks remaining count correctly", () => {
    const key = `test-count-${Date.now()}`;
    const config = { limit: 3, windowSeconds: 60 };

    rateLimit(key, config);
    rateLimit(key, config);
    const result = rateLimit(key, config);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks requests exceeding limit", () => {
    const key = `test-block-${Date.now()}`;
    const config = { limit: 2, windowSeconds: 60 };

    rateLimit(key, config);
    rateLimit(key, config);
    const result = rateLimit(key, config);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("uses separate counters for different keys", () => {
    const key1 = `test-sep1-${Date.now()}`;
    const key2 = `test-sep2-${Date.now()}`;
    const config = { limit: 1, windowSeconds: 60 };

    rateLimit(key1, config);
    const result = rateLimit(key2, config);

    expect(result.success).toBe(true);
  });

  it("returns correct limit value", () => {
    const key = `test-limit-${Date.now()}`;
    const result = rateLimit(key, { limit: 10, windowSeconds: 60 });
    expect(result.limit).toBe(10);
  });
});
