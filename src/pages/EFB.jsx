import { useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';
import {
  LayoutDashboard, Cloud, FileText, Calculator, BookOpen,
  MapPin, Map, History, Settings, Plane, RefreshCw,
  Scale, Fuel, AlertTriangle, Radio, Users, Navigation2,
  Zap, QrCode, ChevronRight, Lock, PenLine
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import useAircraftPerformance from '@/hooks/useAircraftPerformance';
import RovingTabindexList from '@/components/accessibility/RovingTabindexList';

// EFB module components - lazy-loaded per tab
const WeightBalance         = lazy(() => import('@/components/efb/WeightBalance'));
const FuelPlanning          = lazy(() => import('@/components/efb/FuelPlanning'));
const RunwayAnalysis        = lazy(() => import('@/components/efb/RunwayAnalysis'));
const CrewLegality          = lazy(() => import('@/components/efb/CrewLegality'));
const NotamViewer           = lazy(() => import('@/components/efb/NotamViewer'));
const AcarsMessaging        = lazy(() => import('@/components/efb/AcarsMessaging'));
const PostflightReport      = lazy(() => import('@/components/efb/PostflightReport'));
const WeatherPanel          = lazy(() => import('@/components/flightops/WeatherPanel'));
const FlightReleaseSignOff  = lazy(() => import('@/components/efb/FlightReleaseSignOff'));
const LiveMap               = lazy(() => import('@/components/efb/LiveMap'));
const AirportBriefing       = lazy(() => import('@/components/efb/AirportBriefing'));
const ETOPSDriftDown        = lazy(() => import('@/components/efb/ETOPSDriftDown'));
const QRScanPanel           = lazy(() => import('@/components/efb/QRScanPanel'));
const FlightTimesPanel      = lazy(() => import('@/components/flightcrew/FlightTimesPanel'));
const DocumentsTab          = lazy(() => import('@/components/efb/DocumentsTab'));

const TODAY = new Date().toISOString().split('T')[0];

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
    </div>
  );
}

// 9 canonical EFB tabs
const TABS = [
  { key: 'overview',     label: 'Overview',     icon: LayoutDashboard },
  { key: 'weather',      label: 'Weather',       icon: Cloud },
  { key: 'documents',    label: 'Documents',     icon: FileText },
  { key: 'performance',  label: 'Performance',   icon: Calculator },
  { key: 'briefing',     label: 'Briefing',      icon: BookOpen },
  { key: 'airports',     label: 'Airports',      icon: MapPin },
  { key: 'charts',       label: 'Charts',        icon: Map },
  { key: 'history',      label: 'History',       icon: History },
  { key: 'settings',     label: 'Settings',      icon: Settings },
];

