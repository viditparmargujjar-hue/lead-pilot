import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { CompareProvider, MAX_COMPARE, useCompare } from "./compare";
beforeEach(() => localStorage.clear());
it("allows five real companies and refuses a sixth", () => {
  expect(MAX_COMPARE).toBe(5);
  const { result } = renderHook(() => useCompare(), { wrapper: CompareProvider });
  for (let i = 0; i < 5; i++) act(() => { expect(result.current.toggle(`live:company${i}.test`)).toBe("added"); });
  act(() => { expect(result.current.toggle("live:sixth.test")).toBe("full"); });
  expect(result.current.ids).toHaveLength(5);
});
it("removal makes room for a replacement", () => {
  const { result } = renderHook(() => useCompare(), { wrapper: CompareProvider });
  for (let i = 0; i < 5; i++) act(() => { result.current.toggle(`live:company${i}.test`); });
  act(() => result.current.remove("live:company0.test"));
  act(() => { expect(result.current.toggle("live:replacement.test")).toBe("added"); });
  expect(result.current.ids).toContain("live:replacement.test");
});