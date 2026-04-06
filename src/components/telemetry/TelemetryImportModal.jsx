import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Upload, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const OEM_OPTIONS = [
  { id: 'boeing_ahm',          name: 'Boeing AHM' },
  { id: 'airbus_skywise',      name: 'Airbus Skywise' },
  { id: 'ge_aviation',         name: 'GE Aviation / Flight Pulse' },
  { id: 'honeywell_forge',     name: 'Honeywell Forge / GoDirect' },
  { id: 'cfm_snecma',          name: 'CFM International / Safran' },
  { id: 'pratt_whitney',       name: 'Pratt & Whitney e-Service' },
  { id: 'rolls_royce',         name: 'Rolls-Royce Blue Data Thread' },
  { id: 'embraer_ahead',       name: 'Embraer AHEAD' },
  { id: 'mitsubishi_aircraft', name: 'Mitsubishi Aircraft' },
  { id: 'bombardier_smartlink',name: 'Bombardier Smart Link+' },
  { id: 'custom',              name: 'Custom / Other' },
];

const DATA_TYPES = [
  { id: 'flight_hours',  label: 'Flight Hours & Cycles' },
  { id: 'engine_health', label: 'Engine Health / EGT Margin' },
  { id: 'apu_health',    label: 'APU Health & Hours' },
  { id: 'fault_codes',   label: 'Fault Codes / EICAS' },
  { id: 'vibration',     label: 'Engine Vibration' },
  { id: 'egt_margin',    label: 'EGT Margin Trend' },
  { id: 'fuel_burn',     label: 'Fuel Burn Data' },
  { id: 'structural',    label: 'Structural / Fatigue' },
  { id: 'avionics',      label: 'Avionics / LRU Data' },
];

const inputCls = "w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";

