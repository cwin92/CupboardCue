import type { ReactNode } from "react";

type AuthFormProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  footer: ReactNode;
  error?: string;
};

export function AuthForm({ title, description, action, submitLabel, footer, error }: AuthFormProps) {
  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-kicker-row">
          <p className="auth-kicker">CupboardCue</p>
          <span className="auth-mark" aria-hidden="true" />
        </div>
        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <form action={action} className="stack-md auth-form-body">
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" placeholder="At least 6 characters" required minLength={6} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button button-primary" type="submit">
          {submitLabel}
        </button>
      </form>

      <div className="auth-footer auth-footer-content">{footer}</div>
    </div>
  );
}
