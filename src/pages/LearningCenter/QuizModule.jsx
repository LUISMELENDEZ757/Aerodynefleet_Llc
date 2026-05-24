import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuizModule({ module, onComplete, onBack }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);

  const questions = module.questions;
  const q = questions[currentQ];
  const progress = ((currentQ) / questions.length) * 100;

  const handleSelect = (optIdx) => {
    if (confirmed) return;
    setSelected(optIdx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    const correct = selected === q.answer;
    setConfirmed(true);
    if (correct) setScore(s => s + 1);
    setAnswers(prev => [...prev, { correct, selected, answer: q.answer }]);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ(i => i + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelected(null);
    setConfirmed(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  const finalScore = finished ? score : 0;
  const pct = Math.round((finalScore / questions.length) * 100);

  if (finished) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="text-sm font-extrabold">{module.title}</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md text-center space-y-6"
          >
            {/* Score circle */}
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 314} 314`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-white">{pct}%</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Score</p>
              </div>
            </div>

            <div>
              <p className="text-xl font-black text-white">
                {pct >= 80 ? '🎉 Excellent!' : pct >= 60 ? '👍 Good Job!' : '📚 Keep Studying'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                You answered {finalScore} of {questions.length} questions correctly.
              </p>
            </div>

            {/* Answer review */}
            <div className="text-left space-y-2">
              {questions.map((q, i) => (
                <div key={i} className={cn('rounded-xl px-3 py-2 flex items-start gap-2',
                  answers[i]?.correct ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/20 border border-red-500/20')}>
                  {answers[i]?.correct
                    ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                  <p className="text-xs text-gray-300 leading-snug">{q.question}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
              <button onClick={() => onComplete(module.id, finalScore, questions.length)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-extrabold">{module.title}</p>
          <p className="text-[10px] text-gray-500">Question {currentQ + 1} of {questions.length}</p>
        </div>
        <span className="text-sm font-black text-primary">{score} pts</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/8">
        <motion.div className="h-full bg-primary"
          animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-5 py-8 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div key={currentQ}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Category badge */}
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mb-4"
              style={{ background: `${module.color}20`, color: module.color }}>
              {module.title}
            </span>

            {/* Question text */}
            <p className="text-lg font-bold text-white leading-snug mb-8">{q.question}</p>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = confirmed && i === q.answer;
                const isWrong = confirmed && isSelected && i !== q.answer;

                return (
                  <button key={i} onClick={() => handleSelect(i)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-200',
                      !confirmed && isSelected && 'border-primary bg-primary/15 text-white',
                      !confirmed && !isSelected && 'border-white/10 bg-[#141922] text-gray-300 hover:border-white/25 hover:bg-white/5',
                      isCorrect && 'border-green-500 bg-green-900/25 text-green-300',
                      isWrong && 'border-red-500 bg-red-900/25 text-red-300',
                      confirmed && !isCorrect && !isWrong && 'border-white/8 bg-[#141922] text-gray-500 opacity-60',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0',
                        isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : isSelected ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-gray-400')}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {confirmed && q.explanation && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('mt-4 rounded-xl px-4 py-3 border text-sm',
                    selected === q.answer ? 'bg-green-900/20 border-green-500/25 text-green-300' : 'bg-blue-900/20 border-blue-500/25 text-blue-300')}>
                  <p className="font-bold mb-0.5">{selected === q.answer ? '✓ Correct!' : '✗ Incorrect'}</p>
                  <p className="text-xs leading-relaxed opacity-90">{q.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          {!confirmed ? (
            <button onClick={handleConfirm} disabled={selected === null}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors">
              Confirm Answer
            </button>
          ) : (
            <button onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}