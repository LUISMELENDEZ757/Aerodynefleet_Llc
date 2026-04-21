import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PredictiveAnalysisTab({ reports, typeFilter }) {
  // Analyze faults over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentFaults = reports.filter(r => {
    const reportDate = new Date(r.report_timestamp);
    return reportDate >= thirtyDaysAgo && (typeFilter === 'All Types' || r.aircraft_type === typeFilter);
  });

  // Group faults by system and aircraft type
  const faultsBySystem = {};
  const faultTimeline = {};

  recentFaults.forEach(r => {
    r.systems?.forEach(sys => {
      if (sys.status === 'fault' || sys.status === 'caution') {
        const key = `${r.aircraft_type}/${sys.system_name}`;
        const dateKey = new Date(r.report_timestamp).toISOString().split('T')[0];

        if (!faultsBySystem[key]) {
          faultsBySystem[key] = {
            system: sys.system_name,
            aircraft_type: r.aircraft_type,
            fault_code: sys.fault_code,
            message: sys.message,
            count: 0,
            severity: sys.status,
            first_seen: r.report_timestamp,
            last_seen: r.report_timestamp,
            tails: new Set(),
          };
        }
        faultsBySystem[key].count += 1;
        faultsBySystem[key].last_seen = r.report_timestamp;
        faultsBySystem[key].tails.add(r.aircraft_tail);

        if (!faultTimeline[key]) {
          faultTimeline[key] = {};
        }
        faultTimeline[key][dateKey] = (faultTimeline[key][dateKey] || 0) + 1;
      }
    });
  });

  // Sort by frequency and identify high-risk systems
  const sortedFaults = Object.values(faultsBySystem).sort((a, b) => b.count - a.count);
  const criticalFaults = sortedFaults.filter(f => f.count >= 3); // 3+ occurrences = concerning
  const highRiskSystems = sortedFaults.filter(f => f.severity === 'fault').slice(0, 10);

  // Generate timeline data for selected system
  const selectedKey = highRiskSystems[0] ? `${highRiskSystems[0].aircraft_type}/${highRiskSystems[0].system}` : null;
  const timelineData = selectedKey ? Object.entries(faultTimeline[selectedKey] || {})
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([date, count]) => ({ date: date.slice(5), occurrences: count })) : [];

  // Frequency distribution chart
  const frequencyData = sortedFaults.slice(0, 15).map(f => ({
    label: `${f.aircraft_type}/${f.system.slice(0, 8)}`,
    count: f.count,
  }));

  const hasData = sortedFaults.length > 0;

  return (
    <div className="space-y-4">
      {/* Critical alerts */}
      {criticalFaults.length > 0 && (
        <div className="space-y-2">
          {criticalFaults.slice(0, 5).map((fault, i) => (
            <div key={i} className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-300">
                  {fault.system} — {fault.count}x in 30 days
                </p>
                <p className="text-xs text-red-400 mt-0.5">
                  Affects {fault.tails.size} aircraft • {fault.fault_code || 'Unknown code'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasData && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <TrendingUp className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 font-bold">No fault data available</p>
          <p className="text-gray-600 text-xs">Ingest avionics reports to analyze fault trends</p>
        </div>
      )}

      {hasData && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#141922] border border-white/8 rounded-xl px-4 py-3">
              <p className="text-2xl font-black text-red-400">{criticalFaults.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Critical Systems</p>
            </div>
            <div className="bg-[#141922] border border-white/8 rounded-xl px-4 py-3">
              <p className="text-2xl font-black text-amber-400">{sortedFaults.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Unique Faults</p>
            </div>
            <div className="bg-[#141922] border border-white/8 rounded-xl px-4 py-3">
              <p className="text-2xl font-black text-cyan-400">{recentFaults.length}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Reports</p>
            </div>
          </div>

          {/* Frequency chart */}
          {frequencyData.length > 0 && (
            <div className="bg-[#141922] border border-white/8 rounded-2xl p-4">
              <p className="text-sm font-bold text-white mb-3">Top Recurring Faults (30 days)</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={frequencyData} margin={{ top: 5, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="label" stroke="#888" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #333' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Fault timeline */}
          {timelineData.length > 0 && (
            <div className="bg-[#141922] border border-white/8 rounded-2xl p-4">
              <p className="text-sm font-bold text-white mb-3">Trend: {highRiskSystems[0]?.system || 'Top System'}</p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#888" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="occurrences" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* High-risk systems table */}
          {highRiskSystems.length > 0 && (
            <div className="bg-[#141922] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" /> High-Risk Systems (Last 30 Days)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8">
                      {['System', 'Type', 'Occurrences', 'Aircraft', 'Fault Code', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {highRiskSystems.map((fault, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-bold text-white text-sm">{fault.system}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{fault.aircraft_type}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-bold px-2 py-1 rounded-full',
                            fault.count >= 5 ? 'bg-red-500/20 text-red-400' :
                            fault.count >= 3 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-yellow-500/20 text-yellow-400')}>
                            {fault.count}x
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-cyan-400 font-bold">{fault.tails.size}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{fault.fault_code || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-[10px] font-bold px-2 py-1 rounded',
                            fault.severity === 'fault' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}>
                            {fault.severity?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}