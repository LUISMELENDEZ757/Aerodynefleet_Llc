import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Plus, Search, AlertTriangle, CheckCircle,
  Package, X, Edit2, Trash2, Activity,
  ChevronDown, RefreshCw, Upload, FileCheck, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Fuel System', 'Ignition & Start', 'Oil System', 'Accessory Gearbox',
  'Turbine Section', 'Compressor Section', 'Fan & Inlet',
  'Exhaust & Thrust Reverser', 'Electrical', 'Bleed Air', 'Other'
];

const ENGINE_POSITIONS = ['#1 (Left)', '#2 (Right)', '#3 (Center)', '#4 (Right Outer)', 'APU'];

const STATUS_CFG = {
  installed:    { label: 'INSTALLED',     bg: 'bg-green-600',  text: 'text-green-400' },
  serviceable:  { label: 'SERVICEABLE',   bg: 'bg-blue-600',   text: 'text-blue-400' },
  unserviceable:{ label: 'UNSERVICEABLE', bg: 'bg-red-700',    text: 'text-red-400' },
  on_order:     { label: 'ON ORDER',      bg: 'bg-amber-600',  text: 'text-amber-400' },
  scrapped:     { label: 'SCRAPPED',      bg: 'bg-gray-700',   text: 'text-gray-400' },
};

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors';
const labelCls = 'text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5';

// ── Life Limit Helpers ────────────────────────────────────────────────────────
function getLifeStatus(current, limit) {
  if (!limit || current == null) return null;
  const pct = (current / limit) * 100;
  if (pct >= 100) return { label: 'EXPIRED',  color: 'text-red-400',   barColor: 'bg-red-500',   pct: 100 };
  if (pct >= 90)  return { label: 'CRITICAL', color: 'text-red-400',   barColor: 'bg-red-500',   pct };
  if (pct >= 75)  return { label: 'WARNING',  color: 'text-amber-400', barColor: 'bg-amber-500', pct };
  return             { label: 'OK',       color: 'text-green-400', barColor: 'bg-green-500', pct };
}

function LifeBar({ current, limit, label }) {
  const status = getLifeStatus(current, limit);
  if (!status) return (
    <div>
      <p className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</p>
      <p className="text-xs text-gray-600 mt-0.5">No limit set</p>
    </div>
  );
  const remaining = Math.max(0, limit - current);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</p>
        <span className={cn('text-[9px] font-extrabold', status.color)}>{status.label}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
        <div className={cn('h-full rounded-full', status.barColor)} style={{ width: `${Math.min(status.pct, 100)}%` }} />
      </div>
      <div className="flex justify-between text-[9px] text-gray-600">
        <span>{current?.toLocaleString()} used</span>
        <span>{remaining?.toLocaleString()} remaining</span>
      </div>
    </div>
  );
}

// ── Tag Document Uploader ─────────────────────────────────────────────────────
function TagDocumentUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

  return (
    <label className={cn(
      'flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-dashed px-3 py-2.5 text-sm font-bold transition-colors',
      uploading
        ? 'border-primary/40 text-primary bg-primary/5'
        : 'border-white/20 text-gray-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5'
    )}>
      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      {uploading ? 'Uploading…' : value ? 'Replace File' : 'Choose File'}
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" className="hidden" onChange={handleFile} disabled={uploading} />
    </label>
  );
}

