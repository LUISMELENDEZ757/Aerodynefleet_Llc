import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plane, AlertTriangle, CheckCircle, Wrench, Clock, User, Send,
  ChevronRight, X, Plus, Zap, Shield, Activity, RefreshCw,
  FileText, ArrowLeft, Circle, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Zulu Clock ──────────────────────────────────────────────────────────────
function ZuluClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = n => String(n).padStart(2, '0');
  return (
    <span className="font-mono text-lg font-black text-primary tracking-widest">
      {pad(time.getUTCHours())}:{pad(time.getUTCMinutes())}:{pad(time.getUTCSeconds())} Z
    </span>
  );
}

// ─── Status configs ───────────────────────────────────────────────────────────
const FAULT_SEVERITY = {
  warning:  { color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/40',    dot: 'bg-red-500'    },
  caution:  { color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/40', dot: 'bg-amber-500' },
  advisory: { color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/40',  dot: 'bg-blue-500'   },
  memo:     { color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20',  dot: 'bg-gray-500'   },
};

const DISC_STATUS = {
  OPEN:         { label: 'OPEN',         color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/40'    },
  IN_PROGRESS:  { label: 'IN PROGRESS',  color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/40' },
  PENDING_RII:  { label: 'PENDING RII',  color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/40' },
  CLOSED:       { label: 'CLOSED',       color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/40' },
};

const AC_STATUS = {
  active:      { label: 'RELEASED',    color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/40'  },
  oos:         { label: 'OOS',         color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/40'      },
  maintenance: { label: 'IN WORK',     color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/40'  },
  retired:     { label: 'RETIRED',     color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/20'    },
};

const inputCls = "w-full bg-[#1a2235] border border-white/15 rounded-2xl px-5 py-4 text-base text-white placeholder-gray-600 outline-none focus:border-primary transition-colors";

// ─── Log Completion Modal ─────────────────────────────────────────────────────
function LogCompletionModal({ aircraft, discrepancy, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    corrective_action: '',
    technician_name: '',
    technician_id: '',
    parts_used: '',
    rii_required: discrepancy?.rii_required || false,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const closeMutation = useMutation({
    mutationFn: () => base44.entities.LogbookEntry.update(discrepancy.id, {
      discrepancy_status: form.rii_required ? 'PENDING_RII' : 'CLOSED',
      corrective_action: form.corrective_action,
      corrected_by: form.technician_name,
      corrected_by_id: form.technician_id,
      parts_used: form.parts_used,
      is_cleared: !form.rii_required,
      cleared_by: !form.rii_required ? form.technician_name : undefined,
      cleared_date: !form.rii_required ? new Date().toISOString().split('T')[0] : undefined,
      work_completed_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tablet-discrepancies'] });
      qc.invalidateQueries({ queryKey: ['tablet-faults'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141922]">
          <div>
            <p className="text-lg font-extrabold text-white tracking-wide">LOG COMPLETION</p>
            <p className="text-sm text-gray-400">{aircraft?.tail_number} · {discrepancy?.ata_chapter ? `ATA ${discrepancy.ata_chapter}` : 'Discrepancy'}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Original discrepancy */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1.5">Original Discrepancy</p>
            <p className="text-sm text-foreground leading-relaxed">{discrepancy?.description}</p>
          </div>

          {/* Corrective action */}
          <div>
            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Corrective Action Taken *</label>
            <textarea rows={4} value={form.corrective_action} onChange={e => set('corrective_action', e.target.value)}
              placeholder="Describe corrective action performed per AMM reference…"
              className={inputCls + ' resize-none text-base'} />
          </div>

          {/* Parts used */}
          <div>
            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Parts Used (optional)</label>
            <input value={form.parts_used} onChange={e => set('parts_used', e.target.value)}
              placeholder="e.g. P/N 65B27040-1, S/N 001234"
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Technician Name *</label>
              <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)}
                placeholder="Full Name" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">A&P Cert / Emp #</label>
              <input value={form.technician_id} onChange={e => set('technician_id', e.target.value)}
                placeholder="AMT-XXXXX" className={inputCls} />
            </div>
          </div>

          {/* RII Toggle */}
          <button type="button" onClick={() => set('rii_required', !form.rii_required)}
            className={cn('w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all',
              form.rii_required ? 'bg-purple-900/30 border-purple-500/50' : 'bg-secondary/30 border-white/15')}>
            <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
              form.rii_required ? 'bg-purple-500 border-purple-500' : 'border-gray-600')}>
              {form.rii_required && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
            <div>
              <p className={cn('text-sm font-extrabold', form.rii_required ? 'text-purple-300' : 'text-foreground')}>Requires RII Sign-Off</p>
              <p className="text-xs text-muted-foreground">Required Inspection Item — inspector must countersign</p>
            </div>
          </button>
        </div>

        <div className="px-6 py-5 border-t border-white/10 flex gap-4">
          <button onClick={onClose}
            className="flex-1 h-14 rounded-2xl border border-white/15 text-base font-bold text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            disabled={!form.corrective_action.trim() || !form.technician_name.trim() || closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
            className={cn('flex-1 h-14 rounded-2xl text-base font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-40',
              form.rii_required ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white')}>
            {closeMutation.isPending ? <><RefreshCw className="w-5 h-5 animate-spin" /> Saving…</> :
              form.rii_required ? <><Shield className="w-5 h-5" /> Submit for RII</> : <><CheckCircle className="w-5 h-5" /> Complete Task</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Discrepancy Modal ─────────────────────────────────────────────────────
function NewDiscrepancyModal({ aircraft, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    description: '',
    ata_chapter: '',
    technician_name: '',
    technician_id: '',
    station: aircraft?.base_station || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => base44.entities.LogbookEntry.create({
      aircraft_tail: aircraft.tail_number,
      entry_type: 'discrepancy',
      discrepancy_status: 'OPEN',
      description: form.description,
      ata_chapter: form.ata_chapter,
      technician_name: form.technician_name,
      technician_id: form.technician_id,
      station: form.station,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tablet-discrepancies'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-amber-900/20">
          <div>
            <p className="text-lg font-extrabold text-amber-400 tracking-wide">NEW DISCREPANCY</p>
            <p className="text-sm text-gray-400">{aircraft?.tail_number} · {aircraft?.aircraft_type}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Discrepancy Description *</label>
            <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the fault or discrepancy found…"
              className={inputCls + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
                placeholder="e.g. 32-41" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())}
                placeholder="KEWR" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Technician Name *</label>
              <input value={form.technician_name} onChange={e => set('technician_name', e.target.value)}
                placeholder="Full Name" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">A&P Cert / Emp #</label>
              <input value={form.technician_id} onChange={e => set('technician_id', e.target.value)}
                placeholder="AMT-XXXXX" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-white/10 flex gap-4">
          <button onClick={onClose}
            className="flex-1 h-14 rounded-2xl border border-white/15 text-base font-bold text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            disabled={!form.description.trim() || !form.technician_name.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex-1 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-base font-extrabold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors">
            {mutation.isPending ? <><RefreshCw className="w-5 h-5 animate-spin" /> Logging…</> : <><Send className="w-5 h-5" /> Log Discrepancy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Aircraft Detail View ─────────────────────────────────────────────────────
function AircraftDetailView({ aircraft, onBack }) {
  const [completingDisc, setCompletingDisc] = useState(null);
  const [showNewDisc, setShowNewDisc] = useState(false);
  const [activeTab, setActiveTab] = useState('discrepancies');
  const qc = useQueryClient();

  const { data: discrepancies = [] } = useQuery({
    queryKey: ['tablet-discrepancies', aircraft.tail_number],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: aircraft.tail_number }),
    refetchInterval: 15000,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['tablet-faults', aircraft.tail_number],
    queryFn: () => base44.entities.FaultMessage.filter({ aircraft_tail: aircraft.tail_number, status: 'active' }),
    refetchInterval: 15000,
  });

  const { data: mel = [] } = useQuery({
    queryKey: ['tablet-mel', aircraft.tail_number],
    queryFn: () => base44.entities.MELItem.filter({ aircraft_tail: aircraft.tail_number }),
    refetchInterval: 30000,
  });

  const startWorkMutation = useMutation({
    mutationFn: (discId) => base44.entities.LogbookEntry.update(discId, {
      discrepancy_status: 'IN_PROGRESS',
      work_started_at: new Date().toISOString(),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tablet-discrepancies', aircraft.tail_number] }),
  });

  const clearFaultMutation = useMutation({
    mutationFn: (faultId) => base44.entities.FaultMessage.update(faultId, { status: 'cleared', cleared_at: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tablet-faults', aircraft.tail_number] }),
  });

  const openDiscs = discrepancies.filter(d => d.entry_type === 'discrepancy' && d.discrepancy_status !== 'CLOSED');
  const acStatus = AC_STATUS[aircraft.status] || AC_STATUS.active;

  const TABS = [
    { id: 'discrepancies', label: 'Discrepancies', count: openDiscs.length, color: 'text-red-400' },
    { id: 'faults', label: 'Active Faults', count: faults.length, color: 'text-amber-400' },
    { id: 'mel', label: 'MEL Items', count: mel.filter(m => m.status !== 'cleared').length, color: 'text-blue-400' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Aircraft Header */}
      <div className="bg-[#141922] border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors active:scale-95">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-2xl font-black text-white font-mono tracking-wide">{aircraft.tail_number}</p>
              <span className={cn('text-xs font-extrabold px-3 py-1 rounded-full border', acStatus.bg, acStatus.color)}>{acStatus.label}</span>
            </div>
            <p className="text-sm text-gray-400">{aircraft.aircraft_type} · {aircraft.base_station || '—'} · {aircraft.engine_type || '—'}</p>
          </div>
          <button onClick={() => setShowNewDisc(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 text-black font-extrabold text-sm hover:bg-amber-400 transition-colors active:scale-95">
            <Plus className="w-5 h-5" /> New Discrepancy
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Open Discrepancies', value: openDiscs.length, color: openDiscs.length > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Active Faults', value: faults.length, color: faults.length > 0 ? 'text-amber-400' : 'text-green-400' },
            { label: 'MEL Items', value: mel.filter(m => m.status !== 'cleared').length, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0d1117] rounded-2xl p-3 text-center">
              <p className={cn('text-2xl font-black', color)}>{value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-[#0d1117]">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex-1 py-4 text-sm font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
              activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-300')}>
            {tab.label}
            {tab.count > 0 && (
              <span className={cn('text-xs font-black px-2 py-0.5 rounded-full', activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-white/10 text-gray-400')}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">

        {/* Discrepancies Tab */}
        {activeTab === 'discrepancies' && (
          openDiscs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CheckCircle className="w-16 h-16 text-green-500/30" />
              <p className="text-lg font-bold text-gray-500">No Open Discrepancies</p>
              <p className="text-sm text-gray-600">Aircraft is clear for dispatch</p>
            </div>
          ) : openDiscs.map(disc => {
            const dstatus = DISC_STATUS[disc.discrepancy_status] || DISC_STATUS.OPEN;
            return (
              <div key={disc.id} className={cn('bg-[#141922] border rounded-3xl p-5 space-y-3', dstatus.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn('text-[11px] font-extrabold px-2.5 py-1 rounded-full border', dstatus.bg, dstatus.color)}>{dstatus.label}</span>
                      {disc.ata_chapter && <span className="text-[11px] text-gray-500 font-bold">ATA {disc.ata_chapter}</span>}
                      {disc.rii_required && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-400">RII</span>}
                    </div>
                    <p className="text-sm text-white leading-relaxed">{disc.description}</p>
                    {disc.technician_name && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {disc.technician_name}
                        {disc.work_started_at && <span className="text-gray-600">· Started {new Date(disc.work_started_at).toLocaleTimeString()}</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  {disc.discrepancy_status === 'OPEN' && (
                    <button
                      onClick={() => startWorkMutation.mutate(disc.id)}
                      disabled={startWorkMutation.isPending}
                      className="flex-1 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm font-bold hover:bg-amber-500/30 transition-all active:scale-95 disabled:opacity-50">
                      Start Work
                    </button>
                  )}
                  {(disc.discrepancy_status === 'IN_PROGRESS' || disc.discrepancy_status === 'OPEN') && (
                    <button
                      onClick={() => setCompletingDisc(disc)}
                      className="flex-1 h-12 rounded-2xl bg-green-600/20 border border-green-500/40 text-green-400 text-sm font-bold hover:bg-green-600/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Log Completion
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Faults Tab */}
        {activeTab === 'faults' && (
          faults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Activity className="w-16 h-16 text-green-500/30" />
              <p className="text-lg font-bold text-gray-500">No Active Faults</p>
            </div>
          ) : faults.map(fault => {
            const fsev = FAULT_SEVERITY[fault.severity] || FAULT_SEVERITY.caution;
            return (
              <div key={fault.id} className={cn('bg-[#141922] border rounded-3xl p-5 space-y-3', fsev.bg)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('w-3 h-3 rounded-full flex-shrink-0 mt-1', fsev.dot)} />
                    <div>
                      <p className="text-base font-extrabold text-white">{fault.fault_code}</p>
                      <p className="text-xs text-gray-400">{fault.system} {fault.ata_chapter ? `· ATA ${fault.ata_chapter}` : ''}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-extrabold px-2.5 py-1 rounded-full border uppercase', fsev.bg, fsev.color)}>
                    {fault.severity}
                  </span>
                </div>
                {fault.description && <p className="text-sm text-gray-300 leading-relaxed">{fault.description}</p>}
                {fault.detected_at && <p className="text-xs text-gray-600">Detected: {new Date(fault.detected_at).toLocaleString()}</p>}
                <button
                  onClick={() => clearFaultMutation.mutate(fault.id)}
                  disabled={clearFaultMutation.isPending}
                  className="w-full h-12 rounded-2xl bg-green-600/20 border border-green-500/40 text-green-400 text-sm font-bold hover:bg-green-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Clear Fault
                </button>
              </div>
            );
          })
        )}

        {/* MEL Tab */}
        {activeTab === 'mel' && (
          mel.filter(m => m.status !== 'cleared').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Shield className="w-16 h-16 text-green-500/30" />
              <p className="text-lg font-bold text-gray-500">No Open MEL Items</p>
            </div>
          ) : mel.filter(m => m.status !== 'cleared').map(item => {
            const isExpiring = item.status === 'expiring_soon';
            const isExpired = item.status === 'expired';
            return (
              <div key={item.id} className={cn('bg-[#141922] border rounded-3xl p-5 space-y-2',
                isExpired ? 'border-red-500/40 bg-red-900/10' : isExpiring ? 'border-amber-500/40 bg-amber-900/10' : 'border-white/10')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('text-xs font-extrabold px-2.5 py-1 rounded-full border',
                        item.category === 'A' ? 'bg-red-500/15 border-red-500/40 text-red-400' :
                        item.category === 'B' ? 'bg-orange-500/15 border-orange-500/40 text-orange-400' :
                        item.category === 'C' ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' :
                        'bg-blue-500/15 border-blue-500/40 text-blue-400')}>
                        CAT {item.category}
                      </span>
                      {item.ata_chapter && <span className="text-xs text-gray-500">ATA {item.ata_chapter}</span>}
                      {isExpired && <span className="text-xs font-bold text-red-400">EXPIRED</span>}
                      {isExpiring && <span className="text-xs font-bold text-amber-400">EXPIRING SOON</span>}
                    </div>
                    <p className="text-sm text-white leading-relaxed">{item.description}</p>
                  </div>
                </div>
                {item.expiry_date && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Expires: {new Date(item.expiry_date).toLocaleDateString()}
                  </p>
                )}
                {item.flight_restrictions && (
                  <p className="text-xs text-amber-400 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {item.flight_restrictions}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {completingDisc && (
        <LogCompletionModal
          aircraft={aircraft}
          discrepancy={completingDisc}
          onClose={() => setCompletingDisc(null)}
        />
      )}
      {showNewDisc && (
        <NewDiscrepancyModal
          aircraft={aircraft}
          onClose={() => setShowNewDisc(false)}
        />
      )}
    </div>
  );
}

// ─── Aircraft Card ─────────────────────────────────────────────────────────────
function AircraftCard({ aircraft, discCount, faultCount, onSelect }) {
  const acStatus = AC_STATUS[aircraft.status] || AC_STATUS.active;
  const hasIssues = discCount > 0 || faultCount > 0;

  return (
    <button onClick={() => onSelect(aircraft)}
      className={cn('w-full bg-[#141922] border rounded-3xl p-6 text-left transition-all active:scale-[0.98] hover:border-primary/40',
        hasIssues ? 'border-amber-500/30' : 'border-white/10')}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-2xl font-black text-white font-mono tracking-wide mb-1">{aircraft.tail_number}</p>
          <p className="text-sm text-gray-400">{aircraft.aircraft_type}</p>
          <p className="text-xs text-gray-600 mt-0.5">{aircraft.base_station || '—'}</p>
        </div>
        <span className={cn('text-xs font-extrabold px-3 py-1.5 rounded-full border', acStatus.bg, acStatus.color)}>
          {acStatus.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className={cn('rounded-2xl p-2.5 text-center', discCount > 0 ? 'bg-red-500/10' : 'bg-white/5')}>
          <p className={cn('text-xl font-black', discCount > 0 ? 'text-red-400' : 'text-gray-600')}>{discCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Discrepanc.</p>
        </div>
        <div className={cn('rounded-2xl p-2.5 text-center', faultCount > 0 ? 'bg-amber-500/10' : 'bg-white/5')}>
          <p className={cn('text-xl font-black', faultCount > 0 ? 'text-amber-400' : 'text-gray-600')}>{faultCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Faults</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-2.5 text-center flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
      </div>
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LineMxTablet() {
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [techName, setTechName] = useState('');
  const [showIdPrompt, setShowIdPrompt] = useState(true);

  const { data: aircraft = [], refetch } = useQuery({
    queryKey: ['tablet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 30000,
  });

  const { data: allDiscrepancies = [] } = useQuery({
    queryKey: ['tablet-all-discs'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }),
    refetchInterval: 30000,
  });

  const { data: allFaults = [] } = useQuery({
    queryKey: ['tablet-all-faults'],
    queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }),
    refetchInterval: 30000,
  });

  // Count discrepancies & faults per tail
  const discByTail = allDiscrepancies.reduce((acc, d) => {
    if (d.discrepancy_status !== 'CLOSED') acc[d.aircraft_tail] = (acc[d.aircraft_tail] || 0) + 1;
    return acc;
  }, {});
  const faultsByTail = allFaults.reduce((acc, f) => {
    acc[f.aircraft_tail] = (acc[f.aircraft_tail] || 0) + 1;
    return acc;
  }, {});

  const filtered = aircraft.filter(a => {
    const matchSearch = !search || a.tail_number?.toLowerCase().includes(search.toLowerCase()) || a.aircraft_type?.toLowerCase().includes(search.toLowerCase()) || a.base_station?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter || (statusFilter === 'issues' && (discByTail[a.tail_number] > 0 || faultsByTail[a.tail_number] > 0));
    return matchSearch && matchStatus;
  });

  // ID prompt screen
  if (showIdPrompt) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#141922] border border-white/15 rounded-3xl p-8 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white">LINE MX TABLET</h1>
            <p className="text-sm text-gray-500 mt-1">Aerodyne Fleet LLC · Line Maintenance</p>
          </div>
          <div>
            <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-3">Your Name / Employee ID</label>
            <input
              value={techName}
              onChange={e => setTechName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && techName.trim() && setShowIdPrompt(false)}
              placeholder="First Last or AMT-XXXXX"
              className={inputCls + ' text-center text-lg'}
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowIdPrompt(false)}
            disabled={!techName.trim()}
            className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-extrabold disabled:opacity-40 transition-all active:scale-95">
            Sign In to Tablet
          </button>
          <p className="text-center text-xs text-gray-600">All actions will be logged under your credentials per FAA 14 CFR §43.9</p>
        </div>
      </div>
    );
  }

  if (selectedAircraft) {
    return (
      <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#0a0e18] border-b border-white/10 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="text-sm font-extrabold text-white uppercase tracking-widest">Line MX Tablet</span>
          </div>
          <ZuluClock />
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">{techName}</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <AircraftDetailView aircraft={selectedAircraft} onBack={() => setSelectedAircraft(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Header */}
      <div className="bg-[#0a0e18] border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-extrabold text-white tracking-widest uppercase">Line MX Tablet</p>
            <p className="text-xs text-gray-500">Aerodyne Fleet LLC</p>
          </div>
        </div>
        <ZuluClock />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{techName}</span>
          </div>
          <button onClick={() => refetch()} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setShowIdPrompt(true)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Fleet Status Bar */}
      <div className="bg-[#141922] border-b border-white/10 px-6 py-3 flex items-center gap-6">
        {[
          { label: 'Fleet', value: aircraft.length, color: 'text-white' },
          { label: 'Active', value: aircraft.filter(a => a.status === 'active').length, color: 'text-green-400' },
          { label: 'In Work', value: aircraft.filter(a => a.status === 'maintenance').length, color: 'text-amber-400' },
          { label: 'OOS', value: aircraft.filter(a => a.status === 'oos').length, color: 'text-red-400' },
          { label: 'Open Discrepancies', value: allDiscrepancies.filter(d => d.discrepancy_status !== 'CLOSED').length, color: 'text-red-400' },
          { label: 'Active Faults', value: allFaults.length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn('text-lg font-black', color)}>{value}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="px-6 py-4 flex gap-3 bg-[#0d1117] border-b border-white/10">
        <div className="flex-1 flex items-center gap-3 bg-[#141922] border border-white/10 rounded-2xl px-5 py-3">
          <Radio className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tail, type, or station…"
            className="flex-1 bg-transparent text-base text-white placeholder-gray-600 outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-500" /></button>}
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'issues', label: '⚠ Issues' },
            { id: 'oos', label: 'OOS' },
            { id: 'maintenance', label: 'In Work' },
            { id: 'active', label: 'Active' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setStatusFilter(id)}
              className={cn('px-4 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95',
                statusFilter === id ? 'bg-primary text-primary-foreground' : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Aircraft Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Plane className="w-16 h-16 text-gray-700" />
            <p className="text-lg font-bold text-gray-500">No aircraft found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(a => (
              <AircraftCard
                key={a.id}
                aircraft={a}
                discCount={discByTail[a.tail_number] || 0}
                faultCount={faultsByTail[a.tail_number] || 0}
                onSelect={setSelectedAircraft}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-[#0a0e18] px-6 py-3 text-center">
        <p className="text-[10px] text-gray-700 font-mono">AERODYNE FLEET LLC · LINE MX TABLET · FAA 14 CFR §43.9 COMPLIANT</p>
      </div>
    </div>
  );
}