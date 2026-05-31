"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Innlogging feilet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-[5%] py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button onClick={() => router.push("/")} className="text-3xl font-bold text-brand tracking-tight">
            Total
          </button>
          <p className="text-ink-secondary mt-2">Logg inn for å fortsette</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl shadow-lg p-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">E-post</label>
            <input
              type="email"
              placeholder="din@epost.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-line rounded-xl px-4 py-2.5 bg-subtle text-ink outline-none focus:bg-surface focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Passord</label>
            <input
              type="password"
              placeholder="••••••••"
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
            {loading ? "Logger inn..." : "Logg inn"}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-ink-secondary">
          Ny her?{" "}
          <button onClick={() => router.push("/signup")} className="text-brand font-medium hover:text-brand-dark">
            Registrer deg
          </button>
        </p>
      </div>
    </div>
  );
}