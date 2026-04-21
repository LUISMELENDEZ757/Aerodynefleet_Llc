import { useMemo } from 'react';
import { CheckCircle, AlertTriangle, Clock, Users, Zap, FileCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TYPE_COLORS = {
  MEL: { bg: 'bg-amber-900/20', border: 'border-amber-500/30', icon: Zap, label: 'MEL' },
  NEF: { bg: 'bg-orange-900/20', border: 'border-orange-500/30', icon: AlertTriangle, label: 'NEF' },
  CDL: { bg: 'bg-red-900/20', border: 'border-red-500/30', icon: AlertTriangle, label: 'CDL' },
  'EA/EO': { bg: 'bg-blue-900/20', border: 'border-blue-500/30', icon: FileCheck, label: 'EA/EO' },
  AD: { bg: 'bg-purple-900/20', border: 'border-purple-500/30', icon: Shield, label: 'AD' },
  Work: { bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', icon: Users, label: 'Work' },
};

function TaskCard({ task, type, onCardClick }) {
  const cfg = TYPE_COLORS[type] || TYPE_COLORS.Work;
  const Icon = cfg.icon;

  return (
    <div onClick={() => onCardClick?.(task)} className={cn('bg-card border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all', cfg.border)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4')} />
          <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded text-white', cfg.bg === 'bg-amber-900/20' ? 'bg-amber-700' : cfg.bg === 'bg-orange-900/20' ? 'bg-orange-700' : cfg.bg === 'bg-red-900/20' ? 'bg-red-700' : cfg.bg === 'bg-blue-900/20' ? 'bg-blue-700' : cfg.bg === 'bg-purple-900/20' ? 'bg-purple-700' : 'bg-cyan-700')}>
            {cfg.label}
          </span>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
          task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
          task.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
          'bg-gray-500/20 text-gray-400'
        )}>
          {task.status?.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary font-mono">{task.aircraft_tail}</span>
          {task.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {task.ata_chapter}</span>}
        </div>

        <p className="text-sm text-foreground leading-snug">{task.title || task.description || task.mel_reference || '—'}</p>

        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-2">
          {task.technician_name && (
            <span className="flex items-center gap-1 text-cyan-400">
              <Users className="w-3 h-3" /> {task.technician_name}
            </span>
          )}
          {task.work_completed_at && (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-3 h-3" /> {format(new Date(task.work_completed_at), 'MMM d, HH:mm')}
            </span>
          )}
          {task.work_started_at && !task.work_completed_at && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3 h-3" /> Started {format(new Date(task.work_started_at), 'MMM d, HH:mm')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksModule({ allDiscrepancies, mels, ads, aircraft, stationFilter }) {
  const stationAircraft = stationFilter ? aircraft.filter(a => a.base_station === stationFilter) : aircraft;
  const stationTails = new Set(stationAircraft.map(a => a.tail_number));

  // Categorize tasks
  const tasks = useMemo(() => {
    const result = { assigned: [], accomplished: [] };

    // Discrepancies (general work)
    allDiscrepancies.forEach(d => {
      if (stationFilter && !stationTails.has(d.aircraft_tail)) return;

      const task = {
        id: d.id,
        aircraft_tail: d.aircraft_tail,
        title: d.description,
        ata_chapter: d.ata_chapter,
        technician_name: d.technician_name,
        status: d.discrepancy_status?.toLowerCase().replace('_', ' ') || 'open',
        work_started_at: d.work_started_at,
        work_completed_at: d.work_completed_at,
        created_date: d.created_date,
      };

      if (d.discrepancy_status === 'CLOSED') {
        result.accomplished.push({ ...task, type: 'Work' });
      } else {
        result.assigned.push({ ...task, type: 'Work' });
      }
    });

    // MEL items
    mels.forEach(m => {
      if (stationFilter && !stationTails.has(m.aircraft_tail || m.tail_number)) return;

      const task = {
        id: m.id,
        aircraft_tail: m.aircraft_tail || m.tail_number || '—',
        title: `${m.mel_reference || '—'} · CAT ${m.mel_category || '—'}`,
        description: m.title || m.description,
        mel_reference: m.mel_reference,
        technician_name: m.assigned_to,
        status: m.status?.toLowerCase() || 'open',
        created_date: m.created_date,
      };

      if (m.status === 'cleared' || m.status === 'voided') {
        result.accomplished.push({ ...task, type: 'MEL' });
      } else {
        result.assigned.push({ ...task, type: 'MEL' });
      }
    });

    // ADs
    ads.forEach(ad => {
      if (stationFilter && !stationTails.has(ad.aircraft_tail)) return;

      const task = {
        id: ad.id,
        aircraft_tail: ad.aircraft_tail,
        title: `${ad.ad_number} — ${ad.title}`,
        ata_chapter: ad.ata_chapter,
        technician_name: ad.technician_name,
        status: ad.status?.toLowerCase() || 'open',
        created_date: ad.created_date,
      };

      if (ad.status === 'complied') {
        result.accomplished.push({ ...task, type: 'AD' });
      } else {
        result.assigned.push({ ...task, type: 'AD' });
      }
    });

    // Sort by date descending
    result.assigned.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    result.accomplished.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return result;
  }, [allDiscrepancies, mels, ads, stationFilter, stationTails]);

  return (
    <div className="space-y-6">
      {/* Assigned Tasks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-extrabold text-foreground">Tasks Assigned ({tasks.assigned.length})</p>
        </div>
        {tasks.assigned.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-8 text-center text-muted-foreground text-sm">
            No assigned tasks
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tasks.assigned.slice(0, 20).map(task => (
              <TaskCard key={`${task.type}-${task.id}`} task={task} type={task.type} />
            ))}
          </div>
        )}
      </div>

      {/* Accomplished Tasks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm font-extrabold text-foreground">Tasks Accomplished ({tasks.accomplished.length})</p>
        </div>
        {tasks.accomplished.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-8 text-center text-muted-foreground text-sm">
            No completed tasks
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tasks.accomplished.slice(0, 20).map(task => (
              <TaskCard key={`${task.type}-${task.id}`} task={task} type={task.type} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}