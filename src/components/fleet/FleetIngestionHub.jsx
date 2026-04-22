import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  X, Plane, Plus, Upload, FileText, ClipboardList,
  CheckCircle, AlertTriangle, Loader2, Download, ChevronRight
} from 'lucide-react';
import AddAircraftWizard from './AddAircraftWizard';

// ── CSV Template ──────────────────────────────────────────────────────────────
const CSV_HEADERS = [
  'tail_number', 'aircraft_type', 'airline', 'msn', 'base_station',
  'engine_type', 'delivery_date', 'status', 'cabin_config_ref',
  'etops_approval', 'cat_approval', 'rnp_capability', 'notes'
];

const CSV_EXAMPLE = [
  'N12345', 'B737-800', 'United Airlines', '43210', 'KEWR',
  'CFM56-7B27', '2019-06-15', 'active', '16F/144Y',
  '120', 'CAT IIIa', 'RNP 0.3', 'Example aircraft'
];

const AIRCRAFT_TYPES = [
  'B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9',
  'B757','B767','B777','B787','A320','A321','A350','E190','E175','CRJ700','CRJ900'
];

function downloadTemplate() {
  const rows = [CSV_HEADERS.join(','), CSV_EXAMPLE.join(',')];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aerodyne_fleet_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { if (vals[i] !== undefined) obj[h] = vals[i]; });
    return obj;
  });
}

function normalizeRow(row) {
  return {
    tail_number: (row.tail_number || row.registration || row.tail || '').toUpperCase().trim(),
    aircraft_type: row.aircraft_type || row.type || '',
    airline: row.airline || row.operator || row.carrier || '',
    msn: row.msn || row.serial_number || '',
    base_station: (row.base_station || row.base || row.hub || '').toUpperCase().trim(),
    engine_type: row.engine_type || row.engine || '',
    delivery_date: row.delivery_date || row.delivered || '',
    status: row.status || 'active',
    cabin_config_ref: row.cabin_config_ref || row.cabin || '',
    etops_approval: Number(row.etops_approval || 0),
    cat_approval: row.cat_approval || 'CAT I',
    rnp_capability: row.rnp_capability || 'RNP 0.3',
    notes: row.notes || '',
  };
}

