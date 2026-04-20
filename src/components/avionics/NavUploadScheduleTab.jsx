import { useState, useMemo } from 'react';
import {
  Calendar, CheckCircle, Clock, AlertTriangle, Plane,
  ChevronDown, BarChart3, Layers, Filter, Download, Upload,
  X, Zap, RefreshCw, FileDown, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

// ── Fleet type → manufacturer grouping ───────────────────────────────────────
const FLEET_GROUPS = {
  Boeing:     ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','B757','B767','B777','B787'],
  Airbus:     ['A320','A321','A350'],
  Embraer:    ['E190'],
  Bombardier: ['CRJ900'],
};

const MFR_COLORS = {
  Boeing:     { color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  Airbus:     { color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  Embraer:    { color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  Bombardier: { color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
};

function getMfr(aircraftType) {
  for (const [mfr, types] of Object.entries(FLEET_GROUPS)) {
    if (types.includes(aircraftType)) return mfr;
  }
  return 'Unknown';
}

// AIRAC cycles — 28-day schedule starting Jan 23, 2025
const AIRAC_BASE = new Date('2025-01-23');
function getAiracCycles(count = 14) {
  const cycles = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(AIRAC_BASE);
    d.setDate(d.getDate() + i * 28);
    const year = d.getFullYear().toString().slice(2);
    const num = String(i + 2).padStart(2, '0'); // rough cycle numbering
    cycles.push({
      label: `AIRAC ${year}${String((d.getMonth() + 1 + i) % 13 + 1).padStart(2,'0')}`,
      date: d.toISOString().split('T')[0],
      month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
    });
  }
  return cycles;
}

const AIRAC_CYCLES = getAiracCycles(14);
const CURRENT_AIRAC = 'AIRAC 2604';
const CURRENT_AIRAC_IDX = AIRAC_CYCLES.findIndex(c => c.label === CURRENT_AIRAC);

// ── Helpers ────────────────────────────────────────────────────────────────────
function toDateKey(isoStr) {
  return isoStr ? isoStr.split('T')[0] : null;
}
function toMonthKey(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

// ── Quick Nav Upload Modal ────────────────────────────────────────────────────
function NavUploadModal({ aircraftType, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const mfr = getMfr(aircraftType);

  // Determine source id from manufacturer
  const sourceId = mfr === 'Boeing' ? 'boeing_ahm' : mfr === 'Airbus' ? 'airbus_skywise' : mfr === 'Embraer' ? 'embraer_ahead' : mfr === 'Bombardier' ? 'bombardier_fast' : 'generic';

  const defaultPayload = JSON.stringify({
    source: sourceId,
    reports: [{
      ...(sourceId === 'boeing_ahm'       ? { registration: '', acType: aircraftType, fmsIdent: '', navDbCycle: CURRENT_AIRAC, healthItems: [], reportTime: new Date().toISOString() } :
          sourceId === 'airbus_skywise'   ? { registration: '', acType: aircraftType, fmgcVersion: '', wbsNavData: CURRENT_AIRAC, acmsAlerts: [], acquisitionDate: new Date().toISOString() } :
          sourceId === 'embraer_ahead'    ? { aircraftId: '', model: aircraftType, fmsPartNumber: '', navDbVersion: CURRENT_AIRAC, aheadAlerts: [], reportDate: new Date().toISOString() } :
          sourceId === 'bombardier_fast'  ? { registration: '', variant: aircraftType, fmsSoftwareVersion: '', fmsDbCycle: CURRENT_AIRAC, fastEvents: [], eventTime: new Date().toISOString() } :
          { tail: '', aircraft_type: aircraftType, fms_version: '', nav_db: CURRENT_AIRAC, systems: [], timestamp: new Date().toISOString() })
    }]
  }, null, 2);

  const [payload, setPayload] = useState(defaultPayload);

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
      <div className="w-full max-w-xl bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <p className="font-extrabold text-white text-sm uppercase tracking-widest">Upload Nav Data · {aircraftType}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('text-[9px] font-extrabold px-2 py-0.5 rounded', (MFR_COLORS[mfr] || MFR_COLORS.Boeing).bg, (MFR_COLORS[mfr] || MFR_COLORS.Boeing).color)}>{mfr}</span>
            <span className="text-[10px] text-gray-400">Source: <span className="text-white font-bold">{sourceId}</span></span>
            <span className="text-[10px] text-cyan-400 font-bold">→ AIRAC: {CURRENT_AIRAC}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[10px] font-bold text-sky-400 cursor-pointer bg-sky-500/10 border border-sky-500/20 px-3 py-2 rounded-lg hover:bg-sky-500/20 transition-colors">
              <FileDown className="w-3.5 h-3.5" /> Upload JSON File
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <p className="text-[10px] text-gray-600">or edit the pre-filled template below</p>
          </div>
          <textarea
            value={payload}
            onChange={e => setPayload(e.target.value)}
            rows={12}
            className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-xs text-green-300 font-mono resize-none outline-none focus:border-cyan-500/50"
          />
          {result && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-green-400">Ingested {result.ingested} report(s){result.errors > 0 ? `, ${result.errors} error(s)` : ' — Success!'}</p>
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
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Ingesting…</> : <><Zap className="w-4 h-4" /> Upload Nav Data</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-view: Upload Tracker (day / month) ────────────────────────────────────
function UploadTracker({ reports, aircraft, typeFilter, fleetFilter }) {
  const [view, setView] = useState('day'); // 'day' | 'month'
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  // Build set of tails that match filters
  const matchedTails = useMemo(() => {
    return aircraft.filter(a => {
      if (typeFilter !== 'All Types' && a.aircraft_type !== typeFilter) return false;
      if (fleetFilter !== 'All Fleets' && getMfr(a.aircraft_type) !== fleetFilter) return false;
      return true;
    }).map(a => a.tail_number);
  }, [aircraft, typeFilter, fleetFilter]);

  // Reports filtered to matched tails
  const filteredReports = useMemo(() => {
    return reports.filter(r => matchedTails.includes(r.aircraft_tail) || matchedTails.length === 0);
  }, [reports, matchedTails]);

  // Today's uploads
  const todayUploads = useMemo(() => {
    return filteredReports.filter(r => toDateKey(r.report_timestamp) === today || toDateKey(r.created_date) === today);
  }, [filteredReports, today]);

  // This month's uploads (unique tails)
  const monthUploads = useMemo(() => {
    return filteredReports.filter(r => toMonthKey(r.report_timestamp) === thisMonth || toMonthKey(r.created_date) === thisMonth);
  }, [filteredReports, thisMonth]);

  const uploadedTailsToday = [...new Set(todayUploads.map(r => r.aircraft_tail))];
  const uploadedTailsMonth = [...new Set(monthUploads.map(r => r.aircraft_tail))];
  const notUploadedToday = matchedTails.filter(t => !uploadedTailsToday.includes(t));
  const notUploadedMonth = matchedTails.filter(t => !uploadedTailsMonth.includes(t));

  const activeUploads = view === 'day' ? uploadedTailsToday : uploadedTailsMonth;
  const pendingTails  = view === 'day' ? notUploadedToday  : notUploadedMonth;
  const activeReports = view === 'day' ? todayUploads      : monthUploads;

  // Group by aircraft type for summary
  const byType = {};
  activeUploads.forEach(tail => {
    const ac = aircraft.find(a => a.tail_number === tail);
    const type = ac?.aircraft_type || 'Unknown';
    if (!byType[type]) byType[type] = 0;
    byType[type]++;
  });

  return (
    <div className="space-y-4">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold text-white uppercase tracking-widest">Upload Tracker</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Aircraft with nav data uploaded</p>
        </div>
        <div className="flex items-center gap-1 bg-[#0d1117] border border-white/10 rounded-xl p-1">
          {['day','month'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all capitalize',
                view === v ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-300')}>
              {v === 'day' ? 'Today' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#141922] border border-white/8 rounded-xl px-3 py-3 text-center">
          <p className="text-2xl font-black text-green-400">{activeUploads.length}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Uploaded</p>
        </div>
        <div className="bg-[#141922] border border-white/8 rounded-xl px-3 py-3 text-center">
          <p className={cn('text-2xl font-black', pendingTails.length > 0 ? 'text-amber-400' : 'text-gray-600')}>{pendingTails.length}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Pending</p>
        </div>
        <div className="bg-[#141922] border border-white/8 rounded-xl px-3 py-3 text-center">
          <p className="text-2xl font-black text-white">{matchedTails.length}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Total Fleet</p>
        </div>
      </div>

      {/* By type summary */}
      {Object.keys(byType).length > 0 && (
        <div className="bg-[#141922] border border-white/8 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Uploaded by Aircraft Type</p>
          <div className="space-y-1.5">
            {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
              const mfr = getMfr(type);
              const mc = MFR_COLORS[mfr] || MFR_COLORS.Boeing;
              const total = matchedTails.filter(t => aircraft.find(a => a.tail_number === t)?.aircraft_type === type).length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', mc.bg, mc.color)}>{mfr}</span>
                      <span className="text-xs text-white font-bold">{type}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{count}/{total} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Uploaded list */}
        <div className="bg-[#141922] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/8 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest">Uploaded ({activeUploads.length})</p>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
            {activeUploads.length === 0 && <p className="text-[10px] text-gray-600 text-center py-6">None yet</p>}
            {activeUploads.map(tail => {
              const ac = aircraft.find(a => a.tail_number === tail);
              const rep = activeReports.filter(r => r.aircraft_tail === tail).sort((a,b) => new Date(b.report_timestamp) - new Date(a.report_timestamp))[0];
              return (
                <div key={tail} className="flex items-center justify-between px-3 py-2 hover:bg-white/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span className="text-xs font-extrabold text-primary font-mono">{tail}</span>
                    <span className="text-[10px] text-gray-500">{ac?.aircraft_type || rep?.aircraft_type || '—'}</span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {rep ? new Date(rep.report_timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending list */}
        <div className="bg-[#141922] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/8 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Pending Upload ({pendingTails.length})</p>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
            {pendingTails.length === 0 && <p className="text-[10px] text-gray-600 text-center py-6">All aircraft uploaded ✓</p>}
            {pendingTails.map(tail => {
              const ac = aircraft.find(a => a.tail_number === tail);
              return (
                <div key={tail} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5">
                  <Clock className="w-3 h-3 text-amber-400/60 flex-shrink-0" />
                  <span className="text-xs font-extrabold text-gray-400 font-mono">{tail}</span>
                  <span className="text-[10px] text-gray-600">{ac?.aircraft_type || '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main NavUploadScheduleTab ─────────────────────────────────────────────────
export default function NavUploadScheduleTab({ reports, aircraft, onIngestSuccess }) {
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fleetFilter, setFleetFilter] = useState('All Fleets');
  const [subView, setSubView] = useState('schedule'); // 'schedule' | 'tracker'
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFleetMenu, setShowFleetMenu] = useState(false);
  const [uploadModalType, setUploadModalType] = useState(null); // aircraft type string or null

  const AIRCRAFT_TYPES_OPTIONS = ['All Types', ...Object.values(FLEET_GROUPS).flat()];
  const FLEET_OPTIONS = ['All Fleets', ...Object.keys(FLEET_GROUPS)];

  // Build schedule: per aircraft type, what's current/scheduled
  const navStatusByType = useMemo(() => {
    const result = {};
    reports.forEach(r => {
      if (!r.aircraft_type) return;
      if (!result[r.aircraft_type] || new Date(r.report_timestamp) > new Date(result[r.aircraft_type].report_timestamp)) {
        result[r.aircraft_type] = r;
      }
    });
    return result;
  }, [reports]);

  // All types from aircraft fleet + any from reports
  const allTypes = useMemo(() => {
    const fromAc = [...new Set(aircraft.map(a => a.aircraft_type).filter(Boolean))];
    const fromRep = [...new Set(reports.map(r => r.aircraft_type).filter(Boolean))];
    return [...new Set([...fromAc, ...fromRep])].sort();
  }, [aircraft, reports]);

  const filteredTypes = allTypes.filter(t => {
    if (typeFilter !== 'All Types' && t !== typeFilter) return false;
    if (fleetFilter !== 'All Fleets' && getMfr(t) !== fleetFilter) return false;
    return true;
  });

  const currentAiracIdx = AIRAC_CYCLES.findIndex(c => c.label === CURRENT_AIRAC);

  return (
    <div className="space-y-4">
      {/* Sub-view toggle + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[#0d1117] border border-white/10 rounded-xl p-1">
          {[{id:'schedule',label:'Upload Schedule'},{id:'tracker',label:'Upload Tracker'}].map(sv => (
            <button key={sv.id} onClick={() => setSubView(sv.id)}
              className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all',
                subView === sv.id ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-300')}>
              {sv.id === 'schedule' ? <Calendar className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
              {sv.label}
            </button>
          ))}
        </div>

        {/* Fleet (manufacturer) filter */}
        <div className="relative">
          <button onClick={() => { setShowFleetMenu(v => !v); setShowTypeMenu(false); }}
            className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white transition-all">
            <Filter className="w-3 h-3" /> {fleetFilter} <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showFleetMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFleetMenu(false)} />
              <div className="absolute top-full left-0 mt-1 bg-[#141922] border border-white/10 rounded-xl shadow-2xl z-20 min-w-[150px] py-1">
                {FLEET_OPTIONS.map(f => (
                  <button key={f} onClick={() => { setFleetFilter(f); setShowFleetMenu(false); }}
                    className={cn('w-full text-left px-3 py-2 text-[10px] hover:bg-white/5', fleetFilter === f ? 'text-primary font-bold' : 'text-gray-300')}>
                    {f}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Aircraft type filter */}
        <div className="relative">
          <button onClick={() => { setShowTypeMenu(v => !v); setShowFleetMenu(false); }}
            className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white transition-all">
            <Layers className="w-3 h-3" /> {typeFilter} <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showTypeMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTypeMenu(false)} />
              <div className="absolute top-full left-0 mt-1 bg-[#141922] border border-white/10 rounded-xl shadow-2xl z-20 min-w-[160px] py-1 max-h-72 overflow-y-auto">
                {AIRCRAFT_TYPES_OPTIONS.map(t => (
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

      {/* ── SUB VIEW: Upload Schedule ── */}
      {subView === 'schedule' && (
        <div className="space-y-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            AIRAC Cycle Upload Schedule · {filteredTypes.length} aircraft type{filteredTypes.length !== 1 ? 's' : ''}
          </p>

          {filteredTypes.length === 0 && (
            <div className="text-center text-gray-600 py-12">No aircraft types match your filters</div>
          )}

          {filteredTypes.map(type => {
            const mfr = getMfr(type);
            const mc = MFR_COLORS[mfr] || MFR_COLORS.Boeing;
            const latest = navStatusByType[type];
            const currentVersion = latest?.nav_db_version || '—';
            const isOutdated = currentVersion !== CURRENT_AIRAC && currentVersion !== '—';
            const tailsForType = aircraft.filter(a => a.aircraft_type === type);
            const uploadedTails = [...new Set(reports.filter(r => r.aircraft_type === type).map(r => r.aircraft_tail))];

            return (
              <div key={type} className={cn('bg-[#141922] border rounded-2xl p-4 space-y-3', isOutdated ? 'border-amber-500/30' : 'border-white/8')}>
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[9px] font-extrabold px-2 py-0.5 rounded', mc.bg, mc.color)}>{mfr}</span>
                    <p className="text-sm font-extrabold text-white">{type}</p>
                    <span className="text-[10px] text-gray-500">{tailsForType.length} aircraft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">FMS: <span className="text-primary font-bold font-mono">{latest?.fms_version || '—'}</span></span>
                    {isOutdated
                      ? <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30"><AlertTriangle className="w-3 h-3" /> Outdated</span>
                      : currentVersion !== '—' && <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full border border-green-500/30"><CheckCircle className="w-3 h-3" /> Current</span>}
                    <button
                      onClick={() => setUploadModalType(type)}
                      className="flex items-center gap-1 text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg hover:bg-cyan-500/20 transition-colors">
                      <Upload className="w-3 h-3" /> Upload Nav Data
                    </button>
                  </div>
                </div>

                {/* AIRAC timeline */}
                <div className="overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    {AIRAC_CYCLES.map((cycle, idx) => {
                      const isPast   = idx < currentAiracIdx;
                      const isCurrent = idx === currentAiracIdx;
                      const isFuture = idx > currentAiracIdx;
                      const isUploaded = reports.some(r => r.aircraft_type === type && r.nav_db_version === cycle.label);
                      return (
                        <div key={cycle.label}
                          className={cn('flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-center min-w-[70px] border transition-all',
                            isCurrent  ? 'bg-primary/20 border-primary text-primary' :
                            isUploaded ? 'bg-green-500/15 border-green-500/30 text-green-400' :
                            isPast     ? 'bg-white/5 border-white/5 text-gray-600' :
                            'bg-white/3 border-white/5 text-gray-700')}>
                          <p className="text-[8px] font-extrabold uppercase tracking-wider">{cycle.label}</p>
                          <p className="text-[8px] text-gray-600">{cycle.date}</p>
                          <div className={cn('w-3 h-3 rounded-full',
                            isCurrent ? 'bg-primary' :
                            isUploaded ? 'bg-green-400' :
                            isPast ? 'bg-white/10' :
                            'bg-white/5')} />
                          <p className="text-[7px] font-bold">
                            {isCurrent ? 'NOW' : isUploaded ? '✓' : isPast ? '—' : 'DUE'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tail chips */}
                <div>
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Aircraft Tails · {uploadedTails.length}/{tailsForType.length} have data</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tailsForType.map(ac => {
                      const hasData = uploadedTails.includes(ac.tail_number);
                      return (
                        <span key={ac.tail_number}
                          className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded border',
                            hasData ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-gray-600 bg-white/3 border-white/8')}>
                          {hasData && '✓ '}{ac.tail_number}
                        </span>
                      );
                    })}
                    {tailsForType.length === 0 && <span className="text-[10px] text-gray-600 italic">No aircraft registered for this type</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SUB VIEW: Upload Tracker ── */}
      {subView === 'tracker' && (
        <UploadTracker
          reports={reports}
          aircraft={aircraft}
          typeFilter={typeFilter}
          fleetFilter={fleetFilter}
        />
      )}

      {uploadModalType && (
        <NavUploadModal
          aircraftType={uploadModalType}
          onClose={() => setUploadModalType(null)}
          onSuccess={() => { setUploadModalType(null); onIngestSuccess?.(); }}
        />
      )}
    </div>
  );
}