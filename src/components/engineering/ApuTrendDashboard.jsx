import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts';
import {
  Zap, AlertTriangle, CheckCircle, Clock, Wrench,
  TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 },
  itemStyle: { color: '#e2e8f0' },
};

const SEVERITY_COLOR = {
  warning:  '#ef4444',
  caution:  '#f59e0b',
  advisory: '#3b82f6',
  memo:     '#6b7280',
};

const STATUS_COLOR = {
  active:  { label: 'ACTIVE',  color: 'text-red-400',   bg: 'bg-red-500/15' },
  cleared: { label: 'CLEARED', color: 'text-green-400', bg: 'bg-green-500/15' },
  deferred:{ label: 'DEFERRED',color: 'text-orange-400',bg: 'bg-orange-500/15' },
};

function groupApuByMonth(faults) {
  const map = {};
  faults.forEach(f => {
    const d = new Date(f.created_date || f.detected_at);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { month: key, warning: 0, caution: 0, advisory: 0, total: 0 };
    map[key][f.severity] = (map[key][f.severity] || 0) + 1;
    map[key].total++;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
}

function groupApuByAircraft(faults, aircraft) {
  const map = {};
  faults.forEach(f => {
    if (!f.aircraft_tail) return;
    map[f.aircraft_tail] = (map[f.aircraft_tail] || 0) + 1;
  });
  return Object.entries(map)
    .map(([tail, count]) => {
      const ac = aircraft.find(a => a.tail_number === tail);
      return { tail, count, type: ac?.aircraft_type || '—' };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function groupApuByATA(faults) {
  const map = {};
  faults.forEach(f => {
    const ata = f.ata_chapter || 'Unknown';
    map[ata] = (map[ata] || 0) + 1;
  });
  return Object.entries(map)
    .map(([ata, count]) => ({ ata: `ATA ${ata}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export default function ApuTrendDashboard({ faults, aircraft, selectedTail }) {
  const apuFaults = useMemo(
    () => faults.filter(f => f.system === 'apu'),
    [faults]
  );

  const monthlyTrend  = useMemo(() => groupApuByMonth(apuFaults), [apuFaults]);
  const byAircraft    = useMemo(() => groupApuByAircraft(apuFaults, aircraft), [apuFaults, aircraft]);
  const byATA         = useMemo(() => groupApuByATA(apuFaults), [apuFaults]);

  const active   = apuFaults.filter(f => f.status === 'active').length;
  const cleared  = apuFaults.filter(f => f.status === 'cleared').length;
  const deferred = apuFaults.filter(f => f.status === 'deferred').length;
  const warnings = apuFaults.filter(f => f.severity === 'warning').length;

  const recentFaults = [...apuFaults]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);

  // Most affected tail
  const topTail = byAircraft[0];

  // Trend arrow: compare last 2 months
  const trendUp = monthlyTrend.length >= 2 &&
    monthlyTrend[monthlyTrend.length - 1].total > monthlyTrend[monthlyTrend.length - 2].total;

  return (
    <div className="space-y-5">

      {/* KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total APU Faults', value: apuFaults.length, color: 'text-purple-400', bg: 'bg-purple-600/20', icon: Zap },
          { label: 'Active',           value: active,            color: 'text-red-400',    bg: 'bg-red-600/20',    icon: AlertTriangle },
          { label: 'Cleared',          value: cleared,           color: 'text-green-400',  bg: 'bg-green-600/20',  icon: CheckCircle },
          { label: 'Warnings',         value: warnings,          color: 'text-amber-400',  bg: 'bg-amber-600/20',  icon: Wrench },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend indicator banner */}
      {apuFaults.length > 0 && (
        <div className={cn(
          'rounded-2xl border px-5 py-3.5 flex items-center gap-3',
          trendUp
            ? 'bg-red-900/20 border-red-500/30'
            : 'bg-green-900/20 border-green-500/30'
        )}>
          {trendUp
            ? <TrendingUp className="w-5 h-5 text-red-400 flex-shrink-0" />
            : <TrendingDown className="w-5 h-5 text-green-400 flex-shrink-0" />}
          <div>
            <p className={cn('text-sm font-extrabold', trendUp ? 'text-red-400' : 'text-green-400')}>
              {trendUp ? 'APU Fault Rate Increasing' : 'APU Fault Rate Stable or Decreasing'}
            </p>
            <p className="text-xs text-gray-500">
              {topTail
                ? `Highest fault count: ${topTail.tail} (${topTail.count} events) · ${topTail.type}`
                : 'No tail-specific concentration detected'}
            </p>
          </div>
        </div>
      )}

      {/* Monthly APU fault trend */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-white mb-1">APU Fault Trend — Last 12 Months</p>
        <p className="text-xs text-gray-500 mb-4">EICAS/BITE APU fault message volume by severity</p>
        {monthlyTrend.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Zap className="w-10 h-10 text-gray-700" />
            <p className="text-gray-600 text-sm">No APU fault data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="warning"  fill="#ef4444" stackId="a" name="Warning" />
              <Bar dataKey="caution"  fill="#f59e0b" stackId="a" name="Caution" />
              <Bar dataKey="advisory" fill="#a855f7" stackId="a" radius={[4,4,0,0]} name="Advisory" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* By Aircraft */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-1">APU Faults by Aircraft</p>
          <p className="text-xs text-gray-500 mb-4">Tail-level APU event frequency</p>
          {byAircraft.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No data</p>
          ) : (
            <div className="space-y-2.5">
              {byAircraft.slice(0, 7).map(({ tail, count, type }) => {
                const pct = Math.min(100, (count / (byAircraft[0]?.count || 1)) * 100);
                return (
                  <div key={tail} className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-white w-20 flex-shrink-0">{tail}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-500">{type}</span>
                        <span className="text-xs font-bold text-purple-400">{count}</span>
                      </div>
                      <div className="bg-white/10 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By ATA Chapter */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-1">APU Faults by ATA Chapter</p>
          <p className="text-xs text-gray-500 mb-4">Top fault code distribution</p>
          {byATA.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={byATA} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis dataKey="ata" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={65} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} name="Faults" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent APU fault feed */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-sm font-extrabold text-white">Recent APU Fault Events</p>
            <p className="text-xs text-gray-500 mt-0.5">Latest EICAS/BITE APU messages</p>
          </div>
        </div>
        {recentFaults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <CheckCircle className="w-10 h-10 text-gray-700" />
            <p className="text-gray-600 text-sm">No APU fault records found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentFaults.map(f => {
              const sev = f.severity || 'advisory';
              const color = SEVERITY_COLOR[sev] || '#6b7280';
              const stCfg = STATUS_COLOR[f.status] || STATUS_COLOR.active;
              return (
                <div key={f.id} className="flex items-start gap-4 px-5 py-3.5">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-mono">{f.fault_code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                        style={{ background: `${color}22`, color }}>{sev}</span>
                      <span className="text-[10px] font-mono text-gray-400">{f.aircraft_tail}</span>
                      {f.ata_chapter && <span className="text-[10px] text-gray-600">ATA {f.ata_chapter}</span>}
                    </div>
                    {f.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{f.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-600 font-mono">
                      {new Date(f.created_date).toLocaleDateString()}
                    </p>
                    <span className={cn('text-[10px] font-bold', stCfg.color)}>{stCfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}