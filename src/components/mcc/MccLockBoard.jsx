import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Lock, LockOpen, Plus, X, AlertTriangle, CheckCircle, ShieldAlert, User } from 'lucide-react';
import { cn } from '@/lib/utils';

function PlaceLockModal({ aircraft, onClose, onSubmit, isPending }) {
  const [form, setForm] = useState({ aircraft_tail: '', reason: '', placed_by: '', placed_by_id: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4" style={{ paddingTop: '96px' }}>
      <div className="w-full max-w-md bg-[#0d1117] border border-red-500/40 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/30 bg-red-950/30">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white tracking-wide">PLACE MCC LOCK</p>
            <p className="text-[10px] text-red-400">Positive Fix Required — Technician Concurrence Needed</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Select Aircraft *</label>
            <select
              value={form.aircraft_tail}
              onChange={e => set('aircraft_tail', e.target.value)}
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500"
            >
              <option value="">— Select tail —</option>
              {aircraft.map(a => (
                <option key={a.id} value={a.tail_number}>{a.tail_number} · {a.aircraft_type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">MCC Controller Name *</label>
            <input
              value={form.placed_by}
              onChange={e => set('placed_by', e.target.value)}
              placeholder="Full name"
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Employee ID</label>
            <input
              value={form.placed_by_id}
              onChange={e => set('placed_by_id', e.target.value)}
              placeholder="EMP-XXXXX"
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Reason / Required Positive Fix *</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              placeholder="Describe the required positive fix and reason for lock..."
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">This lock will prevent return to service until a technician provides concurrence AND MCC removes the lock from this dashboard.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/15 text-white text-sm font-bold hover:bg-white/5">Cancel</button>
            <button
              onClick={() => onSubmit(form)}
              disabled={isPending || !form.aircraft_tail || !form.placed_by || !form.reason}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> {isPending ? 'Placing...' : 'PLACE LOCK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RemoveLockModal({ lock, onClose, onRemove, isPending }) {
  const [form, setForm] = useState({ removed_by: '', removal_reason: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d1117] border border-green-500/40 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-green-500/30 bg-green-950/20">
          <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
            <LockOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">REMOVE MCC LOCK</p>
            <p className="text-[10px] text-green-400 font-mono">{lock.aircraft_tail}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!lock.technician_concurrence && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl px-4 py-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">No technician concurrence recorded. Removing this lock requires MCC override authorization.</p>
            </div>
          )}
          {lock.technician_concurrence && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3 flex gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-300">Technician concurrence by <span className="font-bold">{lock.technician_name}</span> confirmed.</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">MCC Controller Removing Lock *</label>
            <input
              value={form.removed_by}
              onChange={e => set('removed_by', e.target.value)}
              placeholder="Full name"
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Reason for Removal *</label>
            <textarea
              rows={3}
              value={form.removal_reason}
              onChange={e => set('removal_reason', e.target.value)}
              placeholder="Positive fix confirmed, aircraft cleared for service..."
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/15 text-white text-sm font-bold hover:bg-white/5">Cancel</button>
            <button
              onClick={() => onRemove({ ...form })}
              disabled={isPending || !form.removed_by || !form.removal_reason}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <LockOpen className="w-4 h-4" /> {isPending ? 'Removing...' : 'REMOVE LOCK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConcurrenceModal({ lock, onClose, onConcur, isPending }) {
  const [form, setForm] = useState({ technician_name: '', technician_cert: '', concurrence_notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d1117] border border-blue-500/40 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-500/30 bg-blue-950/20">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">TECHNICIAN CONCURRENCE</p>
            <p className="text-[10px] text-blue-400 font-mono">{lock.aircraft_tail}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-[#141922] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Required Fix</p>
            <p className="text-sm text-white">{lock.reason}</p>
            <p className="text-[10px] text-gray-500 mt-1">Placed by: {lock.placed_by}</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Technician Name *</label>
            <input
              value={form.technician_name}
              onChange={e => set('technician_name', e.target.value)}
              placeholder="Full name"
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">A&P / Cert # *</label>
            <input
              value={form.technician_cert}
              onChange={e => set('technician_cert', e.target.value)}
              placeholder="AMT-XXXXX"
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Concurrence Notes</label>
            <textarea
              rows={3}
              value={form.concurrence_notes}
              onChange={e => set('concurrence_notes', e.target.value)}
              placeholder="Inspection completed, positive fix confirmed..."
              className="w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/15 text-white text-sm font-bold hover:bg-white/5">Cancel</button>
            <button
              onClick={() => onConcur(form)}
              disabled={isPending || !form.technician_name || !form.technician_cert}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> {isPending ? 'Saving...' : 'CONCUR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MccLockBoard({ aircraft }) {
  const [showPlace, setShowPlace] = useState(false);
  const [removingLock, setRemovingLock] = useState(null);
  const [concurringLock, setConcurringLock] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const qc = useQueryClient();

  const { data: locks = [] } = useQuery({
    queryKey: ['mcc-locks'],
    queryFn: () => base44.entities.MccLock.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const activeLocks = locks.filter(l => l.is_active);
  const lockHistory = locks.filter(l => !l.is_active);

  const placeMutation = useMutation({
    mutationFn: (data) => base44.entities.MccLock.create({ ...data, is_active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mcc-locks'] }); setShowPlace(false); },
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MccLock.update(id, {
      ...data,
      is_active: false,
      removed_at: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mcc-locks'] }); setRemovingLock(null); },
  });

  const concurMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MccLock.update(id, {
      technician_concurrence: true,
      technician_name: data.technician_name,
      technician_cert: data.technician_cert,
      concurrence_notes: data.concurrence_notes,
      concurred_at: new Date().toISOString(),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mcc-locks'] }); setConcurringLock(null); },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold text-white">MCC Positive Fix Locks</p>
            <p className="text-xs text-gray-500">Aircraft requiring technician concurrence before return to service</p>
          </div>
        </div>
        <button
          onClick={() => setShowPlace(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-extrabold hover:bg-red-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> PLACE LOCK
        </button>
      </div>

      {/* Active Locks */}
      {activeLocks.length === 0 ? (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-10 text-center space-y-3">
          <LockOpen className="w-12 h-12 text-green-500/40 mx-auto" />
          <p className="text-green-400 font-bold">No Active Locks</p>
          <p className="text-gray-600 text-sm">All aircraft are clear of MCC positive fix locks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-extrabold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Active Locks ({activeLocks.length})
          </p>
          {activeLocks.map(lock => (
            <div key={lock.id} className="bg-[#141922] border border-red-500/40 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-red-400 font-mono">{lock.aircraft_tail}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Locked by: <span className="text-white font-bold">{lock.placed_by}</span>
                      {lock.placed_by_id && <span className="ml-1 text-gray-600">({lock.placed_by_id})</span>}
                    </p>
                    <p className="text-[10px] text-gray-600">{new Date(lock.created_date).toLocaleString()}</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 flex-shrink-0">
                  <Lock className="w-3 h-3" /> LOCKED
                </span>
              </div>

              <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Required Positive Fix</p>
                <p className="text-sm text-white">{lock.reason}</p>
              </div>

              {/* Concurrence Status */}
              <div className={cn(
                'rounded-xl px-4 py-3 border flex items-start gap-3',
                lock.technician_concurrence
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-amber-900/20 border-amber-500/30'
              )}>
                {lock.technician_concurrence ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-green-400">Technician Concurrence Confirmed</p>
                      <p className="text-[10px] text-green-300 mt-0.5">
                        {lock.technician_name} · {lock.technician_cert}
                      </p>
                      {lock.concurrence_notes && <p className="text-[10px] text-gray-400 mt-1 italic">"{lock.concurrence_notes}"</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-400">Awaiting Technician Concurrence</p>
                      <p className="text-[10px] text-amber-300/70 mt-0.5">A technician must concur before this lock can be removed.</p>
                    </div>
                    <button
                      onClick={() => setConcurringLock(lock)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-500 transition-colors"
                    >
                      Add Concurrence
                    </button>
                  </>
                )}
              </div>

              {/* Remove Lock — MCC ONLY */}
              <button
                onClick={() => setRemovingLock(lock)}
                className="w-full py-2.5 rounded-xl bg-green-700/80 border border-green-600 text-white text-sm font-extrabold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <LockOpen className="w-4 h-4" /> REMOVE LOCK (MCC ONLY)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lock History Toggle */}
      {lockHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2"
          >
            {showHistory ? '▾' : '▸'} Lock History ({lockHistory.length})
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {lockHistory.map(lock => (
                <div key={lock.id} className="bg-[#141922] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-4 opacity-60">
                  <LockOpen className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white font-mono">{lock.aircraft_tail}</p>
                    <p className="text-[10px] text-gray-500 truncate">{lock.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-green-400 font-bold">REMOVED</p>
                    <p className="text-[10px] text-gray-600">{lock.removed_by}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPlace && (
        <PlaceLockModal
          aircraft={aircraft}
          onClose={() => setShowPlace(false)}
          onSubmit={data => placeMutation.mutate(data)}
          isPending={placeMutation.isPending}
        />
      )}
      {removingLock && (
        <RemoveLockModal
          lock={removingLock}
          onClose={() => setRemovingLock(null)}
          onRemove={data => removeMutation.mutate({ id: removingLock.id, data })}
          isPending={removeMutation.isPending}
        />
      )}
      {concurringLock && (
        <ConcurrenceModal
          lock={concurringLock}
          onClose={() => setConcurringLock(null)}
          onConcur={data => concurMutation.mutate({ id: concurringLock.id, data })}
          isPending={concurMutation.isPending}
        />
      )}
    </div>
  );
}