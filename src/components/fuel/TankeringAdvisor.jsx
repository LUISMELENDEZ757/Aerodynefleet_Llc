import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Loader2, DollarSign, Fuel, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample fuel price data by station (real system would pull from fuel contracts API)
const SAMPLE_PRICES = {
  KEWR: 4.82, KJFK: 4.95, KORD: 4.71, KLAX: 5.12, KATL: 4.55,
  KDFW: 4.48, KSEA: 4.89, KMIA: 4.77, KDEN: 4.62, KPHX: 4.51,
};

export default function TankeringAdvisor({ records, flights }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  const tankeringRecords = records.filter(r => r.tankering_decision !== 'none');
  const totalSavings = tankeringRecords.reduce((s, r) => s + (r.tankering_savings || 0), 0);

  const getAdvice = async () => {
    setLoading(true);
    const flightRoutes = flights.slice(0, 8).map(f => ({
      flight: f.flight_number,
      origin: f.origin,
      destination: f.destination,
      originPrice: SAMPLE_PRICES[f.origin] || 4.75,
      destPrice: SAMPLE_PRICES[f.destination] || 4.75,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an airline fuel planning analyst. Analyze these flights and provide tankering recommendations.

Flights today:
${flightRoutes.map(r => `${r.flight}: ${r.origin} ($${r.originPrice}/gal) → ${r.destination} ($${r.destPrice}/gal)`).join('\n')}

For each flight where tankering makes sense (destination price > origin price by >5%), recommend:
1. Whether to tanker
2. How many extra lbs to uplift (typical narrow-body range: 2000-8000 lbs extra)
3. Estimated savings

Consider: extra fuel weight increases fuel burn ~0.4% per 1000 lbs extra carried, typical narrow-body fuel burn ~6000 lbs/hr.`,
      response_json_schema: {
        type: 'object',
        properties: {
          total_estimated_savings: { type: 'number' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                flight: { type: 'string' },
                recommend_tanker: { type: 'boolean' },
                extra_lbs: { type: 'number' },
                savings_usd: { type: 'number' },
                reasoning: { type: 'string' },
              }
            }
          },
          summary: { type: 'string' }
        }
      }
    });
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-xl font-extrabold font-mono text-green-400">${totalSavings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Tankering Savings</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
          <Fuel className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xl font-extrabold font-mono text-primary">{tankeringRecords.length}</p>
            <p className="text-xs text-muted-foreground">Tankering Decisions</p>
          </div>
        </div>
      </div>

      {/* Sample price map */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Fuel Prices by Station ($/gal)
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {Object.entries(SAMPLE_PRICES).map(([icao, price]) => (
            <div key={icao} className="bg-secondary/50 rounded-lg px-2 py-2 text-center">
              <p className="text-xs font-mono font-bold text-foreground">{icao}</p>
              <p className={cn('text-sm font-mono font-extrabold',
                price < 4.60 ? 'text-green-400' : price > 4.90 ? 'text-destructive' : 'text-primary'
              )}>${price}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Sample data — connect to fuel contracts API for live pricing</p>
      </div>

      {/* AI Advisor */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            AI Tankering Advisor
          </p>
          <button
            onClick={getAdvice}
            disabled={loading || flights.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {loading ? 'Analyzing…' : 'Analyze Today\'s Flights'}
          </button>
        </div>

        {!advice && !loading && (
          <p className="text-xs text-muted-foreground">
            Click "Analyze" to get AI-powered tankering recommendations based on today's routes and fuel prices.
          </p>
        )}

        {advice && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <DollarSign className="w-4 h-4 text-green-400" />
              <p className="text-sm font-bold text-green-400">
                Estimated Savings: ${advice.total_estimated_savings?.toLocaleString() || 0}
              </p>
            </div>
            <p className="text-xs text-foreground/80">{advice.summary}</p>

            <div className="space-y-2">
              {advice.recommendations?.map((rec, i) => (
                <div key={i} className={cn(
                  'flex items-start gap-3 rounded-xl px-3 py-2.5 border',
                  rec.recommend_tanker ? 'bg-green-500/5 border-green-500/20' : 'bg-secondary/30 border-border'
                )}>
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    rec.recommend_tanker ? 'bg-green-500 text-white' : 'bg-secondary text-muted-foreground'
                  )}>
                    {rec.recommend_tanker ? <CheckCircle className="w-3 h-3" /> : '—'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-bold text-foreground">{rec.flight}</p>
                      {rec.recommend_tanker && (
                        <>
                          <span className="text-xs text-green-400 font-semibold">+{rec.extra_lbs?.toLocaleString()} lbs</span>
                          <span className="text-xs text-green-400">≈ ${rec.savings_usd?.toFixed(0)}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}