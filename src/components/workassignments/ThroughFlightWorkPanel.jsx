import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Clock, AlertTriangle, Plus, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CHECK_TYPES = [
  { value: 'etops_check', label: 'ETOPS Flight Check', ata: '05', icon: '✈️', critical: true },
  { value: 'tire_pressure', label: 'Tire Pressure Check', ata: '32', icon: '🔵', critical: false },
  { value: 'oil_check', label: 'Oil Level Check', ata: '79', icon: '🟡', critical: false },
  { value: 'repetitive_inspection', label: 'Repetitive Inspection', ata: '05', icon: '🔁', critical: false },
  { value: 'transit_check', label: 'Transit Check', ata: '05', icon: '🛬', critical: false },
  { value: 'fluid_servicing', label: 'Fluid Servicing', ata: '12', icon: '💧', critical: false },
  { value: 'walk_around', label: 'Exterior Walk-Around', ata: '05', icon: '👁️', critical: false },
  { value: 'avionics_check', label: 'Avionics / IRS Align', ata: '34', icon: '📡', critical: true },
  { value: 'etops_req_item', label: 'ETOPS Required Item', ata: '05', icon: '🛡️', critical: true },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-muted-foreground bg-secondary' },
  assigned: { label: 'Assigned', color: 'text-blue-400 bg-blue-500/20' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400 bg-yellow-500/20' },
  complete: { label: 'Complete', color: 'text-green-400 bg-green-500/20' },
};

function NewThroughFlightModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({
    aircraft_tail: '',
    check_type: 'transit_check',
    flight_number: '',
    station: '',
    technician: '',
    notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const checkDef = CHECK_TYPES.find(c => c.value === form.check_type);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-bold text-foreground">New Through-Flight Task</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Check Type *</label>
            <select value={form.check_type} onChange={e => set('check_type', e.target.value)} required
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
              {CHECK_TYPES.map(c => (
                <option key={c.value} value={c.value}>{c.icon} {c.label} — ATA {c.ata}</option>
              ))}
            </select>
          </div>
          {checkDef?.critical && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400 font-bold">ETOPS/Safety Critical — requires RII qualified technician</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Aircraft Tail *</label>
              <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select…</option>
                {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())}
                placeholder="KEWR" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Flight #</label>
              <input value={form.flight_number} onChange={e => set('flight_number', e.target.value.toUpperCase())}
                placeholder="AA1234" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Assign To</label>
              <input value={form.technician} onChange={e => set('technician', e.target.value)}
                placeholder="Tech name" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="Special instructions…"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" disabled={!form.aircraft_tail}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ThroughFlightCard({ task, onComplete }) {
  const checkDef = CHECK_TYPES.find(c => c.value === task.check_type) || { label: task.check_type, icon: '🔧', critical: false };
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  return (
    <div className={cn('bg-card border rounded-2xl p-4 space-y-3',
      checkDef.critical ? 'border-amber-500/40' : 'border-border')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="text-xl mt-0.5">{checkDef.icon}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{checkDef.label}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span className="font-mono font-bold text-primary">{task.aircraft_tail}</span>
              {task.flight_number && <span>· {task.flight_number}</span>}
              {task.station && <span>· {task.station}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusCfg.color)}>{statusCfg.label}</span>
          {checkDef.critical && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">CRITICAL</span>
          )}
        </div>
      </div>

      {task.technician && (
        <p className="text-xs text-muted-foreground">Assigned: <span className="text-foreground font-semibold">{task.technician}</span></p>
      )}
      {task.notes && (
        <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2 py-1.5">{task.notes}</p>
      )}

      {task.status !== 'complete' && (
        <button onClick={() => onComplete(task.id)}
          className="w-full py-1.5 rounded-lg bg-green-600/20 text-green-400 text-xs font-bold hover:bg-green-600/30 flex items-center justify-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" /> Mark Complete
        </button>
      )}
    </div>
  );
}

export default function ThroughFlightWorkPanel({ aircraft = [] }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['through-flight-tasks', today],
    queryFn: () => base44.entities.LogbookEntry.filter({
      entry_type: 'info',
      flight_phase: 'transit',
    }, '-created_date', 200),
    select: (data) => data
      .filter(e => e.description?.includes('[THROUGH-FLIGHT]'))
      .map(e => {
        const meta = JSON.parse(e.notes || '{}');
        return {
          id: e.id,
          aircraft_tail: e.aircraft_tail,
          check_type: meta.check_type || 'transit_check',
          flight_number: e.flight_number,
          station: e.station,
          technician: e.technician_name,
          notes: meta.notes || '',
          status: meta.status || 'pending',
        };
      }),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (form) => base44.entities.LogbookEntry.create({
      aircraft_tail: form.aircraft_tail,
      entry_type: 'info',
      flight_number: form.flight_number,
      station: form.station,
      flight_phase: 'transit',
      ata_chapter: CHECK_TYPES.find(c => c.value === form.check_type)?.ata || '05',
      description: `[THROUGH-FLIGHT] ${CHECK_TYPES.find(c => c.value === form.check_type)?.label || form.check_type}`,
      technician_name: form.technician,
      notes: JSON.stringify({ check_type: form.check_type, notes: form.notes, status: 'assigned' }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['through-flight-tasks'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => {
      const task = tasks.find(t => t.id === id);
      return base44.entities.LogbookEntry.update(id, {
        notes: JSON.stringify({ check_type: task?.check_type, notes: task?.notes, status: 'complete' }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['through-flight-tasks'] }),
  });

  const types = ['all', ...CHECK_TYPES.map(c => c.value)];
  const filtered = filterType === 'all' ? tasks : tasks.filter(t => t.check_type === filterType);
  const criticalPending = tasks.filter(t => {
    const def = CHECK_TYPES.find(c => c.value === t.check_type);
    return def?.critical && t.status !== 'complete';
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Through-Flight Workload</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{tasks.length} tasks today
            {criticalPending > 0 && <span className="text-amber-400 font-bold"> · {criticalPending} critical pending</span>}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>

      {criticalPending > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400 font-bold">{criticalPending} ETOPS/safety-critical task{criticalPending > 1 ? 's' : ''} pending completion</p>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setFilterType('all')}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0',
            filterType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
          All ({tasks.length})
        </button>
        {CHECK_TYPES.map(c => {
          const count = tasks.filter(t => t.check_type === c.value).length;
          if (count === 0) return null;
          return (
            <button key={c.value} onClick={() => setFilterType(c.value)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0',
                filterType === c.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {c.icon} {c.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No through-flight tasks assigned today</p>
          <button onClick={() => setShowModal(true)}
            className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
            Assign First Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(task => (
            <ThroughFlightCard key={task.id} task={task} onComplete={completeMutation.mutate} />
          ))}
        </div>
      )}

      {showModal && (
        <NewThroughFlightModal
          aircraft={aircraft}
          onClose={() => setShowModal(false)}
          onCreate={(form) => createMutation.mutate(form)}
        />
      )}
    </div>
  );
}