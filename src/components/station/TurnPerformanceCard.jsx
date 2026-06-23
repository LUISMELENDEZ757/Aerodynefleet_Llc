import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Edit2, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICING_STATES = {
  not_started: { label: 'Not Started', color: 'text-gray-400', bg: 'bg-gray-500/15', border: 'border-gray-500/30' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  verified: { label: 'Verified', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  late: { label: 'Late', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
};

const SERVICE_ICONS = {
  fuel: 'Fuel',
  lav: 'Droplets',
  water: 'Droplets',
  catering: 'ShoppingBag',
  cleaning: 'Trash2',
  bags: 'Package',
  cargo: 'Package',
};

function ServiceBadge({ service, state }) {
  const cfg = SERVICING_STATES[state] || SERVICING_STATES.not_started;
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold', cfg.bg, cfg.border)}>
      <span className={cfg.color}>{service.toUpperCase()}</span>
    </div>
  );
}

export default function TurnPerformanceCard({ flight, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editFlightNum, setEditFlightNum] = useState(flight.flight_number);
  const [fetching, setFetching] = useState(false);
  const plannedTurn = 45;
  const actualTurn = 38;
  const remaining = Math.max(0, plannedTurn - actualTurn);
  const isOnTime = remaining >= 10;
  
  const handleSave = async () => {
    if (editFlightNum !== flight.flight_number) {
      await base44.entities.Flight.update(flight.id, { flight_number: editFlightNum });
      onUpdate?.();
    }
    setEditing(false);
  };
  
  const handleFetchFlightAware = async () => {
    setFetching(true);
    try {
      const result = await base44.functions.invoke('flightAwareSearch', { query: flight.flight_number });
      if (result.data?.flight) {
        const faFlight = result.data.flight;
        await base44.entities.Flight.update(flight.id, {
          flight_number: faFlight.ident || flight.flight_number,
          status: faFlight.flight_status || flight.status,
          delay_minutes: faFlight.delay || flight.delay_minutes,
        });
        onUpdate?.();
      }
    } catch (err) {
      console.error('FlightAware fetch error:', err);
    }
    setFetching(false);
  };
  
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              type="text"
              value={editFlightNum}
              onChange={(e) => setEditFlightNum(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="bg-[#1a2035] border border-primary/50 rounded px-2 py-1 text-sm font-bold text-white outline-none w-24"
              autoFocus
            />
          ) : (
            <p className="text-sm font-bold text-white cursor-pointer hover:text-primary" onClick={() => setEditing(true)}>
              {flight.flight_number}
            </p>
          )}
          <button onClick={() => setEditing(!editing)} className="text-gray-500 hover:text-primary transition-colors">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={handleFetchFlightAware} disabled={fetching}
            className="text-gray-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title="Fetch from FlightAware">
            {fetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
          </button>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', 
          isOnTime ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
          {isOnTime ? 'ON TIME' : 'DELAYED'}
        </span>
      </div>
      
      <p className="text-xs text-gray-500">{flight.aircraft_tail} · {flight.destination}</p>
      
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>Planned: {plannedTurn}m</span>
            <span>Actual: {actualTurn}m</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', isOnTime ? 'bg-green-500' : 'bg-red-500')}
              style={{ width: `${Math.min(100, (actualTurn / plannedTurn) * 100)}%` }} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500">Remaining</p>
          <p className={cn('text-lg font-black', isOnTime ? 'text-green-400' : 'text-red-400')}>{remaining}m</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1.5 pt-1">
        <ServiceBadge service="fuel" state="completed" />
        <ServiceBadge service="bags" state="in_progress" />
        <ServiceBadge service="cleaning" state="in_progress" />
      </div>
    </div>
  );
}