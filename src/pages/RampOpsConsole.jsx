import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, Radio, MapPin, Plane, AlertTriangle, CheckCircle,
  Clock, Users, Zap, RefreshCw, Volume2, Pause, Play, Target
} from 'lucide-react';
import LiveClock from '@/components/ui/LiveClock';
import TurnManagement from '@/components/ramp/TurnManagement';

const GATE_POSITIONS = {
  'A1': { x: 10, y: 20, terminal: 'A' },
  'A2': { x: 40, y: 20, terminal: 'A' },
  'A3': { x: 70, y: 20, terminal: 'A' },
  'B1': { x: 10, y: 55, terminal: 'B' },
  'B2': { x: 40, y: 55, terminal: 'B' },
  'B3': { x: 70, y: 55, terminal: 'B' },
  'C1': { x: 10, y: 85, terminal: 'C' },
  'C2': { x: 40, y: 85, terminal: 'C' },
  'C3': { x: 70, y: 85, terminal: 'C' },
};

const HOLD_POINTS = [
  { id: 'hp1', x: 25, y: 42, label: 'Hold Point A' },
  { id: 'hp2', x: 55, y: 42, label: 'Hold Point B' },
  { id: 'hp3', x: 25, y: 70, label: 'Hold Point C' },
  { id: 'hp4', x: 55, y: 70, label: 'Hold Point D' },
];

