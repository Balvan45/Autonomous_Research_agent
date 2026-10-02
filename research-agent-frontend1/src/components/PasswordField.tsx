import { useState } from "react";
import { passwordRules } from "../utils/validation";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  showRules?: boolean;
  autoComplete?: string;
}

export default function PasswordField({
  value,
  onChange,
  label = "Password",
  showRules = false,
  autoComplete = "current-password",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor="password">{label}</label>
      <div className="password-input-wrap">
        <input
          id="password"
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>

      {showRules && (
        <ul className="rule-list">
          {passwordRules.map((rule) => {
            const met = rule.test(value);
            return (
              <li key={rule.id} className={met ? "met" : ""}>
                <span className="mark">{met ? "✓" : ""}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
