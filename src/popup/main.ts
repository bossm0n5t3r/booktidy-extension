import type {
  FilterRule,
  RuleType,
  StorageSchema,
  ThemeMode,
  UserSettings,
} from "../content/rules/rule-types";
import "../index.css";

interface PopupState {
  isLoading: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
  settings: UserSettings;
  filterRules: FilterRule[];
  form: {
    type: RuleType;
    value: string;
    validationMessage: string | null;
  };
}

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
    (type === "publisher" || type === "author" || type === "title") &&
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

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Popup root element is missing.");
}

const popupRoot = rootElement;

let state: PopupState = {
  isLoading: true,
  errorMessage: null,
  statusMessage: null,
  settings: DEFAULT_STORAGE.settings,
  filterRules: DEFAULT_STORAGE.filterRules,
  form: {
    type: "publisher",
    value: "",
    validationMessage: null,
  },
};

const normalizeText = (value: string): string => {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const getRuleTypeLabel = (type: RuleType): string => {
  if (type === "publisher") {
    return "출판사";
  }

  if (type === "author") {
    return "저자";
  }

  return "제목";
};

const getRulePlaceholder = (type: RuleType): string => {
  if (type === "publisher") {
    return "예: 예시출판사";
  }

  if (type === "author") {
    return "예: 홍길동";
  }

  return "예: 도서 제목";
};

const isRuleType = (value: string): value is RuleType => {
  return value === "publisher" || value === "author" || value === "title";
};

const setState = (patch: Partial<PopupState>): void => {
  state = { ...state, ...patch };
  render();
};

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  return element;
};

const createTextElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  text: string,
  className?: string,
): HTMLElementTagNameMap[K] => {
  const element = createElement(tagName, className);
  element.textContent = text;
  return element;
};

const getSchema = async () => {
  const value = await browser.storage.local.get([
    STORAGE_KEYS.VERSION,
    STORAGE_KEYS.FILTER_RULES,
    STORAGE_KEYS.SETTINGS,
  ]);

  return normalizeStorageSchema(value);
};

const saveFilterRules = async (rules: FilterRule[]): Promise<void> => {
  await browser.storage.local.set({ [STORAGE_KEYS.FILTER_RULES]: rules });
};

