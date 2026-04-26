import nodemailer from "nodemailer";
import { ILead } from "@/models/Lead";
import { newLeadEmailTemplate, assignmentEmailTemplate } from "@/lib/emailTemplates";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT ?? "587", 10),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Sends a new-lead alert email to the admin.
 * Req 11.1, 11.3
 */
export async function sendNewLeadEmail(lead: ILead): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const { subject, html } = newLeadEmailTemplate(lead);
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Property Dealer CRM" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html,
    });
  } catch (err: any) {
    // Req 11.4 — log failure, do not throw
    console.error("[NotificationService] Failed to send new-lead email", {
      leadId: lead._id,
      recipient: adminEmail,
      error: err.message,
    });
  }
}

/**
 * Sends an assignment confirmation email to the assigned agent.
 * Req 11.2, 11.3
 */
export async function sendAssignmentEmail(
  lead: ILead,
  agentEmail: string,
  agentName: string
): Promise<void> {
  const { subject, html } = assignmentEmailTemplate(lead, agentName);
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Property Dealer CRM" <${process.env.EMAIL_USER}>`,
      to: agentEmail,
      subject,
      html,
    });
  } catch (err: any) {
    // Req 11.4 — log failure, do not throw
    console.error("[NotificationService] Failed to send assignment email", {
      leadId: lead._id,
      recipient: agentEmail,
      error: err.message,
    });
  }
}
