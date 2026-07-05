import { describe, expect, it } from "vitest";
import type { FilterRule } from "../../src/content/rules/rule-types";
import { DEFAULT_STORAGE, normalizeStorageSchema } from "../../src/content/storage/storage-schema";

const validRule: FilterRule = {
  id: "rule-1",
  type: "publisher",
  value: "예시출판사",
  matchMode: "contains",
  enabled: true,
  createdAt: "2026-07-04T00:00:00.000Z",
  updatedAt: "2026-07-04T00:00:00.000Z",
};

describe("storage schema", () => {
  it("defines the default storage schema", () => {
    expect(DEFAULT_STORAGE).toEqual({
      version: 1,
      filterRules: [],
      settings: { enabled: true, theme: "light" },
    });
  });

  it("fills missing keys with defaults", () => {
    expect(normalizeStorageSchema({})).toEqual(DEFAULT_STORAGE);
  });

  it("removes invalid rules and preserves valid rules", () => {
    const normalized = normalizeStorageSchema({
      version: 9,
      filterRules: [validRule, { ...validRule, id: 123 }, { ...validRule, matchMode: "regex" }],
      settings: { enabled: false, theme: "dark" },
    });

    expect(normalized).toEqual({
      version: 1,
      filterRules: [validRule],
      settings: { enabled: false, theme: "dark" },
    });
  });

  it("fills missing settings fields with defaults", () => {
    expect(normalizeStorageSchema({ settings: { enabled: false } })).toEqual({
      version: 1,
      filterRules: [],
      settings: { enabled: false, theme: "light" },
    });
  });
});
