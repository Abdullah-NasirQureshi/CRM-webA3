"use client";

import { useState } from "react";
import ActivityTimeline from "./ActivityTimeline";
import { formatWhatsAppUrl } from "@/lib/whatsapp";
import { authHeaders } from "@/lib/auth-client";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  propertyInterest: string;
  budget: number;
  status: string;
  score: string;
  source: string;
  notes?: string;
  followUpDate?: string;
  assignedTo?: { _id: string; name: string; email: string } | null;
  createdAt: string;
}

interface ActivityEntry {
  _id: string;
  action: string;
  performedBy?: { name: string; email: string };
  timestamp: string;
  details?: Record<string, unknown>;
}

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdate?: () => void;
}

const STATUSES = ["New", "Contacted", "In Progress", "Closed", "Lost"];

const SCORE_COLOR: Record<string, string> = {
  High: "bg-red-100 text-red-800 border border-red-200",
  Medium: "bg-orange-100 text-orange-800 border border-orange-200",
  Low: "bg-green-100 text-green-800 border border-green-200",
};

export default function LeadDetailModal({ lead, onClose, onUpdate }: Props) {
  const [timeline, setTimeline] = useState<ActivityEntry[]>([]);
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(
    lead.followUpDate ? new Date(lead.followUpDate).toISOString().split("T")[0] : ""
  );
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");

  async function loadTimeline() {
    if (timelineLoaded) return;
    const res = await fetch(`/api/leads/${lead._id}/timeline`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setTimeline(data.timeline);
      setTimelineLoaded(true);
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/leads/${lead._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        status,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
      }),
    });
    setSaving(false);
    onUpdate?.();
  }

  const fieldClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{lead.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{lead.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-xs font-semibold ${SCORE_COLOR[lead.score]}`}>
              {lead.score} Priority
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">
              &times;
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(["details", "timeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "timeline") loadTimeline(); }}
              className={`px-6 py-3 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "border-b-2 border-teal-600 text-teal-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "details" ? "Lead Details" : "Activity Timeline"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4 border border-gray-100">
                {[
                  ["Phone", lead.phone ?? "—"],
                  ["Property Interest", lead.propertyInterest],
                  ["Budget", `PKR ${lead.budget.toLocaleString()}`],
                  ["Source", lead.source],
                  ["Assigned To", lead.assignedTo?.name ?? "Unassigned"],
                  ["Created", new Date(lead.createdAt).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* WhatsApp */}
              {lead.phone ? (
                <a href={formatWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-teal-700 border border-teal-300 rounded px-4 py-2 hover:bg-teal-50 transition">
                  Open WhatsApp Chat
                </a>
              ) : (
                <span className="inline-block text-sm text-gray-400 border border-gray-200 rounded px-4 py-2 cursor-not-allowed">
                  WhatsApp unavailable (no phone)
                </span>
              )}

              {/* Editable fields */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={fieldClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  className={`${fieldClass} resize-none`} />
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {activeTab === "timeline" && (
            <ActivityTimeline entries={timeline} />
          )}
        </div>
      </div>
    </div>
  );
}
