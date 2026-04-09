import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, FileText, Wrench, User, X } from 'lucide-react';

const INITIAL_PHASE_TASKS = {
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
        id: 'qc_pre_removal',
        title: 'QC Pre-Removal RII',
        assigned: 'QC Inspector',
        documents: ['RII Sign-Off Card'],
        tooling: [],
        completed: true,
        completedBy: 'Sarah Mitchell',
        cert: 'A&P 2847593 (RII)',
        dateTime: '3/7/2026, 9:45:00 AM',
      },
      {
        id: 'eng_removal_amm',
        title: 'Engine Removal Per AMM',
        assigned: 'Line Maintenance Crew',
        documents: ['AMM 71-00-00 Engine Removal', 'Work Card Package'],
        tooling: ['Engine Sling', 'Bootstrap Kit', 'Torque Wrenches', 'Engine Stand'],
        completed: false,
        completedBy: null,
        cert: null,
        dateTime: null,
        signOff: true,
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
        signOff: true,
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
        signOff: true,
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
        signOff: true,
      },
    ],
  },
};

// ── Sign-Off Modal ────────────────────────────────────────────────────────────
function SignOffModal({ task, onConfirm, onClose }) {
  const [name, setName] = useState('');
  const [cert, setCert] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(task.id, name.trim(), cert.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-[#141922] border border-green-500/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm font-extrabold text-white">Sign Off Task</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-[#0d1117] rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Task</p>
            <p className="text-sm font-bold text-white mt-0.5">{task.title}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Technician Name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full Name"
              required
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Certificate / License #</label>
            <input
              value={cert}
              onChange={e => setCert(e.target.value)}
              placeholder="e.g. A&P 1234567"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-sm font-extrabold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
              <CheckCircle className="w-4 h-4" /> Confirm Sign-Off
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onSignOff }) {
  return (
    <div className={cn(
      'rounded-2xl border p-5 space-y-3 flex flex-col',
      task.completed ? 'bg-[#0d1117] border-green-500/40' : 'bg-[#0d1117] border-white/10'
    )}>
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-extrabold text-white leading-snug">{task.title}</p>
        {task.completed && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
      </div>

      <p className="text-[11px] text-gray-500">
        <span className="text-gray-600">Assigned: </span>{task.assigned}
      </p>

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
      ) : task.signOff ? (
        <button
          onClick={() => onSignOff(task)}
          className="w-full mt-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm py-3 rounded-xl transition-colors active:scale-95"
        >
          <CheckCircle className="w-4 h-4" /> Sign Off Task
        </button>
      ) : (
        <div className="flex items-center gap-2 border-t border-white/5 pt-3 mt-auto">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">In Progress / Pending</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TaskWorkflowCards({ currentPhaseId = 'engine_removal' }) {
  const phaseTemplate = INITIAL_PHASE_TASKS[currentPhaseId];
  const [tasks, setTasks] = useState(phaseTemplate?.tasks || []);
  const [signingOffTask, setSigningOffTask] = useState(null);

  if (!phaseTemplate) return null;

  const handleConfirmSignOff = (taskId, name, cert) => {
    const now = new Date().toLocaleString('en-US');
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, completed: true, completedBy: name, cert: cert || 'N/A', dateTime: now }
        : t
    ));
    setSigningOffTask(null);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-base font-extrabold text-primary tracking-wide">
            Task Workflow — Current Phase: {phaseTemplate.label}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onSignOff={setSigningOffTask} />
          ))}
        </div>
      </div>

      {signingOffTask && (
        <SignOffModal
          task={signingOffTask}
          onConfirm={handleConfirmSignOff}
          onClose={() => setSigningOffTask(null)}
        />
      )}
    </>
  );
}

export { INITIAL_PHASE_TASKS as PHASE_TASKS };