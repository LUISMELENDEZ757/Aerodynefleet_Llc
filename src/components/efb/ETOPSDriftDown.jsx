import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Navigation, AlertTriangle, Wind, Fuel, Clock, MapPin,
  TrendingDown, ArrowRight, CheckCircle, Info
} from 'lucide-react';

// ETOPS alternate airports with distances from common routes
const ETOPS_ALTERNATES = [
  { icao: 'KBGR', name: 'Bangor Intl',      lat: 44.8, lon: -68.8,  cat: 'ETOPS-120', minRVR: '2400', fuel: 'JET-A' },
  { icao: 'CYYT', name: 'St. Johns NL',      lat: 47.6, lon: -52.7,  cat: 'ETOPS-180', minRVR: '2400', fuel: 'JET-A' },
  { icao: 'LPAZ', name: 'Santa Maria',       lat: 36.9, lon: -25.2,  cat: 'ETOPS-180', minRVR: '2400', fuel: 'JET-A' },
  { icao: 'BIKF', name: 'Keflavik Iceland',  lat: 63.9, lon: -22.6,  cat: 'ETOPS-180', minRVR: '2400', fuel: 'JET-A' },
  { icao: 'PHNL', name: 'Honolulu HNL',      lat: 21.3, lon: -157.9, cat: 'ETOPS-180', minRVR: '1800', fuel: 'JET-A' },
  { icao: 'PHKO', name: 'Kona KOA',          lat: 19.7, lon: -156.0, cat: 'ETOPS-120', minRVR: '2400', fuel: 'JET-A' },
  { icao: 'PGUM', name: 'Guam GUM',          lat: 13.5, lon: 144.8,  cat: 'ETOPS-180', minRVR: '1800', fuel: 'JET-A' },
  { icao: 'KSFO', name: 'San Francisco',     lat: 37.6, lon: -122.4, cat: 'ETOPS-120', minRVR: '1800', fuel: 'JET-A' },
];

// 737 drift-down performance (engine-out, simplified)
const DRIFTDOWN_DATA = {
  'B737-700':  { cruiseAlt: 41000, driftdownAlt: 17000, driftdownRate: 280, engOutSpeed: 280, maxGw: 154500 },
  'B737-800':  { cruiseAlt: 41000, driftdownAlt: 14000, driftdownRate: 290, engOutSpeed: 276, maxGw: 174200 },
  'B737-900':  { cruiseAlt: 41000, driftdownAlt: 12000, driftdownRate: 295, engOutSpeed: 272, maxGw: 187700 },
  'B737 MAX 8':{ cruiseAlt: 41000, driftdownAlt: 17000, driftdownRate: 285, engOutSpeed: 280, maxGw: 182200 },
  'B737 MAX 9':{ cruiseAlt: 41000, driftdownAlt: 15000, driftdownRate: 290, engOutSpeed: 278, maxGw: 194700 },
};

function calcETP(distNM, groundSpeed, fuelFlowOEI, fuelOnBoard) {
  // Equal Time Point: time from origin = total_time / 2 (simplified, no wind)
  const totalTime = distNM / groundSpeed; // hours
  const etpDist = distNM / 2;
  const fuelToETP = (etpDist / groundSpeed) * fuelFlowOEI;
  const fuelFromETP = ((distNM - etpDist) / groundSpeed) * fuelFlowOEI;
  const contingency = fuelOnBoard * 0.05;
  return { etpDist, totalTime, fuelToETP, fuelFromETP, contingency, feasible: fuelToETP < fuelOnBoard * 0.45 };
}

function calcDriftdown(acType, currentAlt, weight) {
  const data = DRIFTDOWN_DATA[acType] || DRIFTDOWN_DATA['B737-800'];
  const weightFactor = Math.max(0.85, 1 - (weight - 140000) / 200000);
  const adjAlt = Math.round(data.driftdownAlt * weightFactor);
  const timeToLevelOff = Math.round((currentAlt - adjAlt) / data.driftdownRate);
  const distDuringDD = Math.round((timeToLevelOff / 60) * data.engOutSpeed);
  return { ...data, adjAlt, timeToLevelOff, distDuringDD };
}

