import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, FileText, Wrench, User, X, Shield, Lock, AlertTriangle } from 'lucide-react';
import { PHASES, isPhaseUnlocked } from '@/lib/engineWorkflowState';

// ── Sign-Off Modal ────────────────────────────────────────────────────────────
function SignOffModal({ task, onConfirm, onClose }) {
  const [name, setName] = useState('');
  const [cert, setCert] = useState('');
  const [findings, setFindings] = useState('');
  const [turnoverNote, setTurnoverNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(task.id, name.trim(), cert.trim(), findings.trim(), turnoverNote.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-[#141922] border border-green-500/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm font-extrabold text-white">Sign Off Task</p>
            {task.isRII && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400">RII</span>
            )}
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
          {task.isRII && (
            <div className="flex items-start gap-2 bg-purple-900/20 border border-purple-500/30 rounded-xl p-3">
              <Shield className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-purple-300">This task requires a <strong>Required Inspection Item (RII)</strong> sign-off. Inspector must hold a valid RII authorization.</p>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              {task.isRII ? 'RII Inspector Name *' : 'Technician Name *'}
            </label>
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
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              {task.isRII ? 'RII Certificate / License #' : 'Certificate / License #'}
            </label>
            <input
              value={cert}
              onChange={e => setCert(e.target.value)}
              placeholder={task.isRII ? 'e.g. A&P 1234567 (RII)' : 'e.g. A&P 1234567'}
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Inspection / Technician Findings
            </label>
            <textarea
              rows={3}
              value={findings}
              onChange={e => setFindings(e.target.value)}
              placeholder="Describe inspection results, measurements, observations, or discrepancies found…"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Turnover Note to Next Crew
            </label>
            <textarea
              rows={2}
              value={turnoverNote}
              onChange={e => setTurnoverNote(e.target.value)}
              placeholder="Any outstanding items, cautions, or instructions for the incoming crew…"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500 transition-colors resize-none"
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
function TaskCard({ task, completion, onSignOff, phaseUnlocked }) {
  const isCompleted = !!completion;
  const locked = !phaseUnlocked;

  return (
    <div className={cn(
      'rounded-2xl border p-5 space-y-3 flex flex-col transition-all',
      isCompleted ? 'bg-[#0d1117] border-green-500/40' :
      locked      ? 'bg-[#0a0d14] border-white/5 opacity-50' :
                    'bg-[#0d1117] border-white/10'
    )}>
      {/* Title */}
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-extrabold text-white leading-snug">{task.title}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {task.isRII && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-400">RII</span>
          )}
          {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
          {locked && <Lock className="w-4 h-4 text-gray-700" />}
        </div>
      </div>

      {/* Assigned role from phase */}
      <p className="text-[11px] text-gray-500">
        <span className="text-gray-600">Assigned: </span>{task.role || 'See phase assignment'}
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
      {isCompleted ? (
        <div className="border-t border-white/5 pt-3 mt-auto space-y-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-500">Completed By</p>
              <p className="text-sm font-extrabold text-white">{completion.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <User className="w-2.5 h-2.5 text-primary" />
                <p className="text-[10px] text-primary font-mono">{completion.cert || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Date/Time</p>
              <p className="text-xs font-bold text-white">{completion.dateTime}</p>
            </div>
          </div>
          {completion.findings && (
            <div className="bg-[#0a0d14] border border-white/10 rounded-lg px-3 py-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Findings</p>
              <p className="text-[11px] text-gray-300 leading-snug">{completion.findings}</p>
            </div>
          )}
          {completion.turnoverNote && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg px-3 py-2">
              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-0.5">Turnover Note</p>
              <p className="text-[11px] text-amber-200 leading-snug">{completion.turnoverNote}</p>
            </div>
          )}
        </div>
      ) : locked ? (
        <div className="flex items-center gap-2 border-t border-white/5 pt-3 mt-auto">
          <Lock className="w-3.5 h-3.5 text-gray-700" />
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">Locked — Complete prior phase</p>
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

// ── Phase Entry Conditions ────────────────────────────────────────────────────
function EntryConditions({ conditions, unlocked }) {
  return (
    <div className={cn(
      'rounded-xl border p-3 space-y-1.5',
      unlocked ? 'border-green-500/20 bg-green-900/10' : 'border-amber-500/20 bg-amber-900/10'
    )}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5"
        style={{ color: unlocked ? '#4ade80' : '#fbbf24' }}>
        <AlertTriangle className="w-3 h-3" /> Phase Entry Conditions
      </p>
      <ul className="space-y-1">
        {conditions.map((c, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-400">
            <CheckCircle className={cn('w-3 h-3 flex-shrink-0 mt-0.5', unlocked ? 'text-green-400' : 'text-gray-600')} />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TaskWorkflowCards({ selectedPhaseId, completedTasks, onTaskComplete }) {
  const [signingOffTask, setSigningOffTask] = useState(null);

  const phase = PHASES.find(p => p.id === selectedPhaseId);
  if (!phase) return null;

  const phaseUnlocked = isPhaseUnlocked(selectedPhaseId, completedTasks);

  const handleConfirmSignOff = (taskId, name, cert, findings, turnoverNote) => {
    const now = new Date().toLocaleString('en-US');
    onTaskComplete(taskId, { name, cert, dateTime: now, findings, turnoverNote });
    setSigningOffTask(null);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-base font-extrabold text-primary tracking-wide">
            Task Workflow — Current Phase: <span className={phase.color}>{phase.label}</span>
          </h2>
          <span className="text-[10px] text-gray-500 ml-auto">
            Assigned Role: <span className="text-white font-bold">{phase.role}</span>
          </span>
        </div>

        <EntryConditions conditions={phase.entryConditions} unlocked={phaseUnlocked} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phase.tasks.map(task => (
            <TaskCard
              key={task.id}
              task={{ ...task, role: phase.role }}
              completion={completedTasks[task.id]}
              onSignOff={setSigningOffTask}
              phaseUnlocked={phaseUnlocked}
            />
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