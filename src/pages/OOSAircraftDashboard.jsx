import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, AlertTriangle, Wrench, Clock, CheckCircle,
  Plane, Search, Plus, Activity, Package, BookOpen,
  ArrowRight, RefreshCw, Shield, Tag, ChevronDown, ChevronUp,
  FileText, X, Send
} from 'lucide-react';
import OOSTriggerBanner from '@/components/oos/OOSTriggerBanner';
import { cn } from '@/lib/utils';

// ── State Machine Definition ────────────────────────────────────────────────
export const OOS_STATES = {
  active: {
    label: 'In Service',
    sublabel: 'Airworthy',
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
    badgeBg: 'bg-green-900/40',
    order: 0,
  },
  mel_ops: {
    label: 'MEL/CDL Ops',
    sublabel: 'Airworthy w/ Restrictions',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
    badgeBg: 'bg-blue-900/40',
    order: 1,
  },
  oos: {
    label: 'Out of Service',
    sublabel: 'Cannot Be Dispatched',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    dot: 'bg-red-400',
    badgeBg: 'bg-red-900/50',
    order: 2,
  },
  maintenance: {
    label: 'Out of Service',
    sublabel: 'Cannot Be Dispatched',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    dot: 'bg-red-400',
    badgeBg: 'bg-red-900/50',
    order: 2,
  },
  rts_pending: {
    label: 'RTS Pending',
    sublabel: 'Awaiting Release Steps',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    badgeBg: 'bg-amber-900/40',
    order: 3,
  },
  released: {
    label: 'Released / RTS Complete',
    sublabel: 'Fully Airworthy',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    badgeBg: 'bg-emerald-900/40',
    order: 4,
  },
  retired: {
    label: 'Retired',
    sublabel: 'Decommissioned',
    color: 'text-gray-400',
    bg: 'bg-gray-500/15',
    border: 'border-gray-500/20',
    dot: 'bg-gray-500',
    badgeBg: 'bg-gray-900/40',
    order: 5,
  },
};

// Valid transitions: from → allowed next states
const TRANSITIONS = {
  active:      ['mel_ops', 'oos', 'maintenance'],
  mel_ops:     ['active', 'oos'],
  oos:         ['rts_pending', 'active'],
  maintenance: ['rts_pending', 'active'],
  rts_pending: ['released', 'oos'],
  released:    ['active', 'oos'],
  retired:     [],
};

// RTS checklist items — all conditions that must clear before release
const RTS_STEPS = [
  { key: 'work_complete',         label: 'All Discrepancies Corrected / MEL-Deferred', icon: Wrench },
  { key: 'inspections_complete',  label: 'All Inspections Completed',                  icon: CheckCircle },
  { key: 'rii_signed',            label: 'RII Inspector Signed',                       icon: Shield },
  { key: 'ops_check',             label: 'Ops / Functional Check Passed',              icon: Activity },
  { key: 'paperwork_complete',    label: 'All Paperwork & Signatures Complete',        icon: FileText },
  { key: 'system_resets',         label: 'All System Resets Successful',               icon: RefreshCw },
  { key: 'mcc_approved',          label: 'MCC/OCC RTS Approval',                       icon: Package },
  { key: 'qa_approved',           label: 'QA / Engineering Approved (if required)',    icon: CheckCircle },
  { key: 'captain_accepted',      label: 'Captain Accepted',                           icon: Plane },
];

// Human-triggered OOS reasons grouped by initiator role
const HUMAN_OOS_REASONS = {
  mechanic: [
    'Mechanic: Non-deferrable discrepancy found',
    'Mechanic: Safety-critical system fault identified',
    'Mechanic: Structural damage discovered',
    'Mechanic: Fuel leak confirmed',
    'Mechanic: Engine run / taxi test required before RTS',
  ],
  mcc: [
    'MCC: Placed OOS for operational control',
    'MCC: Awaiting engineering evaluation',
    'MCC: AOG parts on order — holding OOS',
    'MCC: Weight & balance / config mismatch',
    'MCC: Fuel imbalance / fuel system MEL exceeds limits',
  ],
  engineering: [
    'Engineering: Blocked pending technical evaluation',
    'Engineering: AD compliance check required',
    'Engineering: Pending repair scheme approval',
    'Engineering: Engine removal — heavy maintenance entry',
  ],
  pilot: [
    'Pilot: Severe discrepancy reported on arrival',
    'Pilot: Abnormal checklist item unresolved',
    'Pilot: Cabin pressurization issue during flight',
    'Pilot: Hydraulic / flight control anomaly in flight',
  ],
  ops: [
    'Ops: Bird strike — inspection required',
    'Ops: Lightning strike — inspection required',
    'Ops: Foreign object ingestion suspected',
    'Ops: Contamination — fuel / hydraulic',
    'Ops: Ground damage during servicing',
    'Ops: Hard landing — inspection required',
  ],
};

