import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Fuel, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

const BURN_RATES = {
  'B737-700':  { climb: 5800,  cruise: 4600,  descent: 2200, ff_unit: 'lbs/hr' },
  'B737-800':  { climb: 6400,  cruise: 5200,  descent: 2500, ff_unit: 'lbs/hr' },
  'B737-900':  { climb: 6900,  cruise: 5600,  descent: 2700, ff_unit: 'lbs/hr' },
  'B737 MAX 8':{ climb: 5900,  cruise: 4750,  descent: 2300, ff_unit: 'lbs/hr' },
  'B737 MAX 9':{ climb: 6200,  cruise: 5050,  descent: 2450, ff_unit: 'lbs/hr' },
};

export default function FuelPlanning() {
  const [acType, setAcType] = useState('B737-800');
  const [form, setForm] = useState({
    block_fuel: 35000,
    taxi_out: 800,
    taxi_in: 400,
    trip_fuel: 22000,
    contingency_pct: 5,
    alternate_fuel: 4500,
    final_reserve: 3200,
    extra: 0,
    flight_time: 240,
    alternate_time: 45,
    cruise_alt: 37000,
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: Number(v) || 0 }));
  const rates = BURN_RATES[acType] || BURN_RATES['B737-800'];

  const calc = useMemo(() => {
    const contingency = Math.round(form.trip_fuel * (form.contingency_pct / 100));
    const min_required = form.trip_fuel + contingency + form.alternate_fuel + form.final_reserve;
    const usable = form.block_fuel - form.taxi_out;
    const extra = usable - min_required;
    const endurance_min = Math.round((usable / rates.cruise) * 60);

    // Burn breakdown
    const climb_time = 25;
    const descent_time = 20;
    const cruise_time = Math.max(0, form.flight_time - climb_time - descent_time);
    const climb_burn = Math.round((climb_time / 60) * rates.climb);
    const cruise_burn = Math.round((cruise_time / 60) * rates.cruise);
    const descent_burn = Math.round((descent_time / 60) * rates.descent);
    const est_trip = climb_burn + cruise_burn + descent_burn;

    return { contingency, min_required, usable, extra, endurance_min, est_trip, climb_burn, cruise_burn, descent_burn };
  }, [form, rates]);

  const status = calc.extra >= 0 ? (calc.extra < 500 ? 'near' : 'ok') : 'over';
  const statusColor = { ok: 'text-green-400', near: 'text-orange-400', over: 'text-destructive' };
  const statusLabel = { ok: 'FUEL SUFFICIENT', near: 'LOW MARGIN', over: 'FUEL INSUFFICIENT' };

  return (
    <div className="space-y-4">
      {/* Aircraft */}
      <div className="rounded-xl bg-card border border-border p-4">
        <label className="text-xs text-muted-foreground block mb-2">Aircraft Type</label>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(BURN_RATES).map(t => (
            <button key={t} onClick={() => setAcType(t)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                acType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
              )}>{t}</button>
          ))}
        </div>
      </div>

      {/* Fuel inputs */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Fuel Breakdown (lbs)</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Block Fuel', key: 'block_fuel' },
            { label: 'Taxi Out', key: 'taxi_out' },
            { label: 'Taxi In', key: 'taxi_in' },
            { label: 'Trip Fuel', key: 'trip_fuel' },
            { label: 'Contingency %', key: 'contingency_pct' },
            { label: 'Alternate Fuel', key: 'alternate_fuel' },
            { label: 'Final Reserve', key: 'final_reserve' },
            { label: 'Extra Fuel', key: 'extra' },
            { label: 'Flight Time (min)', key: 'flight_time' },
            { label: 'Alternate Time (min)', key: 'alternate_time' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground block mb-1">{label}</label>
              <input
                type="number" value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Fuel Summary</p>
          <div className={cn('flex items-center gap-1.5 text-xs font-bold', statusColor[status])}>
            {status === 'ok' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {statusLabel[status]}
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Min Required', value: `${calc.min_required.toLocaleString()} lbs`, warn: false },
              { label: 'Usable (ramp)', value: `${calc.usable.toLocaleString()} lbs`, warn: false },
              { label: 'Extra / Margin', value: `${calc.extra >= 0 ? '+' : ''}${calc.extra.toLocaleString()} lbs`, warn: calc.extra < 0 },
              { label: 'Contingency', value: `${calc.contingency.toLocaleString()} lbs`, warn: false },
              { label: 'Endurance', value: `${Math.floor(calc.endurance_min / 60)}h ${calc.endurance_min % 60}m`, warn: false },
              { label: 'FF Rate', value: `${rates.cruise.toLocaleString()} lbs/hr`, warn: false },
            ].map(({ label, value, warn }) => (
              <div key={label} className={cn('rounded-lg px-3 py-2 bg-background/40', warn && 'bg-destructive/10 border border-destructive/30')}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-sm font-mono font-bold', warn ? 'text-destructive' : 'text-foreground')}>{value}</p>
              </div>
            ))}
          </div>

          {/* Burn breakdown */}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Estimated Burn Profile
            </p>
            <div className="space-y-2">
              {[
                { label: 'Climb (25 min)', burn: calc.climb_burn, total: calc.est_trip },
                { label: 'Cruise', burn: calc.cruise_burn, total: calc.est_trip },
                { label: 'Descent (20 min)', burn: calc.descent_burn, total: calc.est_trip },
              ].map(({ label, burn, total }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32">{label}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(burn / total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-foreground w-20 text-right">{burn.toLocaleString()} lbs</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs font-semibold text-foreground">Est. Trip Fuel</span>
                <span className="text-sm font-mono font-bold text-primary">{calc.est_trip.toLocaleString()} lbs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}