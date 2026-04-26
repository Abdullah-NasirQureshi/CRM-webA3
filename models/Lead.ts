import mongoose, { Schema, Document, Model } from "mongoose";
import { computeScore } from "@/lib/scoring";

export type LeadStatus = "New" | "Contacted" | "In Progress" | "Closed" | "Lost";
export type LeadScore = "High" | "Medium" | "Low";
export type LeadSource = "Facebook Ads" | "Walk-in" | "Website" | "Other";

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  propertyInterest: string;
  budget: number;
  status: LeadStatus;
  notes?: string;
  source: LeadSource;
  assignedTo?: mongoose.Types.ObjectId;
  score: LeadScore;
  followUpDate?: Date;
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    propertyInterest: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["New", "Contacted", "In Progress", "Closed", "Lost"],
      default: "New",
    },
    notes: { type: String, trim: true },
    source: {
      type: String,
      enum: ["Facebook Ads", "Walk-in", "Website", "Other"],
      required: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    score: {
      type: String,
      enum: ["High", "Medium", "Low"],
    },
    followUpDate: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-compute score before every save (Mongoose v8: no next parameter)
LeadSchema.pre("save", function () {
  this.score = computeScore(this.budget);
});

// Also recompute on findOneAndUpdate when budget changes
LeadSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() as any;
  if (update?.budget !== undefined) {
    update.score = computeScore(update.budget);
  }
  if (update?.$set?.budget !== undefined) {
    update.$set.score = computeScore(update.$set.budget);
  }
});

const Lead: Model<ILead> =
  mongoose.models.Lead ?? mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
