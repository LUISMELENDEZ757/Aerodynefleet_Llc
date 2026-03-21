import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Plane, Users, Zap, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

function buildTailSwapOptions(flights) {
  const byTail = {};
  flights.forEach(f => {
    const tail = f.aircraft_tail || 'UNASSIGNED';
    if (!byTail[tail]) byTail[tail] = [];
    byTail[tail].push(f);
  });
  const tails = Object.keys(byTail);
  if (tails.length < 2) return [];
  const swaps = [];
  for (let i = 0; i < tails.length - 1; i++) {
    for (let j = i + 1; j < tails.length; j++) {
      const a = byTail[tails[i]];
      const b = byTail[tails[j]];
      swaps.push({
        id: `TS-${tails[i]}-${tails[j]}`,
        tail_a: tails[i],
        tail_b: tails[j],
        flights_a: a,
        flights_b: b,
        benefit: Math.round(Math.random() * 30 + 10),
        risk: Math.random() > 0.5 ? 'low' : 'medium',
      });
    }
  }
  return swaps.slice(0, 4);
}

const CREW_SWAP_SCENARIOS = [
  {
    id: 'CS-001',
    from: 'Capt. Hayes → AAL4474 (KEWR-KORD)',
    to: 'Capt. Torres → AAL4474 (KEWR-KORD)',
    reason: 'Capt. Hayes approaching duty limit (14.2h remaining)',
    risk: 'low',
    impact: 'Minor — 25 min delay',
    legal: true,
  },
  {
    id: 'CS-002',
    from: 'F/O Ramirez → AAL4480 (KORD-KLAX)',
    to: 'F/O Park → AAL4480 (KORD-KLAX)',
    reason: 'F/O Ramirez rest requirement violation in pairing',
    risk: 'medium',
    impact: '45 min delay at KORD',
    legal: false,
  },
  {
    id: 'CS-003',
    from: 'Capt. Williams → AAL4490 (KLAX-KDEN)',
    to: 'Capt. Mitchell (Reserve) → AAL4490 (KLAX-KDEN)',
    reason: 'Unscheduled maintenance — aircraft swap requires crew check',
    risk: 'low',
    impact: 'None — same aircraft type',
    legal: true,
  },
];

const RECOVERY_OPTIONS = [
  {
    id: 'REC-001',
    title: 'Cancel AAL4476 and protect passengers on AAL4482',
    flights_affected: ['AAL4476', 'AAL4482'],
    crew_moves: 2,
    delay_saved_min: 140,
    cost_score: 35,
    recommended: true,
  },
  {
    id: 'REC-002',
    title: 'Deadhead crew ORD→EWR for crew shortage recovery',
    flights_affected: ['AAL4474'],
    crew_moves: 1,
    delay_saved_min: 90,
    cost_score: 55,
    recommended: false,
  },
  {
    id: 'REC-003',
    title: 'Tail swap N455GJ → N231AB for MEL compliance',
    flights_affected: ['AAL4480'],
    crew_moves: 0,
    delay_saved_min: 60,
    cost_score: 20,
    recommended: true,
  },
];

function TailSwaps({ flights }) {
  const swaps = useMemo(() => buildTailSwapOptions(flights), [flights]);
  const [applied, setApplied] = useState({});

  if (swaps.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No tail swap opportunities identified — load flights with multiple tails
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {swaps.map(swap => (
        <div key={swap.id} className={cn(
          'rounded-xl bg-card border overflow-hidden transition-all',
          applied[swap.id] ? 'border-green-500/30' : 'border-border'
        )}>
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-bold text-foreground">{swap.tail_a}</p>
                  <ArrowLeftRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm font-mono font-bold text-foreground">{swap.tail_b}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {swap.flights_a.length} + {swap.flights_b.length} legs · +{swap.benefit}min savings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                swap.risk === 'low' ? 'text-green-400 bg-green-500/15' : 'text-orange-400 bg-orange-500/15'
              )}>
                {swap.risk === 'low' ? 'Low Risk' : 'Med Risk'}
              </span>
              {applied[swap.id] ? (
                <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Applied
                </span>
              ) : (
                <button
                  onClick={() => setApplied(prev => ({ ...prev, [swap.id]: true }))}
                  className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Apply Swap
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CrewSwaps() {
  const [applied, setApplied] = useState({});

  return (
    <div className="space-y-2">
      {CREW_SWAP_SCENARIOS.map(swap => (
        <div key={swap.id} className={cn(
          'rounded-xl border overflow-hidden',
          applied[swap.id] ? 'bg-green-500/10 border-green-500/20' :
          !swap.legal ? 'bg-destructive/10 border-destructive/20' : 'bg-card border-border'
        )}>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <p className="text-xs font-mono text-muted-foreground">{swap.id}</p>
                  {!swap.legal && <span className="text-xs font-bold text-destructive bg-destructive/15 px-1.5 py-0.5 rounded">REQUIRED</span>}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <span className="text-foreground font-semibold truncate">{swap.from}</span>
                  <ArrowLeftRight className="w-3 h-3 flex-shrink-0" />
                  <span className="text-foreground font-semibold truncate">{swap.to}</span>
                </div>
                <p className="text-xs text-muted-foreground">{swap.reason}</p>
                <p className="text-xs mt-1">
                  <span className="text-muted-foreground">Impact: </span>
                  <span className={cn('font-semibold', swap.impact.includes('None') ? 'text-green-400' : 'text-orange-400')}>{swap.impact}</span>
                </p>
              </div>
              {applied[swap.id] ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <button
                  onClick={() => setApplied(prev => ({ ...prev, [swap.id]: true }))}
                  className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  Execute
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecoveryOptimizer() {
  const [applied, setApplied] = useState({});

  return (
    <div className="space-y-2">
      {RECOVERY_OPTIONS.map(opt => (
        <div key={opt.id} className={cn(
          'rounded-xl border overflow-hidden',
          applied[opt.id] ? 'bg-green-500/10 border-green-500/20' :
          opt.recommended ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
        )}>
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {opt.recommended && <span className="text-xs font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded">RECOMMENDED</span>}
                </div>
                <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">Flights: <span className="font-mono font-bold text-foreground">{opt.flights_affected.join(', ')}</span></span>
                  <span className="text-xs text-muted-foreground">Crew moves: <span className="font-bold text-foreground">{opt.crew_moves}</span></span>
                  <span className="text-xs text-green-400 font-bold">−{opt.delay_saved_min}m delay</span>
                  <span className="text-xs text-muted-foreground">Cost score: <span className={cn('font-bold', opt.cost_score < 30 ? 'text-green-400' : opt.cost_score < 50 ? 'text-primary' : 'text-orange-400')}>{opt.cost_score}</span></span>
                </div>
              </div>
              {applied[opt.id] ? (
                <span className="text-xs text-green-400 font-bold flex items-center gap-1 flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" /> Applied
                </span>
              ) : (
                <button
                  onClick={() => setApplied(prev => ({ ...prev, [opt.id]: true }))}
                  className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SwapsRecovery({ flights }) {
  const [sub, setSub] = useState('tail_swaps');

  const SUB_TABS = [
    { key: 'tail_swaps',  label: 'Tail Swaps',     icon: Plane },
    { key: 'crew_swaps',  label: 'Crew Swaps',     icon: Users },
    { key: 'recovery',    label: 'Recovery Optim.', icon: Zap },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {SUB_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all',
              sub === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {sub === 'tail_swaps' && <TailSwaps flights={flights} />}
      {sub === 'crew_swaps' && <CrewSwaps />}
      {sub === 'recovery' && <RecoveryOptimizer />}
    </div>
  );
}