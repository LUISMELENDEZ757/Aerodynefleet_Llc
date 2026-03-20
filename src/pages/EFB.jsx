import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, Cloud, Calculator, ClipboardList, FileText,
  RefreshCw, Scale, Fuel, Map, Radio, AlertTriangle,
  Users, Send, Plane
} from 'lucide-react';
import { cn } from '@/lib/utils';

// EFB module components
import WeightBalance    from '@/components/efb/WeightBalance';
import FuelPlanning     from '@/components/efb/FuelPlanning';
import RunwayAnalysis   from '@/components/efb/RunwayAnalysis';
import CrewLegality     from '@/components/efb/CrewLegality';
import NotamViewer      from '@/components/efb/NotamViewer';
import AcarsMessaging   from '@/components/efb/AcarsMessaging';
import PostflightReport from '@/components/efb/PostflightReport';
import WeatherPanel     from '@/components/flightops/WeatherPanel';

const TODAY = new Date().toISOString().split('T')[0];

const TABS = [
  { key: 'brief',       label: 'Flight Brief',    icon: BookOpen },
  { key: 'wb',          label: 'W&B',             icon: Scale },
  { key: 'perf',        label: 'Performance',     icon: Calculator },
  { key: 'fuel',        label: 'Fuel',            icon: Fuel },
  { key: 'runway',      label: 'Runway',          icon: Map },
  { key: 'wx',          label: 'WX',              icon: Cloud },
  { key: 'notams',      label: 'NOTAMs',          icon: AlertTriangle },
  { key: 'crew',        label: 'Crew / FAR 117',  icon: Users },
  { key: 'acars',       label: 'ACARS',           icon: Radio },
  { key: 'postflight',  label: 'Postflight',      icon: Send },
];

// ─── PERFORMANCE CALCULATOR ──────────────────────────────────────────────────
function PerformanceCalc() {
  const [form, setForm] = useState({
    oat: 15, pressure_alt: 0, weight: 60000,
    wind_dir: 270, wind_spd: 10, rwy_hdg: 280,
  });
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: Number(v) || 0 }));

  const calculate = () => {
    const { oat, pressure_alt, weight, wind_dir, wind_spd, rwy_hdg } = form;
    const angle = ((wind_dir - rwy_hdg) * Math.PI) / 180;
    const hwc = Math.round(wind_spd * Math.cos(angle));

    const baseTOR = 4500 + (weight - 55000) * 0.05 + pressure_alt * 0.3 + (oat - 15) * 15 - hwc * 30;
    const v1 = Math.round(Math.max(100, 115 + (weight - 55000) / 1000 * 2 + pressure_alt / 1000 - hwc * 0.3));
    const vr = v1 + 4;
    const v2 = vr + 6;
    const n1 = Math.min(100, Math.round(93 + (oat - 15) * 0.1 + pressure_alt / 1000 * 0.5));
    const vmca = 90;
    const vapp = v2 + 10;

    setResult({ tor: Math.round(baseTOR), v1, vr, v2, n1, hwc, vmca, vapp });
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
  );
}

// ─── FLIGHT BRIEF ─────────────────────────────────────────────────────────
function FlightBrief({ flights, releases, crew }) {
  if (flights.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No flights loaded for today
      </div>
    );
  }

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
    <div className="space-y-3">
      {flights.map(f => {
        const rel = releases.find(r => r.flight_number === f.flight_number);
        const fc = crew.filter(c => c.flight_number === f.flight_number && (c.role === 'captain' || c.role === 'first_officer'));
        const cfg = STATUS_COLORS[f.status] || STATUS_COLORS.scheduled;

        return (
          <div key={f.id} className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 bg-secondary/40 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <Plane className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{f.flight_number}</p>
                  <p className="text-xs text-muted-foreground">{f.origin} → {f.destination} · {f.aircraft_tail} {f.aircraft_type ? `(${f.aircraft_type})` : ''}</p>
                </div>
              </div>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Gate', value: f.gate || '—' },
                  { label: 'STD', value: f.scheduled_departure || '--:--' },
                  { label: 'STA', value: f.scheduled_arrival || '--:--' },
                  { label: 'Delay', value: f.delay_minutes > 0 ? `+${f.delay_minutes} min` : 'None', warn: f.delay_minutes > 0 },
                ].map(({ label, value, warn }) => (
                  <div key={label} className={cn('bg-background/40 rounded-lg px-3 py-2', warn && 'bg-orange-500/10')}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn('text-sm font-mono font-bold', warn ? 'text-orange-400' : 'text-foreground')}>{value}</p>
                  </div>
                ))}
              </div>

              {fc.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Flight Crew</p>
                  <div className="flex flex-wrap gap-2">
                    {fc.map(c => (
                      <div key={c.id} className="flex items-center gap-2 bg-background/40 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-semibold text-foreground">{c.crew_name}</span>
                        <span className="text-xs text-muted-foreground">{c.role === 'captain' ? 'CPT' : 'F/O'}</span>
                        <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full',
                          c.legal_status === 'legal' ? 'text-green-400 bg-green-500/15' :
                          c.legal_status === 'near_limit' ? 'text-orange-400 bg-orange-500/15' :
                          'text-destructive bg-destructive/15'
                        )}>
                          {c.legal_status === 'legal' ? '✓ Legal' : c.legal_status === 'near_limit' ? 'Near' : 'ILLEGAL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rel && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Dispatch Release
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        <p className="text-xs text-muted-foreground">Min Req</p>
                        <p className="text-sm font-mono font-bold text-foreground">{rel.min_fuel_required.toLocaleString()} lbs</p>
                      </div>
                    )}
                    {rel.alternate && (
                      <div className="bg-background/40 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">Alternate</p>
                        <p className="text-sm font-mono font-bold text-foreground">{rel.alternate}</p>
                      </div>
                    )}
                  </div>
                  {rel.notams && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">NOTAMs (Release)</p>
                      <p className="text-xs font-mono text-foreground bg-background/40 rounded-lg px-3 py-2 whitespace-pre-wrap">{rel.notams}</p>
                    </div>
                  )}
                  {rel.remarks && (
                    <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2 mt-2">{rel.remarks}</p>
                  )}
                </div>
              )}

              {f.notes && (
                <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2">{f.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN EFB ─────────────────────────────────────────────────────────────
export default function EFB() {
  const [activeTab, setActiveTab] = useState('brief');

  const { data: flights = [], refetch } = useQuery({
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

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">EFB</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Electronic Flight Bag · Enterprise Suite</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <button onClick={refetch}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" /> Sync data
        </button>
      </div>

      {/* Horizontal scroll tab bar */}
      <div className="border-b border-border bg-card">
        <div className="flex gap-0.5 px-4 overflow-x-auto py-2 scrollbar-none">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0',
                activeTab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'brief'      && <FlightBrief flights={flights} releases={releases} crew={crew} />}
        {activeTab === 'wb'         && <WeightBalance />}
        {activeTab === 'perf'       && <PerformanceCalc />}
        {activeTab === 'fuel'       && <FuelPlanning />}
        {activeTab === 'runway'     && <RunwayAnalysis />}
        {activeTab === 'wx'         && <WeatherPanel flights={flights} />}
        {activeTab === 'notams'     && <NotamViewer />}
        {activeTab === 'crew'       && <CrewLegality />}
        {activeTab === 'acars'      && <AcarsMessaging />}
        {activeTab === 'postflight' && <PostflightReport />}
      </div>
    </div>
  );
}