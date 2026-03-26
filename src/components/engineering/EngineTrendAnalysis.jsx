import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine
} from 'recharts';
import { AlertTriangle, Flame, Zap, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_COLOR = {
  warning:  '#ef4444',
  caution:  '#f59e0b',
  advisory: '#3b82f6',
  memo:     '#6b7280',
};

const SYSTEM_CFG = {
  engine:   { label: 'Engine',   color: '#ef4444', icon: Flame },
  apu:      { label: 'APU',      color: '#a855f7', icon: Zap },
  hydraulics:{ label: 'Hyd',    color: '#3b82f6', icon: Wind },
  electrical:{ label: 'Elec',   color: '#f59e0b', icon: Zap },
  other:    { label: 'Other',    color: '#6b7280', icon: AlertTriangle },
};

function groupByMonth(faults) {
  const map = {};
  faults.forEach(f => {
    const d = new Date(f.created_date || f.detected_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { month: key, warning: 0, caution: 0, advisory: 0, memo: 0, total: 0 };
    map[key][f.severity] = (map[key][f.severity] || 0) + 1;
    map[key].total++;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
}

function groupBySystem(faults) {
  const map = {};
  faults.forEach(f => {
    const sys = f.system || 'other';
    map[sys] = (map[sys] || 0) + 1;
  });
  return Object.entries(map)
    .map(([system, count]) => ({ system, count, ...SYSTEM_CFG[system] }))
    .sort((a, b) => b.count - a.count);
}

function groupByATA(entries) {
  const map = {};
  entries.forEach(e => {
    const ata = e.ata_chapter || 'N/A';
    map[ata] = (map[ata] || 0) + 1;
  });
  return Object.entries(map)
    .map(([ata, count]) => ({ ata: `ATA ${ata}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function cyclesByAircraft(faults, aircraft) {
  const map = {};
  faults.forEach(f => {
    if (!f.aircraft_tail) return;
    map[f.aircraft_tail] = (map[f.aircraft_tail] || 0) + 1;
  });
  return Object.entries(map)
    .map(([tail, faultCount]) => {
      const ac = aircraft.find(a => a.tail_number === tail);
      return { tail, faultCount, type: ac?.aircraft_type || '—' };
    })
    .sort((a, b) => b.faultCount - a.faultCount)
    .slice(0, 8);
}

const tooltipStyle = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 },
  itemStyle: { color: '#e2e8f0' },
};

export default function EngineTrendAnalysis({ faults, logbookEntries, aircraft, selectedTail }) {
  const monthlyFaults   = useMemo(() => groupByMonth(faults), [faults]);
  const bySystem        = useMemo(() => groupBySystem(faults), [faults]);
  const byATA           = useMemo(() => groupByATA(logbookEntries), [logbookEntries]);
  const byAircraft      = useMemo(() => cyclesByAircraft(faults, aircraft), [faults, aircraft]);

  const engineFaults = faults.filter(f => f.system === 'engine');
  const activeFaults = faults.filter(f => f.status === 'active');
  const recentFaults = [...faults].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Monthly fault trend */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-white mb-1">Monthly Fault Trend (Last 12 Months)</p>
        <p className="text-xs text-gray-500 mb-4">EICAS/BITE fault message volume by severity</p>
        {monthlyFaults.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-10">No fault data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyFaults} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="warning"  fill="#ef4444" stackId="a" radius={[0,0,0,0]} name="Warning" />
              <Bar dataKey="caution"  fill="#f59e0b" stackId="a" name="Caution" />
              <Bar dataKey="advisory" fill="#3b82f6" stackId="a" name="Advisory" />
              <Bar dataKey="memo"     fill="#6b7280" stackId="a" radius={[4,4,0,0]} name="Memo" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Faults by System */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-1">Faults by ATA System</p>
          <p className="text-xs text-gray-500 mb-4">System-level fault distribution</p>
          {bySystem.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No data</p>
          ) : (
            <div className="space-y-3">
              {bySystem.map(({ system, count, label, color, icon: Icon }) => {
                const pct = Math.min(100, (count / (bySystem[0]?.count || 1)) * 100);
                return (
                  <div key={system} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}22` }}>
                      {Icon && <Icon className="w-4 h-4" style={{ color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-white">{label || system}</span>
                        <span className="text-xs font-bold" style={{ color }}>{count}</span>
                      </div>
                      <div className="bg-white/10 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top ATA chapters */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-1">Top ATA Chapters — Logbook</p>
          <p className="text-xs text-gray-500 mb-4">Most frequently logged chapters</p>
          {byATA.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byATA} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis dataKey="ata" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={60} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Entries" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Faults per aircraft */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-white mb-1">Fault Events by Aircraft</p>
        <p className="text-xs text-gray-500 mb-4">Fleet-wide fault frequency ranking</p>
        {byAircraft.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">No data</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byAircraft} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="tail" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="faultCount" fill="#f59e0b" radius={[4,4,0,0]} name="Faults" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent fault feed */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-extrabold text-white">Recent Fault Events</p>
          <p className="text-xs text-gray-500 mt-0.5">Latest EICAS/BITE messages across fleet</p>
        </div>
        {recentFaults.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-10">No fault records</p>
        ) : (
          <div className="divide-y divide-white/5">
            {recentFaults.map(f => {
              const sev = f.severity || 'advisory';
              const color = SEVERITY_COLOR[sev] || '#6b7280';
              return (
                <div key={f.id} className="flex items-start gap-4 px-5 py-3">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-mono">{f.fault_code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: `${color}22`, color }}>
                        {sev}
                      </span>
                      <span className="text-[10px] text-gray-500">{f.aircraft_tail}</span>
                      {f.ata_chapter && <span className="text-[10px] text-gray-600">ATA {f.ata_chapter}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{f.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-600 font-mono">
                      {new Date(f.created_date).toLocaleDateString()}
                    </p>
                    <span className={cn('text-[10px] font-bold', f.status === 'active' ? 'text-red-400' : 'text-green-400')}>
                      {f.status?.toUpperCase()}
                    </span>
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