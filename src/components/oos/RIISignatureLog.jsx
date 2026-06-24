import { useState } from 'react';
import { Shield, CheckCircle, X, ChevronDown, ChevronUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const RTS_STEPS = [
  { key: 'work_complete',        label: 'All Discrepancies Corrected / MEL-Deferred' },
  { key: 'inspections_complete', label: 'All Inspections Completed' },
  { key: 'rii_signed',           label: 'RII Inspector Signed' },
  { key: 'ops_check',            label: 'Ops / Functional Check Passed' },
  { key: 'paperwork_complete',   label: 'All Paperwork & Signatures Complete' },
  { key: 'system_resets',        label: 'All System Resets Successful' },
  { key: 'mcc_approved',         label: 'MCC/OCC RTS Approval' },
  { key: 'qa_approved',          label: 'QA / Engineering Approved (if required)' },
  { key: 'captain_accepted',     label: 'Captain Accepted' },
];

export default function RIISignatureLog({ rts_checklist = {}, aircraftTail }) {
  const [expanded, setExpanded] = useState(false);

  const signatures = rts_checklist.step_signatures || {};
  const completedCount = RTS_STEPS.filter(s => rts_checklist[s.key]).length;
  const total = RTS_STEPS.length;
  const allDone = completedCount === total;

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <p className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">
            RII Signature Audit Log
          </p>
          <span className={cn(
            'text-[10px] font-black px-2 py-0.5 rounded-full',
            allDone ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'
          )}>
            {allDone ? 'COMPLETE' : `${total - completedCount} PENDING`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">{completedCount}/{total}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Step list */}
      {expanded && (
        <div className="border-t border-violet-500/20 divide-y divide-white/5">
          {RTS_STEPS.map(({ key, label }) => {
            const done = !!rts_checklist[key];
            const sig = signatures[key];
            return (
              <div key={key} className={cn(
                'flex items-start gap-3 px-4 py-2.5',
                done ? 'bg-green-900/10' : 'bg-red-900/5'
              )}>
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  done ? 'bg-green-500' : 'bg-red-900/40'
                )}>
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                    : <X className="w-3 h-3 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-bold leading-snug', done ? 'text-green-200' : 'text-gray-500')}>
                    {label}
                  </p>
                  {sig ? (
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <User className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
                      <span className="text-[10px] text-violet-300 font-mono">{sig.name}</span>
                      {sig.cert && <span className="text-[10px] text-gray-500">· {sig.cert}</span>}
                      {sig.signed_at && (
                        <span className="text-[10px] text-gray-600">
                          · {new Date(sig.signed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}Z
                        </span>
                      )}
                    </div>
                  ) : done ? (
                    <p className="text-[10px] text-gray-600 mt-0.5 italic">No signer captured</p>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Released by footer */}
          {rts_checklist.released_by && (
            <div className="px-4 py-3 bg-emerald-900/20 border-t border-emerald-700/30">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Final Release Sign-off</p>
              <p className="text-xs text-emerald-200 font-mono">{rts_checklist.released_by}</p>
              {rts_checklist.released_at && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {new Date(rts_checklist.released_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}