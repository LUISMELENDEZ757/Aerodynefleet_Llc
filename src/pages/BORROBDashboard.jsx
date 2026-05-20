import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Package, CheckCircle, Clock, AlertTriangle, X, Plus,
  ChevronLeft, FileText, Wrench, User, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const WORKFLOW_STAGES = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'mcc_approval', label: 'MCC Approval', badge: 1 },
  { id: 'qc_inspection', label: 'QC Inspection', badge: 1 },
  { id: 'ready_to_install', label: 'Ready to Install', badge: 1 },
  { id: 'interline_loans', label: 'Interline Loans', badge: 2 },
  { id: 'all_requests', label: 'All Requests' },
];

const STATUS_COLORS = {
  pending_mcc: 'text-orange-400 bg-orange-500/15 border-orange-500/40',
  mcc_approved: 'text-blue-400 bg-blue-500/15 border-blue-500/40',
  pending_qc_inspection: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/40',
  qc_approved: 'text-green-400 bg-green-500/15 border-green-500/40',
  qc_rejected: 'text-red-400 bg-red-500/15 border-red-500/40',
  technician_assigned: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
  installation_complete: 'text-green-400 bg-green-500/15 border-green-500/40',
  closed: 'text-gray-400 bg-gray-500/15 border-gray-500/40',
};

function StatusBadge({ status }) {
  const labels = {
    pending_mcc: 'Pending MCC Approval',
    mcc_approved: 'MCC Approved',
    pending_qc_inspection: 'Pending QC Inspection',
    qc_approved: 'QC Approved',
    qc_rejected: 'QC Rejected',
    technician_assigned: 'Tech Assigned',
    installation_complete: 'Installation Complete',
    closed: 'Closed',
  };
  return (
    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', STATUS_COLORS[status] || 'text-muted-foreground bg-muted')}>
      {labels[status] || status}
    </span>
  );
}

