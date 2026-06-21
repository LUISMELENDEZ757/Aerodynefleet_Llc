import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, AlertTriangle, CheckCircle, Zap, Wrench, Clock, BookOpen, ChevronDown, ChevronRight, Filter, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_DISCREPANCIES } from './academyData';

const CATEGORY_STYLES = {
  MEL: { label: 'MEL', bg: 'bg-amber-800/70', text: 'text-amber-200', border: 'border-amber-600/50' },
  NEF: { label: 'NEF', bg: 'bg-blue-800/70',  text: 'text-blue-200',  border: 'border-blue-600/50' },
  CDL: { label: 'CDL', bg: 'bg-violet-800/70', text: 'text-violet-200', border: 'border-violet-600/50' },
};

const SEVERITY_STYLES = {
  warning:  { label: 'WARNING',  bg: 'bg-red-700',    text: 'text-red-300',   border: 'border-red-600' },
  caution:  { label: 'CAUTION',  bg: 'bg-amber-700',  text: 'text-amber-300', border: 'border-amber-600' },
  advisory: { label: 'ADVISORY', bg: 'bg-blue-700',   text: 'text-blue-300',  border: 'border-blue-600' },
};

const DIFF_COLORS = { Basic: '#22c55e', Intermediate: '#f59e0b', Advanced: '#ef4444' };

function DiscrepancyCard({ disc, onOpen }) {
  const sev = SEVERITY_STYLES[disc.severity];
  return (
    <div onClick={onOpen}
      className={cn('bg-[#141922] border rounded-2xl p-5 cursor-pointer hover:brightness-110 transition-all active:scale-[0.98]', sev.border)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded text-white', sev.bg)}>{sev.label}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">ATA {disc.ata}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${DIFF_COLORS[disc.difficulty]}20`, color: DIFF_COLORS[disc.difficulty] }}>{disc.difficulty}</span>
          {disc.category && CATEGORY_STYLES[disc.category] && (
            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded border', CATEGORY_STYLES[disc.category].bg, CATEGORY_STYLES[disc.category].text, CATEGORY_STYLES[disc.category].border)}>
              {disc.category}
            </span>
          )}
          {disc.mel_applicable && !disc.category && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50">MEL</span>
          )}
          {disc.nef_applicable && !disc.category && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">NEF</span>
          )}
          {disc.cdl_applicable && !disc.category && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-violet-900/50 text-violet-300 border border-violet-700/50">CDL</span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
      </div>
      <h3 className="text-sm font-extrabold text-white mb-1">{disc.title}</h3>
      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        <span className="font-mono font-bold text-primary">{disc.aircraft}</span>
        <span>{disc.aircraft_type}</span>
        <span>{disc.station}</span>
        <span>{disc.ata_system}</span>
      </div>
    </div>
  );
}

