import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plane, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import FidsRow from '@/components/fids/FidsRow';
import { normalizeFlight, STATUS_COLORS } from '@/components/fids/fidsModel';

const QUICK_AIRPORTS = ['KEWR', 'KJFK', 'KLGA', 'KORD', 'KATL', 'KLAX'];
const MODES = [
  { key: 'departures', label: 'DEPARTURES' },
  { key: 'arrivals', label: 'ARRIVALS' },
  { key: 'combined', label: 'COMBINED' },
];

export default function FlightBoard() {
  const urlIcao = new URLSearchParams(window.location.search).get('icao')?.toUpperCase();
  const [airport, setAirport] = useState(urlIcao || 'KEWR');
  const [airportInput, setAirportInput] = useState(urlIcao || 'KEWR');
  const [mode, setMode] = useState('departures');
  const [zuluTime, setZuluTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setZuluTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['fids-board', airport],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareSearch', { type: 'airport_board', airport });
      return res.data;
    },
    refetchInterval: 60000,
  });

  const now = Date.now();
  const departures = (data?.departures || []).map(f => normalizeFlight(f, 'departure', now))
    .sort((a, b) => (a.scheduled || '').localeCompare(b.scheduled || ''));
  const arrivals = (data?.arrivals || []).map(f => normalizeFlight(f, 'arrival', now))
    .sort((a, b) => (a.scheduled || '').localeCompare(b.scheduled || ''));

  const rows = mode === 'departures' ? departures
    : mode === 'arrivals' ? arrivals
    : [...departures, ...arrivals].sort((a, b) => (a.scheduled || '').localeCompare(b.scheduled || ''));

  const h = String(zuluTime.getUTCHours()).padStart(2, '0');
  const m = String(zuluTime.getUTCMinutes()).padStart(2, '0');
  const s = String(zuluTime.getUTCSeconds()).padStart(2, '0');
  const updated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const isDep = mode !== 'arrivals';

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header: airport name · mode toggle · last updated ── */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Plane className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">{airport} · FLIGHT BOARD</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">
                Live FIDS · AeroAPI
                {updated && <span className="text-muted-foreground"> · updated {String(updated.getUTCHours()).padStart(2, '0')}:{String(updated.getUTCMinutes()).padStart(2, '0')}:{String(updated.getUTCSeconds()).padStart(2, '0')}Z</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-2xl font-mono font-extrabold text-foreground">{h}:{m}:{s}</p>
            <p className="text-xs text-muted-foreground">UTC / Zulu</p>
          </div>
        </div>

        {/* Airport selector + mode toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={e => { e.preventDefault(); const v = airportInput.trim().toUpperCase(); if (v.length >= 3) setAirport(v); }}
            className="flex items-center gap-2"
          >
            <input
              value={airportInput}
              onChange={e => setAirportInput(e.target.value.toUpperCase())}
              placeholder="ICAO e.g. KEWR"
              className="h-9 w-28 bg-background border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">GO</button>
          </form>
          {QUICK_AIRPORTS.map(a => (
            <button key={a} onClick={() => { setAirport(a); setAirportInput(a); }}
              className={cn('h-9 px-3 rounded-lg text-xs font-mono font-bold border transition-colors',
                airport === a ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground')}>
              {a}
            </button>
          ))}
          <div className="flex gap-1 ml-auto">
            {MODES.map(mo => (
              <button key={mo.key} onClick={() => setMode(mo.key)}
                className={cn('h-9 px-4 rounded-lg text-xs font-extrabold border transition-colors',
                  mode === mo.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground')}>
                {mo.label}
              </button>
            ))}
            <button onClick={() => refetch()} title="Refresh"
              className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Status summary pills */}
        <div className="flex gap-2 flex-wrap">
          {Object.keys(STATUS_COLORS).map(st => {
            const count = rows.filter(f => f.status === st).length;
            if (!count) return null;
            const cfg = STATUS_COLORS[st];
            return <span key={st} className={cn('text-xs font-bold px-3 py-1 rounded-full', cfg.color, cfg.bg)}>{count} {st}</span>;
          })}
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <div className="w-24">Flight</div>
          <div className="flex-1">Route</div>
          <div className="w-16 text-right">{isDep ? 'STD' : 'STA'}</div>
          <div className="w-16 text-right">{isDep ? 'ETD' : 'ETA'}</div>
          <div className="hidden sm:block w-14 text-center">Gate</div>
          <div className="w-24 text-center">Status</div>
          <div className="hidden md:block w-20 text-right">Aircraft</div>
        </div>

        {/* Board rows */}
        {isLoading ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">Loading live {airport} flights…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">No flights found for {airport}</div>
        ) : (
          <div className="space-y-1">
            {rows.map(f => <FidsRow key={`${f.type}-${f.id}`} flight={f} />)}
          </div>
        )}
      </div>
    </div>
  );
}