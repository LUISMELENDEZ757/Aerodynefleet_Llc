import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Download, Printer, RefreshCw, MapPin, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
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
          <div className="text-right">
            <p className="text-xs font-bold text-green-400">{data.completed.length} done</p>
            <p className="text-[10px] text-muted-foreground">
              {data.pending.length + data.completed.length} total
            </p>
          </div>
        </div>
      </button>
      
      {expanded && (
        <div className="p-5 space-y-6 border-t border-border">
          {data.pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                  Pending Tasks ({data.pending.length})
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
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
                <p className="text-xs font-extrabold text-green-400 uppercase tracking-widest">
                  Completed Tasks ({data.completed.length})
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
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

export default function ShiftReportModal({ stationFilter, onClose }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 p-4 overflow-y-auto" style={{ paddingTop: '2rem' }}>
      <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-extrabold text-foreground">Shift Summary Report</p>
              <p className="text-xs text-muted-foreground">
                {report?.reportDate || new Date().toISOString().split('T')[0]} · {report?.stationFilter || 'All Stations'}
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
            <button onClick={onClose} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-bold">Loading report...</p>
            </div>
          ) : report ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-secondary/30 border border-border rounded-xl px-4 py-4 text-center">
                  <p className="text-3xl font-black text-foreground">{report.summary.totalTasks}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Tasks</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-4 text-center">
                  <p className="text-3xl font-black text-amber-400">{report.summary.pendingCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Pending</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-4 text-center">
                  <p className="text-3xl font-black text-green-400">{report.summary.completedCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Completed</p>
                </div>
                <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-4 text-center">
                  <p className="text-3xl font-black text-primary">{report.summary.completionRate}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Completion Rate</p>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-secondary/30 border border-border rounded-xl px-5 py-4">
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">By Priority</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-red-400">{report.summary.byPriority.aog}</p>
                    <p className="text-[10px] text-muted-foreground">AOG</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-orange-400">{report.summary.byPriority.critical}</p>
                    <p className="text-[10px] text-muted-foreground">Critical</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-400">{report.summary.byPriority.routine}</p>
                    <p className="text-[10px] text-muted-foreground">Routine</p>
                  </div>
                </div>
              </div>

              {/* Tasks by Station */}
              <div>
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Tasks by Station</p>
                <div className="space-y-4">
                  {report.stations.map(station => (
                    <StationSection
                      key={station}
                      station={station}
                      data={report.tasksByStation[station] || { pending: [], completed: [] }}
                    />
                  ))}
                </div>
              </div>

              {/* Report Footer */}
              <div className="border-t border-border pt-4 mt-6">
                <p className="text-[10px] text-muted-foreground">
                  Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : '—'} · 
                  By: {report.generatedBy || 'System'}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-bold">No report data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}