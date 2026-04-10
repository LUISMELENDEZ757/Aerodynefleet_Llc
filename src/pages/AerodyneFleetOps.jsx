import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Plane, ChevronLeft, RefreshCw, Clock, AlertTriangle, CheckCircle,
  ArrowRight, Activity, Wind, Users, MapPin, Search, Filter, Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Zulu clock ──────────────────────────────────────────────────────────────
function ZuluClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const pad = n => String(n).padStart(2, '0');
  return (
    <span className="font-mono text-xs font-extrabold text-primary tracking-widest">
      {pad(t.getUTCHours())}:{pad(t.getUTCMinutes())}:{pad(t.getUTCSeconds())} Z
    </span>
  );
}

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  scheduled:  { label: 'SCH',      color: 'text-gray-400',   bg: 'bg-gray-500/15',   dot: 'bg-gray-400' },
  boarding:   { label: 'BOARDING', color: 'text-blue-400',   bg: 'bg-blue-500/15',   dot: 'bg-blue-400 animate-pulse' },
  departed:   { label: 'DEP',      color: 'text-amber-400',  bg: 'bg-amber-500/15',  dot: 'bg-amber-400' },
  airborne:   { label: 'AIRBORNE', color: 'text-green-400',  bg: 'bg-green-500/15',  dot: 'bg-green-400 animate-pulse' },
  arrived:    { label: 'ARR',      color: 'text-green-400',  bg: 'bg-green-500/15',  dot: 'bg-green-400' },
  landed:     { label: 'LANDED',   color: 'text-green-400',  bg: 'bg-green-500/15',  dot: 'bg-green-400' },
  delayed:    { label: 'DELAY',    color: 'text-red-400',    bg: 'bg-red-500/15',    dot: 'bg-red-400 animate-pulse' },
  cancelled:  { label: 'CXL',      color: 'text-red-400',    bg: 'bg-red-500/15',    dot: 'bg-red-500' },
  on_time:    { label: 'ON TIME',  color: 'text-green-400',  bg: 'bg-green-500/15',  dot: 'bg-green-400' },
};

function statusCfg(f) {
  if (f.status === 'scheduled' && f.delay_minutes > 0) return STATUS_CFG.delayed;
  return STATUS_CFG[f.status] || STATUS_CFG.scheduled;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-[#111620] border border-white/8 rounded-2xl px-4 py-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-black leading-none', color)}>{value}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
      </div>
    </div>
  );
}

// ── Flight progress bar ───────────────────────────────────────────────────────
function FlightProgress({ flight }) {
  const pct =
    flight.status === 'airborne' || flight.status === 'departed' ? 55 :
    flight.status === 'arrived' || flight.status === 'landed' ? 100 : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] font-mono text-gray-500 w-10 flex-shrink-0">{flight.origin}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
        <div
          className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-400' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
        {(flight.status === 'airborne') && (
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-primary" style={{ left: `${pct}%` }}>
            <Plane className="w-3 h-3 fill-primary" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-mono text-gray-500 w-10 flex-shrink-0 text-right">{flight.destination}</span>
    </div>
  );
}

// ── Flight Row ────────────────────────────────────────────────────────────────
function FlightRow({ flight, isSelected, onClick }) {
  const cfg = statusCfg(flight);
  const isDelayed = flight.delay_minutes > 0;
  const isCxl = flight.status === 'cancelled';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left grid gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
        isCxl && 'opacity-50'
      )}
      style={{ gridTemplateColumns: '90px 1fr 110px 80px 80px 70px' }}
    >
      {/* Flight # */}
      <div>
        <p className="text-sm font-extrabold text-white font-mono">{flight.flight_number}</p>
        <p className="text-[10px] text-gray-500">{flight.flight_date}</p>
      </div>

      {/* Route + progress */}
      <div className="min-w-0">
        <FlightProgress flight={flight} />
        <p className="text-[10px] text-gray-500 mt-1">{flight.aircraft_tail || '—'} · {flight.aircraft_type || '—'}</p>
      </div>

      {/* STD → STA */}
      <div className="text-right">
        <p className="text-xs font-bold text-white font-mono">{flight.scheduled_departure || '—'} → {flight.scheduled_arrival || '—'}</p>
        {flight.actual_departure && <p className="text-[10px] text-green-400 font-mono">ATD {flight.actual_departure}</p>}
      </div>

      {/* Gate */}
      <div className="text-center">
        <p className="text-xs font-bold text-gray-300">{flight.gate || '—'}</p>
        <p className="text-[10px] text-gray-600">Gate</p>
      </div>

      {/* Delay */}
      <div className="text-center">
        {isDelayed
          ? <p className="text-xs font-extrabold text-red-400">+{flight.delay_minutes}m</p>
          : <p className="text-xs text-gray-600">—</p>}
        {flight.delay_reason && <p className="text-[10px] text-gray-600 truncate">{flight.delay_reason?.slice(0, 8)}</p>}
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-end">
        <span className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
          {cfg.label}
        </span>
      </div>
    </button>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────────
