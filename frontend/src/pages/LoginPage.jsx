import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { useLanguage } from "../i18n";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function LoginPage() {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate("/account");
    } catch (err) {
      toast.error(mode === "login" ? t.auth.loginError : t.auth.registerError);
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/account";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div data-testid="login-page" className="min-h-screen bg-cream flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <Link to="/" data-testid="login-logo" className="block text-center font-display text-3xl font-semibold text-ink mb-10">
          FAr<span className="text-amberdark">Light</span>
        </Link>
        <div className="bg-white border border-ink/10 rounded-sm p-10 shadow-[0_8px_30px_rgba(42,39,38,0.06)]">
          <h1 data-testid="login-title" className="font-display text-3xl font-medium text-ink tracking-tight">
            {mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
          </h1>
          <p className="mt-2 text-sm text-inksoft">{t.auth.subtitle}</p>

          <button
            data-testid="google-login-button"
            onClick={googleLogin}
            className="mt-8 w-full flex items-center justify-center gap-3 border border-ink/20 hover:border-ink rounded-sm h-12 text-sm font-semibold text-ink transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.8z"/>
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5.1l-3.9 3C3.2 21.3 7.3 24 12 24z"/>
              <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.3l3.9-3z"/>
              <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.3 6.7l3.9 3c.9-2.9 3.6-5 6.8-5z"/>
            </svg>
            {t.auth.google}
          </button>

          <div className="my-6 flex items-center gap-4">
            <span className="flex-1 border-t border-ink/10" />
            <span className="text-xs uppercase tracking-[0.2em] text-inksoft">{t.auth.orDivider}</span>
            <span className="flex-1 border-t border-ink/10" />
          </div>

          <form data-testid="auth-form" onSubmit={submit} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="auth-name" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.auth.name}</Label>
                <Input id="auth-name" data-testid="auth-name-input" required value={form.name} onChange={set("name")} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="auth-email" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">{t.auth.email}</Label>
              <Input id="auth-email" data-testid="auth-email-input" type="email" required value={form.email} onChange={set("email")} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password" className="text-xs uppercase tracking-[0.15em] font-semibold text-inksoft">
                {t.auth.password}{mode === "register" && <span className="normal-case font-normal"> ({t.auth.minChars})</span>}
              </Label>
              <Input id="auth-password" data-testid="auth-password-input" type="password" required minLength={mode === "register" ? 8 : 1} value={form.password} onChange={set("password")} className="rounded-sm border-ink/15 focus-visible:ring-amberl h-11" />
            </div>
            <button
              type="submit"
              data-testid="auth-submit-button"
              disabled={busy}
              className="w-full bg-ink text-cream hover:bg-espresso disabled:opacity-60 transition-colors rounded-sm h-12 text-xs font-semibold uppercase tracking-[0.15em]"
            >
              {mode === "login" ? t.auth.login : t.auth.register}
            </button>
          </form>

          <button
            data-testid="auth-mode-toggle"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="mt-6 w-full text-center text-sm text-inksoft hover:text-ink transition-colors"
          >
            {mode === "login" ? t.auth.noAccount : t.auth.haveAccount}{" "}
            <span className="font-semibold text-amberdark">{mode === "login" ? t.auth.register : t.auth.login}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
