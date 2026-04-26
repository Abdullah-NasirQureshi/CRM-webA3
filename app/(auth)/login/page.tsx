"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setSession } from "@/lib/auth-client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        else setGlobalError(data.error ?? "Login failed");
        return;
      }
      setSession(data.token, data.user);
      router.push(data.user.role === "admin" ? "/admin/dashboard" : "/agent/dashboard");
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500";

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-700 flex-col justify-center px-16">
        <h1 className="text-3xl font-bold text-white leading-tight">Property Dealer CRM</h1>
        <p className="text-teal-200 mt-3 text-base leading-relaxed">
          A centralized platform to manage leads, track performance, and close deals efficiently.
        </p>
        <div className="mt-10 space-y-3">
          {["Lead Management", "Real-time Updates", "Analytics Dashboard", "Agent Performance Tracking"].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-teal-300" />
              <span className="text-teal-100 text-sm font-medium">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your credentials to access the system</p>

            {globalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm font-medium">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputClass} placeholder="you@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-700 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inputClass} placeholder="Enter your password" />
                {errors.password && <p className="mt-1 text-xs text-red-700 font-medium">{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded transition disabled:opacity-50 mt-2">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-5 text-sm text-center text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-teal-600 hover:text-teal-700 font-semibold">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
