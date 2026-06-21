import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export default function AcademyLesson({ course, onComplete, onBack }) {
  const [step, setStep] = useState(0); // 0..lessons.length-1 = lessons, then quiz
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = course.lessons.length + 1; // +1 for quiz
  const isLesson = step < course.lessons.length;
  const isQuiz = step === course.lessons.length;
  const lesson = isLesson ? course.lessons[step] : null;

  const score = submitted
    ? course.quiz.filter((q, i) => quizAnswers[i] === q.answer).length
    : 0;
  const pct = submitted ? Math.round((score / course.quiz.length) * 100) : 0;

  const handleSubmitQuiz = () => setSubmitted(true);

  const handleFinish = () => {
    onComplete(course.id, score, course.quiz.length, pct);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: `${course.color}20` }}>
          {course.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold truncate">{course.title}</p>
          <p className="text-[10px] text-gray-500">{course.part147}</p>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn('w-1.5 h-1.5 rounded-full transition-all',
              i < step ? 'bg-green-400' : i === step ? 'bg-primary' : 'bg-white/20')} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6">

        {/* LESSON */}
        {isLesson && lesson && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Lesson {step + 1} of {course.lessons.length}</p>
              <h2 className="text-xl font-black text-white">{lesson.title}</h2>
            </div>
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-6">
              <ReactMarkdown
                className="prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed
                  [&>h2]:text-white [&>h2]:font-extrabold [&>h2]:text-base [&>h2]:mt-4 [&>h2]:mb-2
                  [&>p]:mb-3 [&>ul]:ml-4 [&>ul]:mb-3 [&>li]:mb-1 [&>strong]:text-primary"
              >
                {lesson.content}
              </ReactMarkdown>
            </div>
            <button
              onClick={() => setStep(s => s + 1)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 transition-colors"
            >
              {step + 1 < course.lessons.length ? 'Next Lesson' : 'Proceed to Quiz'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* QUIZ */}
        {isQuiz && (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Knowledge Check</p>
              <h2 className="text-xl font-black text-white">{course.title} — Quiz</h2>
              <p className="text-sm text-gray-400 mt-1">{course.quiz.length} questions · Pass at 70%</p>
            </div>

            {!submitted ? (
              <>
                {course.quiz.map((q, qi) => (
                  <div key={qi} className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-3">
                    <p className="text-sm font-bold text-white">{qi + 1}. {q.q}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <button key={oi} onClick={() => setQuizAnswers(a => ({ ...a, [qi]: oi }))}
                          className={cn('w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all',
                            quizAnswers[qi] === oi
                              ? 'border-primary bg-primary/15 text-white font-semibold'
                              : 'border-white/10 bg-white/3 text-gray-300 hover:border-white/20 hover:bg-white/5')}>
                          <span className="font-bold mr-2 text-gray-500">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < course.quiz.length}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Submit Quiz
                </button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Score card */}
                <div className={cn('rounded-2xl p-6 text-center border',
                  pct >= 70 ? 'bg-green-900/20 border-green-500/40' : 'bg-red-900/20 border-red-500/40')}>
                  <div className="text-5xl font-black mb-2" style={{ color: pct >= 70 ? '#22c55e' : '#ef4444' }}>
                    {pct}%
                  </div>
                  <p className="text-sm font-bold text-white">{score} / {course.quiz.length} correct</p>
                  <p className={cn('text-xs mt-1', pct >= 70 ? 'text-green-400' : 'text-red-400')}>
                    {pct >= 70 ? '✓ Module Passed' : '✗ Score below 70% — review lessons and retry'}
                  </p>
                </div>

                {/* Answers review */}
                {course.quiz.map((q, qi) => {
                  const userAns = quizAnswers[qi];
                  const correct = q.answer;
                  const isRight = userAns === correct;
                  return (
                    <div key={qi} className={cn('rounded-xl border p-4', isRight ? 'border-green-500/30 bg-green-900/10' : 'border-red-500/30 bg-red-900/10')}>
                      <p className="text-xs font-bold text-white mb-2">{qi + 1}. {q.q}</p>
                      <p className={cn('text-xs', isRight ? 'text-green-400' : 'text-red-400')}>
                        Your answer: {q.options[userAns]} {isRight ? '✓' : '✗'}
                      </p>
                      {!isRight && <p className="text-xs text-green-400 mt-0.5">Correct: {q.options[correct]}</p>}
                    </div>
                  );
                })}

                <div className="flex gap-3">
                  {pct < 70 && (
                    <button onClick={() => { setSubmitted(false); setQuizAnswers({}); }}
                      className="flex-1 py-3 rounded-xl border border-white/20 text-sm font-bold text-white hover:bg-white/5 transition-colors">
                      Retry Quiz
                    </button>
                  )}
                  <button onClick={handleFinish}
                    className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    {pct >= 70 ? <><Trophy className="w-4 h-4" /> Complete Module</> : 'Back to Course'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}