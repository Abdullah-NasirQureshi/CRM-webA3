"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUser, authHeaders, clearSession } from "@/lib/auth-client";
import AnalyticsCards from "@/components/AnalyticsCards";
import AgentPerformanceTable from "@/components/AgentPerformanceTable";
import LeadTable from "@/components/LeadTable";
import FilterBar from "@/components/FilterBar";
import LeadDetailModal from "@/components/LeadDetailModal";
import NotificationToast from "@/components/NotificationToast";
import { useSocket } from "@/hooks/useSocket";
import { useSearchParams } from "next/navigation";

interface Analytics {
  totalLeads: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byAgent: Array<{ agentId: string; agentName: string; agentEmail: string; total: number; byStatus: Record<string, number> }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [toasts, setToasts] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", propertyInterest: "", budget: "", source: "Walk-in", notes: "" });
  const [creating, setCreating] = useState(false);

  function addToast(msg: string) {
    setToasts((t) => [...t, msg]);
    setTimeout(() => setToasts((t) => t.slice(1)), 4000);
  }

  const fetchLeads = useCallback(async () => {
    const params = searchParams.toString();
    const res = await fetch(`/api/leads${params ? `?${params}` : ""}`, { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); setLeads(d.leads); }
  }, [searchParams]);

  const fetchAnalytics = useCallback(async () => {
    const res = await fetch("/api/analytics", { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); setAnalytics(d.analytics); }
  }, []);

  const fetchAgents = useCallback(async () => {
    const res = await fetch("/api/users/agents", { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); setAgents(d.agents); }
  }, []);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u || u.role !== "admin") { router.push("/login"); return; }
    fetchLeads(); fetchAnalytics(); fetchAgents();
  }, [searchParams]);

  useSocket({
    userId: user?.id ?? "",
    role: "admin",
    onLeadCreated: () => { fetchLeads(); fetchAnalytics(); addToast("New lead created"); },
    onLeadAssigned: () => { fetchLeads(); addToast("Lead assigned"); },
    onScoreChanged: () => { fetchLeads(); addToast("Lead priority changed"); },
    onPollTick: () => { fetchLeads(); fetchAnalytics(); },
  });

  async function handleAssign(leadId: string, agentId: string) {
    if (!agentId) return;
    // Optimistic update — reflect change immediately in UI
    const agent = agents.find((a) => a._id === agentId || a._id?.toString() === agentId);
    setLeads((prev) =>
      prev.map((l) =>
        l._id === leadId
          ? { ...l, assignedTo: agent ? { _id: agentId, name: agent.name, email: agent.email ?? "" } : { _id: agentId } }
          : l
      )
    );
    await fetch(`/api/leads/${leadId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ agentId }),
    });
    fetchLeads();
  }

  async function handleDelete(leadId: string) {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${leadId}`, { method: "DELETE", headers: authHeaders() });
    fetchLeads(); fetchAnalytics();
  }

  async function handleExport(format: "excel" | "csv") {
    const res = await fetch(`/api/leads/export?format=${format}`, { headers: authHeaders() });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${Date.now()}.${format === "excel" ? "xlsx" : "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ ...newLead, budget: Number(newLead.budget) }),
    });
    setCreating(false);
    setShowCreateForm(false);
    setNewLead({ name: "", email: "", phone: "", propertyInterest: "", budget: "", source: "Walk-in", notes: "" });
    fetchLeads(); fetchAnalytics();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-teal-700 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Property Dealer CRM</h1>
          <p className="text-xs text-teal-200 font-medium">Administrator</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-teal-100">{user?.name}</span>
          <button onClick={() => { clearSession(); router.push("/login"); }}
            className="text-sm bg-white text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded font-semibold transition">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Analytics */}
        {analytics && (
          <AnalyticsCards totalLeads={analytics.totalLeads} byStatus={analytics.byStatus} byPriority={analytics.byPriority} />
        )}

        {/* Agent Performance */}
        {analytics && <AgentPerformanceTable agents={analytics.byAgent} />}

        {/* Lead Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Leads</h2>
            <div className="flex items-center gap-2">
            <button onClick={() => setShowCreateForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded font-medium transition">
              + New Lead
            </button>
            <button onClick={() => handleExport("excel")}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm px-4 py-2 rounded font-medium transition">
              Export Excel
            </button>
            <button onClick={() => handleExport("csv")}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm px-4 py-2 rounded font-medium transition">
              Export CSV
            </button>
          </div>
          </div>

          <FilterBar />
          <LeadTable leads={leads} isAdmin agents={agents} onAssign={handleAssign} onDelete={handleDelete} onSelect={setSelectedLead} />
        </div>
      </div>

      {/* Create Lead Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">New Lead</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: "Name", key: "name", type: "text", required: true },
                { label: "Email", key: "email", type: "email", required: true },
                { label: "Phone", key: "phone", type: "tel", required: false },
                { label: "Property Interest", key: "propertyInterest", type: "text", required: true },
                { label: "Budget (PKR)", key: "budget", type: "number", required: true },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} required={required} value={(newLead as any)[key]}
                    onChange={(e) => setNewLead({ ...newLead, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {["Facebook Ads", "Walk-in", "Website", "Other"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <button type="submit" disabled={creating}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded transition disabled:opacity-50">
                {creating ? "Creating..." : "Create Lead"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={() => { fetchLeads(); setSelectedLead(null); }} />
      )}

      {/* Toasts */}
      <NotificationToast messages={toasts} />
    </div>
  );
}
