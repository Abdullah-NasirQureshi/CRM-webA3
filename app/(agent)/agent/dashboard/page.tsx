"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUser, authHeaders, clearSession } from "@/lib/auth-client";
import LeadTable from "@/components/LeadTable";
import FilterBar from "@/components/FilterBar";
import LeadDetailModal from "@/components/LeadDetailModal";
import NotificationToast from "@/components/NotificationToast";
import { useSocket } from "@/hooks/useSocket";
import { isOverdue, isStale } from "@/services/followUpService";

export default function AgentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [toasts, setToasts] = useState<string[]>([]);
  const [overdueLeads, setOverdueLeads] = useState<any[]>([]);
  const [staleLeads, setStaleLeads] = useState<any[]>([]);

  function addToast(msg: string) {
    setToasts((t) => [...t, msg]);
    setTimeout(() => setToasts((t) => t.slice(1)), 4000);
  }

  const fetchLeads = useCallback(async () => {
    const params = searchParams.toString();
    const res = await fetch(`/api/leads${params ? `?${params}` : ""}`, { headers: authHeaders() });
    if (!res.ok) return;
    const d = await res.json();
    setLeads(d.leads);
  }, [searchParams]);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    const res = await fetch(`/api/leads/follow-up-alerts`, { headers: authHeaders() });
    if (res.ok) {
      const d = await res.json();
      setOverdueLeads(d.overdue ?? []);
      setStaleLeads(d.stale ?? []);
    }
  }, [user]);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u || u.role !== "agent") { router.push("/login"); return; }
    fetchLeads();
    fetchAlerts();
  }, [searchParams]);

  useSocket({
    userId: user?.id ?? "",
    role: "agent",
    onLeadAssigned: () => { fetchLeads(); addToast("A lead has been assigned to you"); },
    onScoreChanged: () => { fetchLeads(); },
    onPollTick: () => { fetchLeads(); fetchAlerts(); },
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-teal-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Property Dealer CRM</h1>
          <p className="text-xs text-teal-200 font-medium">Agent Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-teal-100">{user?.name}</span>
          <button onClick={() => { clearSession(); router.push("/login"); }}
            className="text-sm bg-white text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded font-semibold transition">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Overdue & Stale Alerts */}
        {(overdueLeads.length > 0 || staleLeads.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overdueLeads.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-red-800 mb-3 uppercase tracking-wide">Overdue Follow-ups ({overdueLeads.length})</h3>
                <div className="space-y-2">
                  {overdueLeads.map((l: any) => (
                    <div key={l._id} onClick={() => setSelectedLead(l)}
                      className="bg-white rounded border border-red-100 px-3 py-2 text-sm cursor-pointer hover:bg-red-50 transition">
                      <p className="font-semibold text-gray-900">{l.name}</p>
                      <p className="text-xs text-red-700 font-medium mt-0.5">Due: {new Date(l.followUpDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {staleLeads.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-yellow-800 mb-3 uppercase tracking-wide">Stale Leads ({staleLeads.length})</h3>
                <div className="space-y-2">
                  {staleLeads.map((l: any) => (
                    <div key={l._id} onClick={() => setSelectedLead(l)}
                      className="bg-white rounded border border-yellow-100 px-3 py-2 text-sm cursor-pointer hover:bg-yellow-50 transition">
                      <p className="font-semibold text-gray-900">{l.name}</p>
                      <p className="text-xs text-yellow-700 font-medium mt-0.5">No activity for 7+ days</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leads */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">My Leads</h2>
          <FilterBar />
          <LeadTable leads={leads} isAdmin={false} onSelect={setSelectedLead} />
        </div>
      </div>

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)}
          onUpdate={() => { fetchLeads(); fetchAlerts(); setSelectedLead(null); }} />
      )}

      <NotificationToast messages={toasts} />
    </div>
  );
}
