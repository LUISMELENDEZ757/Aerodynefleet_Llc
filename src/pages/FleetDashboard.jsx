import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Plane, Search, LayoutGrid, List, Wrench, CheckCircle,
  AlertTriangle, Clock, X, Plus, ChevronDown, BookOpen, MapPin, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_OPTIONS = ['All', 'active', 'oos', 'maintenance', 'retired'];

const MX_STATUS = {
  airworthy: { label: 'AIRWORTHY',          bg: 'bg-green-600',  icon: CheckCircle },
  mel:       { label: 'AIRWORTHY WITH MEL', bg: 'bg-yellow-500', icon: AlertTriangle },
  oos:       { label: 'OUT OF SERVICE',     bg: 'bg-red-600',    icon: Wrench },
};

function KpiCard({ label, value, sub, color, icon: Icon, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border rounded-2xl p-5 flex flex-col gap-2 transition-all',
        onClick && 'cursor-pointer hover:border-primary/40 active:scale-[0.98]',
        active ? 'border-primary/60' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <p className={cn('text-5xl font-black leading-none', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AircraftCard({ aircraft, mxStatus, discrepancyCount, onClick }) {
  const cfg = MX_STATUS[mxStatus] || MX_STATUS.airworthy;
  const Icon = cfg.icon;
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/40 transition-all active:scale-[0.97]',
        discrepancyCount > 0 ? 'border-amber-500/40' : 'border-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-extrabold text-primary font-mono">{aircraft.tail_number}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{aircraft.aircraft_type}</p>
        </div>
        <Plane className="w-4 h-4 text-muted-foreground mt-1" />
      </div>
      {aircraft.base_station && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {aircraft.base_station}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-white', cfg.bg)}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      </div>
      {discrepancyCount > 0 && (
        <p className="text-[10px] font-bold text-amber-400">⚠️ {discrepancyCount} open write-up{discrepancyCount > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}

function AircraftRow({ aircraft, mxStatus, discrepancyCount, onClick }) {
  const cfg = MX_STATUS[mxStatus] || MX_STATUS.airworthy;
  const Icon = cfg.icon;
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-xl bg-card border cursor-pointer hover:border-primary/30 transition-all',
        discrepancyCount > 0 ? 'border-amber-500/30' : 'border-border'
      )}
    >
      <p className="text-sm font-extrabold text-primary font-mono w-24 flex-shrink-0">{aircraft.tail_number}</p>
      <p className="text-xs text-muted-foreground w-24 flex-shrink-0">{aircraft.aircraft_type}</p>
      <p className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">{aircraft.base_station || '—'}</p>
      {discrepancyCount > 0 && (
        <span className="text-[10px] font-bold text-amber-400 hidden md:block">⚠️ {discrepancyCount} write-up{discrepancyCount > 1 ? 's' : ''}</span>
      )}
      <div className="ml-auto">
        <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white flex-shrink-0', cfg.bg)}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      </div>
    </div>
  );
}

function AircraftDetail({ aircraft, onClose }) {
  const queryClient = useQueryClient();

  const { data: logEntries = [] } = useQuery({
    queryKey: ['detail-log', aircraft.tail_number],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: aircraft.tail_number }),
  });

  const [form, setForm] = useState({ entry_type: 'discrepancy', description: '', ata_chapter: '' });
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detail-log', aircraft.tail_number] });
      queryClient.invalidateQueries({ queryKey: ['fleet-discrepancies'] });
      setForm({ entry_type: 'discrepancy', description: '', ata_chapter: '' });
      setShowForm(false);
    },
  });

  const statusCfg = {
    active: { label: 'ACTIVE', bg: 'bg-green-600' },
    oos: { label: 'OOS', bg: 'bg-red-600' },
    maintenance: { label: 'MAINTENANCE', bg: 'bg-orange-500' },
    retired: { label: 'RETIRED', bg: 'bg-gray-600' },
  }[aircraft.status] || { label: aircraft.status?.toUpperCase() || '—', bg: 'bg-gray-600' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Plane className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-foreground font-mono">{aircraft.tail_number}</p>
          <p className="text-xs text-muted-foreground">{aircraft.aircraft_type}</p>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-xs font-bold text-white ml-2', statusCfg.bg)}>{statusCfg.label}</span>
        <div className="ml-auto flex items-center gap-2">
          <Link to={`/TechOpsLogbook?tail=${aircraft.tail_number}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" /> Logbook
          </Link>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/70">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Base Station', value: aircraft.base_station || '—', icon: MapPin },
            { label: 'Engine Type', value: aircraft.engine_type || '—', icon: Cpu },
            { label: 'MSN', value: aircraft.msn || '—', icon: Plane },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-2">
              <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Maintenance Timeline
          </h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <select
              value={form.entry_type}
              onChange={e => setForm(p => ({ ...p, entry_type: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="discrepancy">Discrepancy</option>
              <option value="corrective_action">Corrective Action</option>
              <option value="info">Info</option>
            </select>
            <input
              placeholder="ATA Chapter (e.g. 79)"
              value={form.ata_chapter}
              onChange={e => setForm(p => ({ ...p, ata_chapter: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none"
            />
            <textarea
              rows={3}
              placeholder="Description *"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
              <button
                disabled={!form.description || createMutation.isPending}
                onClick={() => createMutation.mutate({ ...form, aircraft_tail: aircraft.tail_number })}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </div>
        )}

        {logEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No timeline entries yet.</div>
        ) : (
          <div className="space-y-2">
            {logEntries.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                      entry.entry_type === 'discrepancy' ? 'bg-red-500/20 text-red-400' :
                      entry.entry_type === 'corrective_action' ? 'bg-green-500/20 text-green-400' :
                      'bg-blue-500/20 text-blue-400'
                    )}>{entry.entry_type}</span>
                    {entry.ata_chapter && <span className="text-[10px] text-muted-foreground">ATA {entry.ata_chapter}</span>}
                  </div>
                  <p className="text-sm text-foreground">{entry.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(entry.created_date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function FleetDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [kpiFilter, setKpiFilter] = useState(null);
  const [selected, setSelected] = useState(null);

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  const { data: discrepancies = [] } = useQuery({
    queryKey: ['fleet-discrepancies'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['fleet-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const openDiscrepancies = discrepancies.filter(d => d.discrepancy_status !== 'CLOSED');
  const discByTail = openDiscrepancies.reduce((acc, d) => {
    acc[d.aircraft_tail] = (acc[d.aircraft_tail] || 0) + 1;
    return acc;
  }, {});

  const oosSet = new Set(aircraft.filter(a => a.status === 'oos').map(a => a.tail_number));
  const melSet = new Set(melItems.map(m => m.aircraft_tail));

  const getMxStatus = (tail) => {
    if (oosSet.has(tail)) return 'oos';
    if (melSet.has(tail)) return 'mel';
    return 'airworthy';
  };

  const total = aircraft.length;
  const airworthy = aircraft.filter(a => !oosSet.has(a.tail_number) && !melSet.has(a.tail_number)).length;
  const withMel = aircraft.filter(a => melSet.has(a.tail_number)).length;
  const outOfSvc = aircraft.filter(a => oosSet.has(a.tail_number)).length;

  const filtered = aircraft.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      a.tail_number?.toLowerCase().includes(q) ||
      a.aircraft_type?.toLowerCase().includes(q) ||
      a.base_station?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchKpi = !kpiFilter || getMxStatus(a.tail_number) === kpiFilter;
    return matchSearch && matchStatus && matchKpi;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-card border border-border rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-widest uppercase">Fleet Management</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-green-400 tracking-widest">OPERATIONAL</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Total Fleet" value={isLoading ? '…' : total} sub="All aircraft" color="text-foreground" icon={Plane}
            onClick={() => setKpiFilter(null)} active={!kpiFilter} />
          <KpiCard label="Airworthy" value={isLoading ? '…' : airworthy} sub="No restrictions" color="text-green-400" icon={CheckCircle}
            onClick={() => setKpiFilter(kpiFilter === 'airworthy' ? null : 'airworthy')} active={kpiFilter === 'airworthy'} />
          <KpiCard label="Airworthy w/ MEL" value={isLoading ? '…' : withMel} sub="Dispatch restricted" color="text-yellow-400" icon={AlertTriangle}
            onClick={() => setKpiFilter(kpiFilter === 'mel' ? null : 'mel')} active={kpiFilter === 'mel'} />
          <KpiCard label="Out of Service" value={isLoading ? '…' : outOfSvc} sub="Awaiting service" color={outOfSvc > 0 ? 'text-red-400' : 'text-muted-foreground'} icon={Wrench}
            onClick={() => setKpiFilter(kpiFilter === 'oos' ? null : 'oos')} active={kpiFilter === 'oos'} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tail, type, base…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
            />
            {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <div className="flex rounded-xl overflow-hidden border border-border bg-card">
            <button onClick={() => setViewMode('grid')}
              className={cn('px-3 py-2.5 transition-all', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('px-3 py-2.5 transition-all', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {total} aircraft</p>
          {kpiFilter && (
            <button onClick={() => setKpiFilter(null)} className="text-xs font-bold text-primary flex items-center gap-1">
              <X className="w-3 h-3" /> Clear filter
            </button>
          )}
        </div>

        {/* Aircraft List */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading fleet data…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No aircraft found</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filtered.map(a => (
              <AircraftCard key={a.id} aircraft={a} mxStatus={getMxStatus(a.tail_number)}
                discrepancyCount={discByTail[a.tail_number] || 0} onClick={() => setSelected(a)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map(a => (
              <AircraftRow key={a.id} aircraft={a} mxStatus={getMxStatus(a.tail_number)}
                discrepancyCount={discByTail[a.tail_number] || 0} onClick={() => setSelected(a)} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <AircraftDetail aircraft={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}