const saveSettings = async (settings: UserSettings): Promise<void> => {
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

const handleToggle = async (enabled: boolean): Promise<void> => {
  const previousSettings = state.settings;
  const nextSettings: UserSettings = { ...state.settings, enabled };

  setState({ settings: nextSettings, errorMessage: null, statusMessage: null });

  try {
    await saveSettings(nextSettings);
  } catch {
    setState({ settings: previousSettings, errorMessage: "설정을 저장하지 못했습니다." });
  }
};

const handleThemeChange = async (theme: ThemeMode): Promise<void> => {
  const previousSettings = state.settings;
  const nextSettings: UserSettings = { ...state.settings, theme };

  setState({ settings: nextSettings, errorMessage: null, statusMessage: null });

  try {
    await saveSettings(nextSettings);
  } catch {
    setState({ settings: previousSettings, errorMessage: "테마 설정을 저장하지 못했습니다." });
  }
};

const handleAddRule = async (type: RuleType, rawValue: string): Promise<void> => {
  const validationError = validateRule(type, rawValue, state.filterRules);

  if (validationError) {
    setState({
      errorMessage: validationError,
      statusMessage: null,
      form: { type, value: rawValue, validationMessage: validationError },
    });
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
  const previousRules = state.filterRules;
  const nextRules = [...state.filterRules, nextRule];

  setState({
    filterRules: nextRules,
    errorMessage: null,
    statusMessage: null,
    form: { type, value: "", validationMessage: null },
  });

  try {
    await saveFilterRules(nextRules);
    setState({ statusMessage: "규칙이 저장되었습니다. 새로고침하면 현재 페이지에 적용됩니다." });
  } catch {
    setState({ filterRules: previousRules, errorMessage: "규칙을 저장하지 못했습니다." });
  }
};

const handleDeleteRule = async (id: string): Promise<void> => {
  const previousRules = state.filterRules;
  const nextRules = state.filterRules.filter((rule) => rule.id !== id);

  setState({ filterRules: nextRules, errorMessage: null, statusMessage: null });

  try {
    await saveFilterRules(nextRules);
  } catch {
    setState({ filterRules: previousRules, errorMessage: "규칙을 삭제하지 못했습니다." });
  }
};

const handleRefresh = async (): Promise<void> => {
  setState({ errorMessage: null, statusMessage: null });

  try {
    await reloadActiveTab();
  } catch {
    setState({ errorMessage: "현재 탭을 새로고침하지 못했습니다." });
  }
};

const createToggle = (): HTMLLabelElement => {
  const label = createElement("label", "booktidy-toggle");
  const input = createElement("input");
  input.type = "checkbox";
  input.checked = state.settings.enabled;
  input.disabled = state.isLoading;
  input.addEventListener("change", () => {
    void handleToggle(input.checked);
  });

  const track = createElement("span", "booktidy-toggle-track");
  track.setAttribute("aria-hidden", "true");
  track.append(createElement("span", "booktidy-toggle-thumb"));

  const copy = createElement("span", "booktidy-toggle-copy");
  copy.append(
    createTextElement("strong", "BookTidy"),
    createTextElement("small", state.settings.enabled ? "필터링 활성화" : "필터링 꺼짐"),
  );

  label.append(input, track, copy);
  return label;
};

const createThemeButton = (theme: ThemeMode, label: string): HTMLButtonElement => {
  const button = createTextElement("button", label);
  button.type = "button";
  button.disabled = state.isLoading;

  if (state.settings.theme === theme) {
    button.className = "is-active";
  }

  button.addEventListener("click", () => {
    void handleThemeChange(theme);
  });

  return button;
};

const createRuleForm = (): HTMLFormElement => {
  const form = createElement("form", "booktidy-rule-form");
  const row = createElement("div", "booktidy-form-row");
  const select = createElement("select");
  select.disabled = state.isLoading;
  select.setAttribute("aria-label", "규칙 유형");

  for (const type of ["publisher", "author", "title"] satisfies RuleType[]) {
    const option = createTextElement("option", getRuleTypeLabel(type));
    option.value = type;
    option.selected = state.form.type === type;
    select.append(option);
  }

  select.addEventListener("change", () => {
    if (isRuleType(select.value)) {
      setState({ form: { ...state.form, type: select.value, validationMessage: null } });
    }
  });

  const input = createElement("input");
  input.type = "text";
  input.value = state.form.value;
  input.disabled = state.isLoading;
  input.maxLength = 100;
  input.placeholder = getRulePlaceholder(state.form.type);
  input.setAttribute("aria-label", "규칙 값");

  const submitButton = createTextElement("button", "필터 등록", "booktidy-add-button");
  submitButton.type = "submit";
  submitButton.disabled = state.isLoading;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!isRuleType(select.value)) {
      setState({ errorMessage: "규칙 유형을 선택하세요.", statusMessage: null });
      return;
    }

    void handleAddRule(select.value, input.value);
  });

  row.append(select, input, submitButton);
  form.append(row);

  if (state.form.validationMessage) {
    form.append(createTextElement("p", state.form.validationMessage, "booktidy-error"));
  }

  return form;
};

