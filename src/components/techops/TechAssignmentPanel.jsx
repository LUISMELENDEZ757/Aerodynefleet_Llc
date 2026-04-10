import { useState } from 'react';
import { Users, Plane, Building2, Play, CheckCircle, Wrench, MapPin } from 'lucide-react';
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

function AircraftCard({ tail, type, status, tasks, onAssign }) {
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
    <div className={cn(
      'bg-card border rounded-2xl overflow-hidden',
      openTasks.length > 0 ? 'border-amber-500/30' : 'border-border'
    )}>
      {/* Aircraft header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-extrabold text-foreground font-mono">{tail}</span>
          {type && <span className="text-[10px] text-muted-foreground">{type}</span>}
        </div>
        <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full', statusColor)}>
          {status?.toUpperCase()}
        </span>
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
                  {task.description?.replace('[LINE MX]', '').split('\n')[0].trim()}
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
                  className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-1 flex-shrink-0"
                >
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

  // Group discrepancies by aircraft tail
  const tasksByTail = discrepancies.reduce((acc, e) => {
    const tail = e.aircraft_tail || 'UNKNOWN';
    if (!acc[tail]) acc[tail] = [];
    acc[tail].push(e);
    return acc;
  }, {});

  // Build aircraft list — include aircraft with open tasks even if not in registry
  const allTails = new Set([
    ...aircraft.map(a => a.tail_number),
    ...Object.keys(tasksByTail),
  ]);

  const rows = [...allTails].map(tail => {
    const ac = aircraft.find(a => a.tail_number === tail);
    const tasks = tasksByTail[tail] || [];
    return { tail, type: ac?.aircraft_type, status: ac?.status || 'active', tasks };
  });

  // Filter
  const filtered = rows.filter(row => {
    const hasTasks = row.tasks.length > 0;
    const matchSearch = !search || row.tail.toLowerCase().includes(search.toLowerCase()) ||
      row.tasks.some(t => t.description?.toLowerCase().includes(search.toLowerCase()) || t.technician_name?.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (locFilter === 'gate') {
      return row.tasks.some(t => getLocationType(t) === 'gate') || (hasTasks && row.tasks.every(t => getLocationType(t) !== 'hangar'));
    }
    if (locFilter === 'hangar') {
      return row.tasks.some(t => getLocationType(t) === 'hangar');
    }
    return hasTasks; // 'all' — only show aircraft with tasks
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

      {/* Location type filter */}
      <div className="flex gap-2 items-center">
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

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-muted-foreground bg-secondary/30 rounded-xl px-3 py-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Gate / Line ops</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Hangar ops</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}