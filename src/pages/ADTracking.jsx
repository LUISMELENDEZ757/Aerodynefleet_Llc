import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ShieldCheck, AlertTriangle, CheckCircle, Clock,
  Plus, RefreshCw, Search, X, Send, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleGuard from '@/components/rbac/RoleGuard';

const STATUS_CFG = {
  open:               { label: 'OPEN',           color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30', icon: Clock },
  overdue:            { label: 'OVERDUE',         color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',   icon: AlertTriangle },
  complied:           { label: 'COMPLIED',        color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30', icon: CheckCircle },
  not_applicable:     { label: 'N/A',             color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',  icon: X },
  deferred_alt_means: { label: 'ALT MEANS',       color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30',  icon: FileText },
};

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

function NewADModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({
    ad_number: '', issuing_authority: 'FAA', title: '', description: '',
    aircraft_tail: '', aircraft_type: '', ata_chapter: '', ad_type: 'one_time',
    compliance_method: 'inspection', effective_date: '', compliance_due_date: '',
    compliance_due_hours: '', compliance_due_cycles: '',
    recurring_interval_hours: '', recurring_interval_days: '',
    status: 'open', reference_document: '', notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...form,
      compliance_due_hours: form.compliance_due_hours ? Number(form.compliance_due_hours) : undefined,
      compliance_due_cycles: form.compliance_due_cycles ? Number(form.compliance_due_cycles) : undefined,
      recurring_interval_hours: form.recurring_interval_hours ? Number(form.recurring_interval_hours) : undefined,
      recurring_interval_days: form.recurring_interval_days ? Number(form.recurring_interval_days) : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#141922] border border-white/10 rounded-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">Add Airworthiness Directive</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">AD Number *</label>
              <input required value={form.ad_number} onChange={e => set('ad_number', e.target.value)} placeholder="e.g. 2024-12-05" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Issuing Authority</label>
              <select value={form.issuing_authority} onChange={e => set('issuing_authority', e.target.value)} className={inputCls}>
                {['FAA','EASA','TCCA','ANAC','CAAC','DGCA','CASA','Other'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">AD Title *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Subject of the AD" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Required corrective action…" className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft Tail *</label>
              <select required value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} placeholder="e.g. 27" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">AD Type</label>
              <select value={form.ad_type} onChange={e => set('ad_type', e.target.value)} className={inputCls}>
                <option value="one_time">One-Time</option>
                <option value="recurring">Recurring</option>
                <option value="on_condition">On Condition</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Effective Date *</label>
              <input type="date" required value={form.effective_date} onChange={e => set('effective_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Compliance Due Date</label>
              <input type="date" value={form.compliance_due_date} onChange={e => set('compliance_due_date', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Due Hours</label>
              <input type="number" value={form.compliance_due_hours} onChange={e => set('compliance_due_hours', e.target.value)} placeholder="Flight hours" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Due Cycles</label>
              <input type="number" value={form.compliance_due_cycles} onChange={e => set('compliance_due_cycles', e.target.value)} placeholder="Cycles" className={inputCls} />
            </div>
          </div>
          {form.ad_type === 'recurring' && (
            <div className="grid grid-cols-2 gap-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-3">
              <div>
                <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">Repeat Interval (Hours)</label>
                <input type="number" value={form.recurring_interval_hours} onChange={e => set('recurring_interval_hours', e.target.value)} placeholder="e.g. 1000" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">Repeat Interval (Days)</label>
                <input type="number" value={form.recurring_interval_days} onChange={e => set('recurring_interval_days', e.target.value)} placeholder="e.g. 365" className={inputCls} />
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Reference Document (AMM / SB)</label>
            <input value={form.reference_document} onChange={e => set('reference_document', e.target.value)} placeholder="e.g. AMM 27-11-00 Rev 5" className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Add AD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ADCard({ ad, onComply }) {
  const cfg = STATUS_CFG[ad.status] || STATUS_CFG.open;
  const Icon = cfg.icon;
  const isOverdue = ad.compliance_due_date && new Date(ad.compliance_due_date) < new Date() && ad.status === 'open';

  return (
    <div className={cn('bg-[#141922] border rounded-2xl p-4 space-y-2', isOverdue ? 'border-red-500/40' : cfg.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', isOverdue ? 'text-red-400' : cfg.color)} />
          <div className="min-w-0">
            <p className="text-xs font-mono font-extrabold text-primary">{ad.ad_number}</p>
            <p className="text-sm font-bold text-white leading-snug mt-0.5">{ad.title}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
            {isOverdue ? 'OVERDUE' : cfg.label}
          </span>
          <span className="text-[10px] text-gray-500">{ad.issuing_authority}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span className="font-mono text-white font-bold">{ad.aircraft_tail}</span>
        {ad.ata_chapter && <span>ATA {ad.ata_chapter}</span>}
        <span className="capitalize">{ad.ad_type?.replace('_', ' ')}</span>
        {ad.compliance_due_date && (
          <span className={cn(isOverdue ? 'text-red-400 font-bold' : '')}>
            Due: {new Date(ad.compliance_due_date).toLocaleDateString()}
          </span>
        )}
        {ad.compliance_due_hours && <span>Due: {ad.compliance_due_hours}h</span>}
        {ad.reference_document && <span>Ref: {ad.reference_document}</span>}
      </div>

      {ad.description && <p className="text-xs text-gray-400 leading-snug">{ad.description}</p>}

      {ad.status === 'open' || isOverdue ? (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onComply(ad)}
            className="flex-1 py-2 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-extrabold hover:bg-green-600/30 transition-colors flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Record Compliance
          </button>
        </div>
      ) : ad.status === 'complied' && (
        <div className="flex items-center gap-2 text-[10px] text-green-400">
          <CheckCircle className="w-3 h-3" />
          Complied {ad.complied_date ? `on ${new Date(ad.complied_date).toLocaleDateString()}` : ''} {ad.technician_name ? `by ${ad.technician_name}` : ''}
          {ad.next_due_date && <span className="text-amber-400 ml-2">Next due: {new Date(ad.next_due_date).toLocaleDateString()}</span>}
        </div>
      )}
    </div>
  );
}

function ComplyModal({ ad, onClose, onConfirm }) {
  const [form, setForm] = useState({
    complied_date: new Date().toISOString().split('T')[0],
    complied_hours: '', complied_cycles: '',
    technician_name: '', technician_cert: '',
    inspector_name: '', inspector_cert: '',
    work_order_ref: '', parts_replaced: '', notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(ad.id, {
      ...form,
      status: 'complied',
      complied_hours: form.complied_hours ? Number(form.complied_hours) : undefined,
      complied_cycles: form.complied_cycles ? Number(form.complied_cycles) : undefined,
      next_due_date: ad.recurring_interval_days
        ? new Date(new Date(form.complied_date).getTime() + ad.recurring_interval_days * 86400000).toISOString().split('T')[0]
        : undefined,
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">Record AD Compliance</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="bg-green-900/20 border border-green-500/20 rounded-xl px-4 py-2">
            <p className="text-xs font-bold text-green-400">{ad.ad_number} — {ad.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{ad.aircraft_tail}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Compliance Date *</label>
              <input type="date" required value={form.complied_date} onChange={e => set('complied_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">At Hours</label>
              <input type="number" value={form.complied_hours} onChange={e => set('complied_hours', e.target.value)} placeholder="Flight hours" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">At Cycles</label>
              <input type="number" value={form.complied_cycles} onChange={e => set('complied_cycles', e.target.value)} placeholder="Cycles" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Technician Name *</label>
              <input required value={form.technician_name} onChange={e => set('technician_name', e.target.value)} placeholder="A&P Technician" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">A&P Cert #</label>
              <input value={form.technician_cert} onChange={e => set('technician_cert', e.target.value)} placeholder="Certificate number" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">RII Inspector Name</label>
              <input value={form.inspector_name} onChange={e => set('inspector_name', e.target.value)} placeholder="If RII required" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Inspector Cert #</label>
              <input value={form.inspector_cert} onChange={e => set('inspector_cert', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Work Order / Log Page Ref</label>
            <input value={form.work_order_ref} onChange={e => set('work_order_ref', e.target.value)} placeholder="WO# or LP#" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Parts Replaced (P/N, S/N)</label>
            <input value={form.parts_replaced} onChange={e => set('parts_replaced', e.target.value)} placeholder="e.g. P/N 65-48253-2, S/N 12345" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Confirm Compliance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ADTracking() {
  const [showNew, setShowNew] = useState(false);
  const [complyAd, setComplyAd] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ['airworthiness-directives'],
    queryFn: () => base44.entities.AirworthinessDirective.list('-effective_date', 500),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['ad-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AirworthinessDirective.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['airworthiness-directives'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AirworthinessDirective.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['airworthiness-directives'] }),
  });

  const overdue = ads.filter(a => a.compliance_due_date && new Date(a.compliance_due_date) < new Date() && a.status === 'open');
  const open    = ads.filter(a => a.status === 'open' && !overdue.find(o => o.id === a.id));
  const complied = ads.filter(a => a.status === 'complied');

  const filtered = ads.filter(ad => {
    const matchStatus = statusFilter === 'all' || ad.status === statusFilter || (statusFilter === 'overdue' && overdue.find(o => o.id === ad.id));
    const matchSearch = !search || ad.ad_number?.includes(search) || ad.title?.toLowerCase().includes(search.toLowerCase()) || ad.aircraft_tail?.includes(search.toUpperCase());
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
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Airworthiness Directives</h1>
              <p className="text-xs text-blue-400 tracking-widest uppercase">FAA / EASA AD Compliance Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <RoleGuard roles={['admin','mcc_supervisor','engineer','technician','inspector_rii']}>
              <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-500">
                <Plus className="w-4 h-4" /> Add AD
              </button>
            </RoleGuard>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'OVERDUE', value: overdue.length, color: 'text-red-400', filter: 'overdue' },
            { label: 'OPEN', value: open.length, color: 'text-amber-400', filter: 'open' },
            { label: 'COMPLIED', value: complied.length, color: 'text-green-400', filter: 'complied' },
            { label: 'TOTAL', value: ads.length, color: 'text-white', filter: 'all' },
          ].map(kpi => (
            <button key={kpi.filter} onClick={() => setStatusFilter(kpi.filter)}
              className={cn('bg-secondary/50 rounded-xl px-3 py-2 text-left transition-all hover:bg-secondary',
                statusFilter === kpi.filter && 'ring-1 ring-primary')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              <p className={cn('text-2xl font-black mt-1', kpi.color)}>{kpi.value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search AD number, title, tail…"
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {isLoading ? <div className="text-center text-muted-foreground py-12">Loading…</div>
        : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No ADs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ad => (
              <ADCard key={ad.id} ad={ad} onComply={setComplyAd} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewADModal aircraft={aircraft} onClose={() => setShowNew(false)} onCreate={(d) => createMutation.mutate(d)} />}
      {complyAd && <ComplyModal ad={complyAd} onClose={() => setComplyAd(null)} onConfirm={(id, data) => updateMutation.mutate({ id, data })} />}
    </div>
  );
}