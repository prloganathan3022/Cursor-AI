import { type FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { validateRegister, type RegisterFieldErrors } from "../lib/validation";

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nextErrors = validateRegister({
      name,
      email,
      password,
      confirmPassword,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (!result.ok) setFormError(result.message);
  }

  return (
    <AppShell showNav={false}>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Create account
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Password must be at least 8 characters and include upper, lower, and a
          number.
        </p>

        <form
          data-testid="register-form"
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          noValidate
        >
          {formError && (
            <div
              role="alert"
              data-testid="register-form-error"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="register-name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Full name
            </label>
            <input
              id="register-name"
              data-testid="register-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "register-name-error" : undefined}
            />
            {errors.name && (
              <p
                id="register-name-error"
                data-testid="register-name-field-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <input
              id="register-email"
              data-testid="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
            />
            {errors.email && (
              <p
                id="register-email-error"
                data-testid="register-email-field-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="register-password"
              data-testid="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "register-password-error" : undefined
              }
            />
            {errors.password && (
              <p
                id="register-password-error"
                data-testid="register-password-field-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="register-confirm"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Confirm password
            </label>
            <input
              id="register-confirm"
              data-testid="register-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "register-confirm-error" : undefined
              }
            />
            {errors.confirmPassword && (
              <p
                id="register-confirm-error"
                data-testid="register-confirm-field-error"
                className="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            data-testid="register-submit"
            disabled={submitting}
            className="flex w-full justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:hover:bg-violet-400"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              data-testid="link-login"
              className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </AppShell>
  );
}
