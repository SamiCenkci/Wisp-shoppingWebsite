"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

export default function SignupPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-[5%] py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => router.push("/")} className="text-3xl font-bold text-brand tracking-tight">
            Wisp
          </button>
          <p className="text-ink-secondary mt-2">{t("auth.signupSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl shadow-lg p-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">{t("auth.name")}</label>
            <input
              type="text"
              placeholder={t("auth.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-line rounded-xl px-4 py-2.5 bg-subtle text-ink outline-none focus:bg-surface focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">{t("auth.email")}</label>
            <input
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-line rounded-xl px-4 py-2.5 bg-subtle text-ink outline-none focus:bg-surface focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">{t("auth.password")}</label>
            <input
              type="password"
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-line rounded-xl px-4 py-2.5 bg-subtle text-ink outline-none focus:bg-surface focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white rounded-xl py-3 font-medium hover:bg-brand-dark disabled:opacity-50 shadow-sm"
          >
            {loading ? t("auth.creatingAccount") : t("auth.signUp")}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-ink-secondary">
          {t("auth.alreadyHaveAccount")}{" "}
          <button onClick={() => router.push("/login")} className="text-brand font-medium hover:text-brand-dark">
            {t("nav.login")}
          </button>
        </p>
      </div>
    </div>
  );
}