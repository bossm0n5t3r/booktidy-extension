import { describe, expect, it } from "vitest";
import { matchContains, normalizeText } from "../../src/content/rules/matcher";

describe("matcher", () => {
  it("normalizes whitespace and letter case", () => {
    expect(normalizeText("  Hello   BOOK  ")).toBe("hello book");
  });

  it("matches Korean publisher text with contains", () => {
    expect(matchContains("예시출판사 편집부", "예시출판사")).toBe(true);
  });

  it("rejects an empty normalized pattern", () => {
    expect(matchContains("Target", "   ")).toBe(false);
  });

  it("matches case-insensitively", () => {
    expect(matchContains("Case Insensitive", "case")).toBe(true);
  });
});