const createRuleList = (): HTMLElement => {
  if (state.filterRules.length === 0) {
    return createTextElement("p", "등록된 규칙이 없습니다.", "booktidy-empty");
  }

  const list = createElement("ul", "booktidy-rule-list");

  for (const rule of state.filterRules) {
    const item = createElement("li", "booktidy-rule-item");
    const ruleLabel = getRuleTypeLabel(rule.type);
    const deleteButton = createTextElement("button", "삭제", "booktidy-delete-button");
    deleteButton.type = "button";
    deleteButton.disabled = state.isLoading;
    deleteButton.setAttribute("aria-label", `${ruleLabel} ${rule.value} 삭제`);
    deleteButton.addEventListener("click", () => {
      void handleDeleteRule(rule.id);
    });

    item.append(
      createTextElement("span", ruleLabel, "booktidy-rule-chip"),
      createTextElement("span", rule.value, "booktidy-rule-value"),
      deleteButton,
    );
    list.append(item);
  }

  return list;
};

const createHeader = (): HTMLElement => {
  const header = createElement("header", "booktidy-header");
  const brandMark = createElement("div", "booktidy-brand-mark");
  brandMark.setAttribute("aria-hidden", "true");

  const icon = createElement("img");
  icon.src = "/booktidy-icon.svg";
  icon.alt = "";
  brandMark.append(icon);

  const copy = createElement("div");
  copy.append(
    createTextElement("h1", "BookTidy"),
    createTextElement("p", "도서 검색 결과를 출판사, 저자, 제목 규칙으로 정리합니다."),
  );

  header.append(brandMark, copy);
  return header;
};

const createControlsSection = (): HTMLElement => {
  const section = createElement("section", "booktidy-panel booktidy-controls");
  section.setAttribute("aria-label", "활성화 및 테마 설정");

  const themeToggle = createElement("div", "booktidy-theme-toggle");
  themeToggle.setAttribute("aria-label", "테마 선택");
  themeToggle.append(createThemeButton("light", "Light"), createThemeButton("dark", "Dark"));

  section.append(createToggle(), themeToggle);
  return section;
};

const createRuleFormSection = (): HTMLElement => {
  const section = createElement("section", "booktidy-panel");
  section.setAttribute("aria-label", "필터 추가");

  const heading = createElement("div", "booktidy-section-heading");
  heading.append(
    createTextElement("h2", "필터 추가"),
    createTextElement("span", `${state.filterRules.length}개 등록됨`),
  );

  section.append(heading, createRuleForm());
  return section;
};

const createRuleListSection = (): HTMLElement => {
  const section = createElement("section", "booktidy-panel");
  section.setAttribute("aria-label", "필터 목록");

  const heading = createElement("div", "booktidy-section-heading");
  heading.append(createTextElement("h2", "등록된 필터"));

  section.append(heading, createRuleList());
  return section;
};

function render(): void {
  const main = createElement("main", "booktidy-popup");
  main.dataset.theme = state.settings.theme;
  main.append(
    createHeader(),
    createControlsSection(),
    createRuleFormSection(),
    createRuleListSection(),
  );

  const refreshButton = createTextElement(
    "button",
    "현재 페이지 새로고침",
    "booktidy-refresh-button",
  );
  refreshButton.type = "button";
  refreshButton.disabled = state.isLoading;
  refreshButton.addEventListener("click", () => {
    void handleRefresh();
  });
  main.append(refreshButton);

  if (state.errorMessage) {
    const error = createTextElement("p", state.errorMessage, "booktidy-error");
    error.setAttribute("role", "alert");
    main.append(error);
  }

  if (state.statusMessage) {
    main.append(createTextElement("p", state.statusMessage, "booktidy-status"));
  }

  if (state.isLoading) {
    main.append(createTextElement("p", "저장소를 불러오는 중입니다.", "booktidy-empty"));
  }

  popupRoot.replaceChildren(main);
}

const initialize = async (): Promise<void> => {
  render();

  try {
    const schema = await getSchema();
    setState({
      settings: schema.settings,
      filterRules: schema.filterRules,
      errorMessage: null,
      statusMessage: null,
    });
  } catch {
    setState({ errorMessage: "저장소를 불러오지 못했습니다." });
  } finally {
    setState({ isLoading: false });
  }
};

void initialize();
