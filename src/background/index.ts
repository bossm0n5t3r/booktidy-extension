import type { FilterRule, StorageSchema, ThemeMode } from "../content/rules/rule-types";

const DEFAULT_STORAGE: StorageSchema = {
  version: 1,
  filterRules: [],
  settings: { enabled: true, theme: "light" },
};

const STORAGE_KEYS = {
  FILTER_RULES: "filterRules",
  SETTINGS: "settings",
  VERSION: "version",
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object";
};

const isValidFilterRule = (value: unknown): value is FilterRule => {
  if (!isRecord(value)) {
    return false;
  }

  const { id, type, value: ruleValue, matchMode, enabled, createdAt, updatedAt } = value;

  return (
    typeof id === "string" &&
    (type === "publisher" || type === "author") &&
    typeof ruleValue === "string" &&
    matchMode === "contains" &&
    typeof enabled === "boolean" &&
    typeof createdAt === "string" &&
    typeof updatedAt === "string"
  );
};

const isThemeMode = (value: unknown): value is ThemeMode => {
  return value === "light" || value === "dark";
};

const isValidSettings = (value: unknown): value is { enabled: boolean; theme?: unknown } => {
  return isRecord(value) && typeof value.enabled === "boolean";
};

const isValidFilterRules = (value: unknown): boolean => {
  return Array.isArray(value) && value.every(isValidFilterRule);
};

const normalizeStorageSchema = (value: Record<string, unknown>): StorageSchema => {
  const rawSettings = value.settings;

  return {
    version: 1,
    filterRules: isValidFilterRules(value.filterRules) ? (value.filterRules as FilterRule[]) : [],
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

const initializeStorage = async (): Promise<void> => {
  const existing = await browser.storage.local.get([
    STORAGE_KEYS.VERSION,
    STORAGE_KEYS.FILTER_RULES,
    STORAGE_KEYS.SETTINGS,
  ]);
  const normalized = normalizeStorageSchema(existing);
  const patch: Partial<Record<(typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], unknown>> = {};

  if (existing.version !== normalized.version) {
    patch[STORAGE_KEYS.VERSION] = normalized.version;
  }

  if (!isValidFilterRules(existing.filterRules)) {
    patch[STORAGE_KEYS.FILTER_RULES] = normalized.filterRules;
  }

  if (JSON.stringify(existing.settings) !== JSON.stringify(normalized.settings)) {
    patch[STORAGE_KEYS.SETTINGS] = normalized.settings;
  }

  if (Object.keys(patch).length > 0) {
    await browser.storage.local.set(patch);
  }
};

browser.runtime.onInstalled.addListener(() => {
  void initializeStorage();
});
