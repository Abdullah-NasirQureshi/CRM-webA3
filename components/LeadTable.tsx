"use client";

import { formatWhatsAppUrl } from "@/lib/whatsapp";

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
  assignedTo?: { _id: string; name: string; email: string } | null;
  createdAt: string;
}

interface LeadTableProps {
  leads: Lead[];
  isAdmin?: boolean;
  agents?: { _id: string; name: string }[];
  onAssign?: (leadId: string, agentId: string) => void;
  onDelete?: (leadId: string) => void;
  onSelect?: (lead: Lead) => void;
}

const SCORE_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-800 font-semibold",
  Medium: "bg-amber-100 text-amber-800 font-semibold",
  Low: "bg-green-100 text-green-800 font-semibold",
};

const STATUS_BADGE: Record<string, string> = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-teal-100 text-teal-800",
  "In Progress": "bg-amber-100 text-amber-800",
  Closed: "bg-green-100 text-green-800",
  Lost: "bg-gray-100 text-gray-600",
};

export default function LeadTable({ leads, isAdmin, agents = [], onAssign, onDelete, onSelect }: LeadTableProps) {
  if (!leads.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500">
        No leads found.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Property</th>
              <th className="px-4 py-3 text-right font-semibold">Budget</th>
              <th className="px-4 py-3 text-center font-semibold">Priority</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Source</th>
              {isAdmin && <th className="px-4 py-3 text-left font-semibold">Assign To</th>}
              <th className="px-4 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <tr
                key={lead._id}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${lead.score === "High" ? "border-l-4 border-red-400" : "border-l-4 border-transparent"}`}
                onClick={() => onSelect?.(lead)}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{lead.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-800 font-medium">{lead.propertyInterest}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  PKR {lead.budget.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded text-xs ${SCORE_BADGE[lead.score] ?? "bg-gray-100 text-gray-700"}`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded text-xs font-medium ${STATUS_BADGE[lead.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{lead.source}</td>
                {isAdmin && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.assignedTo?._id?.toString() ?? ""}
                      onChange={(e) => onAssign?.(lead._id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500 w-full"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                  </td>
                )}
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    {lead.phone ? (
                      <a href={formatWhatsAppUrl(lead.phone)} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium text-teal-700 border border-teal-300 rounded px-2 py-1 hover:bg-teal-50 transition">
                        WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 border border-gray-200 rounded px-2 py-1 cursor-not-allowed">
                        No Phone
                      </span>
                    )}
                    {isAdmin && onDelete && (
                      <button onClick={() => onDelete(lead._id)}
                        className="text-xs font-medium text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
