import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Upload, CheckCircle, AlertTriangle, RefreshCw, Zap, Package,
  FileText, ChevronDown, ChevronUp, Clock, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SOURCES = [
  { key: 'amos',        name: 'AMOS MRO',              category: 'MRO System',    color: 'text-blue-400',    badge: 'bg-blue-500/20' },
  { key: 'trax',        name: 'TRAX MRO',              category: 'MRO System',    color: 'text-indigo-400',  badge: 'bg-indigo-500/20' },
  { key: 'sceptre',     name: 'SCEPTRE MRO',           category: 'MRO System',    color: 'text-violet-400',  badge: 'bg-violet-500/20' },
  { key: 'boeing_ahm',  name: 'Boeing AHM / AHN',      category: 'OEM',           color: 'text-cyan-400',    badge: 'bg-cyan-500/20' },
  { key: 'skywise',     name: 'Airbus Skywise',        category: 'OEM',           color: 'text-sky-400',     badge: 'bg-sky-500/20' },
  { key: 'embraer',     name: 'Embraer Service Portal',category: 'OEM',           color: 'text-teal-400',    badge: 'bg-teal-500/20' },
  { key: 'rolls_royce', name: 'Rolls-Royce FAST',      category: 'Engine',        color: 'text-orange-400',  badge: 'bg-orange-500/20' },
  { key: 'cfm_snecma',  name: 'CFM / Snecma',          category: 'Engine',        color: 'text-amber-400',   badge: 'bg-amber-500/20' },
  { key: 'honeywell',   name: 'Honeywell MPM',         category: 'Engine',        color: 'text-yellow-400',  badge: 'bg-yellow-500/20' },
  { key: 'mhi',         name: 'Mitsubishi MHI',        category: 'Engine',        color: 'text-rose-400',    badge: 'bg-rose-500/20' },
];

const DATA_TYPES = [
  { key: 'work_orders',    label: 'Work Orders' },
  { key: 'task_cards',     label: 'Task Cards' },
  { key: 'fault_codes',    label: 'Fault Codes / BITE' },
  { key: 'health',         label: 'Health / Telemetry' },
  { key: 'parts',          label: 'Parts / Inventory' },
  { key: 'airworthiness',  label: 'Airworthiness Items' },
];

const STATUS_CFG = {
  imported:   { color: 'text-green-400',  bg: 'bg-green-500/15',  icon: CheckCircle },
  processing: { color: 'text-amber-400',  bg: 'bg-amber-500/15',  icon: RefreshCw },
  error:      { color: 'text-red-400',    bg: 'bg-red-500/15',    icon: AlertTriangle },
  pending:    { color: 'text-gray-400',   bg: 'bg-gray-500/15',   icon: Clock },
};

const CATEGORIES = ['MRO System', 'OEM', 'Engine'];

function SourceCard({ source, onSelect, selected }) {
  return (
    <button onClick={() => onSelect(source.key)}
      className={cn(
        'flex flex-col items-start gap-1.5 px-4 py-3 rounded-xl border text-left transition-all',
        selected === source.key
          ? 'border-primary bg-primary/10'
          : 'border-white/10 bg-[#0d1117] hover:border-white/20'
      )}>
      <div className="flex items-center justify-between w-full">
        <p className="text-xs font-extrabold text-white leading-tight">{source.name}</p>
        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', source.badge, source.color)}>
          {source.category}
        </span>
      </div>
      {selected === source.key && (
        <p className="text-[10px] text-primary">Selected ✓</p>
      )}
    </button>
  );
}

