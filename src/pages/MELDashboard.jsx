import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, AlertTriangle, RefreshCw, Plus, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

const TODAY = new Date().toISOString().split('T')[0];

const CAT_CFG = {
  A: { label: 'Cat A', color: 'text-destructive', bg: 'bg-destructive/15', desc: 'Repair ASAP' },
  B: { label: 'Cat B', color: 'text-orange-400', bg: 'bg-orange-500/15', desc: '3 Calendar Days' },
  C: { label: 'Cat C', color: 'text-primary', bg: 'bg-primary/15', desc: '10 Calendar Days' },
  D: { label: 'Cat D', color: 'text-muted-foreground', bg: 'bg-muted', desc: '120 Calendar Days' },
};

const STATUS_CFG = {
  open:          { label: 'Open',          color: 'text-foreground',    bg: 'bg-secondary' },
  expiring_soon: { label: 'Expiring Soon', color: 'text-orange-400',    bg: 'bg-orange-500/15' },
  expired:       { label: 'EXPIRED',       color: 'text-destructive',   bg: 'bg-destructive/15' },
  cleared:       { label: 'Cleared',       color: 'text-green-400',     bg: 'bg-green-500/15' },
};

function daysLeft(expiry) {
  if (!expiry) return null;
  return differenceInDays(parseISO(expiry), new Date());
}

function computeStatus(item) {
  if (item.status === 'cleared') return 'cleared';
  const days = daysLeft(item.expiry_date);
  if (days === null) return item.status || 'open';
  if (days < 0) return 'expired';
  if (days <= 2) return 'expiring_soon';
  return 'open';
}

function NewMELModal({ onSave, onClose }) {
  const CAT_DAYS = { A: 0, B: 3, C: 10, D: 120 };
  const [form, setForm] = useState({
    aircraft_tail: '', aircraft_type: 'B737-800', ata_chapter: '', item_number: '',
    description: '', category: 'C', deferred_date: TODAY, ops_procedure: '',
    mx_procedure: '', flight_restrictions: '', logpage_number: '', notes: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const expiryDate = () => {
    const days = CAT_DAYS[form.category];
    if (!days) return form.deferred_date;
    const d = new Date(form.deferred_date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSave = () => onSave({ ...form, expiry_date: expiryDate(), status: 'open' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <p className="text-sm font-bold text-foreground">New MEL Deferral</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'aircraft_tail', label: 'Tail #' },
            { key: 'ata_chapter', label: 'ATA Chapter' },
            { key: 'item_number', label: 'Item #' },
            { key: 'logpage_number', label: 'Logpage #' },
            { key: 'deferred_date', label: 'Deferred Date', type: 'date' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type={type || 'text'} value={form[key] || ''} onChange={e => set(key, e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              {Object.entries(CAT_CFG).map(([k, v]) => <option key={k} value={k}>{k} — {v.desc}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1 resize-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Flight Restrictions</label>
          <input value={form.flight_restrictions} onChange={e => set('flight_restrictions', e.target.value)}
            className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
        </div>
        <div className="bg-secondary/50 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Expires: <span className="font-mono font-bold text-foreground">{expiryDate()}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={!form.aircraft_tail || !form.description}
            className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">
            Create Deferral
          </button>
          <button onClick={onClose} className="flex-1 h-10 border border-border text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MELDashboard() {
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState('all');
  const qc = useQueryClient();

  const { data: items = [], refetch } = useQuery({
    queryKey: ['mel-items'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 100),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MELItem.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mel-items'] }); setShowNew(false); },
  });

  const clearMutation = useMutation({
    mutationFn: (id) => base44.entities.MELItem.update(id, { status: 'cleared', cleared_date: TODAY }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mel-items'] }),
  });

  const enriched = items.map(i => ({ ...i, computedStatus: computeStatus(i) }));

  const filtered = filter === 'all' ? enriched.filter(i => i.computedStatus !== 'cleared')
    : filter === 'cleared' ? enriched.filter(i => i.computedStatus === 'cleared')
    : enriched.filter(i => i.computedStatus === filter);

  const expired = enriched.filter(i => i.computedStatus === 'expired').length;
  const expiring = enriched.filter(i => i.computedStatus === 'expiring_soon').length;
  const open = enriched.filter(i => i.computedStatus === 'open').length;
  const cleared = enriched.filter(i => i.computedStatus === 'cleared').length;

  const FILTERS = [
    { key: 'all', label: `All Open (${open + expired + expiring})` },
    { key: 'expired', label: `Expired (${expired})` },
    { key: 'expiring_soon', label: `Expiring (${expiring})` },
    { key: 'cleared', label: `Cleared (${cleared})` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Wrench className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">MEL DASHBOARD</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Deferrals · Expiry Tracking · Categories</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>

        {(expired > 0 || expiring > 0) && (
          <div className={cn('mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
            expired > 0 ? 'bg-destructive/15 text-destructive border border-destructive/30' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30')}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {expired > 0 ? `${expired} MEL item${expired > 1 ? 's' : ''} EXPIRED — aircraft may not be dispatchable` : `${expiring} MEL item${expiring > 1 ? 's' : ''} expiring within 2 days`}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Open', value: open, color: 'text-foreground' },
            { label: 'Expiring', value: expiring, color: expiring > 0 ? 'text-orange-400' : 'text-muted-foreground' },
            { label: 'Expired', value: expired, color: expired > 0 ? 'text-destructive' : 'text-muted-foreground' },
            { label: 'Cleared', value: cleared, color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-card border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn('whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0',
                filter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-secondary')}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No items in this category
            </div>
          ) : (
            filtered.map(item => {
              const cat = CAT_CFG[item.category] || CAT_CFG.C;
              const st = STATUS_CFG[item.computedStatus] || STATUS_CFG.open;
              const days = daysLeft(item.expiry_date);
              return (
                <div key={item.id} className={cn('rounded-xl bg-card border overflow-hidden',
                  item.computedStatus === 'expired' ? 'border-destructive/40' :
                  item.computedStatus === 'expiring_soon' ? 'border-orange-500/40' : 'border-border')}>
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cat.bg, cat.color)}>{cat.label}</span>
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', st.bg, st.color)}>{st.label}</span>
                          {item.aircraft_tail && <span className="text-xs font-mono font-bold text-foreground">{item.aircraft_tail}</span>}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{item.description}</p>
                        {item.ata_chapter && <p className="text-xs text-muted-foreground">ATA {item.ata_chapter} {item.item_number ? `· Item ${item.item_number}` : ''} {item.logpage_number ? `· ${item.logpage_number}` : ''}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {days !== null && item.computedStatus !== 'cleared' && (
                          <p className={cn('text-sm font-extrabold font-mono',
                            days < 0 ? 'text-destructive' : days <= 2 ? 'text-orange-400' : 'text-foreground')}>
                            {days < 0 ? `${Math.abs(days)}d OVER` : `${days}d left`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{item.expiry_date || '—'}</p>
                      </div>
                    </div>
                    {item.flight_restrictions && (
                      <p className="text-xs text-orange-400 bg-orange-500/10 rounded px-2 py-1 mb-2">⚠ {item.flight_restrictions}</p>
                    )}
                    {item.computedStatus !== 'cleared' && (
                      <button onClick={() => clearMutation.mutate(item.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Clear Item
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showNew && <NewMELModal onSave={(d) => createMutation.mutate(d)} onClose={() => setShowNew(false)} />}
    </div>
  );
}