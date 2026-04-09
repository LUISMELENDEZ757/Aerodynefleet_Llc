import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to_email, shift_date, shift_period, submitted_by, safety_notes, critical_issues } = await req.json();

    if (!to_email || !submitted_by || !critical_issues) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format critical issues for email
    const issuesList = critical_issues
      .map(i => `• ${i.priority.toUpperCase()}: ${i.description}${i.assigned_to ? ` (→ ${i.assigned_to})` : ''}`)
      .join('\n');

    const emailBody = `
Maintenance Control - Shift Handover Escalation Alert

Shift: ${shift_period.toUpperCase()} (${shift_date})
Submitted by: ${submitted_by}

CRITICAL ISSUES REQUIRING ATTENTION:
${issuesList}

${safety_notes ? `SAFETY CRITICAL NOTES:\n${safety_notes}\n` : ''}
Please review and acknowledge receipt of this escalation.

Reference: Shift Handover ${shift_date} ${shift_period}
    `.trim();

    const result = await base44.integrations.Core.SendEmail({
      to: to_email,
      subject: `⚠️ ESCALATION: ${critical_issues.length} Critical Issue(s) - Shift Handover ${shift_date}`,
      body: emailBody,
      from_name: 'Maintenance Control Center',
    });

    return Response.json({ 
      success: true, 
      message: `Escalation email sent to ${to_email}`,
      sent_to: to_email,
      issue_count: critical_issues.length,
    });
  } catch (error) {
    console.error('Handover escalation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});