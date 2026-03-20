import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle, AlertTriangle, Clock, Fuel, MapPin, Users,
  AlertCircle, Shield, ChevronRight, Zap
} from 'lucide-react';

/**
 * Dispatch Logic Engine
 * Evaluates a flight against aircraft-specific dispatch policies
 * Returns step-by-step workflow with pass/fail/warn status
 */
export default function DispatchLogicEngine({ flight, policy, performanceProfile }) {
  const evaluation = useMemo(() => {
    if (!policy || !flight) return null;

    const steps = [];

    // Step 1: Check MEL/CDL
    const inoperable = flight.inoperable_systems || [];
    const deferred = flight.deferred_items || [];
    const melPass = inoperable.length === 0 && deferred.length <= (policy.mel_rules?.max_deferred_items || 2);
    steps.push({
      title: 'Check MEL/CDL',
      status: melPass ? 'pass' : inoperable.length > 0 ? 'fail' : 'warn',
      detail: `Inoperable: ${inoperable.length} · Deferred: ${deferred.length} of ${policy.mel_rules?.max_deferred_items || 2} max`,
      icon: Shield,
    });

    // Step 2: Compute Fuel
    if (performanceProfile) {
      const tripFuel = flight.estimated_trip_fuel || 0;
      const contingency = tripFuel * (policy.min_fuel_policy?.contingency || 5) / 100;
      const alternate = tripFuel * (policy.min_fuel_policy?.alternate || 10) / 100;
      const finalReserve = policy.min_fuel_policy?.final_reserve || 3200;
      const minRequired = tripFuel + contingency + alternate + finalReserve;
      const fuelOnBoard = flight.fuel_on_board || 0;
      const fuelPass = fuelOnBoard >= minRequired;
      const margin = fuelOnBoard - minRequired;

      steps.push({
        title: 'Compute Fuel',
        status: fuelPass ? 'pass' : margin > -1000 ? 'warn' : 'fail',
        detail: `Min: ${minRequired.toLocaleString()} lbs · On Board: ${fuelOnBoard.toLocaleString()} lbs · Margin: ${margin >= 0 ? '+' : ''}${Math.round(margin).toLocaleString()} lbs`,
        icon: Fuel,
      });
    }

    // Step 3: Select Alternate
    const alternate = flight.alternate_airport || null;
    const altPass = !!alternate;
    steps.push({
      title: 'Select Alternate',
      status: altPass ? 'pass' : 'warn',
      detail: alternate ? `${alternate} · Within ${policy.alternate_selection?.max_distance_nm || 400} NM` : 'No alternate assigned',
      icon: MapPin,
    });

    // Step 4: ETOPS Check (if applicable)
    if (policy.max_etops_minutes && policy.max_etops_minutes < 180) {
      const etopsPass = flight.route_time_minutes <= policy.max_etops_minutes;
      steps.push({
        title: 'Verify ETOPS Limits',
        status: etopsPass ? 'pass' : 'warn',
        detail: `Flight time: ${flight.route_time_minutes || 0} min · Limit: ${policy.max_etops_minutes} min`,
        icon: Clock,
      });
    }

    // Step 5: Crew Legality
    const crewPass = !flight.crew_legality_issue;
    steps.push({
      title: 'Check Crew Legality (FAR 117)',
      status: crewPass ? 'pass' : 'fail',
      detail: flight.crew_legality_issue ? flight.crew_legality_issue : 'All crew legal',
      icon: Users,
    });

    // Overall status
    const failCount = steps.filter(s => s.status === 'fail').length;
    const warnCount = steps.filter(s => s.status === 'warn').length;
    const overallStatus = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

    return { steps, overallStatus, failCount, warnCount };
  }, [flight, policy, performanceProfile]);

  if (!evaluation) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Select a flight to evaluate dispatch logic
      </div>
    );
  }

  const statusColors = {
    pass: { bg: 'bg-green-500/15', text: 'text-green-400', icon: CheckCircle },
    warn: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: AlertTriangle },
    fail: { bg: 'bg-destructive/15', text: 'text-destructive', icon: AlertCircle },
  };

  const overallCfg = statusColors[evaluation.overallStatus];
  const OverallIcon = overallCfg.icon;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className={cn('rounded-xl border px-4 py-3 flex items-start gap-3', overallCfg.bg)}>
        <OverallIcon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', overallCfg.text)} />
        <div className="flex-1">
          <p className={cn('text-sm font-bold', overallCfg.text)}>
            {evaluation.overallStatus === 'pass' ? 'DISPATCH APPROVED' : evaluation.overallStatus === 'warn' ? 'CONDITIONAL — Review Issues' : 'DISPATCH HOLD — Address Failures'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {evaluation.failCount > 0 && `${evaluation.failCount} failure${evaluation.failCount !== 1 ? 's' : ''} · `}
            {evaluation.warnCount > 0 && `${evaluation.warnCount} warning${evaluation.warnCount !== 1 ? 's' : ''}`}
            {evaluation.failCount === 0 && evaluation.warnCount === 0 && 'All systems clear'}
          </p>
        </div>
      </div>

      {/* Workflow steps */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Dispatch Workflow</p>
        {evaluation.steps.map((step, idx) => {
          const cfg = statusColors[step.status];
          const StepIcon = step.icon;
          return (
            <div key={idx} className="rounded-xl bg-card border border-border overflow-hidden">
              <div className={cn('px-4 py-3 flex items-start gap-3', cfg.bg)}>
                <StepIcon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cfg.text)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', cfg.text)}>{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={cn('text-xs font-bold px-2 py-1 rounded-full capitalize', cfg.bg, cfg.text)}>
                    {step.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action button */}
      {evaluation.overallStatus === 'pass' && (
        <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-400 font-semibold">
            Flight approved for dispatch. Ready to issue release.
          </p>
        </div>
      )}

      {evaluation.overallStatus === 'warn' && (
        <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-400 font-semibold">
            Review warnings before dispatch. Dispatcher approval required.
          </p>
        </div>
      )}

      {evaluation.overallStatus === 'fail' && (
        <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-destructive font-semibold">Cannot dispatch — critical items must be resolved</p>
            <p className="text-xs text-muted-foreground mt-0.5">Contact MOC or maintenance</p>
          </div>
        </div>
      )}
    </div>
  );
}