import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Plane, Wrench, Users, AlertTriangle,
  Clock, RefreshCw, Radio, ArrowLeftRight, MapPin, UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useRecoveryTools } from './hooks/useRecoveryTools';
import { useSwapLogic }     from './hooks/useSwapLogic';
import RecoveryDashboard    from './components/RecoveryDashboard';
import CrewLegality         from './components/CrewLegality';
import AircraftSwaps        from './components/AircraftSwaps';
import GateReassign         from './components/GateReassign';
import PassengerReaccom     from './components/PassengerReaccom';

const TABS = [
  { key: 'overview',   label: 'Overview',      icon: Radio },
  { key: 'crew',       label: 'Crew Legality', icon: UserCheck },
  { key: 'swaps',      label: 'A/C Swaps',     icon: ArrowLeftRight },
  { key: 'gates',      label: 'Gates',         icon: MapPin },
  { key: 'pax',        label: 'Pax Reaccom',   icon: Users },
];

function StatTile({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', color)} />
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={cn('text-3xl font-extrabold font-mono', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function OpsCenter() {
  const [activeTab, setActiveTab] = useState('overview');

  const { flights, crew, oos, safety, aircraft, isLoading, refetchAll, metrics } = useRecoveryTools();
  const {
    spares, pendingSwap, setPendingSwap, pendingGate, setPendingGate,
    candidateGates, applySwap, applyGate, isSwapping, isReassigning,
  } = useSwapLogic(flights, aircraft, oos);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">OPS CENTER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Recovery · Crew · Swaps · Gates · Pax</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={refetchAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {/* Critical alerts */}
        {(metrics.illegal > 0 || metrics.activeOOS > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {metrics.illegal > 0 && (
              <div className="flex items-center gap-1.5 bg-destructive/15 border border-destructive/30 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" /> {metrics.illegal} Crew Violation{metrics.illegal > 1 ? 's' : ''}
              </div>
            )}
            {metrics.activeOOS > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-lg px-3 py-1.5 text-xs font-semibold text-orange-400">
                <Wrench className="w-3.5 h-3.5" /> {metrics.activeOOS} Active MX
              </div>
            )}
            {metrics.cancelled > 0 && (
              <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive">
                <Plane className="w-3.5 h-3.5" /> {metrics.cancelled} Cancelled
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 pb-0">
        <StatTile icon={Plane}         label="Airborne"    value={metrics.airborne}    color={metrics.airborne > 0  ? 'text-green-400'    : 'text-muted-foreground'} sub={`${metrics.totalFlights} total`} />
        <StatTile icon={Clock}         label="Delayed"     value={metrics.delayed}     color={metrics.delayed > 0   ? 'text-orange-400'   : 'text-muted-foreground'} />
        <StatTile icon={Wrench}        label="MX Active"   value={metrics.activeOOS}   color={metrics.activeOOS > 0 ? 'text-orange-400'   : 'text-muted-foreground'} />
        <StatTile icon={AlertTriangle} label="Open Safety" value={metrics.openSafety}  color={metrics.openSafety > 0? 'text-destructive'  : 'text-muted-foreground'} />
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card mt-4">
        <div className="flex gap-0.5 px-4 py-2 overflow-x-auto scrollbar-hide">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'overview' && <RecoveryDashboard flights={flights} oos={oos} />}
        {activeTab === 'crew'     && <CrewLegality crew={crew} />}
        {activeTab === 'swaps'    && (
          <AircraftSwaps
            flights={flights}
            spares={spares}
            pendingSwap={pendingSwap}
            setPendingSwap={setPendingSwap}
            applySwap={applySwap}
            isSwapping={isSwapping}
          />
        )}
        {activeTab === 'gates' && (
          <GateReassign
            flights={flights}
            candidateGates={candidateGates}
            applyGate={applyGate}
            isReassigning={isReassigning}
          />
        )}
        {activeTab === 'pax' && <PassengerReaccom flights={flights} />}
      </div>
    </div>
  );
}