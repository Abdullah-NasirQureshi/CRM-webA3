"use client";

interface ActivityEntry {
  _id: string;
  action: string;
  performedBy?: { name: string; email: string };
  timestamp: string;
  details?: Record<string, unknown>;
}

const ACTION_META: Record<string, { label: string; color: string }> = {
  created: { label: "Lead Created", color: "bg-green-500" },
  status_updated: { label: "Status Updated", color: "bg-orange-500" },
  assigned: { label: "Lead Assigned", color: "bg-blue-500" },
  reassigned: { label: "Lead Reassigned", color: "bg-purple-500" },
  notes_updated: { label: "Notes Updated", color: "bg-yellow-500" },
  followup_set: { label: "Follow-up Scheduled", color: "bg-indigo-500" },
  followup_completed: { label: "Follow-up Completed", color: "bg-teal-500" },
};

export default function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm text-gray-500 py-4">No activity recorded yet.</p>;
  }

  return (
    <ol className="relative border-l-2 border-gray-200 space-y-5 ml-2">
      {entries.map((entry) => {
        const meta = ACTION_META[entry.action] ?? { label: entry.action, color: "bg-gray-400" };
        return (
          <li key={entry._id} className="ml-6">
            <span className={`absolute -left-2 w-4 h-4 rounded-full border-2 border-white ${meta.color}`} />
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
              {entry.performedBy && (
                <p className="text-xs text-gray-600 mt-0.5">by <span className="font-medium">{entry.performedBy.name}</span></p>
              )}
              <p className="text-xs text-gray-400 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
              {entry.details && Object.keys(entry.details).length > 0 && (
                <pre className="text-xs text-gray-600 mt-2 bg-white border border-gray-100 rounded p-2 whitespace-pre-wrap">
                  {JSON.stringify(entry.details, null, 2)}
                </pre>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
