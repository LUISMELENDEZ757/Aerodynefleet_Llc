import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, RefreshCw, Zap, AlertTriangle, CheckCircle } from "lucide-react";

const Pill = ({ label, tone = "default" }) => {
  const toneClasses = {
    default: "bg-slate-800 text-slate-200",
    good: "bg-emerald-900/60 text-emerald-100",
    warn: "bg-amber-900/60 text-amber-100",
    bad: "bg-rose-900/60 text-rose-100",
    info: "bg-sky-900/60 text-sky-100",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClasses}`}>
      {label}
    </span>
  );
};

export default function ReplanningWorkflow({ flight, onClose }) {
  const [cruiseAlt, setCruiseAlt] = useState(flight.cruiseAlt || 35000);
  const [newAlternate, setNewAlternate] = useState(flight.alternate || "");
  const [showRecalc, setShowRecalc] = useState(false);

  // Simulated fuel recalculation based on altitude
  const calculateFuel = useMemo(() => {
    const baseFuel = flight.fuelPlan || 74500;
    const altDelta = cruiseAlt - (flight.cruiseAlt || 35000);
    
    // Every 1000 ft increase saves ~1% fuel in cruise (simplified model)
    const fuelSavings = Math.max(0, (altDelta / 1000) * baseFuel * 0.01);
    const newFuelPlan = Math.round(baseFuel - fuelSavings);
    const newTripFuel = Math.round(68000 - (fuelSavings * 0.92));
    
    return {
      original: baseFuel,
      revised: newFuelPlan,
      delta: Math.round(fuelSavings),
      tripFuelRevised: newTripFuel,
      tripFuelOriginal: flight.fuelBreakdown?.Trip || 68000,
    };
  }, [cruiseAlt, flight]);

  // ETOPS impact calculation
  const etopsImpact = useMemo(() => {
    const baseEtops = parseInt(flight.etops) || 330;
    const altDelta = cruiseAlt - (flight.cruiseAlt || 35000);
    
    // Higher altitude = longer diversion time (worse ETOPS performance)
    const etopsReduction = Math.max(0, (altDelta / 2000) * 10);
    const revisedEtops = Math.max(120, baseEtops - etopsReduction);
    
    return {
      original: baseEtops,
      revised: Math.round(revisedEtops),
      impact: Math.round(baseEtops - revisedEtops),
      altitudeConstraint: cruiseAlt > 37000 ? "FL370+ may reduce ETOPS due to engine performance" : null,
    };
  }, [cruiseAlt, flight]);

  const handleRecalculate = () => {
    setShowRecalc(true);
  };

  const handleApplyReplan = () => {
    // In a real app, this would trigger a backend recalc and update the dispatch release
    console.log("Apply replan:", {
      cruiseAlt,
      newAlternate,
      revisedFuel: calculateFuel.revised,
      revisedEtops: etopsImpact.revised,
    });
    onClose();
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Altitude Adjustment */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Cruise Altitude</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="range"
              min="25000"
              max="43000"
              step="500"
              value={cruiseAlt}
              onChange={(e) => setCruiseAlt(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>FL250</span>
              <span>FL430</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black font-mono text-primary">FL{Math.round(cruiseAlt / 100)}</p>
            <p className="text-[9px] text-slate-400">
              {cruiseAlt > (flight.cruiseAlt || 35000) ? "↑ Higher" : cruiseAlt < (flight.cruiseAlt || 35000) ? "↓ Lower" : "Current"}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          Current: FL{Math.round((flight.cruiseAlt || 35000) / 100)}
        </p>
      </div>

      {/* Alternate Selection */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">ETOPS Alternate</p>
        <select
          value={newAlternate}
          onChange={(e) => setNewAlternate(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select alternate...</option>
          <option value="DUB">DUB — Dublin (nearest)</option>
          <option value="SNN">SNN — Shannon</option>
          <option value="ORK">ORK — Cork</option>
          <option value="KEK">KEK — Keflavik</option>
        </select>
        <p className="text-[10px] text-slate-400 mt-2">Current: {flight.alternate || "—"}</p>
      </div>

      {/* Recalculate Button */}
      <button
        onClick={handleRecalculate}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
      >
        <RefreshCw className="w-4 h-4" /> Recalculate Impact
      </button>

      {showRecalc && (
        <>
          {/* Fuel Impact */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Fuel Recalculation</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2.5">
                <span className="text-[11px] text-slate-400">FOB (Original)</span>
                <span className="text-sm font-mono font-bold text-slate-200">{calculateFuel.original.toLocaleString()} lbs</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2.5">
                <span className="text-[11px] text-slate-400">FOB (Revised)</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{calculateFuel.revised.toLocaleString()} lbs</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2.5 border border-emerald-500/30">
                <span className="text-[11px] text-emerald-400 font-semibold">Fuel Saved</span>
                <span className="text-sm font-mono font-bold text-emerald-300">−{calculateFuel.delta.toLocaleString()} lbs</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Trip fuel (original): {calculateFuel.tripFuelOriginal.toLocaleString()} lbs → (revised): {calculateFuel.tripFuelRevised.toLocaleString()} lbs</p>
            </div>
          </div>

          {/* ETOPS Impact */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">ETOPS Impact</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Original Certification</span>
                <Pill label={`ETOPS-${etopsImpact.original}`} tone="good" />
              </div>
              <div className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2.5">
                <span className="text-[11px] text-slate-400">Revised Certification</span>
                <Pill
                  label={`ETOPS-${etopsImpact.revised}`}
                  tone={etopsImpact.impact > 20 ? "warn" : "good"}
                />
              </div>
              {etopsImpact.impact > 0 && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-200">
                    <p className="font-semibold">ETOPS reduced by {etopsImpact.impact} min</p>
                    <p className="text-amber-300 mt-0.5">{etopsImpact.altitudeConstraint || "Within acceptable range for current route."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendation Summary */}
          <div className="rounded-xl bg-slate-950 border border-slate-700 p-3.5">
            <div className="flex items-start gap-2">
              {etopsImpact.impact <= 20 && calculateFuel.delta >= 1000 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-[10px] text-slate-300">
                <p className="font-bold mb-1">
                  {etopsImpact.impact <= 20 && calculateFuel.delta >= 1000
                    ? "✓ Replan acceptable"
                    : "⚠ Review required"}
                </p>
                <p className="text-slate-400">
                  {calculateFuel.delta >= 1000
                    ? `Altitude increase to FL${Math.round(cruiseAlt / 100)} saves ${calculateFuel.delta.toLocaleString()} lbs fuel`
                    : "Lower altitude may increase fuel burn"}
                  {etopsImpact.impact > 20 && ` but reduces ETOPS by ${etopsImpact.impact} min`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowRecalc(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleApplyReplan}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors"
            >
              Apply Replan
            </button>
          </div>
        </>
      )}
    </div>
  );
}