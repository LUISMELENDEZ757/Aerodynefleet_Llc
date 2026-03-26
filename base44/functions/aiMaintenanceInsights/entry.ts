import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { aircraftTail, logEntries, faultMessages, oosEntries } = await req.json();

    // Build context for AI analysis
    const context = `
Aircraft: ${aircraftTail}
Recent Log Entries: ${JSON.stringify(logEntries?.slice(0, 5) || [])}
Active Faults: ${JSON.stringify(faultMessages?.slice(0, 5) || [])}
Open OOS: ${JSON.stringify(oosEntries?.slice(0, 3) || [])}

Analyze this aircraft's maintenance status and provide:
1. Priority concerns (critical issues needing immediate attention)
2. Predictive maintenance recommendations (what might fail in next 7-30 days)
3. Recurring issue patterns
4. Recommended actions
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: context,
      response_json_schema: {
        type: "object",
        properties: {
          priority_concerns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                issue: { type: "string" },
                ata_chapter: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          predictive_maintenance: {
            type: "array",
            items: {
              type: "object",
              properties: {
                component: { type: "string" },
                predicted_failure_window: { type: "string" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                preventive_action: { type: "string" }
              }
            }
          },
          recurring_patterns: {
            type: "array",
            items: { type: "string" }
          },
          recommended_actions: {
            type: "array",
            items: { type: "string" }
          },
          overall_health_score: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["priority_concerns", "predictive_maintenance", "recommended_actions", "overall_health_score"]
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});