function BORROBCard({ item, onApprove, onAssign, onComplete, onClose }) {
  return (
    <div className={cn('rounded-2xl border p-4 space-y-3 bg-card',
      item.status === 'pending_mcc' ? 'border-orange-500/40' :
      item.status === 'mcc_approved' ? 'border-blue-500/40' :
      item.status === 'installation_complete' ? 'border-green-500/40' :
      'border-border'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            item.status === 'pending_mcc' ? 'bg-orange-500/20' :
            item.status === 'mcc_approved' ? 'bg-blue-500/20' :
            item.status === 'installation_complete' ? 'bg-green-500/20' :
            'bg-secondary'
          )}>
            <Package className={cn('w-5 h-5',
              item.status === 'pending_mcc' ? 'text-orange-400' :
              item.status === 'mcc_approved' ? 'text-blue-400' :
              item.status === 'installation_complete' ? 'text-green-400' :
              'text-muted-foreground'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{item.part_name}</p>
            <p className="text-xs text-muted-foreground font-mono">P/N: {item.part_number || '—'}</p>
            <div className="flex flex-wrap gap-2 mt-1.5 text-[10px]">
              {item.aircraft_tail && (
                <span className="flex items-center gap-1 text-foreground font-bold">
                  <Wrench className="w-2.5 h-2.5" /> {item.aircraft_tail}
                </span>
              )}
              {item.station && <span className="text-muted-foreground">📍 {item.station}</span>}
              {item.ata_chapter && <span className="text-muted-foreground">ATA {item.ata_chapter}</span>}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <StatusBadge status={item.status} />
          <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(item.created_date), 'MMM d')}</p>
        </div>
      </div>

      <div className="bg-secondary/50 rounded-lg px-3 py-2 space-y-1">
        <p className="text-[10px] text-muted-foreground">Request Details</p>
        <p className="text-xs text-foreground">{item.reason || 'No description'}</p>
        <div className="flex gap-4 mt-1.5 text-[10px]">
          <span className="text-muted-foreground">Qty: <span className="text-foreground font-bold">{item.quantity || 1}</span></span>
          <span className="text-muted-foreground">Priority: <span className={cn('font-bold',
            item.priority === 'aog' ? 'text-red-400' :
            item.priority === 'critical' ? 'text-orange-400' :
            'text-muted-foreground'
          )}>{item.priority?.toUpperCase() || 'ROUTINE'}</span></span>
        </div>
      </div>

      {item.status === 'pending_mcc' && (
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button onClick={() => onApprove(item)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> MCC Approve
          </button>
        </div>
      )}

      {item.status === 'mcc_approved' && (
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button onClick={() => onAssign(item)}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded-xl transition-colors">
            <User className="w-3.5 h-3.5" /> Assign Technician
          </button>
        </div>
      )}

      {item.status === 'technician_assigned' && (
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button onClick={() => onComplete(item)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-xl transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> Complete Installation
          </button>
        </div>
      )}

      {item.status === 'installation_complete' && (
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <button onClick={() => onClose(item)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-2 rounded-xl transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> Close Request
          </button>
        </div>
      )}
    </div>
  );
}

function MCCApproveModal({ item, onClose, onConfirm }) {
  const [notes, setNotes] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(item.id, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-extrabold text-foreground">MCC Approval</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Part Request</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{item.part_name}</p>
            <p className="text-xs text-muted-foreground mt-1">Aircraft: {item.aircraft_tail || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Approval Notes</label>
            <textarea
              autoFocus
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Approval conditions, work package #, etc."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Approve Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignTechModal({ item, onClose, onConfirm }) {
  const [technician, setTechnician] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!technician.trim()) return;
    onConfirm(item.id, technician.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <p className="text-sm font-extrabold text-foreground">Assign Technician</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Part</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{item.part_name}</p>
            <p className="text-xs text-muted-foreground mt-1">Aircraft: {item.aircraft_tail || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Technician Name *</label>
            <input
              autoFocus
              value={technician}
              onChange={e => setTechnician(e.target.value)}
              placeholder="e.g. John Smith - A&P 1234567"
              required
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold flex items-center justify-center gap-2">
              <User className="w-4 h-4" /> Assign Technician
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewRequestModal({ onClose, onConfirm, isPending, aircraft = [] }) {
  const [formData, setFormData] = useState({
    part_name: '', part_number: '', quantity: 1, priority: 'routine',
    donor_aircraft: '', receiving_aircraft: '', station: '', ata_chapter: '',
    reason: '', is_interline: false,
    interline_airline: '', interline_contact: '', interline_loan_number: '',
  });
  const set = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.part_name.trim()) return;
    onConfirm(formData);
  };

  const inputCls = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-yellow-500 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-extrabold text-foreground">New BOR / ROB Request</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">

          {/* Part Info */}
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-yellow-400 uppercase tracking-widest">Part Information</p>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Part Name *</label>
              <input autoFocus value={formData.part_name} onChange={e => set('part_name', e.target.value)}
                placeholder="e.g. Engine Oil Filter" required className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Part Number</label>
                <input value={formData.part_number} onChange={e => set('part_number', e.target.value)}
                  placeholder="e.g. P/N 65-48253-2" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">ATA Chapter</label>
                <input value={formData.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
                  placeholder="e.g. 79" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Quantity</label>
                <input type="number" min="1" value={formData.quantity}
                  onChange={e => set('quantity', parseInt(e.target.value) || 1)} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Priority</label>
                <select value={formData.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
                  <option value="routine">Routine</option>
                  <option value="critical">Critical</option>
                  <option value="aog">AOG</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aircraft */}
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">Aircraft Assignment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Donor Aircraft (BOR from)</label>
                {aircraft.length > 0 ? (
                  <select value={formData.donor_aircraft} onChange={e => set('donor_aircraft', e.target.value)} className={inputCls}>
                    <option value="">None / External</option>
                    {aircraft.map(a => (
                      <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>
                    ))}
                  </select>
                ) : (
                  <input value={formData.donor_aircraft} onChange={e => set('donor_aircraft', e.target.value)}
                    placeholder="e.g. N738AD" className={inputCls} />
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Receiving Aircraft (ROB to)</label>
                {aircraft.length > 0 ? (
                  <select value={formData.receiving_aircraft} onChange={e => set('receiving_aircraft', e.target.value)} className={inputCls}>
                    <option value="">Select tail…</option>
                    {aircraft.map(a => (
                      <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}{a.status === 'oos' ? ' ⚠️ OOS' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <input value={formData.receiving_aircraft} onChange={e => set('receiving_aircraft', e.target.value)}
                    placeholder="e.g. N745AD" className={inputCls} />
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Station</label>
              <input value={formData.station} onChange={e => set('station', e.target.value.toUpperCase())}
                placeholder="e.g. KEWR" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Reason / Justification</label>
              <textarea value={formData.reason} onChange={e => set('reason', e.target.value)}
                placeholder="Describe why the part needs to be borrowed/robbed…"
                rows={2} className={inputCls + " resize-none"} />
            </div>
          </div>

          {/* Interline Toggle */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => set('is_interline', !formData.is_interline)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all',
                formData.is_interline
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Interline Request (Borrow from another airline)
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-extrabold', formData.is_interline ? 'bg-purple-500/30 text-purple-300' : 'bg-muted text-muted-foreground')}>
                {formData.is_interline ? 'ON' : 'OFF'}
              </span>
            </button>

            {formData.is_interline && (
              <div className="mt-3 space-y-3 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <p className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest">Interline Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Lending Airline</label>
                    <input value={formData.interline_airline} onChange={e => set('interline_airline', e.target.value)}
                      placeholder="e.g. United Airlines" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Loan / Agreement #</label>
                    <input value={formData.interline_loan_number} onChange={e => set('interline_loan_number', e.target.value)}
                      placeholder="e.g. ILA-2026-0045" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Contact Name / Phone</label>
                  <input value={formData.interline_contact} onChange={e => set('interline_contact', e.target.value)}
                    placeholder="e.g. Jane Doe · +1-555-0100" className={inputCls} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompleteInstallationModal({ item, onClose, onConfirm }) {
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!technician.trim()) return;
    onConfirm(item.id, technician.trim(), notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-green-400" />
            <p className="text-sm font-extrabold text-foreground">Complete Installation</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Part Installed</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{item.part_name}</p>
            <p className="text-xs text-muted-foreground mt-1">Aircraft: {item.aircraft_tail || '—'}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Technician Name *</label>
            <input
              autoFocus
              value={technician}
              onChange={e => setTechnician(e.target.value)}
              placeholder="e.g. John Smith - A&P 1234567"
              required
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Installation Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Installation details, torque values, etc."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Complete Installation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BORROBDashboard() {
  const [activeWorkflow, setActiveWorkflow] = useState('overview');
  const [approvingItem, setApprovingItem] = useState(null);
  const [assigningItem, setAssigningItem] = useState(null);
  const [completingItem, setCompletingItem] = useState(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [filter, setFilter] = useState('all');
  const qc = useQueryClient();

  const { data: aircraft = [] } = useQuery({
    queryKey: ['borrob-aircraft'],
    queryFn: async () => {
      const all = await base44.entities.Aircraft.list('tail_number', 500);
      return all.filter(a => a.status !== 'retired');
    },
  });

  const { data: items = [], refetch, isLoading } = useQuery({
    queryKey: ['borrob-requests'],
    queryFn: () => base44.entities.SupplyRequisition.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupplyRequisition.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['borrob-requests'] });
      setApprovingItem(null);
      setAssigningItem(null);
      setCompletingItem(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupplyRequisition.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['borrob-requests'] }); setShowNewRequest(false); },
  });

  const handleNewRequest = (formData) => {
    const interlineNote = formData.is_interline
      ? ` | INTERLINE: ${formData.interline_airline || '—'} · Loan# ${formData.interline_loan_number || '—'} · Contact: ${formData.interline_contact || '—'}`
      : '';
    createMutation.mutate({
      part_name: formData.part_name,
      part_number: formData.part_number,
      quantity: formData.quantity,
      priority: formData.priority,
      status: 'pending_mcc',
      aircraft_tail: formData.receiving_aircraft || '',
      station: formData.station || '',
      ata_chapter: formData.ata_chapter || '',
      reason: (formData.reason || '') + interlineNote,
      notes: `Donor: ${formData.donor_aircraft || 'N/A'} → Receiving: ${formData.receiving_aircraft || 'N/A'}${formData.is_interline ? ' [INTERLINE]' : ''}`,
    });
  };

  const handleApprove = (id, notes) => {
    updateMutation.mutate({
      id,
      data: {
        status: 'mcc_approved',
        approved_by: 'MCC',
        notes: notes || 'Approved by MCC',
      },
    });
  };

  const handleAssign = (id, technician) => {
    updateMutation.mutate({
      id,
      data: {
        status: 'technician_assigned',
        requested_by: technician,
        notes: `Assigned to: ${technician}`,
      },
    });
  };

  const handleComplete = (id, technician, notes) => {
    updateMutation.mutate({
      id,
      data: {
        status: 'installation_complete',
        requested_by: technician,
        notes: notes || `Installed by: ${technician}`,
      },
    });
  };

  const handleClose = (id) => {
    updateMutation.mutate({
      id,
      data: { status: 'closed' },
    });
  };

  const filtered = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const stats = {
    pending: items.filter(i => i.status === 'pending_mcc').length,
    approved: items.filter(i => i.status === 'mcc_approved').length,
    assigned: items.filter(i => i.status === 'technician_assigned').length,
    complete: items.filter(i => i.status === 'installation_complete').length,
    closed: items.filter(i => i.status === 'closed').length,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">BOR/ROB WORKFLOW</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Parts Requisition · MCC Approval · Tech Installation</p>
            </div>
          </div>
          <button onClick={refetch} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <Clock className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Workflow Stages */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
          {WORKFLOW_STAGES.map(({ id, label, badge, icon }) => (
            <button
              key={id}
              onClick={() => setActiveWorkflow(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeWorkflow === id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              )}
            >
              {icon && <span>{icon}</span>}
              {label}
              {badge && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1',
                  activeWorkflow === id ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
                )}>{badge}</span>
              )}
            </button>
          ))}
          <button onClick={() => setShowNewRequest(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ml-auto">
            + New Request
          </button>
        </div>

      {/* Stats */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {[
            { label: 'Pending', value: stats.pending, color: 'text-orange-400', key: 'pending_mcc' },
            { label: 'Approved', value: stats.approved, color: 'text-blue-400', key: 'mcc_approved' },
            { label: 'Assigned', value: stats.assigned, color: 'text-cyan-400', key: 'technician_assigned' },
            { label: 'Complete', value: stats.complete, color: 'text-green-400', key: 'installation_complete' },
            { label: 'Closed', value: stats.closed, color: 'text-muted-foreground', key: 'closed' },
          ].map(({ label, value, color, key }) => (
            <button key={label} onClick={() => setFilter(filter === key ? 'all' : key)}
              className={cn('rounded-xl border px-3 py-2 text-left transition-all hover:border-primary/40',
                filter === key ? 'border-primary/60 bg-primary/5' : 'border-border bg-card')}>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={cn('text-xl font-black font-mono mt-0.5', color)}>{value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12 text-sm">Loading requests…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border px-4 py-12 text-center space-y-2">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-bold text-muted-foreground">No requests found</p>
          </div>
        ) : (
          filtered.map(item => (
            <BORROBCard
              key={item.id}
              item={item}
              onApprove={setApprovingItem}
              onAssign={setAssigningItem}
              onComplete={setCompletingItem}
              onClose={handleClose}
            />
          ))
        )}
      </div>

      {approvingItem && (
        <MCCApproveModal
          item={approvingItem}
          onClose={() => setApprovingItem(null)}
          onConfirm={handleApprove}
        />
      )}

      {assigningItem && (
        <AssignTechModal
          item={assigningItem}
          onClose={() => setAssigningItem(null)}
          onConfirm={handleAssign}
        />
      )}

      {completingItem && (
        <CompleteInstallationModal
          item={completingItem}
          onClose={() => setCompletingItem(null)}
          onConfirm={handleComplete}
        />
      )}

      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onConfirm={handleNewRequest}
          isPending={createMutation.isPending}
          aircraft={aircraft}
        />
      )}
    </div>
  );
}