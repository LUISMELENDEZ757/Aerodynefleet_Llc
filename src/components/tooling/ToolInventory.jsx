import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, MapPin, Calendar, Wrench, Zap, Microscope, LayoutGrid, List, QrCode, User, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  available:       { label: 'Avail',    color: 'bg-green-500 text-white',  icon: CheckCircle },
  checked_out:     { label: 'Out',      color: 'bg-blue-500 text-white',   icon: User },
  calibration_due: { label: 'Cal Due',  color: 'bg-orange-500 text-white', icon: Clock },
  damaged:         { label: 'Damaged',  color: 'bg-red-600 text-white',    icon: AlertTriangle },
  retired:         { label: 'Retired',  color: 'bg-gray-600 text-white',   icon: X },
};

const CAT_ICONS = {
  torque: Wrench, pneumatic: Zap, electrical: Zap,
  measuring: Microscope, hand_tool: Wrench, inspection: Microscope,
  cutting: Wrench, other: Wrench,
};

// Simple QR-like SVG placeholder
function QRBlock({ text }) {
  return (
    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
      <QrCode className="w-10 h-10 text-black" />
    </div>
  );
}

function CheckOutModal({ tool, onClose, onSuccess }) {
  const [form, setForm] = useState({ technician_name: '', technician_id: '', to_location: '' });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Tool.update(tool.id, { status: 'checked_out', assigned_to: form.technician_name, usage_count: (tool.usage_count || 0) + 1 });
      await base44.entities.ToolTransaction.create({
        tool_number: tool.tool_number,
        tool_name: tool.name,
        transaction_type: 'checkout',
        technician_name: form.technician_name,
        technician_id: form.technician_id,
        from_location: tool.location,
        to_location: form.to_location,
        timestamp: new Date().toISOString(),
        scan_method: 'manual',
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tools', 'tool-transactions'] }); onSuccess(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141922] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white">Check Out Tool</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-400 font-bold">{tool.tool_number}</p>
            <p className="text-sm font-bold text-white">{tool.name}</p>
          </div>
          {[
            { key: 'technician_name', label: 'Technician Name *', placeholder: 'Full name' },
            { key: 'technician_id',   label: 'Employee / Cert #', placeholder: 'ID number' },
            { key: 'to_location',     label: 'Destination',       placeholder: 'e.g. Hangar 2 - Gate 5' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
              <input
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button
              disabled={!form.technician_name || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 disabled:opacity-50"
            >
              {mutation.isPending ? 'Checking Out…' : 'Check Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckInModal({ tool, onClose, onSuccess }) {
  const [techName, setTechName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Tool.update(tool.id, { status: 'available', assigned_to: '' });
      await base44.entities.ToolTransaction.create({
        tool_number: tool.tool_number,
        tool_name: tool.name,
        transaction_type: 'checkin',
        technician_name: techName,
        from_location: tool.location,
        timestamp: new Date().toISOString(),
        scan_method: 'manual',
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tools', 'tool-transactions'] }); onSuccess(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#141922] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white">Check In Tool</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <p className="text-xs text-green-400 font-bold">{tool.tool_number}</p>
            <p className="text-sm font-bold text-white">{tool.name}</p>
            {tool.assigned_to && <p className="text-xs text-gray-400 mt-0.5">Currently with: {tool.assigned_to}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Returning Technician *</label>
            <input value={techName} onChange={e => setTechName(e.target.value)} placeholder="Full name" className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button disabled={!techName || mutation.isPending} onClick={() => mutation.mutate()} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-50">
              {mutation.isPending ? 'Checking In…' : 'Check In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ tool, onAction }) {
  const status = STATUS_CFG[tool.status] || STATUS_CFG.available;
  const StatusIcon = status.icon;
  const CatIcon = CAT_ICONS[tool.category] || Wrench;
  const isCalDue = tool.status === 'calibration_due';

  const calColor = isCalDue ? 'text-orange-400' : 'text-gray-400';

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-orange-500/30 transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CatIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="text-xs font-mono text-gray-400 truncate">{tool.tool_number}</span>
          <span className={cn('flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', status.color)}>
            <StatusIcon className="w-3 h-3" /> {status.label}
          </span>
        </div>
        <QRBlock text={tool.tool_number} />
      </div>

      {/* Name */}
      <div>
        <p className="text-base font-extrabold text-white leading-tight">{tool.name}</p>
        {tool.manufacturer && <p className="text-xs text-gray-500 mt-0.5">{tool.manufacturer} {tool.model}</p>}
      </div>

      {/* Location */}
      {tool.location && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
          {tool.location}
        </div>
      )}

      {/* Assigned to */}
      {tool.assigned_to && (
        <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/20 rounded-lg px-3 py-2">
          <User className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-blue-300">{tool.assigned_to}</span>
        </div>
      )}

      {/* Calibration */}
      {tool.calibration_due && (
        <div className={cn('flex items-center gap-2 text-xs', calColor)}>
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          Cal: {tool.calibration_due}
        </div>
      )}

      {/* Value & Usage */}
      <div className="flex items-center justify-between text-xs">
        {tool.value ? <span>Value: <span className="text-green-400 font-bold">${tool.value.toLocaleString()}</span></span> : <span />}
        {tool.usage_count != null && <span className="text-gray-300 font-bold">Usage: {tool.usage_count}x</span>}
      </div>

      {/* Action Button */}
      {tool.status === 'available' && (
        <button onClick={() => onAction('checkout', tool)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors">
          Check Out Tool
        </button>
      )}
      {tool.status === 'checked_out' && (
        <button onClick={() => onAction('checkin', tool)} className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors">
          Check In Tool
        </button>
      )}
      {tool.status === 'calibration_due' && (
        <button onClick={() => onAction('calibrate', tool)} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors">
          Calibrate Now
        </button>
      )}
    </div>
  );
}

export default function ToolInventory({ tools, transactions, onRefresh }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('grid');
  const [modal, setModal] = useState(null); // { type: 'checkout'|'checkin', tool }

  const filtered = tools.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !search || t.name?.toLowerCase().includes(q) || t.tool_number?.toLowerCase().includes(q) || t.manufacturer?.toLowerCase().includes(q);
    const matchCat = !catFilter || t.category === catFilter;
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const handleAction = (type, tool) => {
    if (type === 'calibrate') {
      // handled in calibration tab — just show a note
      return;
    }
    setModal({ type, tool });
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tools by name, number, or manufacturer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
          <option value="">All Categories</option>
          <option value="torque">Torque</option>
          <option value="pneumatic">Pneumatic</option>
          <option value="electrical">Electrical</option>
          <option value="measuring">Measuring</option>
          <option value="hand_tool">Hand Tool</option>
          <option value="inspection">Inspection</option>
          <option value="cutting">Cutting</option>
          <option value="other">Other</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="checked_out">Checked Out</option>
          <option value="calibration_due">Cal Due</option>
          <option value="damaged">Damaged</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {/* Count + View toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          <span className="text-white font-bold">{filtered.length}</span> of <span className="text-white font-bold">{tools.length}</span> tools
        </p>
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button onClick={() => setView('grid')} className={cn('px-3 py-2 flex items-center justify-center transition-all', view === 'grid' ? 'bg-orange-500 text-white' : 'bg-[#141922] text-gray-400 hover:text-white')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={cn('px-3 py-2 flex items-center justify-center transition-all', view === 'list' ? 'bg-orange-500 text-white' : 'bg-[#141922] text-gray-400 hover:text-white')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">No tools found</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => <ToolCard key={t.id} tool={t} onAction={handleAction} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-[#141922] border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 w-24">{t.tool_number}</span>
                <span className="text-sm font-bold text-white">{t.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {t.location && <span className="text-xs text-gray-500 hidden sm:block">{t.location}</span>}
                <span className={cn('text-xs font-bold px-2 py-1 rounded-full', STATUS_CFG[t.status]?.color)}>
                  {STATUS_CFG[t.status]?.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'checkout' && <CheckOutModal tool={modal.tool} onClose={() => setModal(null)} onSuccess={() => { setModal(null); onRefresh(); }} />}
      {modal?.type === 'checkin'  && <CheckInModal  tool={modal.tool} onClose={() => setModal(null)} onSuccess={() => { setModal(null); onRefresh(); }} />}
    </div>
  );
}