import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  ChevronLeft, AlertTriangle, Wrench, Clock, CheckCircle,
  Plane, Search, Filter, Plus, Activity, Package,
  BookOpen, Calendar, ArrowRight, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  open:          { label: 'Open',          color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30' },
  wip:           { label: 'In Progress',   color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  aog:           { label: 'AOG',           color: 'text-red-300',    bg: 'bg-red-900/30',    border: 'border-red-400/50' },
  waiting_parts: { label: 'Waiting Parts', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  deferred:      { label: 'Deferred',      color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30' },
  released:      { label: 'Released',      color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30' },
};

const AC_STATUS_CONFIG = {
  oos:         { label: 'OOS',         color: 'text-red-400',    bg: 'bg-red-500/15',    dot: 'bg-red-400' },
  maintenance: { label: 'Maintenance', color: 'text-orange-400', bg: 'bg-orange-500/15', dot: 'bg-orange-400' },
  active:      { label: 'Active',      color: 'text-green-400',  bg: 'bg-green-500/15',  dot: 'bg-green-400' },
  retired:     { label: 'Retired',     color: 'text-gray-400',   bg: 'bg-gray-500/15',   dot: 'bg-gray-400' },
};

function KpiTile({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={cn('rounded-2xl border px-4 py-3 flex items-center gap-3', bg, 'border-white/10')}>
      <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
      <div>
        <p className={cn('text-2xl font-black', color)}>{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function AircraftRow({ aircraft, oosEntries }) {
  const [expanded, setExpanded] = useState(false);
  const acStatus = AC_STATUS_CONFIG[aircraft.status] || AC_STATUS_CONFIG.active;
  const acOos = oosEntries.filter(e =>
    e.aircraft_tail === aircraft.tail_number &&
    e.status !== 'released'
  );

  if (aircraft.status === 'active' && acOos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-[#141922] overflow-hidden"
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', acStatus.bg)}>
            <Plane className={cn('w-5 h-5', acStatus.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-extrabold text-white font-mono">{aircraft.tail_number}</p>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', acStatus.bg, acStatus.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', acStatus.dot)} />
                {acStatus.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {aircraft.aircraft_type} {aircraft.base_station ? `· ${aircraft.base_station}` : ''}
              {aircraft.airline ? ` · ${aircraft.airline}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {acOos.length > 0 && (
            <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-1 rounded-full">
              {acOos.length} item{acOos.length > 1 ? 's' : ''}
            </span>
          )}
          <span className={cn('transition-transform duration-200 text-gray-500', expanded && 'rotate-90')}>▶</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 space-y-2 bg-[#0f1520]">
          {acOos.length === 0 ? (
            <p className="text-xs text-gray-500 py-2 text-center">No active OOS items</p>
          ) : (
            acOos.map(entry => {
              const st = STATUS_CONFIG[entry.status] || STATUS_CONFIG.open;
              return (
                <div key={entry.id} className={cn('rounded-xl border px-3 py-2.5 space-y-1', st.bg, st.border)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-white leading-snug flex-1">{entry.description || entry.discrepancy}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', st.color, 'bg-black/20')}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                    {entry.ata_chapter && <span>ATA {entry.ata_chapter}</span>}
                    {entry.station && <span>· {entry.station}</span>}
                    {entry.created_date && <span>· {new Date(entry.created_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              );
            })
          )}
          <div className="flex gap-2 pt-1">
            <Link
              to={`/TechOpsLogbook`}
              className="flex-1 text-center text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg py-1.5 hover:bg-primary/20 transition-colors"
            >
              View Logbook →
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function OOSAircraftDashboard() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: aircraft = [], isLoading: acLoading, refetch } = useQuery({
    queryKey: ['oos-dashboard-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: oosEntries = [], isLoading: oosLoading } = useQuery({
    queryKey: ['oos-dashboard-entries'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['oos-dashboard-mel'],
    queryFn: () => base44.entities.MELItem.filter({ status: 'open' }),
    refetchInterval: 60000,
  });

  const isLoading = acLoading || oosLoading;

  // KPIs
  const oosAircraft = aircraft.filter(a => a.status === 'oos' || a.status === 'maintenance');
  const aogCount = oosEntries.filter(e => e.status === 'aog').length;
  const wipCount = oosEntries.filter(e => e.status === 'wip').length;
  const waitingPartsCount = oosEntries.filter(e => e.status === 'waiting_parts').length;
  const openMel = melItems.length;

  // Filter aircraft to show
  const filtered = aircraft.filter(a => {
    const hasOos = oosEntries.some(e => e.aircraft_tail === a.tail_number && e.status !== 'released');
    const isDown = a.status === 'oos' || a.status === 'maintenance';

    if (filterStatus === 'oos') return a.status === 'oos';
    if (filterStatus === 'maintenance') return a.status === 'maintenance';
    if (filterStatus === 'all') return isDown || hasOos;

    return isDown || hasOos;
  }).filter(a =>
    !search ||
    a.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
    a.aircraft_type?.toLowerCase().includes(search.toLowerCase()) ||
    a.base_station?.toLowerCase().includes(search.toLowerCase())
  );

  // Recent releases
  const recentReleased = oosEntries
    .filter(e => e.status === 'released')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-red-600/80 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">OOS Dashboard</p>
            <p className="text-[10px] text-red-400 font-mono tracking-widest uppercase">Out of Service Aircraft · Fleet Status</p>
          </div>
        </div>
        <button onClick={refetch} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <RefreshCw className={cn('w-4 h-4 text-white', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiTile icon={Plane}        label="Aircraft Down"   value={oosAircraft.length} color="text-red-400"    bg="bg-red-900/20" />
          <KpiTile icon={AlertTriangle} label="AOG"            value={aogCount}           color="text-red-300"   bg="bg-red-900/30" />
          <KpiTile icon={Wrench}        label="In Progress"    value={wipCount}           color="text-orange-400" bg="bg-orange-900/20" />
          <KpiTile icon={Package}       label="Waiting Parts"  value={waitingPartsCount}  color="text-yellow-400" bg="bg-yellow-900/20" />
        </div>

        {/* MEL banner */}
        {openMel > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-blue-900/20 border border-blue-500/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-bold text-blue-300">{openMel} open MEL item{openMel > 1 ? 's' : ''} across fleet</p>
            </div>
            <Link to="/MEL" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View MEL <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tail, type, station…"
              className="w-full bg-[#141922] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#141922] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Down</option>
            <option value="oos">OOS</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Aircraft list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {filtered.length} Aircraft
            </p>
            <div className="flex gap-2">
              <Link to="/NewOOS" className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New OOS Entry
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500 text-sm">Loading fleet data…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle className="w-10 h-10 text-green-500/40 mx-auto" />
              <p className="text-sm font-bold text-gray-400">All aircraft operational</p>
              <p className="text-xs text-gray-600">No OOS or maintenance items found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(a => (
                <AircraftRow key={a.id} aircraft={a} oosEntries={oosEntries} />
              ))}
            </div>
          )}
        </div>

        {/* Recently Released */}
        {recentReleased.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Recently Released
            </p>
            <div className="space-y-2">
              {recentReleased.map(entry => (
                <div key={entry.id} className="rounded-xl bg-green-900/10 border border-green-500/20 px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{entry.aircraft_tail}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{entry.description || entry.discrepancy}</p>
                  </div>
                  <span className="text-xs font-bold text-green-400">RTS ✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { icon: Activity,  label: 'Fleet Dashboard',  path: '/FleetDashboard', color: 'bg-stone-600' },
            { icon: Wrench,    label: 'MCC',              path: '/MaintenanceControl', color: 'bg-orange-600' },
            { icon: BookOpen,  label: 'E-Logbook',        path: '/TechOpsLogbook', color: 'bg-violet-600' },
            { icon: Wrench,    label: 'Technician Mode',  path: '/TechnicianMode', color: 'bg-[#1a2030]' },
          ].map(({ icon: Icon, label, path, color }) => (
            <Link
              key={path}
              to={path}
              className={cn('rounded-2xl flex flex-col items-center justify-center gap-2 py-5 border border-white/10 hover:brightness-110 active:scale-95 transition-all', color)}
            >
              <Icon className="w-5 h-5 text-white" />
              <p className="text-xs font-bold text-white text-center leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}