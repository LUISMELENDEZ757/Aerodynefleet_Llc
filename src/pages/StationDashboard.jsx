import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Plane, Wrench, Users, Building2, Clock,
  CheckCircle, AlertTriangle, Circle, RefreshCw, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

function KpiCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-black', color)}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function FlightRow({ flight }) {
  const statusColor = {
    airborne: 'text-green-400 bg-green-500/15',
    departed: 'text-blue-400 bg-blue-500/15',
    boarding: 'text-yellow-400 bg-yellow-500/15',
    delayed: 'text-orange-400 bg-orange-500/15',
    cancelled: 'text-red-400 bg-red-500/15',
    arrived: 'text-gray-400 bg-gray-500/15',
    landed: 'text-gray-400 bg-gray-500/15',
    scheduled: 'text-cyan-400 bg-cyan-500/15',
    on_time: 'text-green-400 bg-green-500/15',
  }[flight.status] || 'text-gray-400 bg-gray-500/10';

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Plane className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-white">{flight.flight_number}</p>
          <p className="text-[11px] text-gray-500">{flight.origin} → {flight.destination}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {flight.aircraft_tail && (
          <span className="text-[10px] font-mono font-bold text-primary hidden sm:block">{flight.aircraft_tail}</span>
        )}
        {flight.delay_minutes > 0 && (
          <span className="text-[10px] font-bold text-orange-400">+{flight.delay_minutes}m</span>
        )}
        <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full', statusColor)}>
          {flight.status?.toUpperCase()}
        </span>
        <span className="text-[10px] text-gray-600 font-mono hidden md:block">
          {flight.scheduled_departure || '—'}Z
        </span>
      </div>
    </div>
  );
}

function ShiftRow({ handover }) {
  const cfg = {
    draft: { color: 'text-gray-400', bg: 'bg-gray-500/15' },
    submitted: { color: 'text-blue-400', bg: 'bg-blue-500/15' },
    acknowledged: { color: 'text-green-400', bg: 'bg-green-500/15' },
  }[handover.status] || { color: 'text-gray-400', bg: 'bg-gray-500/15' };

  return (
    <div className="flex items-start justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Users className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{handover.submitted_by}</p>
          <p className="text-[11px] text-gray-500 capitalize">{handover.shift_period} shift · {handover.shift_date}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{handover.progress_summary}</p>
          {handover.safety_critical_notes && (
            <p className="text-[10px] text-red-400 font-bold mt-0.5">⚠ {handover.safety_critical_notes}</p>
          )}
        </div>
      </div>
      <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0', cfg.bg, cfg.color)}>
        {handover.status?.toUpperCase()}
      </span>
    </div>
  );
}

