import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, BookOpen, Trophy, Lock, ArrowRight, GraduationCap,
  Wrench, Users, CheckCircle, Clock, Award, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACADEMY_COURSES } from './academyData';
import AcademyLesson from './AcademyLesson';
import MockDiscrepancyLab from './MockDiscrepancyLab';
import InstructorDashboard from './InstructorDashboard';

export default function Academy() {
  const [view, setView] = useState('home'); // home | lesson | lab | instructor
  const [activeCourse, setActiveCourse] = useState(null);

  const [completedCourses, setCompletedCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('academy_completed') || '{}'); } catch { return {}; }
  });

  const handleCourseComplete = (courseId, score, total, pct) => {
    const updated = { ...completedCourses, [courseId]: { score, total, pct } };
    setCompletedCourses(updated);
    localStorage.setItem('academy_completed', JSON.stringify(updated));
    setView('home');
    setActiveCourse(null);
  };

  const doneCount = Object.keys(completedCourses).length;
  const totalCourses = ACADEMY_COURSES.length;
  const avgScore = doneCount > 0
    ? Math.round(Object.values(completedCourses).reduce((a, b) => a + (b.pct || 0), 0) / doneCount)
    : 0;
  const allCertified = doneCount === totalCourses;

  if (view === 'lesson' && activeCourse) {
    return (
      <AcademyLesson
        course={activeCourse}
        onComplete={handleCourseComplete}
        onBack={() => { setView('home'); setActiveCourse(null); }}
      />
    );
  }

  if (view === 'lab') {
    return <MockDiscrepancyLab onBack={() => setView('home')} />;
  }

  if (view === 'instructor') {
    return <InstructorDashboard onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">Aerodyne Academy</p>
            <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">Part 147 Aligned · Fleet OS Training</p>
          </div>
        </div>
        <button onClick={() => setView('instructor')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-bold hover:bg-violet-600/30 transition-colors">
          <Users className="w-3.5 h-3.5" /> Instructor
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-6">

        {/* Certification Banner */}
        {allCertified ? (
          <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-green-500/15 border border-primary/30 px-5 py-5 text-center">
            <Award className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-black text-white">Aerodyne Academy Certified</p>
            <p className="text-sm text-gray-400">All {totalCourses} modules complete · Average: {avgScore}%</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/25 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-black text-white">Your Progress</p>
                <p className="text-xs text-gray-400">{doneCount} of {totalCourses} courses completed</p>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-lg font-black text-primary">{avgScore > 0 ? `${avgScore}%` : '—'}</span>
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / totalCourses) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Part 147 Notice */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Star className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-extrabold text-blue-300">Part 147 Aligned Curriculum</p>
            <p className="text-xs text-blue-200/70 mt-0.5 leading-relaxed">
              This curriculum maps to FAA Part 147 Aviation Maintenance Technician School standards. 
              Topics cover General, Airframe, and Powerplant knowledge areas as applied within Aerodyne Fleet OS.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setView('lab')}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-900/15 p-4 hover:bg-amber-900/25 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Discrepancy Lab</p>
              <p className="text-[10px] text-gray-400">6 practice scenarios</p>
            </div>
          </button>
          <Link to="/HowItWorks"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141922] p-4 hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">How It Works</p>
              <p className="text-[10px] text-gray-400">System overview guide</p>
            </div>
          </Link>
        </div>

        {/* Course List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Training Courses</p>
          {ACADEMY_COURSES.map((course, idx) => {
            const done = completedCourses[course.id];
            const locked = idx > 0 && !completedCourses[ACADEMY_COURSES[idx - 1].id];
            return (
              <button
                key={course.id}
                disabled={locked}
                onClick={() => { setActiveCourse(course); setView('lesson'); }}
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
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl')}
                    style={{ background: locked ? 'rgba(255,255,255,0.03)' : `${course.color}20` }}>
                    {locked ? <Lock className="w-5 h-5 text-gray-600" /> : <span>{course.icon}</span>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-extrabold text-white">{course.title}</p>
                      {done && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                          {done.pct}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{course.subtitle}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-600">{course.part147}</span>
                      <span className="text-[10px]" style={{ color: course.color }}>{course.level}</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-600">
                        <Clock className="w-2.5 h-2.5" /> {course.estimatedMinutes} min
                      </span>
                      <span className="text-[10px] text-gray-600">{course.lessons.length} lessons · {course.quiz.length} questions</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {done ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                     locked ? null : <ArrowRight className="w-5 h-5 text-gray-500" />}
                  </div>
                </div>

                {/* Score bar */}
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
      </div>
    </div>
  );
}