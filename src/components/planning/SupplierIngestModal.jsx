import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUPPLIERS = [
  { id: 'TRAX', label: 'TRAX MRO System', desc: 'Boeing/Airbus maintenance planning' },
  { id: 'AMOS', label: 'AMOS by Lufthansa', desc: 'Aircraft maintenance tracking' },
  { id: 'SCEPTRE', label: 'SCEPTRE System', desc: 'Hawker de Havilland planning' },
  { id: 'AHEAD', label: 'AHEAD (Embraer)', desc: 'Embraer health monitoring' },
  { id: 'AHM', label: 'AHM (Boeing)', desc: 'Boeing health & usage monitoring' },
];

export default function SupplierIngestModal({ aircraft = [], onClose, onSuccess }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [supplier, setSupplier] = useState('');
  const [aircraft_tail, setAircraftTail] = useState('');
  const [check_type, setCheckType] = useState('A');
  const [scheduled_date, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawJson, setRawJson] = useState('');
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('ingestSupplierWorkPackage', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['planning-workpackages'] });
      setStep(3);
      onSuccess?.(res.data);
    },
    onError: (err) => {
      setError(err?.message || 'Failed to ingest work package');
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (!supplier || !aircraft_tail || !check_type || !scheduled_date || !rawJson) {
      setError('Please fill all fields');
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      mutation.mutate({
        supplier_system: supplier,
        aircraft_tail,
        check_type,
        scheduled_date,
        raw_data: parsed,
      });
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 p-4 flex justify-center items-start overflow-y-auto pt-[40px]">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141922]">
          <div>
            <p className="text-base font-extrabold text-white tracking-wide">Ingest Work Package</p>
            <p className="text-xs text-gray-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center px-6 py-3 bg-[#0d1117] border-b border-white/10 gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn('h-1.5 flex-1 rounded-full', s <= step ? 'bg-primary' : 'bg-white/10')} />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Select the supplier system providing the work package data.</p>
              <div className="grid grid-cols-2 gap-2">
                {SUPPLIERS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSupplier(s.id); setStep(2); }}
                    className={cn(
                      'border rounded-lg px-4 py-3 text-left transition-all',
                      supplier === s.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'
                    )}
                  >
                    <p className="text-xs font-bold text-white">{s.label}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 italic">Configure the work package details and paste the JSON export from {supplier}.</p>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Aircraft Tail *</label>
                <select value={aircraft_tail} onChange={e => setAircraftTail(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary">
                  <option value="">Select aircraft...</option>
                  {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Check Type *</label>
                  <select value={check_type} onChange={e => setCheckType(e.target.value)}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary">
                    <option value="A">A-Check</option>
                    <option value="C">C-Check</option>
                    <option value="D">D-Check</option>
                    <option value="overnight">Overnight</option>
                    <option value="ETOPS">ETOPS Prep</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Scheduled Date *</label>
                  <input type="date" value={scheduled_date} onChange={e => setScheduledDate(e.target.value)}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{supplier} JSON Export *</label>
                <textarea value={rawJson} onChange={e => setRawJson(e.target.value)} rows={8}
                  placeholder={`Paste JSON from ${supplier}...\n\nExpected format:\n{\n  "work_items": [...],\n  "parts": [...],\n  "reference_id": "..."\n}`}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary font-mono resize-none" />
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white">Work Package Ingested</p>
                <p className="text-xs text-gray-400 mt-2">{aircraft_tail} {check_type}-Check scheduled for {scheduled_date}</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg px-4 py-3 text-xs text-blue-300">
                Tasks and parts have been parsed and loaded into the planning system.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0d1117] flex gap-3 justify-end">
          {step < 3 && (
            <>
              <button onClick={() => step === 2 ? setStep(1) : onClose()}
                className="px-6 py-2 rounded-lg border border-white/15 text-sm font-bold text-gray-400 hover:bg-white/5">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step === 2 && (
                <button onClick={handleSubmit} disabled={mutation.isPending}
                  className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Ingest Package
                </button>
              )}
            </>
          )}
          {step === 3 && (
            <button onClick={onClose} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}