import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { AlertTriangle, TrendingUp, Calendar, Zap, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

const CHART_COLORS = {
  contentStyle: { background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' },
};

function RiskCard({ aircraft, riskScore, component, status }) {
  const isHigh = riskScore >= 75;
  const isMedium = riskScore >= 50;

  return (
    <div className={cn('bg-[#0f1419] border rounded-xl p-3 space-y-2',
      isHigh ? 'border-red-500/40' : isMedium ? 'border-yellow-500/40' : 'border-green-500/40'
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white truncate">{aircraft}</p>
          <p className="text-xs text-gray-500">{component}</p>
        </div>
        <span className={cn('text-sm font-black text-right flex-shrink-0',
          isHigh ? 'text-red-400' : isMedium ? 'text-yellow-400' : 'text-green-400'
        )}>
          {riskScore}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full',
            isHigh ? 'bg-red-500' : isMedium ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${riskScore}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-600">{status}</p>
    </div>
  );
}

function RecommendationCard({ rec, priority }) {
  const isCritical = priority === 'critical';

  return (
    <div className={cn('rounded-xl border p-4 space-y-2',
      isCritical ? 'bg-red-900/10 border-red-500/40' : 'bg-blue-900/10 border-blue-500/40'
    )}>
      <div className="flex items-start gap-2">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1',
          isCritical ? 'bg-red-500' : 'bg-blue-500'
        )} />
        <div className="flex-1 min-w-0">
          <p className={cn('font-bold text-sm', isCritical ? 'text-red-400' : 'text-blue-400')}>
            {rec.title}
          </p>
          <p className="text-xs text-gray-400 mt-1">{rec.description}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {rec.tags?.map((tag, idx) => (
              <span key={idx} className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BOWAnalytics() {
  const { data: forecasts = [] } = useQuery({
    queryKey: ['analytics-forecasts'],
    queryFn: () => base44.entities.MaintenanceForecast.list('-status', 500),
    refetchInterval: 300000,
  });

  const { data: bows = [] } = useQuery({
    queryKey: ['analytics-bows'],
    queryFn: () => base44.entities.SupplyRequisition.list('-created_date', 500),
    refetchInterval: 300000,
  });

  // Calculate AOG risk scores
  const aogRisks = useMemo(() => {
    return forecasts.map(forecast => {
      let riskScore = 0;

      if (forecast.status === 'overdue') riskScore = 95;
      else if (forecast.status === 'due_soon') riskScore = 70;
      else if (forecast.status === 'watch') riskScore = 45;
      else riskScore = 15;

      const daysUntilDue = forecast.suggested_window_start
        ? Math.ceil((new Date(forecast.suggested_window_start) - new Date()) / (1000 * 60 * 60 * 24))
        : 30;

      if (daysUntilDue < 7) riskScore = Math.min(100, riskScore + 20);
      if (daysUntilDue < 0) riskScore = 100;

      return {
        aircraft: forecast.aircraft_tail,
        component: forecast.component,
        riskScore: Math.min(100, riskScore),
        status: forecast.status,
        daysUntilDue,
        overhaul_interval_hours: forecast.overhaul_interval_hours,
        total_flight_hours: forecast.total_flight_hours,
        suggested_window: forecast.suggested_window_start,
      };
    });
  }, [forecasts]);

  // Timeline data for next 90 days
  const timelineData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 90; i += 7) {
      const date = addDays(new Date(), i);
      const count = aogRisks.filter(r => {
        const windowDate = r.suggested_window ? new Date(r.suggested_window) : null;
        return windowDate && windowDate >= date && windowDate < addDays(date, 7);
      }).length;

      data.push({
        week: format(date, 'MMM d'),
        maintenanceCount: count,
        avgRisk: count > 0
          ? Math.round(aogRisks.filter(r => {
              const windowDate = r.suggested_window ? new Date(r.suggested_window) : null;
              return windowDate && windowDate >= date && windowDate < addDays(date, 7);
            }).reduce((sum, r) => sum + r.riskScore, 0) / count)
          : 0,
      });
    }
    return data;
  }, [aogRisks]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    return [
      { name: 'Critical (75+)', value: aogRisks.filter(r => r.riskScore >= 75).length },
      { name: 'High (50-74)', value: aogRisks.filter(r => r.riskScore >= 50 && r.riskScore < 75).length },
      { name: 'Medium (25-49)', value: aogRisks.filter(r => r.riskScore >= 25 && r.riskScore < 50).length },
      { name: 'Low (<25)', value: aogRisks.filter(r => r.riskScore < 25).length },
    ];
  }, [aogRisks]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs = [];

    const critical = aogRisks.filter(r => r.riskScore >= 75);
    if (critical.length > 0) {
      recs.push({
        priority: 'critical',
        title: `${critical.length} aircraft at critical AOG risk`,
        description: `Schedule immediate maintenance windows. ${critical.map(c => c.aircraft).join(', ')} require urgent attention.`,
        tags: ['Urgent', 'Schedule Now', `${critical.length} Aircraft`],
      });
    }

    const overdue = aogRisks.filter(r => r.daysUntilDue < 0);
    if (overdue.length > 0) {
      recs.push({
        priority: 'critical',
        title: `${overdue.length} aircraft overdue for maintenance`,
        description: 'These aircraft have passed their maintenance window. Immediate action required.',
        tags: ['Overdue', 'AOG Risk'],
      });
    }

    const upcoming30 = aogRisks.filter(r => r.daysUntilDue >= 0 && r.daysUntilDue <= 30);
    if (upcoming30.length > 3) {
      recs.push({
        priority: 'high',
        title: `${upcoming30.length} maintenance windows in next 30 days`,
        description: 'Plan workforce and parts procurement. Coordinate with dispatch for aircraft scheduling.',
        tags: ['Planning', 'Next 30 Days', 'Coordination'],
      });
    }

    const lowStock = bows.filter(b => b.quantity < 5);
    if (lowStock.length > 0) {
      recs.push({
        priority: 'high',
        title: 'Parts procurement recommended',
        description: `${lowStock.length} requisitions with low quantity. Proactive ordering prevents delays.`,
        tags: ['Inventory', 'Parts Supply'],
      });
    }

    return recs;
  }, [aogRisks, bows]);

  const criticalCount = aogRisks.filter(r => r.riskScore >= 75).length;
  const highCount = aogRisks.filter(r => r.riskScore >= 50 && r.riskScore < 75).length;
  const avgRisk = Math.round(aogRisks.reduce((sum, r) => sum + r.riskScore, 0) / (aogRisks.length || 1));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h2 className="text-2xl font-black text-primary">BOW ANALYTICS & AOG FORECAST</h2>
        </div>
        <p className="text-sm text-gray-400">Predictive maintenance analysis & risk-based scheduling</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Avg AOG Risk</p>
          <p className={cn('text-3xl font-black', avgRisk >= 60 ? 'text-red-400' : avgRisk >= 40 ? 'text-yellow-400' : 'text-green-400')}>
            {avgRisk}%
          </p>
        </div>

        <div className="bg-[#0f1419] border border-red-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Critical</p>
          <p className="text-3xl font-black text-red-400">{criticalCount}</p>
        </div>

        <div className="bg-[#0f1419] border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">High Risk</p>
          <p className="text-3xl font-black text-yellow-400">{highCount}</p>
        </div>

        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Total Aircraft</p>
          <p className="text-3xl font-black text-white">{aogRisks.length}</p>
        </div>
      </div>

      {/* AOG Risk Timeline */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5">
        <h3 className="font-bold text-white mb-4">90-Day Maintenance Window Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip {...CHART_COLORS} />
            <Legend />
            <Line type="monotone" dataKey="maintenanceCount" name="Scheduled Maintenance" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="avgRisk" name="Avg Risk Score" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">AOG Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip {...CHART_COLORS} />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Risk Aircraft */}
        <div className="space-y-3">
          <h3 className="font-bold text-white">Top Risk Aircraft</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {aogRisks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 6).map((risk, idx) => (
              <RiskCard
                key={idx}
                aircraft={risk.aircraft}
                riskScore={risk.riskScore}
                component={risk.component}
                status={`${risk.daysUntilDue > 0 ? risk.daysUntilDue + ' days' : 'OVERDUE'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Proactive Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <RecommendationCard key={idx} rec={rec} priority={rec.priority} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}