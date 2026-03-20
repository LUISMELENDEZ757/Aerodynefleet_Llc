import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, Map, Cloud, FileText, ClipboardList, Calculator,
  RefreshCw, ChevronDown, ChevronRight, AlertTriangle, CheckCircle,
  Wind, Eye, Thermometer, Plane, Clock, ShieldCheck, Fuel
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];
const AWC_BASE = 'https://aviationweather.gov/api/data';

async function fetchMetar(icao) {
  const res = await fetch(`${AWC_BASE}/metar?ids=${icao}&format=json&hours=2`);
  if (!res.ok) throw new Error('METAR fetch failed');
  const data = await res.json();
  return data[0] || null;
}

async function fetchTaf(icao) {
  const res = await fetch(`${AWC_BASE}/taf?ids=${icao}&format=json`);
  if (!res.ok) throw new Error('TAF fetch failed');
  const data = await res.json();
  return data[0] || null;
}

function flightCatColor(cat) {
  if (!cat) return 'text-muted-foreground bg-muted';
  switch (cat.toUpperCase()) {
    case 'VFR':  return 'text-green-400 bg-green-500/15';
    case 'MVFR': return 'text-blue-400 bg-blue-500/15';
    case 'IFR':  return 'text-destructive bg-destructive/15';
    case 'LIFR': return 'text-purple-400 bg-purple-500/15';
    default:     return 'text-muted-foreground bg-muted';
  }
}

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'brief',    label: 'Flight Brief',  icon: BookOpen },
  { key: 'wx',       label: 'WX / METAR',    icon: Cloud },
  { key: 'perf',     label: 'Performance',   icon: Calculator },
  { key: 'checklist',label: 'Checklist',     icon: ClipboardList },
  { key: 'release',  label: 'Dispatch',      icon: FileText },
];

// ─── CHECKLISTS ──────────────────────────────────────────────────────────────
const CHECKLISTS = {
  'Preflight': [
    'ATIS/AWOS — received & altimeter set',
    'Aircraft documents — AROW verified',
    'MEL/CDL — reviewed & accepted',
    'NOTAMs — origin, destination, alternate',
    'Weather briefing — METAR/TAF/SIGMET/PIREP',
    'Fuel on board — verified vs. release',
    'Weight & balance — within limits',
    'FMS — programmed & cross-checked',
    'Takeoff performance — computed & briefed',
    'Emergency equipment — accessible',
  ],
  'Before Start': [
    'Cockpit prep — complete',
    'Parking brake — set',
    'Battery switch — ON',
    'Fuel quantity — checked',
    'Flight controls — free & correct',
    'Crew briefing — complete',
    'Door / window — secured',
    'Transponder — ALT/TCAS ON',
  ],
  'Taxi': [
    'Taxi clearance — received',
    'Flight instruments — checked',
    'Flaps — set for departure',
    'Trim — set',
    'Lights — taxi/strobes as required',
    'Brakes — checked',
  ],
  'Before Takeoff': [
    'Lineup check — complete',
    'Transponder — ON',
    'Lights — all on',
    'Takeoff briefing — complete',
    'V-speeds — set & confirmed',
    'Crew ready',
  ],
};

