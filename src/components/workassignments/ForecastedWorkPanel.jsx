import { TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

function WorkloadBar({ date, count, maxCount }) {
  const percentage = Math.min(100, (count / Math.max(maxCount, 1)) * 100);
  const isHigh = percentage > 80;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{format(new Date(date), 'MMM dd')}</span>
        <span className={cn('font-bold', isHigh ? 'text-orange-400' : 'text-foreground')}>{count} tasks</span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all',
          isHigh ? 'bg-orange-500' : 'bg-blue-500'
        )} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function ForecastedWorkPanel({ forecasts = [] }) {
  // Group by date (next 14 days)
  const workloadByDate = {};
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 14; i++) {
    const date = format(addDays(new Date(), i), 'yyyy-MM-dd');
    workloadByDate[date] = 0;
  }

  forecasts.forEach(f => {
    if (f.suggested_window_start) {
      const date = f.suggested_window_start;
      if (workloadByDate.hasOwnProperty(date)) {
        workloadByDate[date]++;
      }
    }
  });

  const dates = Object.entries(workloadByDate).sort((a, b) => a[0].localeCompare(b[0]));
  const maxCount = Math.max(...dates.map(d => d[1]), 1);
  const totalOverdue = forecasts.filter(f => f.status === 'overdue').length;
  const totalDueSoon = forecasts.filter(f => f.status === 'due_soon').length;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black text-foreground">Forecasted Workload (14 days)</h2>
        </div>
        <p className="text-xs text-muted-foreground">{forecasts.length} maintenance items • {totalOverdue} overdue</p>
      </div>

      {/* Alert Banner */}
      {totalOverdue > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 font-bold">{totalOverdue} items overdue — prioritize for next shift</p>
        </div>
      )}

      {/* Workload Chart */}
      <div className="space-y-3">
        {dates.slice(0, 14).map(([date, count]) => (
          <WorkloadBar key={date} date={date} count={count} maxCount={maxCount} />
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        <div className="bg-secondary/50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Due Soon (3d)</p>
          <p className="text-2xl font-black text-orange-400 mt-1">{totalDueSoon}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Avg Daily Load</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{Math.ceil(forecasts.length / 14)}</p>
        </div>
      </div>
    </div>
  );
}