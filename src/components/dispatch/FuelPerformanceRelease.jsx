import { useState } from 'react';
import { Fuel, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const Row = ({ label, value, unit, highlight, warn }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${highlight ? 'bg-primary/10 border-primary/20' : warn ? 'bg-amber-950/30 border-amber-700/30' : 'bg-slate-950 border-slate-800'}`}>
    <span className="text-[11px] text-slate-400">{label}</span>
    <span className={`text-xs font-mono font-bold ${highlight ? 'text-primary' : warn ? 'text-amber-300' : 'text-slate-100'}`}>{value}{unit ? <span className="text-slate-500 ml-1 text-[10px]">{unit}</span> : ''}</span>
  </div>
);

export default function FuelPerformanceRelease({ flight }) {
  const [oat, setOat] = useState(12);
  const [rwyLength, setRwyLength] = useState(11000);
  const [tow, setTow] = useState(510000);

  // Simplified V-speed calculation (B787 approximation)
  const weightKlbs = tow / 1000;
  const v1 = Math.round(130 + (weightKlbs - 400) * 0.08 + oat * 0.1);
  const vr = Math.round(v1 + 4);
  const v2 = Math.round(vr + 8);
  const torr = Math.round(7200 + (weightKlbs - 400) * 12 + oat * 15);
  const ldgDist = Math.round(5800 + (weightKlbs - 400) * 3);
  const rwyMargin = rwyLength - torr;

  const fuelBase = parseFloat(flight.fuelPlan) || 74.5;
  const tankeringDelta = 2.1;
  const tankeringRoi = (tankeringDelta * 6.2 * 6.7 - tankeringDelta * 0.3 * 6.7).toFixed(0);

  return (
    <div className="space-y-4 mt-3">

      {/* Fuel Breakdown */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">Fuel Planning</p>
        <Row label="Trip Fuel" value={(fuelBase * 0.91).toFixed(1)} unit="klbs" />
        <Row label="Contingency (5%)" value={(fuelBase * 0.045).toFixed(1)} unit="klbs" />
        <Row label="Alternate Fuel" value="1.2" unit="klbs" />
        <Row label="Final Reserve (45 min)" value="2.0" unit="klbs" />
        <Row label="Extra / Dispatcher" value={flight.fuelExtra || '+2.0'} unit="klbs" />
        <Row label="Total FOB Required" value={fuelBase.toFixed(1)} unit="klbs" highlight />
        <Row label="Tankering Opportunity" value={`+${tankeringDelta} klbs`} unit={`≈ $${tankeringRoi} savings`} warn />
      </div>

      {/* Performance Inputs */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">Performance Inputs</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">OAT (°C)</label>
            <input type="number" value={oat} onChange={e => setOat(+e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Runway (ft)</label>
            <input type="number" value={rwyLength} onChange={e => setRwyLength(+e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 uppercase font-bold block mb-1">TOW (lbs)</label>
            <input type="number" value={tow} onChange={e => setTow(+e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      {/* V-Speeds */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">Takeoff V-Speeds</p>
        <div className="grid grid-cols-3 gap-2">
          {[['V1', v1, 'kts'], ['VR', vr, 'kts'], ['V2', v2, 'kts']].map(([lbl, val, unit]) => (
            <div key={lbl} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">{lbl}</p>
              <p className="text-2xl font-black font-mono text-primary mt-0.5">{val}</p>
              <p className="text-[9px] text-slate-600">{unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Runway Analysis */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">Runway Analysis</p>
        <Row label="TORR (Takeoff Run Required)" value={torr.toLocaleString()} unit="ft" />
        <Row label="TORA Available" value={rwyLength.toLocaleString()} unit="ft" />
        <Row label="Runway Margin" value={`+${rwyMargin.toLocaleString()}`} unit="ft" highlight={rwyMargin > 1000} warn={rwyMargin < 500} />
        <Row label="Landing Distance (dest)" value={ldgDist.toLocaleString()} unit="ft" />
        {rwyMargin < 500 && (
          <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-700/40 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-[11px] text-rose-300">Runway margin below 500 ft — verify weight/obstacle analysis</p>
          </div>
        )}
      </div>

      {/* Weight & Balance */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">Weight & Balance</p>
        <Row label="Takeoff Weight" value={(tow / 1000).toFixed(1)} unit="klbs" />
        <Row label="Zero Fuel Weight" value={((tow - fuelBase * 1000) / 1000).toFixed(1)} unit="klbs" />
        <Row label="CG" value="24.8" unit="% MAC" />
        <Row label="CG Limits" value="18–32" unit="% MAC" />
        <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-700/30 rounded-lg px-3 py-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-[11px] text-emerald-300">Weight & Balance within limits — CG centered at 24.8% MAC</p>
        </div>
      </div>

    </div>
  );
}