import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, CheckCircle, Lock, Trophy, ArrowRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuizModule from './QuizModule';
import { MODULES } from './learningData';

export default function LearningCenter() {
  const [activeModule, setActiveModule] = useState(null);
  const [completedModules, setCompletedModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lc_completed') || '{}'); } catch { return {}; }
  });

  const handleComplete = (moduleId, score, total) => {
    const updated = { ...completedModules, [moduleId]: { score, total, pct: Math.round((score / total) * 100) } };
    setCompletedModules(updated);
    localStorage.setItem('lc_completed', JSON.stringify(updated));
    setActiveModule(null);
  };

  if (activeModule) {
    const mod = MODULES.find(m => m.id === activeModule);
    return <QuizModule module={mod} onComplete={handleComplete} onBack={() => setActiveModule(null)} />;
  }

  const totalModules = MODULES.length;
  const doneCount = Object.keys(completedModules).length;
  const avgScore = doneCount > 0
    ? Math.round(Object.values(completedModules).reduce((a, b) => a + b.pct, 0) / doneCount)
    : 0;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-base font-extrabold tracking-wide leading-none">Learning Center</p>
          <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">Aerodyne Fleet OS · Training Modules</p>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6 max-w-2xl mx-auto">
        {/* Progress banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/25 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-black text-white">Your Progress</p>
              <p className="text-xs text-gray-400">{doneCount} of {totalModules} modules completed</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-lg font-black text-primary">{avgScore > 0 ? `${avgScore}%` : '—'}</span>
            </div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / totalModules) * 100}%` }} />
          </div>
        </div>

        {/* How It Works featured card */}
        <Link to="/HowItWorks"
          className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/8 p-4 hover:bg-primary/15 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-white">How It Works</p>
            <p className="text-xs text-gray-400 mt-0.5">The complete operational flow — 7 sections covering the system from event to resolution.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
        </Link>

        {/* Module cards */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Training Modules</p>
          {MODULES.map((mod, idx) => {
            const done = completedModules[mod.id];
            const locked = idx > 0 && !completedModules[MODULES[idx - 1].id];
            return (
              <button
                key={mod.id}
                disabled={locked}
                onClick={() => setActiveModule(mod.id)}
                className={cn(
                  'w-full text-left rounded-2xl border p-4 transition-all duration-200',
                  locked
                    ? 'border-white/8 bg-[#141922] opacity-50 cursor-not-allowed'
                    : done
                    ? 'border-green-500/30 bg-green-900/10 hover:bg-green-900/20'
                    : 'border-white/10 bg-[#141922] hover:bg-white/5 hover:border-white/20'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl',
                    locked ? 'bg-white/5' : done ? 'bg-green-500/15' : `bg-opacity-15`)}
                    style={{ background: locked ? undefined : done ? undefined : `${mod.color}20` }}>
                    {locked ? <Lock className="w-5 h-5 text-gray-600" /> : <span>{mod.icon}</span>}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-white">{mod.title}</p>
                      {done && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                          {done.score}/{done.total} · {done.pct}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{mod.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-500">{mod.questions.length} questions</span>
                      <span className="text-[10px] text-gray-500">·</span>
                      <span className="text-[10px]" style={{ color: mod.color }}>{mod.level}</span>
                    </div>
                  </div>

                  {/* Arrow / Check */}
                  <div className="flex-shrink-0">
                    {done ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : locked ? null : (
                      <ArrowRight className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Score bar if done */}
                {done && (
                  <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${done.pct}%`, background: done.pct >= 80 ? '#22c55e' : done.pct >= 60 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {doneCount === totalModules && (
          <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-green-500/15 border border-primary/30 px-5 py-5 text-center space-y-2">
            <Trophy className="w-10 h-10 text-primary mx-auto" />
            <p className="text-base font-black text-white">Training Complete!</p>
            <p className="text-sm text-gray-400">You've completed all Aerodyne Fleet OS modules. Average score: {avgScore}%</p>
          </div>
        )}
      </div>
    </div>
  );
}