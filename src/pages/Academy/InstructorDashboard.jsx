import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Users, BookOpen, Trophy, CheckCircle, Clock, Plus, Mail, GraduationCap, BarChart2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACADEMY_COURSES } from './academyData';

// Uses the existing User entity — no new entity needed
// Instructors can view all users' academy progress stored in their user metadata

const COURSE_MAP = Object.fromEntries(ACADEMY_COURSES.map(c => [c.id, c]));

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <p className={cn('text-4xl font-black', color)}>{value}</p>
    </div>
  );
}

function StudentRow({ user, onAssign }) {
  const progress = (() => {
    try { return JSON.parse(user.academy_progress || '{}'); } catch { return {}; }
  })();
  const completed = Object.keys(progress).length;
  const avgScore = completed > 0
    ? Math.round(Object.values(progress).reduce((a, b) => a + (b.pct || 0), 0) / completed)
    : 0;

  return (
    <div className="flex items-center gap-4 bg-[#141922] border border-white/10 rounded-xl px-4 py-3.5 hover:border-white/20 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-black text-primary">{(user.full_name || user.email || '?')[0].toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{user.full_name || 'Unknown'}</p>
        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-center">
          <p className="text-sm font-black text-white">{completed}/{ACADEMY_COURSES.length}</p>
          <p className="text-[9px] text-gray-500">Modules</p>
        </div>
        <div className="text-center">
          <p className={cn('text-sm font-black', avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-amber-400' : completed > 0 ? 'text-red-400' : 'text-gray-600')}>
            {completed > 0 ? `${avgScore}%` : '—'}
          </p>
          <p className="text-[9px] text-gray-500">Avg Score</p>
        </div>
        <div className="hidden sm:flex gap-1">
          {ACADEMY_COURSES.map(c => {
            const done = progress[c.id];
            return (
              <div key={c.id} title={`${c.title}: ${done ? `${done.pct}%` : 'Not started'}`}
                className={cn('w-2 h-2 rounded-full', done ? (done.pct >= 70 ? 'bg-green-400' : 'bg-red-400') : 'bg-white/15')} />
            );
          })}
        </div>
        <button onClick={() => onAssign(user)}
          className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors">
          Assign
        </button>
      </div>
    </div>
  );
}

function AssignModal({ user, onClose }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [message, setMessage] = useState('');

  const handleAssign = () => {
    // In a real system this would send a notification
    alert(`Assignment sent to ${user.full_name || user.email}: ${ACADEMY_COURSES.find(c => c.id === selectedCourse)?.title || 'All Courses'}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <p className="text-sm font-extrabold">Assign Course</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg font-bold">×</button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-white">{user.full_name || 'Student'}</p>
            <p className="text-[10px] text-gray-400">{user.email}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Select Course</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
              className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary">
              <option value="">— All Courses (Full Curriculum) —</option>
              {ACADEMY_COURSES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Message (optional)</label>
            <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Add a note to the student..."
              className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleAssign}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InstructorDashboard({ onBack }) {
  const [assignTarget, setAssignTarget] = useState(null);
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['academy-users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Only show non-admin users as students
  const students = users.filter(u =>
    (u.role === 'user' || u.role === 'student') &&
    (!search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  // Aggregate stats
  const allProgress = students.map(u => {
    try { return JSON.parse(u.academy_progress || '{}'); } catch { return {}; }
  });
  const totalCompleted = allProgress.reduce((sum, p) => sum + Object.keys(p).length, 0);
  const avgGlobal = allProgress.length > 0
    ? Math.round(allProgress.reduce((sum, p) => {
        const vals = Object.values(p);
        return sum + (vals.length > 0 ? vals.reduce((a, b) => a + (b.pct || 0), 0) / vals.length : 0);
      }, 0) / allProgress.filter(p => Object.keys(p).length > 0).length) || 0
    : 0;
  const certifiedCount = allProgress.filter(p => Object.keys(p).length === ACADEMY_COURSES.length).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <p className="text-base font-extrabold">Instructor Dashboard</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Part 147 Academy · Student Management</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 mt-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Students" value={students.length} icon={Users} color="text-white" />
          <StatCard label="Modules Done" value={totalCompleted} icon={BookOpen} color="text-primary" />
          <StatCard label="Avg Score" value={allProgress.filter(p => Object.keys(p).length > 0).length > 0 ? `${avgGlobal}%` : '—'} icon={BarChart2} color={avgGlobal >= 70 ? 'text-green-400' : 'text-amber-400'} />
          <StatCard label="Certified" value={certifiedCount} icon={Award} color="text-violet-400" />
        </div>

        {/* Course completion heatmap */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-4">Course Completion Overview</p>
          <div className="space-y-2">
            {ACADEMY_COURSES.map(course => {
              const completedCount = allProgress.filter(p => p[course.id]).length;
              const pct = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;
              return (
                <div key={course.id} className="flex items-center gap-3">
                  <span className="text-base w-6 flex-shrink-0">{course.icon}</span>
                  <p className="text-xs text-gray-300 w-48 truncate flex-shrink-0">{course.title}</p>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: course.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 w-12 text-right">{completedCount}/{students.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-extrabold text-white">Students ({students.length})</p>
            <input type="text" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[#141922] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-primary w-40" />
          </div>
          {isLoading ? (
            <p className="text-center text-gray-600 py-10">Loading students…</p>
          ) : students.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-700" />
              <p className="text-sm">No students found. Invite users via User Management → assign role "user".</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map(u => (
                <StudentRow key={u.id} user={u} onAssign={setAssignTarget} />
              ))}
            </div>
          )}
        </div>
      </div>

      {assignTarget && <AssignModal user={assignTarget} onClose={() => setAssignTarget(null)} />}
    </div>
  );
}