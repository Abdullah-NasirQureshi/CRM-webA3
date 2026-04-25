import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "agent"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  propertyInterest: z.string().min(1, "Property interest is required"),
  budget: z.number({ required_error: "Budget is required" }).min(0),
  status: z.enum(["New", "Contacted", "In Progress", "Closed", "Lost"]).optional(),
  notes: z.string().optional(),
  source: z.enum(["Facebook Ads", "Walk-in", "Website", "Other"]),
  followUpDate: z.string().datetime().optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  propertyInterest: z.string().min(1).optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(["New", "Contacted", "In Progress", "Closed", "Lost"]).optional(),
  notes: z.string().optional(),
  source: z.enum(["Facebook Ads", "Walk-in", "Website", "Other"]).optional(),
  followUpDate: z.string().datetime().optional().nullable(),
});

export const assignLeadSchema = z.object({
  agentId: z.string().min(1, "Agent ID is required"),
});

export const filterLeadsSchema = z.object({
  status: z.enum(["New", "Contacted", "In Progress", "Closed", "Lost"]).optional(),
  score: z.enum(["High", "Medium", "Low"]).optional(),
  source: z.enum(["Facebook Ads", "Walk-in", "Website", "Other"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
