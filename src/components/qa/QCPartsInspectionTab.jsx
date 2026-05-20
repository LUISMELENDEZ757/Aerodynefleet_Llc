import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Package, CheckCircle, XCircle, Clock, AlertTriangle, User,
  Wrench, Eye, X, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PRIORITY_CFG = {
  aog:      { label: 'AOG',      cls: 'bg-red-500/20 text-red-400 border-red-500/40' },
  critical: { label: 'CRITICAL', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  routine:  { label: 'ROUTINE',  cls: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
};

const QC_STATUS = {
  pending_qc_inspection: { label: 'Pending QC Inspection', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  qc_approved:           { label: 'QC Approved',           cls: 'bg-green-500/20  text-green-400  border-green-500/40' },
  qc_rejected:           { label: 'QC Rejected',           cls: 'bg-red-500/20    text-red-400    border-red-500/40' },
  mcc_approved:          { label: 'MCC Approved',          cls: 'bg-blue-500/20   text-blue-400   border-blue-500/40' },
  pending_mcc:           { label: 'Awaiting MCC',          cls: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
};

// ── Inspection Decision Modal ────────────────────────────────────────────────
function InspectModal({ item, action, onClose, onConfirm, isPending }) {
  const isApprove = action === 'approve';
  const [inspector, setInspector] = useState('');
  const [notes, setNotes] = useState('');
  const [defects, setDefects] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inspector.trim()) return;
    onConfirm({ item, action, inspector, notes, defects });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isApprove
              ? <CheckCircle className="w-4 h-4 text-green-400" />
              : <XCircle className="w-4 h-4 text-red-400" />}
            <p className="text-sm font-extrabold text-foreground">
              {isApprove ? 'QC Approve Part' : 'QC Reject Part'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-secondary/50 rounded-xl p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Part Under Inspection</p>
            <p className="text-sm font-bold text-foreground">{item.part_name}</p>
            {item.part_number && <p className="text-xs text-muted-foreground font-mono">P/N: {item.part_number}</p>}
            <div className="flex gap-3 text-xs mt-1">
              {item.aircraft_tail && <span className="text-foreground font-bold">🛩 {item.aircraft_tail}</span>}
              {item.station && <span className="text-muted-foreground">📍 {item.station}</span>}
              {item.priority && <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-bold', PRIORITY_CFG[item.priority]?.cls)}>{item.priority?.toUpperCase()}</span>}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
              Inspector Name & Certificate *
            </label>
            <input
              autoFocus
              value={inspector}
              onChange={e => setInspector(e.target.value)}
              placeholder="e.g. Michael Torres — A&P 4729384"
              required
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          {!isApprove && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                Defects / Discrepancies Found *
              </label>
              <textarea
                value={defects}
                onChange={e => setDefects(e.target.value)}
                placeholder="Describe the defects or non-conformances found…"
                rows={3}
                required
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
              Inspection Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isApprove
                ? 'Inspection findings, part condition, serviceability remarks…'
                : 'Corrective action required, disposition instructions…'}
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors',
                isApprove ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
              )}>
              {isApprove ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {isApprove ? 'Approve & Release' : 'Reject Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Part Inspection Card ─────────────────────────────────────────────────────
function PartCard({ item, onInspect }) {
  const [expanded, setExpanded] = useState(false);
  const priCfg = PRIORITY_CFG[item.priority] || PRIORITY_CFG.routine;
  const statusCfg = QC_STATUS[item.status] || QC_STATUS.pending_qc_inspection;
  const isInterline = item.notes?.includes('[INTERLINE]');

  return (
    <div className={cn(
      'bg-card border rounded-2xl overflow-hidden transition-all',
      item.priority === 'aog' ? 'border-red-500/50' :
      item.priority === 'critical' ? 'border-orange-500/40' : 'border-border'
    )}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              item.priority === 'aog' ? 'bg-red-500/20' : 'bg-yellow-500/15')}>
              <Package className={cn('w-5 h-5', item.priority === 'aog' ? 'text-red-400' : 'text-yellow-400')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-bold text-foreground truncate">{item.part_name}</p>
                {isInterline && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
                    <Send className="w-2.5 h-2.5" /> INTERLINE
                  </span>
                )}
              </div>
              {item.part_number && <p className="text-xs text-muted-foreground font-mono">P/N: {item.part_number}</p>}
              <div className="flex flex-wrap gap-2 mt-1 text-[10px]">
                {item.aircraft_tail && <span className="font-bold text-foreground flex items-center gap-1"><Wrench className="w-2.5 h-2.5" /> {item.aircraft_tail}</span>}
                {item.station && <span className="text-muted-foreground">📍 {item.station}</span>}
                {item.ata_chapter && <span className="text-muted-foreground">ATA {item.ata_chapter}</span>}
                <span className="text-muted-foreground">Qty: <span className="font-bold text-foreground">{item.quantity || 1}</span></span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', priCfg.cls)}>{priCfg.label}</span>
            <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', statusCfg.cls)}>{statusCfg.label}</span>
          </div>
        </div>

        {/* Notes preview */}
        {item.notes && (
          <div className="bg-secondary/40 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Transfer Notes</p>
            <p className="text-xs text-foreground">{item.notes}</p>
          </div>
        )}

        {/* Reason */}
        {item.reason && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Justification / Reason</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
        {expanded && item.reason && (
          <p className="text-xs text-foreground bg-secondary/30 rounded-lg px-3 py-2">{item.reason}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
          <span>Requested: {item.created_date ? format(new Date(item.created_date), 'MMM d, yyyy') : '—'}</span>
          {item.requested_by && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {item.requested_by}</span>}
        </div>

        {/* Actions */}
        {(item.status === 'pending_qc_inspection' || item.status === 'mcc_approved' || item.status === 'pending_mcc') && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => onInspect(item, 'approve')}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" /> QC Approve
            </button>
            <button
              onClick={() => onInspect(item, 'reject')}
              className="flex-1 flex items-center justify-center gap-2 bg-red-700/80 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors border border-red-600"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}

        {item.status === 'qc_approved' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-xs font-bold text-green-400">QC Inspection Passed — Cleared for installation</p>
          </div>
        )}

        {item.status === 'qc_rejected' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs font-bold text-red-400">QC Rejected — Part returned / disposition required</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Tab Component ────────────────────────────────────────────────────────
export default function QCPartsInspectionTab() {
  const qc = useQueryClient();
  const [inspecting, setInspecting] = useState(null); // { item, action }
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['qc-parts-inspection'],
    queryFn: () => base44.entities.SupplyRequisition.list('-created_date', 300),
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupplyRequisition.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qc-parts-inspection'] });
      qc.invalidateQueries({ queryKey: ['borrob-requests'] });
      setInspecting(null);
    },
  });

  const handleConfirm = ({ item, action, inspector, notes, defects }) => {
    const isApprove = action === 'approve';
    const timestamp = new Date().toISOString();
    const qcNote = isApprove
      ? `[QC APPROVED ${timestamp}] Inspector: ${inspector}${notes ? ' | ' + notes : ''}`
      : `[QC REJECTED ${timestamp}] Inspector: ${inspector} | Defects: ${defects}${notes ? ' | ' + notes : ''}`;

    updateMutation.mutate({
      id: item.id,
      data: {
        status: isApprove ? 'qc_approved' : 'qc_rejected',
        approved_by: inspector,
        notes: [item.notes, qcNote].filter(Boolean).join('\n'),
      },
    });
  };

  // Categorise items for QC relevance
  const allQcRelevant = items.filter(i =>
    ['pending_mcc', 'mcc_approved', 'pending_qc_inspection', 'qc_approved', 'qc_rejected'].includes(i.status)
  );

  const pendingItems  = allQcRelevant.filter(i => ['pending_mcc', 'mcc_approved', 'pending_qc_inspection'].includes(i.status));
  const approvedItems = allQcRelevant.filter(i => i.status === 'qc_approved');
  const rejectedItems = allQcRelevant.filter(i => i.status === 'qc_rejected');
  const aogItems      = pendingItems.filter(i => i.priority === 'aog');

  const displayItems = statusFilter === 'pending'  ? pendingItems
                     : statusFilter === 'approved' ? approvedItems
                     : statusFilter === 'rejected' ? rejectedItems
                     : allQcRelevant;

  const FILTER_TABS = [
    { id: 'pending',  label: 'Awaiting Inspection', count: pendingItems.length,  color: 'text-yellow-400' },
    { id: 'approved', label: 'QC Approved',          count: approvedItems.length, color: 'text-green-400' },
    { id: 'rejected', label: 'QC Rejected',          count: rejectedItems.length, color: 'text-red-400' },
    { id: 'all',      label: 'All',                  count: allQcRelevant.length, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Awaiting QC',   value: pendingItems.length,  icon: Clock,          cls: 'text-yellow-400' },
          { label: 'AOG Priority',  value: aogItems.length,      icon: AlertTriangle,  cls: 'text-red-400' },
          { label: 'QC Approved',   value: approvedItems.length, icon: CheckCircle,    cls: 'text-green-400' },
          { label: 'QC Rejected',   value: rejectedItems.length, icon: XCircle,        cls: 'text-red-400' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <Icon className={cn('w-5 h-5 flex-shrink-0', cls)} />
            <div>
              <p className={cn('text-2xl font-black leading-none', cls)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AOG Alert Banner */}
      {aogItems.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/40 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm font-extrabold text-red-400">
            {aogItems.length} AOG part{aogItems.length > 1 ? 's' : ''} awaiting QC inspection — expedite immediately
          </p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(({ id, label, count, color }) => (
          <button key={id} onClick={() => setStatusFilter(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
              statusFilter === id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}>
            {label}
            <span className={cn('font-extrabold', statusFilter === id ? 'text-primary-foreground' : color)}>{count}</span>
          </button>
        ))}
      </div>

      {/* Part Cards */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading parts queue…</div>
      ) : displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-card border border-border rounded-2xl">
          <Package className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-sm font-bold text-muted-foreground">No parts in this queue</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Parts submitted via the BOR/ROB workflow will appear here for QC inspection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {displayItems.map(item => (
            <PartCard key={item.id} item={item} onInspect={(i, a) => setInspecting({ item: i, action: a })} />
          ))}
        </div>
      )}

      {inspecting && (
        <InspectModal
          item={inspecting.item}
          action={inspecting.action}
          onClose={() => setInspecting(null)}
          onConfirm={handleConfirm}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}