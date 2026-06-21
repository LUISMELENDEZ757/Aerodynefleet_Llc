import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, Users, BookOpen, Trophy, CheckCircle, Clock, GraduationCap,
  BarChart2, Award, AlertTriangle, Search, Star, ThumbsUp, ThumbsDown,
  MessageSquare, FileText, ChevronRight, X, CheckSquare, XCircle, RefreshCw,
  Shield, Wrench, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACADEMY_COURSES, MOCK_DISCREPANCIES } from './academyData';

const COURSE_MAP = Object.fromEntries(ACADEMY_COURSES.map(c => [c.id, c]));

const GRADE_OPTIONS = [
  { value: 'pass',            label: '✅ Pass',             color: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-600/40' },
  { value: 'pass_with_notes', label: '📝 Pass w/ Notes',    color: 'text-amber-400',  bg: 'bg-amber-900/30',  border: 'border-amber-600/40' },
  { value: 'needs_revision',  label: '🔄 Needs Revision',   color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-600/40' },
  { value: 'fail',            label: '❌ Fail',              color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-600/40' },
];

const SCENARIO_MAP = Object.fromEntries(MOCK_DISCREPANCIES.map(d => [d.id, d]));

// ── Helpers ──────────────────────────────────────────────────────────────────
function gradeColor(grade) {
  return { pass: 'text-green-400', pass_with_notes: 'text-amber-400', needs_revision: 'text-orange-400', fail: 'text-red-400' }[grade] || 'text-gray-400';
}
function gradeLabel(grade) {
  return { pass: 'Pass', pass_with_notes: 'Pass w/ Notes', needs_revision: 'Needs Revision', fail: 'Fail' }[grade] || '—';
}
function scoreColor(s) {
  if (!s && s !== 0) return 'text-gray-500';
  return s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';
}

// ── Grade Modal ───────────────────────────────────────────────────────────────
function GradeModal({ submission, onClose }) {
  const qc = useQueryClient();
  const scenario = SCENARIO_MAP[submission.scenario_id];

  const [grade, setGrade] = useState(submission.instructor_grade || '');
  const [score, setScore] = useState(submission.instructor_score ?? '');
  const [feedback, setFeedback] = useState(submission.instructor_feedback || '');
  const [melOk, setMelOk] = useState(submission.mel_workflow_correct ?? null);
  const [ataOk, setAtaOk] = useState(submission.ata_correct ?? null);
  const [caOk, setCaOk] = useState(submission.corrective_action_complete ?? null);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.LabSubmission.update(submission.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-submissions'] }); onClose(); },
  });

  const handleSave = () => {
    saveMutation.mutate({
      instructor_grade: grade,
      instructor_score: score !== '' ? Number(score) : null,
      instructor_feedback: feedback,
      mel_workflow_correct: melOk,
      ata_correct: ataOk,
      corrective_action_complete: caOk,
      status: 'graded',
      graded_at: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-sm font-extrabold text-white">{submission.scenario_title}</p>
            <p className="text-[10px] text-gray-500">{submission.student_name || submission.student_email} · {submission.scenario_category} · {submission.scenario_difficulty}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Student's Answer */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Student Response</p>
            <div className="bg-[#141922] border border-white/10 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-500 mb-1">Discrepancy Description</p>
                <p className="text-sm text-gray-200 leading-relaxed">{submission.description || <span className="text-gray-600 italic">Not provided</span>}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 mb-1">Corrective Action</p>
                <p className="text-sm text-gray-200 leading-relaxed">{submission.corrective_action || <span className="text-gray-600 italic">Not provided</span>}</p>
              </div>
              {submission.mel_ref && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-amber-400">MEL/CDL Ref:</span>
                  <span className="text-xs text-white font-mono">{submission.mel_ref}</span>
                  {submission.mel_category && <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-900/40">Cat {submission.mel_category}</span>}
                </div>
              )}
              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                <span>ATA: {submission.ata_chapter || '—'}</span>
                <span>Station: {submission.station || '—'}</span>
                <span>Hints used: {submission.hints_used ?? 0}</span>
                {submission.answer_revealed && <span className="text-amber-400">⚠ Answer revealed</span>}
              </div>
            </div>
          </div>

          {/* Reference Answer */}
          {scenario && (
            <details className="bg-green-900/10 border border-green-700/30 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer text-xs font-bold text-green-400 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" /> View Reference Answer (AMM Guidance)
              </summary>
              <div className="px-4 pb-4 text-xs text-gray-300 leading-relaxed whitespace-pre-line border-t border-green-700/20 pt-3">
                {scenario.correctAction}
              </div>
            </details>
          )}

          {/* Checklist */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Grading Checklist</p>
            <div className="space-y-2">
              {[
                { label: 'Correct MEL / NEF / CDL workflow applied', state: melOk, set: setMelOk, highlight: true },
                { label: 'ATA chapter correct', state: ataOk, set: setAtaOk },
                { label: 'Corrective action complete and technically sound', state: caOk, set: setCaOk },
              ].map(({ label, state, set, highlight }) => (
                <div key={label} className={cn('flex items-center justify-between rounded-xl px-4 py-3 border', highlight ? 'border-amber-700/30 bg-amber-900/10' : 'border-white/10 bg-[#141922]')}>
                  <p className={cn('text-xs font-semibold', highlight ? 'text-amber-200' : 'text-gray-300')}>{label}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => set(true)} className={cn('p-1.5 rounded-lg transition-colors', state === true ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-400 hover:text-green-400')}>
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => set(false)} className={cn('p-1.5 rounded-lg transition-colors', state === false ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400 hover:text-red-400')}>
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade + Score */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Grade</p>
              <div className="space-y-1.5">
                {GRADE_OPTIONS.map(g => (
                  <button key={g.value} onClick={() => setGrade(g.value)}
                    className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs font-bold transition-all',
                      grade === g.value ? `${g.bg} ${g.border} ${g.color}` : 'bg-[#141922] border-white/10 text-gray-400 hover:border-white/20')}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Score (0–100)</p>
              <input
                type="number" min="0" max="100"
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="e.g. 85"
                className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-2xl font-black text-primary outline-none focus:border-primary text-center"
              />
              <p className="text-[10px] text-gray-600 mt-2 text-center">
                {score !== '' ? (Number(score) >= 80 ? '🟢 Proficient' : Number(score) >= 60 ? '🟡 Developing' : '🔴 Not Yet Proficient') : '—'}
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Instructor Feedback</p>
            <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Provide specific feedback on the student's MEL/CDL reasoning, documentation quality, and areas to improve…"
              className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5">Cancel</button>
            <button onClick={handleSave} disabled={!grade || saveMutation.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving…' : 'Save Grade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Student Detail Panel ──────────────────────────────────────────────────────
function StudentDetail({ user, submissions, onClose, onGrade }) {
  const progress = (() => { try { return JSON.parse(user.academy_progress || '{}'); } catch { return {}; } })();
  const completed = Object.keys(progress).length;
  const avgScore = completed > 0
    ? Math.round(Object.values(progress).reduce((a, b) => a + (b.pct || 0), 0) / completed) : 0;

  const studentSubs = submissions.filter(s => s.student_id === user.id || s.student_email === user.email);

  // MEL / CDL mastery: graded subs with those categories
  const melSubs = studentSubs.filter(s => s.scenario_category === 'MEL');
  const cdlSubs = studentSubs.filter(s => s.scenario_category === 'CDL');
  const nefSubs = studentSubs.filter(s => s.scenario_category === 'NEF');
  const melPassed = melSubs.filter(s => s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes').length;
  const cdlPassed = cdlSubs.filter(s => s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes').length;

  const avgLabScore = studentSubs.filter(s => s.instructor_score != null).length > 0
    ? Math.round(studentSubs.filter(s => s.instructor_score != null).reduce((a, b) => a + b.instructor_score, 0) / studentSubs.filter(s => s.instructor_score != null).length)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] overflow-y-auto">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0d1117] z-10">
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-black text-primary">{(user.full_name || user.email || '?')[0].toUpperCase()}</span>
        </div>
        <div>
          <p className="text-base font-extrabold text-white">{user.full_name || 'Student'}</p>
          <p className="text-[10px] text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Modules Done', value: `${completed}/${ACADEMY_COURSES.length}`, color: 'text-white' },
            { label: 'Course Avg', value: completed > 0 ? `${avgScore}%` : '—', color: scoreColor(avgScore) },
            { label: 'Lab Avg', value: avgLabScore != null ? `${avgLabScore}%` : '—', color: scoreColor(avgLabScore) },
            { label: 'Submissions', value: studentSubs.length, color: 'text-violet-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#141922] border border-white/10 rounded-xl p-4 text-center">
              <p className={cn('text-3xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* MEL / CDL / NEF Mastery */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Workflow Mastery
          </p>
          <div className="space-y-3">
            {[
              { label: 'MEL Workflow', subs: melSubs, passed: melPassed, color: '#f59e0b' },
              { label: 'CDL Workflow', subs: cdlSubs, passed: cdlPassed, color: '#a78bfa' },
              { label: 'NEF Workflow', subs: nefSubs, passed: nefSubs.filter(s => s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes').length, color: '#60a5fa' },
            ].map(({ label, subs, passed, color }) => {
              const total = subs.length;
              const gradedCount = subs.filter(s => s.status === 'graded').length;
              const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
              const melWorkflowOk = subs.filter(s => s.mel_workflow_correct === true).length;
              return (
                <div key={label} className="flex items-center gap-4">
                  <p className="text-xs font-bold text-gray-300 w-32 flex-shrink-0">{label}</p>
                  <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: total > 0 ? `${pct}%` : '0%', background: color }} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black" style={{ color }}>{total > 0 ? `${passed}/${total}` : '—'}</p>
                    <p className="text-[9px] text-gray-600">{gradedCount > 0 ? `${melWorkflowOk}/${gradedCount} workflow ✓` : 'ungraded'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Progress */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-4">Course Progress</p>
          <div className="space-y-2">
            {ACADEMY_COURSES.map(c => {
              const done = progress[c.id];
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-base w-5 flex-shrink-0">{c.icon}</span>
                  <p className="text-xs text-gray-300 flex-1 truncate">{c.title}</p>
                  {done ? (
                    <>
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${done.pct}%`, background: done.pct >= 70 ? '#22c55e' : '#ef4444' }} />
                      </div>
                      <span className={cn('text-[10px] font-bold w-10 text-right', scoreColor(done.pct))}>{done.pct}%</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-600 w-10 text-right">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lab Submissions */}
        <div>
          <p className="text-sm font-extrabold text-white mb-3">Lab Submissions ({studentSubs.length})</p>
          {studentSubs.length === 0 ? (
            <div className="text-center py-8 text-gray-600 bg-[#141922] rounded-2xl border border-white/10">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">No lab submissions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {studentSubs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(sub => (
                <div key={sub.id} className="bg-[#141922] border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-4 hover:border-white/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-xs font-bold text-white truncate">{sub.scenario_title}</p>
                      {sub.scenario_category && (
                        <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded',
                          sub.scenario_category === 'MEL' ? 'bg-amber-900/50 text-amber-300' :
                          sub.scenario_category === 'CDL' ? 'bg-violet-900/50 text-violet-300' :
                          sub.scenario_category === 'NEF' ? 'bg-blue-900/50 text-blue-300' :
                          'bg-white/10 text-gray-300'
                        )}>{sub.scenario_category}</span>
                      )}
                      <span className="text-[9px] text-gray-600">{sub.scenario_difficulty}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{new Date(sub.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {sub.status === 'graded' ? (
                      <>
                        <span className={cn('text-xs font-extrabold', scoreColor(sub.instructor_score))}>
                          {sub.instructor_score != null ? `${sub.instructor_score}%` : '—'}
                        </span>
                        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg border', 
                          GRADE_OPTIONS.find(g => g.value === sub.instructor_grade)?.bg || 'bg-white/5',
                          GRADE_OPTIONS.find(g => g.value === sub.instructor_grade)?.color || 'text-gray-400',
                          GRADE_OPTIONS.find(g => g.value === sub.instructor_grade)?.border || 'border-white/10'
                        )}>
                          {gradeLabel(sub.instructor_grade)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-bold text-violet-400 px-2 py-1 rounded bg-violet-900/20 border border-violet-700/30">Pending</span>
                    )}
                    <button onClick={() => onGrade(sub)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors">
                      {sub.status === 'graded' ? 'Edit' : 'Grade'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overview',     icon: BarChart2 },
  { id: 'students',   label: 'Students',      icon: Users },
  { id: 'grading',    label: 'Grade Queue',   icon: FileText },
  { id: 'mastery',    label: 'MEL/CDL Mastery', icon: Shield },
];

export default function InstructorDashboard({ onBack }) {
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [gradeTarget, setGradeTarget] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['academy-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: submissions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['lab-submissions'],
    queryFn: () => base44.entities.LabSubmission.list('-created_date', 500),
  });

  const students = users.filter(u =>
    u.role !== 'admin' &&
    (!search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const pending = submissions.filter(s => s.status === 'submitted');
  const graded  = submissions.filter(s => s.status === 'graded');

  // Global stats
  const avgLabScore = graded.filter(s => s.instructor_score != null).length > 0
    ? Math.round(graded.filter(s => s.instructor_score != null).reduce((a, b) => a + b.instructor_score, 0) / graded.filter(s => s.instructor_score != null).length)
    : 0;

  // MEL mastery rate across all students
  const melGraded = graded.filter(s => s.scenario_category === 'MEL');
  const melPassed = melGraded.filter(s => s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes').length;
  const melWorkflowOk = melGraded.filter(s => s.mel_workflow_correct === true).length;

  const cdlGraded = graded.filter(s => s.scenario_category === 'CDL');
  const cdlPassed = cdlGraded.filter(s => s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes').length;
  const cdlWorkflowOk = cdlGraded.filter(s => s.mel_workflow_correct === true).length;

  // Per-scenario stats
  const scenarioStats = MOCK_DISCREPANCIES.map(d => {
    const subs = graded.filter(s => s.scenario_id === d.id);
    const avgScore = subs.filter(s => s.instructor_score != null).length > 0
      ? Math.round(subs.reduce((a, b) => a + (b.instructor_score || 0), 0) / subs.filter(s => s.instructor_score != null).length) : null;
    const passRate = subs.length > 0 ? Math.round(subs.filter(s => s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes').length / subs.length * 100) : null;
    return { ...d, submissionCount: submissions.filter(s => s.scenario_id === d.id).length, gradedCount: subs.length, avgScore, passRate };
  });

  const filteredScenarios = categoryFilter
    ? scenarioStats.filter(d => (categoryFilter === 'MEL' ? d.category === 'MEL' || (d.mel_applicable && !d.category) : categoryFilter === 'CDL' ? d.category === 'CDL' || d.cdl_applicable : d.category === categoryFilter))
    : scenarioStats;

  if (studentDetail) {
    return (
      <StudentDetail
        user={studentDetail}
        submissions={submissions}
        onClose={() => setStudentDetail(null)}
        onGrade={setGradeTarget}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <p className="text-base font-extrabold">Instructor Dashboard</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Part 147 Academy · Student Management & Grading</p>
        </div>
        {pending.length > 0 && (
          <span className="ml-auto px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black animate-pulse">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-0 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all',
              tab === id ? 'bg-primary text-primary-foreground' : 'bg-[#141922] text-gray-400 border border-white/10 hover:text-white')}>
            <Icon className="w-3.5 h-3.5" /> {label}
            {id === 'grading' && pending.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-5 mt-5 space-y-5">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Students', value: students.length, color: 'text-white', icon: Users },
                { label: 'Submissions', value: submissions.length, color: 'text-violet-400', icon: FileText },
                { label: 'Avg Lab Score', value: avgLabScore > 0 ? `${avgLabScore}%` : '—', color: scoreColor(avgLabScore), icon: BarChart2 },
                { label: 'Pending Grades', value: pending.length, color: pending.length > 0 ? 'text-amber-400' : 'text-gray-600', icon: Clock },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                    <Icon className={cn('w-4 h-4', color)} />
                  </div>
                  <p className={cn('text-4xl font-black', color)}>{value}</p>
                </div>
              ))}
            </div>

            {/* MEL/CDL Mastery Overview */}
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" /> MEL / CDL Fleet-Wide Mastery
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'MEL Workflow', passed: melPassed, total: melGraded.length, workflowOk: melWorkflowOk, color: '#f59e0b' },
                  { label: 'CDL Workflow', passed: cdlPassed, total: cdlGraded.length, workflowOk: cdlWorkflowOk, color: '#a78bfa' },
                ].map(({ label, passed, total, workflowOk, color }) => {
                  const pct = total > 0 ? Math.round(passed / total * 100) : 0;
                  return (
                    <div key={label} className="bg-[#0d1117] rounded-xl p-4 border border-white/8">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-300">{label}</p>
                        <p className="text-lg font-black" style={{ color }}>{total > 0 ? `${pct}%` : '—'}</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <p className="text-[10px] text-gray-500">{passed}/{total} passed · {workflowOk}/{total} workflow correct</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Course completion heatmap */}
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-extrabold text-white mb-4">Course Completion by Module</p>
              <div className="space-y-2">
                {ACADEMY_COURSES.map(course => {
                  const allProgress = students.map(u => { try { return JSON.parse(u.academy_progress || '{}'); } catch { return {}; } });
                  const completedCount = allProgress.filter(p => p[course.id]).length;
                  const pct = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;
                  return (
                    <div key={course.id} className="flex items-center gap-3">
                      <span className="text-base w-5 flex-shrink-0">{course.icon}</span>
                      <p className="text-xs text-gray-300 w-44 truncate flex-shrink-0">{course.title}</p>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: course.color }} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 w-14 text-right">{completedCount}/{students.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── STUDENTS TAB ── */}
        {tab === 'students' && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-[#141922] border border-white/10 rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input type="text" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
              </div>
            </div>
            {loadingUsers ? (
              <p className="text-center text-gray-600 py-10">Loading…</p>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                <p className="text-sm">No students found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map(u => {
                  const progress = (() => { try { return JSON.parse(u.academy_progress || '{}'); } catch { return {}; } })();
                  const completed = Object.keys(progress).length;
                  const avgScore = completed > 0 ? Math.round(Object.values(progress).reduce((a, b) => a + (b.pct || 0), 0) / completed) : 0;
                  const studentSubs = submissions.filter(s => s.student_id === u.id || s.student_email === u.email);
                  const pendingCount = studentSubs.filter(s => s.status === 'submitted').length;
                  const melOk = studentSubs.filter(s => s.scenario_category === 'MEL' && (s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes')).length;
                  const cdlOk = studentSubs.filter(s => s.scenario_category === 'CDL' && (s.instructor_grade === 'pass' || s.instructor_grade === 'pass_with_notes')).length;

                  return (
                    <div key={u.id} onClick={() => setStudentDetail(u)}
                      className="flex items-center gap-4 bg-[#141922] border border-white/10 rounded-xl px-4 py-3.5 hover:border-white/25 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-primary">{(u.full_name || u.email || '?')[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{u.full_name || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <p className={cn('text-sm font-black', scoreColor(avgScore))}>{completed > 0 ? `${avgScore}%` : '—'}</p>
                          <p className="text-[9px] text-gray-600">Courses</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-amber-400">{melOk}/{submissions.filter(s => (s.student_id === u.id || s.student_email === u.email) && s.scenario_category === 'MEL' && s.status === 'graded').length}</p>
                          <p className="text-[9px] text-gray-600">MEL ✓</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-violet-400">{cdlOk}/{submissions.filter(s => (s.student_id === u.id || s.student_email === u.email) && s.scenario_category === 'CDL' && s.status === 'graded').length}</p>
                          <p className="text-[9px] text-gray-600">CDL ✓</p>
                        </div>
                        {pendingCount > 0 && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black">{pendingCount} pending</span>
                        )}
                        <div className="hidden lg:flex gap-1">
                          {ACADEMY_COURSES.map(c => {
                            const done = progress[c.id];
                            return <div key={c.id} className={cn('w-2 h-2 rounded-full', done ? (done.pct >= 70 ? 'bg-green-400' : 'bg-red-400') : 'bg-white/15')} />;
                          })}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── GRADING QUEUE TAB ── */}
        {tab === 'grading' && (
          <>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {[null, 'MEL', 'CDL', 'NEF', 'General'].map(cat => (
                <button key={String(cat)} onClick={() => setCategoryFilter(cat)}
                  className={cn('px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                    categoryFilter === cat ? 'bg-primary/20 border-primary text-primary' : 'bg-[#141922] border-white/10 text-gray-400 hover:text-white')}>
                  {cat || 'All'}
                </button>
              ))}
            </div>

            {/* Pending */}
            {pending.filter(s => !categoryFilter || s.scenario_category === categoryFilter).length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Pending Review ({pending.filter(s => !categoryFilter || s.scenario_category === categoryFilter).length})
                </p>
                <div className="space-y-2">
                  {pending.filter(s => !categoryFilter || s.scenario_category === categoryFilter)
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map(sub => (
                    <div key={sub.id} className="bg-amber-950/20 border border-amber-600/30 rounded-xl px-4 py-3.5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-xs font-bold text-white">{sub.scenario_title}</p>
                          <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded',
                            sub.scenario_category === 'MEL' ? 'bg-amber-900/50 text-amber-300' :
                            sub.scenario_category === 'CDL' ? 'bg-violet-900/50 text-violet-300' :
                            sub.scenario_category === 'NEF' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-white/10 text-gray-300'
                          )}>{sub.scenario_category}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{sub.student_name || sub.student_email} · {new Date(sub.created_date).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setGradeTarget(sub)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
                        <Award className="w-3.5 h-3.5" /> Grade
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graded */}
            {graded.filter(s => !categoryFilter || s.scenario_category === categoryFilter).length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> Graded ({graded.filter(s => !categoryFilter || s.scenario_category === categoryFilter).length})
                </p>
                <div className="space-y-2">
                  {graded.filter(s => !categoryFilter || s.scenario_category === categoryFilter)
                    .sort((a, b) => new Date(b.graded_at || b.updated_date) - new Date(a.graded_at || a.updated_date))
                    .map(sub => (
                    <div key={sub.id} className="bg-[#141922] border border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-xs font-bold text-white">{sub.scenario_title}</p>
                          <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded',
                            sub.scenario_category === 'MEL' ? 'bg-amber-900/50 text-amber-300' :
                            sub.scenario_category === 'CDL' ? 'bg-violet-900/50 text-violet-300' :
                            'bg-white/10 text-gray-300'
                          )}>{sub.scenario_category}</span>
                          {sub.mel_workflow_correct === true && <span className="text-[9px] text-green-400">✓ workflow</span>}
                          {sub.mel_workflow_correct === false && <span className="text-[9px] text-red-400">✗ workflow</span>}
                        </div>
                        <p className="text-[10px] text-gray-500">{sub.student_name || sub.student_email}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={cn('text-sm font-black', scoreColor(sub.instructor_score))}>{sub.instructor_score != null ? `${sub.instructor_score}%` : '—'}</span>
                        <span className={cn('text-[10px] font-bold px-2 py-1 rounded border',
                          GRADE_OPTIONS.find(g => g.value === sub.instructor_grade)?.bg || 'bg-white/5',
                          GRADE_OPTIONS.find(g => g.value === sub.instructor_grade)?.color || 'text-gray-400',
                          GRADE_OPTIONS.find(g => g.value === sub.instructor_grade)?.border || 'border-white/10'
                        )}>{gradeLabel(sub.instructor_grade)}</span>
                        <button onClick={() => setGradeTarget(sub)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/8 text-gray-300 border border-white/10 hover:bg-white/15">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submissions.filter(s => !categoryFilter || s.scenario_category === categoryFilter).length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                <p className="text-sm">No submissions yet</p>
                <p className="text-xs mt-1">Students submit via the Discrepancy Lab</p>
              </div>
            )}
          </>
        )}

        {/* ── MEL/CDL MASTERY TAB ── */}
        {tab === 'mastery' && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {[null, 'MEL', 'CDL', 'NEF'].map(cat => (
                <button key={String(cat)} onClick={() => setCategoryFilter(cat)}
                  className={cn('px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                    categoryFilter === cat ? 'bg-primary/20 border-primary text-primary' : 'bg-[#141922] border-white/10 text-gray-400 hover:text-white')}>
                  {cat || 'All Categories'}
                </button>
              ))}
            </div>

            {/* Per-scenario breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scenario Performance</p>
              {filteredScenarios.map(d => (
                <div key={d.id} className="bg-[#141922] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-extrabold text-white">{d.title}</p>
                        {d.category && (
                          <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded',
                            d.category === 'MEL' ? 'bg-amber-900/50 text-amber-300' :
                            d.category === 'CDL' ? 'bg-violet-900/50 text-violet-300' :
                            d.category === 'NEF' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-white/10 text-gray-400'
                          )}>{d.category}</span>
                        )}
                        <span className="text-[9px] text-gray-500">{d.difficulty}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">ATA {d.ata} · {d.ata_system} · {d.aircraft_type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-2xl font-black', scoreColor(d.avgScore))}>{d.avgScore != null ? `${d.avgScore}%` : '—'}</p>
                      <p className="text-[9px] text-gray-600">avg score</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center bg-[#0d1117] rounded-lg p-2">
                      <p className="text-base font-black text-white">{d.submissionCount}</p>
                      <p className="text-[9px] text-gray-500">Submissions</p>
                    </div>
                    <div className="text-center bg-[#0d1117] rounded-lg p-2">
                      <p className="text-base font-black text-white">{d.gradedCount}</p>
                      <p className="text-[9px] text-gray-500">Graded</p>
                    </div>
                    <div className="text-center bg-[#0d1117] rounded-lg p-2">
                      <p className={cn('text-base font-black', d.passRate != null ? (d.passRate >= 70 ? 'text-green-400' : d.passRate >= 50 ? 'text-amber-400' : 'text-red-400') : 'text-gray-600')}>
                        {d.passRate != null ? `${d.passRate}%` : '—'}
                      </p>
                      <p className="text-[9px] text-gray-500">Pass Rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {gradeTarget && <GradeModal submission={gradeTarget} onClose={() => setGradeTarget(null)} />}
    </div>
  );
}