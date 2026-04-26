import { getIOSafe } from "@/lib/socket";
import { ILead } from "@/models/Lead";

/**
 * Broadcast a new lead event to all admin clients.
 * Req 9.1
 */
export function emitLeadCreated(lead: ILead): void {
  const io = getIOSafe();
  if (!io) return;
  io.to("admins").emit("lead:created", { lead });
}

/**
 * Broadcast lead assignment to admins + the specific agent.
 * Req 9.2
 */
export function emitLeadAssigned(lead: ILead, agentId: string): void {
  const io = getIOSafe();
  if (!io) return;
  io.to("admins").emit("lead:assigned", { lead });
  io.to(`agent:${agentId}`).emit("lead:assigned", { lead });
}

/**
 * Broadcast score change to all connected clients.
 * Req 9.3
 */
export function emitScoreChanged(lead: ILead): void {
  const io = getIOSafe();
  if (!io) return;
  io.emit("lead:scoreChanged", { lead });
}
