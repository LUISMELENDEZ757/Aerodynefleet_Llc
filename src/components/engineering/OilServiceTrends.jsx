import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Droplets, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 },
  itemStyle: { color: '#e2e8f0' },
};

// Parse oil quantities from logbook description text
function parseOilEntry(entry) {
  const desc = entry.description || '';
  const dateStr = entry.created_date;
  const date = new Date(dateStr);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const eng1Match = desc.match(/Engine 1[:\s]+(\d+(?:\.\d+)?)\s*qt/i);
  const eng2Match = desc.match(/Engine 2[:\s]+(\d+(?:\.\d+)?)\s*qt/i);
  const apuMatch  = desc.match(/APU[:\s]+(\d+(?:\.\d+)?)\s*qt/i);

  return {
    id: entry.id,
    aircraft_tail: entry.aircraft_tail,
    month,
    date: dateStr,
    eng1: eng1Match ? parseFloat(eng1Match[1]) : null,
    eng2: eng2Match ? parseFloat(eng2Match[1]) : null,
    apu:  apuMatch  ? parseFloat(apuMatch[1])  : null,
    station: entry.station || '—',
    technician: entry.technician_name || '—',
  };
}

function groupMonthlyOil(oilEvents) {
  const map = {};
  oilEvents.forEach(e => {
    if (!map[e.month]) map[e.month] = { month: e.month, eng1Total: 0, eng2Total: 0, apuTotal: 0, count: 0 };
    if (e.eng1 != null) map[e.month].eng1Total += e.eng1;
    if (e.eng2 != null) map[e.month].eng2Total += e.eng2;
    if (e.apu  != null) map[e.month].apuTotal  += e.apu;
    map[e.month].count++;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
}

function groupByTailOil(oilEvents) {
  const map = {};
  oilEvents.forEach(e => {
    if (!e.aircraft_tail) return;
    if (!map[e.aircraft_tail]) map[e.aircraft_tail] = { tail: e.aircraft_tail, eng1: 0, eng2: 0, apu: 0, services: 0 };
    if (e.eng1 != null) map[e.aircraft_tail].eng1 += e.eng1;
    if (e.eng2 != null) map[e.aircraft_tail].eng2 += e.eng2;
    if (e.apu  != null) map[e.aircraft_tail].apu  += e.apu;
    map[e.aircraft_tail].services++;
  });
  return Object.values(map).sort((a, b) => (b.eng1 + b.eng2) - (a.eng1 + a.eng2));
}

export default function OilServiceTrends({ logbookEntries, aircraft, selectedTail }) {
  const oilEvents = useMemo(() => {
    return logbookEntries
      .filter(e => e.ata_chapter === '79' || (e.description || '').includes('[OIL SERVICE]'))
      .map(parseOilEntry);
  }, [logbookEntries]);

  const monthlyData   = useMemo(() => groupMonthlyOil(oilEvents), [oilEvents]);
  const byTailData    = useMemo(() => groupByTailOil(oilEvents), [oilEvents]);
  const recentEvents  = useMemo(() =>
    [...oilEvents].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
    [oilEvents]
  );

  // Averages
  const totalEng1 = oilEvents.reduce((s, e) => s + (e.eng1 || 0), 0);
  const totalEng2 = oilEvents.reduce((s, e) => s + (e.eng2 || 0), 0);
  const totalAPU  = oilEvents.reduce((s, e) => s + (e.apu  || 0), 0);
  const serviceCount = oilEvents.length;
  const avgEng1   = serviceCount > 0 ? (totalEng1 / serviceCount).toFixed(1) : '—';
  const avgEng2   = serviceCount > 0 ? (totalEng2 / serviceCount).toFixed(1) : '—';
  const avgAPU    = serviceCount > 0 ? (totalAPU  / serviceCount).toFixed(1) : '—';

  // High consumption alerts (eng > 6 qt or APU > 3 qt in single service)
  const highConsumption = oilEvents.filter(e => (e.eng1 || 0) > 6 || (e.eng2 || 0) > 6 || (e.apu || 0) > 3);

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Services',  value: serviceCount,        color: 'text-emerald-400' },
          { label: 'Avg ENG 1 (qt)', value: `${avgEng1} qt`,      color: 'text-cyan-400' },
          { label: 'Avg ENG 2 (qt)', value: `${avgEng2} qt`,      color: 'text-cyan-400' },
          { label: 'Avg APU (qt)',   value: `${avgAPU} qt`,        color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4">
            <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* High consumption alert */}
      {highConsumption.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-amber-400 mb-1">High Oil Consumption Detected</p>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {highConsumption.length} service event(s) recorded above threshold (ENG &gt;6 qt / APU &gt;3 qt).
              Review engine condition reports and borescope inspection records.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {highConsumption.slice(0, 5).map(e => (
                <span key={e.id} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300">
                  {e.aircraft_tail} — {new Date(e.date).toLocaleDateString()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly oil volume trend */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-white mb-1">Monthly Oil Consumption — ATA 79</p>
        <p className="text-xs text-gray-500 mb-4">Total quarts added per engine per month</p>
        {monthlyData.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-10">No oil service records found</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" qt" />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Line type="monotone" dataKey="eng1Total" stroke="#22d3ee" strokeWidth={2} dot={false} name="ENG 1 Total (qt)" />
              <Line type="monotone" dataKey="eng2Total" stroke="#10b981" strokeWidth={2} dot={false} name="ENG 2 Total (qt)" />
              <Line type="monotone" dataKey="apuTotal"  stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="4 2" name="APU Total (qt)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Oil by aircraft (stacked bar) */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-white mb-1">Cumulative Oil Added by Aircraft</p>
        <p className="text-xs text-gray-500 mb-4">Total quarts consumed fleet-wide (all service events)</p>
        {byTailData.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">No data</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTailData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="tail" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" qt" />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Bar dataKey="eng1" stackId="a" fill="#22d3ee" name="ENG 1 (qt)" />
              <Bar dataKey="eng2" stackId="a" fill="#10b981" name="ENG 2 (qt)" />
              <Bar dataKey="apu"  stackId="a" fill="#a855f7" radius={[4,4,0,0]} name="APU (qt)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent oil service log */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <p className="text-sm font-extrabold text-white">Recent Oil Service Events</p>
        </div>
        {recentEvents.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-10">No oil service records found</p>
        ) : (
          <div className="divide-y divide-white/5">
            {recentEvents.map(e => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-900/40 flex items-center justify-center flex-shrink-0">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white font-mono">{e.aircraft_tail || '—'}</span>
                    <span className="text-xs text-gray-500">{e.station}</span>
                    <span className="text-xs text-gray-600">{e.technician}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {e.eng1 != null && <span className="text-xs text-cyan-400 font-bold">ENG1: {e.eng1}qt</span>}
                    {e.eng2 != null && <span className="text-xs text-emerald-400 font-bold">ENG2: {e.eng2}qt</span>}
                    {e.apu  != null && <span className="text-xs text-purple-400 font-bold">APU: {e.apu}qt</span>}
                    {e.eng1 == null && e.eng2 == null && e.apu == null && (
                      <span className="text-xs text-gray-600">No qty parsed</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 font-mono flex-shrink-0">
                  {new Date(e.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}