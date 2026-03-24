import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function FuelVarianceTable({ records }) {
  const withVariance = records.filter(r => r.variance_lbs != null);

  if (withVariance.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No fuel variance records available. Log fuel records to see variance analysis.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'Avg Variance',
            value: `${(withVariance.reduce((s, r) => s + (r.variance_percent || 0), 0) / withVariance.length).toFixed(1)}%`,
            color: 'text-foreground'
          },
          {
            label: 'Over Plan',
            value: withVariance.filter(r => (r.variance_lbs || 0) > 0).length,
            color: 'text-orange-400'
          },
          {
            label: 'Under Plan',
            value: withVariance.filter(r => (r.variance_lbs || 0) < 0).length,
            color: 'text-green-400'
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-xl font-extrabold font-mono', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2 bg-secondary/60 border-b border-border grid grid-cols-5 gap-2">
          {['Flight', 'Date', 'Planned', 'Actual', 'Variance'].map(h => (
            <p key={h} className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{h}</p>
          ))}
        </div>
        <div className="divide-y divide-border/30 max-h-[50vh] overflow-y-auto scrollbar-hide">
          {withVariance.map(r => {
            const variance = r.variance_lbs || 0;
            const pct = r.variance_percent || 0;
            const isHigh = Math.abs(pct) > 5;
            return (
              <div key={r.id} className={cn('grid grid-cols-5 gap-2 px-4 py-2.5 items-center', isHigh && 'bg-orange-500/5')}>
                <div>
                  <p className="text-xs font-mono font-bold text-foreground">{r.flight_number || '—'}</p>
                  <p className="text-xs text-muted-foreground">{r.aircraft_tail || '—'}</p>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{r.flight_date || '—'}</p>
                <p className="text-xs font-mono text-foreground">{r.trip_fuel_planned?.toLocaleString() || '—'}</p>
                <p className="text-xs font-mono text-foreground">{r.trip_fuel_actual?.toLocaleString() || '—'}</p>
                <div className="flex items-center gap-1">
                  {variance > 0 ? <TrendingUp className="w-3 h-3 text-orange-400" /> : variance < 0 ? <TrendingDown className="w-3 h-3 text-green-400" /> : null}
                  <span className={cn('text-xs font-mono font-bold',
                    variance > 0 ? 'text-orange-400' : variance < 0 ? 'text-green-400' : 'text-muted-foreground'
                  )}>
                    {variance > 0 ? '+' : ''}{variance?.toLocaleString()}
                  </span>
                  {isHigh && <AlertTriangle className="w-3 h-3 text-orange-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}