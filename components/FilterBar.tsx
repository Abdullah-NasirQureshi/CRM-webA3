"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const selectClass =
    "border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Filter Leads</p>
      <div className="flex flex-wrap gap-3 items-center">
        <select value={searchParams.get("status") ?? ""} onChange={(e) => updateFilter("status", e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          {["New", "Contacted", "In Progress", "Closed", "Lost"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={searchParams.get("score") ?? ""} onChange={(e) => updateFilter("score", e.target.value)} className={selectClass}>
          <option value="">All Priorities</option>
          {["High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={searchParams.get("source") ?? ""} onChange={(e) => updateFilter("source", e.target.value)} className={selectClass}>
          <option value="">All Sources</option>
          {["Facebook Ads", "Walk-in", "Website", "Other"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 font-medium whitespace-nowrap">From</label>
          <input type="date"
            value={searchParams.get("from") ? new Date(searchParams.get("from")!).toISOString().split("T")[0] : ""}
            onChange={(e) => updateFilter("from", e.target.value ? new Date(e.target.value).toISOString() : "")}
            className={selectClass} />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 font-medium whitespace-nowrap">To</label>
          <input type="date"
            value={searchParams.get("to") ? new Date(searchParams.get("to")!).toISOString().split("T")[0] : ""}
            onChange={(e) => updateFilter("to", e.target.value ? new Date(e.target.value).toISOString() : "")}
            className={selectClass} />
        </div>

        <button onClick={() => router.push(pathname)}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition">
          Clear
        </button>
      </div>
    </div>
  );
}
