import { useMemo } from 'react';
import { addMonths, format, differenceInDays } from 'date-fns';
import { Wrench, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const COMPONENT_LABELS = {
  engine_1:            'Engine 1',
  engine_2:            'Engine 2',
  apu:                 'APU',
  engine_hsi:          'Engine HSI',
  engine_epr_overhaul: 'EPR Overhaul',
};

const DEFAULT_INTERVALS = {
  engine_1:            { hours: 20000, cycles: 15000 },
  engine_2:            { hours: 20000, cycles: 15000 },
  apu:                 { hours: 6000,  cycles: 3000  },
  engine_hsi:          { hours: 10000, cycles: 8000  },
  engine_epr_overhaul: { hours: 15000, cycles: 12000 },
};

function computeRemaining(record) {
  const intervalHrs = record.overhaul_interval_hours || DEFAULT_INTERVALS[record.component]?.hours || 20000;
  const intervalCyc = record.overhaul_interval_cycles || DEFAULT_INTERVALS[record.component]?.cycles || 15000;
  const sinceOHHrs  = record.total_flight_hours - (record.last_overhaul_hours || 0);
  const sinceOHCyc  = record.total_cycles - (record.last_overhaul_cycles || 0);
  const remHrs   = Math.max(0, intervalHrs - sinceOHHrs);
  const remCyc   = Math.max(0, intervalCyc - sinceOHCyc);
  const pctUsed  = Math.max(
    Math.min(100, (sinceOHHrs / intervalHrs) * 100),
    Math.min(100, (sinceOHCyc / intervalCyc) * 100)
  );
  const avgHrs = record.avg_hours_per_month || 350;
  const avgCyc = record.avg_cycles_per_month || 250;
  const moByHrs = avgHrs > 0 ? remHrs / avgHrs : 999;
  const moByCyc = avgCyc > 0 ? remCyc / avgCyc : 999;
  const monthsLeft = Math.max(0, Math.floor(Math.min(moByHrs, moByCyc)));
  const projDate = addMonths(new Date(), monthsLeft);
  let status = 'ok';
  if (pctUsed >= 100) status = 'overdue';
  else if (pctUsed >= 90 || monthsLeft <= 1) status = 'critical';
  else if (pctUsed >= 75 || monthsLeft <= 4) status = 'watch';
  return { remHrs, remCyc, pctUsed, monthsLeft, projDate, status, sinceOHHrs, sinceOHCyc, intervalHrs, intervalCyc };
}

const STATUS_CFG = {
  ok:       { color: 'text-green-400',  bar: '#22c55e', border: 'border-green-500/20', icon: CheckCircle },
  watch:    { color: 'text-yellow-400', bar: '#f59e0b', border: 'border-yellow-500/30', icon: Clock },
  critical: { color: 'text-orange-400', bar: '#f97316', border: 'border-orange-500/40', icon: AlertTriangle },
  overdue:  { color: 'text-red-400',    bar: '#ef4444', border: 'border-red-500/50',    icon: AlertTriangle },
};

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 },
};

export default function LLPLifeTable({ forecasts }) {
  const enriched = useMemo(() =>
    forecasts.map(r => ({ ...r, ...computeRemaining(r) }))
      .sort((a, b) => a.monthsLeft - b.monthsLeft),
    [forecasts]
  );

  // Bar chart: months remaining by tail+component (top 12 most urgent)
  const chartData = enriched.slice(0, 12).map(r => ({
    name: `${r.aircraft_tail}\n${COMPONENT_LABELS[r.component] || r.component}`,
    months: r.monthsLeft,
    color: STATUS_CFG[r.status]?.bar || '#22c55e',
  }));

  if (forecasts.length === 0) {
    return (
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 text-center py-12">
        <Wrench className="w-10 h-10 text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No LLP / component forecast data</p>
        <p className="text-xs text-gray-600 mt-1">Add records in Engineering → Maintenance Forecast</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Remaining Life Bar Chart */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-white mb-1">Remaining Engine Life — All Components</p>
        <p className="text-xs text-gray-500 mb-4">Months until projected shop visit (limiting parameter: hours or cycles)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} interval={0} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="mo" />
            <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v} months`, 'Remaining']} />
            <Bar dataKey="months" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-extrabold text-white">LLP / Component Life Detail</p>
          <p className="text-xs text-gray-500 mt-0.5">Sorted by urgency — most critical first</p>
        </div>
        <div className="divide-y divide-white/5">
          {enriched.map(r => {
            const st = STATUS_CFG[r.status] || STATUS_CFG.ok;
            const Icon = st.icon;
            return (
              <div key={r.id} className={cn('flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 border-l-2 transition-all', st.border)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${st.bar}22` }}>
                  <Icon className="w-4 h-4" style={{ color: st.bar }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold font-mono text-white">{r.aircraft_tail}</span>
                    <span className="text-xs text-gray-400">{COMPONENT_LABELS[r.component] || r.component}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${st.bar}20`, color: st.bar }}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                  {/* Usage bar */}
                  <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mb-1">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.pctUsed)}%`, background: st.bar }} />
                  </div>
                  <div className="flex gap-3 text-[10px] text-gray-500">
                    <span>{r.sinceOHHrs.toLocaleString()} / {r.intervalHrs.toLocaleString()} hrs</span>
                    <span>{r.sinceOHCyc.toLocaleString()} / {r.intervalCyc.toLocaleString()} cyc</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-lg font-extrabold font-mono', st.color)}>{r.monthsLeft}mo</p>
                  <p className="text-[10px] text-gray-500">{r.remHrs.toLocaleString()} hrs left</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}