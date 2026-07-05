import { describe, expect, it } from "vitest";
import { evaluateRules } from "../../src/content/rules/rule-engine";
import type { BookItem, FilterRule } from "../../src/content/rules/rule-types";

const createRule = (overrides: Partial<FilterRule>): FilterRule => {
  return {
    id: "rule-1",
    type: "publisher",
    value: "예시출판사",
    matchMode: "contains",
    enabled: true,
    createdAt: "2026-07-04T00:00:00.000Z",
    updatedAt: "2026-07-04T00:00:00.000Z",
    ...overrides,
  };
};

const createBook = (overrides: Partial<BookItem> = {}): BookItem => {
  return {
    id: "book-1",
    site: "kyobo",
    title: "테스트 도서",
    authors: ["홍길동"],
    publisher: "예시출판사",
    container: document.createElement("li"),
    ...overrides,
  };
};

describe("evaluateRules", () => {
  it("ignores disabled matching rules", () => {
    expect(evaluateRules(createBook(), [createRule({ enabled: false })])).toEqual({
      matched: false,
    });
  });

  it("returns publisher match reason", () => {
    const result = evaluateRules(createBook(), [createRule({ value: "예시출판사" })]);

    expect(result.matched).toBe(true);
    expect(result.reason).toBe('출판사 "예시출판사"');
  });

  it("returns author match reason", () => {
    const result = evaluateRules(createBook(), [createRule({ type: "author", value: "홍길동" })]);

    expect(result.matched).toBe(true);
    expect(result.reason).toBe('저자 "홍길동"');
  });

  it("does not match publisher rules when publisher is missing", () => {
    expect(
      evaluateRules(createBook({ publisher: undefined }), [createRule({ value: "예시출판사" })]),
    ).toEqual({
      matched: false,
    });
  });

  it("does not match author rules when authors are empty", () => {
    expect(
      evaluateRules(createBook({ authors: [] }), [createRule({ type: "author", value: "홍길동" })]),
    ).toEqual({
      matched: false,
    });
  });
});
