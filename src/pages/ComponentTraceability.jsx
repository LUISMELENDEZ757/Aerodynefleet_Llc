import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Package, Search, Plus, RefreshCw, AlertTriangle,
  CheckCircle, X, Send, FileText, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleGuard from '@/components/rbac/RoleGuard';
import { useAutoMeNumber } from '@/hooks/useAutoMeNumber';
import { issueMeNumber } from '@/lib/meNumberingClient';
import { CLASS_CODES } from '../../base44/shared/meNumbering';

const STATUS_CFG = {
  serviceable:   { color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  installed:     { color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  unserviceable: { color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40' },
  in_repair:     { color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  scrapped:      { color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20' },
  quarantine:    { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
};

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

function ComponentCard({ comp }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[comp.status] || STATUS_CFG.serviceable;

  const hoursRemaining = comp.life_limit_hours && comp.total_time_hours
    ? comp.life_limit_hours - comp.total_time_hours : null;
  const isNearLimit = hoursRemaining !== null && hoursRemaining < 500;
  const isOverLimit = hoursRemaining !== null && hoursRemaining < 0;

  return (
    <div className={cn('bg-[#141922] border rounded-2xl overflow-hidden', isOverLimit ? 'border-red-500/50' : isNearLimit ? 'border-amber-500/40' : cfg.border)}>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-white">{comp.part_name}</p>
            <div className="flex flex-wrap gap-2 mt-1 text-[10px]">
              <span className="font-mono text-primary">P/N: {comp.part_number}</span>
              <span className="font-mono text-gray-300">S/N: {comp.serial_number}</span>
              {comp.ata_chapter && <span className="text-gray-500">ATA {comp.ata_chapter}</span>}
              {comp.manufacturer && <span className="text-gray-500">{comp.manufacturer}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
              {comp.status?.replace(/_/g, ' ').toUpperCase()}
            </span>
            {comp.is_life_limited && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">LLP</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-[10px] text-gray-500">
          {comp.current_aircraft_tail && <span>Installed on: <span className="text-white font-bold font-mono">{comp.current_aircraft_tail}</span></span>}
          {comp.current_position && <span>Position: <span className="text-white">{comp.current_position}</span></span>}
          {comp.total_time_hours && <span>TSN: <span className="text-white font-bold">{comp.total_time_hours}h</span></span>}
          {comp.total_cycles && <span>CSN: <span className="text-white font-bold">{comp.total_cycles}</span></span>}
        </div>

        {/* Life limit bar */}
        {comp.life_limit_hours && comp.total_time_hours && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className={cn('font-bold', isOverLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-gray-400')}>
                {isOverLimit ? '⚠ LIFE EXCEEDED' : isNearLimit ? '⚠ APPROACHING LIMIT' : 'Life Remaining'}
              </span>
              <span className={cn('font-bold', isOverLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-green-400')}>
                {isOverLimit ? `+${Math.abs(hoursRemaining)}h OVER` : `${hoursRemaining}h remaining`}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all',
                isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-green-500')}
                style={{ width: `${Math.min(100, (comp.total_time_hours / comp.life_limit_hours) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* 8130-3 badge */}
        {comp.form_8130_number && (
          <div className="flex items-center gap-2 text-[10px]">
            <FileText className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 font-bold">FAA 8130-3: {comp.form_8130_number}</span>
            {comp.form_8130_date && <span className="text-gray-500">{new Date(comp.form_8130_date).toLocaleDateString()}</span>}
            {comp.form_8130_issued_by && <span className="text-gray-500">by {comp.form_8130_issued_by}</span>}
          </div>
        )}

        {/* Installation history toggle */}
        {comp.installation_history?.length > 0 && (
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {comp.installation_history.length} installation record{comp.installation_history.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {expanded && comp.installation_history?.length > 0 && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Installation History</p>
          {comp.installation_history.map((h, idx) => (
            <div key={idx} className="flex items-start gap-3 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-white font-bold">{h.aircraft_tail} — {h.position}</p>
                <p className="text-gray-500">
                  Installed: {h.installed_date || '—'} ({h.hours_at_install}h) →
                  Removed: {h.removed_date || 'Current'} {h.hours_at_removal ? `(${h.hours_at_removal}h)` : ''}
                </p>
                {h.reason_for_removal && <p className="text-gray-600">Reason: {h.reason_for_removal}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewComponentModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({
    part_number: '', serial_number: '', part_name: '', me_number: '', ata_chapter: '',
    manufacturer: '', cage_code: '', status: 'serviceable', condition: 'serviceable_used',
    current_aircraft_tail: '', current_position: '',
    total_time_hours: '', total_cycles: '',
    life_limit_hours: '', life_limit_cycles: '',
    overhaul_interval_hours: '', last_overhaul_date: '', last_overhaul_shop: '',
    form_8130_number: '', form_8130_date: '', form_8130_issued_by: '', repair_station_cert: '',
    is_life_limited: false, notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const { autoGen, setAutoGen, issuing } = useAutoMeNumber(true);
  const [meClass, setMeClass] = useState('9');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      total_time_hours: form.total_time_hours ? Number(form.total_time_hours) : undefined,
      total_cycles: form.total_cycles ? Number(form.total_cycles) : undefined,
      life_limit_hours: form.life_limit_hours ? Number(form.life_limit_hours) : undefined,
      life_limit_cycles: form.life_limit_cycles ? Number(form.life_limit_cycles) : undefined,
      overhaul_interval_hours: form.overhaul_interval_hours ? Number(form.overhaul_interval_hours) : undefined,
      next_overhaul_due_hours: (form.total_time_hours && form.overhaul_interval_hours)
        ? Number(form.total_time_hours) + Number(form.overhaul_interval_hours) : undefined,
      installation_history: form.current_aircraft_tail ? [{
        aircraft_tail: form.current_aircraft_tail,
        position: form.current_position,
        installed_date: new Date().toISOString().split('T')[0],
        hours_at_install: Number(form.total_time_hours) || 0,
      }] : [],
    };
    if (autoGen && !form.me_number.trim() && form.ata_chapter) {
      const num = await issueMeNumber({ number_type: 'me_part', ata: form.ata_chapter, sub: '000', class_code: meClass });
      if (!num) return;
      payload.me_number = num;
    }
    onCreate(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#141922] border border-white/10 rounded-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">Add Tracked Component</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Part Number (P/N) *</label>
              <input required value={form.part_number} onChange={e => set('part_number', e.target.value)} className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Serial Number (S/N) *</label>
              <input required value={form.serial_number} onChange={e => set('serial_number', e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Part Name / Description *</label>
            <input required value={form.part_name} onChange={e => set('part_name', e.target.value)} className={inputCls} /></div>
          {/* Aerodyne M&E Number auto-allocation */}
          <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Aerodyne M&E Number</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={autoGen} onChange={e => setAutoGen(e.target.checked)} className="w-3.5 h-3.5 accent-amber-500" />
                <span className="text-[9px] font-bold text-amber-500 uppercase">Auto-gen</span>
              </label>
            </div>
            <input value={autoGen ? '' : form.me_number} disabled={autoGen} onChange={e => set('me_number', e.target.value)}
              placeholder={autoGen ? `${form.ata_chapter || 'NN'}-000-${meClass}-XXXX` : 'Internal M&E part number'}
              className={inputCls + (autoGen ? ' opacity-60' : '')} />
            {autoGen && (
              <div>
                <label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Class Code</label>
                <select value={meClass} onChange={e => setMeClass(e.target.value)} className={inputCls}>
                  {Object.entries(CLASS_CODES).map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} placeholder="e.g. 32" className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="Parker, Safran…" className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">CAGE Code</label>
              <input value={form.cage_code} onChange={e => set('cage_code', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                {['serviceable','installed','unserviceable','in_repair','scrapped','quarantine'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Condition</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value)} className={inputCls}>
                {['new','overhauled','serviceable_used','as_removed','repaired'].map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Current Aircraft</label>
              <select value={form.current_aircraft_tail} onChange={e => set('current_aircraft_tail', e.target.value)} className={inputCls}>
                <option value="">Not installed</option>
                {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
              </select></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Position</label>
              <input value={form.current_position} onChange={e => set('current_position', e.target.value)} placeholder="e.g. Left MLG, Eng 1" className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">TSN (Hours)</label>
              <input type="number" value={form.total_time_hours} onChange={e => set('total_time_hours', e.target.value)} className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">CSN (Cycles)</label>
              <input type="number" value={form.total_cycles} onChange={e => set('total_cycles', e.target.value)} className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Life Limit (Hrs)</label>
              <input type="number" value={form.life_limit_hours} onChange={e => set('life_limit_hours', e.target.value)} className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Life Limit (Cyc)</label>
              <input type="number" value={form.life_limit_cycles} onChange={e => set('life_limit_cycles', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">OH Interval (Hrs)</label>
              <input type="number" value={form.overhaul_interval_hours} onChange={e => set('overhaul_interval_hours', e.target.value)} className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Last Overhaul Date</label>
              <input type="date" value={form.last_overhaul_date} onChange={e => set('last_overhaul_date', e.target.value)} className={inputCls} /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Last OH Shop</label>
              <input value={form.last_overhaul_shop} onChange={e => set('last_overhaul_shop', e.target.value)} className={inputCls} /></div>
          </div>
          {/* 8130-3 Section */}
          <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-3 space-y-3">
            <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">FAA Form 8130-3 Airworthiness Approval Tag</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">8130-3 Tag Number</label>
                <input value={form.form_8130_number} onChange={e => set('form_8130_number', e.target.value)} placeholder="Tag number" className={inputCls} /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Issued Date</label>
                <input type="date" value={form.form_8130_date} onChange={e => set('form_8130_date', e.target.value)} className={inputCls} /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Issued By (DAR/DER/RS)</label>
                <input value={form.form_8130_issued_by} onChange={e => set('form_8130_issued_by', e.target.value)} className={inputCls} /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Repair Station Cert #</label>
                <input value={form.repair_station_cert} onChange={e => set('repair_station_cert', e.target.value)} placeholder="e.g. ABCD123B" className={inputCls} /></div>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('is_life_limited', !form.is_life_limited)}
              className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                form.is_life_limited ? 'bg-primary border-primary' : 'border-gray-600')}>
              {form.is_life_limited && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm text-white">This is a Life-Limited Part (LLP)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={issuing} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" /> {issuing ? 'Allocating…' : 'Add Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ComponentTraceability() {
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: components = [], isLoading, refetch } = useQuery({
    queryKey: ['tracked-components'],
    queryFn: () => base44.entities.TrackedComponent.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['tc-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TrackedComponent.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tracked-components'] }),
  });

  const llps = components.filter(c => c.is_life_limited);
  const nearLimit = components.filter(c => c.life_limit_hours && c.total_time_hours && (c.life_limit_hours - c.total_time_hours) < 500);
  const unserviceable = components.filter(c => c.status === 'unserviceable' || c.status === 'quarantine');

  const filtered = components.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch = !search ||
      c.part_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.part_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.current_aircraft_tail?.includes(search.toUpperCase()) ||
      c.form_8130_number?.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Component Traceability</h1>
              <p className="text-xs text-purple-400 tracking-widest uppercase">Birth-to-Death · 8130-3 · LLP Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <RoleGuard roles={['admin','mcc_supervisor','engineer','technician','inspector_rii']}>
              <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-extrabold hover:bg-purple-500">
                <Plus className="w-4 h-4" /> Add Component
              </button>
            </RoleGuard>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total', value: components.length, color: 'text-white', filter: 'all' },
            { label: 'LLPs', value: llps.length, color: 'text-purple-400', filter: 'installed' },
            { label: 'Near Limit', value: nearLimit.length, color: 'text-amber-400', filter: 'serviceable' },
            { label: 'Unserviceable', value: unserviceable.length, color: 'text-red-400', filter: 'unserviceable' },
          ].map(kpi => (
            <button key={kpi.filter} onClick={() => setStatusFilter(kpi.filter)}
              className={cn('bg-secondary/50 rounded-xl px-3 py-2 text-left hover:bg-secondary transition-all',
                statusFilter === kpi.filter && 'ring-1 ring-primary')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              <p className={cn('text-2xl font-black mt-1', kpi.color)}>{kpi.value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 max-w-4xl mx-auto">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search P/N, S/N, part name, tail, 8130-3…"
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none">
            <option value="all">All Statuses</option>
            {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>

        {isLoading ? <div className="text-center text-muted-foreground py-12">Loading…</div>
        : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No components found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(comp => <ComponentCard key={comp.id} comp={comp} />)}
          </div>
        )}
      </div>

      {showNew && <NewComponentModal aircraft={aircraft} onClose={() => setShowNew(false)} onCreate={(d) => createMutation.mutate(d)} />}
    </div>
  );
}