function FlightDetailPanel({ flight, aircraft }) {
  if (!flight) return (
    <div className="flex items-center justify-center h-full text-gray-600 text-sm">
      <div className="text-center space-y-2">
        <Plane className="w-10 h-10 mx-auto opacity-20" />
        <p>Select a flight to view details</p>
      </div>
    </div>
  );

  const cfg = statusCfg(flight);
  const ac = aircraft.find(a => a.tail_number === flight.aircraft_tail);

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-black text-white font-mono">{flight.flight_number}</p>
          <p className="text-sm text-gray-400">{flight.origin} → {flight.destination}</p>
        </div>
        <span className={cn('flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full', cfg.bg, cfg.color)}>
          <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      {/* Route visual */}
      <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{flight.origin}</p>
            <p className="text-[10px] text-gray-500">Departure</p>
            <p className="text-xs font-mono text-primary">{flight.scheduled_departure}</p>
            {flight.actual_departure && <p className="text-[10px] text-green-400">ATD {flight.actual_departure}</p>}
          </div>
          <div className="flex-1 mx-4">
            <FlightProgress flight={flight} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{flight.destination}</p>
            <p className="text-[10px] text-gray-500">Arrival</p>
            <p className="text-xs font-mono text-primary">{flight.scheduled_arrival}</p>
            {flight.actual_arrival && <p className="text-[10px] text-green-400">ATA {flight.actual_arrival}</p>}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Aircraft Tail', value: flight.aircraft_tail || '—', mono: true },
          { label: 'Aircraft Type', value: flight.aircraft_type || '—' },
          { label: 'Gate', value: flight.gate || '—' },
          { label: 'Airline', value: flight.airline || '—' },
          { label: 'Date', value: flight.flight_date || '—' },
          { label: 'Delay', value: flight.delay_minutes > 0 ? `+${flight.delay_minutes} min` : 'On Time', color: flight.delay_minutes > 0 ? 'text-red-400' : 'text-green-400' },
        ].map(({ label, value, mono, color }) => (
          <div key={label} className="bg-[#0d1117] border border-white/8 rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
            <p className={cn('text-sm font-bold text-white mt-0.5', mono && 'font-mono', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Delay reason */}
      {flight.delay_reason && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Delay Reason</p>
            <p className="text-sm text-red-300">{flight.delay_reason}</p>
          </div>
        </div>
      )}

      {/* Aircraft specs */}
      {ac && (
        <div className="bg-[#0d1117] border border-white/8 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Aircraft Details</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { l: 'MSN', v: ac.msn || '—' },
              { l: 'Engine', v: ac.engine_type || '—' },
              { l: 'ETOPS', v: ac.etops_approval ? `${ac.etops_approval} min` : '—' },
              { l: 'CAT', v: ac.cat_approval || '—' },
              { l: 'Base', v: ac.base_station || '—' },
              { l: 'Status', v: ac.status?.toUpperCase() || '—' },
            ].map(({ l, v }) => (
              <div key={l} className="flex justify-between">
                <span className="text-gray-600">{l}</span>
                <span className="text-gray-300 font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {flight.notes && (
        <div className="bg-[#0d1117] border border-white/8 rounded-xl px-4 py-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ops Notes</p>
          <p className="text-xs text-gray-300">{flight.notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Link to="/TechOpsLogbook" className="flex-1 py-2.5 text-center rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          Logbook
        </Link>
        <Link to="/Dispatch" className="flex-1 py-2.5 text-center rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          Dispatch
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',      label: 'All' },
  { id: 'active',   label: 'Active' },
  { id: 'airborne', label: 'Airborne' },
  { id: 'delayed',  label: 'Delayed' },
  { id: 'arrived',  label: 'Arrived' },
];

export default function AerodyneFleetOps() {
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const { data: flights = [], isLoading, refetch } = useQuery({
    queryKey: ['afo-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 500),
    refetchInterval: 30000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['afo-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const todayFlights = flights.filter(f => f.flight_date === today);

  // KPIs
  const airborne  = todayFlights.filter(f => f.status === 'airborne').length;
  const delayed   = todayFlights.filter(f => f.delay_minutes > 0 && f.status !== 'cancelled').length;
  const cancelled = todayFlights.filter(f => f.status === 'cancelled').length;
  const onTime    = todayFlights.filter(f => (f.delay_minutes || 0) === 0 && f.status !== 'cancelled').length;
  const otp       = todayFlights.length > 0 ? Math.round((onTime / todayFlights.length) * 100) : 0;

  const filtered = todayFlights.filter(f => {
    const matchStatus =
      statusFilter === 'all'      ? true :
      statusFilter === 'active'   ? ['boarding','departed','airborne'].includes(f.status) :
      statusFilter === 'airborne' ? f.status === 'airborne' :
      statusFilter === 'delayed'  ? f.delay_minutes > 0 :
      statusFilter === 'arrived'  ? ['arrived','landed'].includes(f.status) : true;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      f.flight_number?.toLowerCase().includes(q) ||
      f.origin?.toLowerCase().includes(q) ||
      f.destination?.toLowerCase().includes(q) ||
      f.aircraft_tail?.toLowerCase().includes(q) ||
      f.gate?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }).sort((a, b) => (a.scheduled_departure || '').localeCompare(b.scheduled_departure || ''));

  const selectedFlight = flights.find(f => f.id === selected) || null;

  return (
    <div className="h-screen flex flex-col bg-[#080c12] text-white overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-4 px-5 h-14 border-b border-white/8 flex-shrink-0 bg-[#0a0e18]">
        <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-extrabold text-white tracking-widest uppercase">Aerodyne Fleet Ops</p>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase">Operations Control · {today}</p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="hidden md:flex items-center gap-5 ml-6 border-l border-white/10 pl-6">
          {[
            { label: 'OTP', val: `${otp}%`, color: otp >= 85 ? 'text-green-400' : otp >= 70 ? 'text-amber-400' : 'text-red-400' },
            { label: 'Airborne', val: airborne, color: 'text-primary' },
            { label: 'Delayed', val: delayed, color: delayed > 0 ? 'text-red-400' : 'text-gray-500' },
            { label: 'Flights Today', val: todayFlights.length, color: 'text-white' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={cn('text-base font-black leading-none', color)}>{val}</p>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ZuluClock />
          <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors">
            <RefreshCw className={cn('w-3.5 h-3.5 text-gray-400', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: flight board */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-white/8">
          {/* Filters + search */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0 bg-[#0a0e18]">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Flight, tail, gate, route…"
                className="w-full bg-[#111620] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-1.5">
              {FILTERS.map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  className={cn('text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest',
                    statusFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-[#111620] border border-white/10 text-gray-500 hover:text-gray-300')}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-gray-600 ml-auto">{filtered.length} flights</span>
          </div>

          {/* Column headers */}
          <div
            className="grid gap-3 px-4 py-2 border-b border-white/8 text-[9px] font-extrabold text-gray-600 uppercase tracking-widest bg-[#0a0e18] flex-shrink-0"
            style={{ gridTemplateColumns: '90px 1fr 110px 80px 80px 70px' }}
          >
            <span>Flight</span><span>Route</span><span>STD → STA</span><span className="text-center">Gate</span><span className="text-center">Delay</span><span className="text-right">Status</span>
          </div>

          {/* Flight list */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-600 text-sm">Loading flights…</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-600">
                <Plane className="w-10 h-10 opacity-20" />
                <p className="text-sm">No flights found</p>
              </div>
            ) : (
              filtered.map(f => (
                <FlightRow
                  key={f.id}
                  flight={f}
                  isSelected={f.id === selected}
                  onClick={() => setSelected(f.id === selected ? null : f.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 bg-[#0a0e18] flex-shrink-0">
          <div className="px-5 py-3 border-b border-white/8 flex-shrink-0">
            <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest">Flight Detail</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <FlightDetailPanel flight={selectedFlight} aircraft={aircraft} />
          </div>
        </div>
      </div>
    </div>
  );
}