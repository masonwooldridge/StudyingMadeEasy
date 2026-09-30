"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../components/auth-shell";
import { API_URL } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Return to your study desk."
      subtitle="Pick up where you left off and keep your momentum going."
      footer={
        <p>
          New here?{" "}
          <Link href="/register" className="font-bold text-[#264a38] underline decoration-[#b65f42]/50 underline-offset-4">
            Create your account
          </Link>
        </p>
      }
    >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#344239]">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="focus-ring w-full rounded-xl border border-[#cfc9bc] bg-white px-4 py-3.5 text-[#1d251f] outline-none transition focus:border-[#264a38]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#344239]">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="focus-ring w-full rounded-xl border border-[#cfc9bc] bg-white px-4 py-3.5 text-[#1d251f] outline-none transition focus:border-[#264a38]"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-[#b65f42]/20 bg-[#f0ded4] px-4 py-3 text-sm text-[#8f3f2b]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full rounded-xl bg-[#264a38] px-5 py-3.5 font-bold text-white transition hover:bg-[#173326] disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
    </AuthShell>
  );
}
