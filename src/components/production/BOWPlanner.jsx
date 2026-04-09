import { useState } from 'react';
import { Plus, X, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function BOWCard({ item, onEdit, onDelete }) {
  return (
    <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-white">{item.tail_number}</p>
            <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full',
              item.priority === 'critical' ? 'bg-red-900/50 text-red-400' :
              item.priority === 'high' ? 'bg-orange-900/50 text-orange-400' :
              'bg-blue-900/50 text-blue-400'
            )}>
              {item.priority?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-400">{item.work_scope}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>📅 {format(new Date(item.planned_date), 'MMM d, yyyy')}</span>
            <span>⏱️ {item.estimated_hours}h</span>
            <span>✈️ {item.aircraft_type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(item)} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white text-xs">
            ✏️
          </button>
          <button onClick={() => onDelete(item.id)} className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {item.notes && (
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">{item.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <span className={cn('w-2 h-2 rounded-full',
          item.status === 'scheduled' ? 'bg-blue-500' :
          item.status === 'in_progress' ? 'bg-yellow-500' :
          'bg-green-500'
        )} />
        <p className="text-[10px] text-gray-600 uppercase">{item.status?.replace('_', ' ')}</p>
      </div>
    </div>
  );
}

function NewBOWModal({ onClose, onSubmit, isPending }) {
  const [form, setForm] = useState({
    tail_number: '',
    work_scope: '',
    aircraft_type: '',
    estimated_hours: 40,
    priority: 'medium',
    planned_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tail_number.trim() || !form.work_scope.trim()) return;
    onSubmit(form);
    setForm({
      tail_number: '',
      work_scope: '',
      aircraft_type: '',
      estimated_hours: 40,
      priority: 'medium',
      planned_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#0f1419] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="text-sm font-extrabold text-white">New BOW (Build of Work)</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Tail Number *</label>
              <input
                value={form.tail_number}
                onChange={e => setForm({...form, tail_number: e.target.value})}
                placeholder="e.g. N455GJ"
                required
                className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Aircraft Type</label>
              <select
                value={form.aircraft_type}
                onChange={e => setForm({...form, aircraft_type: e.target.value})}
                className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary/40"
              >
                <option>Select Type</option>
                <option>B737-800</option>
                <option>B757</option>
                <option>A320</option>
                <option>A350</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Work Scope *</label>
            <input
              value={form.work_scope}
              onChange={e => setForm({...form, work_scope: e.target.value})}
              placeholder="e.g. C-Check, Engine Overhaul, Structural Repair"
              required
              className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Est. Hours</label>
              <input
                type="number"
                min="1"
                value={form.estimated_hours}
                onChange={e => setForm({...form, estimated_hours: parseInt(e.target.value) || 40})}
                className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({...form, priority: e.target.value})}
                className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary/40"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Date</label>
              <input
                type="date"
                value={form.planned_date}
                onChange={e => setForm({...form, planned_date: e.target.value})}
                className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
              placeholder="Additional work details, restrictions, etc."
              rows={2}
              className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Create BOW
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BOWPlanner() {
  const [bows, setBows] = useState([
    {
      id: 1,
      tail_number: 'N455GJ',
      aircraft_type: 'B737-800',
      work_scope: 'C-Check',
      estimated_hours: 120,
      priority: 'high',
      planned_date: '2026-04-15',
      status: 'scheduled',
      notes: 'Scheduled for KDFW hangar bay 1',
    },
    {
      id: 2,
      tail_number: 'N789KL',
      aircraft_type: 'A320',
      work_scope: 'Engine Overhaul - Left Engine',
      estimated_hours: 240,
      priority: 'critical',
      planned_date: '2026-04-12',
      status: 'in_progress',
      notes: 'High priority - AOG risk',
    },
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleNewBOW = (form) => {
    const newBow = {
      id: Math.max(...bows.map(b => b.id), 0) + 1,
      ...form,
      status: 'scheduled',
    };
    setBows([newBow, ...bows]);
    setShowNewModal(false);
  };

  const handleDelete = (id) => {
    setBows(bows.filter(b => b.id !== id));
  };

  const totalHours = bows.reduce((sum, b) => sum + b.estimated_hours, 0);
  const criticalCount = bows.filter(b => b.priority === 'critical').length;
  const inProgressCount = bows.filter(b => b.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔨</span>
          <h2 className="text-2xl font-black text-primary">BOW PLANNER</h2>
        </div>
        <p className="text-sm text-gray-400">Build of Work planning & scheduling — manage hangar maintenance workflow</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Total BOWs</p>
          <p className="text-3xl font-black text-white">{bows.length}</p>
        </div>
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Critical</p>
          <p className="text-3xl font-black text-red-400">{criticalCount}</p>
        </div>
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">In Progress</p>
          <p className="text-3xl font-black text-yellow-400">{inProgressCount}</p>
        </div>
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Est. Hours</p>
          <p className="text-3xl font-black text-cyan-400">{totalHours}h</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Active BOWs</h3>
          <p className="text-xs text-gray-500 mt-0.5">Planned maintenance schedules and hangar assignments</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> New BOW
        </button>
      </div>

      {bows.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-lg font-bold">No BOWs scheduled</p>
          <p className="text-sm mt-2">Create your first Build of Work to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bows.map(bow => (
            <BOWCard key={bow.id} item={bow} onEdit={setEditingItem} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewBOWModal onClose={() => setShowNewModal(false)} onSubmit={handleNewBOW} />
      )}
    </div>
  );
}