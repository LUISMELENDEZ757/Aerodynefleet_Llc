import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';
import { X, CheckCircle, Plane, AlertTriangle, Wrench, Clock, FileText, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAT_CFG = {
  A: { label: 'Cat A', color: 'text-red-400',    bg: 'bg-red-500/15',    desc: 'ASAP',      days: 0   },
  B: { label: 'Cat B', color: 'text-orange-400', bg: 'bg-orange-500/15', desc: '3 Days',    days: 3   },
  C: { label: 'Cat C', color: 'text-primary',    bg: 'bg-primary/15',    desc: '10 Days',   days: 10  },
  D: { label: 'Cat D', color: 'text-gray-400',   bg: 'bg-gray-500/10',   desc: '120 Days',  days: 120 },
};

const STATUS_CFG = {
  open:          { label: 'Open',          color: 'text-foreground',   bg: 'bg-secondary'    },
  expiring_soon: { label: 'Expiring Soon', color: 'text-orange-400',   bg: 'bg-orange-500/15'},
  expired:       { label: 'EXPIRED',       color: 'text-red-400',      bg: 'bg-red-500/15'   },
  cleared:       { label: 'Cleared ✓',     color: 'text-green-400',    bg: 'bg-green-500/15' },
};

function daysLeft(expiry) {
  if (!expiry) return null;
  return differenceInDays(parseISO(expiry), new Date());
}

function computeStatus(item) {
  if (item.status === 'cleared') return 'cleared';
  const days = daysLeft(item.expiry_date);
  if (days === null) return item.status || 'open';
  if (days < 0) return 'expired';
  if (days <= 3) return 'expiring_soon';
  return 'open';
}

const inputCls = "w-full bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";

export default function MELDetailModal({ item, onClose, onClear, onRefresh }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [clearName, setClearName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ ...item });
  const setEdit = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  const computedStatus = computeStatus(item);
  const cat = CAT_CFG[item.category] || CAT_CFG.C;
  const st  = STATUS_CFG[computedStatus] || STATUS_CFG.open;
  const days = daysLeft(item.expiry_date);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.MELItem.update(item.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mel-items'] }); setEditing(false); onRefresh?.(); },
  });

  const handleClear = () => {
    if (!clearName.trim()) return;
    onClear(item.id, clearName.trim());
  };

  const InfoRow = ({ label, value, mono }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex-shrink-0 mt-0.5">{label}</span>
      <span className={cn('text-sm text-white text-right', mono && 'font-mono')}>{value || '—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#141922]">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', cat.bg)}>
              <Wrench className={cn('w-4 h-4', cat.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-extrabold px-2 py-0.5 rounded-full', cat.bg, cat.color)}>{cat.label}</span>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', st.bg, st.color)}>{st.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">{item.aircraft_tail} · ATA {item.ata_chapter || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {computedStatus !== 'cleared' && (
              <button onClick={() => setEditing(v => !v)}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
                <Edit2 className="w-4 h-4 text-gray-300" />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* Countdown banner */}
          {computedStatus !== 'cleared' && (
            <div className={cn('px-5 py-3 flex items-center justify-between',
              days !== null && days < 0  ? 'bg-red-900/30' :
              days !== null && days <= 3 ? 'bg-orange-900/20' :
              'bg-[#141922]'
            )}>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Repair Interval</p>
                <p className="text-xs text-gray-400">{item.deferred_date} → {item.expiry_date}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-3xl font-black font-mono',
                  days !== null && days < 0  ? 'text-red-400' :
                  days !== null && days <= 3 ? 'text-orange-400' :
                  days !== null && days <= 10 ? 'text-yellow-400' : 'text-white')}>
                  {days !== null ? (days < 0 ? `+${Math.abs(days)}d` : `${days}d`) : '—'}
                </p>
                <p className="text-[10px] text-gray-500">{days !== null && days < 0 ? 'overdue' : 'remaining'}</p>
              </div>
            </div>
          )}

          {/* Countdown progress bar */}
          {computedStatus !== 'cleared' && cat.days > 0 && days !== null && (
            <div className="px-5 pb-3">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all',
                    days < 0 ? 'bg-red-500' : days <= 3 ? 'bg-orange-400' : days <= 10 ? 'bg-yellow-400' : 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, ((cat.days - Math.max(days, 0)) / cat.days) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {editing ? (
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Edit MEL Item</p>
              {[
                { key: 'ata_chapter', label: 'ATA Chapter' },
                { key: 'item_number', label: 'Item Number' },
                { key: 'logpage_number', label: 'Logpage #' },
                { key: 'flight_restrictions', label: 'Flight Restrictions' },
                { key: 'ops_procedure', label: 'Ops Procedure' },
                { key: 'mx_procedure', label: 'MX Procedure' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">{label}</label>
                  <input value={editForm[key] || ''} onChange={e => setEdit(key, e.target.value)} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Description</label>
                <textarea rows={3} value={editForm.description || ''} onChange={e => setEdit('description', e.target.value)}
                  className={inputCls + ' resize-none'} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Notes</label>
                <textarea rows={2} value={editForm.notes || ''} onChange={e => setEdit('notes', e.target.value)}
                  className={inputCls + ' resize-none'} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
                <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40">
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-sm font-semibold text-white mb-4 leading-relaxed">{item.description}</p>

              <div className="bg-[#141922] rounded-2xl overflow-hidden">
                <InfoRow label="Aircraft" value={item.aircraft_tail} mono />
                <InfoRow label="Aircraft Type" value={item.aircraft_type} />
                <InfoRow label="ATA Chapter" value={item.ata_chapter} mono />
                <InfoRow label="Item Number" value={item.item_number} />
                <InfoRow label="Logpage" value={item.logpage_number} mono />
                <InfoRow label="Deferred" value={item.deferred_date} mono />
                <InfoRow label="Expiry" value={item.expiry_date} mono />
                <InfoRow label="Placard" value={item.placard_required ? 'Required' : 'Not Required'} />
                {item.cleared_by && <InfoRow label="Cleared By" value={item.cleared_by} />}
                {item.cleared_date && <InfoRow label="Cleared Date" value={item.cleared_date} mono />}
              </div>

              {item.flight_restrictions && (
                <div className="mt-3 flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-0.5">Flight Restrictions</p>
                    <p className="text-xs text-orange-300">{item.flight_restrictions}</p>
                  </div>
                </div>
              )}

              {item.ops_procedure && (
                <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Ops Procedure</p>
                  <p className="text-xs text-blue-300">{item.ops_procedure}</p>
                </div>
              )}

              {item.mx_procedure && (
                <div className="mt-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">MX Procedure</p>
                  <p className="text-xs text-violet-300">{item.mx_procedure}</p>
                </div>
              )}

              {item.notes && (
                <div className="mt-3 bg-gray-500/10 border border-gray-500/20 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-xs text-gray-300">{item.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Clear section */}
          {computedStatus !== 'cleared' && !editing && (
            <div className="px-5 pb-5">
              {!showClearConfirm ? (
                <button onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-600/30 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Mark as Cleared / Repaired
                </button>
              ) : (
                <div className="space-y-3 bg-green-900/20 border border-green-500/30 rounded-2xl p-4">
                  <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Confirm Clearance</p>
                  <input value={clearName} onChange={e => setClearName(e.target.value)}
                    placeholder="Cleared by (name / cert number)…"
                    className={inputCls} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
                    <button onClick={handleClear} disabled={!clearName.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-40">
                      Confirm Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}