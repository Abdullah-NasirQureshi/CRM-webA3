"use client";

interface AgentEntry {
  agentId: string;
  agentName: string;
  agentEmail: string;
  total: number;
  byStatus: Record<string, number>;
}

export default function AgentPerformanceTable({ agents }: { agents: AgentEntry[] }) {
  if (!agents.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-500 text-sm">
        No agents found.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Agent Performance</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 text-left font-semibold">Agent</th>
              <th className="px-4 py-3 text-center font-semibold">Total</th>
              {["New", "Contacted", "In Progress", "Closed", "Lost"].map((s) => (
                <th key={s} className="px-4 py-3 text-center font-semibold">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map((a) => (
              <tr key={a.agentId} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-semibold text-gray-900">{a.agentName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.agentEmail}</p>
                </td>
                <td className="px-4 py-3 text-center font-bold text-teal-700 text-base">{a.total}</td>
                {["New", "Contacted", "In Progress", "Closed", "Lost"].map((s) => (
                  <td key={s} className="px-4 py-3 text-center font-medium text-gray-800">{a.byStatus[s] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
