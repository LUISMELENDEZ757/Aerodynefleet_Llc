import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, X, CheckCircle, Shield, ClipboardList, AlertTriangle,
  Search, Send, User, BookOpen, Clock, Eye, FileText
} from 'lucide-react';
import LiveClock from '@/components/ui/LiveClock';
import { cn } from '@/lib/utils';

// ── Shared Helpers ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white tracking-wide text-sm uppercase">{title}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[78vh]">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500";

// ── RII Queue Modal — shows all PENDING_RII entries ──────────────────────────
function RIIQueueModal({ onClose, onSignOff }) {
  const [tailFilter, setTailFilter] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['rii-queue'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    select: (data) => data.filter(e => e.rii_required && !e.rii_signed_at && !e.rii_rejected),
    refetchInterval: 20000,
  });

  const filtered = entries.filter(e =>
    !tailFilter || (e.aircraft_tail || '').toLowerCase().includes(tailFilter.toLowerCase())
  );

  const urgency = (e) => {
    const age = (Date.now() - new Date(e.created_date).getTime()) / 3600000;
    if (age > 4) return { label: 'URGENT', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' };
    if (age > 2) return { label: 'AWAITING', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
    return { label: 'PENDING', color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' };
  };

  return (
    <Modal title={`RII Queue (${entries.length})`} onClose={onClose}>
      <div className="p-5 space-y-4">
        <input
          value={tailFilter}
          onChange={e => setTailFilter(e.target.value)}
          placeholder="Filter by tail number…"
          className={inputCls}
        />

        {isLoading ? (
          <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="w-10 h-10 text-green-500/20 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No RII items pending inspection</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map(e => {
              const u = urgency(e);
              const ageH = Math.floor((Date.now() - new Date(e.created_date).getTime()) / 3600000);
              return (
                <button key={e.id} onClick={() => { onClose(); onSignOff(e); }}
                  className={cn('w-full text-left rounded-xl p-4 border space-y-1.5 hover:brightness-110 transition-all active:scale-[0.98]', u.bg)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/20', u.color)}>{u.label}</span>
                      <span className="font-mono font-bold text-white text-sm">{e.aircraft_tail || '—'}</span>
                      {e.station && <span className="text-[10px] text-gray-400">{e.station}</span>}
                      {e.ata_chapter && <span className="text-[10px] text-gray-500">ATA {e.ata_chapter}</span>}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0">
                      <Clock className="w-3 h-3" /> {ageH}h ago
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-snug line-clamp-2">{e.description}</p>
                  {e.corrective_action && (
                    <p className="text-[10px] text-green-400 line-clamp-1">CA: {e.corrective_action}</p>
                  )}
                  {e.technician_name && (
                    <p className="text-[10px] text-gray-500">Tech: {e.technician_name} {e.technician_id ? `· ${e.technician_id}` : ''}</p>
                  )}
                  <p className="text-[10px] text-violet-400 font-bold">Tap to sign off →</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── RII Sign-Off Modal ────────────────────────────────────────────────────────
function RIISignOffModal({ entry, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    inspector_name: '',
    inspector_cert: '',
    notes: '',
    decision: 'approve', // approve | reject
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const isApprove = form.decision === 'approve';
      return base44.entities.LogbookEntry.update(entry.id, {
        rii_inspector_name: form.inspector_name,
        rii_inspector_id: form.inspector_cert,
        rii_signed_at: isApprove ? new Date().toISOString() : null,
        rii_rejected: !isApprove,
        rii_rejection_reason: !isApprove ? form.notes : undefined,
        discrepancy_status: isApprove ? 'CLOSED' : 'OPEN',
        is_cleared: isApprove,
        cleared_by: isApprove ? form.inspector_name : undefined,
        cleared_date: isApprove ? new Date().toISOString().split('T')[0] : undefined,
        notes: form.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rii-queue'] });
      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['inspector-history'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm">RII Sign-Off</p>
              <p className="text-[10px] text-gray-500">Required Inspection Item</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[78vh]">
          {/* Entry summary */}
          <div className="bg-[#1a1f2e] border border-violet-500/25 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-primary text-sm">{entry.aircraft_tail}</span>
              {entry.station && <span className="text-[10px] text-gray-400">{entry.station}</span>}
              {entry.ata_chapter && <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-gray-300">ATA {entry.ata_chapter}</span>}
              {entry.log_page && <span className="text-[10px] font-mono text-primary">{entry.log_page}</span>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Discrepancy</p>
              <p className="text-xs text-gray-200 leading-snug">{entry.description}</p>
            </div>
            {entry.corrective_action && (
              <div>
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-0.5">Corrective Action</p>
                <p className="text-xs text-gray-200 leading-snug">{entry.corrective_action}</p>
              </div>
            )}
            {entry.technician_name && (
              <p className="text-[10px] text-gray-500">
                Tech: <span className="text-gray-300 font-bold">{entry.technician_name}</span>
                {entry.technician_id ? ` · ${entry.technician_id}` : ''}
              </p>
            )}
            <p className="text-[10px] text-gray-600">{new Date(entry.created_date).toLocaleString()}</p>
          </div>

          {/* Decision toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => set('decision', 'approve')}
              className={cn('py-3 rounded-xl border text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                form.decision === 'approve'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-[#1a1f2e] border-white/10 text-gray-400 hover:border-green-500/40')}>
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => set('decision', 'reject')}
              className={cn('py-3 rounded-xl border text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                form.decision === 'reject'
                  ? 'bg-red-700 border-red-500 text-white'
                  : 'bg-[#1a1f2e] border-white/10 text-gray-400 hover:border-red-500/40')}>
              <X className="w-4 h-4" /> Reject
            </button>
          </div>

          {/* Inspector info */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inspector Name *">
              <input value={form.inspector_name} onChange={e => set('inspector_name', e.target.value)}
                placeholder="First Last" className={inputCls} />
            </Field>
            <Field label="IA / Cert # *">
              <input value={form.inspector_cert} onChange={e => set('inspector_cert', e.target.value)}
                placeholder="IA-XXXXX" className={inputCls} />
            </Field>
          </div>

          <Field label={form.decision === 'reject' ? 'Rejection Reason *' : 'Inspection Notes (optional)'}>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder={form.decision === 'reject' ? 'State reason for rejection…' : 'Any additional inspection findings…'}
              className={inputCls + " resize-none"} />
          </Field>

          {/* Compliance notice */}
          <div className="bg-blue-950/50 border border-blue-600/25 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-300 leading-snug">
              By signing off this RII, you certify that the work has been inspected per 14 CFR 43.13 and applicable AMM procedures. Your IA certificate number will be recorded in the logbook entry.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button
              disabled={!form.inspector_name || !form.inspector_cert || (form.decision === 'reject' && !form.notes) || mutation.isPending}
              onClick={() => mutation.mutate()}
              className={cn('flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors',
                form.decision === 'approve' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-700 hover:bg-red-600'
              )}>
              <Send className="w-4 h-4" />
              {mutation.isPending ? 'Saving…' : form.decision === 'approve' ? 'Sign Off RII' : 'Reject & Return'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── My Assigned Log Pages Modal ──────────────────────────────────────────────
function AssignedLogPagesModal({ onClose, onSignOff }) {
  const STORAGE_KEY = 'inspector_profile';
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } })();
  const [profile, setProfile] = useState(saved);
  const [editProfile, setEditProfile] = useState(!saved.name);
  const [tempName, setTempName] = useState(saved.name || '');
  const [tempStation, setTempStation] = useState(saved.station || '');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['assigned-rii', profile.name],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    enabled: !!profile.name,
    select: (data) => data.filter(e => {
      const isRII = e.rii_required;
      const pending = !e.rii_signed_at && !e.rii_rejected;
      const matchInspector = !profile.name || e.rii_inspector_name?.toLowerCase().includes(profile.name.toLowerCase()) ||
        // Also show unassigned RII items where station matches
        (!e.rii_inspector_name && (!profile.station || !e.station || e.station?.toUpperCase() === profile.station?.toUpperCase()));
      return isRII && pending && matchInspector;
    }),
    refetchInterval: 20000,
  });

  const saveProfile = () => {
    if (!tempName) return;
    const p = { name: tempName.trim(), station: tempStation.trim().toUpperCase() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
    setEditProfile(false);
  };

  return (
    <Modal title="My Assigned RII Pages" onClose={onClose}>
      <div className="p-5 space-y-4">
        {!editProfile && profile.name ? (
          <div className="flex items-center justify-between bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold text-white">{profile.name}</span>
              {profile.station && <span className="text-[10px] font-mono text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded-full">{profile.station}</span>}
            </div>
            <button onClick={() => { setTempName(profile.name); setTempStation(profile.station || ''); setEditProfile(true); }}
              className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
              Change
            </button>
          </div>
        ) : (
          <div className="bg-[#1a1f2e] border border-violet-500/30 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">Set Inspector Profile</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Your Name *</label>
                <input value={tempName} onChange={e => setTempName(e.target.value)} placeholder="First Last" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Station</label>
                <input value={tempStation} onChange={e => setTempStation(e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
              </div>
            </div>
            <button onClick={saveProfile} disabled={!tempName}
              className="w-full py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-50">
              Save Profile
            </button>
          </div>
        )}

        {profile.name && !editProfile && (
          isLoading ? (
            <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
          ) : entries.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-10 h-10 text-green-500/20 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No RII items assigned at your station</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{entries.length} item{entries.length !== 1 ? 's' : ''} pending your inspection</p>
              {entries.map(e => (
                <button key={e.id} onClick={() => { onClose(); onSignOff(e); }}
                  className="w-full text-left bg-[#1a1f2e] border border-violet-500/25 rounded-xl p-3 space-y-1 hover:border-violet-400/50 hover:bg-violet-900/10 transition-all active:scale-[0.98]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-xs">{e.aircraft_tail || '—'}</span>
                      {e.station && <span className="text-[10px] text-gray-500">{e.station}</span>}
                      {e.ata_chapter && <span className="text-[10px] text-gray-600">ATA {e.ata_chapter}</span>}
                    </div>
                    {e.log_page && <span className="text-[10px] font-mono text-primary">{e.log_page}</span>}
                  </div>
                  <p className="text-xs text-gray-300 leading-snug line-clamp-2">{e.description}</p>
                  {e.technician_name && <p className="text-[10px] text-gray-600">Tech: {e.technician_name}</p>}
                  <p className="text-[10px] text-violet-400 font-bold">Tap to inspect & sign off →</p>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </Modal>
  );
}

// ── Recently Signed Modal ─────────────────────────────────────────────────────
function RecentlySignedModal({ onClose }) {
  const [search, setSearch] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['inspector-history'],
    queryFn: () => base44.entities.LogbookEntry.list('-updated_date', 200),
    select: (data) => data.filter(e => e.rii_required && (e.rii_signed_at || e.rii_rejected)),
  });

  const filtered = entries.filter(e =>
    !search || (e.aircraft_tail || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.rii_inspector_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal title="Inspection History" onClose={onClose}>
      <div className="p-5 space-y-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by tail or inspector…" className={inputCls} />
        {isLoading ? (
          <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No signed inspections found</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map(e => (
              <div key={e.id} className={cn('bg-[#1a1f2e] border rounded-xl p-3 space-y-1',
                e.rii_rejected ? 'border-red-500/25' : 'border-green-500/20')}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {e.rii_rejected
                      ? <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">REJECTED</span>
                      : <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">APPROVED</span>
                    }
                    <span className="font-mono font-bold text-white text-xs">{e.aircraft_tail || '—'}</span>
                    {e.station && <span className="text-[10px] text-gray-500">{e.station}</span>}
                  </div>
                  {e.log_page && <span className="text-[10px] font-mono text-primary">{e.log_page}</span>}
                </div>
                <p className="text-xs text-gray-300 line-clamp-2">{e.description}</p>
                {e.rii_inspector_name && (
                  <p className="text-[10px] text-gray-500">Inspector: {e.rii_inspector_name} {e.rii_inspector_id ? `· ${e.rii_inspector_id}` : ''}</p>
                )}
                {e.rii_rejection_reason && <p className="text-[10px] text-red-400">Reason: {e.rii_rejection_reason}</p>}
                <p className="text-[10px] text-gray-600">{new Date(e.rii_signed_at || e.updated_date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── All RII Items (inc. rejected) ─────────────────────────────────────────────
function AllRIIModal({ onClose, onSignOff }) {
  const [filter, setFilter] = useState('pending'); // all | pending | approved | rejected
  const [tail, setTail] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['all-rii'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    select: (data) => data.filter(e => e.rii_required),
    refetchInterval: 30000,
  });

  const filtered = entries.filter(e => {
    const matchTail = !tail || (e.aircraft_tail || '').toLowerCase().includes(tail.toLowerCase());
    if (filter === 'pending') return matchTail && !e.rii_signed_at && !e.rii_rejected;
    if (filter === 'approved') return matchTail && !!e.rii_signed_at;
    if (filter === 'rejected') return matchTail && !!e.rii_rejected;
    return matchTail;
  });

  return (
    <Modal title="All RII Logbook Items" onClose={onClose}>
      <div className="p-5 space-y-4">
        <input value={tail} onChange={e => setTail(e.target.value)} placeholder="Filter by tail…" className={inputCls} />
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all capitalize',
                filter === f ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1a1f2e] border-white/10 text-gray-400 hover:text-white')}>
              {f}
            </button>
          ))}
        </div>
        {isLoading ? (
          <p className="text-gray-500 text-sm text-center py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No entries match</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map(e => {
              const isPending = !e.rii_signed_at && !e.rii_rejected;
              return (
                <button key={e.id} onClick={isPending ? () => { onClose(); onSignOff(e); } : undefined}
                  className={cn('w-full text-left bg-[#1a1f2e] rounded-xl p-3 space-y-1 border transition-all',
                    isPending ? 'border-violet-500/25 hover:border-violet-400/50 hover:bg-violet-900/10 active:scale-[0.98] cursor-pointer' :
                    e.rii_rejected ? 'border-red-500/15 cursor-default' : 'border-green-500/15 cursor-default')}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isPending
                        ? <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">PENDING RII</span>
                        : e.rii_rejected
                        ? <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">REJECTED</span>
                        : <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">SIGNED OFF</span>
                      }
                      <span className="font-mono font-bold text-white text-xs">{e.aircraft_tail || '—'}</span>
                      {e.station && <span className="text-[10px] text-gray-500">{e.station}</span>}
                    </div>
                    {e.ata_chapter && <span className="text-[10px] text-gray-600">ATA {e.ata_chapter}</span>}
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{e.description}</p>
                  {e.rii_inspector_name && <p className="text-[10px] text-gray-500">Inspector: {e.rii_inspector_name}</p>}
                  {isPending && <p className="text-[10px] text-violet-400 font-bold">Tap to sign off →</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function InspectorMode() {
  const [modal, setModal] = useState(null); // 'queue' | 'assigned' | 'history' | 'all'
  const [signOffEntry, setSignOffEntry] = useState(null);

  // Live pending count badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['rii-pending-count'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    select: (data) => data.filter(e => e.rii_required && !e.rii_signed_at && !e.rii_rejected).length,
    refetchInterval: 30000,
  });

  const openSignOff = (entry) => setSignOffEntry(entry);

  const ACTIONS = [
    {
      icon: AlertTriangle,
      label: 'RII Queue',
      sub: pendingCount > 0 ? `${pendingCount} awaiting` : 'All clear',
      subColor: pendingCount > 0 ? 'text-red-300' : 'text-green-300',
      bg: 'bg-violet-700',
      modal: 'queue',
      badge: pendingCount > 0 ? pendingCount : null,
      highlight: true,
    },
    {
      icon: ClipboardList,
      label: 'My Assigned Pages',
      sub: 'Your station / name',
      subColor: 'text-yellow-300',
      bg: 'bg-primary',
      modal: 'assigned',
    },
    {
      icon: Eye,
      label: 'All RII Items',
      sub: 'Full logbook RII list',
      subColor: 'text-sky-300',
      bg: 'bg-blue-700',
      modal: 'all',
    },
    {
      icon: CheckCircle,
      label: 'Inspection History',
      sub: 'Signed & rejected',
      subColor: 'text-emerald-300',
      bg: 'bg-teal-700',
      modal: 'history',
    },
    {
      icon: BookOpen,
      label: 'E-Logbook',
      sub: 'Full logbook view',
      subColor: 'text-blue-300',
      bg: 'bg-blue-700',
      link: '/TechOpsLogbook',
    },
    {
      icon: FileText,
      label: 'MEL Deferrals',
      sub: 'Active MEL items',
      subColor: 'text-amber-300',
      bg: 'bg-amber-700',
      link: '/MEL',
    },
    {
      icon: Search,
      label: 'Documents / AMM',
      sub: 'Tech library',
      subColor: 'text-cyan-300',
      bg: 'bg-cyan-700',
      link: '/Documents',
    },
    {
      icon: Shield,
      label: 'QA / QC',
      sub: 'Quality assurance',
      subColor: 'text-violet-300',
      bg: 'bg-violet-600',
      link: '/QAQC',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10">
        <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wide leading-none">Inspector Mode</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">RII Sign-Off · 14 CFR 43.13</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-extrabold text-violet-400">{pendingCount} RII Pending</span>
          </div>
        )}
        <LiveClock />
      </div>

      {/* Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          {ACTIONS.map(({ icon: Icon, label, sub, subColor, bg, border, modal: m, link, badge }) => {
            const cls = cn(
              'relative flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-2xl text-white active:scale-95 transition-all hover:brightness-110',
              bg, border && 'border border-white/10'
            );
            const content = (
              <>
                {badge && (
                  <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
                <Icon className="w-7 h-7" strokeWidth={1.8} />
                <div className="text-center">
                  <p className="text-sm font-bold leading-tight">{label}</p>
                  <p className={cn('text-[10px] mt-0.5 font-semibold', subColor || 'text-white/50')}>{sub}</p>
                </div>
              </>
            );
            return link ? (
              <Link key={label} to={link} className={cls}>{content}</Link>
            ) : (
              <button key={label} onClick={() => setModal(m)} className={cls}>{content}</button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {modal === 'queue'    && <RIIQueueModal        onClose={() => setModal(null)} onSignOff={openSignOff} />}
      {modal === 'assigned' && <AssignedLogPagesModal onClose={() => setModal(null)} onSignOff={openSignOff} />}
      {modal === 'history'  && <RecentlySignedModal   onClose={() => setModal(null)} />}
      {modal === 'all'      && <AllRIIModal           onClose={() => setModal(null)} onSignOff={openSignOff} />}

      {signOffEntry && (
        <RIISignOffModal entry={signOffEntry} onClose={() => setSignOffEntry(null)} />
      )}
    </div>
  );
}