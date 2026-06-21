import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, BookOpen, Trophy, Lock, ArrowRight, GraduationCap,
  Wrench, Users, CheckCircle, Clock, Award, Star, Download, Bot,
  Eye, X, ChevronDown, ChevronRight as ChevronRightIcon, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACADEMY_COURSES } from './academyData';
import AcademyLesson from './AcademyLesson';
import MockDiscrepancyLab from './MockDiscrepancyLab';
import InstructorDashboard from './InstructorDashboard';
import CertificateOfCompletion from './CertificateOfCompletion';
import AcademyTutor from './AcademyTutor';

function CoursePreviewModal({ course, done, onClose, onStart }) {
  const [openLesson, setOpenLesson] = useState(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${course.color}25` }}>
              {course.icon}
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">{course.title}</p>
              <p className="text-[10px] text-gray-400">{course.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300">{course.part147}</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${course.color}20`, color: course.color }}>{course.level}</span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
              <Clock className="w-3 h-3" /> {course.estimatedMinutes} min
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
              {course.lessons.length} lessons · {course.quiz.length} quiz questions
            </span>
          </div>

          {done && (
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-green-400">Completed — {done.pct}% score</p>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5 w-48">
                  <div className="h-full rounded-full" style={{ width: `${done.pct}%`, background: done.pct >= 80 ? '#22c55e' : '#f59e0b' }} />
                </div>
              </div>
            </div>
          )}

          {/* Lessons */}
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Lessons</p>
            <div className="space-y-1.5">
              {course.lessons.map((lesson, i) => (
                <div key={lesson.id} className="rounded-xl border border-white/8 overflow-hidden">
                  <button
                    onClick={() => setOpenLesson(openLesson === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: `${course.color}25`, color: course.color }}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-bold text-white">{lesson.title}</p>
                    </div>
                    {openLesson === i
                      ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronRightIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                  </button>
                  {openLesson === i && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-line bg-black/20 rounded-lg p-3 max-h-48 overflow-y-auto">
                        {lesson.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quiz preview */}
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Quiz Preview ({course.quiz.length} questions)</p>
            <div className="space-y-2">
              {course.quiz.slice(0, 3).map((q, i) => (
                <div key={i} className="bg-black/20 rounded-xl px-4 py-3 border border-white/6">
                  <p className="text-xs font-bold text-gray-200">{i + 1}. {q.q}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {q.options.map((opt, j) => (
                      <span key={j} className={cn(
                        'text-[10px] px-2 py-0.5 rounded border',
                        j === q.answer ? 'bg-green-900/30 border-green-600/40 text-green-300 font-bold' : 'bg-white/5 border-white/8 text-gray-500'
                      )}>{opt}</span>
                    ))}
                  </div>
                </div>
              ))}
              {course.quiz.length > 3 && (
                <p className="text-[10px] text-gray-600 text-center">+ {course.quiz.length - 3} more questions in the full quiz</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-colors"
            style={{ background: course.color, color: '#0d1117' }}
          >
            <Play className="w-4 h-4" />
            {done ? 'Retake Course' : 'Start Course'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Academy() {
  const [view, setView] = useState('home'); // home | lesson | lab | instructor | tutor
  const [activeCourse, setActiveCourse] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);

  const [completedCourses, setCompletedCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('academy_completed') || '{}'); } catch { return {}; }
  });
  const [showCert, setShowCert] = useState(false);

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

  if (view === 'tutor') {
    return <AcademyTutor onBack={() => setView('home')} />;
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

        {/* Certificate Modal */}
        {showCert && (
          <CertificateOfCompletion
            completedCourses={completedCourses}
            avgScore={avgScore}
            onClose={() => setShowCert(false)}
          />
        )}



        {/* Certification Banner */}
        {allCertified ? (
          <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-green-500/15 border border-primary/30 px-5 py-5 text-center">
            <Award className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-black text-white">Aerodyne Academy Certified</p>
            <p className="text-sm text-gray-400">All {totalCourses} modules complete · Average: {avgScore}%</p>
            <button
              onClick={() => setShowCert(true)}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" /> View & Download Certificate
            </button>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button onClick={() => setView('lab')}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-900/15 p-4 hover:bg-amber-900/25 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Discrepancy Lab</p>
              <p className="text-[10px] text-gray-400">Practice scenarios</p>
            </div>
          </button>
          <button onClick={() => setView('tutor')}
            className="flex items-center gap-3 rounded-2xl border border-violet-500/30 bg-violet-900/15 p-4 hover:bg-violet-900/25 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">AI Tutor</p>
              <p className="text-[10px] text-gray-400">Ask anything · MEL/CDL/FAA</p>
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
              <div key={course.id} className="relative">
                <button
                  onClick={() => setPreviewCourse(course)}
                  className={cn(
                    'w-full text-left rounded-2xl border p-4 transition-all duration-200',
                    locked
                      ? 'border-white/8 bg-[#141922] opacity-70'
                      : done
                      ? 'border-green-500/30 bg-green-900/10 hover:bg-green-900/20'
                      : 'border-white/10 bg-[#141922] hover:bg-white/5 hover:border-white/20'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
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
                        {locked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/8 text-gray-500">
                            Preview Available
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
                      {done
                        ? <CheckCircle className="w-5 h-5 text-green-400" />
                        : locked
                        ? <Eye className="w-5 h-5 text-gray-600" />
                        : <Eye className="w-5 h-5 text-gray-400" />}
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
              </div>
            );
          })}
        </div>

        {/* Course Preview Modal */}
        {previewCourse && (
          <CoursePreviewModal
            course={previewCourse}
            done={completedCourses[previewCourse.id]}
            onClose={() => setPreviewCourse(null)}
            onStart={() => {
              const idx = ACADEMY_COURSES.indexOf(previewCourse);
              const locked = idx > 0 && !completedCourses[ACADEMY_COURSES[idx - 1].id];
              if (!locked) {
                setActiveCourse(previewCourse);
                setView('lesson');
              }
              setPreviewCourse(null);
            }}
          />
        )}
      </div>
    </div>
  );
}