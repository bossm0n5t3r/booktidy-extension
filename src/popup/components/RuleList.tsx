import type { FilterRule } from "../../content/rules/rule-types";

interface RuleListProps {
  rules: FilterRule[];
  onDelete(id: string): Promise<void>;
  disabled?: boolean;
}

const getRuleTypeLabel = (rule: FilterRule): string => {
  return rule.type === "publisher" ? "출판사" : "저자";
};

export const RuleList = ({ rules, onDelete, disabled }: RuleListProps) => {
  if (rules.length === 0) {
    return <p className="booktidy-empty">등록된 규칙이 없습니다.</p>;
  }

  return (
    <ul className="booktidy-rule-list">
      {rules.map((rule) => (
        <li key={rule.id} className="booktidy-rule-item">
          <span className="booktidy-rule-chip">{getRuleTypeLabel(rule)}</span>
          <span className="booktidy-rule-value">{rule.value}</span>
          <button
            type="button"
            className="booktidy-delete-button"
            disabled={disabled}
            onClick={() => void onDelete(rule.id)}
            aria-label={`${getRuleTypeLabel(rule)} ${rule.value} 삭제`}
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
};
