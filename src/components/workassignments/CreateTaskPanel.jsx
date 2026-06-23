import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, CheckCircle, Loader2, User, Plane, Clock, AlertTriangle, Wrench, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITIES = ['routine', 'urgent', 'aog'];
const TASK_TYPES = [
  'Scheduled Inspection',
  'Unscheduled Maintenance',
  'System Troubleshooting',
  'Component Replacement',
  'Rigging / Adjustment',
  'Servicing (Oil/Fluids)',
  'Avionics / Software',
  'Structural Repair',
  'Cabin Discrepancy',
  'Ground Support Equipment',
  'Other',
];

const PRIORITY_CFG = {
  routine: { color: 'text-blue-400',   bg: 'bg-blue-500/10   border-blue-500/30' },
  urgent:  { color: 'text-amber-400',  bg: 'bg-amber-500/10  border-amber-500/30' },
  aog:     { color: 'text-red-400',    bg: 'bg-red-500/10    border-red-500/30' },
};

const EMPTY = {
  aircraft_tail: '',
  part_name: '',       // re-used as task title
  station: '',
  priority: 'routine',
  requested_by: '',    // re-used as assigned technician
  notes: '',
  task_type: TASK_TYPES[0],
  estimated_hours: '',
  status: 'pending',
};

export default function CreateTaskPanel({ aircraft = [] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAircraftChange = (tailNumber) => {
    const selected = aircraft.find(a => a.tail_number === tailNumber);
    setForm(f => ({
      ...f,
      aircraft_tail: tailNumber,
      station: selected?.base_station ? selected.base_station : f.station,
    }));
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      // 1. Create the supply requisition task
      const task = await base44.entities.SupplyRequisition.create(data);

      // 2. Mirror as a LogbookEntry so Fleet Dashboard shows it on the aircraft timeline
      await base44.entities.LogbookEntry.create({
        aircraft_tail: data.aircraft_tail,
        entry_type: 'info',
        discrepancy_status: 'IN_PROGRESS',
        station: data.station || '',
        description: `[TASK ASSIGNED] ${data.part_name} — Assigned to: ${data.requested_by}${data.notes ? ' | ' + data.notes : ''}`,
        technician_name: data.requested_by,
        ata_chapter: '',
      });

      return task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bow-daily-assignments'] });
      qc.invalidateQueries({ queryKey: ['fleet-logbook'] });
      qc.invalidateQueries({ queryKey: ['fleet-aircraft'] });
      setSubmitted(true);
      setTimeout(() => {
        setForm(EMPTY);
        setSubmitted(false);
      }, 2000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.part_name || !form.aircraft_tail || !form.requested_by) {
      console.error('Missing required fields:', { part_name: form.part_name, aircraft_tail: form.aircraft_tail, requested_by: form.requested_by });
      return;
    }
    console.log('Submitting task:', form);
    mutation.mutate({
      aircraft_tail: form.aircraft_tail.toUpperCase(),
      part_name: `[${form.task_type}] ${form.part_name}`,
      station: form.station.toUpperCase(),
      priority: form.priority,
      requested_by: form.requested_by,
      notes: [form.notes, form.estimated_hours ? `Est. ${form.estimated_hours} hrs` : ''].filter(Boolean).join(' | '),
      status: 'pending',
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <CheckCircle className="w-16 h-16 text-green-400" />
        <p className="text-xl font-extrabold text-foreground">Task Created</p>
        <p className="text-sm text-muted-foreground">Task added to Daily Assignments and visible on the Fleet Dashboard aircraft timeline.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-extrabold text-foreground">Create Daily Task</p>
            <p className="text-xs text-muted-foreground">Assign work to a technician for today's shift</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Priority Selector */}
          <div>
            <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">
              <AlertTriangle className="w-3 h-3 inline mr-1" />Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p} type="button" onClick={() => set('priority', p)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border text-xs font-extrabold uppercase transition-all',
                    form.priority === p ? PRIORITY_CFG[p].bg + ' ' + PRIORITY_CFG[p].color : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                  )}>
                  {p === 'aog' ? '🔴 AOG' : p === 'urgent' ? '🟡 Urgent' : '🔵 Routine'}
                </button>
              ))}
            </div>
          </div>

          {/* Task Type */}
          <div>
            <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">
              <Tag className="w-3 h-3 inline mr-1" />Task Type
            </label>
            <select value={form.task_type} onChange={e => set('task_type', e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary">
              {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">
              <Wrench className="w-3 h-3 inline mr-1" />Task Description *
            </label>
            <input
              value={form.part_name}
              onChange={e => set('part_name', e.target.value)}
              placeholder="e.g. Inspect hydraulic pump — ATA 29"
              required
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Aircraft + Station Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">
                <Plane className="w-3 h-3 inline mr-1" />Aircraft Tail *
              </label>
              {aircraft.length > 0 ? (
                <select value={form.aircraft_tail} onChange={e => handleAircraftChange(e.target.value)} required
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                  <option value="">Select tail…</option>
                  {aircraft.map(a => (
                    <option key={a.id} value={a.tail_number}>
                      {a.tail_number} — {a.aircraft_type}{a.base_station ? ` · ${a.base_station}` : ''}{a.status === 'oos' ? ' ⚠️ OOS' : a.status === 'maintenance' ? ' 🔧 MX' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required
                  placeholder="e.g. N738AD"
                  className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary uppercase" />
              )}
            </div>
            <div>
              <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">
                Station / Gate
              </label>
              <input value={form.station} onChange={e => set('station', e.target.value)}
                placeholder="e.g. KEWR · Gate A12"
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
            </div>
          </div>

          {/* Technician + Hours Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">
                <User className="w-3 h-3 inline mr-1" />Assign to Technician *
              </label>
              <input value={form.requested_by} onChange={e => set('requested_by', e.target.value)} required
                placeholder="Technician name or ID"
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">
                <Clock className="w-3 h-3 inline mr-1" />Est. Hours
              </label>
              <input value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)}
                placeholder="e.g. 2.5"
                type="number" min="0.5" step="0.5"
                className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">Notes / Instructions</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Additional instructions, MEL reference, logpage number…"
              rows={3}
              className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none" />
          </div>

          {/* Submit */}
          <button type="submit" 
            disabled={mutation.isPending || !form.part_name.trim() || !form.aircraft_tail.trim() || !form.requested_by.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {mutation.isPending ? 'Creating Task…' : 'Create & Assign Task'}
          </button>
        </form>
      </div>
    </div>
  );
}