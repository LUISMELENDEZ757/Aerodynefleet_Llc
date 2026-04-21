import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plane, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const AIRPORTS = [
  { code: 'KATL', name: 'Atlanta', gates: 200 },
  { code: 'KORD', name: 'Chicago ORD', gates: 190 },
  { code: 'KDFW', name: 'Dallas/Fort Worth', gates: 170 },
  { code: 'KJFK', name: 'New York JFK', gates: 130 },
  { code: 'KLAX', name: 'Los Angeles', gates: 140 },
];

function FlightGateMarker({ flight, gate, isArrival, isDelayed }) {
  const statusColor = flight.cancelled 
    ? 'bg-red-500 border-red-400'
    : isDelayed 
    ? 'bg-amber-500 border-amber-400'
    : 'bg-green-500 border-green-400';

  return (
    <div className={cn(
      'absolute w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110',
      statusColor
    )} title={flight.ident_iata || flight.ident}>
      <Plane className="w-5 h-5 text-white" />
    </div>
  );
}

function GateLayout({ flights, arrivals, departures }) {
  // Create a 3-row terminal layout with gates
  const gatesPerRow = 20;
  const rows = 3;
  const gates = Array.from({ length: gatesPerRow * rows }, (_, i) => ({
    id: i,
    number: String.fromCharCode(65 + Math.floor(i / gatesPerRow)) + (i % gatesPerRow + 1),
    row: Math.floor(i / gatesPerRow),
    col: i % gatesPerRow
  }));

  // Map flights to gates
  const gateFlights = {};
  [...arrivals, ...departures].forEach(flight => {
    if (flight.gate) {
      const gateNum = flight.gate.replace(/[A-Z]/g, '');
      const gateId = parseInt(gateNum) - 1;
      if (gateId >= 0 && gateId < gates.length) {
        gateFlights[gateId] = flight;
      }
    }
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6 overflow-auto">
      <div className="space-y-6">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Terminal {String.fromCharCode(65 + rowIdx)}
            </p>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gatesPerRow}, minmax(0, 1fr))` }}>
              {gates.filter(g => g.row === rowIdx).map(gate => {
                const flight = gateFlights[gate.id];
                const isDelayed = flight && (
                  (flight.arrival_delay && flight.arrival_delay > 300) ||
                  (flight.departure_delay && flight.departure_delay > 300)
                );

                return (
                  <div
                    key={gate.id}
                    className={cn(
                      'h-16 rounded-lg border-2 p-1 flex flex-col items-center justify-center transition-all group cursor-pointer',
                      flight
                        ? isDelayed
                          ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500'
                          : flight.cancelled
                          ? 'bg-red-500/10 border-red-500/40 hover:border-red-500'
                          : 'bg-green-500/10 border-green-500/40 hover:border-green-500'
                        : 'bg-secondary border-border hover:border-primary/40'
                    )}
                    title={flight ? flight.ident_iata : `Gate ${gate.number}`}
                  >
                    <p className="text-[10px] font-bold text-muted-foreground">{gate.number}</p>
                    {flight ? (
                      <>
                        <Plane className={cn('w-4 h-4 mt-0.5', isDelayed ? 'text-amber-400' : flight.cancelled ? 'text-red-400' : 'text-green-400')} />
                        <p className="text-[8px] font-mono text-foreground mt-0.5 truncate max-w-full">
                          {flight.ident_iata || flight.ident}
                        </p>
                      </>
                    ) : (
                      <p className="text-[8px] text-muted-foreground">open</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlightDetailPanel({ flight, isArrival }) {
  if (!flight) return null;

  const origin = flight.origin?.code_icao || flight.origin?.code || '—';
  const dest = flight.destination?.code_icao || flight.destination?.code || '—';
  const scheduledTime = isArrival ? (flight.scheduled_in || flight.scheduled_on) : (flight.scheduled_out || flight.scheduled_off);
  const actualTime = isArrival ? flight.actual_in : flight.actual_out;
  const estimatedTime = isArrival ? flight.estimated_in : flight.estimated_out;
  const time = actualTime || estimatedTime || scheduledTime;
  const timeStr = time ? new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
  const delay = isArrival ? flight.arrival_delay : flight.departure_delay;
  const delayMinutes = delay ? Math.round(delay / 60) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-mono font-bold text-primary">{flight.ident_iata || flight.ident}</p>
          <p className="text-sm text-muted-foreground">{flight.aircraft_type || '—'}</p>
        </div>
        <span className={cn(
          'text-xs font-bold px-3 py-1 rounded-full',
          flight.cancelled ? 'bg-red-500/20 text-red-400' :
          delayMinutes > 5 ? 'bg-amber-500/20 text-amber-400' :
          'bg-green-500/20 text-green-400'
        )}>
          {flight.cancelled ? 'CANCELLED' : delayMinutes > 5 ? `DELAYED ${delayMinutes}m` : 'ON TIME'}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Route:</span>
          <span className="font-bold">{origin} → {dest}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{isArrival ? 'ETA' : 'STD'}:</span>
          <span className="font-mono">{timeStr}</span>
        </div>
        {flight.gate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gate:</span>
            <span className="font-bold">{flight.gate}</span>
          </div>
        )}
        {flight.terminal && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Terminal:</span>
            <span className="font-bold">{flight.terminal}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AirportGateMap() {
  const [selectedAirport, setSelectedAirport] = useState('KJFK');
  const [selectedFlight, setSelectedFlight] = useState(null);

  const { data: airportData = {}, refetch, isLoading } = useQuery({
    queryKey: ['gate-map-flights', selectedAirport],
    queryFn: async () => {
      const res = await base44.functions.invoke('groundOpsFlightAware', {
        airport: selectedAirport,
        limit: 100
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data || { arrivals: [], departures: [] };
    },
    refetchInterval: 60000,
    refetchOnMount: true,
  });

  const arrivals = airportData.arrivals || [];
  const departures = airportData.departures || [];
  const activeFlights = [...arrivals, ...departures].filter(f => f.gate);
  const delayedFlights = activeFlights.filter(f => (f.arrival_delay || f.departure_delay || 0) > 300);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/GroundOps" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">AIRPORT GATE MAP</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Live Flight Visualization</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Airport Selector */}
        <select
          value={selectedAirport}
          onChange={e => setSelectedAirport(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          {AIRPORTS.map(apt => (
            <option key={apt.code} value={apt.code}>{apt.code} — {apt.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="p-5 space-y-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-primary">{activeFlights.length}</p>
            <p className="text-xs text-muted-foreground">Flights @ Gates</p>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-green-400">{arrivals.length}</p>
            <p className="text-xs text-muted-foreground">Arrivals</p>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-black text-orange-400">{departures.length}</p>
            <p className="text-xs text-muted-foreground">Departures</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Gate Layout */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
                Loading airport data...
              </div>
            ) : (
              <GateLayout flights={activeFlights} arrivals={arrivals} departures={departures} />
            )}
          </div>

          {/* Right: Flight Info & Legend */}
          <div className="space-y-6">
            {/* Selected Flight Details */}
            {selectedFlight && (
              <FlightDetailPanel 
                flight={selectedFlight} 
                isArrival={arrivals.some(f => f.id === selectedFlight.id)}
              />
            )}

            {/* Legend */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Flight Status Legend</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/40" />
                  <span className="text-xs text-muted-foreground">On Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500/20 border-2 border-amber-500/40" />
                  <span className="text-xs text-muted-foreground">Delayed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-500/40" />
                  <span className="text-xs text-muted-foreground">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-secondary border-2 border-border" />
                  <span className="text-xs text-muted-foreground">Open Gate</span>
                </div>
              </div>
            </div>

            {/* Delayed Flights */}
            {delayedFlights.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">⚠ Delayed Flights ({delayedFlights.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {delayedFlights.slice(0, 10).map(flight => {
                    const delay = (flight.arrival_delay || flight.departure_delay || 0) / 60;
                    return (
                      <button
                        key={flight.id}
                        onClick={() => setSelectedFlight(flight)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
                          selectedFlight?.id === flight.id
                            ? 'bg-amber-500/20 border border-amber-500/40'
                            : 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15'
                        )}
                      >
                        <p className="font-mono font-bold text-foreground">{flight.ident_iata}</p>
                        <p className="text-muted-foreground">+{Math.round(delay)}m · Gate {flight.gate || '—'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}