import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const RUNWAYS = {
  'KEWR': [
    { id: '4L', length: 11000, width: 150, surface: 'ASP', ils: true, hdg: 40 },
    { id: '4R', length: 9900,  width: 150, surface: 'ASP', ils: true, hdg: 40 },
    { id: '22L',length: 11000, width: 150, surface: 'ASP', ils: true, hdg: 220 },
    { id: '22R',length: 9900,  width: 150, surface: 'ASP', ils: true, hdg: 220 },
  ],
  'KORD': [
    { id: '10L', length: 13000, width: 200, surface: 'ASP', ils: true, hdg: 100 },
    { id: '10R', length: 7967,  width: 150, surface: 'ASP', ils: true, hdg: 100 },
    { id: '28L', length: 7967,  width: 150, surface: 'ASP', ils: true, hdg: 280 },
    { id: '28R', length: 13000, width: 200, surface: 'ASP', ils: true, hdg: 280 },
  ],
  'KJFK': [
    { id: '4L',  length: 8400,  width: 200, surface: 'ASP', ils: true, hdg: 40  },
    { id: '4R',  length: 11351, width: 150, surface: 'ASP', ils: true, hdg: 40  },
    { id: '13L', length: 10000, width: 150, surface: 'ASP', ils: true, hdg: 130 },
    { id: '31R', length: 10000, width: 150, surface: 'ASP', ils: true, hdg: 310 },
  ],
};

function hwcCalc(windDir, windSpd, rwyHdg) {
  const angle = ((windDir - rwyHdg) * Math.PI) / 180;
  const hwc = Math.round(windSpd * Math.cos(angle));
  const xwc = Math.abs(Math.round(windSpd * Math.sin(angle)));
  return { hwc, xwc };
}