function DiscrepancyWorkbench({ disc, onBack }) {
  const [showHints, setShowHints] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [logFields, setLogFields] = useState({
    ata: disc.ata,
    station: disc.station,
    description: '',
    corrective_action: '',
    technician_name: '',
    cert_number: '',
    mel_ref: disc.mel_ref || '',
    mel_category: disc.mel_category || '',
  });
  const sev = SEVERITY_STYLES[disc.severity];
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      return base44.entities.LabSubmission.create({
        student_id: me.id,
        student_name: me.full_name || '',
        student_email: me.email || '',
        scenario_id: disc.id,
        scenario_title: disc.title,
        scenario_category: disc.category || (disc.mel_applicable ? 'MEL' : disc.cdl_applicable ? 'CDL' : disc.nef_applicable ? 'NEF' : 'General'),
        scenario_difficulty: disc.difficulty,
        ...data,
      });
    },
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = () => {
    if (!logFields.description.trim() && !logFields.corrective_action.trim()) return;
    submitMutation.mutate({
      ata_chapter: logFields.ata,
      station: logFields.station,
      description: logFields.description,
      corrective_action: logFields.corrective_action,
      mel_ref: logFields.mel_ref,
      mel_category: logFields.mel_category,
      technician_name: logFields.technician_name,
      cert_number: logFields.cert_number,
      hints_used: hintIndex + (showHints ? 1 : 0),
      answer_revealed: revealed,
    });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Wrench className="w-5 h-5 text-amber-400" />
        <div>
          <p className="text-sm font-extrabold">Mock Discrepancy Lab</p>
          <p className="text-[10px] text-gray-500">Practice E-Logbook Entry</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5 space-y-5">

        {/* Aircraft Banner */}
        <div className={cn('rounded-2xl border p-5', sev.border, 'bg-[#141922]')}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded text-white', sev.bg)}>{sev.label}</span>
            <span className="text-xs font-mono font-bold text-primary">{disc.aircraft}</span>
            <span className="text-xs text-gray-400">{disc.aircraft_type}</span>
            <span className="text-xs text-gray-500">· FLT {disc.flight_number} · {disc.station}</span>
          </div>
          <h2 className="text-lg font-black text-white mb-3">{disc.title}</h2>
          <div className="bg-black/30 rounded-xl p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {disc.scenario}
          </div>
          {disc.hints && (
            <div className="mt-3">
              <button onClick={() => setShowHints(!showHints)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
                <Zap className="w-3 h-3" /> {showHints ? 'Hide Hints' : 'Show Hints'}
                <ChevronDown className={cn('w-3 h-3 transition-transform', showHints ? 'rotate-180' : '')} />
              </button>
              {showHints && (
                <div className="mt-2 space-y-1.5">
                  {disc.hints.slice(0, hintIndex + 1).map((h, i) => (
                    <div key={i} className="flex items-start gap-2 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
                      <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-amber-200">{h}</p>
                    </div>
                  ))}
                  {hintIndex < disc.hints.length - 1 && (
                    <button onClick={() => setHintIndex(i => i + 1)}
                      className="text-[10px] text-amber-500 font-bold hover:text-amber-300 transition-colors">
                      + Next Hint
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Practice Logbook Form */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Practice Logbook Entry
          </p>
          <p className="text-[10px] text-gray-500">Fill in the fields as you would in the actual E-Logbook</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={logFields.ata} onChange={e => setLogFields(f => ({ ...f, ata: e.target.value }))}
                className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Station</label>
              <input value={logFields.station} onChange={e => setLogFields(f => ({ ...f, station: e.target.value }))}
                className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Discrepancy Description</label>
            <textarea rows={3} value={logFields.description} onChange={e => setLogFields(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the discrepancy as found..."
              className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Corrective Action</label>
            <textarea rows={4} value={logFields.corrective_action} onChange={e => setLogFields(f => ({ ...f, corrective_action: e.target.value }))}
              placeholder="Describe the corrective action performed per AMM..."
              className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary resize-none" />
          </div>

          {(disc.mel_applicable || disc.category === 'MEL') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">MEL Reference</label>
                <input value={logFields.mel_ref} onChange={e => setLogFields(f => ({ ...f, mel_ref: e.target.value }))}
                  placeholder={disc.mel_ref || 'e.g. 32-30-1'}
                  className="w-full bg-amber-900/10 border border-amber-700/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">MEL Category</label>
                <select value={logFields.mel_category} onChange={e => setLogFields(f => ({ ...f, mel_category: e.target.value }))}
                  className="w-full bg-amber-900/10 border border-amber-700/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500">
                  <option value="">-- Select --</option>
                  {['A', 'B', 'C', 'D'].map(c => <option key={c} value={c}>Category {c}</option>)}
                </select>
              </div>
            </div>
          )}
          {(disc.cdl_applicable || disc.category === 'CDL') && (
            <div>
              <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">CDL Reference (AFM Supplement)</label>
              <input value={logFields.mel_ref} onChange={e => setLogFields(f => ({ ...f, mel_ref: e.target.value }))}
                placeholder={disc.cdl_ref || 'e.g. CDL 57-40-1'}
                className="w-full bg-violet-900/10 border border-violet-700/30 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
            </div>
          )}
          {(disc.nef_applicable || disc.category === 'NEF') && (
            <div className="bg-blue-900/15 border border-blue-700/30 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">NEF Deferral</p>
              <p className="text-xs text-blue-200/70">Non-Essential Equipment and Furnishings — no MEL required. Document in logbook as Info entry with NEF notation.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Technician Name</label>
              <input value={logFields.technician_name} onChange={e => setLogFields(f => ({ ...f, technician_name: e.target.value }))}
                placeholder="First Last"
                className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Cert # (A&P)</label>
              <input value={logFields.cert_number} onChange={e => setLogFields(f => ({ ...f, cert_number: e.target.value }))}
                placeholder="AMT-XXXXX"
                className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Submit for grading */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || (!logFields.description.trim() && !logFields.corrective_action.trim())}
            className="w-full py-3.5 rounded-xl bg-violet-600 text-white text-sm font-extrabold hover:bg-violet-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitMutation.isPending ? 'Submitting…' : 'Submit for Instructor Grading'}
          </button>
        ) : (
          <div className="bg-violet-900/20 border border-violet-500/40 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-violet-300">Submitted for grading</p>
              <p className="text-xs text-gray-400">Your instructor will review and score your response.</p>
            </div>
          </div>
        )}

        {/* Reveal Answer */}
        {!revealed ? (
          <button onClick={() => setRevealed(true)}
            className="w-full py-3.5 rounded-xl border border-primary/40 text-primary text-sm font-extrabold hover:bg-primary/10 transition-colors">
            Reveal Correct Answer / AMM Guidance
          </button>
        ) : (
          <div className="bg-green-900/20 border border-green-500/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-sm font-extrabold text-green-400">Correct Answer & AMM Guidance</p>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{disc.correctAction}</p>
            {disc.mel_applicable && (
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3 mt-2">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">MEL Reference</p>
                <p className="text-sm text-amber-200 font-bold">{disc.mel_ref} — Category {disc.mel_category}</p>
              </div>
            )}
            <button onClick={onBack}
              className="w-full mt-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors">
              Back to Lab
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const CATEGORY_FILTERS = [
  { id: null,    label: 'All' },
  { id: 'MEL',   label: '🟡 MEL' },
  { id: 'NEF',   label: '🔵 NEF' },
  { id: 'CDL',   label: '🟣 CDL' },
  { id: 'other', label: '⚙️ General' },
];

export default function MockDiscrepancyLab({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  if (selected) {
    return <DiscrepancyWorkbench disc={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <button onClick={onBack} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-base font-extrabold">Mock Discrepancy Lab</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Hands-On Practice Scenarios</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-5">
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-extrabold text-amber-400">Training Environment</p>
              <p className="text-xs text-amber-200/70 mt-0.5">These are simulated discrepancy scenarios for educational purposes only. No actual aircraft data is created or modified.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: MOCK_DISCREPANCIES.length, color: 'text-white' },
            { label: 'MEL', value: MOCK_DISCREPANCIES.filter(d => d.category === 'MEL' || (d.mel_applicable && !d.category)).length, color: 'text-amber-400' },
            { label: 'NEF', value: MOCK_DISCREPANCIES.filter(d => d.category === 'NEF' || d.nef_applicable).length, color: 'text-blue-400' },
            { label: 'CDL', value: MOCK_DISCREPANCIES.filter(d => d.category === 'CDL' || d.cdl_applicable).length, color: 'text-violet-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#141922] border border-white/10 rounded-xl p-4 text-center">
              <p className={cn('text-3xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
          {CATEGORY_FILTERS.map(f => (
            <button key={String(f.id)} onClick={() => setCategoryFilter(f.id)}
              className={cn('px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                categoryFilter === f.id
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-[#141922] border-white/10 text-gray-400 hover:text-white hover:border-white/20')}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {categoryFilter ? `${categoryFilter} Scenarios` : 'All Scenarios'} ({
              MOCK_DISCREPANCIES.filter(d => {
                if (!categoryFilter) return true;
                if (categoryFilter === 'other') return !d.category && !d.nef_applicable && !d.cdl_applicable;
                if (categoryFilter === 'MEL') return d.category === 'MEL' || (d.mel_applicable && !d.category);
                if (categoryFilter === 'NEF') return d.category === 'NEF' || d.nef_applicable;
                if (categoryFilter === 'CDL') return d.category === 'CDL' || d.cdl_applicable;
                return true;
              }).length
            })
          </p>
          {MOCK_DISCREPANCIES.filter(d => {
            if (!categoryFilter) return true;
            if (categoryFilter === 'other') return !d.category && !d.nef_applicable && !d.cdl_applicable;
            if (categoryFilter === 'MEL') return d.category === 'MEL' || (d.mel_applicable && !d.category);
            if (categoryFilter === 'NEF') return d.category === 'NEF' || d.nef_applicable;
            if (categoryFilter === 'CDL') return d.category === 'CDL' || d.cdl_applicable;
            return true;
          }).map(disc => (
            <DiscrepancyCard key={disc.id} disc={disc} onOpen={() => setSelected(disc)} />
          ))}
        </div>
      </div>
    </div>
  );
}