import { useMemo } from 'react';
import { addMonths, format, isBefore, isAfter, startOfMonth } from 'date-fns';
import { CalendarDays, AlertTriangle, Wrench, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const DEFAULT_INTERVALS = {
  engine_1:            { hours: 20000, cycles: 15000 },
  engine_2:            { hours: 20000, cycles: 15000 },
  apu:                 { hours: 6000,  cycles: 3000  },
  engine_hsi:          { hours: 10000, cycles: 8000  },
  engine_epr_overhaul: { hours: 15000, cycles: 12000 },
};

const COMPONENT_LABELS = {
  engine_1: 'Eng 1', engine_2: 'Eng 2', apu: 'APU',
  engine_hsi: 'HSI', engine_epr_overhaul: 'EPR OH',
};

function projectShopVisit(record) {
  const intervalHrs = record.overhaul_interval_hours || DEFAULT_INTERVALS[record.component]?.hours || 20000;
  const intervalCyc = record.overhaul_interval_cycles || DEFAULT_INTERVALS[record.component]?.cycles || 15000;
  const sinceOHHrs  = record.total_flight_hours - (record.last_overhaul_hours || 0);
  const sinceOHCyc  = record.total_cycles - (record.last_overhaul_cycles || 0);
  const remHrs = Math.max(0, intervalHrs - sinceOHHrs);
  const remCyc = Math.max(0, intervalCyc - sinceOHCyc);
  const avgHrs = record.avg_hours_per_month || 350;
  const avgCyc = record.avg_cycles_per_month || 250;
  const moByHrs = avgHrs > 0 ? remHrs / avgHrs : 999;
  const moByCyc = avgCyc > 0 ? remCyc / avgCyc : 999;
  const monthsLeft = Math.max(0, Math.floor(Math.min(moByHrs, moByCyc)));
  const projDate = addMonths(new Date(), monthsLeft);
  const windowStart = addMonths(projDate, -1);
  const windowEnd   = addMonths(projDate, 1);
  const pctUsed = Math.max(
    Math.min(100, (sinceOHHrs / intervalHrs) * 100),
    Math.min(100, (sinceOHCyc / intervalCyc) * 100)
  );
  let urgency = 'scheduled';
  if (monthsLeft === 0) urgency = 'overdue';
  else if (monthsLeft <= 2) urgency = 'critical';
  else if (monthsLeft <= 6) urgency = 'soon';
  return { ...record, projDate, windowStart, windowEnd, monthsLeft, pctUsed, urgency };
}

const URGENCY_CFG = {
  overdue:   { color: '#ef4444', label: 'OVERDUE',   bg: 'bg-red-900/20',    border: 'border-red-500/40' },
  critical:  { color: '#f97316', label: '≤2 MONTHS', bg: 'bg-orange-900/20', border: 'border-orange-500/40' },
  soon:      { color: '#f59e0b', label: '3–6 MONTHS',bg: 'bg-amber-900/15',  border: 'border-amber-500/30' },
  scheduled: { color: '#22c55e', label: '>6 MONTHS', bg: 'bg-green-900/10',  border: 'border-green-500/20' },
};

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 },
};

// Build 18-month forward calendar grouped by month
function buildCalendar(projected) {
  const now = new Date();
  const months = Array.from({ length: 18 }, (_, i) => {
    const mo = addMonths(now, i);
    const key = format(mo, 'yyyy-MM');
    const label = format(mo, 'MMM yy');
    const visits = projected.filter(r => format(r.projDate, 'yyyy-MM') === key);
    return { key, label, visits };
  });
  return months;
}

export default function ShopVisitTimeline({ forecasts }) {
  const projected = useMemo(() =>
    forecasts.map(projectShopVisit).sort((a, b) => a.monthsLeft - b.monthsLeft),
    [forecasts]
  );

  const calendar = useMemo(() => buildCalendar(projected), [projected]);

  const overdue  = projected.filter(r => r.urgency === 'overdue').length;
  const critical = projected.filter(r => r.urgency === 'critical').length;
  const soon     = projected.filter(r => r.urgency === 'soon').length;

  if (forecasts.length === 0) {
    return (
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 text-center py-12">
        <CalendarDays className="w-10 h-10 text-gray-700 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No shop visit forecast data available</p>
        <p className="text-xs text-gray-600 mt-1">Add maintenance forecast records in Engineering Dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Overdue Now',   value: overdue,           color: 'text-red-400',    bg: 'bg-red-600/20'    },
          { label: '≤ 2 Months',    value: critical,          color: 'text-orange-400', bg: 'bg-orange-600/20' },
          { label: '3–6 Months',    value: soon,              color: 'text-amber-400',  bg: 'bg-amber-600/20'  },
          { label: 'Total Tracked', value: projected.length,  color: 'text-primary',    bg: 'bg-primary/20'    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
              <Wrench className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 18-month forward calendar */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-extrabold text-white">18-Month Shop Visit Calendar</p>
          <p className="text-xs text-gray-500 mt-0.5">Predicted shop visits per month — based on flight hours & cycle projections</p>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 px-5 py-4 min-w-max">
            {calendar.map(({ key, label, visits }) => {
              const maxUrgency = visits.reduce((acc, v) => {
                const order = { overdue: 0, critical: 1, soon: 2, scheduled: 3 };
                return order[v.urgency] < order[acc] ? v.urgency : acc;
              }, 'scheduled');
              const cfg = URGENCY_CFG[maxUrgency];
              return (
                <div key={key} className={cn('rounded-xl border min-w-[90px] p-3 flex flex-col gap-1.5', visits.length > 0 ? cfg.border + ' ' + cfg.bg : 'border-white/5 bg-[#0d1117]')}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                  {visits.length === 0 ? (
                    <p className="text-[10px] text-gray-700">—</p>
                  ) : (
                    <>
                      <p className="text-xl font-extrabold" style={{ color: cfg.color }}>{visits.length}</p>
                      <div className="space-y-0.5">
                        {visits.slice(0, 3).map(v => (
                          <p key={v.id} className="text-[9px] font-bold truncate" style={{ color: cfg.color }}>
                            {v.aircraft_tail} · {COMPONENT_LABELS[v.component] || v.component}
                          </p>
                        ))}
                        {visits.length > 3 && (
                          <p className="text-[9px] text-gray-600">+{visits.length - 3} more</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed list sorted by urgency */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-extrabold text-white">Predicted Shop Visits — All Components</p>
          <p className="text-xs text-gray-500 mt-0.5">Sorted by urgency · projected dates based on avg utilization</p>
        </div>
        <div className="divide-y divide-white/5">
          {projected.map(r => {
            const cfg = URGENCY_CFG[r.urgency];
            return (
              <div key={r.id} className={cn('flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 border-l-2 transition-all', cfg.border)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold font-mono text-white">{r.aircraft_tail}</span>
                    <span className="text-xs text-gray-400">{COMPONENT_LABELS[r.component] || r.component}</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{r.aircraft_type || '—'}</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className="text-sm font-extrabold text-white">{format(r.projDate, 'MMM yyyy')}</p>
                  <p className="text-[10px] text-gray-500">
                    Window: {format(r.windowStart, 'MMM d')} – {format(r.windowEnd, 'MMM d')}
                  </p>
                  <p className="text-[10px]" style={{ color: cfg.color }}>{r.monthsLeft === 0 ? 'OVERDUE' : `${r.monthsLeft} months`}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}