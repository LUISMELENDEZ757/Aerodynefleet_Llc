import React, { useMemo } from 'react';
import { useFAR117Check, useFatigueCalculation } from '@/hooks/useWebWorker';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * FAR 117 Compliance component using Web Worker
 * Prevents UI blocking during crew legality calculations
 */
export default function FAR117CheckWorker({
  crewData,
  fatigueData,
  onComplianceChange,
}) {
  // Check FAR 117 compliance
  const { result: complianceResult, loading: compLoading, error: compError } = useFAR117Check(crewData);
  
  // Calculate fatigue metrics
  const { result: fatigueResult, loading: fatLoading } = useFatigueCalculation(fatigueData);

  // Notify parent of results
  React.useEffect(() => {
    if (complianceResult && onComplianceChange) {
      onComplianceChange({ compliance: complianceResult, fatigue: fatigueResult });
    }
  }, [complianceResult, fatigueResult, onComplianceChange]);

  const isLoading = compLoading || fatLoading;

  const statusColor = {
    legal: 'text-green-400',
    near_limit: 'text-orange-400',
    illegal: 'text-destructive',
  };

  const statusBg = {
    legal: 'bg-green-500/15',
    near_limit: 'bg-orange-500/15',
    illegal: 'bg-destructive/15',
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking compliance...
      </div>
    );
  }

  if (compError) {
    return (
      <div className="flex items-center gap-2 text-xs text-orange-400">
        <AlertTriangle className="w-3.5 h-3.5" />
        {compError}
      </div>
    );
  }

  if (!complianceResult) return null;

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className={cn(
        'rounded-xl px-4 py-3 border border-current flex items-center gap-2',
        statusBg[complianceResult.status]
      )}>
        {complianceResult.status === 'legal' ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : complianceResult.status === 'near_limit' ? (
          <AlertTriangle className="w-5 h-5 text-orange-400" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-destructive" />
        )}
        <span className={cn('text-sm font-bold', statusColor[complianceResult.status])}>
          {complianceResult.status.charAt(0).toUpperCase() + complianceResult.status.slice(1)}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(complianceResult.hoursRemaining).map(([key, value]) => (
          <div key={key} className="bg-background/40 rounded-lg px-3 py-2">
            <p className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="font-mono font-bold text-foreground">{value.toFixed(1)} hrs</p>
          </div>
        ))}
      </div>

      {/* Violations */}
      {complianceResult.violations.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-destructive mb-1">Violations:</p>
          <ul className="text-xs text-foreground space-y-0.5">
            {complianceResult.violations.map((v, i) => (
              <li key={i}>• {v.replace(/_/g, ' ')}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Fatigue if available */}
      {fatigueResult && (
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2">
          <p className="text-xs text-muted-foreground">Fatigue Score</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm font-bold text-orange-400">{fatigueResult.score}/100</p>
            <p className="text-xs text-muted-foreground capitalize">{fatigueResult.level}</p>
          </div>
        </div>
      )}
    </div>
  );
}