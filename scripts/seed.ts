/**
 * Seed script — populates the database with realistic dummy data.
 * Run with: npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env") });

import User from "../models/User";
import Lead from "../models/Lead";
import ActivityLog from "../models/ActivityLog";

const MONGODB_URI = process.env.MONGODB_URI!;

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  await User.deleteMany({});
  await Lead.deleteMany({});
  await ActivityLog.deleteMany({});
  console.log("Cleared existing data");

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("abcdefgh", 12);

  const admin = await User.create({
    name: "Usman",
    email: "usman@gmail.com",
    passwordHash,
    role: "admin",
  });

  const agents = await User.insertMany([
    { name: "Rizwan Ahmed", email: "rizwan@gmail.com", passwordHash, role: "agent" },
    { name: "Yasir Khan",   email: "yasir@gmail.com",  passwordHash, role: "agent" },
  ]);

  const [rizwan, yasir] = agents;
  console.log(`Created 1 admin + ${agents.length} agents`);

  // ── Leads ──────────────────────────────────────────────────────────────────
  const leadsData = [
    {
      name: "Ahmed Raza",
      email: "ahmed.raza@gmail.com",
      phone: "923001234567",
      propertyInterest: "5 Marla House in DHA Phase 6",
      budget: 28_000_000,
      status: "New",
      source: "Facebook Ads",
      notes: "Looking for a corner plot, ready to move in within 3 months.",
      assignedTo: rizwan._id,
    },
    {
      name: "Fatima Malik",
      email: "fatima.malik@hotmail.com",
      phone: "923211234567",
      propertyInterest: "2 Bed Apartment in Bahria Town",
      budget: 12_500_000,
      status: "Contacted",
      source: "Website",
      notes: "Prefers ground floor. Has visited the site once.",
      assignedTo: yasir._id,
    },
    {
      name: "Zubair Khan",
      email: "zubair.khan@yahoo.com",
      phone: "923451234567",
      propertyInterest: "10 Marla Plot in Gulberg",
      budget: 35_000_000,
      status: "In Progress",
      source: "Walk-in",
      notes: "Serious buyer. Negotiating price. Wants possession in 6 months.",
      assignedTo: rizwan._id,
    },
    {
      name: "Nadia Hussain",
      email: "nadia.hussain@gmail.com",
      phone: "923331234567",
      propertyInterest: "3 Bed Apartment in Clifton Block 5",
      budget: 22_000_000,
      status: "Closed",
      source: "Facebook Ads",
      notes: "Deal closed. Token paid. Documentation in progress.",
      assignedTo: yasir._id,
    },
    {
      name: "Imran Sheikh",
      email: "imran.sheikh@gmail.com",
      phone: "923151234567",
      propertyInterest: "1 Kanal Farmhouse near Bedian Road",
      budget: 55_000_000,
      status: "New",
      source: "Website",
      notes: "High net worth client. Wants a farmhouse with swimming pool.",
      assignedTo: null,
    },
    {
      name: "Ayesha Siddiqui",
      email: "ayesha.siddiqui@outlook.com",
      phone: "923061234567",
      propertyInterest: "Studio Apartment in Gulshan-e-Iqbal",
      budget: 7_500_000,
      status: "Contacted",
      source: "Walk-in",
      notes: "First-time buyer. Needs guidance on financing options.",
      assignedTo: yasir._id,
    },
    {
      name: "Hassan Qureshi",
      email: "hassan.qureshi@gmail.com",
      phone: "923411234567",
      propertyInterest: "Commercial Shop in Johar Town",
      budget: 18_000_000,
      status: "In Progress",
      source: "Facebook Ads",
      notes: "Wants ground floor commercial unit. Comparing 3 options.",
      assignedTo: rizwan._id,
    },
    {
      name: "Mariam Baig",
      email: "mariam.baig@gmail.com",
      phone: "923221234567",
      propertyInterest: "4 Marla House in Model Town",
      budget: 16_000_000,
      status: "Lost",
      source: "Website",
      notes: "Went with a competitor. Budget was too tight for the area.",
      assignedTo: yasir._id,
    },
    {
      name: "Kamran Iqbal",
      email: "kamran.iqbal@gmail.com",
      phone: "923121234567",
      propertyInterest: "2 Kanal Plot in Raiwind Road",
      budget: 42_000_000,
      status: "New",
      source: "Walk-in",
      notes: "Investor. Looking for plots with development potential.",
      assignedTo: null,
    },
    {
      name: "Sobia Tariq",
      email: "sobia.tariq@gmail.com",
      phone: "923511234567",
      propertyInterest: "3 Marla House in Wapda Town",
      budget: 9_500_000,
      status: "Contacted",
      source: "Facebook Ads",
      notes: "Wants a house near a school. Has two school-age children.",
      assignedTo: rizwan._id,
    },
    {
      name: "Faisal Nawaz",
      email: "faisal.nawaz@gmail.com",
      phone: "923001234568",
      propertyInterest: "Penthouse in Emaar Canyon Views",
      budget: 85_000_000,
      status: "In Progress",
      source: "Website",
      notes: "Expat returning from Dubai. Wants luxury unit with sea view.",
      assignedTo: yasir._id,
    },
    {
      name: "Rabia Anwar",
      email: "rabia.anwar@gmail.com",
      phone: "923311234567",
      propertyInterest: "5 Marla Plot in Lahore Smart City",
      budget: 11_000_000,
      status: "New",
      source: "Facebook Ads",
      notes: "Interested in installment plan. Needs payment schedule.",
      assignedTo: null,
    },
  ];

  // Use save() per lead so the pre-save hook computes score
  const leads = [];
  for (const data of leadsData) {
    const lead = new Lead(data);
    await lead.save();
    leads.push(lead);
  }
  console.log(`Created ${leads.length} leads`);

  // ── Activity Logs ──────────────────────────────────────────────────────────
  const logs: any[] = [];
  for (const lead of leads) {
    logs.push({
      leadId: lead._id,
      action: "created",
      performedBy: admin._id,
      details: { name: lead.name, budget: lead.budget, score: (lead as any).score },
    });

    if (["Contacted", "In Progress", "Closed"].includes(lead.status as string)) {
      logs.push({
        leadId: lead._id,
        action: "status_updated",
        performedBy: lead.assignedTo ?? admin._id,
        details: { from: "New", to: "Contacted" },
      });
    }

    if (["In Progress", "Closed"].includes(lead.status as string)) {
      logs.push({
        leadId: lead._id,
        action: "status_updated",
        performedBy: lead.assignedTo ?? admin._id,
        details: { from: "Contacted", to: "In Progress" },
      });
    }

    if (lead.assignedTo) {
      logs.push({
        leadId: lead._id,
        action: "assigned",
        performedBy: admin._id,
        details: { agentId: lead.assignedTo.toString() },
      });
    }
  }

  await ActivityLog.insertMany(logs);
  console.log(`Created ${logs.length} activity log entries`);

  console.log("\n=== Seed complete ===");
  console.log("Admin:  usman@gmail.com  / abcdefgh");
  console.log("Agent:  rizwan@gmail.com / abcdefgh");
  console.log("Agent:  yasir@gmail.com  / abcdefgh");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
