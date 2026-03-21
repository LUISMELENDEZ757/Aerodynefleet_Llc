import React, { useState, useMemo } from 'react';
import { useWeightBalanceCalculation } from '@/hooks/useWebWorker';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Weight & Balance component using Web Worker for calculations
 * Prevents UI blocking during heavy computations
 */
export default function WeightBalanceWorker({
  aircraftType,
  paxLoads,
  cargoLoads,
  fuelWeight,
  config, // Contains OEW, limits, etc.
  onResultsChange,
}) {
  const [form, setForm] = useState({
    paxData: paxLoads || [],
    cargoData: cargoLoads || [],
    fuelWeight: fuelWeight || 0,
  });

  // Prepare data for worker
  const calculationPayload = useMemo(() => {
    if (!config) return null;
    return {
      aircraftType,
      oew: config.oew,
      oewArm: config.oewArm,
      paxData: form.paxData,
      cargoData: form.cargoData,
      fuelWeight: form.fuelWeight,
      fuelArm: config.fuelArm,
      mtow: config.mtow,
      mlw: config.mlw,
      mzfw: config.mzfw,
      cgMin: config.cgMin,
      cgMax: config.cgMax,
    };
  }, [aircraftType, config, form]);

  // Send to worker
  const { result, loading, error } = useWeightBalanceCalculation(calculationPayload);

  // Notify parent of results
  React.useEffect(() => {
    if (result && onResultsChange) {
      onResultsChange(result);
    }
  }, [result, onResultsChange]);

  if (!config) {
    return <div className="text-xs text-muted-foreground">Loading aircraft config...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Input Controls */}
      <div className="rounded-xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Fuel Loading
        </p>
        <div>
          <label className="text-xs text-muted-foreground">Fuel Weight (lbs)</label>
          <input
            type="number"
            value={form.fuelWeight}
            onChange={(e) => setForm({ ...form, fuelWeight: Number(e.target.value) || 0 })}
            className="w-full h-10 bg-secondary border border-border rounded-lg px-3 mt-1 text-sm font-mono"
          />
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Calculating...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-orange-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 bg-secondary/60 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              W&B Results
            </p>
          </div>
          <div className="p-4 space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              {result.envelopeStatus.allValid ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              )}
              <span className={cn(
                'text-sm font-bold',
                result.envelopeStatus.allValid ? 'text-green-400' : 'text-destructive'
              )}>
                {result.envelopeStatus.allValid ? 'Within Limits' : 'Limit Exceeded'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-background/40 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">ZFW</p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {result.zfw.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">lbs</p>
              </div>
              <div className="bg-background/40 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">TOW</p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {result.tow.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">lbs</p>
              </div>
              <div className="bg-background/40 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">CG</p>
                <p className="text-sm font-mono font-bold text-foreground">
                  {result.zfwCg}%
                </p>
                <p className="text-xs text-muted-foreground">MAC</p>
              </div>
            </div>

            {/* Violations */}
            {!result.envelopeStatus.zfwValid && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <p className="text-xs text-destructive font-semibold">
                  ZFW Exceeded by {result.exceeded.zfw.toLocaleString()} lbs
                </p>
              </div>
            )}
            {!result.envelopeStatus.towValid && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <p className="text-xs text-destructive font-semibold">
                  TOW Exceeded by {result.exceeded.tow.toLocaleString()} lbs
                </p>
              </div>
            )}
            {!result.envelopeStatus.cgValid && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <p className="text-xs text-destructive font-semibold">
                  CG Out of Range
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}