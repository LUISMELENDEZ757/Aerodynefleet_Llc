import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, X, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusBadge({ status }) {
  const config = {
    scheduled: { icon: Clock, color: 'text-blue-400 bg-blue-500/20', label: 'Scheduled' },
    in_progress: { icon: Wrench, color: 'text-yellow-400 bg-yellow-500/20', label: 'In Progress' },
    complete: { icon: CheckCircle, color: 'text-green-400 bg-green-500/20', label: 'Complete' },
    overdue: { icon: AlertCircle, color: 'text-red-400 bg-red-500/20', label: 'Overdue' },
  };
  const { icon: Icon, color, label } = config[status] || config.scheduled;
  return (
    <span className={cn('text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit', color)}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function AssignmentCard({ assignment, onStatusChange }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono font-bold text-primary text-sm">{assignment.aircraft_tail}</p>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {assignment.station || 'All'}
            </span>
          </div>
          <p className="text-sm text-foreground font-semibold">{assignment.work_scope}</p>
          <p className="text-xs text-muted-foreground mt-1">{assignment.technician || 'Unassigned'}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      <div className="bg-secondary/50 rounded-lg px-3 py-2 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Est. Hours:</span>
          <span className="font-bold text-foreground">{assignment.estimated_hours}h</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Priority:</span>
          <span className={cn('font-bold',
            assignment.priority === 'critical' ? 'text-red-400' :
            assignment.priority === 'high' ? 'text-orange-400' :
            'text-muted-foreground'
          )}>{assignment.priority?.toUpperCase() || 'ROUTINE'}</span>
        </div>
      </div>

      {assignment.status !== 'complete' && (
        <div className="flex gap-2">
          {assignment.status === 'scheduled' && (
            <button onClick={() => onStatusChange(assignment.id, 'in_progress')}
              className="flex-1 py-1.5 rounded-lg bg-yellow-600/30 text-yellow-400 text-xs font-bold hover:bg-yellow-600/40">
              Start Work
            </button>
          )}
          {assignment.status === 'in_progress' && (
            <button onClick={() => onStatusChange(assignment.id, 'complete')}
              className="flex-1 py-1.5 rounded-lg bg-green-600/30 text-green-400 text-xs font-bold hover:bg-green-600/40">
              Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DailyAssignmentsPanel({ assignments = [], onStatusChange }) {
  const [filter, setFilter] = useState('all');

  const statuses = ['all', 'scheduled', 'in_progress', 'complete', 'overdue'];
  const filtered = filter === 'all' ? assignments : assignments.filter(a => a.status === filter);

  const stats = {
    scheduled: assignments.filter(a => a.status === 'scheduled').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    complete: assignments.filter(a => a.status === 'complete').length,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-black text-foreground">Daily Work Assignments</h2>
        <p className="text-xs text-muted-foreground">{filtered.length} tasks • {stats.scheduled} scheduled • {stats.in_progress} in progress</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map(s => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}>
            {s === 'all' ? `All (${assignments.length})` : `${s.replace('_', ' ')} (${assignments.filter(a => a.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No assignments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(assignment => (
            <AssignmentCard key={assignment.id} assignment={assignment} onStatusChange={onStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}