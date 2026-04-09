import { cn } from '@/lib/utils';
import { CheckCircle, FileText, Wrench, User, Calendar } from 'lucide-react';

const PHASE_TASKS = {
  mcc_init: {
    label: 'MCC Initiation',
    tasks: [
      {
        id: 'mcc_wp',
        title: 'MCC Initiation & Work Package Setup',
        assigned: 'MCC Controller',
        documents: ['AMM 71-00-00', 'IPC Engine Section', 'Engineering Order (if applicable)'],
        tooling: [],
        completed: true,
        completedBy: 'John Martinez',
        cert: 'MCC-JM-4729',
        dateTime: '3/7/2026, 8:00:00 AM',
      },
    ],
  },
  pre_removal: {
    label: 'Pre-Removal Inspection',
    tasks: [
      {
        id: 'pre_visual',
        title: 'Pre-Removal Visual Inspection',
        assigned: 'Line Maintenance Technician',
        documents: ['Pre-Removal Inspection Checklist'],
        tooling: ['Digital Camera', 'Flashlight'],
        completed: true,
        completedBy: 'Mike Rodriguez',
        cert: 'A&P 3847592',
        dateTime: '3/7/2026, 9:30:00 AM',
      },
    ],
  },
  parts_tooling: {
    label: 'Parts & Tooling Prep',
    tasks: [
      {
        id: 'parts_prep',
        title: 'Parts & Tooling Preparation',
        assigned: 'Parts / Stores',
        documents: ['Parts Requirement List', 'Tool Control Sheet'],
        tooling: ['Engine Sling', 'Workstand', 'Torque Wrench Set'],
        completed: true,
        completedBy: 'Lisa Anderson',
        cert: 'STORES-LA-001',
        dateTime: '3/7/2026, 11:15:00 AM',
      },
    ],
  },
  engine_removal: {
    label: 'Engine Removal',
    tasks: [
      {
        id: 'eng_disconnect',
        title: 'Engine Disconnection — Lines & Harnesses',
        assigned: 'Lead A&P Technician',
        documents: ['AMM 71-00-00 Task 400', 'Work Card ENG-REM-001'],
        tooling: ['Engine Sling (P/N 60-80-26)', 'Blanking Caps Set'],
        completed: false,
        completedBy: null,
        cert: null,
        dateTime: null,
      },
      {
        id: 'eng_lower',
        title: 'Engine Lower & Removal from Wing',
        assigned: 'Lead A&P + RII Inspector',
        documents: ['AMM 71-00-00 Task 420', 'RII Signoff Card'],
        tooling: ['Engine Stand', 'Overhead Crane', 'Sling Assembly'],
        completed: false,
        completedBy: null,
        cert: null,
        dateTime: null,
      },
    ],
  },
  engine_install: {
    label: 'Engine Installation',
    tasks: [
      {
        id: 'eng_position',
        title: 'Engine Positioning & Mating',
        assigned: 'Lead A&P Technician',
        documents: ['AMM 71-00-00 Task 500'],
        tooling: ['Engine Sling', 'Alignment Tool'],
        completed: false,
        completedBy: null,
        cert: null,
        dateTime: null,
      },
    ],
  },
  post_testing: {
    label: 'Post-Install Testing',
    tasks: [
      {
        id: 'engine_run',
        title: 'Engine Run-Up & Functional Test',
        assigned: 'Lead A&P + RII Inspector',
        documents: ['Engine Run Procedure', 'Ground Run Record Card'],
        tooling: ['Fire Extinguisher', 'Headset', 'Fuel Flow Meter'],
        completed: false,
        completedBy: null,
        cert: null,
        dateTime: null,
      },
    ],
  },
  final_release: {
    label: 'Final Release',
    tasks: [
      {
        id: 'mcc_release',
        title: 'MCC Final Release & Logbook Sign-Off',
        assigned: 'MCC Controller',
        documents: ['Return to Service Form', 'Completed Work Package'],
        tooling: [],
        completed: false,
        completedBy: null,
        cert: null,
        dateTime: null,
      },
    ],
  },
};

function TaskCard({ task }) {
  return (
    <div className={cn(
      'rounded-2xl border p-5 space-y-3 flex flex-col',
      task.completed
        ? 'bg-[#0d1117] border-green-500/40'
        : 'bg-[#0d1117] border-white/10'
    )}>
      {/* Title */}
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-extrabold text-white leading-snug">{task.title}</p>
        {task.completed && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
      </div>

      {/* Assigned */}
      <p className="text-[11px] text-gray-500">
        <span className="text-gray-600">Assigned: </span>{task.assigned}
      </p>

      {/* Documents */}
      {task.documents.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Required Documents</p>
          <ul className="space-y-1">
            {task.documents.map(doc => (
              <li key={doc} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tooling */}
      {task.tooling.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Required Tooling</p>
          <ul className="space-y-1">
            {task.tooling.map(tool => (
              <li key={tool} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <Wrench className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                {tool}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      {task.completed ? (
        <div className="flex items-end justify-between border-t border-white/5 pt-3 mt-auto gap-4">
          <div>
            <p className="text-[10px] text-gray-500">Completed By</p>
            <p className="text-sm font-extrabold text-white">{task.completedBy}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <User className="w-2.5 h-2.5 text-primary" />
              <p className="text-[10px] text-primary font-mono">{task.cert}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Date/Time</p>
            <p className="text-xs font-bold text-white">{task.dateTime}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-white/5 pt-3 mt-auto">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">In Progress / Pending</p>
        </div>
      )}
    </div>
  );
}

export default function TaskWorkflowCards({ currentPhaseId = 'engine_removal' }) {
  const phase = PHASE_TASKS[currentPhaseId];
  if (!phase) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h2 className="text-base font-extrabold text-primary tracking-wide">
          Task Workflow — Current Phase: {phase.label}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {phase.tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export { PHASE_TASKS };