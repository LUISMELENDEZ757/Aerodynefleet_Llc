import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Package, DollarSign, ClipboardList, ShoppingCart, TrendingUp, Clock,
  AlertTriangle, ChevronLeft, Plus, RefreshCw, Download, X, Send,
  CheckCircle, Truck, Archive, BarChart3, Tag, Layers, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Inventory', 'Requisitions', 'Orders', 'Analytics', 'Part Categories'];

const PRIORITY_CFG = {
  aog:      { label: 'AOG',      bg: 'bg-red-700',    text: 'text-red-100',    border: 'border-red-500/40' },
  critical: { label: 'CRITICAL', bg: 'bg-orange-700', text: 'text-orange-100', border: 'border-orange-500/40' },
  routine:  { label: 'ROUTINE',  bg: 'bg-slate-700',  text: 'text-slate-200',  border: 'border-slate-500/40' },
};

const STATUS_CFG = {
  pending_approval: { label: 'Pending Approval', icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  approved:         { label: 'Approved',          icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  ordered:          { label: 'Ordered',            icon: ShoppingCart, color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  in_transit:       { label: 'In Transit',         icon: Truck,        color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  received:         { label: 'Received',           icon: Archive,      color: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/30' },
  cancelled:        { label: 'Cancelled',          icon: X,            color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
};

const PART_CATEGORIES = [
  { name: 'Engine Components', ata: '72', count: 124, value: '$420K', color: 'bg-red-600' },
  { name: 'Avionics / Flight Controls', ata: '22/27', count: 98, value: '$310K', color: 'bg-blue-600' },
  { name: 'Hydraulics', ata: '29', count: 76, value: '$185K', color: 'bg-cyan-600' },
  { name: 'Landing Gear', ata: '32', count: 55, value: '$210K', color: 'bg-amber-600' },
  { name: 'Pneumatics / Air', ata: '21/36', count: 88, value: '$95K', color: 'bg-purple-600' },
  { name: 'Electrical', ata: '24', count: 142, value: '$68K', color: 'bg-yellow-600' },
  { name: 'Fuel System', ata: '28', count: 62, value: '$72K', color: 'bg-orange-600' },
  { name: 'Cabin / Interior', ata: '25', count: 28, value: '$28K', color: 'bg-teal-600' },
  { name: 'Expendables — Oils & Fluids', ata: '12', count: 210, value: '$18K', color: 'bg-lime-600', expendable: true },
  { name: 'Expendables — Seals & O-Rings', ata: '05', count: 540, value: '$12K', color: 'bg-lime-700', expendable: true },
  { name: 'Expendables — Fasteners & Hardware', ata: '05', count: 1200, value: '$9K', color: 'bg-green-700', expendable: true },
  { name: 'Expendables — Filters', ata: '12/73', count: 185, value: '$22K', color: 'bg-green-600', expendable: true },
  { name: 'Expendables — Adhesives & Sealants', ata: '51', count: 96, value: '$8K', color: 'bg-emerald-700', expendable: true },
  { name: 'Expendables — Consumable Chemicals', ata: '12', count: 74, value: '$6K', color: 'bg-emerald-600', expendable: true },
];

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors';

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending_approval;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.routine;
  return (
    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded border', cfg.bg, cfg.text, cfg.border)}>
      {cfg.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color + '/20')}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      <div>
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-gray-500">{sublabel}</p>
      </div>
    </div>
  );
}

// ── New Requisition Modal ─────────────────────────────────────────────────────
function NewReqModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    priority: 'routine', part_name: '', part_number: '', quantity: 1,
    aircraft_tail: '', station: '', ata_chapter: '', reason: '',
    supplier: '', unit_cost: '', notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date();
    const num = `REQ-${now.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    onCreate({ ...form, req_number: num, quantity: Number(form.quantity), unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <p className="font-extrabold text-white uppercase tracking-wide text-sm">New Requisition</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Priority */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Priority *</label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => set('priority', key)}
                  className={cn('flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                    form.priority === key ? `${cfg.bg} ${cfg.text} border-transparent` : 'border-white/10 text-gray-400 hover:text-white')}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          {/* Part info */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Part Name *</label>
            <input value={form.part_name} onChange={e => set('part_name', e.target.value)} required placeholder="e.g. Elevator Feel Computer" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Part Number</label>
              <input value={form.part_number} onChange={e => set('part_number', e.target.value)} placeholder="e.g. 65-55879-3" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Qty *</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} required className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Aircraft Tail</label>
              <input value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value.toUpperCase())} placeholder="e.g. N758WN" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="e.g. ORD" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} placeholder="e.g. 27-31" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Unit Cost ($)</label>
              <input type="number" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} placeholder="e.g. 12500" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Reason / Description *</label>
            <input value={form.reason} onChange={e => set('reason', e.target.value)} required placeholder="e.g. AOG Chicago — System 2 Failure" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Supplier</label>
            <input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="e.g. Boeing Supply Chain" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional notes…" className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Submit Req
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ reqs, parts }) {
  const aogReqs     = reqs.filter(r => r.priority === 'aog');
  const pending     = reqs.filter(r => r.status === 'pending_approval');
  const activeOrders= reqs.filter(r => ['ordered','in_transit'].includes(r.status));
  const received    = reqs.filter(r => r.status === 'received');
  const totalValue  = reqs.reduce((s, r) => s + ((r.unit_cost || 0) * (r.quantity || 1)), 0);
  const ytdSpend    = received.reduce((s, r) => s + ((r.unit_cost || 0) * (r.quantity || 1)), 0);
  const onOrder     = activeOrders.length;

  const belowMin = parts.filter(p => (p.quantity || 1) <= 1).length;

  const fmtMoney = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${v}`;

  const totalParts  = parts.length;
  const availParts  = parts.filter(p => p.status === 'received' || !p.status).length;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={Package}      label="Available Parts"   value={availParts || totalParts} sublabel={`of ${totalParts} total`}      color="text-green-400" />
        <KpiCard icon={DollarSign}   label="Inventory Value"   value={fmtMoney(totalValue)}     sublabel="current book value"            color="text-amber-400" />
        <KpiCard icon={ClipboardList}label="Pending Reqs"      value={pending.length}           sublabel={`${aogReqs.filter(r=>r.status==='pending_approval').length} AOG priority`} color="text-orange-400" />
        <KpiCard icon={ShoppingCart} label="Active Orders"     value={activeOrders.length}      sublabel={`${activeOrders.filter(r=>r.status==='in_transit').length} in transit`}   color="text-blue-400" />
        <KpiCard icon={TrendingUp}   label="YTD Spend"         value={fmtMoney(ytdSpend)}       sublabel="received orders only"          color="text-purple-400" />
        <KpiCard icon={Truck}        label="On-Order Items"    value={onOrder}                  sublabel="pending delivery"              color="text-cyan-400" />
      </div>

      {/* Critical Stock Alerts */}
      {(aogReqs.length > 0 || belowMin > 0) && (
        <div className="bg-[#141922] border border-amber-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-extrabold text-amber-400">Critical Stock Alerts</p>
          </div>
          {belowMin > 0 && (
            <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-300">{belowMin} Below Min Stock</p>
                <p className="text-xs text-gray-400">Parts at or below minimum level</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AOG Section */}
      {aogReqs.length > 0 && (
        <div className="bg-[#1a0a0a] border border-red-500/40 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-red-500/30 bg-red-950/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-extrabold text-red-400 uppercase tracking-wide">AOG Aircraft — Immediate Action Required</p>
          </div>
          <div className="divide-y divide-red-500/10">
            {aogReqs.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3 hover:bg-red-950/20">
                <span className="text-sm font-extrabold text-red-300 font-mono w-20 flex-shrink-0">{r.aircraft_tail || '—'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{r.part_name} — {r.reason}</p>
                </div>
                {r.station && <span className="text-xs font-mono text-gray-400 flex-shrink-0">{r.station}</span>}
                <StatusBadge status={r.status} />
                <span className="text-xs text-gray-500 flex-shrink-0">{r.created_date ? format(new Date(r.created_date), 'MMM d, hh:mm aa') : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reqs + Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Reqs */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <p className="text-sm font-extrabold text-white">Recent Requisitions</p>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {reqs.length === 0
              ? <p className="text-center text-gray-500 text-xs py-6">No requisitions yet</p>
              : reqs.slice(0, 8).map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5">
                  <PriorityBadge priority={r.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-300">{r.req_number || '—'}</p>
                    <p className="text-[11px] text-gray-500 truncate">{r.part_name}{r.reason ? ` — ${r.reason}` : ''}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            }
          </div>
        </div>

        {/* Inventory Breakdown */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
            <Layers className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-white">Inventory Breakdown</p>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Available', count: availParts, total: totalParts || 1, color: 'bg-green-500' },
              { label: 'Reserved',  count: parts.filter(p=>p.status==='ordered').length,    total: totalParts||1, color: 'bg-blue-500' },
              { label: 'Installed', count: parts.filter(p=>p.status==='installed').length,  total: totalParts||1, color: 'bg-purple-500' },
              { label: 'On Order',  count: parts.filter(p=>p.status==='in_transit').length, total: totalParts||1, color: 'bg-amber-500' },
            ].map(({ label, count, total, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-bold text-white">{count}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.max(2, (count/total)*100)}%` }} />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div className="text-center">
                <p className="text-xl font-black text-primary">{fmtMoney(totalValue)}</p>
                <p className="text-[10px] text-gray-500">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-white">{totalParts}</p>
                <p className="text-[10px] text-gray-500">Part Numbers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Requisitions Tab ──────────────────────────────────────────────────────────
function RequisitionsTab({ reqs, onStatusChange }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? reqs : reqs.filter(r => r.status === filter || r.priority === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['all', 'pending_approval', 'approved', 'ordered', 'in_transit', 'received', 'aog', 'critical'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
              filter === f ? 'bg-primary text-primary-foreground border-transparent' : 'border-white/10 text-gray-400 hover:text-white')}>
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>
      <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Priority','Req #','Part Name','Part #','Tail','Station','Qty','Status','Supplier','Date'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-8 text-gray-500">No requisitions found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4"><PriorityBadge priority={r.priority} /></td>
                  <td className="py-3 px-4 font-mono text-xs text-primary">{r.req_number || '—'}</td>
                  <td className="py-3 px-4 text-white font-medium max-w-[200px]">
                    <p className="truncate">{r.part_name}</p>
                    {r.reason && <p className="text-[10px] text-gray-500 truncate">{r.reason}</p>}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">{r.part_number || '—'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-cyan-400">{r.aircraft_tail || '—'}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">{r.station || '—'}</td>
                  <td className="py-3 px-4 text-xs text-white">{r.quantity}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4 text-xs text-gray-400 max-w-[120px] truncate">{r.supplier || '—'}</td>
                  <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{r.created_date ? format(new Date(r.created_date), 'MMM d') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Inventory Tab ─────────────────────────────────────────────────────────────
function InventoryTab({ parts }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Part Name','Part #','OOS Entry','Qty','Status','Source','ETA','Notes'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {parts.length === 0
              ? <tr><td colSpan="8" className="text-center py-8 text-gray-500">No parts in inventory</td></tr>
              : parts.map(p => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="py-3 px-4 text-white font-medium">{p.part_name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">{p.part_number || '—'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-primary">{p.oos_entry_id || '—'}</td>
                  <td className="py-3 px-4 text-white">{p.quantity}</td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4 text-xs text-gray-400">{p.source || '—'}</td>
                  <td className="py-3 px-4 text-xs text-amber-400">{p.eta || '—'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500 max-w-[160px] truncate">{p.notes || '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ reqs }) {
  const byPriority = { aog: 0, critical: 0, routine: 0 };
  const byStatus   = {};
  reqs.forEach(r => {
    byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
    byStatus[r.status]     = (byStatus[r.status] || 0) + 1;
  });
  const totalCost = reqs.reduce((s, r) => s + ((r.unit_cost || 0) * (r.quantity || 1)), 0);
  const fmtMoney  = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${v}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-extrabold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Requisitions by Priority</p>
        {Object.entries(byPriority).map(([key, count]) => {
          const cfg = PRIORITY_CFG[key];
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <PriorityBadge priority={key} />
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', cfg.bg)} style={{ width: `${reqs.length > 0 ? (count/reqs.length)*100 : 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-extrabold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Requisitions by Status</p>
        {Object.entries(byStatus).map(([key, count]) => {
          const cfg = STATUS_CFG[key] || STATUS_CFG.pending_approval;
          return (
            <div key={key} className="flex items-center justify-between">
              <StatusBadge status={key} />
              <span className="text-xs font-bold text-white">{count}</span>
            </div>
          );
        })}
        {Object.keys(byStatus).length === 0 && <p className="text-gray-500 text-xs">No data yet</p>}
      </div>
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 md:col-span-2">
        <p className="text-sm font-extrabold text-white mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Spend Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Requisitioned', value: fmtMoney(totalCost), color: 'text-primary' },
            { label: 'AOG Spend',           value: fmtMoney(reqs.filter(r=>r.priority==='aog').reduce((s,r)=>s+((r.unit_cost||0)*(r.quantity||1)),0)), color: 'text-red-400' },
            { label: 'Critical Spend',      value: fmtMoney(reqs.filter(r=>r.priority==='critical').reduce((s,r)=>s+((r.unit_cost||0)*(r.quantity||1)),0)), color: 'text-orange-400' },
            { label: 'Routine Spend',       value: fmtMoney(reqs.filter(r=>r.priority==='routine').reduce((s,r)=>s+((r.unit_cost||0)*(r.quantity||1)),0)), color: 'text-gray-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0d1117] rounded-xl p-4 text-center">
              <p className={cn('text-2xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Part Categories Tab ───────────────────────────────────────────────────────
function CategoryCard({ cat }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cat.color + '/20')}>
          <Tag className={cn('w-5 h-5', cat.color.replace('bg-', 'text-'))} />
        </div>
        {cat.expendable && (
          <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/20">
            Expendable
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-extrabold text-white">{cat.name}</p>
        <p className="text-[10px] text-gray-500">ATA {cat.ata}</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-black text-white">{cat.count}</p>
          <p className="text-[10px] text-gray-600">Part numbers</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-primary">{cat.value}</p>
          <p className="text-[10px] text-gray-600">Book value</p>
        </div>
      </div>
    </div>
  );
}

function PartCategoriesTab() {
  const rotables   = PART_CATEGORIES.filter(c => !c.expendable);
  const expendables = PART_CATEGORIES.filter(c => c.expendable);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Rotables / Repairables</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rotables.map(cat => <CategoryCard key={cat.name} cat={cat} />)}
        </div>
      </div>
      <div>
        <p className="text-xs font-extrabold text-lime-500 uppercase tracking-widest mb-3">Expendables / Consumables</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {expendables.map(cat => <CategoryCard key={cat.name} cat={cat} />)}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PartsSupplyDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showNewReq, setShowNewReq] = useState(false);
  const qc = useQueryClient();

  const { data: reqs = [], isLoading: loadingReqs, refetch: refetchReqs } = useQuery({
    queryKey: ['supply-reqs'],
    queryFn: () => base44.entities.SupplyRequisition.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: parts = [], refetch: refetchParts } = useQuery({
    queryKey: ['supply-parts'],
    queryFn: () => base44.entities.Part.list('part_name', 500),
    refetchInterval: 60000,
  });

  const createReq = useMutation({
    mutationFn: (data) => base44.entities.SupplyRequisition.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['supply-reqs'] }); setShowNewReq(false); },
  });

  const aogCount = reqs.filter(r => r.priority === 'aog' && r.status !== 'received' && r.status !== 'cancelled').length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0e18] px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mt-0.5 flex-shrink-0">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-primary tracking-widest uppercase">Fleet Supply & Logistics</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Enterprise Parts Management System</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {aogCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-950/50 border border-red-500/40 text-red-400 text-xs font-extrabold px-3 py-2 rounded-xl animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                {aogCount} AOG ACTIVE
              </div>
            )}
            <button onClick={() => setShowNewReq(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> New Requisition
            </button>
            <button onClick={() => { refetchReqs(); refetchParts(); }}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const badge = tab === 'Inventory' ? parts.length
              : tab === 'Requisitions' ? reqs.filter(r => r.status === 'pending_approval').length
              : tab === 'Orders' ? reqs.filter(r => ['ordered','in_transit'].includes(r.status)).length
              : null;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-white hover:bg-white/5'
                )}>
                {tab}
                {badge > 0 && (
                  <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-full', activeTab === tab ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-300')}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5">
        {loadingReqs && activeTab === 'Overview' ? (
          <div className="text-gray-500 text-sm text-center py-12">Loading…</div>
        ) : activeTab === 'Overview'         ? <OverviewTab reqs={reqs} parts={parts} />
          : activeTab === 'Inventory'        ? <InventoryTab parts={parts} />
          : activeTab === 'Requisitions'     ? <RequisitionsTab reqs={reqs} />
          : activeTab === 'Orders'           ? <RequisitionsTab reqs={reqs.filter(r => ['ordered','in_transit','received'].includes(r.status))} />
          : activeTab === 'Analytics'        ? <AnalyticsTab reqs={reqs} />
          : activeTab === 'Part Categories'  ? <PartCategoriesTab />
          : null
        }
      </div>

      {showNewReq && (
        <NewReqModal onClose={() => setShowNewReq(false)} onCreate={data => createReq.mutate(data)} />
      )}
    </div>
  );
}