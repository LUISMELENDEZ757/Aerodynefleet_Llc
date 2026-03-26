import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

function daysDiff(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

export default function ToolCalibration({ tools, onRefresh }) {
  const queryClient = useQueryClient();
  const calTools = tools.filter(t => t.requires_calibration || t.calibration_due);

  const calibrateMutation = useMutation({
    mutationFn: (tool) => {
      const nextCal = new Date();
      nextCal.setFullYear(nextCal.getFullYear() + 1);
      return base44.entities.Tool.update(tool.id, {
        status: 'available',
        last_calibrated: new Date().toISOString().split('T')[0],
        calibration_due: nextCal.toISOString().split('T')[0],
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tools'] }); onRefresh(); },
  });

  if (calTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <CheckCircle className="w-12 h-12 text-green-400" />
        <p className="text-lg font-bold text-gray-400">All tools in calibration compliance</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Calibration Schedule</p>
      {calTools.map(tool => {
        const days = daysDiff(tool.calibration_due);
        const isOverdue = days !== null && days < 0;
        const isDueSoon = days !== null && days >= 0 && days <= 30;
        const borderColor = isOverdue ? 'border-red-500/40' : isDueSoon ? 'border-orange-500/40' : 'border-white/10';
        const bgColor = isOverdue ? 'bg-red-900/10' : isDueSoon ? 'bg-orange-900/10' : 'bg-[#141922]';
        const tagColor = isOverdue ? 'bg-red-600 text-white' : isDueSoon ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-200';
        const tagLabel = isOverdue ? `OVERDUE ${Math.abs(days)}d` : isDueSoon ? `DUE IN ${days}d` : `${days}d`;

        return (
          <div key={tool.id} className={cn('rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4', bgColor, borderColor)}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-400">{tool.tool_number}</span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', tagColor)}>{tagLabel}</span>
              </div>
              <p className="text-base font-extrabold text-white">{tool.name}</p>
              {tool.manufacturer && <p className="text-xs text-gray-500">{tool.manufacturer}</p>}

              <div className="flex flex-wrap items-center gap-4 mt-2">
                {tool.calibration_due && (
                  <div className={cn('flex items-center gap-1.5 text-xs', isOverdue ? 'text-red-400' : isDueSoon ? 'text-orange-400' : 'text-gray-400')}>
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {tool.calibration_due}
                  </div>
                )}
                {tool.last_calibrated && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Last: {tool.last_calibrated}
                  </div>
                )}
                {tool.location && <span className="text-xs text-gray-500">{tool.location}</span>}
              </div>
            </div>

            <button
              onClick={() => calibrateMutation.mutate(tool)}
              disabled={calibrateMutation.isPending}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap',
                isOverdue || isDueSoon ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-[#1a1f2e] border border-white/10 text-gray-300 hover:bg-white/10'
              )}
            >
              {calibrateMutation.isPending ? 'Updating…' : 'Mark Calibrated'}
            </button>
          </div>
        );
      })}
    </div>
  );
}