// ── Part Form Modal ───────────────────────────────────────────────────────────
function PartModal({ part, aircraft, onClose, onSave, isSaving }) {
  const isEdit = !!part?.id;
  const [form, setForm] = useState({
    aircraft_tail: '',
    part_name: '',
    part_number: '',
    serial_number: '',
    part_category: 'Other',
    ata_chapter: '',
    engine_position: '#1 (Left)',
    status: 'installed',
    manufacturer: '',
    station: '',
    installation_date: '',
    removal_date: '',
    total_cycles_since_new: '',
    cycles_since_overhaul: '',
    total_hours_since_new: '',
    hours_since_overhaul: '',
    cycle_life_limit: '',
    hour_life_limit: '',
    overhaul_interval_cycles: '',
    overhaul_interval_hours: '',
    ad_compliance: '',
    notes: '',
    tag_document_url: '',
    tag_document_type: '8130-3',
    ...(part || {}),
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = { ...form };
    ['total_cycles_since_new','cycles_since_overhaul','total_hours_since_new','hours_since_overhaul',
     'cycle_life_limit','hour_life_limit','overhaul_interval_cycles','overhaul_interval_hours'].forEach(k => {
      clean[k] = clean[k] !== '' ? Number(clean[k]) : undefined;
    });
    onSave(clean);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-start justify-center p-4 overflow-y-auto pt-16">
      <div className="w-full max-w-2xl bg-[#141922] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-white uppercase tracking-wide">
              {isEdit ? 'Edit Part Record' : 'Add New Part'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Part Identity */}
          <div>
            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-3">Part Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Part Name *</label>
                <input value={form.part_name} onChange={e => set('part_name', e.target.value)} required placeholder="e.g. High Pressure Fuel Pump" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Part Number (P/N) *</label>
                <input value={form.part_number} onChange={e => set('part_number', e.target.value)} required placeholder="e.g. 1593M92G01" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Serial Number (S/N) *</label>
                <input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} required placeholder="e.g. ATC-00293411" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.part_category} onChange={e => set('part_category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>ATA Chapter</label>
                <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} placeholder="e.g. 73" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Manufacturer / OEM</label>
                <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Parker Hannifin" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Installation */}
          <div>
            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-3">Installation</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Aircraft Tail</label>
                <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} className={inputCls}>
                  <option value="">— Uninstalled / Stock —</option>
                  {Object.entries(
                    aircraft.reduce((acc, a) => {
                      const type = a.aircraft_type || 'Unassigned';
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(a);
                      return acc;
                    }, {})
                  ).map(([type, planes]) => (
                    <optgroup key={type} label={type}>
                      {planes.map(a => (
                        <option key={a.id} value={a.tail_number}>{a.tail_number}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Engine Position</label>
                <select value={form.engine_position} onChange={e => set('engine_position', e.target.value)} className={inputCls}>
                  {ENGINE_POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Installation Date</label>
                <input type="date" value={form.installation_date} onChange={e => set('installation_date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Removal Date</label>
                <input type="date" value={form.removal_date} onChange={e => set('removal_date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Station / Location</label>
                <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="e.g. KEWR" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Cycle / Hour Counts */}
          <div>
            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-3">Cycle & Hour Counts</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Total Cycles Since New (CSN)</label>
                <input type="number" min="0" value={form.total_cycles_since_new} onChange={e => set('total_cycles_since_new', e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cycles Since Overhaul (CSO)</label>
                <input type="number" min="0" value={form.cycles_since_overhaul} onChange={e => set('cycles_since_overhaul', e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Total Hours Since New (HSN)</label>
                <input type="number" min="0" value={form.total_hours_since_new} onChange={e => set('total_hours_since_new', e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hours Since Overhaul (HSO)</label>
                <input type="number" min="0" value={form.hours_since_overhaul} onChange={e => set('hours_since_overhaul', e.target.value)} placeholder="0" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Life Limits */}
          <div>
            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-3">Life Limits</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Cycle Life Limit (LLP)</label>
                <input type="number" min="0" value={form.cycle_life_limit} onChange={e => set('cycle_life_limit', e.target.value)} placeholder="e.g. 20000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hour Life Limit</label>
                <input type="number" min="0" value={form.hour_life_limit} onChange={e => set('hour_life_limit', e.target.value)} placeholder="e.g. 30000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Overhaul Interval (Cycles)</label>
                <input type="number" min="0" value={form.overhaul_interval_cycles} onChange={e => set('overhaul_interval_cycles', e.target.value)} placeholder="e.g. 5000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Overhaul Interval (Hours)</label>
                <input type="number" min="0" value={form.overhaul_interval_hours} onChange={e => set('overhaul_interval_hours', e.target.value)} placeholder="e.g. 7500" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Parts Tag Document Upload */}
          <div>
            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-3">Parts Tag / Release Document</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Document Type</label>
                <select value={form.tag_document_type} onChange={e => set('tag_document_type', e.target.value)} className={inputCls}>
                  <option value="8130-3">FAA Form 8130-3 (Airworthiness Approval Tag)</option>
                  <option value="EASA-Form-1">EASA Form 1</option>
                  <option value="CoC">Certificate of Conformance (CoC)</option>
                  <option value="Work-Order">Work Order / Shop Release</option>
                  <option value="Material-Receipt">Material Receipt / Packing Slip</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Upload Document</label>
                <TagDocumentUploader
                  value={form.tag_document_url}
                  onChange={url => set('tag_document_url', url)}
                />
              </div>
            </div>
            {form.tag_document_url && (
              <div className="mt-2 flex items-center gap-2 bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-2.5">
                <FileCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-400">{form.tag_document_type} Uploaded</p>
                  <a href={form.tag_document_url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-green-300 underline truncate block">View Document ↗</a>
                </div>
                <button type="button" onClick={() => set('tag_document_url', '')} className="text-gray-500 hover:text-red-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* AD / Notes */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>AD Compliance</label>
              <input value={form.ad_compliance} onChange={e => set('ad_compliance', e.target.value)} placeholder="e.g. AD 2022-14-08 — Complied" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional maintenance history or notes…" className={inputCls + ' resize-none'} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> {isSaving ? 'Saving…' : isEdit ? 'Update Part' : 'Add Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Part Row ──────────────────────────────────────────────────────────────────
function PartRow({ part, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[part.status] || STATUS_CFG.installed;
  const cycleStatus = getLifeStatus(part.total_cycles_since_new, part.cycle_life_limit);
  const hourStatus  = getLifeStatus(part.total_hours_since_new, part.hour_life_limit);
  const isAlert = ['EXPIRED','CRITICAL'].includes(cycleStatus?.label) || ['EXPIRED','CRITICAL'].includes(hourStatus?.label);

  return (
    <div className={cn('border rounded-2xl overflow-hidden transition-all', isAlert ? 'border-red-500/40 bg-red-950/10' : 'border-white/10 bg-[#141922]')}>
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors">
        {isAlert && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white truncate">{part.part_name}</p>
          <p className="text-[11px] font-mono text-gray-500 mt-0.5">P/N: {part.part_number} · S/N: {part.serial_number}</p>
        </div>
        <div className="w-28 flex-shrink-0 hidden sm:block">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Aircraft</p>
          <p className="text-sm font-bold text-primary font-mono">{part.aircraft_tail || '—'}</p>
        </div>
        <div className="w-36 flex-shrink-0 hidden md:block">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Category</p>
          <p className="text-xs text-gray-300">{part.part_category}</p>
        </div>
        <div className="w-24 flex-shrink-0 hidden lg:block">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">CSN</p>
          <p className={cn('text-sm font-black', cycleStatus?.color || 'text-white')}>
            {part.total_cycles_since_new?.toLocaleString() ?? '—'}
          </p>
          {part.cycle_life_limit && <p className="text-[9px] text-gray-600">/ {part.cycle_life_limit?.toLocaleString()}</p>}
        </div>
        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full text-white flex-shrink-0', cfg.bg)}>{cfg.label}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-500 flex-shrink-0 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-white/10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {[
              { label: 'Engine Position', value: part.engine_position || '—' },
              { label: 'ATA Chapter',     value: part.ata_chapter || '—' },
              { label: 'Manufacturer',    value: part.manufacturer || '—' },
              { label: 'Station',         value: part.station || '—' },
              { label: 'Installed',       value: part.installation_date ? format(new Date(part.installation_date), 'MMM d, yyyy') : '—' },
              { label: 'Removed',         value: part.removal_date ? format(new Date(part.removal_date), 'MMM d, yyyy') : '—' },
              { label: 'CSO (Cycles)',    value: part.cycles_since_overhaul?.toLocaleString() ?? '—' },
              { label: 'HSN (Hours)',     value: part.total_hours_since_new?.toLocaleString() ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Cycle Life Status</p>
              <LifeBar current={part.total_cycles_since_new} limit={part.cycle_life_limit} label="Total Cycles (LLP Limit)" />
              <LifeBar current={part.cycles_since_overhaul} limit={part.overhaul_interval_cycles} label="Cycles Since Overhaul" />
            </div>
            <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Hour Life Status</p>
              <LifeBar current={part.total_hours_since_new} limit={part.hour_life_limit} label="Total Hours (Hard Limit)" />
              <LifeBar current={part.hours_since_overhaul} limit={part.overhaul_interval_hours} label="Hours Since Overhaul" />
            </div>
          </div>

          {part.tag_document_url && (
            <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-2.5">
              <FileCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest">{part.tag_document_type || '8130-3'} — Parts Release Document</p>
                <a href={part.tag_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-300 underline">View Document ↗</a>
              </div>
            </div>
          )}
          {part.ad_compliance && (
            <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-2.5">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">AD Compliance</p>
              <p className="text-sm text-blue-200">{part.ad_compliance}</p>
            </div>
          )}
          {part.notes && (
            <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Notes</p>
              <p className="text-sm text-gray-300">{part.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(part)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-colors">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => onDelete(part.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-900/40 text-red-400 text-xs font-bold hover:bg-red-900/60 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
      <Icon className={cn('w-5 h-5', color)} />
      <p className={cn('text-4xl font-black tracking-tight', color)}>{value}</p>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PartInventory() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tailFilter, setTailFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const qc = useQueryClient();

  const { data: parts = [], isLoading, refetch } = useQuery({
    queryKey: ['engine-part-inventory'],
    queryFn: () => base44.entities.EnginePartInventory.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EnginePartInventory.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['engine-part-inventory'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EnginePartInventory.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['engine-part-inventory'] }); setEditingPart(null); setShowModal(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EnginePartInventory.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['engine-part-inventory'] }),
  });

  const handleSave = (data) => {
    if (editingPart?.id) {
      updateMutation.mutate({ id: editingPart.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this part record?')) deleteMutation.mutate(id);
  };

  const installedTails = [...new Set(parts.map(p => p.aircraft_tail).filter(Boolean))];

  const filtered = parts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.part_name?.toLowerCase().includes(q) ||
      p.part_number?.toLowerCase().includes(q) ||
      p.serial_number?.toLowerCase().includes(q) ||
      p.aircraft_tail?.toLowerCase().includes(q) ||
      p.manufacturer?.toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'All' || p.part_category === categoryFilter;
    const matchStatus   = statusFilter === 'All'   || p.status === statusFilter;
    const matchTail     = tailFilter === 'All'     || p.aircraft_tail === tailFilter;
    return matchSearch && matchCategory && matchStatus && matchTail;
  });

  const criticalCount = parts.filter(p => {
    const cs = getLifeStatus(p.total_cycles_since_new, p.cycle_life_limit);
    const hs = getLifeStatus(p.total_hours_since_new, p.hour_life_limit);
    return ['CRITICAL','EXPIRED'].includes(cs?.label) || ['CRITICAL','EXPIRED'].includes(hs?.label);
  }).length;

  const warningCount = parts.filter(p => {
    const cs = getLifeStatus(p.total_cycles_since_new, p.cycle_life_limit);
    const hs = getLifeStatus(p.total_hours_since_new, p.hour_life_limit);
    return cs?.label === 'WARNING' || hs?.label === 'WARNING';
  }).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0e18] px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/EngineRemovalInstallation" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-black text-primary tracking-widest uppercase">Engine Part Inventory</h1>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Life-Limited Parts · Serial Number Tracking · Cycle & Hour Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={() => { setEditingPart(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Part
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard icon={Package}       label="Total Parts"        value={parts.length}    color="text-white" />
          <KpiCard icon={CheckCircle}   label="Installed"          value={parts.filter(p => p.status === 'installed').length} color="text-green-400" />
          <KpiCard icon={AlertTriangle} label="Critical / Expired" value={criticalCount}   color={criticalCount > 0 ? 'text-red-400' : 'text-gray-600'} />
          <KpiCard icon={Activity}      label="Nearing Limit"      value={warningCount}    color={warningCount > 0 ? 'text-amber-400' : 'text-gray-600'} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, P/N, S/N, tail…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
          </div>
          <select value={tailFilter} onChange={e => setTailFilter(e.target.value)} className="bg-[#141922] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
            <option value="All">All Tails</option>
            {installedTails.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-[#141922] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#141922] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
            <option value="All">All Statuses</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">Showing {filtered.length} of {parts.length} parts</p>
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/30 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-400">{criticalCount} part{criticalCount > 1 ? 's' : ''} at or beyond life limit</span>
            </div>
          )}
        </div>

        {/* Parts List */}
        {isLoading ? (
          <div className="text-center text-gray-600 py-16">Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package className="w-14 h-14 text-gray-700 mx-auto" />
            <p className="text-gray-400 font-bold">{parts.length === 0 ? 'No parts in inventory' : 'No results match your filters'}</p>
            {parts.length === 0 && (
              <button onClick={() => { setEditingPart(null); setShowModal(true); }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
                + Add First Part
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(part => (
              <PartRow key={part.id} part={part}
                onEdit={p => { setEditingPart(p); setShowModal(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <PartModal
          part={editingPart}
          aircraft={aircraft}
          onClose={() => { setShowModal(false); setEditingPart(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}