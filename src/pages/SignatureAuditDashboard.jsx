import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ShieldCheck, ShieldAlert, Search, RefreshCw,
  CheckCircle, AlertTriangle, Clock, Lock, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleGuard from '@/components/rbac/RoleGuard';

const INTEGRITY_CFG = {
  VALID:    { color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30', icon: ShieldCheck },
  TAMPERED: { color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',   icon: ShieldAlert },
  UNSIGNED: { color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',  icon: Lock },
  PENDING:  { color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30', icon: Clock },
};

function IntegrityBadge({ status }) {
  const cfg = INTEGRITY_CFG[status] || INTEGRITY_CFG.UNSIGNED;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
}

function EntryRow({ entry, onVerify, verifyResult, isVerifying }) {
  const [expanded, setExpanded] = useState(false);
  const sigs = Array.isArray(entry.digital_signatures) ? entry.digital_signatures : [];
  const isSigned = entry.is_signed || sigs.length > 0;

  const integrityStatus = verifyResult
    ? verifyResult.overall_integrity
    : isSigned ? 'PENDING' : 'UNSIGNED';

  const cfg = INTEGRITY_CFG[integrityStatus] || INTEGRITY_CFG.UNSIGNED;

  return (
    <div className={cn('bg-card border rounded-2xl overflow-hidden', cfg.border)}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <IntegrityBadge status={integrityStatus} />
            {entry.log_page && <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">{entry.log_page}</span>}
            <span className="text-xs font-mono font-bold text-primary">{entry.aircraft_tail}</span>
            {entry.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {entry.ata_chapter}</span>}
          </div>
          <p className="text-sm text-foreground leading-snug truncate">{entry.description}</p>
          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
            <span>{sigs.length} signature{sigs.length !== 1 ? 's' : ''}</span>
            <span>{new Date(entry.created_date).toLocaleDateString()}</span>
            {entry.technician_name && <span>by {entry.technician_name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isSigned && (
            <button
              onClick={() => onVerify(entry.id)}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition-colors disabled:opacity-50"
            >
              {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              Verify
            </button>
          )}
          {sigs.length > 0 && (
            <button onClick={() => setExpanded(e => !e)} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center">
              <ChevronLeft className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && '-rotate-90')} />
            </button>
          )}
        </div>
      </div>

      {expanded && sigs.length > 0 && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Signature Records</p>
          {sigs.map((sig, idx) => {
            const sigResult = verifyResult?.signatures?.[idx];
            return (
              <div key={idx} className={cn('rounded-xl px-3 py-2.5 border text-xs space-y-1',
                sigResult ? (sigResult.hash_match ? 'bg-green-900/20 border-green-500/20' : 'bg-red-900/20 border-red-500/30') : 'bg-secondary/50 border-border')}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{sig.signer_name || sig.signer_email}</span>
                  {sigResult && (
                    <span className={cn('text-[10px] font-extrabold', sigResult.hash_match ? 'text-green-400' : 'text-red-400')}>
                      {sigResult.hash_match ? '✓ HASH MATCH' : '⚠ HASH MISMATCH'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <span>{sig.signer_role}</span>
                  {sig.signer_cert && <span>Cert: {sig.signer_cert}</span>}
                  <span>{new Date(sig.signed_at).toLocaleString()}</span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  SHA-256: {sig.content_hash?.slice(0, 32)}…
                </p>
                {sigResult && !sigResult.hash_match && (
                  <div className="bg-red-900/30 rounded-lg px-3 py-2 text-[10px] text-red-400 font-bold">
                    ⚠ TAMPER DETECTED — Current hash does not match signature hash. Entry may have been modified after signing.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Verification detail */}
      {verifyResult && verifyResult.overall_integrity === 'TAMPERED' && (
        <div className="border-t border-red-500/30 bg-red-900/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-red-400">INTEGRITY VIOLATION DETECTED</p>
              <p className="text-[10px] text-red-300 mt-0.5">
                Current hash: <span className="font-mono">{verifyResult.current_hash?.slice(0, 32)}…</span>
              </p>
              <p className="text-[10px] text-red-400 mt-1">This entry was modified after signing. Immediate MCC review required.</p>
            </div>
          </div>
        </div>
      )}

      {verifyResult && verifyResult.overall_integrity === 'VALID' && (
        <div className="border-t border-green-500/20 bg-green-900/10 px-4 py-2 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          <p className="text-[10px] text-green-400 font-bold">All signatures verified — entry integrity confirmed</p>
          <span className="text-[10px] text-muted-foreground ml-auto">Checked {new Date(verifyResult.checked_at).toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

export default function SignatureAuditDashboard() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('signed');
  const [verifyResults, setVerifyResults] = useState({}); // entry_id -> result
  const [verifyingId, setVerifyingId] = useState(null);

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['sig-audit-entries'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const signed = entries.filter(e => e.is_signed || (Array.isArray(e.digital_signatures) && e.digital_signatures.length > 0));
  const unsigned = entries.filter(e => !e.is_signed && (!Array.isArray(e.digital_signatures) || e.digital_signatures.length === 0));
  const tampered = Object.values(verifyResults).filter(r => r.overall_integrity === 'TAMPERED');

  const displayEntries = (filter === 'signed' ? signed : filter === 'unsigned' ? unsigned : entries)
    .filter(e => !search || e.aircraft_tail?.includes(search.toUpperCase()) ||
      e.log_page?.includes(search) || e.description?.toLowerCase().includes(search.toLowerCase()));

  const handleVerify = async (entryId) => {
    setVerifyingId(entryId);
    const res = await base44.functions.invoke('verifySignatureIntegrity', { entry_id: entryId });
    if (res.data?.success) {
      setVerifyResults(prev => ({ ...prev, [entryId]: res.data }));
    }
    setVerifyingId(null);
  };

  const handleVerifyAll = async () => {
    for (const entry of signed) {
      await handleVerify(entry.id);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Signature Audit & Tamper Detection</h1>
              <p className="text-xs text-amber-400 tracking-widest uppercase">SHA-256 Hash Verification · Immutable Audit Trail</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <RoleGuard roles={['admin', 'mcc_supervisor']}>
              <button onClick={handleVerifyAll} disabled={!!verifyingId}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-extrabold hover:bg-amber-500 disabled:opacity-50">
                <ShieldCheck className="w-4 h-4" /> Verify All Signed
              </button>
            </RoleGuard>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total Entries', value: entries.length, color: 'text-white', filter: 'all' },
            { label: 'Signed & Locked', value: signed.length, color: 'text-green-400', filter: 'signed' },
            { label: 'Unsigned', value: unsigned.length, color: 'text-gray-400', filter: 'unsigned' },
            { label: 'Tampered', value: tampered.length, color: tampered.length > 0 ? 'text-red-400' : 'text-gray-500', filter: 'all' },
          ].map(kpi => (
            <button key={kpi.label} onClick={() => setFilter(kpi.filter)}
              className={cn('bg-secondary/50 rounded-xl px-3 py-2 text-left hover:bg-secondary transition-all', filter === kpi.filter && 'ring-1 ring-primary')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              <p className={cn('text-2xl font-black mt-1', kpi.color)}>{kpi.value}</p>
            </button>
          ))}
        </div>

        {tampered.length > 0 && (
          <div className="mt-3 bg-red-900/30 border border-red-500/40 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm font-extrabold text-red-400">
              ⚠ {tampered.length} TAMPERED ENTRY{tampered.length > 1 ? 'IES' : 'Y'} DETECTED — Immediate MCC review required
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-5 space-y-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tail, log page, description…"
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {isLoading ? <div className="text-center text-muted-foreground py-12">Loading entries…</div>
        : displayEntries.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No entries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEntries.map(entry => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onVerify={handleVerify}
                verifyResult={verifyResults[entry.id]}
                isVerifying={verifyingId === entry.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}