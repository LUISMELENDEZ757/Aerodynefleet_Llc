import { cn } from '@/lib/utils';
import { CheckCircle, Clock, Lock } from 'lucide-react';
import { PHASES } from '@/lib/engineWorkflowState';

function PhaseNode({ phase, status, completionData, onClick }) {
  const isDone   = status === 'done';
  const isActive = status === 'active';
  const isLocked = status === 'locked';

  return (
    <button
      onClick={() => !isLocked && onClick(phase.id)}
      disabled={isLocked}
      className="flex flex-col items-center flex-1 min-w-0 relative group focus:outline-none"
    >
      {/* Circle */}
      <div className={cn(
        'w-14 h-14 rounded-full border-2 flex items-center justify-center z-10 transition-all flex-shrink-0',
        isDone   ? 'bg-green-500 border-green-400 shadow-[0_0_16px_2px_rgba(34,197,94,0.4)]' :
        isActive ? `${phase.bg} ${phase.ring} shadow-[0_0_16px_2px_rgba(59,130,246,0.4)]` :
                   'bg-[#1e2535] border-white/10',
        !isLocked && 'group-hover:scale-105'
      )}>
        {isDone   ? <CheckCircle className="w-6 h-6 text-white" /> :
         isLocked ? <Lock className="w-5 h-5 text-gray-700" /> :
         isActive ? <Clock className="w-6 h-6 text-white animate-pulse" /> :
                    <Clock className="w-5 h-5 text-gray-600" />}
      </div>

      {/* Labels */}
      <div className="mt-2 text-center px-1 space-y-0.5">
        <p className={cn('text-[11px] font-extrabold tracking-wide',
          isDone ? 'text-green-400' : isActive ? phase.color : 'text-gray-600')}>
          {phase.dept}
        </p>
        <p className={cn('text-[10px] leading-tight',
          isDone ? 'text-gray-300' : isActive ? 'text-white font-semibold' : 'text-gray-600')}>
          {phase.label}
        </p>
        {isDone && completionData?.time && (
          <p className="text-[10px] text-green-400">{completionData.time}</p>
        )}
        {isDone && completionData?.technician && (
          <p className="text-[10px] font-bold text-green-300">{completionData.technician}</p>
        )}
        {isActive && (
          <p className="text-[10px] font-bold text-blue-300 animate-pulse">IN PROGRESS</p>
        )}
      </div>
    </button>
  );
}

export default function WorkflowTimeline({ currentPhaseId, completedTasks, phaseCompletions, onSelectPhase }) {
  const currentIdx = PHASES.findIndex(p => p.id === currentPhaseId);

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-primary text-lg font-black">⚡</span>
        <h2 className="text-base font-extrabold text-primary tracking-wide">Workflow Timeline</h2>
        <span className="ml-auto text-[10px] text-gray-500 font-mono">
          Phase {Math.min(currentIdx + 1, PHASES.length)} / {PHASES.length}
        </span>
      </div>

      <div className="relative overflow-x-auto scrollbar-hide pb-2">
        {/* Background connector */}
        <div className="absolute top-7 left-7 right-7 h-0.5 bg-white/5 z-0" />
        {/* Green progress */}
        <div
          className="absolute top-7 left-7 h-0.5 bg-green-500 z-0 transition-all duration-700"
          style={{ width: currentIdx > 0 ? `${(currentIdx / (PHASES.length - 1)) * 100}%` : '0%' }}
        />

        <div className="flex items-start relative">
          {PHASES.map((phase, i) => {
            const allTasksDone = phase.tasks.every(t => completedTasks[t.id]);
            const anyDone = phase.tasks.some(t => completedTasks[t.id]);
            const status =
              allTasksDone ? 'done' :
              i === currentIdx ? 'active' :
              i < currentIdx ? 'active' : // phases before current that aren't all done
              'locked';
            // Recalculate properly
            const phaseStatus =
              i < currentIdx && allTasksDone ? 'done' :
              i < currentIdx ? 'active' :
              i === currentIdx ? 'active' :
              'locked';

            return (
              <PhaseNode
                key={phase.id}
                phase={phase}
                status={phaseStatus}
                completionData={phaseCompletions?.[phase.id]}
                onClick={onSelectPhase}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}