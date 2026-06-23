import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Printer, RefreshCw, MapPin, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  pending_approval: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ordered: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  in_transit: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  received: 'bg-green-500/15 text-green-400 border-green-500/30',
  technician_assigned: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  installation_complete: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  pending_mcc: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  mcc_approved: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  pending_qc_inspection: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  qc_approved: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
};

const PRIORITY_COLORS = {
  aog: 'bg-red-700 text-white',
  critical: 'bg-orange-600 text-white',
  routine: 'bg-gray-600 text-white',
};

function TaskCard({ task }) {
  const statusColor = STATUS_COLORS[task.status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.routine;

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded', priorityColor)}>
            {task.priority?.toUpperCase()}
          </span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', statusColor)}>
            {task.status?.replace(/_/g, ' ').toUpperCase()}
          </span>
          {task.aircraft_tail && (
            <span className="text-[10px] font-mono font-bold text-primary">{task.aircraft_tail}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {task.part_number || 'N/A'}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{task.part_name}</p>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
        {task.station && (
          <span className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {task.station}
          </span>
        )}
        {task.requested_by && (
          <span>Assigned: {task.requested_by}</span>
        )}
        {task.quantity && <span>Qty: {task.quantity}</span>}
      </div>
      {task.notes && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">{task.notes}</p>
      )}
    </div>
  );
}

function StationSection({ station, data }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-sm font-extrabold text-foreground">{station}</p>
            <p className="text-[10px] text-muted-foreground">
              {data.pending.length} pending · {data.completed.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-[10px]">
            <span className="text-amber-400 font-bold">{data.pending.length} PENDING</span>
            <span className="text-green-400 font-bold">{data.completed.length} DONE</span>
          </div>
        </div>
      </button>
      
      {expanded && (
        <div className="p-5 space-y-4">
          {data.pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                  Pending Tasks ({data.pending.length})
                </p>
              </div>
              <div className="space-y-2">
                {data.pending.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
          
          {data.completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest">
                  Completed Tasks ({data.completed.length})
                </p>
              </div>
              <div className="space-y-2">
                {data.completed.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ShiftSummaryReport({ stationFilter, onClose }) {
  const [selectedStation, setSelectedStation] = useState('all');
  
  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['crew-chief-report', stationFilter],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateCrewChiefReport', {
        stationFilter: stationFilter || null,
      });
      return response.data;
    },
    refetchInterval: 30000,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-foreground font-bold">Generating Shift Summary Report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const stations = selectedStation === 'all' 
    ? report.stations 
    : [selectedStation];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 p-4 overflow-y-auto" style={{ paddingTop: '2rem' }}>
      <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl mb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">Shift Summary Report</p>
              <p className="text-xs text-muted-foreground">
                {report.reportDate} · {report.stationFilter}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={handlePrint} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <Printer className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center hover:bg-red-900/60">
              <FileText className="w-4 h-4 text-red-400 rotate-45" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-5 border-b border-border bg-secondary/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">{report.summary.totalTasks}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-amber-400">{report.summary.pendingCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-green-400">{report.summary.completedCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-primary">{report.summary.completionRate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Completion</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-red-400">{report.summary.byPriority.aog}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">AOG</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-orange-400">{report.summary.byPriority.critical}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Critical</p>
            </div>
          </div>
        </div>

        {/* Station Filter */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Filter by Station:
            </label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Stations</option>
              {report.stations.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Station Sections */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {stations.map(station => (
            report.tasksByStation[station] && (
              <StationSection
                key={station}
                station={station}
                data={report.tasksByStation[station]}
              />
            )
          ))}
          
          {report.summary.totalTasks === 0 && (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-bold">No tasks found for current shift</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-secondary/30 text-[10px] text-muted-foreground flex items-center justify-between">
          <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
          <span>By: {report.generatedBy}</span>
        </div>
      </div>
    </div>
  );
}