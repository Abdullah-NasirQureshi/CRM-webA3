import { ILead } from "@/models/Lead";

export function newLeadEmailTemplate(lead: ILead): { subject: string; html: string } {
  return {
    subject: `New Lead: ${lead.name} — ${lead.score} Priority`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: #1a56db; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 22px; }
  .body { padding: 24px 32px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: bold; }
  .high { background: #fde8e8; color: #c81e1e; }
  .medium { background: #fef3c7; color: #92400e; }
  .low { background: #def7ec; color: #03543f; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  td:first-child { color: #6b7280; width: 40%; }
  .footer { background: #f9fafb; padding: 16px 32px; font-size: 12px; color: #9ca3af; text-align: center; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 New Lead Received</h1>
    </div>
    <div class="body">
      <p>A new lead has been added to the CRM system.</p>
      <span class="badge ${lead.score.toLowerCase()}">${lead.score} Priority</span>
      <table>
        <tr><td>Name</td><td><strong>${lead.name}</strong></td></tr>
        <tr><td>Email</td><td>${lead.email}</td></tr>
        <tr><td>Phone</td><td>${lead.phone ?? "—"}</td></tr>
        <tr><td>Property Interest</td><td>${lead.propertyInterest}</td></tr>
        <tr><td>Budget</td><td>PKR ${lead.budget.toLocaleString()}</td></tr>
        <tr><td>Source</td><td>${lead.source}</td></tr>
        <tr><td>Status</td><td>${lead.status}</td></tr>
      </table>
    </div>
    <div class="footer">Property Dealer CRM — Automated Notification</div>
  </div>
</body>
</html>`,
  };
}

export function assignmentEmailTemplate(
  lead: ILead,
  agentName: string
): { subject: string; html: string } {
  return {
    subject: `Lead Assigned: ${lead.name} — Action Required`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: #057a55; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 22px; }
  .body { padding: 24px 32px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: bold; }
  .high { background: #fde8e8; color: #c81e1e; }
  .medium { background: #fef3c7; color: #92400e; }
  .low { background: #def7ec; color: #03543f; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  td:first-child { color: #6b7280; width: 40%; }
  .footer { background: #f9fafb; padding: 16px 32px; font-size: 12px; color: #9ca3af; text-align: center; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Lead Assigned to You</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${agentName}</strong>, a new lead has been assigned to you. Please follow up promptly.</p>
      <span class="badge ${lead.score.toLowerCase()}">${lead.score} Priority</span>
      <table>
        <tr><td>Name</td><td><strong>${lead.name}</strong></td></tr>
        <tr><td>Email</td><td>${lead.email}</td></tr>
        <tr><td>Phone</td><td>${lead.phone ?? "—"}</td></tr>
        <tr><td>Property Interest</td><td>${lead.propertyInterest}</td></tr>
        <tr><td>Budget</td><td>PKR ${lead.budget.toLocaleString()}</td></tr>
        <tr><td>Source</td><td>${lead.source}</td></tr>
      </table>
    </div>
    <div class="footer">Property Dealer CRM — Automated Notification</div>
  </div>
</body>
</html>`,
  };
}
