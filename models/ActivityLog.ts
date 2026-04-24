import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityAction =
  | "created"
  | "status_updated"
  | "assigned"
  | "reassigned"
  | "notes_updated"
  | "followup_set"
  | "followup_completed";

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  action: ActivityAction;
  performedBy: mongoose.Types.ObjectId;
  timestamp: Date;
  details?: Record<string, unknown>;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    action: {
      type: String,
      enum: [
        "created",
        "status_updated",
        "assigned",
        "reassigned",
        "notes_updated",
        "followup_set",
        "followup_completed",
      ],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    timestamp: { type: Date, default: () => new Date() },
    details: { type: Schema.Types.Mixed },
  },
  {
    // Explicit collection name — separate from leads collection (Req 12.3)
    collection: "activitylogs",
    timestamps: false,
  }
);

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
