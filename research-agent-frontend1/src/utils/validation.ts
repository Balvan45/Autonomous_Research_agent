export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

// More than 6 chars, at least 1 lowercase, 1 uppercase, 1 number, 1 special character
export const passwordRules: PasswordRule[] = [
  { id: "length", label: "More than 6 characters", test: (v) => v.length > 6 },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "One special character (!@#$%^&*...)",
    test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(v),
  },
];

export function isPasswordValid(password: string): boolean {
  return passwordRules.every((rule) => rule.test(password));
}

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
