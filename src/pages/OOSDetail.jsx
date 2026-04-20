import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Clock, MapPin, Plus, Loader2, CheckCircle, AlertTriangle,
  Wrench, Package, FileText, ChevronDown, Radio, Shield,
  Activity, RefreshCw, Filter, X, Building2, Plane, Zap,
  ClipboardList, ArrowLeft, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/oos/EventCard';
import PartCard from '@/components/oos/PartCard';
import AddEventDialog from '@/components/oos/AddEventDialog';
import AddPartDialog from '@/components/oos/AddPartDialog';

// ── All stations ──────────────────────────────────────────────────────────────
const STATIONS = [
  'KEWR','KJFK','KLGA','KORD','KATL','KLAX','KSFO','KSEA',
  'KDEN','KDFW','KIAH','KMIA','KBOS','KLAS','KPHX','KMSP',
  'KDCA','KIAD','KPHL','KSTL','KCLT','KDTW','KSLC','KMCO',
  'EGLL','LFPG','EDDF','LEMD','LIRF','EHAM',
  'OMDB','RJTT','RKSI','VABB','VIDP','YSSY',
];

const STATUS_CFG = {
  oos:              { label: 'OUT OF SERVICE', color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',    dot: 'bg-red-400'    },
  in_work:          { label: 'IN WORK',        color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  dot: 'bg-amber-400 animate-pulse' },
  waiting_on_parts: { label: 'WTG PARTS',      color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40', dot: 'bg-orange-400' },
  released:         { label: 'RELEASED',       color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40',  dot: 'bg-green-400'  },
};

const TABS = [
  { id: 'overview', label: 'Overview',  icon: Activity },
  { id: 'timeline', label: 'Timeline',  icon: ClipboardList },
  { id: 'parts',    label: 'Parts',     icon: Package },
  { id: 'release',  label: 'Release',   icon: Shield },
];

function getElapsed(oosDate, oosTime) {
  if (!oosDate || !oosTime) return null;
  const [h, m] = oosTime.split(':').map(Number);
  const start = new Date(oosDate);
  start.setHours(h, m, 0, 0);
  const now = new Date();
  const diff = Math.max(0, now - start);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { hours, mins, total: diff };
}

// ── Elapsed Timer ─────────────────────────────────────────────────────────────
function ElapsedTimer({ oosDate, oosTime }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
  const e = getElapsed(oosDate, oosTime);
  if (!e) return <span className="font-mono text-2xl font-black text-red-400">--:--</span>;
  const color = e.hours >= 8 ? 'text-red-400' : e.hours >= 4 ? 'text-amber-400' : 'text-primary';
  return (
    <span className={cn('font-mono text-2xl font-black', color)}>
      {String(e.hours).padStart(2,'0')}:{String(e.mins).padStart(2,'0')}
    </span>
  );
}

// ── Station Filter Button ─────────────────────────────────────────────────────
function StationFilterButton({ allOosEntries, activeStation, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const stationsWithData = useMemo(() => {
    const counts = {};
    allOosEntries.forEach(e => {
      if (e.station) counts[e.station] = (counts[e.station] || 0) + 1;
    });
    return counts;
  }, [allOosEntries]);

  const filtered = STATIONS.filter(s =>
    s.toLowerCase().includes(search.toLowerCase()) || stationsWithData[s]
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all',
          activeStation
            ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
            : 'bg-[#1a1f2e] border-white/15 text-gray-300 hover:border-primary/40 hover:text-white'
        )}
      >
        <Building2 className="w-3.5 h-3.5" />
        {activeStation || 'ALL STATIONS'}
        {activeStation && (
          <span
            onClick={e => { e.stopPropagation(); onSelect(null); }}
            className="ml-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40"
          >
            <X className="w-2.5 h-2.5" />
          </span>
        )}
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 z-40 bg-[#141922] border border-white/10 rounded-2xl shadow-2xl w-72 overflow-hidden"
            >
              <div className="px-3 pt-3 pb-2 border-b border-white/8">
                <p className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Filter by Station</p>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search ICAO..."
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto scrollbar-hide py-1">
                {/* All stations option */}
                <button
                  onClick={() => { onSelect(null); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors hover:bg-white/5',
                    !activeStation ? 'text-primary' : 'text-gray-300'
                  )}
                >
                  <span>All Stations</span>
                  <span className="text-[10px] text-gray-500">{allOosEntries.length} aircraft</span>
                </button>

                <div className="border-t border-white/8 mt-1 pt-1">
                  {/* Stations with OOS data first */}
                  {Object.entries(stationsWithData).length > 0 && (
                    <>
                      <p className="px-4 py-1 text-[9px] font-extrabold text-primary/70 uppercase tracking-widest">Active OOS Stations</p>
                      {Object.entries(stationsWithData)
                        .sort((a, b) => b[1] - a[1])
                        .map(([stn, count]) => (
                          <button
                            key={stn}
                            onClick={() => { onSelect(stn); setOpen(false); }}
                            className={cn(
                              'w-full flex items-center justify-between px-4 py-2 text-xs font-bold transition-colors hover:bg-white/5',
                              activeStation === stn ? 'text-primary bg-primary/10' : 'text-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                              <span className="font-mono">{stn}</span>
                            </div>
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">{count} OOS</span>
                          </button>
                        ))}
                      <div className="border-t border-white/8 my-1" />
                    </>
                  )}

                  {/* Other stations */}
                  <p className="px-4 py-1 text-[9px] font-extrabold text-gray-600 uppercase tracking-widest">All Stations</p>
                  {filtered.filter(s => !stationsWithData[s]).map(stn => (
                    <button
                      key={stn}
                      onClick={() => { onSelect(stn); setOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
                    >
                      <span className="font-mono">{stn}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon: Icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left w-full',
        active
          ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10'
          : 'bg-[#141922] border-white/8 hover:border-white/20'
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <p className={cn('text-3xl font-black leading-none', color)}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OOSDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [stationFilter, setStationFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Fetch all OOS entries for fleet-wide view + station filtering
  const { data: allOosEntries = [], refetch: refetchAll } = useQuery({
    queryKey: ['all-oos-entries'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  // Fetch specific entry if id provided
  const { data: entry, isLoading: loadingEntry } = useQuery({
    queryKey: ['oos-entry', id],
    queryFn: () => base44.entities.OOSEntry.filter({ id }),
    select: (data) => data[0],
    enabled: !!id,
  });

  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ['timeline-events', id],
    queryFn: () => base44.entities.TimelineEvent.filter({ oos_entry_id: id }, 'event_time'),
    enabled: !!id,
  });

  const { data: parts = [], refetch: refetchParts } = useQuery({
    queryKey: ['parts', id],
    queryFn: () => base44.entities.Part.filter({ oos_entry_id: id }),
    enabled: !!id,
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.TimelineEvent.create({ ...data, oos_entry_id: id }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timeline-events', id] }),
  });

  const createPartMutation = useMutation({
    mutationFn: (data) => base44.entities.Part.create({ ...data, oos_entry_id: id }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['parts', id] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => base44.entities.OOSEntry.update(id, { status }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['oos-entry', id] });
      queryClient.invalidateQueries({ queryKey: ['all-oos-entries'] });
    },
  });

  // Filtered fleet view
  const filteredEntries = useMemo(() => {
    return allOosEntries.filter(e => {
      const matchStation = !stationFilter || e.station === stationFilter;
      const matchStatus = !statusFilter || e.status === statusFilter;
      return matchStation && matchStatus;
    });
  }, [allOosEntries, stationFilter, statusFilter]);

  // KPI counts
  const kpis = useMemo(() => ({
    total: filteredEntries.length,
    oos: filteredEntries.filter(e => e.status === 'oos').length,
    inWork: filteredEntries.filter(e => e.status === 'in_work').length,
    wtgParts: filteredEntries.filter(e => e.status === 'waiting_on_parts').length,
    released: filteredEntries.filter(e => e.status === 'released').length,
  }), [filteredEntries]);

  const currentEntry = entry;
  const statusInfo = currentEntry ? (STATUS_CFG[currentEntry.status] || STATUS_CFG.oos) : null;

  // ── Loading ──
  if (id && loadingEntry) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c12] text-white pb-24">

      {/* ── Enterprise Header ── */}
      <div className="sticky top-0 z-20 bg-[#0a0e18] border-b border-white/8 px-5 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/OOSDashboard" className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <p className="text-xs font-extrabold text-white uppercase tracking-widest">
                  {currentEntry ? `${currentEntry.tail_number} — OOS Detail` : 'OOS Command Center'}
                </p>
              </div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">
                Out of Service · Enterprise Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Station Filter Button */}
            <StationFilterButton
              allOosEntries={allOosEntries}
              activeStation={stationFilter}
              onSelect={setStationFilter}
            />

            {/* Status filter */}
            <div className="flex items-center gap-1">
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                  className={cn(
                    'text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all uppercase tracking-wider',
                    statusFilter === key
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'border-white/10 text-gray-600 hover:text-gray-300 hover:border-white/20'
                  )}
                >
                  {cfg.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => { refetchAll(); refetchEvents(); refetchParts(); }}
              className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="px-5 pt-4 pb-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Fleet OOS" value={kpis.total} color="text-white" icon={Plane}
          onClick={() => setStatusFilter(null)} active={!statusFilter} sub={stationFilter ? `at ${stationFilter}` : 'all stations'} />
        <KpiCard label="AOG / OOS" value={kpis.oos} color="text-red-400" icon={AlertTriangle}
          onClick={() => setStatusFilter(statusFilter === 'oos' ? null : 'oos')} active={statusFilter === 'oos'} sub="Grounded" />
        <KpiCard label="In Work" value={kpis.inWork} color="text-amber-400" icon={Wrench}
          onClick={() => setStatusFilter(statusFilter === 'in_work' ? null : 'in_work')} active={statusFilter === 'in_work'} sub="Active mx" />
        <KpiCard label="Wtg Parts" value={kpis.wtgParts} color="text-orange-400" icon={Package}
          onClick={() => setStatusFilter(statusFilter === 'waiting_on_parts' ? null : 'waiting_on_parts')} active={statusFilter === 'waiting_on_parts'} sub="Supply chain" />
        <KpiCard label="Released" value={kpis.released} color="text-green-400" icon={CheckCircle}
          onClick={() => setStatusFilter(statusFilter === 'released' ? null : 'released')} active={statusFilter === 'released'} sub="Back in service" />
      </div>

      {/* ── Fleet OOS List (when no specific entry selected) or Entry Detail ── */}
      {!id ? (
        /* Fleet-wide view */
        <div className="px-5 pt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
              {filteredEntries.length} Aircraft {stationFilter ? `at ${stationFilter}` : 'Fleet-Wide'}
            </p>
            {(stationFilter || statusFilter) && (
              <button
                onClick={() => { setStationFilter(null); setStatusFilter(null); }}
                className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <CheckCircle className="w-12 h-12 text-green-500/30" />
              <p className="text-gray-500 font-bold">No OOS aircraft</p>
              <p className="text-[11px] text-gray-600">{stationFilter ? `at ${stationFilter}` : 'across all stations'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredEntries.map(entry => {
                const cfg = STATUS_CFG[entry.status] || STATUS_CFG.oos;
                const elapsed = getElapsed(entry.oos_date, entry.oos_time);
                const hoursOld = elapsed?.hours || 0;
                return (
                  <Link
                    key={entry.id}
                    to={`/OOSDetail?id=${entry.id}`}
                    className={cn(
                      'block bg-[#141922] rounded-2xl border p-4 hover:border-primary/40 transition-all hover:scale-[1.01] active:scale-[0.99]',
                      cfg.border
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xl font-black text-primary font-mono">{entry.tail_number}</p>
                        <p className="text-xs text-gray-500">{entry.aircraft_type}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn('text-[10px] font-extrabold px-2 py-1 rounded-lg border', cfg.bg, cfg.color, cfg.border)}>
                          {cfg.label}
                        </span>
                        {elapsed && (
                          <span className={cn('text-[11px] font-black font-mono', hoursOld >= 8 ? 'text-red-400' : hoursOld >= 4 ? 'text-amber-400' : 'text-gray-400')}>
                            {String(elapsed.hours).padStart(2,'0')}:{String(elapsed.mins).padStart(2,'0')} AOG
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 mb-2 line-clamp-1">{entry.work_description || 'No description'}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600">
                      {entry.station && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />{entry.station}
                        </span>
                      )}
                      {entry.flight_number && <span className="font-mono">{entry.flight_number}</span>}
                      {entry.delay_category && <span>{entry.delay_category}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Specific entry detail view */
        !currentEntry ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Entry not found</p>
            <Link to="/OOSDetail" className="text-primary text-sm mt-2 block">← Back to fleet view</Link>
          </div>
        ) : (
          <div className="px-5 pt-4 space-y-4">
            {/* Entry Header Card */}
            <div className={cn('rounded-2xl border p-5', statusInfo?.bg, statusInfo?.border || 'border-white/10')}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-3xl font-black text-white font-mono">{currentEntry.tail_number}</p>
                    <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1.5', statusInfo?.bg, statusInfo?.color, statusInfo?.border)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', statusInfo?.dot)} />
                      {statusInfo?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{currentEntry.aircraft_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">AOG Time</p>
                  <ElapsedTimer oosDate={currentEntry.oos_date} oosTime={currentEntry.oos_time} />
                </div>
              </div>

              <p className="text-sm font-bold text-white mb-3">{currentEntry.work_description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Station', value: currentEntry.station, icon: MapPin },
                  { label: 'Flight', value: currentEntry.flight_number || '—', icon: Plane },
                  { label: 'Log Page', value: currentEntry.logpage_number || '—', icon: FileText },
                  { label: 'Category', value: currentEntry.delay_category || '—', icon: Zap },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-black/20 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Icon className="w-2.5 h-2.5 text-gray-500" />
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                    </div>
                    <p className="text-xs font-bold text-white">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Actions */}
            <div className="flex gap-2 flex-wrap">
              {[
                { status: 'in_work', label: 'Mark In Work', color: 'bg-amber-600/80 border-amber-500 text-white hover:bg-amber-600', icon: Wrench },
                { status: 'waiting_on_parts', label: 'Wtg Parts', color: 'bg-orange-600/80 border-orange-500 text-white hover:bg-orange-600', icon: Package },
                { status: 'released', label: 'Release Aircraft', color: 'bg-green-600/80 border-green-500 text-white hover:bg-green-600', icon: CheckCircle },
              ].map(({ status, label, color, icon: Icon }) => (
                <button
                  key={status}
                  onClick={() => updateStatusMutation.mutate(status)}
                  disabled={updateStatusMutation.isPending || currentEntry.status === status}
                  className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold transition-all disabled:opacity-40', color)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#0d1117] border border-white/8 rounded-xl p-1">
              {TABS.map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 text-[10px] font-extrabold py-2 rounded-lg transition-all uppercase tracking-widest',
                    activeTab === tabId
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Recent Timeline Events</p>
                      {events.length === 0 ? (
                        <p className="text-xs text-gray-600 py-4 text-center">No events recorded yet</p>
                      ) : (
                        events.slice(0, 5).map(e => <EventCard key={e.id} event={e} />)
                      )}
                      <button onClick={() => setActiveTab('timeline')}
                        className="w-full text-[10px] font-bold text-primary hover:text-primary/80 py-1">
                        View all events →
                      </button>
                    </div>
                    <div className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Parts Tracked</p>
                      {parts.length === 0 ? (
                        <p className="text-xs text-gray-600 py-4 text-center">No parts tracked</p>
                      ) : (
                        parts.slice(0, 4).map(p => <PartCard key={p.id} part={p} />)
                      )}
                      <button onClick={() => setActiveTab('parts')}
                        className="w-full text-[10px] font-bold text-primary hover:text-primary/80 py-1">
                        View all parts →
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
                    {events.length === 0 ? (
                      <p className="text-xs text-gray-600 py-8 text-center">No timeline events yet</p>
                    ) : (
                      events.map(e => <EventCard key={e.id} event={e} />)
                    )}
                    <button
                      onClick={() => setShowAddEvent(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Event
                    </button>
                  </div>
                )}

                {activeTab === 'parts' && (
                  <div className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
                    {parts.length === 0 ? (
                      <p className="text-xs text-gray-600 py-8 text-center">No parts tracked</p>
                    ) : (
                      parts.map(p => <PartCard key={p.id} part={p} />)
                    )}
                    <button
                      onClick={() => setShowAddPart(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Part
                    </button>
                  </div>
                )}

                {activeTab === 'release' && (
                  <div className="bg-[#141922] border border-white/8 rounded-2xl p-6 text-center">
                    {currentEntry.status === 'released' ? (
                      <div className="space-y-3">
                        <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
                        <h3 className="text-lg font-black text-white">Aircraft Released to Service</h3>
                        <p className="text-sm text-gray-500">This aircraft has been successfully returned to service.</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold">
                          <Radio className="w-3 h-3" /> AIRWORTHY
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Shield className="w-14 h-14 text-gray-600 mx-auto" />
                        <h3 className="text-lg font-black text-white">Return to Service</h3>
                        <p className="text-sm text-gray-500">Ensure all work is complete and signed off before releasing.</p>
                        <button
                          onClick={() => updateStatusMutation.mutate('released')}
                          disabled={updateStatusMutation.isPending}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white text-sm font-extrabold hover:bg-green-500 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> Release Aircraft
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )
      )}

      <AddEventDialog
        open={showAddEvent}
        onOpenChange={setShowAddEvent}
        onSave={(data) => createEventMutation.mutate(data)}
      />
      <AddPartDialog
        open={showAddPart}
        onOpenChange={setShowAddPart}
        onSave={(data) => createPartMutation.mutate(data)}
      />
    </div>
  );
}