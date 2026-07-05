interface ToggleEnabledProps {
  enabled: boolean;
  onToggle(enabled: boolean): void;
  disabled?: boolean;
}

export const ToggleEnabled = ({ enabled, onToggle, disabled }: ToggleEnabledProps) => {
  return (
    <label className="booktidy-toggle">
      <input
        type="checkbox"
        checked={enabled}
        disabled={disabled}
        onChange={(event) => onToggle(event.currentTarget.checked)}
      />
      <span className="booktidy-toggle-track" aria-hidden="true">
        <span className="booktidy-toggle-thumb" />
      </span>
      <span className="booktidy-toggle-copy">
        <strong>BookTidy</strong>
        <small>{enabled ? "필터링 활성화" : "필터링 꺼짐"}</small>
      </span>
    </label>
  );
};