function RampDisplay({ flights, selectedFlight, onSelectFlight, gateAssignments }) {
  return (
    <div className="relative w-full h-[500px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border border-cyan-500/30 overflow-hidden">
      {/* SVG Ramp Display */}
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Taxiway grid */}
        <defs>
          <pattern id="taxiway" patternUnits="userSpaceOnUse" width="5" height="5">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(34,197,94,0.1)" strokeWidth="0.1" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#taxiway)" />

        {/* Gate positions */}
        {Object.entries(GATE_POSITIONS).map(([gate, pos]) => (
          <g key={gate}>
            <rect
              x={pos.x - 4}
              y={pos.y - 4}
              width="8"
              height="8"
              fill="rgba(100,116,139,0.5)"
              stroke="rgba(148,163,184,0.8)"
              strokeWidth="0.3"
            />
            <text x={pos.x} y={pos.y + 6} fontSize="2" fill="rgba(226,232,240,0.7)" textAnchor="middle">
              {gate}
            </text>
          </g>
        ))}

        {/* Hold points */}
        {HOLD_POINTS.map(hp => (
          <circle
            key={hp.id}
            cx={hp.x}
            cy={hp.y}
            r="2"
            fill="none"
            stroke="rgba(34,211,238,0.6)"
            strokeWidth="0.2"
            strokeDasharray="0.5,0.5"
          />
        ))}

        {/* Aircraft on ramp */}
        {flights.map(flight => {
          const gate = gateAssignments[flight.id];
          if (!gate || !GATE_POSITIONS[gate]) return null;
          const pos = GATE_POSITIONS[gate];

          return (
            <g
              key={flight.id}
              onClick={() => onSelectFlight(flight)}
              className="cursor-pointer hover:opacity-100 transition-opacity"
              opacity={selectedFlight?.id === flight.id ? 1 : 0.7}
            >
              <polygon
                points={`${pos.x},${pos.y - 3} ${pos.x + 2.5},${pos.y + 2} ${pos.x - 2.5},${pos.y + 2}`}
                fill={flight.direction === 'departure' ? 'rgba(34,197,94,0.8)' : 'rgba(59,130,246,0.8)'}
                stroke={selectedFlight?.id === flight.id ? 'rgba(34,211,238,1)' : 'rgba(226,232,240,0.5)'}
                strokeWidth="0.2"
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                fontSize="1.5"
                fill="white"
                textAnchor="middle"
                fontWeight="bold"
              >
                {flight.flight_number.substring(0, 4)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 text-[10px] space-y-1">
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full" /> Departure
        </div>
        <div className="flex items-center gap-2 text-blue-400">
          <div className="w-2 h-2 bg-blue-500 rounded-full" /> Arrival
        </div>
      </div>
    </div>
  );
}

function AircraftControlPanel({ flight, onPushback, onTaxi, onMoveToGate }) {
  if (!flight) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
        Select an aircraft to view controls
      </div>
    );
  }

  return (
    <div className="bg-card border border-cyan-500/30 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-mono font-bold text-cyan-400">{flight.flight_number}</p>
          <p className="text-xs text-muted-foreground mt-1">{flight.aircraft_type}</p>
        </div>
        <span className={cn('text-xs font-bold px-2 py-1 rounded',
          flight.direction === 'departure' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400')}>
          {flight.direction.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-foreground uppercase tracking-widest">Ground Position</p>
        <div className="text-sm text-muted-foreground">
          Gate: <span className="font-bold text-foreground">{flight.gate || '— —'}</span>
        </div>
      </div>

      {flight.direction === 'departure' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground uppercase tracking-widest">Departure Control</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPushback(flight)}
              className="py-2.5 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" /> Push-Back
            </button>
            <button
              onClick={() => onTaxi(flight)}
              className="py-2.5 px-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Target className="w-3.5 h-3.5" /> Taxi
            </button>
          </div>
        </div>
      )}

      {flight.direction === 'arrival' && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground uppercase tracking-widest">Arrival Control</p>
          <button
            onClick={() => onMoveToGate(flight)}
            className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" /> Move to Gate
          </button>
        </div>
      )}

      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Pushback: <span className="text-foreground font-bold">Not Started</span></div>
          <div>Taxi: <span className="text-foreground font-bold">Ready</span></div>
          <div>Brakes: <span className="text-green-400 font-bold">Set</span></div>
        </div>
      </div>
    </div>
  );
}

function RadioPanel() {
  const [volume, setVolume] = useState(50);
  const [isTransmitting, setIsTransmitting] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-cyan-400" />
        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Ground Freq</p>
        <span className="ml-auto text-xs font-mono text-cyan-400">121.9</span>
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Volume</span>
          <span className="font-bold text-foreground">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={e => setVolume(parseInt(e.target.value))}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      {/* Radio Status */}
      <div className="flex items-center gap-2 py-2 px-3 bg-secondary/50 rounded-lg">
        <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', isTransmitting ? 'bg-red-500' : 'bg-green-500')} />
        <span className="text-xs font-bold text-foreground">
          {isTransmitting ? 'TRANSMITTING' : 'Standby'}
        </span>
      </div>

      {/* Push-to-Talk */}
      <button
        onMouseDown={() => setIsTransmitting(true)}
        onMouseUp={() => setIsTransmitting(false)}
        onMouseLeave={() => setIsTransmitting(false)}
        className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold uppercase tracking-widest transition-colors active:scale-95"
      >
        <Volume2 className="w-4 h-4 mx-auto mb-1" />
        Push to Talk
      </button>

      {/* Recent Transmissions */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Radio Log</p>
        <div className="space-y-1.5 max-h-24 overflow-y-auto">
          <div className="text-[10px] text-muted-foreground">
            <span className="text-cyan-400">[14:32]</span> N455GJ request push-back
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span className="text-cyan-400">[14:31]</span> Tower: Cleared for takeoff runway 04L
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span className="text-cyan-400">[14:29]</span> N801EB ⁎ N455GJ, monitor ground on 121.9
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RampOpsConsole() {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [gateAssignments, setGateAssignments] = useState({});
  const [station, setStation] = useState('KEWR');
  const qc = useQueryClient();

  const { data: flightData = {}, refetch, isLoading } = useQuery({
    queryKey: ['vrct-flights', station],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareStationOps', { station });
      return res.data || {};
    },
    refetchInterval: 15000,
  });

  const flights = flightData.flights || [];

  const handlePushback = (flight) => {
    // Log push-back event
    console.log(`Push-back initiated for ${flight.flight_number}`);
  };

  const handleTaxi = (flight) => {
    // Log taxi event
    console.log(`Taxi clearance for ${flight.flight_number}`);
  };

  const handleMoveToGate = (flight) => {
    // Assign random gate
    const gates = Object.keys(GATE_POSITIONS);
    const randomGate = gates[Math.floor(Math.random() * gates.length)];
    setGateAssignments(prev => ({ ...prev, [flight.id]: randomGate }));
  };

  const onRamp = flights.filter(f => gateAssignments[f.id] || f.gate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur px-6 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700">
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-base font-extrabold text-cyan-400 tracking-widest uppercase">vRCT Console</p>
              <p className="text-[10px] text-cyan-500/70 tracking-widest uppercase">Ramp Operations Control Tower</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <button
              onClick={() => refetch()}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <RefreshCw className={cn('w-4 h-4 text-slate-300', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Station Selector */}
        <select
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="mt-4 bg-slate-800 border border-cyan-500/30 rounded-lg px-3 py-2 text-sm font-bold text-cyan-400 outline-none focus:border-cyan-500"
        >
          <option value="KEWR">Newark (KEWR)</option>
          <option value="KJFK">JFK (KJFK)</option>
          <option value="KORD">Chicago (KORD)</option>
          <option value="KLAX">Los Angeles (KLAX)</option>
        </select>
      </div>

      {/* Main Grid */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {/* Left: Ramp Display */}
        <div className="lg:col-span-2 space-y-6">
          <RampDisplay
            flights={onRamp}
            selectedFlight={selectedFlight}
            onSelectFlight={setSelectedFlight}
            gateAssignments={gateAssignments}
          />

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-cyan-400">{onRamp.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">On Ramp</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-400">{flights.filter(f => f.direction === 'departure').length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Departures</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-blue-400">{flights.filter(f => f.direction === 'arrival').length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Arrivals</p>
            </div>
          </div>
        </div>

        {/* Right: Control Panels */}
        <div className="lg:col-span-2 space-y-6">
          <AircraftControlPanel
            flight={selectedFlight}
            onPushback={handlePushback}
            onTaxi={handleTaxi}
            onMoveToGate={handleMoveToGate}
          />

          <RadioPanel />
        </div>
      </div>

      {/* Turn Management */}
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Ground Service Management</h2>
          <TurnManagement flights={flights} station={station} />
        </div>
      </div>

      {/* Flight List */}
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Aircraft on Frequency</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {flights.map(flight => (
              <button
                key={flight.id}
                onClick={() => setSelectedFlight(flight)}
                className={cn(
                  'text-left py-2.5 px-3 rounded-lg border transition-all cursor-pointer',
                  selectedFlight?.id === flight.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-slate-800/50 border-border hover:border-cyan-500/50'
                )}
              >
                <p className="text-sm font-mono font-bold">{flight.flight_number}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{flight.aircraft_type}</p>
                <p className="text-[10px] text-muted-foreground">{flight.direction === 'departure' ? '↗ Depart' : '↙ Arrive'}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}