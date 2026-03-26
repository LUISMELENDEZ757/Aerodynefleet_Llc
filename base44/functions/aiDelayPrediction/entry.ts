import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { flights, weather, melItems, crewAssignments } = await req.json();

    const context = `
Flights Today: ${JSON.stringify(flights?.slice(0, 10) || [])}
Weather Conditions: ${JSON.stringify(weather || {})}
Open MEL Items: ${JSON.stringify(melItems?.slice(0, 5) || [])}
Crew Status: ${JSON.stringify(crewAssignments?.slice(0, 5) || [])}

Analyze operational data and predict:
1. Flights at risk of delay (>15 min)
2. Primary delay causes
3. Cascade effects on subsequent flights
4. Mitigation strategies
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: context,
      response_json_schema: {
        type: "object",
        properties: {
          delay_risk_flights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                flight_number: { type: "string" },
                risk_level: { type: "string", enum: ["high", "medium", "low"] },
                predicted_delay_minutes: { type: "number" },
                primary_cause: { type: "string" },
                confidence_percent: { type: "number" }
              }
            }
          },
          cascade_effects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                affected_flight: { type: "string" },
                impact_minutes: { type: "number" },
                reason: { type: "string" }
              }
            }
          },
          mitigation_strategies: {
            type: "array",
            items: { type: "string" }
          },
          overall_dot_prediction: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["delay_risk_flights", "mitigation_strategies", "overall_dot_prediction"]
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});