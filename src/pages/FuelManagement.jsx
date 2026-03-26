import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Fuel, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Plane, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

const COLORS = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={cn('rounded-xl border p-4 space-y-1', color)}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <p className="text-2xl font-extrabold font-mono">{value}</p>
      </div>
      <p className="text-xs opacity-70">{label}</p>
      {sub && <p className="text-[10px] font-bold opacity-80">{sub}</p>}
    </div>
  );
}

export default function FuelManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: records = [], refetch, isLoading } = useQuery({
    queryKey: ['fuel-records'],
    queryFn: () => base44.entities.FuelRecord.list('-flight_date', 200),
    refetchInterval: 30000,
  });

  const { data: flights = [] } = useQuery({
    queryKey: ['fuel-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 100),
    refetchInterval: 30000,
  });

  const totalRecords = records.length;
  const flaggedRecords = records.filter(r => Math.abs(r.variance_percent || 0) > 5).length;
  const avgVariance = records.length > 0 
    ? (records.reduce((sum, r) => sum + Math.abs(r.variance_percent || 0), 0) / records.length).toFixed(1) 
    : 0;
  const totalTankeringSavings = records.reduce((sum, r) => sum + (r.tankering_savings || 0), 0);

  const varianceData = records.slice(0, 10).map(r => ({
    flight: r.flight_number,
    variance: Math.abs(r.variance_percent || 0),
    planned: r.planned_fuel || 0,
    actual: r.actual_uplift || 0,
  }));

  const trendData = (() => {
    const map = {};
    records.forEach(r => {
      const d = new Date(r.flight_date);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (!map[key]) map[key] = { day: key, variance: 0, count: 0 };
      map[key].variance += Math.abs(r.variance_percent || 0);
      map[key].count++;
    });
    return Object.values(map).map(d => ({
      day: d.day,
      avgVariance: (d.variance / d.count).toFixed(1),
    })).slice(-7);
  })();

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0e18]">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <Fuel className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-base font-extrabold">FUEL MANAGEMENT</p>
            <p className="text-[10px] text-amber-400 tracking-widest uppercase">Variance Tracking · Tankering Analysis</p>
          </div>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-xs font-bold bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-5">
        <StatCard 
          icon={Plane} 
          label="Fuel Records" 
          value={totalRecords} 
          color="bg-blue-600/15 border-blue-600/30 text-blue-400" 
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Flagged (>5%)" 
          value={flaggedRecords} 
          sub={`${((flaggedRecords / Math.max(totalRecords, 1)) * 100).toFixed(0)}% of total`}
          color={flaggedRecords > 0 ? "bg-amber-600/15 border-amber-600/30 text-amber-400" : "bg-green-600/15 border-green-600/30 text-green-400"} 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Avg Variance" 
          value={`${avgVariance}%`} 
          color={parseFloat(avgVariance) > 5 ? "bg-red-600/15 border-red-600/30 text-red-400" : "bg-green-600/15 border-green-600/30 text-green-400"} 
        />
        <StatCard 
          icon={DollarSign} 
          label="Tankering Savings" 
          value={totalTankeringSavings >= 1000 ? `$${(totalTankeringSavings / 1000).toFixed(1)}K` : `$${totalTankeringSavings}`} 
          color="bg-green-600/15 border-green-600/30 text-green-400" 
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-5">
        {['overview', 'records', 'trends'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold capitalize',
              activeTab === tab 
                ? 'bg-amber-500 text-white' 
                : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 mt-5 space-y-5">
        {activeTab === 'overview' && (
          <>
            {/* Variance Chart */}
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold mb-4">Recent Fuel Variance (%)</p>
              {varianceData.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={varianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="flight" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="variance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent Records */}
            <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <p className="text-sm font-extrabold">Recent Fuel Records</p>
              </div>
              {isLoading ? (
                <p className="text-gray-600 text-sm text-center py-8">Loading...</p>
              ) : records.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-8">No fuel records</p>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {records.slice(0, 8).map(r => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-mono font-bold">{r.flight_number}</p>
                        <p className="text-xs text-gray-400">{r.station} · {new Date(r.flight_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-sm font-mono font-bold', Math.abs(r.variance_percent || 0) > 5 ? 'text-red-400' : 'text-green-400')}>
                          {r.variance_percent > 0 ? '+' : ''}{r.variance_percent?.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">variance</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'records' && (
          <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <p className="text-sm font-extrabold">All Fuel Records</p>
            </div>
            {records.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No records available</p>
            ) : (
              <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
                {records.map(r => (
                  <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono font-bold">{r.flight_number}</p>
                      <p className="text-xs text-gray-400">{r.aircraft_tail} · {r.station}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-mono">{r.planned_fuel?.toLocaleString()} lbs</p>
                        <p className="text-xs text-gray-500">planned</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono">{r.actual_uplift?.toLocaleString()} lbs</p>
                        <p className="text-xs text-gray-500">actual</p>
                      </div>
                      <div className="text-right w-20">
                        <p className={cn('font-mono font-bold', Math.abs(r.variance_percent || 0) > 5 ? 'text-red-400' : 'text-green-400')}>
                          {r.variance_percent > 0 ? '+' : ''}{r.variance_percent?.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">variance</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
            <p className="text-sm font-extrabold mb-4">7-Day Variance Trend</p>
            {trendData.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No trend data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="avgVariance" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}