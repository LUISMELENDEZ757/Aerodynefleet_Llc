/**
 * LogEntryCard — FAA-grade logbook entry card
 * Displays every log page with a structured Header / Body / Footer layout.
 * Handles all entry types: discrepancy, corrective_action, deferred, cleared, info.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, Wrench, Shield, CheckCircle, ChevronDown, ChevronUp,
  Clock, User, Tag, RotateCcw, Play, Send, XCircle, Lock, Zap,
  FileText, Package, Camera, MessageSquare, Calendar, MapPin,
  TrendingUp, AlertCircle, Info
} from 'lucide-react';
import DigitalSignaturePanel from '@/components/techops/DigitalSignaturePanel';
import { cn } from '@/lib/utils';

// ── Status config ────────────────────────────────────────────────────────────
const STATE_CFG = {
  OPEN:        { label: 'OPEN',         bg: 'bg-red-600',     border: 'border-red-500/40',    text: 'text-red-400',    icon: AlertTriangle },
  IN_PROGRESS: { label: 'IN PROGRESS',  bg: 'bg-amber-600',   border: 'border-amber-500/40',  text: 'text-amber-400',  icon: Wrench },
  PENDING_RII: { label: 'PENDING RII',  bg: 'bg-violet-600',  border: 'border-violet-500/40', text: 'text-violet-400', icon: Shield },
  CLOSED:      { label: 'CLOSED',       bg: 'bg-green-700',   border: 'border-green-500/40',  text: 'text-green-400',  icon: CheckCircle },
};

const ENTRY_TYPE_CFG = {
  discrepancy:       { label: 'DISCREPANCY',       border: 'border-red-500/40',    text: 'text-red-400',    bg: 'bg-red-600' },
  corrective_action: { label: 'CORRECTIVE ACTION', border: 'border-green-500/40',  text: 'text-green-400',  bg: 'bg-green-700' },
  deferred:          { label: 'DEFERRED',          border: 'border-amber-500/40',  text: 'text-amber-400',  bg: 'bg-amber-700' },
  cleared:           { label: 'CLEARED',           border: 'border-blue-500/40',   text: 'text-blue-400',   bg: 'bg-blue-700' },
  info:              { label: 'INFO / SERVICE',     border: 'border-gray-500/40',   text: 'text-gray-400',   bg: 'bg-gray-700' },
};

const SEVERITY_CFG = {
  aog:   { label: 'AOG',   bg: 'bg-red-600',    text: 'text-red-100' },
  mel:   { label: 'MEL',   bg: 'bg-amber-600',  text: 'text-amber-100' },
  cabin: { label: 'CABIN', bg: 'bg-blue-600',   text: 'text-blue-100' },
  ops:   { label: 'OPS',   bg: 'bg-orange-600', text: 'text-orange-100' },
  info:  { label: 'INFO',  bg: 'bg-gray-600',   text: 'text-gray-100' },
};

// ── MEL expiry badge ─────────────────────────────────────────────────────────
function MelExpiryBadge({ expiryDate }) {
  if (!expiryDate) return null;
  const now = Date.now();
  const exp = new Date(expiryDate).getTime();
  const hoursLeft = (exp - now) / 3600000;
  const isExpired = hoursLeft <= 0;
  const isUrgent = hoursLeft > 0 && hoursLeft <= 24;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border',
      isExpired ? 'bg-red-900/60 border-red-500/50 text-red-300' :
      isUrgent  ? 'bg-amber-900/60 border-amber-500/50 text-amber-300 animate-pulse' :
                  'bg-gray-800 border-gray-600/50 text-gray-400'
    )}>
      <Clock className="w-2.5 h-2.5" />
      {isExpired
        ? 'EXPIRED'
        : isUrgent
        ? `${Math.ceil(hoursLeft)}h left`
        : new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    </span>
  );
}

// ── Timeline steps ───────────────────────────────────────────────────────────
function EntryTimeline({ entry }) {
  const steps = [
    { key: 'created',    label: 'Created',    ts: entry.created_date, always: true },
    { key: 'started',    label: 'In Work',    ts: entry.work_started_at },
    { key: 'deferred',   label: 'Deferred',   ts: entry.is_deferred ? entry.created_date : null },
    { key: 'rts',        label: 'Corrected',  ts: entry.work_completed_at },
    { key: 'rii',        label: 'RII Signed', ts: entry.rii_signed_at },
    { key: 'closed',     label: 'Closed',     ts: entry.is_cleared ? entry.cleared_date : null },
  ].filter(s => s.always || s.ts);

  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide py-1">
      {steps.map((step, i) => {
        const isDone = !!step.ts;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className="flex items-center gap-0 flex-shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center border',
                isDone ? 'bg-primary border-primary' : 'bg-[#1a1f2e] border-white/20'
              )}>
                <div className={cn('w-1.5 h-1.5 rounded-full', isDone ? 'bg-white' : 'bg-gray-600')} />
              </div>
              <span className="text-[8px] text-gray-500 whitespace-nowrap">{step.label}</span>
            </div>
            {!isLast && <div className={cn('w-6 h-px mb-3', isDone ? 'bg-primary/50' : 'bg-white/10')} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Input helpers ────────────────────────────────────────────────────────────
function SectionInput({ label, value, onChange, placeholder, rows = 2 }) {
  const cls = "w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
      {rows > 1
        ? <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} className={cn(cls, 'resize-none')} />
        : <input value={value} onChange={onChange} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs text-gray-200">{value}</p>
    </div>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────
export default function LogEntryCard({ entry, viewRole = 'mx' }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState(null);
  const [progressForm, setProgressForm] = useState({ troubleshooting_notes: entry.troubleshooting_notes || '', parts_used: entry.parts_used || '' });
  const [correctionForm, setCorrectionForm] = useState({ corrective_action: '', corrected_by: '', corrected_by_id: '', rii_required: false });
  const [riiForm, setRiiForm] = useState({ rii_inspector_name: '', rii_inspector_id: '' });
  const [riiRejectForm, setRiiRejectForm] = useState({ rii_rejection_reason: '' });
  const [reopenForm, setReopenForm] = useState({ reopen_reason: '' });

  const isDiscrepancy = entry.entry_type === 'discrepancy';
  const status = entry.discrepancy_status || 'OPEN';
  const stateCfg = isDiscrepancy ? (STATE_CFG[status] || STATE_CFG.OPEN) : null;
  const typeCfg = ENTRY_TYPE_CFG[entry.entry_type] || ENTRY_TYPE_CFG.info;
  const borderCls = isDiscrepancy ? stateCfg.border : typeCfg.border;
  const isSigned = entry.is_signed || (Array.isArray(entry.digital_signatures) && entry.digital_signatures.length > 0);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      if (isSigned) throw new Error('Entry is digitally signed and locked.');
      return base44.entities.LogbookEntry.update(entry.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
      setAction(null);
    },
  });

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleBeginWork = () => updateMutation.mutate({ discrepancy_status: 'IN_PROGRESS', work_started_at: new Date().toISOString() });
  const handleSaveProgress = () => updateMutation.mutate({ troubleshooting_notes: progressForm.troubleshooting_notes, parts_used: progressForm.parts_used });
  const handleSubmitCorrection = () => {
    if (!correctionForm.corrective_action || !correctionForm.corrected_by) return;
    const next = correctionForm.rii_required ? 'PENDING_RII' : 'CLOSED';
    updateMutation.mutate({
      discrepancy_status: next,
      corrective_action: correctionForm.corrective_action,
      corrected_by: correctionForm.corrected_by,
      corrected_by_id: correctionForm.corrected_by_id,
      rii_required: correctionForm.rii_required,
      work_completed_at: new Date().toISOString(),
      is_cleared: next === 'CLOSED',
      cleared_by: next === 'CLOSED' ? correctionForm.corrected_by : '',
      cleared_date: next === 'CLOSED' ? new Date().toISOString().split('T')[0] : '',
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
  const handleRiiReject = () => updateMutation.mutate({ discrepancy_status: 'IN_PROGRESS', rii_rejected: true, rii_rejection_reason: riiRejectForm.rii_rejection_reason });
  const handleReopen = () => updateMutation.mutate({ discrepancy_status: 'OPEN', is_cleared: false, corrective_action: '', reopened_by: 'MCC', reopened_at: new Date().toISOString(), reopen_reason: reopenForm.reopen_reason });

  const entryDate = new Date(entry.created_date);
  const utcStr = entryDate.toISOString().slice(0, 16).replace('T', ' ') + 'Z';
  const localStr = entryDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className={cn('rounded-2xl border bg-[#141922] overflow-hidden shadow-md transition-all', borderCls)}>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Row 1: LP# + type badge + severity */}
          <div className="flex items-center gap-2 flex-wrap">
            {entry.log_page && (
              <span className="text-base font-black text-primary font-mono tracking-wider bg-primary/10 border border-primary/30 px-3 py-0.5 rounded-lg">
                {entry.log_page}
              </span>
            )}
            {isDiscrepancy ? (
              <span className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white', stateCfg.bg)}>
                {stateCfg.label}
              </span>
            ) : (
              <span className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white', typeCfg.bg)}>
                {typeCfg.label}
              </span>
            )}
            {entry.ata_chapter && (
              <span className="text-[10px] font-bold text-gray-400 bg-[#1a1f2e] border border-white/10 px-2 py-0.5 rounded">
                ATA {entry.ata_chapter}
              </span>
            )}
            {entry.is_deferred && !entry.is_cleared && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> MEL-{entry.mel_category} {entry.mel_reference}
              </span>
            )}
            {entry.rii_required && status !== 'CLOSED' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> RII REQUIRED
              </span>
            )}
            {entry.is_cleared && (
              <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> CLEARED
              </span>
            )}
            {isSigned && (
              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> SIGNED
              </span>
            )}
          </div>

          {/* Row 2: Date/Time + Station + Reporter */}
          <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-2.5 h-2.5" /> {utcStr}
            </span>
            <span className="text-gray-700">·</span>
            <span className="text-gray-600">{localStr} LT</span>
            {entry.station && (
              <>
                <span className="text-gray-700">·</span>
                <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{entry.station}</span>
              </>
            )}
            {entry.flight_number && (
              <>
                <span className="text-gray-700">·</span>
                <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" />{entry.flight_number}</span>
              </>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(e => !e)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 flex-shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <div className="px-5 pb-3 space-y-2">
        {/* Discrepancy text */}
        <p className="text-sm font-semibold text-gray-100 leading-snug">{entry.description}</p>

        {/* Corrective action (compact) */}
        {entry.corrective_action && !expanded && (
          <p className="text-xs text-green-400 flex items-start gap-1.5">
            <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {entry.corrective_action}
          </p>
        )}

        {/* Footer meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          {entry.technician_name && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <User className="w-2.5 h-2.5" /> {entry.technician_name}{entry.technician_id ? ` · ${entry.technician_id}` : ''}
            </span>
          )}
          {entry.work_started_at && (
            <span className="text-[10px] text-amber-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Started {new Date(entry.work_started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}Z
            </span>
          )}
          {entry.mel_reference && entry.is_deferred && <MelExpiryBadge expiryDate={entry.cleared_date} />}
          {entry.reopened_at && (
            <span className="text-[10px] text-orange-400 flex items-center gap-1">
              <RotateCcw className="w-2.5 h-2.5" /> Reopened by MCC
            </span>
          )}
        </div>
      </div>

      {/* ══ QUICK ACTION FOOTER (visible without expand) ═════════════════════ */}
      {isDiscrepancy && status === 'OPEN' && !expanded && (
        <div className="px-5 pb-3">
          <button
            onClick={() => { setExpanded(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-600/30 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> BEGIN WORK
          </button>
        </div>
      )}

      {/* ══ EXPANDED DETAIL ══════════════════════════════════════════════════ */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/8 pt-4">

          {/* Timeline */}
          <div>
            <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-widest mb-2">Timeline</p>
            <EntryTimeline entry={entry} />
          </div>

          {/* Existing details grid */}
          {(entry.corrective_action || entry.corrected_by || entry.troubleshooting_notes || entry.parts_used || entry.rii_inspector_name) && (
            <div className="grid grid-cols-2 gap-3 bg-[#0d1117] rounded-xl p-4 border border-white/8">
              <Field label="Corrective Action" value={entry.corrective_action} />
              <Field label="Corrected By" value={entry.corrected_by ? `${entry.corrected_by}${entry.corrected_by_id ? ` · ${entry.corrected_by_id}` : ''}` : null} />
              <Field label="Troubleshooting Notes" value={entry.troubleshooting_notes} />
              <Field label="Parts Used" value={entry.parts_used} />
              <Field label="RII Inspector" value={entry.rii_inspector_name ? `${entry.rii_inspector_name}${entry.rii_inspector_id ? ` · ${entry.rii_inspector_id}` : ''}` : null} />
              <Field label="RII Signed" value={entry.rii_signed_at ? new Date(entry.rii_signed_at).toLocaleString() : null} />
              <Field label="Reopen Reason" value={entry.reopen_reason} />
              <Field label="Captain Accepted" value={entry.captain_accepted ? `Yes — ${entry.captain_signature || ''}` : null} />
            </div>
          )}

          {/* Role-segmented view sections */}
          {viewRole === 'dispatch' && entry.is_deferred && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Dispatch Impact</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="MEL Reference" value={entry.mel_reference} />
                <Field label="MEL Category" value={entry.mel_category ? `CAT ${entry.mel_category}` : null} />
                <Field label="Deferral Expires" value={entry.cleared_date || 'See MEL'} />
                <Field label="Dispatch Status" value={entry.is_cleared ? 'Cleared — No restrictions' : 'Active Deferral — Review before release'} />
              </div>
            </div>
          )}

          {/* ── Action area (MX only) ──────────────────────────────────────── */}
          {viewRole !== 'pilot' && isDiscrepancy && (
            <>
              {/* OPEN → Begin Work */}
              {status === 'OPEN' && (
                <button
                  onClick={handleBeginWork}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-extrabold hover:bg-amber-500 transition-colors disabled:opacity-50 w-full justify-center"
                >
                  <Play className="w-4 h-4" /> BEGIN CORRECTIVE ACTION
                </button>
              )}

              {/* IN_PROGRESS → Notes + Submit */}
              {status === 'IN_PROGRESS' && (
                <div className="space-y-3">
                  {action !== 'correct' ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button onClick={() => setAction('correct')}
                          className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-extrabold hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                          <Send className="w-4 h-4" /> SUBMIT CORRECTION
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                      <p className="text-xs font-extrabold text-green-400 uppercase tracking-widest">Submit Corrective Action</p>
                      <SectionInput label="Corrective Action *" rows={3} value={correctionForm.corrective_action}
                        onChange={e => setCorrectionForm(p => ({ ...p, corrective_action: e.target.value }))} placeholder="Describe the corrective action performed…" />
                      <div className="grid grid-cols-2 gap-3">
                        <SectionInput label="Corrected By *" rows={1} value={correctionForm.corrected_by}
                          onChange={e => setCorrectionForm(p => ({ ...p, corrected_by: e.target.value }))} placeholder="Technician name" />
                        <SectionInput label="License / AMT ID" rows={1} value={correctionForm.corrected_by_id}
                          onChange={e => setCorrectionForm(p => ({ ...p, corrected_by_id: e.target.value }))} placeholder="AMT-12345" />
                      </div>
                      <label className="flex items-center gap-3 bg-violet-900/20 border border-violet-500/30 rounded-xl px-4 py-3 cursor-pointer">
                        <input type="checkbox" checked={correctionForm.rii_required}
                          onChange={e => setCorrectionForm(p => ({ ...p, rii_required: e.target.checked }))} className="w-4 h-4 rounded" />
                        <div>
                          <p className="text-sm font-bold text-violet-300">Requires RII Sign-Off</p>
                          <p className="text-[10px] text-violet-400/70">Inspector must verify before closure</p>
                        </div>
                      </label>
                      <div className="flex gap-2">
                        <button onClick={() => setAction(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                        <button onClick={handleSubmitCorrection}
                          disabled={updateMutation.isPending || !correctionForm.corrective_action || !correctionForm.corrected_by}
                          className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-extrabold hover:bg-green-600 disabled:opacity-50 transition-colors">
                          {correctionForm.rii_required ? 'Submit → Awaiting RII' : 'Submit → Close'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PENDING_RII */}
              {status === 'PENDING_RII' && (
                <div className="space-y-3">
                  <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl px-4 py-3 text-xs text-violet-300">
                    <p className="font-bold mb-1">Awaiting RII Inspector Sign-Off</p>
                    <p className="text-violet-400/70">Corrective action submitted. RII inspector must verify before closure.</p>
                  </div>
                  {action === 'rii_signoff' ? (
                    <div className="space-y-3 bg-violet-900/20 border border-violet-500/30 rounded-xl p-4">
                      <p className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">RII Inspector Sign-Off</p>
                      <div className="grid grid-cols-2 gap-3">
                        <SectionInput label="Inspector Name *" rows={1} value={riiForm.rii_inspector_name} onChange={e => setRiiForm(p => ({ ...p, rii_inspector_name: e.target.value }))} placeholder="Inspector name" />
                        <SectionInput label="Inspector ID" rows={1} value={riiForm.rii_inspector_id} onChange={e => setRiiForm(p => ({ ...p, rii_inspector_id: e.target.value }))} placeholder="QC-99999" />
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

              {/* CLOSED: MCC Reopen */}
              {status === 'CLOSED' && (
                <div className="space-y-2">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3 text-xs text-green-400 font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Discrepancy closed. Log page frozen for audit trail.
                  </div>
                  {action === 'reopen' ? (
                    <div className="space-y-3 bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                      <p className="text-xs font-extrabold text-orange-400 uppercase tracking-widest">MCC Reopen</p>
                      <SectionInput label="Reason for Reopen" rows={2} value={reopenForm.reopen_reason} onChange={e => setReopenForm(p => ({ ...p, reopen_reason: e.target.value }))} placeholder="State reason for reopening…" />
                      <div className="flex gap-2">
                        <button onClick={() => setAction(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                        <button onClick={handleReopen} disabled={updateMutation.isPending || isSigned}
                          className="flex-1 py-2.5 rounded-xl bg-orange-700 text-white text-sm font-extrabold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                          <RotateCcw className="w-4 h-4 inline mr-1" /> REOPEN
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAction('reopen')} disabled={isSigned}
                      className="w-full py-2 rounded-xl border border-orange-500/30 bg-orange-900/10 text-orange-400 text-xs font-bold hover:bg-orange-900/20 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5" /> MCC REOPEN
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Digital Signature */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Digital Signature & Audit Lock
            </p>
            <DigitalSignaturePanel
              entry={entry}
              onSigned={() => queryClient.invalidateQueries({ queryKey: ['logbook-entries'] })}
            />
          </div>
        </div>
      )}
    </div>
  );
}