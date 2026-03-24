import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';
import {
  Users, AlertTriangle, Wifi, Satellite, Wrench, DollarSign,
  MessageSquare, Plane, Zap, RefreshCw, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import OpsAlertCreationModal from '@/components/ops/OpsAlertCreationModal';

const TODAY = new Date().toISOString().split('T')[0];

const StatBox = ({ icon: Icon, label, value, color = 'text-foreground', onClick }) => (
  <button onClick={onClick}
    className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-all">
    <div className={cn('w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0')}>
      <Icon className={cn('w-4 h-4', color)} />
    </div>
    <div className="text-left">
      <p className={cn('text-lg font-extrabold font-mono', color)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </button>
);

export default function SupervisorDashboard() {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const pollingInterval = useDynamicPolling(30000, 300000);

  const { data: flights = [], refetch } = useQuery({
    queryKey: ['supervisor-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['supervisor-alerts'],
    queryFn: () => base44.entities.OpsAlert.filter({ is_dismissed: false }),
    refetchInterval: pollingInterval,
  });

  const { data: crew = [] } = useQuery({
    queryKey: ['supervisor-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: mels = [] } = useQuery({
    queryKey: ['supervisor-mels'],
    queryFn: () => base44.entities.MELItem.filter({ status: 'open' }),
    refetchInterval: pollingInterval,
  });

  const { data: starlink = [] } = useQuery({
    queryKey: ['supervisor-starlink'],
    queryFn: () => base44.entities.StarlinkTerminal.list(),
    refetchInterval: 30000,
  });

  const { data: wifi = [] } = useQuery({
    queryKey: ['supervisor-wifi'],
    queryFn: () => base44.entities.WiFiTerminal.list(),
    refetchInterval: 30000,
  });

  const { data: fuel = [] } = useQuery({
    queryKey: ['supervisor-fuel', TODAY],
    queryFn: () => base44.entities.FuelRecord.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['supervisor-unread'],
    queryFn: () => base44.entities.CommMessage.filter({ is_read: false }),
    refetchInterval: pollingInterval,
  });

  // Calculate stats
  const airborne = flights.filter(f => f.status === 'airborne').length;
  const delayed = flights.filter(f => f.delay_minutes > 0).length;
  const illegalCrew = crew.filter(c => c.legal_status === 'illegal').length;
  const openMels = mels.filter(m => m.status === 'open').length;
  const starlinkActive = starlink.filter(s => s.activation_status === 'active').length;
  const wifiActive = wifi.filter(w => w.activation_status === 'active').length;
  const fuelIssues = fuel.filter(f => f.release_status === 'variance_flagged').length;
  const unreadComms = messages.length;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-wide">Supervisor Dashboard</h1>
            <p className="text-xs font-mono text-primary tracking-widest uppercase">Shift Turnover · Operational Overview</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refetch} aria-label="Refresh all data" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowAlertModal(true)} aria-label="Create manual ops alert" className="flex items-center gap-2 px-3 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Alert
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Critical Alert Banner */}
        {criticalAlerts > 0 && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-destructive">{criticalAlerts} critical alerts active</p>
              <p className="text-xs text-destructive/80">Immediate action required</p>
            </div>
            <Link to="/OpsCenter" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-destructive text-white hover:bg-destructive/90">
              View
            </Link>
          </div>
        )}

        {/* Flight Operations Grid */}
        <div className="space-y-2">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Flight Operations</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox icon={Plane} label="Airborne" value={airborne} color={airborne > 0 ? 'text-green-400' : 'text-muted-foreground'} onClick={() => {}} />
            <StatBox icon={AlertTriangle} label="Delays" value={delayed} color={delayed > 0 ? 'text-orange-400' : 'text-muted-foreground'} onClick={() => {}} />
            <StatBox icon={Users} label="Illegal Crew" value={illegalCrew} color={illegalCrew > 0 ? 'text-destructive' : 'text-muted-foreground'} onClick={() => {}} />
            <StatBox icon={Wrench} label="Open MELs" value={openMels} color={openMels > 0 ? 'text-orange-400' : 'text-muted-foreground'} onClick={() => {}} />
          </div>
        </div>

        {/* Connectivity Grid */}
        <div className="space-y-2">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Connectivity & Comms</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox icon={Satellite} label="Starlink Active" value={starlinkActive} color="text-blue-400" onClick={() => {}} />
            <StatBox icon={Wifi} label="WiFi Active" value={wifiActive} color="text-cyan-400" onClick={() => {}} />
            <StatBox icon={MessageSquare} label="Unread Comms" value={unreadComms} color={unreadComms > 0 ? 'text-primary' : 'text-muted-foreground'} onClick={() => {}} />
            <StatBox icon={DollarSign} label="Fuel Issues" value={fuelIssues} color={fuelIssues > 0 ? 'text-amber-400' : 'text-muted-foreground'} onClick={() => {}} />
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Recent Alerts</p>
            <Link to="/OpsCenter" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {alerts.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No active alerts</div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.slice(0, 5).map(a => (
                  <div key={a.id} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-secondary/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-1 rounded-full flex-shrink-0',
                      a.severity === 'critical' ? 'bg-destructive/15 text-destructive' :
                      a.severity === 'warning' ? 'bg-orange-500/15 text-orange-400' :
                      'bg-blue-500/15 text-blue-400'
                    )}>{a.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Flight Crew', path: '/FlightCrew' },
              { label: 'Crew Control', path: '/CrewControl' },
              { label: 'MEL Dashboard', path: '/MEL' },
              { label: 'Fuel Mgmt', path: '/Fuel' },
              { label: 'OpsCenter', path: '/OpsCenter' },
              { label: 'IROPS', path: '/IROPS' },
              { label: 'Comms', path: '/CommCenter' },
              { label: 'World Clock', path: '/WorldClock' },
            ].map(item => (
              <Link key={item.path} to={item.path} className="rounded-xl bg-card border border-border px-4 py-3 text-xs font-bold text-center hover:bg-secondary/40 transition-colors text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <OpsAlertCreationModal open={showAlertModal} onClose={() => setShowAlertModal(false)} />
    </div>
  );
}