// ─── PERFORMANCE CALCULATOR ──────────────────────────────────────────────────
function PerformanceCalc() {
  const [form, setForm] = useState({
    oat: '', pressure_alt: '', weight: '', flaps: '5', wind_dir: '', wind_spd: '', rwy_hdg: '',
  });
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const calculate = () => {
    const oat = parseFloat(form.oat) || 15;
    const pa = parseFloat(form.pressure_alt) || 0;
    const wt = parseFloat(form.weight) || 60000;
    const ws = parseFloat(form.wind_spd) || 0;
    const wd = parseFloat(form.wind_dir) || 0;
    const rh = parseFloat(form.rwy_hdg) || 0;

    // Headwind component
    const angle = ((wd - rh) * Math.PI) / 180;
    const hwc = Math.round(ws * Math.cos(angle));

    // Simplified field length estimate (demonstration)
    const baseTOR = 4500 + (wt - 55000) * 0.05 + pa * 0.3 + (oat - 15) * 15 - hwc * 30;
    const v1  = Math.round(115 + (wt - 55000) / 1000 * 2 + pa / 1000 - hwc * 0.3);
    const vr  = v1 + 4;
    const v2  = vr + 6;
    const n1  = Math.round(93 + (oat - 15) * 0.1 + pa / 1000 * 0.5);

    setResult({ tor: Math.round(baseTOR), v1: Math.max(100, v1), vr: Math.max(104, vr), v2: Math.max(110, v2), n1: Math.min(100, n1), hwc });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Takeoff Performance — CRJ Series</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'OAT (°C)',         key: 'oat',          ph: '15' },
              { label: 'Press. Alt (ft)',   key: 'pressure_alt', ph: '0' },
              { label: 'Gross Weight (lbs)',key: 'weight',       ph: '60000' },
              { label: 'Wind Direction',   key: 'wind_dir',     ph: '270' },
              { label: 'Wind Speed (kt)',   key: 'wind_spd',     ph: '10' },
              { label: 'Runway Heading',   key: 'rwy_hdg',      ph: '280' },
            ].map(({ label, key, ph }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input
                  type="number"
                  placeholder={ph}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
          <button
            onClick={calculate}
            className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            Compute Takeoff Performance
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Computed Results</p>
          </div>
          <div className="p-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'V1',   value: `${result.v1} kt`,  color: 'text-primary' },
              { label: 'VR',   value: `${result.vr} kt`,  color: 'text-primary' },
              { label: 'V2',   value: `${result.v2} kt`,  color: 'text-primary' },
              { label: 'N1',   value: `${result.n1}%`,    color: 'text-green-400' },
              { label: 'HWC',  value: `${result.hwc} kt`, color: result.hwc >= 0 ? 'text-green-400' : 'text-orange-400' },
              { label: 'TOFL', value: `${result.tor} ft`, color: result.tor > 7000 ? 'text-orange-400' : 'text-foreground' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-background/40 rounded-lg px-3 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={cn('text-lg font-extrabold font-mono', color)}>{value}</p>
              </div>
            ))}
          </div>
          <p className="px-4 pb-3 text-xs text-muted-foreground">⚠ Demonstration only — always use approved AFM/QRH data for actual operations.</p>
        </div>
      )}
    </div>
  );
}

