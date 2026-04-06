import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Plane, DoorOpen, Clock, Users, MapPin, AlertTriangle,
  ChevronLeft, Filter, RefreshCw, TrendingUp, CheckCircle,
  LogOut, LogIn
} from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];
const GATES = Array.from({ length: 24 }, (_, i) => ({
  id: `A${i + 1}`,
  terminal: 'A',
  status: 'available',
  currentFlight: null,
  capacity: 250,
  occupied: 0
}));

const TABS = [
  { key: 'gates', label: 'Gates', icon: DoorOpen },
  { key: 'arrivals', label: 'Arrivals', icon: LogIn },
  { key: 'departures', label: 'Departures', icon: LogOut },
];

function GateCard({ gate, flight, onSelect }) {
  const isOccupied = flight ? true : false;
  const statusColor = isOccupied ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-green-500/15 border-green-500/30 text-green-400';
  const statusLabel = isOccupied ? 'Occupied' : 'Available';

  return (
    <button
      onClick={() => onSelect(gate)}
      className={cn(
        'rounded-xl border p-4 transition-all text-left hover:shadow-lg',
        isOccupied ? 'bg-card border-blue-500/20' : 'bg-card border-border'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-2xl font-extrabold text-foreground">{gate.id}</p>
        <span className={cn('text-xs font-bold px-2 py-1 rounded-full', statusColor)}>
          {statusLabel}
        </span>
      </div>
      {flight ? (
        <div className="space-y-2">
          <p className="text-xs font-mono font-bold text-primary">{flight.flight_number}</p>
          <p className="text-xs text-muted-foreground">{flight.aircraft_type}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Plane className="w-3 h-3" /> {flight.origin} → {flight.destination}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No flight assigned</p>
      )}
    </button>
  );
}

function FlightRow({ flight, type, onSelect }) {
  const statusColors = {
    scheduled: 'bg-gray-500/20 text-gray-400',
    boarding: 'bg-blue-500/20 text-blue-400',
    on_time: 'bg-green-500/20 text-green-400',
    delayed: 'bg-orange-500/20 text-orange-400',
    boarding_complete: 'bg-purple-500/20 text-purple-400',
    departed: 'bg-green-600 text-white',
    arrived: 'bg-green-600 text-white',
  };

  return (
    <button
      onClick={() => onSelect(flight)}
      className="flex items-center justify-between px-5 py-3 rounded-lg border border-border hover:bg-secondary/40 transition-colors text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Plane className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-mono font-bold text-foreground">{flight.flight_number}</p>
          <p className="text-xs text-muted-foreground">
            {type === 'arrivals' ? flight.origin : flight.destination} · {flight.aircraft_type}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-mono font-bold text-foreground">
            {type === 'arrivals' ? flight.scheduled_arrival : flight.scheduled_departure}
          </p>
          <p className="text-xs text-muted-foreground">{type === 'arrivals' ? 'ETA' : 'STD'}</p>
        </div>
        <span className={cn('text-xs font-bold px-3 py-1 rounded-full', statusColors[flight.status] || statusColors.scheduled)}>
          {flight.status?.toUpperCase()}
        </span>
      </div>
    </button>
  );
}

export default function PassengerServiceSystem() {
  const [activeTab, setActiveTab] = useState('gates');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gateAssignments, setGateAssignments] = useState({});

  const { data: flights = [], refetch } = useQuery({
    queryKey: ['pss-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 30000,
  });

  const arrivals = flights.filter(f => ['scheduled', 'delayed', 'arrived'].includes(f.status));
  const departures = flights.filter(f => ['scheduled', 'boarding', 'boarding_complete', 'departed'].includes(f.status));

  const availableGates = GATES.filter(g => !gateAssignments[g.id]);
  const occupiedGates = GATES.filter(g => gateAssignments[g.id]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <DoorOpen className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">PASSENGER SERVICE SYSTEM</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Airport Gates · Arrivals · Departures</p>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
            <DoorOpen className="w-3.5 h-3.5" /> {availableGates.length} Available
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/30">
            <DoorOpen className="w-3.5 h-3.5" /> {occupiedGates.length} Occupied
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-primary/20 text-primary px-3 py-1.5 rounded-full border border-primary/30">
            <LogIn className="w-3.5 h-3.5" /> {arrivals.length} Arrivals
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full border border-orange-500/30">
            <LogOut className="w-3.5 h-3.5" /> {departures.length} Departures
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="flex gap-0.5 px-4 py-2 overflow-x-auto scrollbar-hide">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-4 py-2 rounded-lg transition-all flex-shrink-0',
                activeTab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {activeTab === 'gates' && (
          <div>
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-3">Terminal A Gates</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {GATES.map(gate => (
                <GateCard
                  key={gate.id}
                  gate={gate}
                  flight={gateAssignments[gate.id]}
                  onSelect={(g) => {
                    // Simple gate assignment demo
                    if (departures[0] && !gateAssignments[g.id]) {
                      setGateAssignments(prev => ({ ...prev, [g.id]: departures[0] }));
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'arrivals' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-foreground">Arrivals Today</h2>
              <span className="text-xs font-bold text-muted-foreground">{arrivals.length} flights</span>
            </div>
            {arrivals.length === 0 ? (
              <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No arrivals scheduled
              </div>
            ) : (
              <div className="space-y-2">
                {arrivals.map(f => (
                  <FlightRow key={f.id} flight={f} type="arrivals" onSelect={() => {}} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'departures' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-foreground">Departures Today</h2>
              <span className="text-xs font-bold text-muted-foreground">{departures.length} flights</span>
            </div>
            {departures.length === 0 ? (
              <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No departures scheduled
              </div>
            ) : (
              <div className="space-y-2">
                {departures.map(f => (
                  <FlightRow key={f.id} flight={f} type="departures" onSelect={() => {}} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}