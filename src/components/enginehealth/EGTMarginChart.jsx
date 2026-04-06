import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend
} from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11 },
  itemStyle: { color: '#e2e8f0' },
};

/**
 * Parses TelemetryImport records whose data_type is 'egt_margin' or 'engine_health'
 * and whose raw_summary contains EGT fields, then builds a time-series per tail.
 */
function buildEGTSeries(imports) {
  const byTail = {};
  imports.forEach(imp => {
    if (!['egt_margin', 'engine_health'].includes(imp.data_type)) return;
    let summary = {};
    try { summary = JSON.parse(imp.raw_summary || '{}'); } catch {}
    if (summary.avg_egt_margin == null) return;

    const tail = imp.aircraft_tail || 'Fleet';
    if (!byTail[tail]) byTail[tail] = [];
    byTail[tail].push({
      date: imp.period_end || imp.created_date?.slice(0, 10) || '—',
      avg: summary.avg_egt_margin,
      min: summary.min_egt_margin,
      max: summary.max_egt_margin,
    });
  });
  // Sort each tail by date
  Object.values(byTail).forEach(arr => arr.sort((a, b) => a.date.localeCompare(b.date)));
  return byTail;
}

const TAIL_COLORS = ['#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899'];

export default function EGTMarginChart({ imports }) {
  const seriesByTail = useMemo(() => buildEGTSeries(imports), [imports]);
  const tails = Object.keys(seriesByTail);

  // Flatten to unified timeline for multi-line
  const allDates = [...new Set(tails.flatMap(t => seriesByTail[t].map(d => d.date)))].sort();
  const chartData = allDates.map(date => {
    const row = { date };
    tails.forEach(tail => {
      const pt = seriesByTail[tail].find(d => d.date === date);
      if (pt) { row[`${tail}_avg`] = pt.avg; row[`${tail}_min`] = pt.min; }
    });
    return row;
  });

  // Latest EGT margin per tail for summary cards
  const latestByTail = tails.map(tail => {
    const pts = seriesByTail[tail];
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const trend = prev ? last.avg - prev.avg : 0;
    return { tail, avg: last.avg, min: last.min, trend };
  });

  if (tails.length === 0) {
    return (
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 text-center py-12">
        <TrendingDown className="w-10 h-10 text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No EGT margin data imported yet</p>
        <p className="text-xs text-gray-600 mt-1">Import engine_health or egt_margin telemetry via the OEM Telemetry Hub</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {latestByTail.map(({ tail, avg, min, trend }, i) => {
          const critical = min != null && min < 20;
          const watch = min != null && min < 40;
          return (
            <div key={tail} className={cn('rounded-2xl border px-4 py-3 space-y-1',
              critical ? 'border-red-500/40 bg-red-900/15' :
              watch    ? 'border-amber-500/40 bg-amber-900/15' :
              'border-white/10 bg-[#141922]'
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white">{tail}</span>
                {critical && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              </div>
              <p className={cn('text-2xl font-extrabold font-mono',
                critical ? 'text-red-400' : watch ? 'text-amber-400' : 'text-green-400'
              )}>{avg != null ? `${avg}°C` : '—'}</p>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Avg EGT Margin</span>
                <span className={cn('flex items-center gap-0.5 font-bold',
                  trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-500'
                )}>
                  {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                  {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}°` : 'stable'}
                </span>
              </div>
              {min != null && (
                <p className={cn('text-[10px]', critical ? 'text-red-400 font-bold' : 'text-gray-600')}>
                  Min: {min}°C {critical && '⚠ CRITICAL'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Multi-line trend chart */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-white mb-1">EGT Margin Trend — Fleet</p>
        <p className="text-xs text-gray-500 mb-4">Average EGT margin (°C) over time · lower = closer to limit</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="°" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}°C`]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
            <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'LIMIT', fill: '#ef4444', fontSize: 9 }} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'WATCH', fill: '#f59e0b', fontSize: 9 }} />
            {tails.map((tail, i) => (
              <Line key={tail} type="monotone" dataKey={`${tail}_avg`}
                stroke={TAIL_COLORS[i % TAIL_COLORS.length]}
                strokeWidth={2} dot={{ r: 3 }} name={tail}
                connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}