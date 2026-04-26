"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "agent" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        else setGlobalError(data.error ?? "Signup failed");
        return;
      }
      router.push("/login");
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
          Join the platform and start managing your real estate leads professionally.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
            <p className="text-sm text-gray-500 mt-1">Fill in the details to register</p>

            {globalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm font-medium">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass} placeholder="John Doe" />
                {errors.name && <p className="mt-1 text-xs text-red-700 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass} placeholder="you@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-700 font-medium">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                  Password <span className="text-gray-400 font-normal normal-case">(min. 8 characters)</span>
                </label>
                <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass} placeholder="Enter a strong password" />
                {errors.password && <p className="mt-1 text-xs text-red-700 font-medium">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded transition disabled:opacity-50 mt-2">
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-5 text-sm text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-teal-600 hover:text-teal-700 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
