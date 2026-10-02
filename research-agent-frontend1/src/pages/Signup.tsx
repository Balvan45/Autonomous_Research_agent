import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../utils/auth";
import { isEmailValid, isPasswordValid } from "../utils/validation";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && isEmailValid(email) && isPasswordValid(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please meet every password requirement before continuing.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(name.trim(), email, password);
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Create your account</h1>
      <p className="auth-sub">Set up access to your autonomous research agent.</p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
          />
        </div>

        <PasswordField
          value={password}
          onChange={setPassword}
          showRules
          autoComplete="new-password"
        />

        <button className="btn-primary" type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