// ─── OVERVIEW ─────────────────────────────────────────────────────────────
function OverviewTab({ flights, releases, crew }) {
  const todayFlights = flights.filter(f => f.flight_date === TODAY);
  const airborne = todayFlights.filter(f => ['airborne', 'departed'].includes(f.status));
  const delayed  = todayFlights.filter(f => f.status === 'delayed' || (f.delay_minutes || 0) >= 15);
  const rel = releases[0];

  const STATUS_COLORS = {
    scheduled: { label: 'Scheduled', color: 'text-muted-foreground', bg: 'bg-muted' },
    boarding:  { label: 'Boarding',  color: 'text-primary',          bg: 'bg-primary/15' },
    departed:  { label: 'Departed',  color: 'text-blue-400',         bg: 'bg-blue-500/15' },
    airborne:  { label: 'Airborne',  color: 'text-green-400',        bg: 'bg-green-500/15' },
    arrived:   { label: 'Arrived',   color: 'text-green-400',        bg: 'bg-green-500/15' },
    cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
    delayed:   { label: 'Delayed',   color: 'text-orange-400',       bg: 'bg-orange-500/15' },
  };

  return (
    <div className="space-y-4">
      {/* Status tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Flights Today', value: todayFlights.length, color: 'text-foreground' },
          { label: 'Airborne',      value: airborne.length,     color: 'text-green-400' },
          { label: 'Delayed',       value: delayed.length,      color: delayed.length > 0 ? 'text-orange-400' : 'text-muted-foreground' },
          { label: 'Crew Assigned', value: crew.length,         color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Flight summary cards */}
      {todayFlights.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No flights loaded for today
        </div>
      ) : todayFlights.map(f => {
        const cfg = STATUS_COLORS[f.status] || STATUS_COLORS.scheduled;
        const fc = crew.filter(c => c.flight_number === f.flight_number);
        const frel = releases.find(r => r.flight_number === f.flight_number);
        return (
          <div key={f.id} className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 bg-secondary/40 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-mono font-bold">{f.flight_number}</p>
                  <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.aircraft_tail} {f.aircraft_type ? `(${f.aircraft_type})` : ''}</p>
                </div>
              </div>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Gate', value: f.gate || '—' },
                  { label: 'STD',  value: f.scheduled_departure || '--:--' },
                  { label: 'STA',  value: f.scheduled_arrival || '--:--' },
                  { label: 'Delay',value: f.delay_minutes > 0 ? `+${f.delay_minutes}m` : 'None', warn: f.delay_minutes > 0 },
                ].map(({ label, value, warn }) => (
                  <div key={label} className={cn('bg-background/40 rounded-lg px-3 py-2', warn && 'bg-orange-500/10')}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn('text-sm font-mono font-bold', warn ? 'text-orange-400' : 'text-foreground')}>{value}</p>
                  </div>
                ))}
              </div>
              {fc.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fc.map(c => (
                    <div key={c.id} className="flex items-center gap-2 bg-background/40 rounded-lg px-3 py-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-semibold">{c.crew_name}</span>
                      <span className="text-xs text-muted-foreground">{c.role === 'captain' ? 'CPT' : 'F/O'}</span>
                    </div>
                  ))}
                </div>
              )}
              {frel && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {frel.fuel_on_board != null && (
                    <div className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">Fuel OB</p>
                      <p className="text-sm font-mono font-bold">{frel.fuel_on_board?.toLocaleString()} lbs</p>
                    </div>
                  )}
                  {frel.alternate && (
                    <div className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">Alternate</p>
                      <p className="text-sm font-mono font-bold">{frel.alternate}</p>
                    </div>
                  )}
                  <div className="bg-background/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">Release</p>
                    <p className={cn('text-sm font-bold', frel.release_status === 'released' ? 'text-green-400' : 'text-orange-400')}>
                      {frel.release_status?.toUpperCase() || '—'}
                    </p>
                  </div>
                </div>
              )}
              <Suspense fallback={null}>
                <FlightTimesPanel flight={f} compact={true} />
              </Suspense>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PERFORMANCE ──────────────────────────────────────────────────────────
