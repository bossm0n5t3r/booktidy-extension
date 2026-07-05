import type { FormEvent } from "react";
import { useState } from "react";
import type { FilterRule, RuleType } from "../../content/rules/rule-types";

interface RuleFormProps {
  rules: FilterRule[];
  onAdd(type: RuleType, value: string): Promise<void>;
  disabled?: boolean;
}

const normalizeText = (value: string): string => {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
};

const isRuleType = (value: string): value is RuleType => {
  return value === "publisher" || value === "author";
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

export const RuleForm = ({ rules, onAdd, disabled }: RuleFormProps) => {
  const [type, setType] = useState<RuleType>("publisher");
  const [value, setValue] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const validationError = validateRule(type, value, rules);

    if (validationError) {
      setValidationMessage(validationError);
      return;
    }

    const trimmedValue = value.trim();
    setValidationMessage(null);
    void onAdd(type, trimmedValue).then(() => {
      setValue("");
    });
  };

  return (
    <form className="booktidy-rule-form" onSubmit={handleSubmit}>
      <div className="booktidy-form-row">
        <select
          value={type}
          disabled={disabled}
          onChange={(event) => {
            const nextType = event.currentTarget.value;

            if (isRuleType(nextType)) {
              setType(nextType);
            }
          }}
          aria-label="규칙 유형"
        >
          <option value="publisher">출판사</option>
          <option value="author">저자</option>
        </select>
        <input
          type="text"
          value={value}
          disabled={disabled}
          maxLength={100}
          placeholder="예: AI"
          onChange={(event) => setValue(event.currentTarget.value)}
          aria-label="규칙 값"
        />
        <button type="submit" disabled={disabled} className="booktidy-add-button">
          필터 등록
        </button>
      </div>
      {validationMessage ? <p className="booktidy-error">{validationMessage}</p> : null}
    </form>
  );
};
