import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { handover_id, include_metrics = true } = await req.json();

    // Fetch the handover record
    const handover = await base44.entities.ShiftHandover.get(handover_id);
    if (!handover) {
      return Response.json({ error: 'Handover not found' }, { status: 404 });
    }

    // Fetch related data for context
    const logbookEntries = await base44.entities.LogbookEntry.filter({
      created_date: { $gte: handover.shift_date }
    }, '-created_date', 50);

    const openMelItems = await base44.entities.MELItem.filter({
      status: 'open'
    }, '-deferred_date', 100);

    // Generate HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Shift Handover Report - ${handover.shift_date}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
          h1, h2, h3 { color: #1a1a1a; margin-top: 20px; }
          h1 { font-size: 28px; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
          h2 { font-size: 20px; margin-top: 30px; border-left: 4px solid #0066cc; padding-left: 12px; }
          h3 { font-size: 16px; color: #0066cc; }
          .header { background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .header-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 10px; }
          .header-item { padding: 8px 0; }
          .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; }
          .value { font-size: 16px; color: #000; font-weight: bold; margin-top: 4px; }
          .section { margin: 25px 0; background: white; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .summary-box { background-color: #f9f9f9; border-left: 4px solid #0066cc; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .issue-item { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 12px; margin: 10px 0; border-radius: 4px; }
          .critical-issue { background-color: #ffebee; border-left-color: #d32f2f; }
          .issue-priority { font-weight: bold; font-size: 12px; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; display: inline-block; margin-top: 5px; }
          .priority-critical { background-color: #d32f2f; color: white; }
          .priority-high { background-color: #ff9800; color: white; }
          .priority-medium { background-color: #2196f3; color: white; }
          .priority-low { background-color: #4caf50; color: white; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background-color: #0066cc; color: white; padding: 12px; text-align: left; font-weight: bold; }
          td { padding: 12px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f5f5f5; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ccc; font-size: 12px; color: #666; }
          .signature-line { display: flex; justify-content: space-between; margin-top: 20px; }
          .sig-block { flex: 1; text-align: center; }
          .sig-line { border-top: 1px solid black; margin-bottom: 5px; height: 40px; }
        </style>
      </head>
      <body>
        <h1>Shift Handover Report</h1>
        
        <div class="header">
          <div class="header-grid">
            <div class="header-item">
              <div class="label">Date</div>
              <div class="value">${new Date(handover.shift_date).toLocaleDateString()}</div>
            </div>
            <div class="header-item">
              <div class="label">Shift Period</div>
              <div class="value">${handover.shift_period.toUpperCase()}</div>
            </div>
            <div class="header-item">
              <div class="label">Technician</div>
              <div class="value">${handover.submitted_by}</div>
            </div>
          </div>
          ${handover.submitted_by_cert ? `
            <div style="margin-top: 10px;">
              <div class="label">Certification / License</div>
              <div class="value">${handover.submitted_by_cert}</div>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <h2>Work Completed</h2>
          <div class="summary-box">
            ${handover.progress_summary.split('\\n').map(line => `<p>${line}</p>`).join('')}
          </div>
        </div>

        ${handover.aircraft_worked_on && handover.aircraft_worked_on.length > 0 ? `
          <div class="section">
            <h2>Aircraft Worked On</h2>
            <p><strong>${handover.aircraft_worked_on.length}</strong> aircraft:</p>
            <ul>
              ${handover.aircraft_worked_on.map(tail => `<li><strong>${tail}</strong></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${handover.pending_issues && handover.pending_issues.length > 0 ? `
          <div class="section">
            <h2>Pending Issues & Handover Items (${handover.pending_issues.length})</h2>
            ${handover.pending_issues.map((issue, idx) => `
              <div class="issue-item ${issue.priority === 'critical' ? 'critical-issue' : ''}">
                <h3 style="margin-top: 0;">${idx + 1}. ${issue.description}</h3>
                ${issue.aircraft_tail ? `<p><strong>Aircraft:</strong> ${issue.aircraft_tail}</p>` : ''}
                <div>
                  <span class="issue-priority priority-${issue.priority}">${issue.priority}</span>
                  ${issue.assigned_to ? `<p><strong>Assigned to:</strong> ${issue.assigned_to}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${handover.safety_critical_notes ? `
          <div class="section" style="background-color: #ffebee; border: 2px solid #d32f2f;">
            <h2 style="color: #d32f2f;">⚠ Safety Critical Notes</h2>
            <div class="summary-box" style="background-color: #fff0f1; border-left-color: #d32f2f;">
              ${handover.safety_critical_notes.split('\\n').map(line => `<p>${line}</p>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="section">
          <h2>Resources & Inventory</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            ${handover.parts_consumed ? `
              <div>
                <h3>Parts Consumed / Pulled</h3>
                <p style="white-space: pre-wrap;">${handover.parts_consumed}</p>
              </div>
            ` : ''}
            ${handover.tools_in_use ? `
              <div>
                <h3>Tools in Use / Checked Out</h3>
                <p style="white-space: pre-wrap;">${handover.tools_in_use}</p>
              </div>
            ` : ''}
          </div>
        </div>

        ${include_metrics ? `
          <div class="section">
            <h2>Daily Metrics</h2>
            <table>
              <tr>
                <th>Metric</th>
                <th>Count</th>
              </tr>
              <tr>
                <td>Aircraft Serviced</td>
                <td><strong>${handover.aircraft_worked_on?.length || 0}</strong></td>
              </tr>
              <tr>
                <td>Pending Issues Logged</td>
                <td><strong>${handover.pending_issues?.length || 0}</strong></td>
              </tr>
              <tr>
                <td>Critical Issues</td>
                <td><strong style="color: #d32f2f;">${handover.pending_issues?.filter(i => i.priority === 'critical').length || 0}</strong></td>
              </tr>
              <tr>
                <td>Logbook Entries Today</td>
                <td><strong>${logbookEntries.length}</strong></td>
              </tr>
              <tr>
                <td>Open MEL Items (Fleet-wide)</td>
                <td><strong>${openMelItems.length}</strong></td>
              </tr>
            </table>
          </div>
        ` : ''}

        ${handover.notes ? `
          <div class="section">
            <h2>Additional Notes</h2>
            <p>${handover.notes}</p>
          </div>
        ` : ''}

        <div class="section">
          <h2>Sign-Off</h2>
          <p><strong>Signed by:</strong> ${handover.signed_by || 'Not signed'}</p>
          <p><strong>Time:</strong> ${handover.shift_end_time ? new Date(handover.shift_end_time).toLocaleString() : 'N/A'}</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">This shift handover report has been digitally signed and is considered a legal maintenance record.</p>
        </div>

        <div class="footer">
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Aerodyne Fleet LLC — TechOps Division</p>
          <p style="margin-top: 10px;">This document is a maintenance record and must be retained per FAA 14 CFR 121.380</p>
        </div>
      </body>
      </html>
    `;

    return Response.json({
      status: 'success',
      html: reportHTML,
      data: {
        aircraft_count: handover.aircraft_worked_on?.length || 0,
        pending_issues: handover.pending_issues?.length || 0,
        critical_issues: handover.pending_issues?.filter(i => i.priority === 'critical').length || 0,
        logbook_entries: logbookEntries.length,
        open_mel_items: openMelItems.length,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});