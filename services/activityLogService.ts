import mongoose from "mongoose";
import ActivityLog, { IActivityLog, ActivityAction } from "@/models/ActivityLog";
import { connectDB } from "@/lib/db";

export async function logAction(
  leadId: string,
  action: ActivityAction,
  performedBy: string,
  details?: Record<string, unknown>
): Promise<IActivityLog> {
  await connectDB();
  return ActivityLog.create({
    leadId: new mongoose.Types.ObjectId(leadId),
    action,
    performedBy: new mongoose.Types.ObjectId(performedBy),
    details,
  });
}

export async function getTimeline(leadId: string): Promise<IActivityLog[]> {
  await connectDB();
  return ActivityLog.find({ leadId: new mongoose.Types.ObjectId(leadId) })
    .populate("performedBy", "name email role")
    .sort({ timestamp: 1 }); // ascending — oldest first
}
