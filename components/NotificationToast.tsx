"use client";

export default function NotificationToast({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {messages.map((msg, i) => (
        <div key={i} className="bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg border-l-4 border-teal-500">
          {msg}
        </div>
      ))}
    </div>
  );
}
