"use client";

interface AnalyticsCardsProps {
  totalLeads: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export default function AnalyticsCards({ totalLeads, byStatus, byPriority }: AnalyticsCardsProps) {
  const statusItems = [
    { label: "New", key: "New", accent: "border-t-2 border-slate-400" },
    { label: "Contacted", key: "Contacted", accent: "border-t-2 border-teal-500" },
    { label: "In Progress", key: "In Progress", accent: "border-t-2 border-green-500" },
    { label: "Closed", key: "Closed", accent: "border-t-2 border-emerald-600" },
    { label: "Lost", key: "Lost", accent: "border-t-2 border-gray-400" },
  ];

  const priorityItems = [
    { label: "High", key: "High", accent: "border-t-2 border-red-500" },
    { label: "Medium", key: "Medium", accent: "border-t-2 border-amber-500" },
    { label: "Low", key: "Low", accent: "border-t-2 border-green-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 border-t-2 border-t-teal-600">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalLeads}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 border-t-2 border-t-green-600">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Closed</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{byStatus["Closed"] ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 border-t-2 border-t-amber-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">In Progress</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{byStatus["In Progress"] ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 border-t-2 border-t-red-500">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">High Priority</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{byPriority["High"] ?? 0}</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Status Breakdown</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {statusItems.map(({ label, key, accent }) => (
            <div key={key} className={`bg-gray-50 rounded-lg p-3 ${accent}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{byStatus[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Priority Breakdown</p>
        <div className="grid grid-cols-3 gap-3">
          {priorityItems.map(({ label, key, accent }) => (
            <div key={key} className={`bg-gray-50 rounded-lg p-3 ${accent}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{byPriority[key] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
