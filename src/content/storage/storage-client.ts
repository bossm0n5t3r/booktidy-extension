import type { FilterRule, StorageSchema, UserSettings } from "../rules/rule-types";
import { normalizeStorageSchema, STORAGE_KEYS } from "./storage-schema";

export interface StorageClient {
  getSchema(): Promise<StorageSchema>;
  setFilterRules(rules: FilterRule[]): Promise<void>;
  setSettings(settings: UserSettings): Promise<void>;
}

declare global {
  interface Window {
    __BOOKTIDY_TEST_STATE__?: StorageSchema;
  }
}

export const storageClient: StorageClient = {
  async getSchema(): Promise<StorageSchema> {
    if (window.__BOOKTIDY_TEST_STATE__) {
      return normalizeStorageSchema(window.__BOOKTIDY_TEST_STATE__);
    }

    const value = await browser.storage.local.get([
      STORAGE_KEYS.VERSION,
      STORAGE_KEYS.FILTER_RULES,
      STORAGE_KEYS.SETTINGS,
    ]);

    return normalizeStorageSchema(value);
  },

  async setFilterRules(rules: FilterRule[]): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.FILTER_RULES]: rules });
  },

  async setSettings(settings: UserSettings): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  },
};
