import { cn } from '@/lib/utils';
import { Shield, CheckCircle, Clock, User, Lock } from 'lucide-react';
import { PHASES } from '@/lib/engineWorkflowState';

// Collect all RII tasks across all phases in order
const RII_TASKS = PHASES.flatMap(phase =>
  phase.tasks
    .filter(t => t.isRII)
    .map(t => ({ ...t, phaseId: phase.id, phaseLabel: phase.label, role: phase.role }))
);

function RiiCard({ task, completion, phaseIdx, currentPhaseIdx }) {
  const isDone       = !!completion;
  const isActive     = !isDone && phaseIdx <= currentPhaseIdx;
  const isPending    = !isDone && phaseIdx > currentPhaseIdx;

  return (
    <div className={cn(
      'flex-1 min-w-[170px] rounded-xl border p-4 space-y-2',
      isDone   ? 'border-green-500/50 bg-[#0d1117]' :
      isActive ? 'border-blue-500/50 bg-[#0d1117]'  :
                 'border-white/10 bg-[#0d1117] opacity-60'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white leading-tight">{task.title.replace(' Sign-Off', '').replace(' RII', ' RII')}</p>
        {isDone    ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> :
         isPending ? <Lock className="w-4 h-4 text-gray-700 flex-shrink-0" /> :
                     <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />}
      </div>

      <p className="text-[10px] text-gray-500">Phase: {task.phaseLabel}</p>

      {isDone ? (
        <>
          <p className="text-xs text-gray-400">Inspector: <span className="text-white font-bold">{completion.name}</span></p>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-primary" />
            <p className="text-[11px] text-primary font-bold font-mono">{completion.cert || 'N/A'}</p>
          </div>
          <p className="text-[10px] text-gray-600">{completion.dateTime}</p>
        </>
      ) : isActive ? (
        <p className="text-xs font-bold text-blue-400">In Progress</p>
      ) : (
        <p className="text-xs text-gray-600">Pending</p>
      )}
    </div>
  );
}

export default function QCRIIInspections({ completedTasks, currentPhaseId }) {
  const currentPhaseIdx = PHASES.findIndex(p => p.id === currentPhaseId);
  const totalRII = RII_TASKS.length;
  const completedRII = RII_TASKS.filter(t => completedTasks[t.id]).length;

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-extrabold text-yellow-400 tracking-wide">QC/RII Required Inspections</h3>
        <span className="ml-auto text-[10px] font-bold text-gray-400">
          <span className={completedRII === totalRII ? 'text-green-400' : 'text-amber-400'}>{completedRII}</span>
          /{totalRII} complete
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {RII_TASKS.map(task => {
          const phaseIdx = PHASES.findIndex(p => p.id === task.phaseId);
          return (
            <RiiCard
              key={task.id}
              task={task}
              completion={completedTasks[task.id]}
              phaseIdx={phaseIdx}
              currentPhaseIdx={currentPhaseIdx}
            />
          );
        })}
      </div>
    </div>
  );
}