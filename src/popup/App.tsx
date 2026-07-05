import { useEffect, useState } from "react";
import type {
  FilterRule,
  RuleType,
  StorageSchema,
  ThemeMode,
  UserSettings,
} from "../content/rules/rule-types";
import { RuleForm } from "./components/RuleForm";
import { RuleList } from "./components/RuleList";
import { ToggleEnabled } from "./components/ToggleEnabled";

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

const normalizeText = (value: string): string => {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

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

const normalizeStorageSchema = (value: Record<string, unknown>): StorageSchema => {
  const rawRules = value.filterRules;
  const rawSettings = value.settings;

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

const getSchema = async () => {
  const value = await browser.storage.local.get([
    STORAGE_KEYS.VERSION,
    STORAGE_KEYS.FILTER_RULES,
    STORAGE_KEYS.SETTINGS,
  ]);

  return normalizeStorageSchema(value);
};

const setFilterRules = async (rules: FilterRule[]): Promise<void> => {
  await browser.storage.local.set({ [STORAGE_KEYS.FILTER_RULES]: rules });
};

const setSettings = async (settings: UserSettings): Promise<void> => {
  await browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
};

const reloadActiveTab = async (): Promise<void> => {
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (typeof activeTab?.id !== "number") {
    throw new Error("No active tab to reload.");
  }

  await browser.tabs.reload(activeTab.id);
};

const validateRule = (type: RuleType, value: string, rules: FilterRule[]): string | null => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return "규칙 값을 입력하세요.";
  }

  if (trimmedValue.length > 100) {
    return "규칙 값은 100자 이하로 입력하세요.";
  }

  const normalizedValue = normalizeText(trimmedValue);
  const hasDuplicate = rules.some(
    (rule) => rule.type === type && normalizeText(rule.value) === normalizedValue,
  );

  if (hasDuplicate) {
    return "이미 등록된 규칙입니다.";
  }

  return null;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_STORAGE.settings);
  const [filterRules, setFilterRulesState] = useState<FilterRule[]>(DEFAULT_STORAGE.filterRules);

  useEffect(() => {
    let isMounted = true;

    getSchema()
      .then((schema) => {
        if (!isMounted) {
          return;
        }

        setSettingsState(schema.settings);
        setFilterRulesState(schema.filterRules);
        setErrorMessage(null);
        setStatusMessage(null);
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("저장소를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = async (enabled: boolean): Promise<void> => {
    const previousSettings = settings;
    const nextSettings: UserSettings = { ...settings, enabled };

    setSettingsState(nextSettings);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await setSettings(nextSettings);
    } catch {
      setSettingsState(previousSettings);
      setErrorMessage("설정을 저장하지 못했습니다.");
    }
  };

  const handleThemeChange = async (theme: ThemeMode): Promise<void> => {
    const previousSettings = settings;
    const nextSettings: UserSettings = { ...settings, theme };

    setSettingsState(nextSettings);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await setSettings(nextSettings);
    } catch {
      setSettingsState(previousSettings);
      setErrorMessage("테마 설정을 저장하지 못했습니다.");
    }
  };

  const handleAddRule = async (type: RuleType, rawValue: string): Promise<void> => {
    const validationError = validateRule(type, rawValue, filterRules);

    if (validationError) {
      setErrorMessage(validationError);
      setStatusMessage(null);
      return;
    }

    const now = new Date().toISOString();
    const nextRule: FilterRule = {
      id: crypto.randomUUID(),
      type,
      value: rawValue.trim(),
      matchMode: "contains",
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    const previousRules = filterRules;
    const nextRules = [...filterRules, nextRule];

    setFilterRulesState(nextRules);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await setFilterRules(nextRules);
      setStatusMessage("규칙이 저장되었습니다. 새로고침하면 현재 페이지에 적용됩니다.");
    } catch {
      setFilterRulesState(previousRules);
      setErrorMessage("규칙을 저장하지 못했습니다.");
    }
  };

  const handleDeleteRule = async (id: string): Promise<void> => {
    const previousRules = filterRules;
    const nextRules = filterRules.filter((rule) => rule.id !== id);

    setFilterRulesState(nextRules);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await setFilterRules(nextRules);
    } catch {
      setFilterRulesState(previousRules);
      setErrorMessage("규칙을 삭제하지 못했습니다.");
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await reloadActiveTab();
    } catch {
      setErrorMessage("현재 탭을 새로고침하지 못했습니다.");
    }
  };

  return (
    <main className="booktidy-popup" data-theme={settings.theme}>
      <header className="booktidy-header">
        <div className="booktidy-brand-mark" aria-hidden="true">
          <img src="/booktidy-icon.svg" alt="" />
        </div>
        <div>
          <h1>BookTidy</h1>
          <p>교보문고 검색 결과를 출판사와 저자 규칙으로 정리합니다.</p>
        </div>
      </header>

      <section className="booktidy-panel booktidy-controls" aria-label="활성화 및 테마 설정">
        <ToggleEnabled
          enabled={settings.enabled}
          onToggle={(enabled) => void handleToggle(enabled)}
          disabled={isLoading}
        />
        <div className="booktidy-theme-toggle" aria-label="테마 선택">
          <button
            type="button"
            className={settings.theme === "light" ? "is-active" : undefined}
            disabled={isLoading}
            onClick={() => void handleThemeChange("light")}
          >
            Light
          </button>
          <button
            type="button"
            className={settings.theme === "dark" ? "is-active" : undefined}
            disabled={isLoading}
            onClick={() => void handleThemeChange("dark")}
          >
            Dark
          </button>
        </div>
      </section>

      <section className="booktidy-panel" aria-label="필터 추가">
        <div className="booktidy-section-heading">
          <h2>필터 추가</h2>
          <span>{filterRules.length}개 등록됨</span>
        </div>
        <RuleForm rules={filterRules} onAdd={handleAddRule} disabled={isLoading} />
      </section>

      <section className="booktidy-panel" aria-label="필터 목록">
        <div className="booktidy-section-heading">
          <h2>등록된 필터</h2>
        </div>
        <RuleList rules={filterRules} onDelete={handleDeleteRule} disabled={isLoading} />
      </section>

      <button
        type="button"
        className="booktidy-refresh-button"
        disabled={isLoading}
        onClick={() => void handleRefresh()}
      >
        현재 페이지 새로고침
      </button>

      {errorMessage ? (
        <p className="booktidy-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? <p className="booktidy-status">{statusMessage}</p> : null}
      {isLoading ? <p className="booktidy-empty">저장소를 불러오는 중입니다.</p> : null}
    </main>
  );
};

export default App;
