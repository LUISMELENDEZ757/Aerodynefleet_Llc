import { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';
import {
  Plane, AlertTriangle, Cloud, Users, Fuel, Wind,
  RefreshCw, Plus, Clock, Radio, FileText, Map,
  Activity, TrendingDown, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import RovingTabindexList from '@/components/accessibility/RovingTabindexList';

const DispatchReleaseBuilder = lazy(() => import('@/components/dispatch/DispatchReleaseBuilder'));
const FlightMonitoringConsole = lazy(() => import('@/components/dispatch/FlightMonitoringConsole'));
const DispatcherAlerts = lazy(() => import('@/components/dispatch/DispatcherAlerts'));
const DispatchWeatherPanel = lazy(() => import('@/components/dispatch/DispatchWeatherPanel'));
const CrewLegalityBoard = lazy(() => import('@/components/dispatch/CrewLegalityBoard'));

const TODAY = new Date().toISOString().split('T')[0];

const TABS = [
  { key: 'flights',  label: 'Active Flights',  icon: Plane },
  { key: 'release',  label: 'Release Builder', icon: FileText },
  { key: 'alerts',   label: 'Alerts',          icon: AlertTriangle },
  { key: 'weather',  label: 'Weather',         icon: Cloud },
  { key: 'crew',     label: 'Crew Legality',   icon: Users },
];

function StatTile({ icon: Icon, label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
    >
      <div className={cn('w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0')}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-lg font-extrabold font-mono', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

export default function DispatchWorkstation() {
  const [activeTab, setActiveTab] = useState('flights');
  const pollingInterval = useDynamicPolling(10000, 60000); // 10s active, 60s hidden

  const { data: flights = [], refetch: refetchFlights, isLoading } = useQuery({
    queryKey: ['dispatch-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: monitoring = [] } = useQuery({
    queryKey: ['dispatch-monitoring', TODAY],
    queryFn: () => base44.entities.DispatchMonitoring.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['dispatch-releases', TODAY],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['dispatch-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: pollingInterval,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['dispatch-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  // Compute stats
  const airborne = monitoring.filter(m => m.flight_phase === 'cruise' || m.flight_phase === 'descent').length;
  const delayed = flights.filter(f => f.delay_minutes > 0).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const illegalCrew = crew.filter(c => c.legal_status === 'illegal').length;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Radio className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">DISPATCH WORKSTATION</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Flight Release · Monitoring · Crew Legality</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button
              onClick={() => { refetchFlights(); }}
              aria-label="Sync all dispatch data"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded px-2 py-1"
            >
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {/* Critical alert banner */}
        {criticalAlerts > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-destructive/15 text-destructive border border-destructive/30" role="alert">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} — action required
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatTile icon={Plane} label="Airborne" value={airborne} color={airborne > 0 ? 'text-green-400' : 'text-muted-foreground'} onClick={() => setActiveTab('flights')} />
          <StatTile icon={AlertTriangle} label="Delays" value={delayed} color={delayed > 0 ? 'text-orange-400' : 'text-muted-foreground'} onClick={() => setActiveTab('flights')} />
          <StatTile icon={Users} label="Illegal Crew" value={illegalCrew} color={illegalCrew > 0 ? 'text-destructive' : 'text-muted-foreground'} onClick={() => setActiveTab('crew')} />
          <StatTile icon={AlertTriangle} label="Critical" value={criticalAlerts} color={criticalAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'} onClick={() => setActiveTab('alerts')} />
        </div>

        {/* Tabs */}
        <div className="border-b border-border bg-card/50 rounded-t-xl">
          <RovingTabindexList
            items={TABS}
            ariaLabel="Dispatch workstation modules"
            role="tablist"
            className="flex gap-0.5 px-4 py-2 overflow-x-auto scrollbar-hide"
            renderItem={({ key, label, icon: Icon }, index, { focusedIndex, handleKeyDown, getTabIndex, registerRef }) => (
              <button
                key={key}
                ref={(el) => registerRef(index, el)}
                tabIndex={getTabIndex(index)}
                onClick={() => setActiveTab(key)}
                onKeyDown={handleKeyDown}
                role="tab"
                aria-selected={activeTab === key}
                aria-label={`${label}${activeTab === key ? ' - currently selected' : ''}`}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  focusedIndex === index && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )}
          />
        </div>

        {/* Content */}
        <div className="bg-card rounded-b-xl border border-border border-t-0 p-4">
          {isLoading && <div className="text-sm text-muted-foreground py-8 text-center">Loading dispatch data…</div>}

          {activeTab === 'flights' && (
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading flights…</div>}>
              <FlightMonitoringConsole monitoring={monitoring} flights={flights} releases={releases} />
            </Suspense>
          )}

          {activeTab === 'release' && (
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading release builder…</div>}>
              <DispatchReleaseBuilder flights={flights} releases={releases} crew={crew} />
            </Suspense>
          )}

          {activeTab === 'alerts' && (
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading alerts…</div>}>
              <DispatcherAlerts alerts={alerts} flights={flights} />
            </Suspense>
          )}

          {activeTab === 'weather' && (
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading weather…</div>}>
              <DispatchWeatherPanel flights={flights} monitoring={monitoring} />
            </Suspense>
          )}

          {activeTab === 'crew' && (
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading crew…</div>}>
              <CrewLegalityBoard crew={crew} flights={flights} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}