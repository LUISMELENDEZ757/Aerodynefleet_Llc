import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, AlertTriangle, CheckCircle, Plus, X, Send, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUPPORT_TYPES = [
  { value: 'troubleshooting', label: 'Troubleshooting', icon: '🔍' },
  { value: 'aog_assist', label: 'AOG Assistance', icon: '🚨', urgent: true },
  { value: 'avionics_support', label: 'Avionics Support', icon: '📡' },
  { value: 'structural_inspection', label: 'Structural Inspection', icon: '🏗️' },
  { value: 'engine_support', label: 'Engine Support', icon: '⚙️' },
  { value: 'systems_test', label: 'Systems Test', icon: '🧪' },
  { value: 'rigging', label: 'Flight Controls Rigging', icon: '🎛️' },
  { value: 'rii_inspection', label: 'RII Inspection', icon: '✅', urgent: true },
];

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-orange-400 bg-orange-500/20', dot: 'bg-orange-500' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400 bg-yellow-500/20', dot: 'bg-yellow-500' },
  resolved: { label: 'Resolved', color: 'text-green-400 bg-green-500/20', dot: 'bg-green-500' },
  escalated: { label: 'Escalated', color: 'text-red-400 bg-red-500/20', dot: 'bg-red-500' },
};

function NewSupportModal({ aircraft, onClose, onCreate }) {
  const [form, setForm] = useState({
    aircraft_tail: '',
    support_type: 'troubleshooting',
    ata_chapter: '',
    description: '',
    station: '',
    specialist: '',
    urgency: 'routine',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const typeDef = SUPPORT_TYPES.find(t => t.value === form.support_type);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-bold text-foreground">Request Technical Support</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Support Type *</label>
            <select value={form.support_type} onChange={e => set('support_type', e.target.value)} required
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
              {SUPPORT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>

          {typeDef?.urgent && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 font-bold">Requires certified specialist — ensure personnel availability before proceeding</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Aircraft Tail *</label>
              <select value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)} required
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select…</option>
                {aircraft.map(a => <option key={a.id} value={a.tail_number}>{a.tail_number}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)}
                placeholder="e.g. 32-41" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())}
                placeholder="KEWR" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Urgency</label>
              <select value={form.urgency} onChange={e => set('urgency', e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="aog">AOG</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Specialist / Engineer</label>
            <input value={form.specialist} onChange={e => set('specialist', e.target.value)}
              placeholder="Name / certification" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Problem Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} required
              placeholder="Describe the technical issue or troubleshooting requirement…"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" disabled={!form.aircraft_tail || !form.description}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SupportCard({ item, onUpdateStatus }) {
  const typeDef = SUPPORT_TYPES.find(t => t.value === item.support_type) || { label: item.support_type, icon: '🔧' };
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;

  return (
    <div className={cn('bg-card border rounded-2xl p-4 space-y-3',
      item.urgency === 'aog' ? 'border-red-500/50' :
      item.urgency === 'urgent' ? 'border-orange-500/40' :
      'border-border')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="text-xl mt-0.5">{typeDef.icon}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{typeDef.label}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span className="font-mono font-bold text-primary">{item.aircraft_tail}</span>
              {item.ata_chapter && <span>· ATA {item.ata_chapter}</span>}
              {item.station && <span>· {item.station}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusCfg.color)}>
            {statusCfg.label}
          </span>
          {item.urgency !== 'routine' && (
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded',
              item.urgency === 'aog' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400')}>
              {item.urgency.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>

      {item.specialist && (
        <p className="text-xs text-muted-foreground">Specialist: <span className="text-foreground font-semibold">{item.specialist}</span></p>
      )}

      {item.status !== 'resolved' && (
        <div className="flex gap-2 pt-1">
          {item.status === 'open' && (
            <button onClick={() => onUpdateStatus(item.id, 'in_progress')}
              className="flex-1 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/30">
              Start
            </button>
          )}
          <button onClick={() => onUpdateStatus(item.id, 'resolved')}
            className="flex-1 py-1.5 rounded-lg bg-green-600/20 text-green-400 text-xs font-bold hover:bg-green-600/30">
            Resolve
          </button>
          {item.status === 'open' && (
            <button onClick={() => onUpdateStatus(item.id, 'escalated')}
              className="flex-1 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-bold hover:bg-red-600/30">
              Escalate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TechSupportPanel({ aircraft = [] }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['tech-support-requests'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }, '-created_date', 200),
    select: (data) => data
      .filter(e => e.description?.includes('[TECH-SUPPORT]'))
      .map(e => {
        const meta = JSON.parse(e.notes || '{}');
        return {
          id: e.id,
          aircraft_tail: e.aircraft_tail,
          support_type: meta.support_type || 'troubleshooting',
          ata_chapter: e.ata_chapter,
          description: e.description.replace('[TECH-SUPPORT] ', ''),
          station: e.station,
          specialist: e.technician_name,
          urgency: meta.urgency || 'routine',
          status: meta.status || 'open',
        };
      }),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (form) => base44.entities.LogbookEntry.create({
      aircraft_tail: form.aircraft_tail,
      entry_type: 'discrepancy',
      ata_chapter: form.ata_chapter,
      station: form.station,
      description: `[TECH-SUPPORT] ${form.description}`,
      technician_name: form.specialist,
      notes: JSON.stringify({ support_type: form.support_type, urgency: form.urgency, status: 'open' }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tech-support-requests'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      const item = items.find(i => i.id === id);
      return base44.entities.LogbookEntry.update(id, {
        notes: JSON.stringify({ support_type: item?.support_type, urgency: item?.urgency, status }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tech-support-requests'] }),
  });

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const aogCount = items.filter(i => i.urgency === 'aog' && i.status !== 'resolved').length;
  const openCount = items.filter(i => i.status !== 'resolved').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Technical Support</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{openCount} open requests
            {aogCount > 0 && <span className="text-red-400 font-bold"> · {aogCount} AOG</span>}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Request Support
        </button>
      </div>

      {aogCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400 font-bold">{aogCount} AOG support request{aogCount > 1 ? 's' : ''} require immediate attention</p>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'open', 'in_progress', 'resolved', 'escalated'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0',
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
            {s === 'all' ? `All (${items.length})` : `${s.replace('_', ' ')} (${items.filter(i => i.status === s).length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No technical support requests</p>
          <button onClick={() => setShowModal(true)}
            className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
            Submit Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(item => (
            <SupportCard key={item.id} item={item}
              onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })} />
          ))}
        </div>
      )}

      {showModal && (
        <NewSupportModal
          aircraft={aircraft}
          onClose={() => setShowModal(false)}
          onCreate={(form) => createMutation.mutate(form)}
        />
      )}
    </div>
  );
}