export default function TelemetryImportModal({ aircraft, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=config, 2=upload, 3=result
  const [form, setForm] = useState({
    oem_id: '', oem_name: '', aircraft_tail: '', data_type: '',
    period_start: '', period_end: '', notes: '',
  });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const uploadAndProcess = async () => {
    if (!file) return;
    setStep(3);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create import record
      const createRes = await base44.functions.invoke('telemetryImport', {
        action: 'create_import',
        oem_id: form.oem_id,
        oem_name: OEM_OPTIONS.find(o => o.id === form.oem_id)?.name || form.oem_id,
        aircraft_tail: form.aircraft_tail,
        data_type: form.data_type,
        file_url,
        file_name: file.name,
        period_start: form.period_start,
        period_end: form.period_end,
        notes: form.notes,
      });

      // Process the import
      const processRes = await base44.functions.invoke('telemetryImport', {
        action: 'process_import',
        import_id: createRes.data.import_id,
      });

      setResult({ success: true, ...processRes.data });
      onSuccess?.();
    } catch (e) {
      setResult({ success: false, error: e.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#141922]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-white tracking-wide">IMPORT OEM TELEMETRY DATA</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 border-b border-white/10">
          {['Configure', 'Upload File', 'Processing'].map((label, i) => (
            <div key={label} className={cn('flex-1 text-center py-2.5 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-all',
              step === i + 1 ? 'border-primary text-primary' : step > i + 1 ? 'border-green-500 text-green-400' : 'border-transparent text-gray-600')}>
              {step > i + 1 ? '✓ ' : ''}{label}
            </div>
          ))}
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">

          {/* Step 1: Configure */}
          {step === 1 && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">OEM / Data Source *</label>
                <select value={form.oem_id} onChange={e => set('oem_id', e.target.value)} className={inputCls}>
                  <option value="">Select OEM…</option>
                  {OEM_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Data Type *</label>
                <select value={form.data_type} onChange={e => set('data_type', e.target.value)} className={inputCls}>
                  <option value="">Select data type…</option>
                  {DATA_TYPES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Aircraft Tail</label>
                {aircraft.length > 0 ? (
                  <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} className={inputCls}>
                    <option value="">All / Fleet-wide</option>
                    {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>)}
                  </select>
                ) : (
                  <input value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value.toUpperCase())} placeholder="e.g. N455GJ or leave blank for fleet-wide" className={inputCls} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Period Start</label>
                  <input type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Period End</label>
                  <input type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Notes</label>
                <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Export source, version, remarks…" className={inputCls} />
              </div>
              <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-blue-400 mb-1">Supported Formats</p>
                <p className="text-[10px] text-blue-300">CSV, JSON — exported directly from OEM portal dashboards. Standard column header formats are auto-detected per OEM.</p>
              </div>
            </>
          )}

          {/* Step 2: Upload */}
          {step === 2 && (
            <>
              <div
                className={cn('border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer', file ? 'border-green-500/40 bg-green-900/10' : 'border-white/15 hover:border-white/30')}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onClick={() => document.getElementById('telemetry-file-input').click()}
              >
                <input id="telemetry-file-input" type="file" accept=".csv,.json,.xlsx,.xls" className="hidden"
                  onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
                {file ? (
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 text-green-400 mx-auto" />
                    <p className="text-sm font-extrabold text-white">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-gray-600 mx-auto" />
                    <p className="text-sm font-bold text-gray-400">Drag & drop or click to select file</p>
                    <p className="text-xs text-gray-600">CSV, JSON, XLSX supported</p>
                  </div>
                )}
              </div>

              <div className="bg-[#141922] rounded-xl px-4 py-3 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Import Summary</p>
                <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                  <span className="text-gray-500">OEM:</span><span className="text-white">{OEM_OPTIONS.find(o => o.id === form.oem_id)?.name}</span>
                  <span className="text-gray-500">Data Type:</span><span className="text-white">{DATA_TYPES.find(d => d.id === form.data_type)?.label}</span>
                  <span className="text-gray-500">Aircraft:</span><span className="text-white">{form.aircraft_tail || 'Fleet-wide'}</span>
                  {form.period_start && <><span className="text-gray-500">Period:</span><span className="text-white">{form.period_start} → {form.period_end || 'now'}</span></>}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Processing / Result */}
          {step === 3 && (
            <div className="py-6 text-center space-y-4">
              {!result ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                  <p className="text-white font-extrabold">Processing telemetry data…</p>
                  <p className="text-gray-500 text-sm">Uploading file, parsing rows, normalizing fields</p>
                </>
              ) : result.success ? (
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                  <p className="text-white font-extrabold">Import Successful</p>
                  <p className="text-green-400 text-sm">{result.record_count} records imported</p>
                  {result.summary && (
                    <div className="bg-[#141922] rounded-xl px-4 py-3 text-left space-y-1">
                      {result.summary.max_flight_hours && (
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Max Flight Hours:</span><span className="text-white font-mono">{result.summary.max_flight_hours?.toLocaleString()}</span></div>
                      )}
                      {result.summary.max_cycles && (
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Max Cycles:</span><span className="text-white font-mono">{result.summary.max_cycles?.toLocaleString()}</span></div>
                      )}
                      {result.summary.avg_egt_margin && (
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Avg EGT Margin:</span><span className="text-white font-mono">{result.summary.avg_egt_margin}°C</span></div>
                      )}
                      {result.summary.min_egt_margin != null && (
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Min EGT Margin:</span><span className={cn('font-mono font-bold', result.summary.min_egt_margin < 20 ? 'text-red-400' : 'text-white')}>{result.summary.min_egt_margin}°C</span></div>
                      )}
                      {result.summary.top_fault_codes && (
                        <div className="text-xs text-gray-500 mt-1">Top faults: {result.summary.top_fault_codes.map(f => `${f.code}(${f.count})`).join(', ')}</div>
                      )}
                    </div>
                  )}
                  {result.forecastUpdates?.length > 0 && (
                    <div className="bg-green-900/20 border border-green-500/20 rounded-xl px-3 py-2 text-xs text-green-400">
                      {result.forecastUpdates.join(' · ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                  <p className="text-red-400 font-extrabold">Import Failed</p>
                  <p className="text-gray-400 text-sm">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
          {step === 3 ? (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Done</button>
          ) : (
            <>
              <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step === 1 && (
                <button onClick={() => setStep(2)} disabled={!form.oem_id || !form.data_type}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40">
                  Next →
                </button>
              )}
              {step === 2 && (
                <button onClick={uploadAndProcess} disabled={!file}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40">
                  Import Data
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}