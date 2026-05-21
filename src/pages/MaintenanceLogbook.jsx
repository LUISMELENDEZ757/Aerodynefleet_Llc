import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, Plus, AlertTriangle, CheckCircle, Clock,
  Wrench, ChevronRight, X, Plane, Shield, FileText, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── STATUS CONFIG ──────────────────────────────────────────────────────────

const DISC_STATUS = {
  OPEN:        { label: 'Open',        color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
  PENDING_RII: { label: 'Pending RII', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  CLOSED:      { label: 'Closed',      color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30'  },
};

const MEL_CATS = {
  A: { color: 'text-red-400',    bg: 'bg-red-500/10'    },
  B: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  C: { color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  D: { color: 'text-green-400',  bg: 'bg-green-500/10'  },
};

const ATA_CHAPTERS = [
  '21 - Air Conditioning', '22 - Auto Flight', '23 - Communications',
  '24 - Electrical Power', '25 - Equipment/Furnishings', '26 - Fire Protection',
  '27 - Flight Controls', '28 - Fuel', '29 - Hydraulic Power',
  '30 - Ice & Rain Protection', '31 - Instruments', '32 - Landing Gear',
  '33 - Lights', '34 - Navigation', '36 - Pneumatic',
  '38 - Water/Waste', '49 - APU', '52 - Doors',
  '57 - Wings', '71 - Power Plant', '72 - Engine',
  '73 - Engine Fuel & Control', '74 - Ignition', '75 - Air',
  '77 - Engine Indicating', '78 - Exhaust', '79 - Oil', '80 - Starting',
];

// ─── KPI CARD ──────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color.replace('text-', 'bg-').replace('400', '500/15'))}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── NEW DISCREPANCY MODAL ──────────────────────────────────────────────────

function NewDiscrepancyModal({ aircraft, onClose, onSave }) {
  const [form, setForm] = useState({
    aircraft_tail: aircraft?.[0]?.tail_number || '',
    entry_type: 'discrepancy',
    ata_chapter: '',
    description: '',
    flight_number: '',
    station: '',
    technician_name: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.aircraft_tail || !form.description) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <p className="font-extrabold text-foreground">Log New Discrepancy</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Aircraft Tail *</label>
              <select
                value={form.aircraft_tail}
                onChange={e => set('aircraft_tail', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select tail…</option>
                {aircraft.map(a => (
                  <option key={a.id} value={a.tail_number}>{a.tail_number} ({a.aircraft_type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Flight Number</label>
              <input
                type="text"
                value={form.flight_number}
                onChange={e => set('flight_number', e.target.value)}
                placeholder="e.g. AEX101"
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ATA Chapter</label>
              <select
                value={form.ata_chapter}
                onChange={e => set('ata_chapter', e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select ATA…</option>
                {ATA_CHAPTERS.map(c => <option key={c} value={c.split(' - ')[0]}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Station</label>
              <input
                type="text"
                value={form.station}
                onChange={e => set('station', e.target.value)}
                placeholder="e.g. KEWR"
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Discrepancy Description *</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the discrepancy observed by the flight crew…"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Reported By (Captain / F/O)</label>
            <input
              type="text"
              value={form.technician_name}
              onChange={e => set('technician_name', e.target.value)}
              placeholder="Name and certificate number"
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">This entry will be submitted to TechOps for immediate review. A maintenance technician will be assigned.</p>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.aircraft_tail || !form.description}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Submit Discrepancy
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ENTRY ROW ──────────────────────────────────────────────────────────────

function EntryRow({ entry, onClick }) {
  const st = DISC_STATUS[entry.discrepancy_status] || DISC_STATUS.OPEN;
  return (
    <button
      onClick={() => onClick(entry)}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
    >
      <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', st.bg.replace('/10', '').replace('bg-', 'bg-'), 'border', st.border)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-primary">{entry.aircraft_tail}</span>
          {entry.flight_number && <span className="text-xs text-muted-foreground">{entry.flight_number}</span>}
          {entry.ata_chapter && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">ATA {entry.ata_chapter}</span>}
          {entry.station && <span className="text-[10px] text-muted-foreground">{entry.station}</span>}
        </div>
        <p className="text-sm text-foreground mt-0.5 line-clamp-2">{entry.description}</p>
        {entry.technician_name && <p className="text-xs text-muted-foreground mt-0.5">Reported by: {entry.technician_name}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', st.bg, st.color)}>{st.label}</span>
        <span className="text-[10px] text-muted-foreground">{new Date(entry.created_date).toLocaleDateString()}</span>
      </div>
    </button>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function MaintenanceLogbook() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('discrepancies');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [tailFilter, setTailFilter] = useState('');

  // Read tail from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tailParam = params.get('tail');
    if (tailParam) {
      setTailFilter(tailParam);
    }
  }, []);

  const { data: logbook = [] } = useQuery({
    queryKey: ['mx-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['mx-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['mx-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });

  const createEntry = useMutation({
    mutationFn: data => base44.entities.LogbookEntry.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['mx-logbook']);
      setShowNewModal(false);
    },
  });

  // Derived
  const openDisc   = logbook.filter(e => e.discrepancy_status === 'OPEN');
  const inProgress = logbook.filter(e => e.discrepancy_status === 'IN_PROGRESS');
  const pendingRii = logbook.filter(e => e.discrepancy_status === 'PENDING_RII');
  const openMel    = melItems.filter(m => m.status !== 'cleared' && m.status !== 'cancelled');
  const catAMel    = openMel.filter(m => m.mel_category === 'A');

  const tails = [...new Set(logbook.map(e => e.aircraft_tail).filter(Boolean))].sort();

  const filterEntries = (entries) => entries.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = !q || e.description?.toLowerCase().includes(q) || e.aircraft_tail?.toLowerCase().includes(q) || e.ata_chapter?.includes(q);
    const matchesTail = !tailFilter || e.aircraft_tail === tailFilter;
    return matchesSearch && matchesTail;
  });

  const filteredOpenDisc   = filterEntries(openDisc);
  const filteredInProgress = filterEntries(inProgress);
  const filteredPendingRii = filterEntries(pendingRii);
  const filteredOpenMel    = openMel.filter(m => !tailFilter || m.aircraft_tail === tailFilter);

  // History filters
  const [historyAta, setHistoryAta] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');

  const historyEntries = logbook.filter(e => {
    const matchesTail = !tailFilter || e.aircraft_tail === tailFilter;
    const matchesAta  = !historyAta || e.ata_chapter?.startsWith(historyAta);
    const entryDate   = new Date(e.created_date);
    const matchesFrom = !historyFrom || entryDate >= new Date(historyFrom);
    const matchesTo   = !historyTo   || entryDate <= new Date(historyTo + 'T23:59:59');
    const matchesSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.aircraft_tail?.toLowerCase().includes(search.toLowerCase());
    return matchesTail && matchesAta && matchesFrom && matchesTo && matchesSearch;
  }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const TABS = [
    { key: 'discrepancies', label: 'Discrepancies', count: filteredOpenDisc.length + filteredInProgress.length + filteredPendingRii.length },
    { key: 'mel',           label: 'MEL Deferrals', count: filteredOpenMel.length },
    { key: 'aircraft',      label: 'Fleet Status',  count: aircraft.length },
    { key: 'history',       label: 'History',       count: historyEntries.length },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-30 px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-foreground">Maintenance Logbook</h1>
              {tailFilter && (
                <span className="px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-primary text-sm font-bold">
                  {tailFilter}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Discrepancies · MEL Deferrals · Fleet Status</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* KPI bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Open Discrepancies" value={openDisc.length}   color="text-red-400"    icon={AlertTriangle} />
          <KpiCard label="In Progress"         value={inProgress.length} color="text-amber-400"  icon={Wrench} />
          <KpiCard label="Pending RII"         value={pendingRii.length} color="text-orange-400" icon={Shield} />
          <KpiCard label="Open MEL Items"      value={openMel.length}    color={catAMel.length > 0 ? 'text-red-400' : 'text-blue-400'} icon={FileText} />
        </div>

        {/* CAT A warning */}
        {catAMel.length > 0 && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-400">{catAMel.length} CAT A MEL item{catAMel.length > 1 ? 's' : ''} — immediate action required</p>
              <p className="text-xs text-muted-foreground mt-0.5">CAT A items must be resolved before next departure</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search discrepancies…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={tailFilter}
            onChange={e => setTailFilter(e.target.value)}
            className="h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Aircraft</option>
            {tails.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-px',
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded-full', tab === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Discrepancies tab */}
        {tab === 'discrepancies' && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {['OPEN', 'IN_PROGRESS', 'PENDING_RII'].map(status => {
              const entries = filterEntries(logbook.filter(e => e.discrepancy_status === status));
              if (entries.length === 0) return null;
              const st = DISC_STATUS[status];
              return (
                <div key={status}>
                  <div className={cn('px-4 py-2.5 border-b border-border flex items-center gap-2', st.bg)}>
                    <span className={cn('text-[10px] font-extrabold uppercase tracking-wider', st.color)}>{st.label}</span>
                    <span className="text-xs text-muted-foreground">({entries.length})</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {entries.map(e => <EntryRow key={e.id} entry={e} onClick={setSelectedEntry} />)}
                  </div>
                </div>
              );
            })}
            {filterEntries(logbook.filter(e => ['OPEN','IN_PROGRESS','PENDING_RII'].includes(e.discrepancy_status))).length === 0 && (
              <div className="py-12 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">No open discrepancies</p>
                <p className="text-xs text-muted-foreground mt-1">All items cleared — fleet is airworthy</p>
              </div>
            )}
          </div>
        )}

        {/* MEL tab */}
        {tab === 'mel' && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            {openMel.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">No open MEL deferrals</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {openMel
                  .filter(m => !tailFilter || m.aircraft_tail === tailFilter)
                  .filter(m => !search || m.description?.toLowerCase().includes(search.toLowerCase()) || m.mel_number?.toLowerCase().includes(search.toLowerCase()))
                  .map(m => {
                    const catCfg = MEL_CATS[m.mel_category] || MEL_CATS.D;
                    return (
                      <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                        <div className={cn('text-xs font-extrabold px-2 py-1 rounded flex-shrink-0 mt-0.5', catCfg.bg, catCfg.color)}>
                          CAT {m.mel_category || '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-primary">{m.aircraft_tail}</span>
                            {m.mel_number && <span className="text-[10px] text-muted-foreground">{m.mel_number}</span>}
                            {m.ata_chapter && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">ATA {m.ata_chapter}</span>}
                          </div>
                          <p className="text-sm text-foreground mt-0.5 line-clamp-2">{m.description}</p>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            {m.deferred_date && <span>Deferred: {m.deferred_date}</span>}
                            {m.expiry_date && <span className={cn(new Date(m.expiry_date) < new Date() ? 'text-red-400 font-bold' : '')}>Expires: {m.expiry_date}</span>}
                          </div>
                        </div>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                          m.status === 'expired' ? 'bg-red-500/10 text-red-400' :
                          m.status === 'expiring_soon' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                        )}>
                          {m.status || 'active'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Fleet Status tab */}
        {tab === 'aircraft' && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="divide-y divide-border/50">
              {aircraft
                .filter(a => !search || a.tail_number.toLowerCase().includes(search.toLowerCase()) || a.aircraft_type?.toLowerCase().includes(search.toLowerCase()))
                .map(a => {
                  const tailDisc  = logbook.filter(e => e.aircraft_tail === a.tail_number && ['OPEN','IN_PROGRESS','PENDING_RII'].includes(e.discrepancy_status));
                  const tailMel   = openMel.filter(m => m.aircraft_tail === a.tail_number);
                  const hasCritical = tailMel.some(m => m.mel_category === 'A') || a.status === 'oos';

                  const statusCfg = {
                    active:      { color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Active'       },
                    oos:         { color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'OOS'          },
                    maintenance: { color: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Maintenance'  },
                    retired:     { color: 'text-gray-500',   bg: 'bg-gray-500/10',   label: 'Retired'      },
                  }[a.status] || { color: 'text-gray-400', bg: 'bg-gray-500/10', label: a.status };

                  return (
                    <div key={a.id} className={cn('flex items-center gap-3 px-4 py-3', hasCritical && 'bg-red-500/5')}>
                      <Plane className={cn('w-4 h-4 flex-shrink-0', statusCfg.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-foreground">{a.tail_number}</span>
                          <span className="text-xs text-muted-foreground">{a.aircraft_type}</span>
                          {a.base_station && <span className="text-[10px] text-muted-foreground">{a.base_station}</span>}
                        </div>
                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                          {tailDisc.length > 0 && <span className="text-red-400 font-bold">{tailDisc.length} open disc.</span>}
                          {tailMel.length > 0 && <span className="text-amber-400">{tailMel.length} MEL items</span>}
                          {tailDisc.length === 0 && tailMel.length === 0 && <span className="text-green-400">No open items</span>}
                        </div>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusCfg.bg, statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="space-y-3">
            {/* History filters */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Filter History</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">ATA Chapter</label>
                  <select
                    value={historyAta}
                    onChange={e => setHistoryAta(e.target.value)}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All ATA Chapters</option>
                    {ATA_CHAPTERS.map(c => (
                      <option key={c} value={c.split(' - ')[0]}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">From Date</label>
                  <input
                    type="date"
                    value={historyFrom}
                    onChange={e => setHistoryFrom(e.target.value)}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To Date</label>
                  <input
                    type="date"
                    value={historyTo}
                    onChange={e => setHistoryTo(e.target.value)}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              {(historyAta || historyFrom || historyTo) && (
                <button
                  onClick={() => { setHistoryAta(''); setHistoryFrom(''); setHistoryTo(''); }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Results */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {historyEntries.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-bold text-foreground">No records found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {historyEntries.map(e => {
                    const st = DISC_STATUS[e.discrepancy_status] || DISC_STATUS.OPEN;
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEntry(e)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                      >
                        <div className="flex-shrink-0 text-center min-w-[56px]">
                          <p className="text-[10px] font-bold text-muted-foreground">{new Date(e.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <p className="text-[10px] text-muted-foreground/60">{new Date(e.created_date).getFullYear()}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-primary">{e.aircraft_tail}</span>
                            {e.ata_chapter && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">ATA {e.ata_chapter}</span>}
                            {e.flight_number && <span className="text-[10px] text-muted-foreground">{e.flight_number}</span>}
                            {e.station && <span className="text-[10px] text-muted-foreground">{e.station}</span>}
                          </div>
                          <p className="text-sm text-foreground mt-0.5 line-clamp-2">{e.description}</p>
                          {e.corrective_action && (
                            <p className="text-xs text-green-400 mt-0.5 line-clamp-1">✓ {e.corrective_action}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', st.bg, st.color)}>
                            {e.entry_type?.replace('_', ' ') || st.label}
                          </span>
                          {e.technician_name && <span className="text-[10px] text-muted-foreground">{e.technician_name}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entry detail panel */}
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[96px]">
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <p className="font-extrabold text-foreground">Discrepancy Detail</p>
                <button onClick={() => setSelectedEntry(null)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                {[
                  { label: 'Aircraft', value: selectedEntry.aircraft_tail },
                  { label: 'Flight', value: selectedEntry.flight_number || '—' },
                  { label: 'Station', value: selectedEntry.station || '—' },
                  { label: 'ATA Chapter', value: selectedEntry.ata_chapter || '—' },
                  { label: 'Log Page', value: selectedEntry.log_page || '—' },
                  { label: 'Status', value: DISC_STATUS[selectedEntry.discrepancy_status]?.label || selectedEntry.discrepancy_status },
                  { label: 'Reported By', value: selectedEntry.technician_name || '—' },
                  { label: 'Date', value: new Date(selectedEntry.created_date).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold text-foreground text-right">{value}</span>
                  </div>
                ))}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-foreground bg-secondary/30 rounded-lg px-3 py-2">{selectedEntry.description}</p>
                </div>
                {selectedEntry.corrective_action && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Corrective Action</p>
                    <p className="text-sm text-foreground bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2">{selectedEntry.corrective_action}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewDiscrepancyModal
          aircraft={aircraft}
          onClose={() => setShowNewModal(false)}
          onSave={data => createEntry.mutate(data)}
        />
      )}
    </div>
  );
}