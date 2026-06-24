/**
 * OOSTriggerBanner
 * Displays active hard OOS triggers for a specific aircraft tail.
 * Fetches from evaluateOOSTriggers backend function.
 *
 * Props:
 *   aircraftTail  — string
 *   compact       — bool (inline badge mode, default false)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Clock, Tag, Zap, Plane, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRIGGER_ICONS = {
  NO_GO_ATA:                  AlertTriangle,
  NO_GO_KEYWORD:              AlertTriangle,
  RII_UNSIGNED:               Shield,
  MEL_EXPIRED:                Clock,
  MEL_INTERVAL_EXCEEDED:      Clock,
  MEL_INTERVAL_WARNING:       Clock,
  ETOPS_BLOCKED:              Plane,
  ACTIVE_FAULT_CRITICAL_SYSTEM: Zap,
  GEAR_PIN_INSTALLED:         Tag,
  FERRY_FLIGHT_MODE:          Plane,
};

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-red-950/50',
    border: 'border-red-500/50',
    iconColor: 'text-red-400',
    labelColor: 'text-red-300',
    badgeBg: 'bg-red-900/60',
  },
  warning: {
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/40',
    iconColor: 'text-amber-400',
    labelColor: 'text-amber-300',
    badgeBg: 'bg-amber-900/50',
  },
};

export default function OOSTriggerBanner({ aircraftTail, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['oos-triggers', aircraftTail],
    queryFn: async () => {
      const res = await base44.functions.invoke('evaluateOOSTriggers', { aircraft_tail: aircraftTail });
      return res.data?.results?.[0] || null;
    },
    enabled: !!aircraftTail,
    refetchInterval: 120000, // re-check every 2 min
    staleTime: 60000,
  });

  if (isLoading) return null;
  if (!data || !data.triggered) return null;

  const criticals = (data.triggers || []).filter(t => t.severity === 'critical');
  const warnings = (data.triggers || []).filter(t => t.severity === 'warning');

  // ── Compact badge mode ──────────────────────────────────────────────────────
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/60 border border-red-500/40 text-[10px] font-extrabold text-red-400 uppercase tracking-wide">
        <AlertTriangle className="w-3 h-3" />
        {criticals.length} OOS Trigger{criticals.length !== 1 ? 's' : ''}
      </span>
    );
  }

  // ── Full banner ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden border border-red-500/50 bg-red-950/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-red-950/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-sm font-extrabold text-red-400 uppercase tracking-widest">
              {criticals.length} OOS Hard Trigger{criticals.length !== 1 ? 's' : ''}
              {warnings.length > 0 && (
                <span className="ml-2 text-amber-400 text-[10px] normal-case tracking-normal font-bold">
                  + {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
            <p className="text-[10px] text-red-300/70 mt-0.5">
              Aircraft cannot be legally dispatched until all critical triggers are resolved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => refetch()}
            className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-gray-400', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-300" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Collapsed preview — show first critical trigger */}
      {!expanded && criticals.length > 0 && (
        <div className="px-4 py-2.5 border-t border-red-800/30">
          <p className="text-xs text-red-200 leading-snug line-clamp-1">
            ▶ {criticals[0].message}
          </p>
          {criticals.length > 1 && (
            <button onClick={() => setExpanded(true)} className="text-[10px] text-red-400 hover:text-red-300 mt-0.5 font-bold">
              +{criticals.length - 1} more trigger{criticals.length - 1 !== 1 ? 's' : ''} — tap to expand
            </button>
          )}
        </div>
      )}

      {/* Expanded — all triggers */}
      {expanded && (
        <div className="divide-y divide-white/5">
          {[...criticals, ...warnings].map((trigger, i) => {
            const sty = SEVERITY_STYLES[trigger.severity] || SEVERITY_STYLES.critical;
            const Icon = TRIGGER_ICONS[trigger.code] || AlertTriangle;
            return (
              <div key={i} className={cn('flex items-start gap-3 px-4 py-3', sty.bg)}>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', sty.badgeBg)}>
                  <Icon className={cn('w-3.5 h-3.5', sty.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={cn('text-[10px] font-extrabold uppercase tracking-widest', sty.labelColor)}>
                      {trigger.code.replace(/_/g, ' ')}
                    </span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', sty.badgeBg, sty.labelColor)}>
                      {trigger.severity.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-gray-600 uppercase">{trigger.source}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-snug">{trigger.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}