export default function MROIntegrationHub() {
  const [selectedSource, setSelectedSource] = useState('');
  const [dataType, setDataType] = useState('work_orders');
  const [aircraftTail, setAircraftTail] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedImport, setExpandedImport] = useState(null);
  const fileRef = useRef();

  const { data: imports = [], refetch: refetchImports } = useQuery({
    queryKey: ['mro-imports'],
    queryFn: () => base44.entities.TelemetryImport.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const handleIngest = async () => {
    if (!selectedSource) return;
    setLoading(true);
    setResult(null);
    setError(null);

    let file_url = null;
    if (file) {
      const { file_url: url } = await base44.integrations.Core.UploadFile({ file });
      file_url = url;
    }

    const res = await base44.functions.invoke('mroIngestion', {
      source: selectedSource,
      data_type: dataType,
      aircraft_tail: aircraftTail || undefined,
      raw_data: file ? undefined : [],
      file_url: file_url || undefined,
      notes: notes || undefined,
    });

    setLoading(false);
    if (res.data?.success) {
      setResult(res.data);
      setFile(null);
      refetchImports();
    } else {
      setError(res.data?.error || 'Ingestion failed');
    }
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = SOURCES.filter(s => s.category === cat);
    return acc;
  }, {});

  const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-base font-extrabold text-white">MRO Ingestion Engine</p>
          <p className="text-xs text-gray-500">AMOS · TRAX · SCEPTRE · Boeing AHN · Airbus Skywise · RR · CFM · Honeywell · MHI · Embraer</p>
        </div>
      </div>

      {/* Source Selector */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, sources]) => (
          <div key={cat}>
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">{cat}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sources.map(s => <SourceCard key={s.key} source={s} selected={selectedSource} onSelect={setSelectedSource} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Config */}
      {selectedSource && (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">
            Ingestion Config — {SOURCES.find(s => s.key === selectedSource)?.name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Data Type</label>
              <select value={dataType} onChange={e => setDataType(e.target.value)} className={inputCls}>
                {DATA_TYPES.map(dt => <option key={dt.key} value={dt.key}>{dt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft Tail (optional)</label>
              <input value={aircraftTail} onChange={e => setAircraftTail(e.target.value.toUpperCase())} placeholder="e.g. N455GJ or FLEET" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Upload Export File (CSV / JSON / Excel)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                file ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/20'
              )}>
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-500" />
              {file ? (
                <p className="text-sm font-bold text-primary">{file.name}</p>
              ) : (
                <p className="text-sm text-gray-500">Drop or click to upload system export</p>
              )}
              <p className="text-[10px] text-gray-600 mt-1">CSV, JSON, XLSX accepted</p>
              <input ref={fileRef} type="file" className="hidden" accept=".csv,.json,.xlsx,.xls"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Monthly AMOS export — April 2026" className={inputCls} />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {result && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3 space-y-1">
              <p className="text-sm font-extrabold text-green-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {result.summary}</p>
              <div className="flex flex-wrap gap-3 text-[10px] text-green-300 mt-1">
                {result.faults_created > 0 && <span>⚡ {result.faults_created} fault messages created</span>}
                {result.logbook_entries_created > 0 && <span>📋 {result.logbook_entries_created} logbook entries created</span>}
                <span>Import ID: {result.import_id}</span>
              </div>
            </div>
          )}

          <button onClick={handleIngest} disabled={loading || (!file)}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Ingesting…' : 'Ingest Data'}
          </button>
          {!file && <p className="text-[10px] text-gray-600 text-center">Upload a file to enable ingestion</p>}
        </div>
      )}

      {/* Import History */}
      <div>
        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">Import History</p>
        {imports.length === 0 ? (
          <div className="bg-[#141922] border border-white/10 rounded-2xl px-5 py-10 text-center">
            <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No imports yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {imports.map(imp => {
              const summary = (() => { try { return JSON.parse(imp.raw_summary || '{}'); } catch { return {}; } })();
              const cfg = STATUS_CFG[imp.status] || STATUS_CFG.pending;
              const Icon = cfg.icon;
              const expanded = expandedImport === imp.id;
              return (
                <div key={imp.id} className={cn('border rounded-xl overflow-hidden', cfg.bg, 'border-white/10')}>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => setExpandedImport(expanded ? null : imp.id)}>
                    <Icon className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{imp.oem_name} — {imp.data_type?.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-gray-500">{imp.aircraft_tail} · {imp.record_count} records · {new Date(imp.created_date).toLocaleString()}</p>
                    </div>
                    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', cfg.color)}>{imp.status?.toUpperCase()}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                  </button>
                  {expanded && summary && (
                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                      <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                        <span>Source: <span className="text-white font-bold">{summary.source_name || imp.oem_name}</span></span>
                        <span>Category: <span className="text-white font-bold">{summary.category}</span></span>
                        <span>Records: <span className="text-white font-bold">{imp.record_count}</span></span>
                        {summary.notes && <span>Notes: <span className="text-white">{summary.notes}</span></span>}
                      </div>
                      {summary.sample?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Sample Records</p>
                          <pre className="text-[10px] text-gray-400 bg-[#0d1117] rounded-lg p-3 overflow-x-auto max-h-40 overflow-y-auto">
                            {JSON.stringify(summary.sample, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}