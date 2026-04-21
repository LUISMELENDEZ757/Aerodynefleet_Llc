import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Cpu, ChevronLeft, Download, RefreshCw, CheckCircle, AlertTriangle,
  Clock, Wifi, Radio, Navigation, Database, HardDrive, Activity,
  ChevronDown, FileDown, Plane, Layers, Shield, Upload, X, Plus,
  Zap, Info, ExternalLink, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NavUploadScheduleTab from '@/components/avionics/NavUploadScheduleTab';

// ── Constants ─────────────────────────────────────────────────────────────────
const AIRCRAFT_TYPES = ['All Types', 'B737-700', 'B737-800', 'B737-900', 'B737 MAX 8', 'B737 MAX 9', 'B757', 'B767', 'B777', 'B787', 'A320', 'A321', 'A350', 'E190', 'CRJ900'];

const DATA_SOURCES = [
  { id: 'boeing_ahm',       label: 'Boeing AHM',          mfr: 'Boeing',      color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  { id: 'airbus_skywise',   label: 'Airbus Skywise',       mfr: 'Airbus',      color: 'text-red-400',    bg: 'bg-red-500/15' },
  { id: 'embraer_ahead',    label: 'Embraer AHEAD',        mfr: 'Embraer',     color: 'text-green-400',  bg: 'bg-green-500/15' },
  { id: 'bombardier_fast',  label: 'Bombardier FAST',      mfr: 'Bombardier',  color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { id: 'generic',          label: 'Generic / Manual',     mfr: 'Any',         color: 'text-gray-400',   bg: 'bg-gray-500/15' },
];

const SYSTEM_ICONS = {
  'FMS': Navigation, 'ACARS': Radio, 'ADS-B': Wifi, 'TCAS': Shield, 'TCAS II': Shield,
  'IRS': Activity, 'IRU': Activity, 'IRS/IRU': Activity, 'EGPWS': Layers,
  'CMC': Cpu, 'SATCOM': Database, 'EFIS': Cpu, 'EICAS': Activity,
  'DME': Radio, 'VOR': Navigation, 'ILS': Navigation, 'RA': Shield,
};
function sysIcon(name) {
  for (const k of Object.keys(SYSTEM_ICONS)) {
    if (name?.toUpperCase().includes(k)) return SYSTEM_ICONS[k];
  }
  return Cpu;
}

const STATUS_CFG = {
  nominal:    { label: 'NOMINAL',    color: 'text-green-400',  bg: 'bg-green-500/15',  dot: 'bg-green-400' },
  caution:    { label: 'CAUTION',    color: 'text-amber-400',  bg: 'bg-amber-500/15',  dot: 'bg-amber-400 animate-pulse' },
  fault:      { label: 'FAULT',      color: 'text-red-400',    bg: 'bg-red-500/15',    dot: 'bg-red-400 animate-pulse' },
  unknown:    { label: 'UNKNOWN',    color: 'text-gray-400',   bg: 'bg-gray-500/15',   dot: 'bg-gray-400' },
  current:    { label: 'CURRENT',    color: 'text-green-400',  bg: 'bg-green-500/15' },
  outdated:   { label: 'OUTDATED',   color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  available:  { label: 'AVAILABLE',  color: 'text-sky-400',    bg: 'bg-sky-500/15' },
  pending:    { label: 'PENDING',    color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  processing: { label: 'PROCESSING', color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  ready:      { label: 'READY',      color: 'text-sky-400',    bg: 'bg-sky-500/15' },
  installed:  { label: 'INSTALLED',  color: 'text-green-400',  bg: 'bg-green-500/15' },
  ok:         { label: 'OK',         color: 'text-green-400',  bg: 'bg-green-500/15' },
  partial:    { label: 'PARTIAL',    color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  error:      { label: 'ERROR',      color: 'text-red-400',    bg: 'bg-red-500/15' },
};
const scfg = s => STATUS_CFG[s] || STATUS_CFG.unknown;

// ── Zulu clock ────────────────────────────────────────────────────────────────
function ZuluClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = n => String(n).padStart(2, '0');
  return <span className="font-mono text-xs font-extrabold text-primary tracking-widest">{p(t.getUTCHours())}:{p(t.getUTCMinutes())}:{p(t.getUTCSeconds())} Z</span>;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-[#141922] border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', color + '/20')}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className="text-xl font-black text-white">{value}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

// ── Ingest Modal ───────────────────────────────────────────────────────────────
const EXAMPLE_PAYLOADS = {
  boeing_ahm: JSON.stringify({
    source: "boeing_ahm",
    reports: [{
      registration: "N455GJ", acType: "B737-800",
      reportTime: new Date().toISOString(),
      fmsIdent: "U10.8A", navDbCycle: "AIRAC 2604",
      healthItems: [
        { systemName: "FMS",    ataChapter: "34", condition: "nominal" },
        { systemName: "ACARS",  ataChapter: "23", condition: "caution", faultCode: "ATC-041", description: "Datalink intermittent" },
        { systemName: "ADS-B",  ataChapter: "34", condition: "nominal" },
        { systemName: "TCAS II",ataChapter: "34", condition: "nominal" },
        { systemName: "IRS/IRU",ataChapter: "34", condition: "nominal" },
        { systemName: "EGPWS", ataChapter: "34", condition: "nominal" },
        { systemName: "CMC",   ataChapter: "45", condition: "nominal" },
        { systemName: "SATCOM",ataChapter: "23", condition: "nominal" }
      ],
      dfdr: { available: true, flightNumber: "AEX1042", duration: "4h 12m", sizeMb: 42 }
    }]
  }, null, 2),
  airbus_skywise: JSON.stringify({
    source: "airbus_skywise",
    reports: [{
      registration: "N320AX", acType: "A320",
      acquisitionDate: new Date().toISOString(),
      fmgcVersion: "FM1B9M2", wbsNavData: "AIRAC 2604",
      acmsAlerts: [
        { ataSystem: "FMS", ata: "34", alertLevel: "nominal" },
        { ataSystem: "ACARS", ata: "23", alertLevel: "nominal" },
        { ataSystem: "ADS-B", ata: "34", alertLevel: "fault", warningCode: "ADSB-003", wording: "ADS-B transponder fault" }
      ],
      dfdr: { available: true, flightNumber: "AEX3301", duration: "1h 45m", size_mb: 17 }
    }]
  }, null, 2),
  generic: JSON.stringify({
    source: "generic",
    reports: [{
      tail: "N777AX", aircraft_type: "B777", manufacturer: "Boeing",
      timestamp: new Date().toISOString(),
      fms_version: "U7.2", nav_db: "AIRAC 2604",
      systems: [
        { name: "FMS",    ata: "34", status: "nominal" },
        { name: "ACARS",  ata: "23", status: "nominal" },
        { name: "ADS-B",  ata: "34", status: "nominal" },
        { name: "TCAS II",ata: "34", status: "caution", fault_code: "TC-11", message: "Resolution advisory test pending" },
        { name: "IRS/IRU",ata: "34", status: "nominal" },
        { name: "EGPWS", ata: "34", status: "nominal" },
        { name: "CMC",   ata: "45", status: "nominal" },
        { name: "SATCOM",ata: "23", status: "nominal" }
      ],
      dfdr: { available: true, flight: "AEX0011", duration: "10h 22m", size_mb: 103 }
    }]
  }, null, 2),
};

function IngestModal({ onClose, onSuccess }) {
  const [source, setSource] = useState('boeing_ahm');
  const [payload, setPayload] = useState(EXAMPLE_PAYLOADS['boeing_ahm']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSourceChange = (s) => {
    setSource(s);
    setPayload(EXAMPLE_PAYLOADS[s] || EXAMPLE_PAYLOADS['generic']);
    setResult(null);
    setError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPayload(ev.target.result);
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const parsed = JSON.parse(payload);
      const res = await base44.functions.invoke('avionicsIngest', parsed);
      setResult(res.data);
      if (res.data?.ingested > 0) onSuccess();
    } catch (e) {
      setError(e.message || 'Ingest failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <p className="font-extrabold text-white text-sm uppercase tracking-widest">Ingest Avionics Data</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Source selector */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Data Source / Manufacturer</p>
            <div className="flex flex-wrap gap-2">
              {DATA_SOURCES.map(ds => (
                <button key={ds.id} onClick={() => handleSourceChange(ds.id)}
                  className={cn('text-[10px] font-extrabold px-3 py-1.5 rounded-lg border transition-all',
                    source === ds.id ? `${ds.bg} ${ds.color} border-current` : 'border-white/10 text-gray-500 hover:text-gray-300')}>
                  {ds.label}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[10px] font-bold text-sky-400 cursor-pointer bg-sky-500/10 border border-sky-500/20 px-3 py-2 rounded-lg hover:bg-sky-500/20 transition-colors">
              <FileDown className="w-3.5 h-3.5" /> Upload JSON File
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <p className="text-[10px] text-gray-600">or edit payload below — pre-filled with example for selected source</p>
          </div>

          {/* Payload editor */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">JSON Payload</p>
            <textarea
              value={payload}
              onChange={e => setPayload(e.target.value)}
              rows={14}
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-xs text-green-300 font-mono resize-none outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* API endpoint info */}
          <div className="bg-[#0d1117] border border-white/8 rounded-xl px-4 py-3 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-gray-400 space-y-0.5">
              <p><span className="text-white font-bold">REST endpoint:</span> POST to the <code className="text-cyan-300">avionicsIngest</code> function URL from any manufacturer system</p>
              <p>Supports: <span className="text-white">boeing_ahm · airbus_skywise · embraer_ahead · bombardier_fast · generic</span> — auto-normalizes each format</p>
              <p>Accepts a single report, an array, or <code className="text-cyan-300">{"{ source, reports: [...] }"}</code></p>
            </div>
          </div>

          {/* Result / error */}
          {result && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-green-400">Ingested {result.ingested} report(s){result.errors > 0 ? `, ${result.errors} error(s)` : ''}</p>
              {result.errors_detail?.length > 0 && result.errors_detail.map((e, i) => (
                <p key={i} className="text-[10px] text-red-400 mt-1">{e.tail}: {e.error}</p>
              ))}
            </div>
          )}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Ingesting…</> : <><Zap className="w-4 h-4" /> Ingest Data</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Fleet Avionics Status ─────────────────────────────────────────────────
function FleetStatusTab({ reports, aircraft, typeFilter }) {
  // Merge entity reports with fleet aircraft, showing latest report per tail
  const latestByTail = {};
  reports.forEach(r => {
    const existing = latestByTail[r.aircraft_tail];
    if (!existing || new Date(r.report_timestamp) > new Date(existing.report_timestamp)) {
      latestByTail[r.aircraft_tail] = r;
    }
  });

  // Also show aircraft that have no report yet
  const allTails = [...new Set([
    ...aircraft.map(a => a.tail_number),
    ...Object.keys(latestByTail),
  ])];

  const filtered = allTails.filter(tail => {
    if (typeFilter === 'All Types') return true;
    const ac = aircraft.find(a => a.tail_number === tail);
    const rep = latestByTail[tail];
    return (ac?.aircraft_type === typeFilter) || (rep?.aircraft_type === typeFilter);
  });

  const nominalCount  = filtered.filter(t => latestByTail[t] && !latestByTail[t].systems?.some(s => s.status === 'fault' || s.status === 'caution')).length;
  const cautionCount  = filtered.filter(t => latestByTail[t]?.systems?.some(s => s.status === 'caution') && !latestByTail[t]?.systems?.some(s => s.status === 'fault')).length;
  const faultCount    = filtered.filter(t => latestByTail[t]?.systems?.some(s => s.status === 'fault')).length;
  const noDataCount   = filtered.filter(t => !latestByTail[t]).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Aircraft Tracked"  value={filtered.length} color="text-white"      icon={Plane} />
        <KpiCard label="Systems Nominal"   value={nominalCount}    color="text-green-400"  icon={CheckCircle} />
        <KpiCard label="Cautions"          value={cautionCount}    color="text-amber-400"  icon={AlertTriangle} />
        <KpiCard label="Faults"            value={faultCount}      color="text-red-400"    icon={Activity} />
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Cpu className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 font-bold">No avionics data yet</p>
          <p className="text-gray-600 text-xs">Use the "Ingest Data" button to push data from any manufacturer system</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(tail => {
          const report = latestByTail[tail];
          const ac = aircraft.find(a => a.tail_number === tail);
          const systems = report?.systems || [];
          const hasFault   = systems.some(s => s.status === 'fault');
          const hasCaution = systems.some(s => s.status === 'caution');
          const borderColor = hasFault ? 'border-red-500/40' : hasCaution ? 'border-amber-500/40' : 'border-white/8';
          const ds = DATA_SOURCES.find(d => d.label === report?.data_source || d.id === report?.data_source);

          return (
            <div key={tail} className={cn('bg-[#141922] border rounded-xl px-4 py-3', borderColor)}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-extrabold text-primary font-mono">{tail}</p>
                  <p className="text-xs text-gray-500">{report?.aircraft_type || ac?.aircraft_type || '—'}</p>
                  {hasFault   && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">FAULT</span>}
                  {!hasFault && hasCaution && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">CAUTION</span>}
                  {!report && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-500 border border-gray-500/30">NO DATA</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  {report && <><span className={cn('font-bold', ds?.color || 'text-gray-400')}>{report.data_source}</span> · {new Date(report.report_timestamp).toLocaleString()}</>}
                  {ac?.base_station && <span>{ac.base_station}</span>}
                </div>
              </div>

              {systems.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {systems.map((sys, i) => {
                    const cfg = scfg(sys.status);
                    const Icon = sysIcon(sys.system_name);
                    return (
                      <div key={i} title={sys.fault_code ? `${sys.fault_code}: ${sys.message}` : sys.system_name}
                        className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg cursor-default', cfg.bg, cfg.color)}>
                        <Icon className="w-3 h-3" />
                        <span>{sys.system_name}</span>
                        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-gray-600 italic">No system data ingested yet</p>
              )}

              {/* Fault messages */}
              {systems.filter(s => s.status === 'fault' || s.status === 'caution').map((s, i) => (
                <div key={i} className={cn('mt-2 text-[10px] px-2 py-1 rounded flex items-center gap-2',
                  s.status === 'fault' ? 'bg-red-900/20 text-red-300' : 'bg-amber-900/20 text-amber-300')}>
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span className="font-bold">{s.system_name}</span>
                  {s.fault_code && <span className="font-mono">[{s.fault_code}]</span>}
                  {s.message && <span>{s.message}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Nav / Data Downloads ──────────────────────────────────────────────────
function NavDataTab({ reports, typeFilter }) {
  // Group latest nav DB info per aircraft type
  const byType = {};
  reports.forEach(r => {
    if (!r.aircraft_type) return;
    if (typeFilter !== 'All Types' && r.aircraft_type !== typeFilter) return;
    if (!byType[r.aircraft_type] || new Date(r.report_timestamp) > new Date(byType[r.aircraft_type].report_timestamp)) {
      byType[r.aircraft_type] = r;
    }
  });

  const types = Object.keys(byType).sort();

  const currentAirac = 'AIRAC 2604';

  return (
    <div className="space-y-4">
      {types.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Navigation className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 font-bold">No nav data ingested yet</p>
          <p className="text-gray-600 text-xs">Ingest data from your manufacturer systems to see nav DB status</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map(type => {
          const r = byType[type];
          const isOutdated = r.nav_db_version && r.nav_db_version !== currentAirac;
          const dbStatus = r.nav_db_version ? (isOutdated ? 'outdated' : 'current') : 'unknown';
          const cfg = scfg(dbStatus);
          const ds = DATA_SOURCES.find(d => d.label === r.data_source || d.id === r.data_source);

          return (
            <div key={type} className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-primary" />
                  <p className="text-sm font-extrabold text-white">{type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] font-bold', ds?.color || 'text-gray-400')}>{r.data_source}</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500">Current AIRAC</p>
                  <p className="font-bold text-white mt-0.5">{r.nav_db_version || '—'}</p>
                </div>
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500">Latest Available</p>
                  <p className="font-bold text-amber-400 mt-0.5">{currentAirac}</p>
                </div>
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500">FMS Version</p>
                  <p className="font-bold text-primary mt-0.5 font-mono">{r.fms_version || '—'}</p>
                </div>
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-bold text-gray-300 mt-0.5">{new Date(r.report_timestamp).toLocaleDateString()}</p>
                </div>
              </div>

              {isOutdated && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">Nav DB is outdated — <span className="font-bold">{currentAirac}</span> is available</p>
                </div>
              )}

              <div className="flex gap-2">
                {isOutdated && (
                  <button className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 px-3 py-2 rounded-lg border border-sky-500/20 transition-colors">
                    <Download className="w-3 h-3" /> Download {currentAirac}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: DFDR / QAR Downloads ─────────────────────────────────────────────────
function DFDRTab({ reports, typeFilter }) {
  const dfdrReports = reports.filter(r => r.dfdr_available && (typeFilter === 'All Types' || r.aircraft_type === typeFilter));

  const available  = dfdrReports.filter(r => r.ingest_status === 'ok').length;
  const processing = dfdrReports.filter(r => r.ingest_status !== 'ok').length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Total Records"  value={dfdrReports.length} color="text-white"     icon={HardDrive} />
        <KpiCard label="Available"      value={available}          color="text-sky-400"   icon={FileDown} />
        <KpiCard label="Processing"     value={processing}         color="text-amber-400" icon={Clock} />
      </div>

      {dfdrReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <HardDrive className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 font-bold">No DFDR records available</p>
          <p className="text-gray-600 text-xs">Ingest data with dfdr.available=true to populate this tab</p>
        </div>
      )}

      {dfdrReports.length > 0 && (
        <div className="bg-[#141922] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">DFDR / QAR Flight Records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Tail', 'Type', 'Source', 'Flight', 'Duration', 'Size', 'Report Time', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dfdrReports.map((r, i) => {
                  const sc = scfg(r.ingest_status === 'ok' ? 'available' : 'processing');
                  const ds = DATA_SOURCES.find(d => d.label === r.data_source || d.id === r.data_source);
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-extrabold text-primary text-xs">{r.aircraft_tail}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.aircraft_type || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-bold', ds?.color || 'text-gray-400')}>{r.data_source}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white font-bold">{r.dfdr_flight_number || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.dfdr_flight_duration || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{r.dfdr_file_size_mb ? `${r.dfdr_file_size_mb} MB` : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(r.report_timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', sc.bg, sc.color)}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.dfdr_download_url ? (
                          <a href={r.dfdr_download_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1.5 rounded-lg border border-sky-500/20 whitespace-nowrap">
                            <Download className="w-3 h-3" /> Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-600">No URL</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Software Verifications ───────────────────────────────────────────────
function SoftwareVerificationsTab({ reports, typeFilter }) {
  // Group LRU software versions by aircraft type
  const swByType = {};
  reports.forEach(r => {
    if (typeFilter !== 'All Types' && r.aircraft_type !== typeFilter) return;
    if (!r.aircraft_type) return;
    if (!swByType[r.aircraft_type]) {
      swByType[r.aircraft_type] = {
        fms_version: r.fms_version,
        nav_db_version: r.nav_db_version,
        aircraft_type: r.aircraft_type,
        count: 0,
        reports: [],
      };
    }
    swByType[r.aircraft_type].count += 1;
    swByType[r.aircraft_type].reports.push(r);
  });

  const types = Object.keys(swByType).sort();

  return (
    <div className="space-y-4">
      {types.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Shield className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 font-bold">No software verification data</p>
          <p className="text-gray-600 text-xs">Ingest avionics reports to see LRU software versions</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {types.map(type => {
          const sw = swByType[type];
          return (
            <div key={type} className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-cyan-400" />
                  <p className="text-sm font-extrabold text-white">{type}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">{sw.count} aircraft</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">FMS Version</p>
                  <p className="font-bold text-primary font-mono mt-1">{sw.fms_version || 'Not available'}</p>
                </div>
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest">Nav DB Version</p>
                  <p className="font-bold text-cyan-400 font-mono mt-1">{sw.nav_db_version || 'Not available'}</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Fleet Distribution</p>
                <div className="space-y-1">
                  {sw.reports.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-primary">{r.aircraft_tail}</span>
                      <span className="text-gray-500">{r.data_source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'status',      label: 'Fleet Avionics Status',   icon: Activity },
  { id: 'navdata',     label: 'Nav/Data Downloads',      icon: Navigation },
  { id: 'navschedule', label: 'Nav Upload Schedule',     icon: Calendar },
  { id: 'swverify',    label: 'Software Verifications',  icon: Shield },
  { id: 'dfdr',        label: 'DFDR Downloads',          icon: HardDrive },
];

export default function AvionicsDashboard() {
  const [activeTab, setActiveTab] = useState('status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showIngest, setShowIngest] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading: reportsLoading, refetch } = useQuery({
    queryKey: ['avionics-reports'],
    queryFn: () => base44.entities.AvionicsReport.list('-report_timestamp', 1000),
    refetchInterval: 60000,
  });

  const { data: aircraft = [], isLoading: acLoading } = useQuery({
    queryKey: ['avionics-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 1000),
    refetchInterval: 120000,
  });

  const isLoading = reportsLoading || acLoading;

  const faultCount   = reports.filter(r => r.systems?.some(s => s.status === 'fault')).length;
  const cautionCount = reports.filter(r => r.systems?.some(s => s.status === 'caution') && !r.systems?.some(s => s.status === 'fault')).length;

  const handleIngestSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['avionics-reports'] });
  };

  return (
    <div className="h-screen flex flex-col bg-[#080c12] text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-white/8 flex-shrink-0 bg-[#0a0e18]">
        <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-extrabold text-white tracking-widest uppercase">Avionics Dashboard</p>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase">Multi-Manufacturer · Live Data Ingestion</p>
          </div>
        </div>

        {/* Source badges */}
        <div className="hidden lg:flex items-center gap-1.5 ml-3">
          {DATA_SOURCES.map(ds => (
            <span key={ds.id} className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', ds.bg, ds.color)}>{ds.mfr}</span>
          ))}
        </div>

        {/* Quick KPIs */}
        <div className="hidden md:flex items-center gap-5 ml-4 border-l border-white/10 pl-4">
          {[
            { label: 'Reports', val: reports.length, color: 'text-white' },
            { label: 'Faults', val: faultCount, color: faultCount > 0 ? 'text-red-400' : 'text-gray-500' },
            { label: 'Cautions', val: cautionCount, color: cautionCount > 0 ? 'text-amber-400' : 'text-gray-500' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={cn('text-base font-black leading-none', color)}>{val}</p>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ZuluClock />
          <button onClick={() => setShowIngest(true)}
            className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors">
            <Upload className="w-3 h-3" /> Ingest Data
          </button>
          <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors">
            <RefreshCw className={cn('w-3.5 h-3.5 text-gray-400', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Secondary toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 bg-[#0a0e18] flex-shrink-0 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border transition-all uppercase tracking-widest',
              activeTab === id ? 'bg-primary text-primary-foreground border-primary' : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30')}>
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}

        <div className="ml-auto relative">
          <button onClick={() => setShowTypeMenu(v => !v)}
            className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-all">
            <Layers className="w-3 h-3" /> {typeFilter} <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showTypeMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTypeMenu(false)} />
              <div className="absolute top-full right-0 mt-1 bg-[#141922] border border-white/10 rounded-xl shadow-2xl z-20 min-w-[160px] py-1 max-h-80 overflow-y-auto">
                {AIRCRAFT_TYPES.map(t => (
                  <button key={t} onClick={() => { setTypeFilter(t); setShowTypeMenu(false); }}
                    className={cn('w-full text-left px-3 py-2 text-[10px] hover:bg-white/5', typeFilter === t ? 'text-primary font-bold' : 'text-gray-300')}>
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'status'      && <FleetStatusTab reports={reports} aircraft={aircraft} typeFilter={typeFilter} />}
        {activeTab === 'navdata'     && <NavDataTab reports={reports} typeFilter={typeFilter} />}
        {activeTab === 'navschedule' && <NavUploadScheduleTab reports={reports} aircraft={aircraft} onIngestSuccess={handleIngestSuccess} />}
        {activeTab === 'swverify'    && <SoftwareVerificationsTab reports={reports} typeFilter={typeFilter} />}
        {activeTab === 'dfdr'        && <DFDRTab reports={reports} typeFilter={typeFilter} />}
      </div>

      {showIngest && (
        <IngestModal
          onClose={() => setShowIngest(false)}
          onSuccess={() => { handleIngestSuccess(); setShowIngest(false); }}
        />
      )}
    </div>
  );
}