function BayGrid({ total, label, color }) {
  if (!total) return null;
  const bays = Array.from({ length: total }, (_, i) => i);
  // Simulate occupancy deterministically from index
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {bays.map(i => {
          const occupied = i % 3 === 0; // deterministic mock — every 3rd bay occupied
          return (
            <div key={i}
              title={`Bay ${i + 1} — ${occupied ? 'Occupied' : 'Available'}`}
              className={cn(
                'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xs font-bold transition-all',
                occupied
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              )}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-600 mt-2">
        <span className="text-orange-400 font-bold">{Math.ceil(total / 3)}</span> occupied ·{' '}
        <span className="text-green-400 font-bold">{total - Math.ceil(total / 3)}</span> available
      </p>
    </div>
  );
}

export default function StationDashboard() {
  const params = new URLSearchParams(window.location.search);
  const icao = params.get('icao')?.toUpperCase();

  const { data: stations = [] } = useQuery({
    queryKey: ['global-stations'],
    queryFn: () => base44.entities.Station.list('icao_code', 500),
  });

  const station = stations.find(s => s.icao_code === icao);

  const { data: allFlights = [], isLoading: loadingFlights, refetch } = useQuery({
    queryKey: ['station-flights', icao],
    queryFn: () => base44.entities.Flight.list('-scheduled_departure', 500),
    enabled: !!icao,
    refetchInterval: 30000,
  });

  const { data: handovers = [], isLoading: loadingHandovers } = useQuery({
    queryKey: ['station-handovers', icao],
    queryFn: () => base44.entities.ShiftHandover.list('-created_date', 50),
    enabled: !!icao,
    refetchInterval: 60000,
  });

  const { data: logEntries = [] } = useQuery({
    queryKey: ['station-logbook', icao],
    queryFn: () => base44.entities.LogbookEntry.filter({ station: icao }),
    enabled: !!icao,
    refetchInterval: 60000,
  });

  // Filter flights to this station (origin or destination or aircraft base)
  const flights = allFlights.filter(f =>
    f.origin === icao || f.destination === icao
  );

  const departures = flights.filter(f => f.origin === icao);
  const arrivals   = flights.filter(f => f.destination === icao);
  const airborne   = flights.filter(f => f.status === 'airborne').length;
  const delayed    = flights.filter(f => (f.delay_minutes || 0) > 0).length;

  const openDiscrepancies = logEntries.filter(e => e.entry_type === 'discrepancy' && e.discrepancy_status !== 'CLOSED');

  if (!icao) {
    return (
      <div className="min-h-screen bg-[#0a0d11] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-400 font-bold">No station selected.</p>
          <Link to="/GlobalStations" className="text-primary hover:underline text-sm">← Back to Global Stations</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d11] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/GlobalStations" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              <span className="font-mono text-primary mr-2">{icao}</span>
              {station ? station.station_name : 'Station Dashboard'}
            </h1>
            {station && (
              <p className="text-xs text-gray-500">
                {station.region} · {station.timezone}
                {station.is_active
                  ? <span className="ml-2 text-green-400 font-bold">● Operational</span>
                  : <span className="ml-2 text-red-400 font-bold">● Inactive</span>}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
          <RefreshCw className={cn('w-4 h-4 text-gray-400', loadingFlights && 'animate-spin')} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-6 max-w-5xl mx-auto">

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total Movements" value={flights.length} color="text-white" icon={Plane} />
          <KpiCard label="Airborne" value={airborne} color="text-green-400" icon={Activity} />
          <KpiCard label="Delayed" value={delayed} color={delayed > 0 ? 'text-orange-400' : 'text-gray-500'} icon={Clock} />
          <KpiCard label="Open Discrepancies" value={openDiscrepancies.length} color={openDiscrepancies.length > 0 ? 'text-red-400' : 'text-gray-500'} icon={AlertTriangle} />
        </div>

        {/* Flight Movements */}
        <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="font-extrabold text-white text-sm flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary" /> Flight Movements
            </p>
            <div className="flex gap-3 text-[10px] text-gray-500">
              <span className="text-blue-400 font-bold">{departures.length} DEP</span>
              <span className="text-green-400 font-bold">{arrivals.length} ARR</span>
            </div>
          </div>

          {loadingFlights ? (
            <div className="px-5 py-10 text-center text-gray-600 text-sm">Loading flights…</div>
          ) : flights.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-600 text-sm">No flight movements found for {icao}</div>
          ) : (
            <div>
              {departures.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-blue-500/5 border-b border-white/5">
                    <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">Departures</p>
                  </div>
                  {departures.slice(0, 10).map(f => <FlightRow key={f.id} flight={f} />)}
                </div>
              )}
              {arrivals.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-green-500/5 border-b border-white/5">
                    <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest">Arrivals</p>
                  </div>
                  {arrivals.slice(0, 10).map(f => <FlightRow key={f.id} flight={f} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hangar Bay Status */}
        {station && (station.hangar_bays > 0 || station.line_bays > 0) && (
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10">
              <p className="font-extrabold text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Hangar & Line Bay Status
              </p>
            </div>
            <div className="px-5 py-5 flex flex-col sm:flex-row gap-8">
              {station.hangar_bays > 0 && (
                <BayGrid total={station.hangar_bays} label="Hangar Bays" color="text-orange-400" />
              )}
              {station.line_bays > 0 && (
                <BayGrid total={station.line_bays} label="Line Bays" color="text-blue-400" />
              )}
            </div>
          </div>
        )}

        {/* Technician Shift Assignments */}
        <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="font-extrabold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Technician Shift Assignments
            </p>
            <Link to="/ShiftHandover" className="text-xs text-primary hover:underline">Manage →</Link>
          </div>
          {loadingHandovers ? (
            <div className="px-5 py-10 text-center text-gray-600 text-sm">Loading shifts…</div>
          ) : handovers.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-600 text-sm">
              No shift handovers on record.{' '}
              <Link to="/ShiftHandover" className="text-primary hover:underline">Create one →</Link>
            </div>
          ) : (
            handovers.slice(0, 8).map(h => <ShiftRow key={h.id} handover={h} />)
          )}
        </div>

        {/* Open Discrepancies */}
        {openDiscrepancies.length > 0 && (
          <div className="bg-[#0d1117] border border-red-500/20 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-red-500/20 flex items-center justify-between">
              <p className="font-extrabold text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Open Discrepancies at {icao}
              </p>
              <Link to="/TechOpsLogbook" className="text-xs text-primary hover:underline">Logbook →</Link>
            </div>
            {openDiscrepancies.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-start gap-3 px-5 py-3 border-b border-white/5">
                <Wrench className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{e.aircraft_tail}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{e.description}</p>
                  {e.log_page && <p className="text-[10px] font-mono text-sky-400 mt-0.5">{e.log_page}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}