export default function ETOPSDriftDown() {
  const [acType, setAcType] = useState('B737-800');
  const [inputs, setInputs] = useState({
    distNM: 3400,
    groundSpeed: 450,
    fuelOnBoard: 38000,
    fuelFlowOEI: 4800,
    currentAlt: 39000,
    weight: 162000,
    route: 'KEWR → EGLL',
  });
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('etops');

  const set = (k, v) => setInputs(prev => ({ ...prev, [k]: isNaN(Number(v)) ? v : Number(v) }));

  const compute = () => {
    const etp = calcETP(inputs.distNM, inputs.groundSpeed, inputs.fuelFlowOEI, inputs.fuelOnBoard);
    const dd  = calcDriftdown(acType, inputs.currentAlt, inputs.weight);
    setResult({ etp, dd });
  };

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {[
          { key: 'etops',    label: 'ETOPS Alternates' },
          { key: 'etp',      label: 'Equal Time Point' },
          { key: 'driftdown',label: 'Drift-Down / Escape' },
          { key: 'engout',   label: 'Engine-Out Perf' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 text-xs font-semibold py-2 rounded-lg transition-all',
              activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >{label}</button>
        ))}
      </div>

      {/* Aircraft type selector */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(DRIFTDOWN_DATA).map(t => (
          <button
            key={t}
            onClick={() => setAcType(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
              acType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >{t}</button>
        ))}
      </div>

      {/* ETOPS Alternates */}
      {activeTab === 'etops' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-400 font-semibold">
              {acType.includes('MAX') ? 'B737 MAX — ETOPS 180 certified (LEAP-1B)' : 'B737 NG — ETOPS 120 certified (CFM56-7B)'}
            </p>
          </div>
          <div className="space-y-2">
            {ETOPS_ALTERNATES.filter(a => acType.includes('MAX') || a.cat === 'ETOPS-120').map(alt => (
              <div key={alt.icao} className="rounded-xl bg-card border border-border px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-mono font-bold text-foreground">{alt.icao}</p>
                    <p className="text-xs text-muted-foreground">{alt.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full">{alt.cat}</span>
                  <span className="text-xs text-muted-foreground font-mono">RVR {alt.minRVR}</span>
                  <span className="text-xs text-muted-foreground">{alt.fuel}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠ ETOPS alternates must have current WX at or above minima at ETP ±15 min. Verify via dispatch release.
          </p>
        </div>
      )}

      {/* Equal Time Point */}
      {activeTab === 'etp' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/60">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">ETP Calculator</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Route',            key: 'route',       type: 'text'   },
                  { label: 'Total Distance (NM)', key: 'distNM',   type: 'number' },
                  { label: 'Ground Speed (kt)', key: 'groundSpeed', type: 'number' },
                  { label: 'Fuel on Board (lbs)', key: 'fuelOnBoard', type: 'number' },
                  { label: 'OEI Fuel Flow (lbs/hr)', key: 'fuelFlowOEI', type: 'number' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                    <input type={type} value={inputs[key]} onChange={e => set(key, e.target.value)}
                      className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                ))}
              </div>
              <button onClick={compute}
                className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors">
                Calculate ETP
              </button>
            </div>
          </div>

          {result?.etp && (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/60">
                <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Equal Time Point Results</p>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'ETP Distance', value: `${Math.round(result.etp.etpDist)} NM`, color: 'text-primary' },
                  { label: 'Total FT', value: `${(result.etp.totalTime * 60).toFixed(0)} min`, color: 'text-foreground' },
                  { label: 'Fuel to ETP', value: `${Math.round(result.etp.fuelToETP).toLocaleString()} lbs`, color: 'text-orange-400' },
                  { label: 'Fuel from ETP', value: `${Math.round(result.etp.fuelFromETP).toLocaleString()} lbs`, color: 'text-orange-400' },
                  { label: 'Contingency (5%)', value: `${Math.round(result.etp.contingency).toLocaleString()} lbs`, color: 'text-blue-400' },
                  { label: 'Feasible', value: result.etp.feasible ? 'YES' : 'REVIEW', color: result.etp.feasible ? 'text-green-400' : 'text-destructive' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-background/40 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={cn('text-base font-extrabold font-mono', color)}>{value}</p>
                  </div>
                ))}
              </div>
              <p className="px-4 pb-3 text-xs text-muted-foreground">
                ⚠ Simplified ETP (no wind). Use OFP-computed ETP for actual operations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Drift-Down */}
      {activeTab === 'driftdown' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/60">
              <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Drift-Down Escape Route</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Current Cruise Alt (ft)</label>
                  <input type="number" value={inputs.currentAlt} onChange={e => set('currentAlt', e.target.value)}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Gross Weight (lbs)</label>
                  <input type="number" value={inputs.weight} onChange={e => set('weight', e.target.value)}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <button onClick={compute}
                className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors">
                Compute Drift-Down Profile
              </button>
            </div>
          </div>

          {result?.dd && (
            <div className="space-y-2">
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/60">
                  <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{acType} — Engine Failure Drift-Down Profile</p>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Current Alt',      value: `FL${(inputs.currentAlt/100).toFixed(0)}`,     color: 'text-foreground' },
                    { label: 'Level-Off Alt',     value: `FL${(result.dd.adjAlt/100).toFixed(0)}`,      color: 'text-primary' },
                    { label: 'Time to Level-Off', value: `~${result.dd.timeToLevelOff} min`,            color: 'text-orange-400' },
                    { label: 'Dist During DD',    value: `~${result.dd.distDuringDD} NM`,               color: 'text-orange-400' },
                    { label: 'OEI Speed',         value: `${result.dd.engOutSpeed} KIAS`,               color: 'text-blue-400' },
                    { label: 'DD Rate',           value: `~${result.dd.driftdownRate} fpm`,             color: 'text-muted-foreground' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-background/40 rounded-lg px-3 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={cn('text-base font-extrabold font-mono', color)}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual profile */}
              <div className="rounded-xl bg-card border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Escape Route Profile</p>
                <div className="relative h-20 bg-background/40 rounded-lg overflow-hidden">
                  {/* Sky gradient */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' }} />
                  {/* Cruise level line */}
                  <div className="absolute left-0 right-0 border-t-2 border-dashed border-green-400/60" style={{ top: '10%' }}>
                    <span className="absolute right-2 -top-4 text-xs font-mono text-green-400">FL{(inputs.currentAlt/100).toFixed(0)}</span>
                  </div>
                  {/* Level-off line */}
                  <div className="absolute left-0 right-0 border-t-2 border-dashed border-primary/60" style={{ top: '70%' }}>
                    <span className="absolute right-2 -top-4 text-xs font-mono text-primary">FL{(result.dd.adjAlt/100).toFixed(0)}</span>
                  </div>
                  {/* Drift-down path */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <path d="M 10,8 Q 60,8 80,8 L 130,56 L 200,56" stroke="#fbbf24" strokeWidth="2" fill="none" />
                    <circle cx="80" cy="8" r="3" fill="#ef4444" />
                    <text x="75" y="5" fontSize="5" fill="#ef4444" fontFamily="monospace">ENG FAIL</text>
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Red dot = engine failure point · Yellow = drift-down path · Cross at level-off altitude</p>
              </div>

              <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-400 font-semibold">
                  Declare emergency, contact ATC, request block altitude. MEA on escape route must be at or below level-off altitude.
                  ⚠ Simplified model — verify against QRH 2.31 (737 AFM Chapter 10).
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engine-Out Performance */}
      {activeTab === 'engout' && (
        <div className="space-y-3">
          {[
            {
              title: 'Immediate Actions (Memory Items)',
              color: 'destructive',
              items: [
                'Thrust lever — set to max (firewall if necessary)',
                'Identify failed engine — confirm with ITT/N1/N2',
                'Autothrottle — DISC (if applicable)',
                'Checklist — Engine Failure / Shutdown (QRH)',
              ],
            },
            {
              title: 'Fuel Redispatch Logic',
              color: 'orange',
              items: [
                'OEI fuel burn: ~30% higher than normal cruise',
                `${acType} OEI cruise: ~FL${(DRIFTDOWN_DATA[acType]?.driftdownAlt/100).toFixed(0)} at ${DRIFTDOWN_DATA[acType]?.engOutSpeed} KIAS`,
                'Contact dispatcher — redispatch to nearest suitable alternate',
                'ETOPS fuel: verify contingency for divert + 45 min holding',
                'If fuel critical: MAYDAY, priority handling, direct routing',
              ],
            },
            {
              title: 'ATC / Communication',
              color: 'blue',
              items: [
                'Declare MAYDAY or PAN-PAN to ATC',
                'Request lower altitude block (drift-down level-off)',
                'Request direct routing to alternate/destination',
                'Squawk 7700 — verify transponder mode C altitude',
                'Notify company ops / dispatch via ACARS or HF',
              ],
            },
            {
              title: `${acType} Specific Notes`,
              color: 'primary',
              items: acType.includes('MAX') ? [
                'LEAP-1B: superior OEI performance vs CFM56',
                'MCAS: disabled with airspeed disagree — verify AoA sensors',
                'APU start available to FL410 — start early for bleed air',
                'ETOPS 180 rated — wider alternate options',
              ] : [
                'CFM56-7B: engine windmilling provides hydraulic backup',
                'Engine 2 failure: normal hydraulic system A remains powered',
                'Engine 1 failure: hydraulic system B and standby available',
                'ETOPS 120 rated — coordinate alternates within 120 min',
              ],
            },
          ].map(({ title, color, items }) => (
            <div key={title} className={cn('rounded-xl bg-card border overflow-hidden',
              color === 'destructive' ? 'border-destructive/30' :
              color === 'orange' ? 'border-orange-500/30' :
              color === 'blue' ? 'border-blue-500/30' : 'border-border'
            )}>
              <div className={cn('px-4 py-2.5 border-b',
                color === 'destructive' ? 'border-destructive/30 bg-destructive/10' :
                color === 'orange' ? 'border-orange-500/30 bg-orange-500/10' :
                color === 'blue' ? 'border-blue-500/30 bg-blue-500/10' : 'border-border bg-secondary/60'
              )}>
                <p className={cn('text-xs font-mono font-bold uppercase tracking-wider',
                  color === 'destructive' ? 'text-destructive' :
                  color === 'orange' ? 'text-orange-400' :
                  color === 'blue' ? 'text-blue-400' : 'text-primary'
                )}>{title}</p>
              </div>
              <div className="p-3 space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className={cn('w-3 h-3 flex-shrink-0 mt-0.5',
                      color === 'destructive' ? 'text-destructive' :
                      color === 'orange' ? 'text-orange-400' :
                      color === 'blue' ? 'text-blue-400' : 'text-primary'
                    )} />
                    <p className="text-xs text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">⚠ Reference only — always follow published QRH procedures and AFM limitations.</p>
        </div>
      )}
    </div>
  );
}