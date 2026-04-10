import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Upload, CheckCircle, AlertTriangle, RefreshCw, Zap, Package,
  ChevronDown, ChevronUp, Clock, Database, Key, Save, Eye, EyeOff, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SOURCES = [
  { key: 'amos',        oem_id: 'amos',           name: 'AMOS MRO',               category: 'MRO System', color: 'text-blue-400',   badge: 'bg-blue-500/20' },
  { key: 'trax',        oem_id: 'trax',           name: 'TRAX MRO',               category: 'MRO System', color: 'text-indigo-400', badge: 'bg-indigo-500/20' },
  { key: 'sceptre',     oem_id: 'sceptre',        name: 'SCEPTRE MRO',            category: 'MRO System', color: 'text-violet-400', badge: 'bg-violet-500/20' },
  { key: 'boeing_ahm',  oem_id: 'boeing_ahm',     name: 'Boeing AHM / AHN',       category: 'OEM',        color: 'text-cyan-400',   badge: 'bg-cyan-500/20' },
  { key: 'skywise',     oem_id: 'airbus_skywise',  name: 'Airbus Skywise',         category: 'OEM',        color: 'text-sky-400',    badge: 'bg-sky-500/20' },
  { key: 'embraer',     oem_id: 'embraer',         name: 'Embraer Service Portal', category: 'OEM',        color: 'text-teal-400',   badge: 'bg-teal-500/20' },
  { key: 'rolls_royce', oem_id: 'rolls_royce',     name: 'Rolls-Royce FAST',       category: 'Engine',     color: 'text-orange-400', badge: 'bg-orange-500/20' },
  { key: 'cfm_snecma',  oem_id: 'cfm_snecma',      name: 'CFM / Snecma',           category: 'Engine',     color: 'text-amber-400',  badge: 'bg-amber-500/20' },
  { key: 'honeywell',   oem_id: 'honeywell',       name: 'Honeywell MPM',          category: 'Engine',     color: 'text-yellow-400', badge: 'bg-yellow-500/20' },
  { key: 'mhi',         oem_id: 'mhi',             name: 'Mitsubishi MHI',         category: 'Engine',     color: 'text-rose-400',   badge: 'bg-rose-500/20' },
];

const DATA_TYPES = [
  { key: 'work_orders',   label: 'Work Orders' },
  { key: 'task_cards',    label: 'Task Cards' },
  { key: 'fault_codes',   label: 'Fault Codes / BITE' },
  { key: 'health',        label: 'Health / Telemetry' },
  { key: 'parts',         label: 'Parts / Inventory' },
  { key: 'airworthiness', label: 'Airworthiness Items' },
];

const STATUS_CFG = {
  active:            { color: 'text-green-400',  bg: 'bg-green-500/15',  Icon: Wifi },
  pending_credentials:{ color: 'text-amber-400', bg: 'bg-amber-500/15',  Icon: Key },
  pending_contract:  { color: 'text-gray-400',   bg: 'bg-gray-500/15',   Icon: Clock },
  inactive:          { color: 'text-gray-500',   bg: 'bg-gray-500/10',   Icon: WifiOff },
  error:             { color: 'text-red-400',    bg: 'bg-red-500/15',    Icon: AlertTriangle },
  imported:          { color: 'text-green-400',  bg: 'bg-green-500/15',  Icon: CheckCircle },
};

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';
const CATEGORIES = ['MRO System', 'OEM', 'Engine'];