export default function RunwayAnalysis() {
  const [airport, setAirport] = useState('KEWR');
  const [customAirport, setCustomAirport] = useState('');
  const [wind, setWind] = useState({ dir: 270, spd: 12, gust: 0 });
  const [conditions, setConditions] = useState({ oat: 15, pa: 0, surface: 'dry', braking: 'good' });
  const [tow, setTow] = useState(155000);
  const [acType, setAcType] = useState('B737-800');

  const activeAirport = customAirport || airport;
  const runways = RUNWAYS[activeAirport] || RUNWAYS['KEWR'];

  const setWd = (k, v) => setWind(prev => ({ ...prev, [k]: Number(v) || 0 }));
  const setCond = (k, v) => setConditions(prev => ({ ...prev, [k]: v }));

  const analysis = useMemo(() => runways.map(rwy => {
    const { hwc, xwc } = hwcCalc(wind.dir, wind.spd, rwy.hdg);
    const gustHwc = wind.gust ? hwcCalc(wind.dir, wind.gust, rwy.hdg).hwc : hwc;

    // Simplified TOFL/LFL
    const surfFactor = conditions.surface === 'wet' ? 1.15 : conditions.surface === 'contaminated' ? 1.35 : 1.0;
    const brakeFactor = conditions.braking === 'good' ? 1.0 : conditions.braking === 'medium' ? 1.1 : 1.25;
    const altFactor = 1 + conditions.pa / 1000 * 0.03;
    const oatFactor = 1 + Math.max(0, conditions.oat - 15) * 0.01;
    const wtFactor = 1 + (tow - 55000) / 55000 * 0.5;
    const hwcFactor = 1 - hwc * 0.003;

    const baseTOFL = 4500;
    const baseLFL  = 4000;
    const tofl = Math.round(baseTOFL * wtFactor * altFactor * oatFactor * surfFactor * hwcFactor);
    const lfl  = Math.round(baseLFL  * wtFactor * altFactor * oatFactor * surfFactor * brakeFactor * hwcFactor);

    const toMargin = rwy.length - tofl;
    const ldMargin = rwy.length - lfl;

    return { ...rwy, hwc, xwc, gustHwc, tofl, lfl, toMargin, ldMargin };
  }), [runways, wind, conditions, tow]);

  return (
    <div className="space-y-4">
      {/* Airport + conditions */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Airport & Conditions</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Airport (ICAO)</label>
              <select value={airport} onChange={e => setAirport(e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {Object.keys(RUNWAYS).map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Wind Dir (°)</label>
              <input type="number" value={wind.dir} onChange={e => setWd('dir', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Wind Speed (kt)</label>
              <input type="number" value={wind.spd} onChange={e => setWd('spd', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Gust (kt)</label>
              <input type="number" value={wind.gust} onChange={e => setWd('gust', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">OAT (°C)</label>
              <input type="number" value={conditions.oat} onChange={e => setCond('oat', Number(e.target.value))}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Press. Alt (ft)</label>
              <input type="number" value={conditions.pa} onChange={e => setCond('pa', Number(e.target.value))}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Surface</label>
              <select value={conditions.surface} onChange={e => setCond('surface', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="dry">Dry</option>
                <option value="wet">Wet</option>
                <option value="contaminated">Contaminated</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Braking Action</label>
              <select value={conditions.braking} onChange={e => setCond('braking', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="good">Good</option>
                <option value="medium">Medium</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Takeoff Weight (lbs)</label>
            <input type="number" value={tow} onChange={e => setTow(Number(e.target.value))}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Runway cards */}
      <div className="space-y-2">
        {analysis.map(rwy => {
          const toOk = rwy.toMargin >= 0;
          const ldOk = rwy.ldMargin >= 0;
          return (
            <div key={rwy.id} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-border/50 bg-secondary/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-primary">{rwy.id}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">RWY {rwy.id}</p>
                    <p className="text-xs text-muted-foreground">{rwy.length.toLocaleString()} ft · {rwy.width} ft wide · {rwy.surface}{rwy.ils ? ' · ILS' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rwy.xwc > 25 && <span className="text-xs text-orange-400 font-bold">XW {rwy.xwc}kt</span>}
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                    rwy.hwc >= 0 ? 'text-green-400 bg-green-500/15' : 'text-orange-400 bg-orange-500/15'
                  )}>
                    {rwy.hwc >= 0 ? `HW ${rwy.hwc}kt` : `TW ${Math.abs(rwy.hwc)}kt`}
                  </span>
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className={cn('rounded-lg px-3 py-2 bg-background/40', !toOk && 'bg-destructive/10 border border-destructive/30')}>
                  <p className="text-xs text-muted-foreground">TOFL Required</p>
                  <p className={cn('text-sm font-mono font-bold', toOk ? 'text-foreground' : 'text-destructive')}>{rwy.tofl.toLocaleString()} ft</p>
                  <p className={cn('text-xs font-semibold', toOk ? 'text-green-400' : 'text-destructive')}>
                    {toOk ? <><CheckCircle className="w-3 h-3 inline mr-1" />+{rwy.toMargin.toLocaleString()}</> : <><AlertTriangle className="w-3 h-3 inline mr-1" />{rwy.toMargin.toLocaleString()}</>}
                  </p>
                </div>
                <div className={cn('rounded-lg px-3 py-2 bg-background/40', !ldOk && 'bg-destructive/10 border border-destructive/30')}>
                  <p className="text-xs text-muted-foreground">LFL Required</p>
                  <p className={cn('text-sm font-mono font-bold', ldOk ? 'text-foreground' : 'text-destructive')}>{rwy.lfl.toLocaleString()} ft</p>
                  <p className={cn('text-xs font-semibold', ldOk ? 'text-green-400' : 'text-destructive')}>
                    {ldOk ? <><CheckCircle className="w-3 h-3 inline mr-1" />+{rwy.ldMargin.toLocaleString()}</> : <><AlertTriangle className="w-3 h-3 inline mr-1" />{rwy.ldMargin.toLocaleString()}</>}
                  </p>
                </div>
                <div className="rounded-lg px-3 py-2 bg-background/40">
                  <p className="text-xs text-muted-foreground">Rwy Length</p>
                  <p className="text-sm font-mono font-bold text-foreground">{rwy.length.toLocaleString()} ft</p>
                </div>
                <div className="rounded-lg px-3 py-2 bg-background/40">
                  <p className="text-xs text-muted-foreground">Heading</p>
                  <p className="text-sm font-mono font-bold text-foreground">{String(rwy.hdg).padStart(3,'0')}°</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">⚠ Demonstration values only — always use approved AFM/QRH data.</p>
    </div>
  );
}