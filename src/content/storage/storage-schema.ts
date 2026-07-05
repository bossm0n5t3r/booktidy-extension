import type { FilterRule, StorageSchema, ThemeMode, UserSettings } from "../rules/rule-types";

export const DEFAULT_STORAGE: StorageSchema = {
  version: 1,
  filterRules: [],
  settings: { enabled: true, theme: "light" },
};

export const STORAGE_KEYS = {
  FILTER_RULES: "filterRules",
  SETTINGS: "settings",
  VERSION: "version",
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object";
};

const isRuleType = (value: unknown): value is FilterRule["type"] => {
  return value === "publisher" || value === "author" || value === "title";
};

const isMatchMode = (value: unknown): value is FilterRule["matchMode"] => {
  return value === "contains";
};

const isThemeMode = (value: unknown): value is ThemeMode => {
  return value === "light" || value === "dark";
};

export const isValidFilterRule = (value: unknown): value is FilterRule => {
  if (!isRecord(value)) {
    return false;
  }

  const { id, type, value: ruleValue, matchMode, enabled, createdAt, updatedAt } = value;

  return (
    typeof id === "string" &&
    isRuleType(type) &&
    typeof ruleValue === "string" &&
    isMatchMode(matchMode) &&
    typeof enabled === "boolean" &&
    typeof createdAt === "string" &&
    typeof updatedAt === "string"
  );
};

export const isValidSettings = (value: unknown): value is UserSettings => {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.enabled === "boolean";
};

export const normalizeStorageSchema = (
  value: Partial<StorageSchema> | Record<string, unknown> | undefined,
): StorageSchema => {
  const source: Record<string, unknown> = isRecord(value) ? value : {};
  const rawRules = source.filterRules;
  const rawSettings = source.settings;

  return {
    version: 1,
    filterRules: Array.isArray(rawRules) ? rawRules.filter(isValidFilterRule) : [],
    settings: isValidSettings(rawSettings)
      ? {
          enabled: rawSettings.enabled,
          theme: isThemeMode(rawSettings.theme)
            ? rawSettings.theme
            : DEFAULT_STORAGE.settings.theme,
        }
      : DEFAULT_STORAGE.settings,
  };
};
