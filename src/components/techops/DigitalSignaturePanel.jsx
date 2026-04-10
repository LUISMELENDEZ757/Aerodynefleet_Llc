/**
 * DigitalSignaturePanel
 *
 * Renders the signing UI for a LogbookEntry.
 * - Shows existing signatures with hash snippets
 * - Allows eligible roles to apply a new signature
 * - Displays a locked banner if entry is already signed
 */
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useRBAC } from '@/components/rbac/RoleGuard';
import {
  ShieldCheck, Lock, Pen, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_LABELS = {
  technician:     'A&P Technician',
  inspector_rii:  'RII Inspector',
  engineer:       'Engineer',
  mcc_supervisor: 'MCC Supervisor',
  admin:          'Administrator',
};

const SIG_TYPE_LABELS = {
  technician_signoff:  'Technician Sign-Off',
  rii_signoff:         'RII Inspector Sign-Off',
  supervisor_approval: 'Supervisor Approval',
  mcc_review:          'MCC Review',
};

const SIGNABLE_ROLES = ['technician', 'inspector_rii', 'engineer', 'mcc_supervisor', 'admin'];

function SignatureRecord({ sig, idx }) {
  const [showHash, setShowHash] = useState(false);
  return (
    <div className="bg-[#0d1117] border border-green-500/20 rounded-xl px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">{sig.signer_name || sig.signer_email}</p>
            <p className="text-[10px] text-green-400">{SIG_TYPE_LABELS[sig.signature_type] || sig.signature_type}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-gray-400">{new Date(sig.signed_at).toLocaleString()}</p>
          {sig.signer_cert && <p className="text-[10px] text-gray-500">Cert: {sig.signer_cert}</p>}
        </div>
      </div>
      <button
        onClick={() => setShowHash(v => !v)}
        className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
      >
        {showHash ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        SHA-256: {sig.content_hash?.slice(0, 16)}…
      </button>
      {showHash && (
        <p className="text-[10px] font-mono text-gray-500 break-all bg-black/30 rounded-lg px-3 py-2">
          {sig.content_hash}
        </p>
      )}
    </div>
  );
}

export default function DigitalSignaturePanel({ entry, onSigned }) {
  const { userRole, user } = useRBAC();
  const qc = useQueryClient();
  const [showSignForm, setShowSignForm] = useState(false);
  const [certNumber, setCertNumber] = useState(user?.cert_number || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSign = SIGNABLE_ROLES.includes(userRole);
  const signatures = Array.isArray(entry.digital_signatures) ? entry.digital_signatures : [];
  const isSigned = entry.is_signed || signatures.length > 0;

  // Check if current user already signed
  const alreadySigned = signatures.some(s => s.signer_email === user?.email);

  const handleSign = async () => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke('signLogbookEntry', {
      entry_id: entry.id,
      signer_cert: certNumber,
      signature_note: note,
    });
    setLoading(false);
    if (res.data?.success) {
      setShowSignForm(false);
      qc.invalidateQueries({ queryKey: ['logbook-entries'] });
      onSigned?.();
    } else {
      setError(res.data?.error || 'Signing failed');
    }
  };

  return (
    <div className="space-y-3">
      {/* Signed lock banner */}
      {isSigned && (
        <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-2.5">
          <Lock className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-extrabold text-green-400">Entry Digitally Signed — Locked</p>
            <p className="text-[10px] text-green-600">Core fields are frozen. Any modification attempt will break the signature hash.</p>
          </div>
          <span className="text-[10px] font-bold text-green-400 bg-green-500/15 px-2 py-1 rounded-full">
            {signatures.length} SIG{signatures.length !== 1 ? 'S' : ''}
          </span>
        </div>
      )}

      {/* Existing signatures */}
      {signatures.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Digital Signatures</p>
          {signatures.map((sig, idx) => <SignatureRecord key={idx} sig={sig} idx={idx} />)}
        </div>
      )}

      {/* Sign action */}
      {canSign && !alreadySigned && (
        <>
          {!showSignForm ? (
            <button
              onClick={() => setShowSignForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs font-extrabold hover:bg-primary/20 transition-colors"
            >
              <Pen className="w-3.5 h-3.5" />
              Apply Digital Signature ({ROLE_LABELS[userRole] || userRole})
            </button>
          ) : (
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-primary uppercase tracking-widest">
                  Sign as {ROLE_LABELS[userRole] || userRole}
                </p>
                <button onClick={() => setShowSignForm(false)}>
                  <X className="w-4 h-4 text-gray-500 hover:text-white" />
                </button>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                  Certificate / License # {!certNumber && <span className="text-amber-400">(recommended)</span>}
                </label>
                <input
                  value={certNumber}
                  onChange={e => setCertNumber(e.target.value)}
                  placeholder="e.g. AMT-12345 / QC-99999"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Signature Note (optional)</label>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Inspected per AMM 27-11-00"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
                />
              </div>
              <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg px-3 py-2">
                <p className="text-[10px] text-amber-400">
                  ⚠ By signing, you confirm the entry content is accurate and complete. A SHA-256 hash will be recorded and the entry will be locked.
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowSignForm(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">
                  Cancel
                </button>
                <button
                  onClick={handleSign}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <span className="animate-spin">⟳</span> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? 'Signing…' : 'Confirm & Sign'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {canSign && alreadySigned && (
        <div className="flex items-center gap-2 text-[10px] text-green-400">
          <CheckCircle className="w-3.5 h-3.5" /> You have already signed this entry
        </div>
      )}

      {!canSign && !isSigned && (
        <p className="text-[10px] text-gray-600 italic">
          Digital signing requires Technician, RII Inspector, Engineer, or Supervisor role.
        </p>
      )}
    </div>
  );
}