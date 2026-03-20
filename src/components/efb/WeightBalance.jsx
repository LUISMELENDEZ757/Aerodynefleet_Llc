import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Scale } from 'lucide-react';

const AIRCRAFT_CONFIGS = {
  'CRJ-550': {
    oew: 47600, mtow: 75000, mlw: 67000, mzfw: 63500,
    fwd_limit: 14.5, aft_limit: 38.2,
    stations: [
      { id: 'fwd_cargo', label: 'Fwd Cargo', arm: 9.2, max: 2500 },
      { id: 'zone_a',    label: 'Zone A (rows 1–6)', arm: 18.4, seats: 10, pax_wt: 190 },
      { id: 'zone_b',    label: 'Zone B (rows 7–12)', arm: 24.1, seats: 10, pax_wt: 190 },
      { id: 'zone_c',    label: 'Zone C (rows 13–16)', arm: 29.8, seats: 10, pax_wt: 190 },
      { id: 'aft_cargo', label: 'Aft Cargo', arm: 37.1, max: 2500 },
    ],
    oew_arm: 22.3,
  },
  'CRJ-700': {
    oew: 49600, mtow: 75000, mlw: 67000, mzfw: 65000,
    fwd_limit: 14.0, aft_limit: 39.0,
    stations: [
      { id: 'fwd_cargo', label: 'Fwd Cargo', arm: 9.0, max: 3000 },
      { id: 'zone_a',    label: 'Zone A (rows 1–7)', arm: 18.0, seats: 14, pax_wt: 190 },
      { id: 'zone_b',    label: 'Zone B (rows 8–14)', arm: 24.5, seats: 14, pax_wt: 190 },
      { id: 'zone_c',    label: 'Zone C (rows 15–19)', arm: 31.0, seats: 14, pax_wt: 190 },
      { id: 'aft_cargo', label: 'Aft Cargo', arm: 38.5, max: 3000 },
    ],
    oew_arm: 22.8,
  },
};

export default function WeightBalance() {
  const [acType, setAcType] = useState('CRJ-550');
  const [fuel, setFuel] = useState(8000);
  const [fuelArm] = useState(23.1);
  const [loads, setLoads] = useState({});

  const cfg = AIRCRAFT_CONFIGS[acType];

  const setLoad = (id, val) => setLoads(prev => ({ ...prev, [id]: Number(val) || 0 }));

  const { zfw, tow, cg, cgZfw, status } = useMemo(() => {
    let moment = cfg.oew * cfg.oew_arm;
    let weight = cfg.oew;

    cfg.stations.forEach(st => {
      const ld = loads[st.id] || 0;
      const w = st.seats ? ld * st.pax_wt : ld;
      weight += w;
      moment += w * st.arm;
    });

    const zfw = weight;
    const cgZfw = weight > 0 ? moment / weight : cfg.oew_arm;

    const fuelWt = fuel;
    const tow = zfw + fuelWt;
    const totalMoment = moment + fuelWt * fuelArm;
    const cg = tow > 0 ? totalMoment / tow : cgZfw;

    const inLimits = cg >= cfg.fwd_limit && cg <= cfg.aft_limit && tow <= cfg.mtow && zfw <= cfg.mzfw;
    const nearLimit = !inLimits ? false : (cg < cfg.fwd_limit + 1 || cg > cfg.aft_limit - 1);

    return { zfw, tow, cg, cgZfw, status: inLimits ? (nearLimit ? 'near' : 'ok') : 'over' };
  }, [cfg, loads, fuel, fuelArm]);

  const cgPct = Math.max(0, Math.min(100, ((cg - cfg.fwd_limit) / (cfg.aft_limit - cfg.fwd_limit)) * 100));

  const statusColors = { ok: 'text-green-400', near: 'text-orange-400', over: 'text-destructive' };
  const statusLabels = { ok: 'WITHIN LIMITS', near: 'NEAR LIMIT', over: 'OUT OF LIMITS' };

  return (
    <div className="space-y-4">
      {/* Aircraft selector */}
      <div className="rounded-xl bg-card border border-border p-4">
        <label className="text-xs text-muted-foreground block mb-2">Aircraft Type</label>
        <div className="flex gap-2">
          {Object.keys(AIRCRAFT_CONFIGS).map(t => (
            <button key={t} onClick={() => { setAcType(t); setLoads({}); }}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                acType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              )}>{t}</button>
          ))}
        </div>
      </div>

      {/* Load entry */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Load Planning</p>
        </div>
        <div className="p-4 space-y-3">
          {cfg.stations.map(st => (
            <div key={st.id} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{st.label}</p>
                <p className="text-xs text-muted-foreground">ARM {st.arm} ft · {st.seats ? `max ${st.seats} pax` : `max ${st.max?.toLocaleString()} lbs`}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0} max={st.seats || st.max}
                  value={loads[st.id] || ''}
                  onChange={e => setLoad(st.id, e.target.value)}
                  placeholder={st.seats ? '0 pax' : '0 lbs'}
                  className="w-24 h-8 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground w-10">{st.seats ? 'pax' : 'lbs'}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Fuel On Board</p>
              <p className="text-xs text-muted-foreground">ARM {fuelArm} ft</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0}
                value={fuel}
                onChange={e => setFuel(Number(e.target.value) || 0)}
                className="w-24 h-8 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground w-10">lbs</span>
            </div>
          </div>
        </div>
      </div>

      {/* CG envelope */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">CG Envelope</p>
          <div className={cn('flex items-center gap-1.5 text-xs font-bold', statusColors[status])}>
            {status === 'ok' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {statusLabels[status]}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* CG Bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>FWD {cfg.fwd_limit} ft</span>
              <span>AFT {cfg.aft_limit} ft</span>
            </div>
            <div className="relative h-6 bg-secondary rounded-full overflow-hidden">
              <div className="absolute inset-0 mx-6 bg-green-500/20 rounded-full" />
              <div
                className={cn('absolute top-1 w-4 h-4 rounded-full border-2 border-background transition-all',
                  status === 'ok' ? 'bg-green-400' : status === 'near' ? 'bg-orange-400' : 'bg-destructive'
                )}
                style={{ left: `calc(${cgPct}% - 8px)` }}
              />
            </div>
          </div>

          {/* Weight summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'OEW', value: `${cfg.oew.toLocaleString()} lbs`, sub: 'Operating Empty' },
              { label: 'ZFW', value: `${Math.round(zfw).toLocaleString()} lbs`, sub: `Limit ${cfg.mzfw.toLocaleString()}`, warn: zfw > cfg.mzfw },
              { label: 'TOW', value: `${Math.round(tow).toLocaleString()} lbs`, sub: `Limit ${cfg.mtow.toLocaleString()}`, warn: tow > cfg.mtow },
              { label: 'CG (T/O)', value: `${cg.toFixed(2)} ft`, sub: `ZFW CG ${cgZfw.toFixed(2)} ft` },
            ].map(({ label, value, sub, warn }) => (
              <div key={label} className={cn('rounded-lg px-3 py-2 bg-background/40', warn && 'bg-destructive/10 border border-destructive/30')}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-sm font-mono font-bold', warn ? 'text-destructive' : 'text-foreground')}>{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}