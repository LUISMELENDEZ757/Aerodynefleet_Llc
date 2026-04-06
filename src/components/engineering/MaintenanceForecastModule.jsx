import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import {
  Clock, AlertTriangle, CheckCircle, Wrench, Zap, Plus,
  X, TrendingUp, CalendarDays, ChevronDown, RefreshCw, Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addMonths, differenceInMonths, format, parseISO, addDays } from 'date-fns';

// ── Constants ────────────────────────────────────────────────────────────────
const COMPONENT_CFG = {
  engine_1:            { label: 'Engine 1',          color: '#ef4444', icon: Wrench, ataHint: 'ATA 72' },
  engine_2:            { label: 'Engine 2',          color: '#f97316', icon: Wrench, ataHint: 'ATA 72' },
  apu:                 { label: 'APU',               color: '#a855f7', icon: Zap,    ataHint: 'ATA 49' },
  engine_hsi:          { label: 'Engine HSI',        color: '#3b82f6', icon: Wrench, ataHint: 'ATA 72' },
  engine_epr_overhaul: { label: 'EPR Overhaul',      color: '#f59e0b', icon: Wrench, ataHint: 'ATA 77' },
};

const STATUS_CFG = {
  ok:        { label: 'OK',        color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30'  },
  watch:     { label: 'WATCH',     color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  due_soon:  { label: 'DUE SOON', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  overdue:   { label: 'OVERDUE',  color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30'    },
};

const DEFAULT_INTERVALS = {
  engine_1:            { hours: 20000, cycles: 15000 },
  engine_2:            { hours: 20000, cycles: 15000 },
  apu:                 { hours: 6000,  cycles: 3000  },
  engine_hsi:          { hours: 10000, cycles: 8000  },
  engine_epr_overhaul: { hours: 15000, cycles: 12000 },
};

const tooltipStyle = {
  contentStyle: { background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 },
};

// ── Compute derived fields ───────────────────────────────────────────────────
function computeForecast(record) {
  const interval    = record.overhaul_interval_hours || DEFAULT_INTERVALS[record.component]?.hours || 20000;
  const cycleLimit  = record.overhaul_interval_cycles || DEFAULT_INTERVALS[record.component]?.cycles || 15000;
  const sinceOH     = record.total_flight_hours - (record.last_overhaul_hours || 0);
  const cyclesSinceOH = record.total_cycles - (record.last_overhaul_cycles || 0);

  const hoursRemaining  = Math.max(0, interval - sinceOH);
  const cyclesRemaining = Math.max(0, cycleLimit - cyclesSinceOH);
  const pctUsedHours    = Math.min(100, (sinceOH / interval) * 100);
  const pctUsedCycles   = Math.min(100, (cyclesSinceOH / cycleLimit) * 100);
  const pctUsed         = Math.max(pctUsedHours, pctUsedCycles);

  // Projected months remaining
  const avgHrs = record.avg_hours_per_month || 350;
  const avgCyc = record.avg_cycles_per_month || 250;
  const monthsByHours = avgHrs > 0 ? hoursRemaining / avgHrs : 999;
  const monthsByCycles = avgCyc > 0 ? cyclesRemaining / avgCyc : 999;
  const monthsRemaining = Math.floor(Math.min(monthsByHours, monthsByCycles));

  const projectedDate = addMonths(new Date(), monthsRemaining);

  // Suggest window 1 month before projected date
  const windowStart = addMonths(projectedDate, -1);
  const windowEnd   = addDays(windowStart, 14); // 2-week window

  // Status
  let status = 'ok';
  if (pctUsed >= 100) status = 'overdue';
  else if (pctUsed >= 90 || monthsRemaining <= 1) status = 'due_soon';
  else if (pctUsed >= 75 || monthsRemaining <= 4) status = 'watch';

  return {
    ...record,
    hoursRemaining,
    cyclesRemaining,
    pctUsed,
    pctUsedHours,
    pctUsedCycles,
    monthsRemaining,
    projectedDate,
    windowStart,
    windowEnd,
    computedStatus: status,
    sinceOH,
    cyclesSinceOH,
  };
}

// ── Progress Ring ────────────────────────────────────────────────────────────
function UsageRing({ pct, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const stroke = (pct / 100) * circ;
  return (
    <svg width="72" height="72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${stroke} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

// ── Forecast Card ────────────────────────────────────────────────────────────
function ForecastCard({ record, onEdit }) {
  const f     = computeForecast(record);
  const cfg   = COMPONENT_CFG[f.component] || COMPONENT_CFG.engine_1;
  const stCfg = STATUS_CFG[f.computedStatus] || STATUS_CFG.ok;
  const Icon  = cfg.icon;
  const barColor = f.pctUsed >= 100 ? '#ef4444' : f.pctUsed >= 90 ? '#f97316' : f.pctUsed >= 75 ? '#f59e0b' : '#22c55e';

  return (
    <div className={cn('rounded-2xl border bg-[#141922] p-5 space-y-4 transition-all', stCfg.border)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${cfg.color}22` }}>
            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-extrabold text-white font-mono">{f.aircraft_tail}</span>
              <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', stCfg.bg, stCfg.color)}>
                {stCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-400">{cfg.label} · {cfg.ataHint}</p>
            <p className="text-[10px] text-gray-600">{f.aircraft_type || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(record)}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Usage bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-gray-500 font-bold uppercase tracking-widest">Usage Since Last OH</span>
          <span className="font-extrabold" style={{ color: barColor }}>{f.pctUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, f.pctUsed)}%`, background: barColor }} />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0d1117] rounded-xl px-3 py-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Hours Remaining</p>
          <p className="text-lg font-extrabold text-white font-mono">
            {f.hoursRemaining.toLocaleString()}
            <span className="text-xs text-gray-500 ml-1">hrs</span>
          </p>
          <p className="text-[10px] text-gray-600">{f.sinceOH.toLocaleString()} / {(record.overhaul_interval_hours || DEFAULT_INTERVALS[record.component]?.hours).toLocaleString()} used</p>
        </div>
        <div className="bg-[#0d1117] rounded-xl px-3 py-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Cycles Remaining</p>
          <p className="text-lg font-extrabold text-white font-mono">
            {f.cyclesRemaining.toLocaleString()}
            <span className="text-xs text-gray-500 ml-1">cyc</span>
          </p>
          <p className="text-[10px] text-gray-600">{f.cyclesSinceOH.toLocaleString()} / {(record.overhaul_interval_cycles || DEFAULT_INTERVALS[record.component]?.cycles).toLocaleString()} used</p>
        </div>
      </div>

      {/* Projected date + window */}
      <div className={cn('rounded-xl border px-3 py-2.5 flex items-start gap-2.5', stCfg.border, stCfg.bg)}>
        <CalendarDays className={cn('w-4 h-4 flex-shrink-0 mt-0.5', stCfg.color)} />
        <div className="flex-1">
          <p className={cn('text-xs font-extrabold', stCfg.color)}>
            {f.computedStatus === 'overdue'
              ? 'OVERDUE — Maintenance Required Immediately'
              : `~${f.monthsRemaining} month${f.monthsRemaining !== 1 ? 's' : ''} remaining`}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Projected due: <span className="font-bold text-white">{format(f.projectedDate, 'MMM yyyy')}</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Suggested window: <span className="text-gray-300 font-bold">{format(f.windowStart, 'MMM d')} – {format(f.windowEnd, 'MMM d, yyyy')}</span>
          </p>
        </div>
      </div>

      {f.last_overhaul_date && (
        <p className="text-[10px] text-gray-600">
          Last OH: {f.last_overhaul_date} · {f.last_overhaul_hours?.toLocaleString()} hrs
        </p>
      )}
    </div>
  );
}

// ── Add / Edit Form ──────────────────────────────────────────────────────────
function ForecastForm({ aircraft, initial, onSave, onClose, isPending }) {
  const [form, setForm] = useState(initial || {
    aircraft_tail: '',
    aircraft_type: '',
    component: 'engine_1',
    total_flight_hours: '',
    total_cycles: '',
    overhaul_interval_hours: '',
    overhaul_interval_cycles: '',
    last_overhaul_date: '',
    last_overhaul_hours: '',
    last_overhaul_cycles: '',
    avg_hours_per_month: 350,
    avg_cycles_per_month: 250,
    notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const defaults = DEFAULT_INTERVALS[form.component] || {};

  const handleSave = () => {
    const data = {
      ...form,
      total_flight_hours: Number(form.total_flight_hours),
      total_cycles: Number(form.total_cycles),
      overhaul_interval_hours: Number(form.overhaul_interval_hours) || defaults.hours,
      overhaul_interval_cycles: Number(form.overhaul_interval_cycles) || defaults.cycles,
      last_overhaul_hours: Number(form.last_overhaul_hours) || 0,
      last_overhaul_cycles: Number(form.last_overhaul_cycles) || 0,
      avg_hours_per_month: Number(form.avg_hours_per_month) || 350,
      avg_cycles_per_month: Number(form.avg_cycles_per_month) || 250,
    };
    onSave(data);
  };

  const inputCls = "w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#141922]">
          <p className="text-sm font-extrabold text-white tracking-wide">
            {initial ? 'EDIT FORECAST RECORD' : 'NEW FORECAST RECORD'}
          </p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Aircraft Tail *</label>
              {aircraft.length > 0 ? (
                <select value={form.aircraft_tail} onChange={e => {
                  const ac = aircraft.find(a => a.tail_number === e.target.value);
                  set('aircraft_tail', e.target.value);
                  if (ac) set('aircraft_type', ac.aircraft_type || '');
                }} className={inputCls}>
                  <option value="">Select…</option>
                  {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
                </select>
              ) : (
                <input value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value.toUpperCase())} placeholder="e.g. N455GJ" className={inputCls} />
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Component *</label>
              <select value={form.component} onChange={e => set('component', e.target.value)} className={inputCls}>
                {Object.entries(COMPONENT_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#141922] rounded-xl px-3 py-2.5 text-xs text-gray-500">
            <span className="font-bold text-gray-400">Default intervals for {COMPONENT_CFG[form.component]?.label}:</span>{' '}
            {defaults.hours?.toLocaleString()} hrs / {defaults.cycles?.toLocaleString()} cycles
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'total_flight_hours',       label: 'Total Flight Hours *',      placeholder: 'e.g. 18500' },
              { key: 'total_cycles',             label: 'Total Cycles *',            placeholder: 'e.g. 14200' },
              { key: 'overhaul_interval_hours',  label: 'Overhaul Interval (hrs)',   placeholder: `Default: ${defaults.hours}` },
              { key: 'overhaul_interval_cycles', label: 'Overhaul Interval (cyc)',   placeholder: `Default: ${defaults.cycles}` },
              { key: 'last_overhaul_hours',      label: 'Hours at Last OH',          placeholder: 'e.g. 0' },
              { key: 'last_overhaul_cycles',     label: 'Cycles at Last OH',         placeholder: 'e.g. 0' },
              { key: 'avg_hours_per_month',      label: 'Avg Hours/Month',           placeholder: '350' },
              { key: 'avg_cycles_per_month',     label: 'Avg Cycles/Month',          placeholder: '250' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
                <input type="number" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} className={inputCls} />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Last Overhaul Date</label>
            <input type="date" value={form.last_overhaul_date} onChange={e => set('last_overhaul_date', e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Shop visit notes, EO references…" className={inputCls + ' resize-none'} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
          <button onClick={handleSave} disabled={isPending || !form.aircraft_tail || !form.total_flight_hours}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {isPending ? 'Saving…' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MaintenanceForecastModule({ aircraft }) {
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const qc = useQueryClient();

  const { data: forecasts = [], isLoading, refetch } = useQuery({
    queryKey: ['mx-forecasts'],
    queryFn: () => base44.entities.MaintenanceForecast.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceForecast.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mx-forecasts'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceForecast.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mx-forecasts'] }); setEditRecord(null); },
  });

  const enriched = useMemo(() => forecasts.map(computeForecast), [forecasts]);

  const overdue  = enriched.filter(r => r.computedStatus === 'overdue').length;
  const dueSoon  = enriched.filter(r => r.computedStatus === 'due_soon').length;
  const watch    = enriched.filter(r => r.computedStatus === 'watch').length;
  const ok       = enriched.filter(r => r.computedStatus === 'ok').length;

  const filtered = filterStatus === 'all' ? enriched : enriched.filter(r => r.computedStatus === filterStatus);

  // Chart data — months remaining by component
  const chartData = enriched
    .sort((a, b) => a.monthsRemaining - b.monthsRemaining)
    .slice(0, 10)
    .map(r => ({
      name: `${r.aircraft_tail}\n${COMPONENT_CFG[r.component]?.label}`,
      months: r.monthsRemaining,
      color: r.pctUsed >= 100 ? '#ef4444' : r.pctUsed >= 90 ? '#f97316' : r.pctUsed >= 75 ? '#f59e0b' : '#22c55e',
    }));

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Overdue',   value: overdue,  color: 'text-red-400',    bg: 'bg-red-600/20',    key: 'overdue',  icon: AlertTriangle },
          { label: 'Due Soon',  value: dueSoon,  color: 'text-orange-400', bg: 'bg-orange-600/20', key: 'due_soon', icon: Clock },
          { label: 'Watch',     value: watch,    color: 'text-yellow-400', bg: 'bg-yellow-600/20', key: 'watch',    icon: TrendingUp },
          { label: 'OK',        value: ok,       color: 'text-green-400',  bg: 'bg-green-600/20',  key: 'ok',       icon: CheckCircle },
        ].map(({ label, value, color, bg, key, icon: Icon }) => (
          <button key={key} onClick={() => setFilterStatus(f => f === key ? 'all' : key)}
            className={cn('rounded-2xl border bg-[#141922] p-4 flex items-center gap-3 text-left transition-all hover:border-white/20',
              filterStatus === key ? 'border-white/30' : 'border-white/10')}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-extrabold text-white">
          {forecasts.length} Component{forecasts.length !== 1 ? 's' : ''} Tracked
        </p>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="w-9 h-9 rounded-xl bg-[#141922] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Component
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {(overdue > 0 || dueSoon > 0) && (
        <div className={cn('rounded-2xl border px-5 py-4 flex items-start gap-3',
          overdue > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-orange-900/20 border-orange-500/30')}>
          <AlertTriangle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', overdue > 0 ? 'text-red-400' : 'text-orange-400')} />
          <div>
            <p className={cn('text-sm font-extrabold', overdue > 0 ? 'text-red-400' : 'text-orange-400')}>
              {overdue > 0
                ? `${overdue} component${overdue > 1 ? 's' : ''} OVERDUE — immediate shop visit required`
                : `${dueSoon} component${dueSoon > 1 ? 's' : ''} approaching maintenance limit`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Review suggested maintenance windows below and coordinate with MCC.</p>
          </div>
        </div>
      )}

      {/* Time Remaining Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-extrabold text-white mb-1">Time Remaining — All Components (Months)</p>
          <p className="text-xs text-gray-500 mb-4">Sorted by urgency · limiting parameter (hours or cycles)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit="mo" />
              <Tooltip {...tooltipStyle} formatter={(v) => [`${v} months`, 'Remaining']} />
              <Bar dataKey="months" radius={[4,4,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="text-center text-gray-600 py-16">Loading forecast data…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#141922] border border-white/10 py-16 text-center space-y-3">
          <Wrench className="w-12 h-12 text-gray-700 mx-auto" />
          <p className="text-gray-400 font-extrabold">No forecast records found</p>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">Add component tracking records to begin forecasting maintenance windows and time-remaining calculations.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            + Add First Component
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered
            .sort((a, b) => {
              const order = { overdue: 0, due_soon: 1, watch: 2, ok: 3 };
              return (order[a.computedStatus] ?? 2) - (order[b.computedStatus] ?? 2);
            })
            .map(r => (
              <ForecastCard key={r.id} record={r} onEdit={setEditRecord} />
            ))}
        </div>
      )}

      {showForm && (
        <ForecastForm
          aircraft={aircraft}
          onSave={(data) => createMutation.mutate(data)}
          onClose={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {editRecord && (
        <ForecastForm
          aircraft={aircraft}
          initial={editRecord}
          onSave={(data) => updateMutation.mutate({ id: editRecord.id, data })}
          onClose={() => setEditRecord(null)}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}