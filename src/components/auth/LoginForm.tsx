"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client-auth";
import { exchangeTokenForSession } from "@/actions/auth/sessionAction";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const auth = getClientAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const result = await exchangeTokenForSession(idToken);
      if (!result.success) {
        setError(result.message ?? "Login failed.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFC107] text-2xl font-black text-[#0f1117]">
          M
        </div>
        <h1 className="text-2xl font-bold">Attendance System</h1>
        <p className="mt-1 text-sm text-neutral-400">Daily QR clock-in — MDI Hub</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="you@mdihub.co.za"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#FFC107] px-4 py-2.5 text-sm font-bold text-[#0f1117] transition hover:bg-amber-400 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
