import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { iropsEvent, affectedFlights, availableAircraft, crewStatus, weatherData } = await req.json();

    const context = `
IROPS Event: ${JSON.stringify(iropsEvent || {})}
Affected Flights: ${JSON.stringify(affectedFlights || [])}
Available Aircraft for Swaps: ${JSON.stringify(availableAircraft?.slice(0, 5) || [])}
Crew Availability: ${JSON.stringify(crewStatus?.slice(0, 5) || [])}
Weather at Alternates: ${JSON.stringify(weatherData || {})}

Provide AI-powered recovery recommendations:
1. Optimal aircraft swaps
2. Crew reassignments
3. Passenger rebooking strategies
4. Recovery timeline
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: context,
      response_json_schema: {
        type: "object",
        properties: {
          recovery_plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action_type: { type: "string", enum: ["aircraft_swap", "crew_reassign", "flight_cancel", "divert", "delay"] },
                flight_number: { type: "string" },
                details: { type: "string" },
                priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                estimated_recovery_time: { type: "string" },
                pax_impact: { type: "number" }
              }
            }
          },
          aircraft_swaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from_flight: { type: "string" },
                to_flight: { type: "string" },
                aircraft_tail: { type: "string" },
                feasibility: { type: "string", enum: ["high", "medium", "low"] }
              }
            }
          },
          passenger_rebooking: {
            type: "object",
            properties: {
              total_pax_affected: { type: "number" },
              recommended_alternates: { type: "array", items: { type: "string" } },
              compensation_required: { type: "boolean" }
            }
          },
          estimated_total_recovery_hours: { type: "number" },
          confidence_score: { type: "number", minimum: 0, maximum: 100 }
        },
        required: ["recovery_plan", "estimated_total_recovery_hours", "confidence_score"]
      }
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});