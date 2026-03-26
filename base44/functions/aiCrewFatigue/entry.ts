import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { crewAssignments, flightHistory, timeZones } = await req.json();

    const context = `
Crew Assignments: ${JSON.stringify(crewAssignments?.slice(0, 10) || [])}
Recent Flight History (last 7 days): ${JSON.stringify(flightHistory?.slice(0, 20) || [])}
Time Zone Crossings: ${JSON.stringify(timeZones || {})}

Analyze crew fatigue risk based on:
- FAR 117 compliance
- Cumulative duty hours
- Circadian rhythm disruption
- Sleep opportunity
- Consecutive early/late reports

Provide fatigue risk assessment for each crew member.
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: context,
      response_json_schema: {
        type: "object",
        properties: {
          crew_fatigue_assessment: {
            type: "array",
            items: {
              type: "object",
              properties: {
                crew_name: { type: "string" },
                role: { type: "string" },
                fatigue_risk: { type: "string", enum: ["critical", "high", "moderate", "low"] },
                risk_factors: { type: "array", items: { type: "string" } },
                far117_status: { type: "string", enum: ["legal", "near_limit", "illegal"] },
                recommended_action: { type: "string" },
                rest_required_hours: { type: "number" }
              }
            }
          },
          high_risk_crew_count: { type: "number" },
          operational_impact: {
            type: "string",
            enum: ["none", "minor", "moderate", "severe"]
          },
          recommendations: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["crew_fatigue_assessment", "high_risk_crew_count", "recommendations"]
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});