// ── Per-system credential editor ─────────────────────────────────────────────
function CredentialCard({ source, integration, onSave, saving }) {
  const [apiKey, setApiKey] = useState(integration?.api_key_ref || '');
  const [baseUrl, setBaseUrl] = useState(integration?.base_url || '');
  const [showKey, setShowKey] = useState(false);
  const dirty = apiKey !== (integration?.api_key_ref || '') || baseUrl !== (integration?.base_url || '');
  const cfg = STATUS_CFG[integration?.status || 'pending_credentials'] || STATUS_CFG.pending_credentials;
  const Icon = cfg.Icon;

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', cfg.color)} />
          <p className="text-sm font-bold text-white">{source.name}</p>
          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', source.badge, source.color)}>{source.category}</span>
        </div>
        <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', cfg.color, cfg.bg)}>
          {(integration?.status || 'NOT CONFIGURED').replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">API Key / Token</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Paste your API key or token…"
              className={inputCls + ' pr-10'}
            />
            <button onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Base URL (optional)</label>
          <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://api.yourprovider.com/v1"
            className={inputCls} />
        </div>
      </div>

      <button
        onClick={() => onSave(source, apiKey, baseUrl)}
        disabled={!dirty || saving}
        className="w-full py-2 rounded-xl bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-extrabold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? 'Saving…' : 'Save Credentials'}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MROIntegrationHub() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('credentials'); // 'credentials' | 'ingest'
  const [selectedSource, setSelectedSource] = useState('');
  const [dataType, setDataType] = useState('work_orders');
  const [aircraftTail, setAircraftTail] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [expandedImport, setExpandedImport] = useState(null);
  const fileRef = useRef();

  const { data: integrations = [] } = useQuery({
    queryKey: ['oem-integrations'],
    queryFn: () => base44.entities.OEMIntegration.list('oem_id', 100),
  });

  const { data: imports = [], refetch: refetchImports } = useQuery({
    queryKey: ['mro-imports'],
    queryFn: () => base44.entities.TelemetryImport.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ source, apiKey, baseUrl }) => {
      const existing = integrations.find(i => i.oem_id === source.oem_id);
      const data = {
        oem_id:      source.oem_id,
        name:        source.name,
        category:    source.category === 'Engine' ? 'engine' : source.category === 'MRO System' ? 'systems' : 'airframe',
        api_key_ref: apiKey,
        base_url:    baseUrl || null,
        status:      apiKey ? 'active' : 'pending_credentials',
      };
      if (existing) {
        return base44.entities.OEMIntegration.update(existing.id, data);
      } else {
        return base44.entities.OEMIntegration.create(data);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oem-integrations'] }),
  });

  const handleSaveKey = async (source, apiKey, baseUrl) => {
    setSavingKey(source.key);
    await upsertMutation.mutateAsync({ source, apiKey, baseUrl });
    setSavingKey(null);
  };

  const handleIngest = async () => {
    if (!selectedSource) return;
    setLoading(true); setResult(null); setError(null);
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
    if (res.data?.success) { setResult(res.data); setFile(null); refetchImports(); }
    else setError(res.data?.error || 'Ingestion failed');
  };

  const integrationByOemId = integrations.reduce((acc, i) => { acc[i.oem_id] = i; return acc; }, {});
  const grouped = CATEGORIES.reduce((acc, cat) => { acc[cat] = SOURCES.filter(s => s.category === cat); return acc; }, {});
  const connectedCount = SOURCES.filter(s => integrationByOemId[s.oem_id]?.status === 'active').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-extrabold text-white">MRO Integration Engine</p>
            <p className="text-xs text-gray-500">AMOS · TRAX · SCEPTRE · Boeing AHN · Skywise · RR · CFM · Honeywell · MHI · Embraer</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-green-400">{connectedCount}</p>
          <p className="text-[10px] text-gray-500">of {SOURCES.length} connected</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {[
          { id: 'credentials', label: '🔑 API Credentials' },
          { id: 'ingest',      label: '⬆ Ingest Data' },
          { id: 'history',     label: '📋 Import History' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2.5 text-xs font-extrabold rounded-t-lg transition-all -mb-px',
              tab === t.id ? 'bg-[#141922] border border-b-0 border-white/10 text-primary' : 'text-gray-500 hover:text-white')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CREDENTIALS TAB ── */}
      {tab === 'credentials' && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, sources]) => (
            <div key={cat}>
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">{cat}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.map(s => (
                  <CredentialCard
                    key={s.key}
                    source={s}
                    integration={integrationByOemId[s.oem_id]}
                    onSave={handleSaveKey}
                    saving={savingKey === s.key}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── INGEST TAB ── */}
      {tab === 'ingest' && (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Ingest Data from System Export</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Source System</label>
              <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className={inputCls}>
                <option value="">Select system…</option>
                {SOURCES.map(s => {
                  const connected = integrationByOemId[s.oem_id]?.status === 'active';
                  return <option key={s.key} value={s.key}>{s.name}{connected ? ' ✓' : ''}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Data Type</label>
              <select value={dataType} onChange={e => setDataType(e.target.value)} className={inputCls}>
                {DATA_TYPES.map(dt => <option key={dt.key} value={dt.key}>{dt.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft Tail (optional)</label>
            <input value={aircraftTail} onChange={e => setAircraftTail(e.target.value.toUpperCase())} placeholder="e.g. N455GJ or leave blank for fleet-wide" className={inputCls} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Upload Export File (CSV / JSON / Excel)</label>
            <div onClick={() => fileRef.current?.click()}
              className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                file ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/20')}>
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-500" />
              {file ? <p className="text-sm font-bold text-primary">{file.name}</p>
                    : <p className="text-sm text-gray-500">Drop or click to upload system export</p>}
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
                {result.faults_created > 0 && <span>⚡ {result.faults_created} fault messages</span>}
                {result.logbook_entries_created > 0 && <span>📋 {result.logbook_entries_created} logbook entries</span>}
              </div>
            </div>
          )}

          <button onClick={handleIngest} disabled={loading || !selectedSource || !file}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Ingesting…' : 'Ingest Data'}
          </button>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="space-y-2">
          {imports.length === 0 ? (
            <div className="bg-[#141922] border border-white/10 rounded-2xl px-5 py-10 text-center">
              <Package className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No imports yet</p>
            </div>
          ) : imports.map(imp => {
            const summary = (() => { try { return JSON.parse(imp.raw_summary || '{}'); } catch { return {}; } })();
            const cfg = STATUS_CFG[imp.status] || STATUS_CFG.pending_credentials;
            const Icon = cfg.Icon;
            const expanded = expandedImport === imp.id;
            return (
              <div key={imp.id} className={cn('border rounded-xl overflow-hidden border-white/10', cfg.bg)}>
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
                {expanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                      <span>Source: <span className="text-white font-bold">{summary.source_name || imp.oem_name}</span></span>
                      <span>Records: <span className="text-white font-bold">{imp.record_count}</span></span>
                      {summary.notes && <span>Notes: <span className="text-white">{summary.notes}</span></span>}
                    </div>
                    {summary.sample?.length > 0 && (
                      <pre className="text-[10px] text-gray-400 bg-[#0d1117] rounded-lg p-3 overflow-x-auto max-h-40 overflow-y-auto">
                        {JSON.stringify(summary.sample, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}