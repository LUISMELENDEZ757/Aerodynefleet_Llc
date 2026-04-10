import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plane, Building2, Play, CheckCircle, Wrench, MapPin, Plus, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCATION_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'gate', label: 'Gate / Line' },
  { id: 'hangar', label: 'Hangar' },
];

function getLocationType(entry) {
  const desc = (entry.description || '').toLowerCase();
  const notes = (entry.notes || '').toLowerCase();
  if (desc.includes('hangar') || notes.includes('hangar')) return 'hangar';
  return 'gate';
}

function AddTechnicianModal({ tail, onClose }) {
  const [name, setName] = useState('');
  const [cert, setCert] = useState('');
  const [location, setLocation] = useState('gate');
  const [notes, setNotes] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-discrepancies'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    mutation.mutate({
      aircraft_tail: tail,
      entry_type: 'discrepancy',
      discrepancy_status: 'IN_PROGRESS',
      description: `[TECH ASSIGNED] ${location === 'hangar' ? 'Hangar' : 'Gate/Line'} operations assignment${notes ? ': ' + notes : ''}`,
      technician_name: name,
      technician_id: cert,
      notes: `Location: ${location}${notes ? ' | ' + notes : ''}`,
      work_started_at: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-extrabold text-foreground text-sm">
            Assign Technician — <span className="text-primary font-mono">{tail}</span>
          </p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Location Type</label>
            <div className="flex gap-2">
              {[{ id: 'gate', label: '✈ Gate / Line' }, { id: 'hangar', label: '🏭 Hangar' }].map(lt => (
                <button key={lt.id} type="button" onClick={() => setLocation(lt.id)}
                  className={cn('flex-1 py-2 rounded-xl text-xs font-bold transition-all border',
                    location === lt.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-muted-foreground border-border hover:text-foreground')}>
                  {lt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Technician Name *</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Cert / License #</label>
            <input value={cert} onChange={e => setCert(e.target.value)} placeholder="e.g. AMT-12345"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Task / Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Oil service, pre-departure check…"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> {mutation.isPending ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AircraftCard({ tail, type, status, tasks, onAssign, onAddTech }) {
  const statusColor = {
    active: 'text-green-400 bg-green-500/15',
    oos: 'text-red-400 bg-red-500/15',
    maintenance: 'text-amber-400 bg-amber-500/15',
    retired: 'text-gray-400 bg-gray-500/10',
  }[status] || 'text-gray-400 bg-gray-500/10';

  const openTasks = tasks.filter(t => t.discrepancy_status !== 'CLOSED');
  const inProgress = tasks.filter(t => t.discrepancy_status === 'IN_PROGRESS');
  const unassigned = tasks.filter(t => t.discrepancy_status === 'OPEN');

  return (
    <div className={cn('bg-card border rounded-2xl overflow-hidden', openTasks.length > 0 ? 'border-amber-500/30' : 'border-border')}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-extrabold text-foreground font-mono">{tail}</span>
          {type && <span className="text-[10px] text-muted-foreground">{type}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddTech(tail)}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
            <Plus className="w-3 h-3" /> Add Tech
          </button>
          <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full', statusColor)}>
            {status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Task summary */}
      <div className="flex gap-4 px-4 py-2 border-b border-border text-[10px] font-bold">
        <span className="text-red-400">{unassigned.length} unassigned</span>
        <span className="text-amber-400">{inProgress.length} in progress</span>
        <span className="text-green-400">{tasks.length - openTasks.length} closed</span>
      </div>

      {/* Task rows */}
      {openTasks.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" /> No open tasks
        </div>
      ) : (
        <div className="divide-y divide-border">
          {openTasks.map(task => (
            <div key={task.id} className="flex items-start gap-3 px-4 py-2.5">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-snug line-clamp-1">
                  {task.description?.replace('[LINE MX]', '').replace('[TECH ASSIGNED]', '').split('\n')[0].trim()}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {task.ata_chapter}</span>}
                  {task.technician_name
                    ? <span className="text-[10px] text-amber-400 font-bold">👤 {task.technician_name}</span>
                    : <span className="text-[10px] text-red-400 font-bold">Unassigned</span>}
                </div>
              </div>
              {task.discrepancy_status === 'OPEN' && (
                <button
                  onClick={() => onAssign(task.id)}
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-1 flex-shrink-0">
                  <Play className="w-2.5 h-2.5" /> Assign
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TechAssignmentPanel({ aircraft, discrepancies, onAssign }) {
  const [locFilter, setLocFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [addTechTail, setAddTechTail] = useState(null);

  const tasksByTail = discrepancies.reduce((acc, e) => {
    const tail = e.aircraft_tail || 'UNKNOWN';
    if (!acc[tail]) acc[tail] = [];
    acc[tail].push(e);
    return acc;
  }, {});

  const allTails = new Set([
    ...aircraft.map(a => a.tail_number),
    ...Object.keys(tasksByTail),
  ]);

  const rows = [...allTails].map(tail => {
    const ac = aircraft.find(a => a.tail_number === tail);
    const tasks = tasksByTail[tail] || [];
    return { tail, type: ac?.aircraft_type, status: ac?.status || 'active', tasks };
  });

  const filtered = rows.filter(row => {
    const hasTasks = row.tasks.length > 0;
    const matchSearch = !search ||
      row.tail.toLowerCase().includes(search.toLowerCase()) ||
      row.tasks.some(t => t.description?.toLowerCase().includes(search.toLowerCase()) || t.technician_name?.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (locFilter === 'gate') return row.tasks.some(t => getLocationType(t) === 'gate') || (hasTasks && row.tasks.every(t => getLocationType(t) !== 'hangar'));
    if (locFilter === 'hangar') return row.tasks.some(t => getLocationType(t) === 'hangar');
    return hasTasks;
  });

  const totalUnassigned = discrepancies.filter(e => e.discrepancy_status === 'OPEN').length;
  const totalInProgress = discrepancies.filter(e => e.discrepancy_status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Technician Assignment by Aircraft</p>
        <div className="flex gap-3 text-[10px] font-bold">
          <span className="text-red-400">{totalUnassigned} unassigned</span>
          <span className="text-amber-400">{totalInProgress} in progress</span>
        </div>
      </div>

      {/* Location filter + search */}
      <div className="flex gap-2 items-center flex-wrap">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex gap-1.5">
          {LOCATION_TYPES.map(lt => (
            <button key={lt.id} onClick={() => setLocFilter(lt.id)}
              className={cn('text-xs font-bold px-3 py-1.5 rounded-lg transition-all',
                locFilter === lt.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {lt.id === 'gate' && <Building2 className="w-3 h-3 inline mr-1" />}
              {lt.id === 'hangar' && <Building2 className="w-3 h-3 inline mr-1" />}
              {lt.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tail or tech…"
          className="ml-auto bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary w-40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <CheckCircle className="w-10 h-10 text-green-500/20 mx-auto mb-2" />
          No open tasks to assign
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(row => (
            <AircraftCard
              key={row.tail}
              tail={row.tail}
              type={row.type}
              status={row.status}
              tasks={row.tasks}
              onAssign={onAssign}
              onAddTech={setAddTechTail}
            />
          ))}
        </div>
      )}

      {addTechTail && (
        <AddTechnicianModal tail={addTechTail} onClose={() => setAddTechTail(null)} />
      )}
    </div>
  );
}