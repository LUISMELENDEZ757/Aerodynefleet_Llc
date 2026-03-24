import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Fuel, TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  RefreshCw, CheckCircle, BarChart3, Plus, Plane
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import FuelVarianceTable from '@/components/fuel/FuelVarianceTable';
import TankeringAdvisor from '@/components/fuel/TankeringAdvisor';
import NewFuelRecordModal from '@/components/fuel/NewFuelRecordModal';

const TODAY = new Date().toISOString().split('T')[0];

function StatTile({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-xl font-extrabold font-mono', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className={cn('text-xs font-semibold', color)}>{sub}</p>}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'overview',   label: 'Overview' },
  { key: 'variance',   label: 'Variance' },
  { key: 'tankering',  label: 'Tankering' },
];

export default function FuelManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['fuel-records'],
    queryFn: () => base44.entities.FuelRecord.list('-flight_date', 100),
    refetchInterval: 60000,
  });

  const { data: flights = [] } = useQuery({
    queryKey: ['fuel-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FuelRecord.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fuel-records'] }); setShowNew(false); },
  });

  // Aggregates
  const withVariance = records.filter(r => r.variance_lbs != null);
  const avgVariance = withVariance.length
    ? (withVariance.reduce((s, r) => s + (r.variance_percent || 0), 0) / withVariance.length).toFixed(1)
    : '0.0';
  const flagged = records.filter(r => r.release_status === 'variance_flagged').length;
  const tankeringRecords = records.filter(r => r.tankering_decision !== 'none');
  const totalSavings = tankeringRecords.reduce((s, r) => s + (r.tankering_savings || 0), 0);

  // Chart data - last 14 days variance by flight
  const chartData = records.slice(0, 14).map(r => ({
    flight: r.flight_number || '—',
    planned: r.trip_fuel_planned || 0,
    actual: r.trip_fuel_actual || 0,
    variance: r.variance_lbs || 0,
  })).reverse();

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Fuel className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">FUEL MANAGEMENT</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Uplift · Variance · Tankering · Cost</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={refetch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon={Fuel}         label="Records"         value={records.length}     color="text-primary" />
          <StatTile icon={TrendingUp}   label="Avg Variance"    value={`${avgVariance}%`}  color={Math.abs(avgVariance) > 3 ? 'text-orange-400' : 'text-green-400'}
            sub={Math.abs(avgVariance) > 3 ? 'Above threshold' : 'Within limits'} />
          <StatTile icon={AlertTriangle} label="Flagged"         value={flagged}            color={flagged > 0 ? 'text-destructive' : 'text-muted-foreground'} />
          <StatTile icon={DollarSign}   label="Tankering Savings" value={`$${(totalSavings/1000).toFixed(0)}K`} color="text-green-400" />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >{t.label}</button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Log Fuel
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {chartData.length > 0 && (
              <>
                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Fuel Burn — Planned vs Actual (lbs)
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="flight" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="planned" fill="hsl(var(--muted))" name="Planned" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="actual"  fill="hsl(var(--primary))" name="Actual" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl bg-card border border-border p-4">
                  <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Variance Trend (lbs)
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="flight" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <Line type="monotone" dataKey="variance" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Variance" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {records.length === 0 && !isLoading && (
              <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No fuel records yet. Log your first fuel record.
              </div>
            )}
          </div>
        )}

        {activeTab === 'variance' && <FuelVarianceTable records={records} />}
        {activeTab === 'tankering' && <TankeringAdvisor records={records} flights={flights} />}
      </div>

      {showNew && (
        <NewFuelRecordModal
          flights={flights}
          onClose={() => setShowNew(false)}
          onCreate={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}