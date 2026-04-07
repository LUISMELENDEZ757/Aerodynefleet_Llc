import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { defectCode, description, ataChapter, severity } = body;

    if (!description) {
      return Response.json({ error: 'Description required' }, { status: 400 });
    }

    const prompt = `Analyze this aircraft defect for maintenance troubleshooting:
- Code: ${defectCode || 'N/A'}
- Description: ${description}
- ATA Chapter: ${ataChapter || 'N/A'}
- Severity: ${severity || 'Unknown'}

Provide:
1. Root cause analysis
2. Recommended corrective actions
3. Safety implications
4. Estimated repair time`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          rootCause: { type: 'string' },
          actions: { type: 'array', items: { type: 'string' } },
          safetyLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          estimatedTime: { type: 'string' },
        },
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});