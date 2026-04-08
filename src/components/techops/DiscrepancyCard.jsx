import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, Wrench, Shield, CheckCircle, ChevronDown, ChevronUp,
  Clock, User, Tag, RotateCcw, Play, Send, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATE_CFG = {
  OPEN:        { label: 'OPEN',         bg: 'bg-red-600',     border: 'border-red-500/50',    text: 'text-red-400',    glow: 'shadow-red-500/20',    icon: AlertTriangle },
  IN_PROGRESS: { label: 'IN PROGRESS',  bg: 'bg-amber-600',   border: 'border-amber-500/50',  text: 'text-amber-400',  glow: 'shadow-amber-500/20',  icon: Wrench },
  PENDING_RII: { label: 'PENDING RII',  bg: 'bg-violet-600',  border: 'border-violet-500/50', text: 'text-violet-400', glow: 'shadow-violet-500/20', icon: Shield },
  CLOSED:      { label: 'CLOSED',       bg: 'bg-green-700',   border: 'border-green-500/50',  text: 'text-green-400',  glow: 'shadow-green-500/20',  icon: CheckCircle },
};

function Field({ label, value, placeholder = '—' }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs text-gray-200">{value || placeholder}</p>
    </div>
  );
}

function SectionInput({ label, value, onChange, placeholder, rows = 2, type = 'text' }) {
  const cls = "w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
      {rows > 1
        ? <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} className={cls + ' resize-none'} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

export default function DiscrepancyCard({ entry, aircraftTail, userRole = 'technician' }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [progressForm, setProgressForm] = useState({ troubleshooting_notes: '', parts_used: '' });
  const [correctionForm, setCorrectionForm] = useState({ corrective_action: '', corrected_by: '', corrected_by_id: '', rii_required: false });
  const [riiForm, setRiiForm] = useState({ rii_inspector_name: '', rii_inspector_id: '' });
  const [riiRejectForm, setRiiRejectForm] = useState({ rii_rejection_reason: '' });
  const [reopenForm, setReopenForm] = useState({ reopen_reason: '' });
  const [action, setAction] = useState(null); // 'correct' | 'rii_signoff' | 'rii_reject' | 'reopen'

  const status = entry.discrepancy_status || 'OPEN';
  const cfg = STATE_CFG[status] || STATE_CFG.OPEN;
  const StatusIcon = cfg.icon;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.update(entry.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
      setAction(null);
    },
  });

  const handleBeginWork = () => {
    updateMutation.mutate({
      discrepancy_status: 'IN_PROGRESS',
      work_started_at: new Date().toISOString(),
    });
  };

  const handleSubmitCorrection = () => {
    if (!correctionForm.corrective_action || !correctionForm.corrected_by) return;
    const nextStatus = correctionForm.rii_required ? 'PENDING_RII' : 'CLOSED';
    updateMutation.mutate({
      discrepancy_status: nextStatus,
      corrective_action: correctionForm.corrective_action,
      corrected_by: correctionForm.corrected_by,
      corrected_by_id: correctionForm.corrected_by_id,
      rii_required: correctionForm.rii_required,
      work_completed_at: new Date().toISOString(),
      is_cleared: nextStatus === 'CLOSED',
      cleared_by: nextStatus === 'CLOSED' ? correctionForm.corrected_by : '',
      cleared_date: nextStatus === 'CLOSED' ? new Date().toISOString().split('T')[0] : '',
    });
  };

  const handleSaveProgress = () => {
    updateMutation.mutate({
      troubleshooting_notes: progressForm.troubleshooting_notes,
      parts_used: progressForm.parts_used,
    });
  };

  const handleRiiSignoff = () => {
    if (!riiForm.rii_inspector_name) return;
    updateMutation.mutate({
      discrepancy_status: 'CLOSED',
      rii_inspector_name: riiForm.rii_inspector_name,
      rii_inspector_id: riiForm.rii_inspector_id,
      rii_signed_at: new Date().toISOString(),
      is_cleared: true,
      cleared_by: riiForm.rii_inspector_name,
      cleared_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleRiiReject = () => {
    updateMutation.mutate({
      discrepancy_status: 'IN_PROGRESS',
      rii_rejected: true,
      rii_rejection_reason: riiRejectForm.rii_rejection_reason,
    });
  };

  const handleReopen = () => {
    updateMutation.mutate({
      discrepancy_status: 'OPEN',
      is_cleared: false,
      corrective_action: '',
      reopened_by: 'MCC',
      reopened_at: new Date().toISOString(),
      reopen_reason: reopenForm.reopen_reason,
    });
  };

  return (
    <div className={cn('rounded-2xl border bg-[#141922] overflow-hidden shadow-lg', cfg.border, cfg.glow, 'shadow-md')}>
      {/* Header Row */}
      <div className="flex items-start justify-between px-5 py-4 gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status pulse for OPEN */}
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg, status === 'OPEN' && 'animate-pulse')}>
            <StatusIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white', cfg.bg)}>{cfg.label}</span>
              {entry.log_page && <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded">{entry.log_page}</span>}
              {entry.ata_chapter && <span className="text-[10px] text-gray-500">ATA {entry.ata_chapter}</span>}
              {entry.station && <span className="text-[10px] text-gray-600">{entry.station}</span>}
            </div>
            <p className="text-sm font-semibold text-gray-100 leading-snug">{entry.description}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {entry.technician_name && (
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <User className="w-2.5 h-2.5" /> {entry.technician_name}
                  {entry.technician_id && ` · ${entry.technician_id}`}
                </span>
              )}
              {entry.work_started_at && (
                <span className="text-[10px] text-amber-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Work started {new Date(entry.work_started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              )}
              {entry.is_deferred && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> MEL {entry.mel_category} {entry.mel_reference}
                </span>
              )}
              {entry.rii_required && status !== 'CLOSED' && (
                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">RII REQUIRED</span>
              )}
              {entry.reopened_at && (
                <span className="text-[10px] text-orange-400 flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" /> Reopened by MCC
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          {/* Existing details */}
          {(entry.corrective_action || entry.corrected_by || entry.troubleshooting_notes || entry.parts_used) && (
            <div className="grid grid-cols-2 gap-3 bg-[#0d1117] rounded-xl p-4 border border-white/8">
              {entry.corrective_action && <Field label="Corrective Action" value={entry.corrective_action} />}
              {entry.corrected_by && <Field label="Corrected By" value={`${entry.corrected_by}${entry.corrected_by_id ? ` · ${entry.corrected_by_id}` : ''}`} />}
              {entry.troubleshooting_notes && <Field label="Troubleshooting Notes" value={entry.troubleshooting_notes} />}
              {entry.parts_used && <Field label="Parts Used" value={entry.parts_used} />}
              {entry.rii_inspector_name && <Field label="RII Inspector" value={`${entry.rii_inspector_name}${entry.rii_inspector_id ? ` · ${entry.rii_inspector_id}` : ''}`} />}
              {entry.rii_signed_at && <Field label="RII Signed" value={new Date(entry.rii_signed_at).toLocaleString()} />}
              {entry.reopen_reason && <Field label="Reopen Reason" value={entry.reopen_reason} />}
            </div>
          )}

          {/* ── OPEN: Begin Work ── */}
          {status === 'OPEN' && (
            <button
              onClick={handleBeginWork}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-extrabold hover:bg-amber-500 transition-colors disabled:opacity-50 w-full justify-center"
            >
              <Play className="w-4 h-4" /> BEGIN CORRECTIVE ACTION
            </button>
          )}

          {/* ── IN_PROGRESS: Add notes + Submit ── */}
          {status === 'IN_PROGRESS' && (
            <div className="space-y-3">
              {action !== 'correct' ? (
                <div className="space-y-3">
                  <SectionInput label="Troubleshooting Notes" rows={2} value={progressForm.troubleshooting_notes} onChange={e => setProgressForm(p => ({ ...p, troubleshooting_notes: e.target.value }))} placeholder="Add troubleshooting details, test results..." />
                  <SectionInput label="Parts Used" rows={1} value={progressForm.parts_used} onChange={e => setProgressForm(p => ({ ...p, parts_used: e.target.value }))} placeholder="P/N, qty, description..." />
                  <div className="flex gap-2">
                    <button onClick={handleSaveProgress} disabled={updateMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/15 transition-colors disabled:opacity-50">
                      Save Notes
                    </button>
                    <button onClick={() => setAction('correct')} className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-extrabold hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> SUBMIT CORRECTION
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                  <p className="text-xs font-extrabold text-green-400 uppercase tracking-widest">Submit Corrective Action</p>
                  <SectionInput label="Corrective Action *" rows={3} value={correctionForm.corrective_action} onChange={e => setCorrectionForm(p => ({ ...p, corrective_action: e.target.value }))} placeholder="Describe the corrective action performed..." />
                  <div className="grid grid-cols-2 gap-3">
                    <SectionInput label="Corrected By *" rows={1} value={correctionForm.corrected_by} onChange={e => setCorrectionForm(p => ({ ...p, corrected_by: e.target.value }))} placeholder="Technician name" />
                    <SectionInput label="Tech ID / License" rows={1} value={correctionForm.corrected_by_id} onChange={e => setCorrectionForm(p => ({ ...p, corrected_by_id: e.target.value }))} placeholder="e.g. AMT-12345" />
                  </div>
                  <label className="flex items-center gap-3 bg-violet-900/20 border border-violet-500/30 rounded-xl px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={correctionForm.rii_required} onChange={e => setCorrectionForm(p => ({ ...p, rii_required: e.target.checked }))} className="w-4 h-4 rounded" />
                    <div>
                      <p className="text-sm font-bold text-violet-300">Requires RII Sign-Off</p>
                      <p className="text-[10px] text-violet-400/70">Required Inspection Item — inspector must verify before closure</p>
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleSubmitCorrection} disabled={updateMutation.isPending || !correctionForm.corrective_action || !correctionForm.corrected_by}
                      className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-extrabold hover:bg-green-600 disabled:opacity-50 transition-colors">
                      {correctionForm.rii_required ? 'Submit → Awaiting RII' : 'Submit → Close'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PENDING_RII ── */}
          {status === 'PENDING_RII' && (
            <div className="space-y-3">
              <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl px-4 py-3 text-xs text-violet-300">
                <p className="font-bold mb-1">Awaiting RII Inspector Sign-Off</p>
                <p className="text-violet-400/70">The corrective action has been submitted. An RII inspector must verify and sign off before this discrepancy can be closed.</p>
              </div>
              {action === 'rii_signoff' ? (
                <div className="space-y-3 bg-violet-900/20 border border-violet-500/30 rounded-xl p-4">
                  <p className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">RII Inspector Sign-Off</p>
                  <div className="grid grid-cols-2 gap-3">
                    <SectionInput label="Inspector Name *" rows={1} value={riiForm.rii_inspector_name} onChange={e => setRiiForm(p => ({ ...p, rii_inspector_name: e.target.value }))} placeholder="Inspector full name" />
                    <SectionInput label="Inspector ID / License" rows={1} value={riiForm.rii_inspector_id} onChange={e => setRiiForm(p => ({ ...p, rii_inspector_id: e.target.value }))} placeholder="e.g. QC-99999" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleRiiSignoff} disabled={updateMutation.isPending || !riiForm.rii_inspector_name}
                      className="flex-1 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-extrabold hover:bg-violet-600 disabled:opacity-50 transition-colors">
                      <Shield className="w-4 h-4 inline mr-1" /> SIGN OFF → CLOSE
                    </button>
                  </div>
                </div>
              ) : action === 'rii_reject' ? (
                <div className="space-y-3 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                  <p className="text-xs font-extrabold text-red-400 uppercase tracking-widest">Reject Correction</p>
                  <SectionInput label="Rejection Reason" rows={2} value={riiRejectForm.rii_rejection_reason} onChange={e => setRiiRejectForm(p => ({ ...p, rii_rejection_reason: e.target.value }))} placeholder="Why is the correction being rejected?" />
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleRiiReject} disabled={updateMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-sm font-extrabold hover:bg-red-600 disabled:opacity-50 transition-colors">
                      <XCircle className="w-4 h-4 inline mr-1" /> REJECT → BACK TO WORK
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setAction('rii_reject')} className="flex-1 py-2.5 rounded-xl border border-red-600/50 bg-red-900/20 text-red-400 text-sm font-bold hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> REJECT
                  </button>
                  <button onClick={() => setAction('rii_signoff')} className="flex-1 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-extrabold hover:bg-violet-600 transition-colors flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" /> RII SIGN-OFF
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── CLOSED: MCC Reopen ── */}
          {status === 'CLOSED' && (
            <div className="space-y-2">
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3 text-xs text-green-400 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Discrepancy closed and logged. Log page frozen for audit.
              </div>
              {action === 'reopen' ? (
                <div className="space-y-3 bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                  <p className="text-xs font-extrabold text-orange-400 uppercase tracking-widest">MCC Reopen Discrepancy</p>
                  <SectionInput label="Reason for Reopen" rows={2} value={reopenForm.reopen_reason} onChange={e => setReopenForm(p => ({ ...p, reopen_reason: e.target.value }))} placeholder="State reason for reopening this discrepancy..." />
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                    <button onClick={handleReopen} disabled={updateMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl bg-orange-700 text-white text-sm font-extrabold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                      <RotateCcw className="w-4 h-4 inline mr-1" /> REOPEN
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAction('reopen')} className="w-full py-2 rounded-xl border border-orange-500/30 bg-orange-900/10 text-orange-400 text-xs font-bold hover:bg-orange-900/20 transition-colors flex items-center justify-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> MCC REOPEN
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}