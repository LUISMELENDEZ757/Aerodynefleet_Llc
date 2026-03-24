import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Loader2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IROPSRecoveryAI({ event }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an experienced airline Operations Control Center (OCC) supervisor at a US airline.

An IROPS event has occurred. Generate a prioritized recovery plan.

Event Details:
- Type: ${event.event_type}
- Title: ${event.title}
- Description: ${event.description || 'N/A'}
- Severity: ${event.severity}
- Affected Station: ${event.affected_station || 'Multiple'}
- Affected Flights: ${event.affected_flights?.join(', ') || 'TBD'}
- PAX Impacted: ${event.pax_impacted || 0}
- Estimated Cost Impact: $${event.cost_impact || 0}

Provide a 5-7 step recovery plan covering: immediate crew actions, passenger reaccommodation, aircraft swaps if needed, communication plan, and timeline. Be specific and actionable. Use aviation industry terminology.`,
      response_json_schema: {
        type: 'object',
        properties: {
          urgency: { type: 'string', enum: ['immediate', 'urgent', 'routine'] },
          summary: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                step: { type: 'number' },
                action: { type: 'string' },
                owner: { type: 'string' },
                timeframe: { type: 'string' },
                priority: { type: 'string', enum: ['critical', 'high', 'medium'] },
              }
            }
          },
          crew_actions: { type: 'array', items: { type: 'string' } },
          pax_actions: { type: 'array', items: { type: 'string' } },
          comms_template: { type: 'string' },
          estimated_recovery_hours: { type: 'number' },
        }
      }
    });
    setPlan(result);
    setLoading(false);
  };

  if (!plan && !loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <button
          onClick={generatePlan}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-sm font-bold text-primary hover:bg-primary/25 transition-colors"
        >
          <Brain className="w-4 h-4" />
          Generate AI Recovery Plan
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="text-sm">AI analyzing IROPS event…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl bg-primary/5 border border-primary/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">AI Recovery Plan</p>
        </div>
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full',
          plan.urgency === 'immediate' ? 'bg-destructive/15 text-destructive' :
          plan.urgency === 'urgent' ? 'bg-orange-500/15 text-orange-400' :
          'bg-primary/15 text-primary'
        )}>
          {plan.urgency?.toUpperCase()}
        </span>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">{plan.summary}</p>

      {plan.estimated_recovery_hours && (
        <p className="text-xs text-primary font-semibold">
          Estimated recovery: ~{plan.estimated_recovery_hours}h
        </p>
      )}

      {/* Steps */}
      {plan.steps?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Action Steps</p>
          <div className="space-y-2">
            {plan.steps.map((s) => (
              <div key={s.step} className="flex items-start gap-3 bg-background/40 rounded-lg px-3 py-2">
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5',
                  s.priority === 'critical' ? 'bg-destructive text-white' :
                  s.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-secondary text-foreground'
                )}>{s.step}</span>
                <div className="flex-1">
                  <p className="text-xs text-foreground leading-relaxed">{s.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.owner} · {s.timeframe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAX actions */}
      {plan.pax_actions?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Passenger Reaccommodation</p>
          <ul className="space-y-1">
            {plan.pax_actions.map((a, i) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comms template */}
      {plan.comms_template && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">PAX Notification Template</p>
          <div className="bg-background/60 rounded-lg px-3 py-2.5 border border-border/50">
            <p className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap">{plan.comms_template}</p>
          </div>
        </div>
      )}

      <button
        onClick={generatePlan}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
      >
        Regenerate plan
      </button>
    </div>
  );
}