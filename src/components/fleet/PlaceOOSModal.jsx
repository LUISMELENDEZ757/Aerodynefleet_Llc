import { useState } from 'react';
import { X, AlertTriangle, User, AlertCircle, MapPin, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES = ['Lead Technician', 'Technician', 'Supervisor', 'Inspector', 'Quality Assurance'];
const MEL_CATEGORIES = ['A — ASAP', 'B — 3 Days', 'C — 10 Days', 'D — 120 Days', 'N/A'];
const STATIONS = ['KEWR', 'KJFK', 'KORD', 'KMCO', 'KLAX', 'KSFO', 'KDFW', 'KATL', 'KBOS', 'KDCA', 'KSEA', 'KDEN'];

const STEPS = [
  { step: 1, label: 'Technician', icon: User },
  { step: 2, label: 'Discrepancy', icon: AlertCircle },
  { step: 3, label: 'Location', icon: MapPin },
  { step: 4, label: 'MEL / ETR', icon: FileText },
  { step: 5, label: 'Confirm', icon: CheckCircle },
];

export default function PlaceOOSModal({ aircraft, onClose, onSubmit, isPending }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Step 1: Technician
    tech_name: '',
    tech_cert: '',
    role: '',
    // Step 2: Discrepancy
    ata_chapter: '',
    discrepancy_desc: '',
    // Step 3: Location
    station: '',
    // Step 4: MEL/ETR
    mel_category: 'N/A',
    is_deferred: false,
    mel_ref: '',
    // General
    notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!form.tech_name || !form.tech_cert || !form.role || !form.discrepancy_desc || !form.station) return;
    onSubmit({
      aircraft_tail: aircraft.tail_number,
      entry_type: 'discrepancy',
      description: `[PLACE OOS] ${form.discrepancy_desc}`,
      ata_chapter: form.ata_chapter || '',
      station: form.station,
      technician_name: form.tech_name,
      technician_id: form.tech_cert,
      is_deferred: form.is_deferred,
      mel_category: form.mel_category !== 'N/A' ? form.mel_category.split(' ')[0] : '',
      mel_reference: form.mel_ref || '',
      notes: form.notes || `Role: ${form.role} | MEL: ${form.mel_category}`,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 p-4 flex justify-center items-start overflow-y-auto" style={{ paddingTop: '32px' }}>
      <div className="w-full max-w-2xl bg-[#0d1117] border border-red-900/40 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-900/40 bg-red-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-extrabold text-white tracking-wide">PLACE AIRCRAFT OUT OF SERVICE</p>
              <p className="text-xs text-gray-500 font-mono">{aircraft.tail_number} · {new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' })} UTC</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#0d1117]">
          <div className="flex items-center gap-4">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = s.step === step;
              const isComplete = s.step < step;
              return (
                <div key={s.step} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center transition-all font-bold text-sm',
                      isActive
                        ? 'bg-yellow-500 text-black'
                        : isComplete
                        ? 'bg-green-600 text-white'
                        : 'bg-white/10 text-gray-500'
                    )}
                  >
                    {isComplete ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <p className={cn('text-xs font-bold uppercase tracking-wider', isActive ? 'text-yellow-400' : 'text-gray-500')}>
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-380px)] overflow-y-auto">
          <p className="text-xs text-gray-400 italic">
            {step === 1 && 'Enter your credentials. This information will be logged in the FAA-compliant audit trail.'}
            {step === 2 && 'Describe the maintenance issue or discrepancy requiring out-of-service placement.'}
            {step === 3 && 'Specify the station where the aircraft is being placed OOS.'}
            {step === 4 && 'Indicate if this is a deferred maintenance item (MEL category or ETR).'}
            {step === 5 && 'Review all information before final submission.'}
          </p>

          {/* Step 1: Technician */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Technician Full Name *</label>
                <input
                  type="text"
                  value={form.tech_name}
                  onChange={(e) => set('tech_name', e.target.value)}
                  placeholder="e.g. John A. Smith"
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Employee / Certificate Number *</label>
                <input
                  type="text"
                  value={form.tech_cert}
                  onChange={(e) => set('tech_cert', e.target.value)}
                  placeholder="e.g. AMT-12345"
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Role / Position *</label>
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select Role...</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Discrepancy */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">ATA Chapter (Optional)</label>
                <input
                  type="text"
                  value={form.ata_chapter}
                  onChange={(e) => set('ata_chapter', e.target.value)}
                  placeholder="e.g. 21-31"
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Discrepancy Description *</label>
                <textarea
                  rows={5}
                  value={form.discrepancy_desc}
                  onChange={(e) => set('discrepancy_desc', e.target.value)}
                  placeholder="Describe the maintenance issue in detail..."
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Station *</label>
                <select
                  value={form.station}
                  onChange={(e) => set('station', e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select Station...</option>
                  {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300">The aircraft will be marked Out-of-Service at this location until corrective action is completed.</p>
              </div>
            </div>
          )}

          {/* Step 4: MEL / ETR */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  id="deferred"
                  checked={form.is_deferred}
                  onChange={(e) => set('is_deferred', e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <label htmlFor="deferred" className="text-sm font-semibold text-white cursor-pointer flex-1">
                  Defer maintenance (MEL/CDL item)
                </label>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">MEL Category</label>
                <select
                  value={form.mel_category}
                  onChange={(e) => set('mel_category', e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  {MEL_CATEGORIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {form.is_deferred && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">MEL Reference (Optional)</label>
                  <input
                    type="text"
                    value={form.mel_ref}
                    onChange={(e) => set('mel_ref', e.target.value)}
                    placeholder="e.g. MEL-21-12-00"
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-[#1a1f2e] p-5 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Aircraft</p>
                    <p className="text-base font-mono font-bold text-white">{aircraft.tail_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                    <p className="text-base font-bold text-white">{aircraft.aircraft_type}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Technician</p>
                    <p className="text-base font-bold text-white">{form.tech_name} ({form.tech_cert})</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discrepancy</p>
                    <p className="text-sm text-gray-200 line-clamp-2">{form.discrepancy_desc}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Station</p>
                    <p className="text-base font-mono font-bold text-white">{form.station}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">MEL Category</p>
                    <p className="text-base font-bold text-white">{form.mel_category}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-700/50 rounded-xl px-4 py-3 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-400 mb-1">14 CFR §43.9 — Permanent Record</p>
                  <p className="text-xs text-red-300">This entry will be permanently recorded in the aircraft maintenance timeline. Once submitted, it cannot be deleted.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0d1117] flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 text-white text-sm font-bold hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Cancel
          </button>

          <div className="flex items-center gap-1">
            {STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => s.step < step && setStep(s.step)}
                className={cn('w-2.5 h-2.5 rounded-full transition-all', s.step <= step ? 'bg-yellow-400' : 'bg-gray-600')}
              />
            ))}
          </div>

          {step === 5 ? (
            <button
              onClick={handleSubmit}
              disabled={isPending || !form.tech_name || !form.tech_cert || !form.role || !form.discrepancy_desc || !form.station}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Placing...' : 'Place OOS'} →
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}