import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, FileCheck, Plus, Search, RefreshCw, CheckCircle,
  Clock, X, Send, Shield, AlertTriangle, Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleGuard from '@/components/rbac/RoleGuard';
import { useRBAC } from '@/components/rbac/RoleGuard';

const STATUS_CFG = {
  draft:              { label: 'DRAFT',             color: 'text-gray-400',   bg: 'bg-gray-500/15',   border: 'border-gray-500/20' },
  pending_rii:        { label: 'PENDING RII',        color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  pending_supervisor: { label: 'PENDING SUPERVISOR', color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30' },
  released:           { label: 'RELEASED',           color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
  rejected:           { label: 'REJECTED',           color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  voided:             { label: 'VOIDED',             color: 'text-gray-500',   bg: 'bg-gray-500/10',   border: 'border-gray-500/10' },
};

const MAINT_TYPES = [
  'line_maintenance','scheduled_inspection','unscheduled_repair','major_repair',
  'major_alteration','ad_compliance','component_replacement','annual_inspection',
  '100hr_inspection','other'
];

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

function CRSCard({ crs, onSign, onPrint }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[crs.status] || STATUS_CFG.draft;
  const { userRole } = useRBAC();

  return (
    <div className={cn('bg-card border rounded-2xl overflow-hidden transition-all', cfg.border)}>
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
            <span className="text-xs font-mono font-bold text-primary">{crs.crs_number || `CRS-${crs.id?.slice(-6)}`}</span>
            <span className="text-xs font-mono font-bold text-foreground">{crs.aircraft_tail}</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{crs.description_of_work}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-muted-foreground">
            <span className="capitalize">{crs.maintenance_type?.replace(/_/g, ' ')}</span>
            {crs.station && <span>📍 {crs.station}</span>}
            <span>RTS: {crs.return_to_service_date}</span>
            {crs.certifying_technician_name && <span>Tech: {crs.certifying_technician_name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onPrint(crs)} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center">
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center">
            {expanded ? <X className="w-3.5 h-3.5 text-muted-foreground" /> : <Plus className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Work details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {crs.regulatory_reference && <div><p className="text-muted-foreground text-[10px] uppercase tracking-widest">Regulatory Ref</p><p className="text-foreground font-semibold">{crs.regulatory_reference}</p></div>}
            {crs.work_order_ref && <div><p className="text-muted-foreground text-[10px] uppercase tracking-widest">Work Order</p><p className="text-foreground font-semibold">{crs.work_order_ref}</p></div>}
            {crs.parts_replaced && <div className="col-span-2"><p className="text-muted-foreground text-[10px] uppercase tracking-widest">Parts Replaced</p><p className="text-foreground">{crs.parts_replaced}</p></div>}
            {crs.limitations && <div className="col-span-2"><p className="text-muted-foreground text-[10px] uppercase tracking-widest">Limitations</p><p className="text-amber-400">{crs.limitations}</p></div>}
          </div>

          {/* Signatures */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Signature Chain</p>
            <div className="space-y-1.5">
              {[
                { label: 'Certifying Technician', name: crs.certifying_technician_name, cert: crs.certifying_technician_cert, signed_at: crs.certifying_technician_signed_at },
                crs.rii_required && { label: 'RII Inspector', name: crs.rii_inspector_name, cert: crs.rii_inspector_cert, signed_at: crs.rii_signed_at },
                { label: 'Supervisor', name: crs.supervisor_name, cert: crs.supervisor_cert, signed_at: crs.supervisor_signed_at },
              ].filter(Boolean).map((sig, i) => (
                <div key={i} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-xs',
                  sig.signed_at ? 'bg-green-900/20 border border-green-500/20' : 'bg-secondary/50 border border-border')}>
                  {sig.signed_at ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> : <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  <span className="text-muted-foreground w-36">{sig.label}</span>
                  {sig.signed_at
                    ? <span className="text-green-400 font-bold">{sig.name} ({sig.cert}) — {new Date(sig.signed_at).toLocaleString()}</span>
                    : <span className="text-muted-foreground italic">Pending</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons based on status + role */}
          {crs.status === 'draft' && (
            <RoleGuard roles={['admin','mcc_supervisor','engineer','technician','inspector_rii']}>
              <button onClick={() => onSign(crs, 'tech')}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 flex items-center justify-center gap-2">
                <Send className="w-3.5 h-3.5" /> Certifying Technician Sign-Off
              </button>
            </RoleGuard>
          )}
          {crs.status === 'pending_rii' && (
            <RoleGuard roles={['admin','mcc_supervisor','inspector_rii']}>
              <button onClick={() => onSign(crs, 'rii')}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-extrabold hover:bg-violet-500 flex items-center justify-center gap-2">
                <Shield className="w-3.5 h-3.5" /> RII Inspector Sign-Off
              </button>
            </RoleGuard>
          )}
          {crs.status === 'pending_supervisor' && (
            <RoleGuard roles={['admin','mcc_supervisor']}>
              <button onClick={() => onSign(crs, 'supervisor')}
                className="w-full py-2.5 rounded-xl bg-green-600 text-white text-xs font-extrabold hover:bg-green-500 flex items-center justify-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" /> Supervisor Release
              </button>
            </RoleGuard>
          )}
        </div>
      )}
    </div>
  );
}

function SignModal({ crs, sigType, onClose, onConfirm }) {
  const [name, setName] = useState('');
  const [cert, setCert] = useState('');
  const labelMap = { tech: 'Certifying Technician', rii: 'RII Inspector', supervisor: 'Supervisor' };
  const now = new Date().toISOString();

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = { signed_at: now };
    if (sigType === 'tech') {
      updates.certifying_technician_name = name;
      updates.certifying_technician_cert = cert;
      updates.certifying_technician_signed_at = now;
      updates.status = crs.rii_required ? 'pending_rii' : 'pending_supervisor';
    } else if (sigType === 'rii') {
      updates.rii_inspector_name = name;
      updates.rii_inspector_cert = cert;
      updates.rii_signed_at = now;
      updates.status = 'pending_supervisor';
    } else {
      updates.supervisor_name = name;
      updates.supervisor_cert = cert;
      updates.supervisor_signed_at = now;
      updates.status = 'released';
    }
    onConfirm(crs.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-extrabold text-foreground text-sm">{labelMap[sigType]} Sign-Off</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Full Name *</label>
            <input required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Certificate / License #</label>
            <input value={cert} onChange={e => setCert(e.target.value)} placeholder="e.g. AMT-12345" className={inputCls} />
          </div>
          <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2 text-[10px] text-amber-400">
            ⚠ By signing, you certify the described maintenance was performed per applicable regulations and the aircraft is airworthy for release to service.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90">Sign & Release</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewCRSModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({
    aircraft_tail: '', aircraft_type: '', station: '', maintenance_type: 'line_maintenance',
    description_of_work: '', regulatory_reference: '14 CFR 43.9',
    parts_replaced: '', work_start_date: new Date().toISOString().split('T')[0],
    work_end_date: '', return_to_service_date: new Date().toISOString().split('T')[0],
    return_to_service_time: '', total_manhours: '', rii_required: false, limitations: '',
    next_inspection_due: '', notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const seq = String(Math.floor(Math.random() * 9000) + 1000);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...form,
      crs_number: `CRS-${new Date().getFullYear()}-${seq}`,
      total_manhours: form.total_manhours ? Number(form.total_manhours) : undefined,
      status: 'draft',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-extrabold text-foreground text-sm uppercase tracking-wide">New Certificate of Release to Service</p>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Aircraft *</label>
              <select required value={form.aircraft_tail} onChange={e => {
                const ac = aircraft.find(a => a.tail_number === e.target.value);
                setForm(p => ({ ...p, aircraft_tail: e.target.value, aircraft_type: ac?.aircraft_type || '' }));
              }} className={inputCls}>
                <option value="">Select tail…</option>
                {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Maintenance Type</label>
            <select value={form.maintenance_type} onChange={e => set('maintenance_type', e.target.value)} className={inputCls}>
              {MAINT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Description of Work *</label>
            <textarea required rows={4} value={form.description_of_work} onChange={e => set('description_of_work', e.target.value)} placeholder="Full description of maintenance performed per 14 CFR 43.9…" className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Regulatory Reference</label>
              <input value={form.regulatory_reference} onChange={e => set('regulatory_reference', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Work Order / Log Page Ref</label>
              <input value={form.work_order_ref} onChange={e => set('work_order_ref', e.target.value)} placeholder="WO# or LP#0001" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Parts Replaced (P/N, S/N)</label>
            <input value={form.parts_replaced} onChange={e => set('parts_replaced', e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Work Start</label>
              <input type="date" value={form.work_start_date} onChange={e => set('work_start_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Work End</label>
              <input type="date" value={form.work_end_date} onChange={e => set('work_end_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Return to Service *</label>
              <input type="date" required value={form.return_to_service_date} onChange={e => set('return_to_service_date', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">RTS Time (UTC)</label>
              <input value={form.return_to_service_time} onChange={e => set('return_to_service_time', e.target.value)} placeholder="e.g. 14:30Z" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Total Man-Hours</label>
              <input type="number" min="0" step="0.5" value={form.total_manhours} onChange={e => set('total_manhours', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Operational Limitations (if any)</label>
            <input value={form.limitations} onChange={e => set('limitations', e.target.value)} placeholder="e.g. No ETOPS until next C-check" className={inputCls} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer bg-violet-900/20 border border-violet-500/20 rounded-xl px-4 py-3">
            <input type="checkbox" checked={form.rii_required} onChange={e => set('rii_required', e.target.checked)} className="w-4 h-4 rounded" />
            <div>
              <p className="text-sm font-bold text-violet-300">Requires RII Sign-Off</p>
              <p className="text-[10px] text-violet-400/70">Required Inspection Item — inspector must sign before supervisor release</p>
            </div>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 flex items-center justify-center gap-2">
              <FileCheck className="w-4 h-4" /> Create CRS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const handlePrint = (crs) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>CRS ${crs.crs_number}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;margin:40px;color:#111}
    h1{font-size:18px;border-bottom:2px solid #000;padding-bottom:8px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
    .field label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;display:block}
    .field span{font-size:13px;font-weight:700}
    .sig-box{border:1px solid #ddd;border-radius:8px;padding:12px;margin:6px 0}
    .sig-box.signed{border-color:#22c55e;background:#f0fdf4}
    .footer{margin-top:40px;font-size:10px;color:#aaa;border-top:1px solid #ddd;padding-top:8px}
    </style></head><body>
    <h1>CERTIFICATE OF RELEASE TO SERVICE</h1>
    <p style="color:#666;font-size:11px">14 CFR Part 43.9 / Part 43.11 | Aerodyne Fleet LLC</p>
    <div class="grid">
      <div class="field"><label>CRS Number</label><span>${crs.crs_number || '—'}</span></div>
      <div class="field"><label>Status</label><span>${crs.status?.toUpperCase()}</span></div>
      <div class="field"><label>Aircraft Tail</label><span>${crs.aircraft_tail}</span></div>
      <div class="field"><label>Aircraft Type</label><span>${crs.aircraft_type || '—'}</span></div>
      <div class="field"><label>Station</label><span>${crs.station || '—'}</span></div>
      <div class="field"><label>Return to Service</label><span>${crs.return_to_service_date} ${crs.return_to_service_time || ''}</span></div>
      <div class="field"><label>Maintenance Type</label><span>${crs.maintenance_type?.replace(/_/g,' ')}</span></div>
      <div class="field"><label>Work Order Ref</label><span>${crs.work_order_ref || '—'}</span></div>
    </div>
    <div class="field" style="margin:16px 0"><label>Description of Work Performed</label><p style="margin-top:4px">${crs.description_of_work}</p></div>
    <div class="field" style="margin:16px 0"><label>Regulatory Reference</label><span>${crs.regulatory_reference || '—'}</span></div>
    ${crs.parts_replaced ? `<div class="field" style="margin:16px 0"><label>Parts Replaced</label><p>${crs.parts_replaced}</p></div>` : ''}
    ${crs.limitations ? `<div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:6px;padding:10px;margin:16px 0"><strong>⚠ Limitations:</strong> ${crs.limitations}</div>` : ''}
    <h2 style="font-size:13px;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px">SIGNATURE CHAIN</h2>
    <div class="sig-box ${crs.certifying_technician_signed_at ? 'signed' : ''}">
      <strong>Certifying Technician:</strong> ${crs.certifying_technician_name || 'PENDING'} | Cert: ${crs.certifying_technician_cert || '—'} | Signed: ${crs.certifying_technician_signed_at ? new Date(crs.certifying_technician_signed_at).toLocaleString() : 'UNSIGNED'}
    </div>
    ${crs.rii_required ? `<div class="sig-box ${crs.rii_signed_at ? 'signed' : ''}"><strong>RII Inspector:</strong> ${crs.rii_inspector_name || 'PENDING'} | Cert: ${crs.rii_inspector_cert || '—'} | Signed: ${crs.rii_signed_at ? new Date(crs.rii_signed_at).toLocaleString() : 'UNSIGNED'}</div>` : ''}
    <div class="sig-box ${crs.supervisor_signed_at ? 'signed' : ''}">
      <strong>Supervisor Release:</strong> ${crs.supervisor_name || 'PENDING'} | Cert: ${crs.supervisor_cert || '—'} | Signed: ${crs.supervisor_signed_at ? new Date(crs.supervisor_signed_at).toLocaleString() : 'UNSIGNED'}
    </div>
    <div class="footer">Printed: ${new Date().toLocaleString()} | Aerodyne Fleet LLC | This document is an electronic record per 14 CFR Part 43.</div>
    </body></html>
  `);
  win.document.close();
  win.print();
  win.close();
};

export default function CertificateOfRelease() {
  const [showNew, setShowNew] = useState(false);
  const [sigModal, setSigModal] = useState(null); // { crs, sigType }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: crsList = [], isLoading, refetch } = useQuery({
    queryKey: ['crs-list'],
    queryFn: () => base44.entities.CertificateOfRelease.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['crs-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CertificateOfRelease.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crs-list'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CertificateOfRelease.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crs-list'] }),
  });

  const draft = crsList.filter(c => c.status === 'draft').length;
  const pending = crsList.filter(c => c.status === 'pending_rii' || c.status === 'pending_supervisor').length;
  const released = crsList.filter(c => c.status === 'released').length;

  const filtered = crsList.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch = !search || c.aircraft_tail?.includes(search.toUpperCase()) ||
      c.crs_number?.includes(search) || c.description_of_work?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Certificate of Release to Service</h1>
              <p className="text-xs text-green-400 tracking-widest uppercase">14 CFR 43.9 · Aircraft RTS Documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <RoleGuard roles={['admin','mcc_supervisor','engineer','technician','inspector_rii']}>
              <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-extrabold hover:bg-green-500">
                <Plus className="w-4 h-4" /> New CRS
              </button>
            </RoleGuard>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Draft', value: draft, color: 'text-gray-400', filter: 'draft' },
            { label: 'Pending', value: pending, color: 'text-amber-400', filter: 'pending_supervisor' },
            { label: 'Released', value: released, color: 'text-green-400', filter: 'released' },
            { label: 'Total', value: crsList.length, color: 'text-white', filter: 'all' },
          ].map(kpi => (
            <button key={kpi.filter} onClick={() => setStatusFilter(kpi.filter)}
              className={cn('bg-secondary/50 rounded-xl px-3 py-2 text-left hover:bg-secondary transition-all', statusFilter === kpi.filter && 'ring-1 ring-primary')}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              <p className={cn('text-2xl font-black mt-1', kpi.color)}>{kpi.value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-4 max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tail, CRS number, description…"
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {isLoading ? <div className="text-center text-muted-foreground py-12">Loading…</div>
        : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileCheck className="w-12 h-12 text-muted-foreground/20 mx-auto" />
            <p className="text-muted-foreground">No CRS documents found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(crs => (
              <CRSCard key={crs.id} crs={crs}
                onSign={(c, t) => setSigModal({ crs: c, sigType: t })}
                onPrint={handlePrint} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewCRSModal aircraft={aircraft} onClose={() => setShowNew(false)} onCreate={(d) => createMutation.mutate(d)} />}
      {sigModal && (
        <SignModal
          crs={sigModal.crs}
          sigType={sigModal.sigType}
          onClose={() => setSigModal(null)}
          onConfirm={(id, data) => updateMutation.mutate({ id, data })}
        />
      )}
    </div>
  );
}