// ── Import Preview Table ──────────────────────────────────────────────────────
function ImportPreview({ rows, errors, onConfirm, onBack, isSaving }) {
  const valid = rows.filter((_, i) => !errors[i]);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">
          Import Preview — {rows.length} aircraft
        </p>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-500/20 text-green-400">{valid.length} valid</span>
          {hasErrors && <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/20 text-red-400">{Object.keys(errors).length} errors</span>}
        </div>
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-xs">
            <thead className="bg-[#1a1f2e]">
              <tr>
                {['#', 'Tail', 'Type', 'Airline', 'Base', 'Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r, i) => {
                const err = errors[i];
                return (
                  <tr key={i} className={cn('transition-colors', err ? 'bg-red-950/30' : 'bg-[#141922] hover:bg-[#1a1f2e]')}>
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-primary">{r.tail_number || <span className="text-red-400">MISSING</span>}</td>
                    <td className="px-3 py-2 text-gray-300">{r.aircraft_type || <span className="text-red-400">MISSING</span>}</td>
                    <td className="px-3 py-2 text-gray-400 max-w-[120px] truncate">{r.airline || '—'}</td>
                    <td className="px-3 py-2 text-gray-400 font-mono">{r.base_station || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={cn('px-2 py-0.5 rounded font-bold uppercase text-[9px]',
                        r.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        r.status === 'oos' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      )}>{r.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasErrors && (
        <div className="rounded-xl bg-red-900/20 border border-red-500/30 px-4 py-3 space-y-1">
          <p className="text-xs font-bold text-red-400">Validation errors (rows will be skipped):</p>
          {Object.entries(errors).map(([i, msg]) => (
            <p key={i} className="text-[10px] text-red-300">Row {Number(i) + 2}: {msg}</p>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">
          Back
        </button>
        <button
          onClick={() => onConfirm(valid)}
          disabled={isSaving || valid.length === 0}
          className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-extrabold hover:bg-green-500 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {isSaving ? 'Importing…' : `Import ${valid.length} Aircraft`}
        </button>
      </div>
    </div>
  );
}

// ── CSV / File Import ─────────────────────────────────────────────────────────
function CSVImport({ onClose, onImported }) {
  const [stage, setStage] = useState('upload'); // upload | preview | done
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: (records) => base44.entities.Aircraft.bulkCreate(records),
    onSuccess: (data) => {
      setResult(data);
      setStage('done');
      queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
    },
  });

  const processText = (text) => {
    const parsed = parseCSV(text);
    const normalized = parsed.map(normalizeRow);
    const errs = {};
    normalized.forEach((r, i) => {
      if (!r.tail_number) errs[i] = 'Missing tail number';
      else if (!r.aircraft_type) errs[i] = 'Missing aircraft type';
      else if (!AIRCRAFT_TYPES.includes(r.aircraft_type)) errs[i] = `Unknown type "${r.aircraft_type}"`;
    });
    setRows(normalized);
    setErrors(errs);
    setStage('preview');
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    processText(text);
  };

  if (stage === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400" />
        <p className="text-xl font-extrabold text-white">Import Complete</p>
        <p className="text-sm text-gray-400">{rows.filter((_, i) => !errors[i]).length} aircraft added to fleet.</p>
        <button onClick={onImported} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90">
          View Fleet
        </button>
      </div>
    );
  }

  if (stage === 'preview') {
    return (
      <ImportPreview
        rows={rows}
        errors={errors}
        onConfirm={(valid) => bulkMutation.mutate(valid)}
        onBack={() => setStage('upload')}
        isSaving={bulkMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">Upload Fleet File</p>
        <button onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold text-gray-300 hover:bg-white/20 transition-colors">
          <Download className="w-3.5 h-3.5" /> Download Template
        </button>
      </div>

      <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-2xl px-6 py-10 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
        <Upload className="w-10 h-10 text-gray-500" />
        <div className="text-center">
          <p className="text-sm font-bold text-white">Click to upload or drag & drop</p>
          <p className="text-xs text-gray-500 mt-1">CSV or Excel (.csv, .xlsx) · Max 10MB</p>
        </div>
        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
      </label>

      <div className="rounded-xl bg-[#141922] border border-white/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Required Columns</p>
        <div className="flex flex-wrap gap-1.5">
          {['tail_number', 'aircraft_type'].map(c => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold">{c}</span>
          ))}
          {['airline', 'base_station', 'engine_type', 'delivery_date', 'status', 'msn', 'etops_approval', 'cat_approval', 'notes'].map(c => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-400 font-mono">{c}</span>
          ))}
        </div>
        <p className="text-[10px] text-gray-600">Red = required · Gray = optional</p>
      </div>

      <p className="text-[10px] text-gray-600 text-center">
        Valid aircraft_type values: {AIRCRAFT_TYPES.join(', ')}
      </p>
    </div>
  );
}

// ── Paste / JSON Import ───────────────────────────────────────────────────────
function PasteImport({ onClose, onImported }) {
  const [text, setText] = useState('');
  const [stage, setStage] = useState('paste');
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: (records) => base44.entities.Aircraft.bulkCreate(records),
    onSuccess: () => {
      setStage('done');
      queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
    },
  });

  const handleParse = () => {
    let parsed = [];
    const trimmed = text.trim();
    // Try JSON first
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const arr = JSON.parse(trimmed.startsWith('{') ? `[${trimmed}]` : trimmed);
      parsed = arr.map(normalizeRow);
    } else {
      parsed = parseCSV(trimmed).map(normalizeRow);
    }
    const errs = {};
    parsed.forEach((r, i) => {
      if (!r.tail_number) errs[i] = 'Missing tail number';
      else if (!r.aircraft_type) errs[i] = 'Missing aircraft type';
    });
    setRows(parsed);
    setErrors(errs);
    setStage('preview');
  };

  if (stage === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400" />
        <p className="text-xl font-extrabold text-white">Import Complete</p>
        <p className="text-sm text-gray-400">{rows.filter((_, i) => !errors[i]).length} aircraft added.</p>
        <button onClick={onImported} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold">View Fleet</button>
      </div>
    );
  }

  if (stage === 'preview') {
    return (
      <ImportPreview
        rows={rows}
        errors={errors}
        onConfirm={(valid) => bulkMutation.mutate(valid)}
        onBack={() => setStage('paste')}
        isSaving={bulkMutation.isPending}
      />
    );
  }

  const placeholder = `Paste CSV rows or JSON array. Examples:

CSV:
N12345,B737-800,United Airlines,KEWR,active
N67890,A320,Delta Air Lines,KATL,active

JSON:
[
  {"tail_number":"N12345","aircraft_type":"B737-800","airline":"United Airlines","base_station":"KEWR"},
  {"tail_number":"N67890","aircraft_type":"A320","airline":"Delta","base_station":"KATL"}
]`;

  return (
    <div className="space-y-4">
      <p className="text-sm font-extrabold text-white">Paste Fleet Data</p>
      <p className="text-xs text-gray-500">Accepts CSV rows or JSON array. First CSV row can be a header.</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        rows={10}
        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 font-mono outline-none focus:border-primary transition-colors resize-none"
      />
      <button
        onClick={handleParse}
        disabled={!text.trim()}
        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <ChevronRight className="w-4 h-4" /> Parse & Preview
      </button>
    </div>
  );
}

// ── Main Hub ──────────────────────────────────────────────────────────────────
export default function FleetIngestionHub({ onClose, onSuccess }) {
  const [mode, setMode] = useState(null); // null | 'manual' | 'csv' | 'paste'

  if (mode === 'manual') {
    return <AddAircraftWizard onClose={onClose} onSuccess={onSuccess} />;
  }

  const handleImported = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex justify-center p-4 overflow-y-auto pt-[80px]">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-fit">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141922]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white tracking-wide">FLEET INGESTION HUB</p>
              <p className="text-xs text-gray-500">Add one aircraft or import your entire fleet</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6">
          {!mode && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 text-center mb-6">Choose how you'd like to add aircraft to the fleet registry.</p>

              <div className="grid grid-cols-1 gap-3">
                {/* Manual entry */}
                <button
                  onClick={() => setMode('manual')}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-[#141922] border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-white">Manual Entry</p>
                    <p className="text-xs text-gray-500 mt-0.5">Step-by-step wizard. Enter one aircraft with full capability profile, approvals, and configuration.</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                </button>

                {/* CSV / Excel */}
                <button
                  onClick={() => setMode('csv')}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-[#141922] border border-white/10 hover:border-green-500/50 hover:bg-green-500/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                    <Upload className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-white">CSV / Excel Import</p>
                    <p className="text-xs text-gray-500 mt-0.5">Upload a spreadsheet with your entire fleet. Download our template to get started. Ideal for bulk onboarding.</p>
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">.CSV</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">.XLSX</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-400">Template included</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors" />
                </button>

                {/* Paste / JSON */}
                <button
                  onClick={() => setMode('paste')}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-[#141922] border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                    <ClipboardList className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-white">Paste / JSON Import</p>
                    <p className="text-xs text-gray-500 mt-0.5">Paste raw CSV rows or a JSON array directly. Great for exporting from TRAX, AMOS, or any MRO system.</p>
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">CSV</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">JSON</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-gray-400">TRAX · AMOS · SCEPTRE</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {mode === 'csv' && (
            <div>
              <button onClick={() => setMode(null)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white mb-4 transition-colors">
                ← Back to options
              </button>
              <CSVImport onClose={onClose} onImported={handleImported} />
            </div>
          )}

          {mode === 'paste' && (
            <div>
              <button onClick={() => setMode(null)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white mb-4 transition-colors">
                ← Back to options
              </button>
              <PasteImport onClose={onClose} onImported={handleImported} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}