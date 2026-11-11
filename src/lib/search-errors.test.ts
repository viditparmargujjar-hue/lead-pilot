import { describe, expect, it } from "vitest";
import { describeSearchError } from "./search-errors";
const e = (status: number) => Object.assign(new Error("x"), { status });
describe("describeSearchError", () => {
  it("network errors are retryable", () => expect(describeSearchError(new TypeError("fetch")).title).toBe("Connection problem"));
  it("auth errors are not retryable", () => expect(describeSearchError(e(401)).retry).toBe(false));
  it("rate limits are retryable", () => expect(describeSearchError(e(429)).title).toBe("Too many requests"));
  it("server errors map to unavailable", () => expect(describeSearchError(e(503)).title).toBe("AI service unavailable"));
});
