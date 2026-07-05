export type SupportedSite = "kyobo";

export type RuleType = "publisher" | "author";

export type MatchMode = "contains";

export type ThemeMode = "light" | "dark";

export interface FilterRule {
  id: string;
  type: RuleType;
  value: string;
  matchMode: MatchMode;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookItem {
  id: string;
  site: SupportedSite;
  title: string;
  authors: string[];
  publisher?: string;
  container: HTMLElement;
}

export interface UserSettings {
  enabled: boolean;
  theme: ThemeMode;
}

export interface StorageSchema {
  version: 1;
  filterRules: FilterRule[];
  settings: UserSettings;
}

export interface FilterResult {
  matched: boolean;
  rule?: FilterRule;
  reason?: string;
}