// ── State Transition Modal ──────────────────────────────────────────────────
const INITIATOR_ROLES = [
  { key: 'mechanic',    label: 'Mechanic / Technician', color: 'text-amber-400' },
  { key: 'mcc',         label: 'MCC / OCC',             color: 'text-blue-400' },
  { key: 'engineering', label: 'Engineering',           color: 'text-purple-400' },
  { key: 'pilot',       label: 'Pilot Report',          color: 'text-cyan-400' },
  { key: 'ops',         label: 'Operations',            color: 'text-orange-400' },
];

function StateTransitionModal({ aircraft, onClose, onSave }) {
  const currentState = OOS_STATES[aircraft.status] || OOS_STATES.active;
  const allowed = TRANSITIONS[aircraft.status] || [];
  const [targetState, setTargetState] = useState(allowed[0] || '');
  const [reason, setReason] = useState('');
  const [initiatorRole, setInitiatorRole] = useState('mechanic');
  const [releasedBy, setReleasedBy] = useState('');
  const [rtsChecklist, setRtsChecklist] = useState(() => {
    const saved = aircraft.rts_checklist || {};
    return RTS_STEPS.reduce((acc, s) => ({ ...acc, [s.key]: saved[s.key] || false }), {});
  });

  const targetCfg = OOS_STATES[targetState] || {};
  const toggleStep = (key) => setRtsChecklist(p => ({ ...p, [key]: !p[key] }));
  const completedSteps = RTS_STEPS.filter(s => rtsChecklist[s.key]).length;
  const isRtsPending = aircraft.status === 'rts_pending';
  const goingToOOS = targetState === 'oos' || targetState === 'maintenance';
  const goingToReleased = targetState === 'released';
  const showRtsPanel = isRtsPending || targetState === 'rts_pending';

  const presetReasons = goingToOOS ? (HUMAN_OOS_REASONS[initiatorRole] || []) : [];

  const canSave = targetState && reason.trim() &&
    (goingToReleased ? completedSteps === RTS_STEPS.length && releasedBy.trim() : true);

  const handleSave = () => {
    const now = new Date().toISOString();
    const update = {
      status: targetState,
      oos_reason: ['oos','maintenance','rts_pending'].includes(targetState) ? `[${initiatorRole.toUpperCase()}] ${reason}` : null,
      oos_since: goingToOOS ? now : (aircraft.oos_since || null),
      rts_checklist: isRtsPending ? {
        ...rtsChecklist,
        released_by: releasedBy,
        released_at: goingToReleased ? now : null,
      } : (aircraft.rts_checklist || {}),
    };
    onSave(aircraft.id, update, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="font-extrabold text-white text-sm uppercase tracking-widest">State Transition</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{aircraft.tail_number} · {aircraft.aircraft_type}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Current state */}
          <div className={cn('rounded-xl border px-4 py-3 flex items-center gap-3', currentState.bg, currentState.border)}>
            <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', currentState.dot)} />
            <div>
              <p className={cn('text-xs font-extrabold uppercase tracking-widest', currentState.color)}>Current: {currentState.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{currentState.sublabel}</p>
            </div>
          </div>

          {/* Target state selector */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Transition To</label>
            <div className="space-y-2">
              {allowed.map(s => {
                const cfg = OOS_STATES[s];
                return (
                  <button key={s} onClick={() => setTargetState(s)}
                    className={cn('w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                      targetState === s ? `${cfg.bg} ${cfg.border}` : 'bg-[#1a1f2e] border-white/10 hover:border-white/20')}>
                    <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dot)} />
                    <div>
                      <p className={cn('text-sm font-bold', targetState === s ? cfg.color : 'text-white')}>{cfg.label}</p>
                      <p className="text-[10px] text-gray-500">{cfg.sublabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initiator Role — shown when placing OOS */}
          {goingToOOS && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Initiated By</label>
              <div className="flex flex-wrap gap-2">
                {INITIATOR_ROLES.map(r => (
                  <button key={r.key} onClick={() => setInitiatorRole(r.key)}
                    className={cn('px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                      initiatorRole === r.key
                        ? `bg-white/10 border-white/30 ${r.color}`
                        : 'bg-[#1a1f2e] border-white/10 text-gray-500 hover:text-gray-300')}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preset reason quick-picks — shown when placing OOS */}
          {goingToOOS && presetReasons.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Quick Reason</label>
              <div className="space-y-1">
                {presetReasons.map(r => (
                  <button key={r} onClick={() => setReason(r)}
                    className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-all',
                      reason === r
                        ? 'bg-red-900/40 border-red-500/50 text-red-200'
                        : 'bg-[#1a1f2e] border-white/8 text-gray-400 hover:border-white/20 hover:text-white')}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason text */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              {goingToOOS ? 'Additional Details' : 'Reason / Notes'} *
            </label>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder={
                goingToOOS ? 'Describe the specific condition, location, or finding…' :
                targetState === 'rts_pending' ? 'Describe work completed, what was corrected or deferred…' :
                targetState === 'released' ? 'Release authorization details and approving authority…' :
                targetState === 'mel_ops' ? 'MEL item reference number and operational restriction…' :
                'Reason for state change…'
              }
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none"
            />
          </div>

          {/* RTS Checklist — keep-OOS blocker logic visible */}
          {showRtsPanel && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                  RTS Release Checklist
                </p>
                <span className="text-xs font-black text-amber-300">{completedSteps}/{RTS_STEPS.length}</span>
              </div>
              <p className="text-[10px] text-amber-300/60 -mt-1">Aircraft stays OOS until ALL items are cleared</p>
              <div className="space-y-1.5">
                {RTS_STEPS.map(({ key, label, icon: Icon }) => (
                  <button key={key} type="button" onClick={() => toggleStep(key)}
                    className={cn('w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left border transition-all',
                      rtsChecklist[key] ? 'bg-green-900/30 border-green-600/40' : 'bg-[#1a1f2e] border-white/10 hover:border-white/20')}>
                    <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      rtsChecklist[key] ? 'bg-green-500 border-green-500' : 'border-gray-600')}>
                      {rtsChecklist[key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', rtsChecklist[key] ? 'text-green-400' : 'text-gray-500')} />
                    <span className={cn('text-sm font-bold', rtsChecklist[key] ? 'text-green-300' : 'text-gray-300')}>{label}</span>
                  </button>
                ))}
              </div>

              {/* Released By */}
              {goingToReleased && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Released By (Name / Cert #) *</label>
                  <input value={releasedBy} onChange={e => setReleasedBy(e.target.value)}
                    placeholder="e.g. J. Smith · AMT-12345"
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
                </div>
              )}

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Release Progress</span>
                  <span>{Math.round((completedSteps / RTS_STEPS.length) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-500"
                    style={{ width: `${(completedSteps / RTS_STEPS.length) * 100}%` }} />
                </div>
              </div>

              {/* Blocker warning if trying to release with incomplete items */}
              {goingToReleased && completedSteps < RTS_STEPS.length && (
                <div className="flex items-start gap-2 bg-red-950/50 border border-red-700/50 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-300 leading-snug">
                    {RTS_STEPS.length - completedSteps} item{RTS_STEPS.length - completedSteps > 1 ? 's' : ''} still pending — aircraft cannot be released until all checklist items are complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button disabled={!canSave} onClick={handleSave}
              className={cn('flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors',
                targetState ? `${OOS_STATES[targetState]?.badgeBg || 'bg-primary'} hover:brightness-125` : 'bg-primary')}>
              <Send className="w-4 h-4" /> Confirm Transition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Aircraft State Card ─────────────────────────────────────────────────────
function AircraftStateCard({ aircraft, melItems, oosEntries, onTransition }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = OOS_STATES[aircraft.status] || OOS_STATES.active;
  const activeMels = melItems.filter(m => m.aircraft_tail === aircraft.tail_number && m.status !== 'cleared');
  const activeOos = oosEntries.filter(e => e.aircraft_tail === aircraft.tail_number && e.status !== 'released');
  const rts = aircraft.rts_checklist || {};
  const completedRts = RTS_STEPS.filter(s => rts[s.key]).length;

  // Elapsed time in OOS
  const elapsedOos = useMemo(() => {
    if (!aircraft.oos_since) return null;
    const ms = Date.now() - new Date(aircraft.oos_since).getTime();
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }, [aircraft.oos_since]);

  const isDownState = ['oos', 'maintenance', 'rts_pending'].includes(aircraft.status);

  return (
    <div className={cn('rounded-2xl border overflow-hidden transition-all', cfg.bg, cfg.border)}>
      {/* State stripe */}
      <div className={cn('h-1 w-full', cfg.dot === 'bg-red-400' ? 'bg-gradient-to-r from-red-500 to-red-700' : cfg.dot === 'bg-amber-400' ? 'bg-gradient-to-r from-amber-500 to-yellow-600' : cfg.dot === 'bg-green-400' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : cfg.dot === 'bg-blue-400' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : cfg.dot === 'bg-emerald-400' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-600')} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg, cfg.border, 'border')}>
              <Plane className={cn('w-5 h-5', cfg.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-extrabold text-white font-mono">{aircraft.tail_number}</p>
                <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1.5 border', cfg.bg, cfg.border, cfg.color)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                </span>
                {elapsedOos && (
                  <span className="text-[10px] font-mono text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full border border-red-700/40">
                    ⏱ {elapsedOos}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {aircraft.aircraft_type}{aircraft.base_station ? ` · ${aircraft.base_station}` : ''}
              </p>
              {aircraft.oos_reason && (
                <p className="text-[11px] text-red-300/80 mt-0.5 italic line-clamp-1">{aircraft.oos_reason}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Transition button */}
            {TRANSITIONS[aircraft.status]?.length > 0 && (
              <button
                onClick={() => onTransition(aircraft)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Change State
              </button>
            )}
            <button onClick={() => setExpanded(v => !v)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
            </button>
          </div>
        </div>

        {/* RTS progress bar when in rts_pending */}
        {aircraft.status === 'rts_pending' && (
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="font-bold text-amber-400 uppercase tracking-widest">RTS Progress</span>
              <span>{completedRts}/{RTS_STEPS.length} steps</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-500"
                style={{ width: `${(completedRts / RTS_STEPS.length) * 100}%` }}
              />
            </div>
            <div className="flex gap-1 mt-1">
              {RTS_STEPS.map(s => (
                <div key={s.key} className={cn('flex-1 h-1 rounded-full', rts[s.key] ? 'bg-green-500' : 'bg-white/10')} title={s.label} />
              ))}
            </div>
          </div>
        )}

        {/* MEL/OOS summary chips */}
        <div className="flex flex-wrap gap-1.5">
          {activeMels.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-400">
              <Tag className="w-2.5 h-2.5 inline mr-1" />{activeMels.length} MEL item{activeMels.length > 1 ? 's' : ''}
            </span>
          )}
          {activeOos.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/40 border border-red-500/30 text-red-400">
              {activeOos.length} open OOS item{activeOos.length > 1 ? 's' : ''}
            </span>
          )}
          {aircraft.mcc_watch && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-900/40 border border-orange-500/30 text-orange-400">
              MCC Watch
            </span>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 space-y-3 bg-[#0f1520]">

          {/* Hard OOS Trigger Banner */}
          <OOSTriggerBanner aircraftTail={aircraft.tail_number} />

          {/* RTS checklist steps — shown for rts_pending AND as keep-OOS blockers for oos state */}
          {(aircraft.status === 'rts_pending' || aircraft.status === 'oos' || aircraft.status === 'maintenance') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className={cn('text-[10px] font-bold uppercase tracking-widest',
                  aircraft.status === 'rts_pending' ? 'text-amber-400' : 'text-red-400')}>
                  {aircraft.status === 'rts_pending' ? 'Release Checklist' : 'RTS Blockers — Keeps Aircraft OOS'}
                </p>
                <span className="text-[10px] text-gray-500">{completedRts}/{RTS_STEPS.length} cleared</span>
              </div>
              <div className="space-y-1">
                {RTS_STEPS.map(({ key, label, icon: Icon }) => (
                  <div key={key} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border',
                    rts[key] ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/10 border-red-800/20')}>
                    <div className={cn('w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                      rts[key] ? 'bg-green-500' : 'bg-red-900/40')}>
                      {rts[key]
                        ? <CheckCircle className="w-3 h-3 text-white" />
                        : <X className="w-2.5 h-2.5 text-red-500" />}
                    </div>
                    <Icon className={cn('w-3 h-3', rts[key] ? 'text-green-400' : 'text-red-600')} />
                    <span className={cn('text-xs font-bold', rts[key] ? 'text-green-300' : 'text-gray-500')}>{label}</span>
                  </div>
                ))}
              </div>
              {rts.released_by && (
                <p className="text-[10px] text-gray-400 mt-2">Released by: <span className="text-white font-bold">{rts.released_by}</span></p>
              )}
            </div>
          )}

          {/* Active MELs */}
          {activeMels.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Active MEL Items</p>
              <div className="space-y-1.5">
                {activeMels.slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-start gap-2 bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-900 text-blue-300">CAT {m.category}</span>
                    <p className="text-xs text-blue-100 leading-snug">{m.description}</p>
                  </div>
                ))}
                {activeMels.length > 3 && (
                  <p className="text-[10px] text-gray-500 pl-1">+{activeMels.length - 3} more MEL items</p>
                )}
              </div>
            </div>
          )}

          {/* Active OOS entries */}
          {activeOos.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Open Discrepancies</p>
              <div className="space-y-1.5">
                {activeOos.slice(0, 3).map(e => (
                  <div key={e.id} className="bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                    <p className="text-xs text-red-100 leading-snug">{e.work_description || e.description}</p>
                    {e.station && <p className="text-[10px] text-gray-500 mt-0.5">{e.station} · {new Date(e.created_date).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2 pt-1">
            <Link to={`/TechOpsLogbook?tail=${aircraft.tail_number}`}
              className="flex-1 text-center text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg py-1.5 hover:bg-primary/20 transition-colors">
              View Logbook →
            </Link>
            <Link to={`/AircraftDetail?tail=${aircraft.tail_number}`}
              className="flex-1 text-center text-xs font-bold text-gray-300 bg-white/8 border border-white/15 rounded-lg py-1.5 hover:bg-white/15 transition-colors">
              Aircraft Detail →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function OOSAircraftDashboard() {
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [transitionTarget, setTransitionTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: aircraft = [], isLoading: acLoading, refetch } = useQuery({
    queryKey: ['oos-dashboard-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: oosEntries = [], isLoading: oosLoading } = useQuery({
    queryKey: ['oos-dashboard-entries'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['oos-dashboard-mel'],
    queryFn: () => base44.entities.MELItem.filter({ status: 'open' }),
    refetchInterval: 60000,
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, update }) => base44.entities.Aircraft.update(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oos-dashboard-aircraft'] });
      setTransitionTarget(null);
    },
  });

  const isLoading = acLoading || oosLoading;

  // Deduplicate
  const uniqueAircraft = useMemo(() =>
    aircraft.filter((a, idx, arr) => arr.findIndex(b => b.tail_number === a.tail_number) === idx),
    [aircraft]
  );

  // KPIs
  const kpis = useMemo(() => ({
    oos: uniqueAircraft.filter(a => a.status === 'oos' || a.status === 'maintenance').length,
    rts_pending: uniqueAircraft.filter(a => a.status === 'rts_pending').length,
    mel_ops: uniqueAircraft.filter(a => a.status === 'mel_ops').length,
    released_today: uniqueAircraft.filter(a => {
      if (a.status !== 'released') return false;
      const rel = a.rts_checklist?.released_at;
      if (!rel) return false;
      return new Date(rel).toDateString() === new Date().toDateString();
    }).length,
  }), [uniqueAircraft]);

  // Filter
  const filtered = useMemo(() => uniqueAircraft.filter(a => {
    const stateMatch =
      filterState === 'all' ? ['oos','maintenance','rts_pending','mel_ops','released'].includes(a.status) :
      filterState === 'oos' ? (a.status === 'oos' || a.status === 'maintenance') :
      a.status === filterState;

    const searchMatch = !search ||
      a.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.aircraft_type?.toLowerCase().includes(search.toLowerCase()) ||
      a.base_station?.toLowerCase().includes(search.toLowerCase());

    return stateMatch && searchMatch;
  }).sort((a, b) => {
    const order = s => OOS_STATES[s]?.order ?? 99;
    return order(a.status) - order(b.status);
  }), [uniqueAircraft, filterState, search]);

  const FILTER_TABS = [
    { id: 'all',         label: 'All Issues',    count: kpis.oos + kpis.rts_pending + kpis.mel_ops },
    { id: 'oos',         label: 'OOS',           count: kpis.oos },
    { id: 'rts_pending', label: 'RTS Pending',   count: kpis.rts_pending },
    { id: 'mel_ops',     label: 'MEL Ops',       count: kpis.mel_ops },
    { id: 'released',    label: 'Released',      count: kpis.released_today },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-red-600/80 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">OOS Dashboard</p>
            <p className="text-[10px] text-red-400 font-mono tracking-widest uppercase">Aircraft State Control · Full Logic Model</p>
          </div>
        </div>
        <button onClick={refetch} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <RefreshCw className={cn('w-4 h-4 text-white', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* State model legend */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Aircraft State Model</p>
          <div className="flex flex-wrap gap-2">
            {['active','mel_ops','oos','rts_pending','released'].map(s => {
              const cfg = OOS_STATES[s];
              return (
                <div key={s} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold', cfg.bg, cfg.border, cfg.color)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                </div>
              );
            })}
            <div className="flex items-center gap-1 text-[10px] text-gray-600 pl-1">
              <ArrowRight className="w-3 h-3" /> transitions enforced
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Aircraft OOS',    value: kpis.oos,          color: 'text-red-400',    bg: 'bg-red-900/20',    icon: AlertTriangle },
            { label: 'RTS Pending',     value: kpis.rts_pending,  color: 'text-amber-400',  bg: 'bg-amber-900/20',  icon: Clock },
            { label: 'MEL/CDL Ops',     value: kpis.mel_ops,      color: 'text-blue-400',   bg: 'bg-blue-900/20',   icon: Tag },
            { label: 'Released Today',  value: kpis.released_today, color: 'text-emerald-400', bg: 'bg-emerald-900/20', icon: CheckCircle },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className={cn('rounded-2xl border border-white/10 px-4 py-3 flex items-center gap-3', bg)}>
              <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
              <div>
                <p className={cn('text-2xl font-black', color)}>{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tail, type, station…"
              className="w-full bg-[#141922] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Link to="/NewOOS" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold transition-colors">
            <Plus className="w-4 h-4" /> New OOS
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterState(tab.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                filterState === tab.id
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-[#141922] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-black',
                  filterState === tab.id ? 'bg-primary/30 text-primary' : 'bg-white/10 text-gray-300')}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Aircraft list */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading fleet state…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <CheckCircle className="w-10 h-10 text-green-500/40 mx-auto" />
            <p className="text-sm font-bold text-gray-400">All aircraft operational</p>
            <p className="text-xs text-gray-600">No items match the selected filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filtered.length} aircraft</p>
            {filtered.map(a => (
              <AircraftStateCard
                key={a.id}
                aircraft={a}
                melItems={melItems}
                oosEntries={oosEntries}
                onTransition={setTransitionTarget}
              />
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { icon: Activity, label: 'Fleet Dashboard',  path: '/FleetDashboard',      color: 'bg-stone-700' },
            { icon: Wrench,   label: 'MCC',              path: '/MaintenanceControl',   color: 'bg-orange-700' },
            { icon: BookOpen, label: 'E-Logbook',        path: '/TechOpsLogbook',       color: 'bg-violet-700' },
            { icon: Shield,   label: 'Inspector Mode',   path: '/InspectorMode',        color: 'bg-teal-700' },
          ].map(({ icon: Icon, label, path, color }) => (
            <Link key={path} to={path}
              className={cn('rounded-2xl flex flex-col items-center justify-center gap-2 py-5 border border-white/10 hover:brightness-110 active:scale-95 transition-all', color)}>
              <Icon className="w-5 h-5 text-white" />
              <p className="text-xs font-bold text-white text-center leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* State Transition Modal */}
      {transitionTarget && (
        <StateTransitionModal
          aircraft={transitionTarget}
          onClose={() => setTransitionTarget(null)}
          onSave={(id, update) => transitionMutation.mutate({ id, update })}
        />
      )}
    </div>
  );
}