// ─── WX STATION ──────────────────────────────────────────────────────────────
function WxStation({ icao }) {
  const [expanded, setExpanded] = useState(false);
  const { data: metar, isLoading } = useQuery({
    queryKey: ['efb-metar', icao],
    queryFn: () => fetchMetar(icao),
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
  const { data: taf, isLoading: tLoading } = useQuery({
    queryKey: ['efb-taf', icao],
    queryFn: () => fetchTaf(icao),
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
    enabled: expanded,
  });

  const cat = metar?.flightCategory;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn('text-xs font-mono font-bold px-2 py-0.5 rounded', flightCatColor(cat))}>
            {cat || (isLoading ? '···' : '---')}
          </span>
          <div className="text-left">
            <p className="text-sm font-bold font-mono text-foreground">{icao}</p>
            {metar?.name && <p className="text-xs text-muted-foreground">{metar.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {metar && (
            <span className="flex items-center gap-1 text-xs font-mono text-foreground">
              <Wind className="w-3 h-3 text-muted-foreground" />
              {metar.wdir != null ? `${String(metar.wdir).padStart(3,'0')}°` : 'VRB'} @ {metar.wspd}kt
              {metar.wgst ? ` G${metar.wgst}` : ''}
            </span>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" /> METAR
            </p>
            {metar?.rawOb ? (
              <p className="text-xs font-mono text-foreground bg-background/60 rounded-lg px-3 py-2 break-all leading-relaxed">{metar.rawOb}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{isLoading ? 'Fetching…' : 'No METAR available'}</p>
            )}
          </div>
          {metar && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metar.visib != null && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Eye className="w-3 h-3" />Vis</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metar.visib} SM</p>
                </div>
              )}
              {metar.altim != null && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground">Altimeter</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metar.altim.toFixed(2)}"</p>
                </div>
              )}
              {metar.temp != null && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Thermometer className="w-3 h-3" />Temp</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metar.temp}°C / {metar.dewp}°C</p>
                </div>
              )}
              {metar.clouds?.length > 0 && (
                <div className="bg-background/40 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-muted-foreground">Ceiling</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metar.clouds[0].cover} {metar.clouds[0].base != null ? `${metar.clouds[0].base}'` : ''}</p>
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">TAF</p>
            {tLoading ? (
              <p className="text-xs text-muted-foreground">Fetching TAF…</p>
            ) : taf?.rawTAF ? (
              <p className="text-xs font-mono text-foreground bg-background/60 rounded-lg px-3 py-2 break-all whitespace-pre-wrap leading-relaxed">{taf.rawTAF}</p>
            ) : (
              <p className="text-xs text-muted-foreground">No TAF available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHECKLIST SECTION ───────────────────────────────────────────────────────
function ChecklistSection({ title, items }) {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState({});
  const toggle = (i) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));
  const done = Object.values(checked).filter(Boolean).length;
  const allDone = done === items.length;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
            allDone ? 'bg-green-500' : 'bg-secondary border border-border'
          )}>
            {allDone && <CheckCircle className="w-3 h-3 text-white" />}
          </span>
          <p className="text-sm font-bold text-foreground">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-xs font-bold', allDone ? 'text-green-400' : 'text-muted-foreground')}>{done}/{items.length}</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/50 p-3 space-y-1">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                checked[idx] ? 'bg-green-500/10' : 'hover:bg-secondary/50'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                checked[idx] ? 'border-green-500 bg-green-500' : 'border-border'
              )}>
                {checked[idx] && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={cn('text-sm transition-colors', checked[idx] ? 'text-muted-foreground line-through' : 'text-foreground')}>
                {item}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FLIGHT BRIEF ────────────────────────────────────────────────────────────
function FlightBrief({ flights, releases, crew }) {
  if (flights.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No flights loaded for today
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flights.map(f => {
        const rel = releases.find(r => r.flight_number === f.flight_number);
        const flightCrew = crew.filter(c =>
          c.flight_number === f.flight_number &&
          (c.role === 'captain' || c.role === 'first_officer')
        );
        const STATUS_CONFIG = {
          scheduled: { label: 'Scheduled', color: 'text-muted-foreground', bg: 'bg-muted' },
          boarding:  { label: 'Boarding',  color: 'text-primary',          bg: 'bg-primary/15' },
          departed:  { label: 'Departed',  color: 'text-blue-400',         bg: 'bg-blue-500/15' },
          airborne:  { label: 'Airborne',  color: 'text-green-400',        bg: 'bg-green-500/15' },
          arrived:   { label: 'Arrived',   color: 'text-green-400',        bg: 'bg-green-500/15' },
          cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
          delayed:   { label: 'Delayed',   color: 'text-orange-400',       bg: 'bg-orange-500/15' },
        };
        const cfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.scheduled;

        return (
          <div key={f.id} className="rounded-xl bg-card border border-border overflow-hidden">
            {/* Flight header */}
            <div className="px-4 py-3 bg-secondary/40 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                  <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.aircraft_tail} {f.aircraft_type && `(${f.aircraft_type})`}</p>
                </div>
              </div>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
            </div>
            <div className="p-4 space-y-4">
              {/* Times */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-background/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Gate</p>
                  <p className="text-sm font-mono font-bold text-foreground">{f.gate || '—'}</p>
                </div>
                <div className="bg-background/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">STD</p>
                  <p className="text-sm font-mono font-bold text-foreground">{f.scheduled_departure || '--:--'}</p>
                </div>
                <div className="bg-background/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">STA</p>
                  <p className="text-sm font-mono font-bold text-foreground">{f.scheduled_arrival || '--:--'}</p>
                </div>
                {f.delay_minutes > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">Delay</p>
                    <p className="text-sm font-mono font-bold text-orange-400">+{f.delay_minutes} min</p>
                  </div>
                )}
              </div>

              {/* Crew */}
              {flightCrew.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Flight Crew</p>
                  <div className="flex flex-wrap gap-2">
                    {flightCrew.map(c => (
                      <div key={c.id} className="flex items-center gap-2 bg-background/40 rounded-lg px-3 py-1.5">
                        <p className="text-xs font-semibold text-foreground">{c.crew_name}</p>
                        <span className="text-xs text-muted-foreground">{c.role === 'captain' ? 'CPT' : 'F/O'}</span>
                        <span className={cn(
                          'text-xs font-bold px-1.5 py-0.5 rounded-full',
                          c.legal_status === 'legal' ? 'text-green-400 bg-green-500/15' :
                          c.legal_status === 'near_limit' ? 'text-orange-400 bg-orange-500/15' :
                          'text-destructive bg-destructive/15'
                        )}>
                          {c.legal_status === 'legal' ? '✓ Legal' : c.legal_status === 'near_limit' ? 'Near Limit' : 'ILLEGAL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispatch */}
              {rel && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Dispatch Release
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className={cn('text-sm font-bold', rel.release_status === 'released' ? 'text-green-400' : 'text-orange-400')}>
                        {rel.release_status?.toUpperCase()}
                      </p>
                    </div>
                    {rel.fuel_on_board != null && (
                      <div className="bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">Fuel OB</p>
                        <p className="text-sm font-mono font-bold text-foreground">{rel.fuel_on_board.toLocaleString()} lbs</p>
                      </div>
                    )}
                    {rel.min_fuel_required != null && (
                      <div className="bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">Min Fuel</p>
                        <p className="text-sm font-mono font-bold text-foreground">{rel.min_fuel_required.toLocaleString()} lbs</p>
                      </div>
                    )}
                  </div>
                  {rel.remarks && (
                    <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2 mt-2">{rel.remarks}</p>
                  )}
                </div>
              )}

              {/* Notes */}
              {f.notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ops Notes</p>
                  <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2">{f.notes}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN EFB ────────────────────────────────────────────────────────────────
export default function EFB() {
  const [activeTab, setActiveTab] = useState('brief');

  const { data: flights = [], isLoading: loadingFlights, refetch } = useQuery({
    queryKey: ['efb-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });
  const { data: releases = [] } = useQuery({
    queryKey: ['efb-releases', TODAY],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });
  const { data: crew = [] } = useQuery({
    queryKey: ['efb-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const stations = React.useMemo(() => {
    const s = new Set();
    flights.forEach(f => { if (f.origin) s.add(f.origin); if (f.destination) s.add(f.destination); });
    return [...s];
  }, [flights]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* EFB Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide leading-tight">EFB</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Electronic Flight Bag · Aerodyne Fleet LLC</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xl font-mono font-bold text-foreground">{timeStr} Z</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <button onClick={refetch} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" /> Sync data
        </button>
      </div>

      {/* Tab bar */}
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-secondary rounded-xl p-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-all',
                activeTab === key
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'brief' && (
          <FlightBrief flights={flights} releases={releases} crew={crew} />
        )}

        {activeTab === 'wx' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Live data from <span className="text-primary font-semibold">aviationweather.gov</span> · METAR every 5 min · TAF every 15 min
            </p>
            {stations.length === 0 ? (
              <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Add flights to load live weather for origin/destination airports
              </div>
            ) : (
              stations.map(icao => <WxStation key={icao} icao={icao} />)
            )}
          </div>
        )}

        {activeTab === 'perf' && <PerformanceCalc />}

        {activeTab === 'checklist' && (
          <div className="space-y-2">
            {Object.entries(CHECKLISTS).map(([title, items]) => (
              <ChecklistSection key={title} title={title} items={items} />
            ))}
          </div>
        )}

        {activeTab === 'release' && (
          <div className="space-y-3">
            {releases.length === 0 ? (
              <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No dispatch releases for today
              </div>
            ) : releases.map(r => (
              <div key={r.id} className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-bold text-foreground">{r.flight_number}</p>
                    <p className="text-xs text-muted-foreground">{r.origin} → {r.destination}{r.alternate ? ` · ALT: ${r.alternate}` : ''}</p>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full',
                    r.release_status === 'released' ? 'bg-green-500/15 text-green-400' :
                    r.release_status === 'pending'  ? 'bg-muted text-muted-foreground' :
                    r.release_status === 'amended'  ? 'bg-primary/15 text-primary' :
                    'bg-destructive/15 text-destructive'
                  )}>
                    {r.release_status?.toUpperCase()}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {r.fuel_on_board != null && (
                      <div className="bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">Fuel On Board</p>
                        <p className="text-sm font-mono font-bold text-foreground">{r.fuel_on_board.toLocaleString()} lbs</p>
                      </div>
                    )}
                    {r.min_fuel_required != null && (
                      <div className="bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">Min Required</p>
                        <p className="text-sm font-mono font-bold text-foreground">{r.min_fuel_required.toLocaleString()} lbs</p>
                      </div>
                    )}
                  </div>
                  {r.notams && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">NOTAMs</p>
                      <p className="text-xs font-mono text-foreground bg-background/40 rounded-lg px-3 py-2 whitespace-pre-wrap">{r.notams}</p>
                    </div>
                  )}
                  {r.remarks && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
                      <p className="text-xs text-foreground">{r.remarks}</p>
                    </div>
                  )}
                  {r.dispatcher_name && (
                    <p className="text-xs text-muted-foreground">Dispatcher: <span className="text-foreground font-semibold">{r.dispatcher_name}</span></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}