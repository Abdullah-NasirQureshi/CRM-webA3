import { ILead } from "@/models/Lead";
import { IActivityLog } from "@/models/ActivityLog";

const DEFAULT_SUGGESTION =
  "Introduce yourself and ask about the client's property requirements, preferred location, and timeline.";

/**
 * Generates a follow-up suggestion using OpenAI (if configured),
 * or returns a rule-based suggestion as fallback.
 * Req 19.1, 19.2
 */
export async function getFollowUpSuggestion(
  lead: Pick<ILead, "name" | "status" | "score" | "propertyInterest" | "budget" | "notes">,
  activityLogs: Pick<IActivityLog, "action" | "timestamp">[]
): Promise<string> {
  // No activity history → default introductory suggestion (Req 19.2)
  if (!activityLogs.length) return DEFAULT_SUGGESTION;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return getRuleBasedSuggestion(lead, activityLogs);
  }

  try {
    const lastActions = activityLogs
      .slice(-5)
      .map((l) => `${l.action} at ${new Date(l.timestamp).toLocaleDateString()}`)
      .join(", ");

    const prompt = `You are a real estate CRM assistant. Suggest a concise follow-up action (1-2 sentences) for this lead:
Name: ${lead.name}
Status: ${lead.status}
Priority: ${lead.score}
Property Interest: ${lead.propertyInterest}
Budget: PKR ${lead.budget.toLocaleString()}
Recent Activity: ${lastActions}
Notes: ${lead.notes ?? "None"}

Respond with only the follow-up suggestion.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!res.ok) return getRuleBasedSuggestion(lead, activityLogs);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? getRuleBasedSuggestion(lead, activityLogs);
  } catch {
    return getRuleBasedSuggestion(lead, activityLogs);
  }
}

function getRuleBasedSuggestion(
  lead: Pick<ILead, "status" | "score">,
  activityLogs: Pick<IActivityLog, "action">[]
): string {
  const lastAction = activityLogs[activityLogs.length - 1]?.action;

  if (lead.score === "High") {
    return "This is a high-priority lead. Schedule an urgent call or site visit to close the deal quickly.";
  }
  if (lead.status === "Contacted") {
    return "Follow up with a property brochure or virtual tour link to keep the client engaged.";
  }
  if (lead.status === "In Progress") {
    return "Send a comparison of available properties matching the client's budget and preferences.";
  }
  if (lastAction === "followup_set") {
    return "Confirm the follow-up appointment and prepare relevant property details.";
  }
  return "Reach out to check on the client's current interest level and address any concerns.";
}
