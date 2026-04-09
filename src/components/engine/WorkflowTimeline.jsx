import { cn } from '@/lib/utils';
import { CheckCircle, Clock } from 'lucide-react';

const PHASES = [
  { id: 'mcc_init',       dept: 'MCC',     label: 'MCC Initiation',         color: 'text-primary',    ring: 'border-primary',    bg: 'bg-primary' },
  { id: 'pre_removal',    dept: 'Line MX', label: 'Pre-Removal Inspection', color: 'text-green-400',  ring: 'border-green-400',  bg: 'bg-green-500' },
  { id: 'parts_tooling',  dept: 'Parts',   label: 'Parts & Tooling Prep',   color: 'text-yellow-400', ring: 'border-yellow-400', bg: 'bg-yellow-500' },
  { id: 'engine_removal', dept: 'Line MX', label: 'Engine Removal',         color: 'text-blue-400',   ring: 'border-blue-500',   bg: 'bg-blue-600' },
  { id: 'engine_install', dept: 'Line MX', label: 'Engine Installation',    color: 'text-blue-400',   ring: 'border-blue-500',   bg: 'bg-blue-600' },
  { id: 'post_testing',   dept: 'Line MX', label: 'Post-Install Testing',   color: 'text-blue-400',   ring: 'border-blue-500',   bg: 'bg-blue-600' },
  { id: 'final_release',  dept: 'MCC',     label: 'Final Release',          color: 'text-primary',    ring: 'border-gray-500',   bg: 'bg-gray-600' },
];

function PhaseNode({ phase, index, status, technician, time, isLast }) {
  // status: 'done' | 'active' | 'pending'
  const isDone   = status === 'done';
  const isActive = status === 'active';

  return (
    <div className="flex flex-col items-center flex-1 min-w-0 relative">
      {/* Connector line left */}
      {index > 0 && (
        <div className={cn(
          'absolute top-8 right-1/2 w-full h-0.5 -translate-y-1/2',
          isDone ? 'bg-green-500' : 'bg-white/10'
        )} style={{ left: '-50%', right: '50%', top: 32 }} />
      )}

      {/* Circle */}
      <div className={cn(
        'w-16 h-16 rounded-full border-2 flex items-center justify-center z-10 transition-all flex-shrink-0',
        isDone   ? 'bg-green-500 border-green-400 shadow-[0_0_18px_2px_rgba(34,197,94,0.45)]' :
        isActive ? `${phase.bg} ${phase.ring} shadow-[0_0_18px_2px_rgba(59,130,246,0.5)]` :
                   'bg-[#1e2535] border-white/15'
      )}>
        {isDone   ? <CheckCircle className="w-7 h-7 text-white" /> :
         isActive ? <Clock className="w-7 h-7 text-white animate-pulse" /> :
                    <Clock className="w-6 h-6 text-gray-600" />}
      </div>

      {/* Labels */}
      <div className="mt-2 text-center px-1 space-y-0.5">
        <p className={cn('text-[11px] font-extrabold tracking-wide', isDone ? 'text-green-400' : isActive ? phase.color : 'text-gray-500')}>
          {phase.dept}
        </p>
        <p className={cn('text-[10px] leading-tight', isDone ? 'text-gray-300' : isActive ? 'text-white font-semibold' : 'text-gray-600')}>
          {phase.label}
        </p>
        {time && <p className={cn('text-[10px]', isDone ? 'text-green-400' : isActive ? 'text-blue-300' : 'text-gray-700')}>{time}</p>}
        {technician && (
          <p className={cn('text-[10px] font-bold', isDone ? 'text-green-300' : isActive ? phase.color : 'text-gray-600')}>
            {technician}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WorkflowTimeline({ currentPhaseId = 'engine_removal', phaseData = {} }) {
  const currentIdx = PHASES.findIndex(p => p.id === currentPhaseId);

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-primary text-lg font-black">⚡</span>
        <h2 className="text-base font-extrabold text-primary tracking-wide">Workflow Timeline</h2>
      </div>

      <div className="flex items-start relative overflow-x-auto scrollbar-hide pb-2">
        {/* Full background connector */}
        <div className="absolute top-8 left-8 right-8 h-0.5 bg-white/5 z-0" />

        {PHASES.map((phase, i) => {
          const status = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending';
          const meta = phaseData[phase.id] || {};
          return (
            <PhaseNode
              key={phase.id}
              phase={phase}
              index={i}
              status={status}
              technician={meta.technician || (status === 'done' ? defaultTech[phase.id] : null)}
              time={meta.time || (status === 'done' ? defaultTime[i] : null)}
              isLast={i === PHASES.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

// Fallback demo values shown when no real data is passed
const defaultTech = {
  mcc_init:      'John Martinez',
  pre_removal:   'Mike Rodriguez',
  parts_tooling: 'Lisa Anderson',
};
const defaultTime = [
  '08:00 AM', '09:30 AM', '11:15 AM', null, null, null, null
];