function PerformanceTab({ flights }) {
  const [perfSection, setPerfSection] = useState('takeoff');
  const AC_TYPES_PERF = ['B737-700', 'B737-800', 'B737-900', 'B737 MAX 8', 'B737 MAX 9'];
  const [acType, setAcType] = useState('B737-800');
  const [form, setForm] = useState({ oat: 15, pressure_alt: 0, weight: 155000, wind_dir: 270, wind_spd: 10, rwy_hdg: 280 });
  const [result, setResult] = useState(null);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: Number(v) || 0 }));

  const calculate = () => {
    const { oat, pressure_alt, weight, wind_dir, wind_spd, rwy_hdg } = form;
    const angle = ((wind_dir - rwy_hdg) * Math.PI) / 180;
    const hwc = Math.round(wind_spd * Math.cos(angle));
    const AC_PERF = {
      'B737-700':  { baseV1: 130, baseTOR: 5200, baseN1: 91, vmca: 108 },
      'B737-800':  { baseV1: 138, baseTOR: 6100, baseN1: 92, vmca: 112 },
      'B737-900':  { baseV1: 142, baseTOR: 6600, baseN1: 93, vmca: 114 },
      'B737 MAX 8':{ baseV1: 136, baseTOR: 5300, baseN1: 88, vmca: 110 },
      'B737 MAX 9':{ baseV1: 140, baseTOR: 5700, baseN1: 89, vmca: 112 },
    };
    const perf = AC_PERF[acType] || AC_PERF['B737-800'];
    const wtDelta = (weight - 140000) / 1000;
    const baseTOR = perf.baseTOR + wtDelta * 40 + pressure_alt * 0.35 + (oat - 15) * 18 - hwc * 35;
    const v1 = Math.round(Math.max(110, perf.baseV1 + wtDelta * 0.8 + pressure_alt / 1000 * 1.5 - hwc * 0.3));
    const vr = v1 + 4, v2 = vr + 7;
    const n1 = Math.min(100, Math.round(perf.baseN1 + (oat - 15) * 0.08 + pressure_alt / 1000 * 0.4));
    const vapp = Math.round(132 + wtDelta * 0.6);
    setResult({ tor: Math.round(baseTOR), v1, vr, v2, n1, hwc, vmca: perf.vmca, vapp });
  };

  const PERF_SECTIONS = [
    { key: 'takeoff', label: 'Takeoff' },
    { key: 'landing', label: 'Landing' },
    { key: 'runway',  label: 'Runway Analysis' },
    { key: 'wb',      label: 'Weight & Balance' },
  ];

  return (
    <div className="space-y-4">
      {/* Section sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {PERF_SECTIONS.map(s => (
          <button key={s.key} onClick={() => setPerfSection(s.key)}
            className={cn('px-4 py-2 rounded-lg text-xs font-bold border transition-all',
              perfSection === s.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {perfSection === 'takeoff' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/60">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Takeoff Performance — 737 Family</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {AC_TYPES_PERF.map(t => (
                  <button key={t} onClick={() => setAcType(t)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                      acType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                    )}>{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'OAT (°C)', key: 'oat' },
                  { label: 'Press. Alt (ft)', key: 'pressure_alt' },
                  { label: 'Gross Weight (lbs)', key: 'weight' },
                  { label: 'Wind Direction (°)', key: 'wind_dir' },
                  { label: 'Wind Speed (kt)', key: 'wind_spd' },
                  { label: 'Runway Heading (°)', key: 'rwy_hdg' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                    <input type="number" value={form[key]} onChange={e => set(key, e.target.value)}
                      className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                ))}
              </div>
              <button onClick={calculate}
                className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors">
                Compute Takeoff Performance
              </button>
            </div>
          </div>
          {result && (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/60">
                <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Computed V-Speeds & Performance</p>
              </div>
              <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  { label: 'V1',   value: `${result.v1} kt`,  color: 'text-primary' },
                  { label: 'VR',   value: `${result.vr} kt`,  color: 'text-primary' },
                  { label: 'V2',   value: `${result.v2} kt`,  color: 'text-primary' },
                  { label: 'VAPP', value: `${result.vapp} kt`,color: 'text-blue-400' },
                  { label: 'VMCA', value: `${result.vmca} kt`,color: 'text-orange-400' },
                  { label: 'N1',   value: `${result.n1}%`,    color: 'text-green-400' },
                  { label: 'HWC',  value: `${result.hwc >= 0 ? '+' : ''}${result.hwc} kt`, color: result.hwc >= 0 ? 'text-green-400' : 'text-orange-400' },
                  { label: 'TOFL', value: `${result.tor.toLocaleString()} ft`, color: result.tor > 7000 ? 'text-orange-400' : 'text-foreground' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-background/40 rounded-lg px-3 py-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={cn('text-lg font-extrabold font-mono', color)}>{value}</p>
                  </div>
                ))}
              </div>
              <p className="px-4 pb-3 text-xs text-muted-foreground">⚠ Demo only — always use approved AFM/QRH data for actual operations.</p>
            </div>
          )}
        </div>
      )}

      {perfSection === 'landing' && (
        <div className="rounded-xl bg-card border border-border p-6 text-center space-y-3">
          <Calculator className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">Landing Performance</p>
          <p className="text-xs text-muted-foreground">VREF, landing field length, brake energy limits, and autobrake settings. Full module with approved data required for line ops.</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {['VREF', 'LFL', 'VAPP'].map(v => (
              <div key={v} className="bg-secondary rounded-lg px-3 py-3 text-center">
                <p className="text-xs text-muted-foreground">{v}</p>
                <p className="text-lg font-mono font-extrabold text-muted-foreground">—</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {perfSection === 'runway' && (
        <Suspense fallback={<TabLoading />}><RunwayAnalysis flightData={flights} /></Suspense>
      )}

      {perfSection === 'wb' && (
        <Suspense fallback={<TabLoading />}><WeightBalance flightData={flights} /></Suspense>
      )}
    </div>
  );
}



// ─── BRIEFING ─────────────────────────────────────────────────────────────
function BriefingTab({ flights, releases }) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<TabLoading />}>
        <FlightReleaseSignOff />
      </Suspense>
      <Suspense fallback={<TabLoading />}>
        <NotamViewer />
      </Suspense>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Threats & Mitigations</p>
        </div>
        <div className="p-4 space-y-2">
          {[
            { threat: 'Weather deviation possible at FL350', mitigation: 'Request block altitude FL330-370', level: 'medium' },
            { threat: 'NOTAM: Taxiway B closed at destination', mitigation: 'Coordinate with ground for alternative routing', level: 'low' },
            { threat: 'Crew rest < 10h prior segment', mitigation: 'Monitor fatigue indicators, contact Crew Scheduling', level: 'high' },
          ].map((t, i) => (
            <div key={i} className={cn('rounded-lg px-3 py-2.5 border text-xs',
              t.level === 'high'   ? 'bg-red-500/10 border-red-500/20' :
              t.level === 'medium' ? 'bg-amber-500/10 border-amber-500/20' :
              'bg-green-500/10 border-green-500/20'
            )}>
              <p className="font-bold text-foreground">{t.threat}</p>
              <p className="text-muted-foreground mt-0.5">✓ {t.mitigation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHARTS ───────────────────────────────────────────────────────────────
function ChartsTab() {
  const CHART_TYPES = [
    { key: 'sid',      label: 'SID',      desc: 'Standard Instrument Departures' },
    { key: 'star',     label: 'STAR',     desc: 'Standard Terminal Arrival Routes' },
    { key: 'approach', label: 'Approach', desc: 'ILS, VOR, RNAV approach plates' },
    { key: 'taxi',     label: 'Taxi',     desc: 'Airport ground movement charts' },
    { key: 'enroute',  label: 'Enroute',  desc: 'High/low altitude enroute charts' },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
        <p className="text-xs font-bold text-amber-400">Charts Subscription Required</p>
        <p className="text-xs text-muted-foreground mt-1">Connect a Jeppesen or LIDO subscription to load navigational charts. Contact your Chief Pilot for access.</p>
      </div>
      {CHART_TYPES.map(({ key, label, desc }) => (
        <div key={key} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-3">
            <Map className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [units, setUnits] = useState('imperial');
  const [sync, setSync] = useState(true);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Units & Display</p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Units System</label>
            <div className="flex gap-2">
              {['imperial', 'metric'].map(u => (
                <button key={u} onClick={() => setUnits(u)}
                  className={cn('px-4 py-2 rounded-lg text-xs font-bold border capitalize transition-all',
                    units === u ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  )}>{u}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sync & Connectivity</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Sync</p>
              <p className="text-xs text-muted-foreground">Sync EFB data every 60 seconds</p>
            </div>
            <button onClick={() => setSync(!sync)}
              className={cn('w-10 h-6 rounded-full transition-all relative',
                sync ? 'bg-primary' : 'bg-secondary border border-border'
              )}>
              <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full transition-all', sync ? 'left-5' : 'left-1')} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">ACARS Integration</p>
              <p className="text-xs text-muted-foreground">Datalink messaging</p>
            </div>
            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
        </div>
        <div className="p-4 space-y-2">
          {['Certificate Number', 'Base', 'Fleet Type', 'EFB Version'].map(f => (
            <div key={f} className="flex justify-between items-center py-1">
              <p className="text-xs text-muted-foreground">{f}</p>
              <p className="text-xs font-mono text-muted-foreground">—</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EFB ─────────────────────────────────────────────────────────────
export default function EFB() {
  const [activeTab, setActiveTab] = useState('overview');
  const pollingInterval = useDynamicPolling(60000, 300000);

  const { data: flights = [], refetch } = useQuery({
    queryKey: ['efb-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });
  const { data: releases = [] } = useQuery({
    queryKey: ['efb-releases', TODAY],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });
  const { data: crew = [] } = useQuery({
    queryKey: ['efb-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* EFB Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">EFB</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Electronic Flight Bag</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <button onClick={refetch}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-2 py-1">
          <RefreshCw className="w-3 h-3" /> Sync
        </button>
      </div>

      {/* Body: left rail + content */}
      <div className="flex flex-1 overflow-hidden">
        <RovingTabindexList
          items={TABS}
          ariaLabel="EFB module navigation"
          role="tablist"
          className="w-44 flex-shrink-0 glass-strong border-r border-border flex flex-col py-3 overflow-y-auto scrollbar-hide"
          renderItem={({ key, label, icon: Icon }, index, { focusedIndex, handleKeyDown, getTabIndex, registerRef }) => (
            <button
              key={key}
              ref={(el) => registerRef(index, el)}
              tabIndex={getTabIndex(index)}
              onClick={() => setActiveTab(key)}
              onKeyDown={handleKeyDown}
              role="tab"
              aria-selected={activeTab === key}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-lg text-xs font-semibold transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                focusedIndex === index && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="leading-tight">{label}</span>
            </button>
          )}
        />

        <div className="flex-1 p-5 space-y-4 overflow-y-auto scrollbar-hide">
          {activeTab === 'overview'    && <OverviewTab flights={flights} releases={releases} crew={crew} />}
          {activeTab === 'weather'     && <Suspense fallback={<TabLoading />}><WeatherPanel flights={flights} /></Suspense>}
          {activeTab === 'documents'   && <Suspense fallback={<TabLoading />}><DocumentsTab /></Suspense>}
          {activeTab === 'performance' && <PerformanceTab flights={flights} />}
          {activeTab === 'briefing'    && <BriefingTab flights={flights} releases={releases} />}
          {activeTab === 'airports'    && <Suspense fallback={<TabLoading />}><AirportBriefing flights={flights} /></Suspense>}
          {activeTab === 'charts'      && <ChartsTab />}
          {activeTab === 'history'     && <Suspense fallback={<TabLoading />}><PostflightReport /></Suspense>}
          {activeTab === 'settings'    && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}