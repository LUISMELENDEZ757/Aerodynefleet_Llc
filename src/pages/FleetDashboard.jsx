import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useFleet } from '@/lib/FleetContext';
import { FleetBadge } from '@/components/fleet/FleetSwitcher';
import {
  Plane, Search, LayoutGrid, List, Wrench, CheckCircle, Globe, Shield,
  BookOpen, MapPin, Cpu, X, AlertTriangle, UserCheck, Plus, Clock,
  ChevronDown, Radio, Activity, Zap, Package, Brain, Settings2
} from 'lucide-react';
import AiMaintenanceInsights from '@/components/fleet/AiMaintenanceInsights';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AddTimelineEventModal from '@/components/fleet/AddTimelineEventModal';
import TakingOwnershipModal from '@/components/fleet/TakingOwnershipModal';
import PlaceOOSModal from '@/components/fleet/PlaceOOSModal';

const STATUS_OPTIONS = ['All Status', 'active', 'oos', 'maintenance', 'retired'];

const STATUS_STYLES = {
  active:      { label: 'RELEASED',      bg: 'bg-green-600',  icon: CheckCircle },
  oos:         { label: 'OUT OF SERVICE', bg: 'bg-red-600',    icon: Wrench },
  maintenance: { label: 'MAINTENANCE',   bg: 'bg-orange-500', icon: Wrench },
  retired:     { label: 'RETIRED',       bg: 'bg-gray-600',   icon: Plane },
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sublabel, valueColor, icon: Icon, iconColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#1a1f2e] rounded-2xl p-6 flex flex-col gap-2 border border-white/5 transition-all",
        onClick && "cursor-pointer hover:bg-[#1e2538] hover:border-primary/30 active:scale-[0.98]"
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <p className={cn('text-6xl font-black leading-none tracking-tight', valueColor)}>{value}</p>
      <p className="text-sm text-gray-500">{sublabel}</p>
    </div>
  );
}

// ── Aircraft Detail Overlay ─────────────────────────────────────────────────
function AircraftDetailOverlay({ aircraft: initialAircraft, onClose }) {
  const queryClient = useQueryClient();
  const [aircraft, setAircraft] = useState(initialAircraft);
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;

  const { data: logEntries = [] } = useQuery({
    queryKey: ['fleet-logbook', aircraft.tail_number],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: aircraft.tail_number }),
  });

  const [catStatus, setCatStatus] = useState('CAPABLE');
  const [etopsStatus, setEtopsStatus] = useState('NON-ETOPS');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showEtopsDropdown, setShowEtopsDropdown] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showTakingOwnershipModal, setShowTakingOwnershipModal] = useState(false);
  const [showPlaceOOSModal, setShowPlaceOOSModal] = useState(false);

  const createEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-logbook', aircraft.tail_number] });
      setShowAddEventModal(false);
    },
  });

  const handlePlaceOOSSubmit = (data) => {
    createEntryMutation.mutate(data);
    setAircraft(prev => ({ ...prev, status: 'oos' }));
    queryClient.setQueryData(['fleet-aircraft'], (old = []) =>
      old.map(a => a.tail_number === aircraft.tail_number ? { ...a, status: 'oos' } : a)
    );
    base44.entities.Aircraft.update(aircraft.id, { status: 'oos' }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
    });
    setShowPlaceOOSModal(false);
  };

  const handleTakingOwnershipSubmit = (data) => {
    createEntryMutation.mutate(data);
    setShowTakingOwnershipModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#0d1117] overflow-y-auto"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141922] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-white tracking-wide">{aircraft.tail_number}</p>
            <p className="text-xs text-gray-500 font-mono">{aircraft.aircraft_type}</p>
          </div>
          <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white ml-2', status.bg)}>
            <StatusIcon className="w-3 h-3" /> {status.label}
          </span>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-65px)]">
        <div className="w-full lg:w-72 flex-shrink-0 bg-[#111620] border-r border-white/10 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-base font-extrabold text-white">Aircraft Information</p>
            <Link to="/TechOpsLogbook" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
              <BookOpen className="w-3.5 h-3.5" /> E-Logbook
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { icon: MapPin, label: 'Location', value: aircraft.base_station || '—', badge: 'LIVE', iconColor: 'text-primary' },
              { icon: Cpu, label: 'Engines', value: aircraft.engine_type || '—', iconColor: 'text-orange-400' },
              { icon: CheckCircle, label: 'CAT Status', value: 'CAT II', iconColor: 'text-green-400' },
            ].map(({ icon: Icon, label, value, badge, iconColor }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', iconColor)} />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                    {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-600 text-white">{badge}</span>}
                  </div>
                  <p className="text-base font-extrabold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CAT Selector */}
          <div className="rounded-xl border border-green-600/40 bg-green-900/20 px-4 py-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">CAT II STATUS</p>
              </div>
              <button onClick={() => setShowCatDropdown(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-[#1a1f2e] text-xs font-bold text-white hover:bg-white/10">
                {catStatus} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showCatDropdown && (
              <div className="absolute right-3 top-full mt-1 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                {['CAPABLE', 'NOT CAPABLE', 'DOWNGRADED'].map(opt => (
                  <button key={opt} onClick={() => { setCatStatus(opt); setShowCatDropdown(false); }}
                    className="block w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10">{opt}</button>
                ))}
              </div>
            )}
          </div>

          {/* ETOPS Selector */}
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e] px-4 py-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ETOPS STATUS</p>
              </div>
              <button onClick={() => setShowEtopsDropdown(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-[#141922] text-xs font-bold text-white hover:bg-white/10">
                {etopsStatus} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showEtopsDropdown && (
              <div className="absolute right-3 top-full mt-1 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                {['NON-ETOPS', 'ETOPS-120', 'ETOPS-180', 'ETOPS-207'].map(opt => (
                  <button key={opt} onClick={() => { setEtopsStatus(opt); setShowEtopsDropdown(false); }}
                    className="block w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10">{opt}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-extrabold text-white">Maintenance Timeline</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowPlaceOOSModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700/80 border border-red-600 text-white text-sm font-extrabold hover:bg-red-600 transition-colors disabled:opacity-50">
              <AlertTriangle className="w-4 h-4" /> PLACE OOS
            </button>
            <button onClick={() => setShowTakingOwnershipModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1f2e] border border-white/15 text-white text-sm font-extrabold hover:bg-white/10 transition-colors disabled:opacity-50">
              <UserCheck className="w-4 h-4" /> TAKING OWNERSHIP
            </button>
            <button onClick={() => setShowAddEventModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          {logEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
              <Clock className="w-16 h-16 text-gray-700" />
              <p className="text-lg font-extrabold text-gray-400">No Timeline Events</p>
              <p className="text-sm text-gray-600">Use "PLACE OOS" to begin the maintenance record.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logEntries.map(entry => (
                <div key={entry.id} className="flex items-start gap-4 bg-[#141922] border border-white/10 rounded-xl px-5 py-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                        entry.entry_type === 'discrepancy' ? 'bg-red-900/50 text-red-400' :
                        entry.entry_type === 'corrective_action' ? 'bg-green-900/50 text-green-400' :
                        'bg-blue-900/50 text-blue-400'
                      )}>{entry.entry_type}</span>
                      {entry.ata_chapter && <span className="text-[10px] text-gray-500">ATA {entry.ata_chapter}</span>}
                    </div>
                    <p className="text-sm text-gray-200">{entry.description}</p>
                    <p className="text-[10px] text-gray-600 mt-1">{new Date(entry.created_date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showAddEventModal && <AddTimelineEventModal aircraftTail={aircraft.tail_number} onClose={() => setShowAddEventModal(false)} onSubmit={(data) => createEntryMutation.mutate(data)} isPending={createEntryMutation.isPending} />}
            {showTakingOwnershipModal && <TakingOwnershipModal aircraft={aircraft} onClose={() => setShowTakingOwnershipModal(false)} onSubmit={handleTakingOwnershipSubmit} isPending={createEntryMutation.isPending} />}
            {showPlaceOOSModal && <PlaceOOSModal aircraft={aircraft} onClose={() => setShowPlaceOOSModal(false)} onSubmit={handlePlaceOOSSubmit} isPending={createEntryMutation.isPending} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Aircraft Card ────────────────────────────────────────────────────────────
function AircraftCard({ aircraft, onSelect }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;
  return (
    <div onClick={() => onSelect(aircraft)}
      className="rounded-2xl border border-white/8 bg-[#1a1f2e] p-5 flex flex-col gap-3 hover:border-primary/40 hover:bg-[#1e2538] transition-all cursor-pointer active:scale-[0.97]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xl font-extrabold text-primary tracking-wide font-mono">{aircraft.tail_number}</p>
          <p className="text-xs text-gray-400 mt-0.5">{aircraft.aircraft_type}</p>
        </div>
        <Plane className="w-4 h-4 text-gray-600 mt-1" />
      </div>
      <p className="text-xs text-gray-500">
        Base: <span className="font-bold text-gray-300">{aircraft.base_station || '—'}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white', status.bg)}>
          <StatusIcon className="w-3 h-3" /> {status.label}
        </span>
        {aircraft.engine_type && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-gray-400 truncate max-w-[100px]">{aircraft.engine_type}</span>
        )}
      </div>
    </div>
  );
}

function AircraftRow({ aircraft, onSelect }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;
  return (
    <div onClick={() => onSelect(aircraft)}
      className="flex items-center justify-between px-5 py-3 rounded-xl border border-white/8 bg-[#1a1f2e] hover:border-primary/30 hover:bg-[#1e2538] transition-all cursor-pointer">
      <div className="flex items-center gap-5">
        <p className="text-sm font-extrabold text-primary font-mono w-24">{aircraft.tail_number}</p>
        <p className="text-xs text-gray-400 w-24">{aircraft.aircraft_type}</p>
        <p className="text-xs text-gray-500 hidden sm:block">{aircraft.base_station || '—'}</p>
        {aircraft.engine_type && <p className="text-xs text-gray-600 hidden lg:block">{aircraft.engine_type}</p>}
      </div>
      <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold text-white flex-shrink-0', status.bg)}>
        <StatusIcon className="w-3 h-3" /> {status.label}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'fleet',    label: 'Fleet',      icon: Plane },
  { id: 'rob',      label: 'ROB / BOR',  icon: Package },
  { id: 'mxcomms',  label: 'MX Comms',   icon: Radio,   live: true },
  { id: 'insights', label: 'AI Insights',icon: Brain },
];

const ACTION_BTNS = [
  { label: 'BORROWED PARTS', icon: Package,    path: '/MaintenanceControl' },
  { label: 'DMG CONTROL',    icon: AlertTriangle, path: '/IROPS' },
  { label: 'ROB CONTROL',    icon: Settings2,  path: '/OOSDashboard', primary: true },
];

export default function FleetDashboard() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [kpiFilter, setKpiFilter] = useState(null);

  const { activeFleet, activeFleetId } = useFleet();

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['fleet-aircraft', activeFleetId],
    queryFn: () => activeFleet
      ? base44.entities.Aircraft.filter({ airline: activeFleet.name }, '-created_date', 1000)
      : base44.entities.Aircraft.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  const total       = aircraft.length;
  const inService   = aircraft.filter(a => a.status === 'active').length;
  const inWork      = aircraft.filter(a => a.status === 'maintenance').length;
  const outOfSvc    = aircraft.filter(a => a.status === 'oos').length;

  const filtered = aircraft.filter(a => {
    const matchesSearch =
      !search ||
      a.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.base_station?.toLowerCase().includes(search.toLowerCase()) ||
      a.aircraft_type?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || a.status === statusFilter;
    const matchesKpi = !kpiFilter || a.status === kpiFilter;
    return matchesSearch && matchesStatus && matchesKpi;
  });

  const acTypeLabel = activeFleet
    ? `${activeFleet.name} Aircraft`
    : 'Boeing 737 Aircraft';

  return (
    <div className="min-h-screen bg-[#0d1117] pb-24">

      {/* ── HEADER ── */}
      <div className="px-6 pt-7 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <Plane className="w-7 h-7 text-primary flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-widest uppercase">
            Aerodyne Fleet Management
          </h1>
          <div className="ml-auto">
            <FleetBadge />
          </div>
        </div>

        {/* ── TAB BAR ── */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {TABS.map(({ id, label, icon: Icon, live }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all',
                activeTab === id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-[#1a1f2e] text-gray-400 hover:text-white border border-white/8'
              )}>
              <Icon className="w-4 h-4" />
              {label}
              {live && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-green-500 text-white ml-0.5">LIVE</span>}
            </button>
          ))}

          {/* Right-side action buttons */}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {ACTION_BTNS.map(({ label, icon: Icon, path, primary }) => (
              <Link key={label} to={path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border',
                  primary
                    ? 'bg-[#2a1f3d] border-purple-500/50 text-purple-300 hover:bg-purple-500/20'
                    : 'bg-[#1a1f2e] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                )}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── System Status ── */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-gray-500">System Status</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-extrabold text-green-400 tracking-widest">OPERATIONAL</span>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Total Fleet"
            value={isLoading ? '…' : total.toLocaleString()}
            sublabel={acTypeLabel}
            valueColor="text-white"
            icon={Plane}
            iconColor="text-primary"
            onClick={() => setKpiFilter(kpiFilter === null ? null : null)}
          />
          <KpiCard
            label="In Service"
            value={isLoading ? '…' : inService.toLocaleString()}
            sublabel="Active Operations"
            valueColor="text-green-400"
            icon={CheckCircle}
            iconColor="text-green-400"
            onClick={() => setKpiFilter(kpiFilter === 'active' ? null : 'active')}
          />
          <KpiCard
            label="In Work"
            value={isLoading ? '…' : inWork.toLocaleString()}
            sublabel="Under Maintenance"
            valueColor="text-primary"
            icon={Wrench}
            iconColor="text-primary"
            onClick={() => setKpiFilter(kpiFilter === 'maintenance' ? null : 'maintenance')}
          />
          <KpiCard
            label="Out of Service"
            value={isLoading ? '…' : outOfSvc.toLocaleString()}
            sublabel="Awaiting Service"
            valueColor={outOfSvc > 0 ? 'text-orange-400' : 'text-gray-600'}
            icon={Clock}
            iconColor={outOfSvc > 0 ? 'text-orange-400' : 'text-gray-600'}
            onClick={() => setKpiFilter(kpiFilter === 'oos' ? null : 'oos')}
          />
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      {activeTab === 'fleet' && (
        <div className="px-6">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-[#1a1f2e] border border-white/8 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input type="text" placeholder="Search tail, type, base..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#1a1f2e] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'All Status' ? s : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <div className="flex rounded-xl overflow-hidden border border-white/8">
              <button onClick={() => setViewMode('grid')}
                className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-[#1a1f2e] text-gray-500 hover:text-white')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-[#1a1f2e] text-gray-500 hover:text-white')}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-600">Showing {filtered.length.toLocaleString()} of {total.toLocaleString()} aircraft</p>
            {kpiFilter && (
              <button
                onClick={() => setKpiFilter(null)}
                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filter
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center text-gray-600 py-20">Loading fleet data…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-600 py-20">No aircraft found</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filtered.map(a => <AircraftCard key={a.id} aircraft={a} onSelect={setSelectedAircraft} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map(a => <AircraftRow key={a.id} aircraft={a} onSelect={setSelectedAircraft} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rob' && (
        <div className="px-6 flex flex-col items-center justify-center py-20 gap-3">
          <Package className="w-14 h-14 text-gray-700" />
          <p className="text-gray-400 font-extrabold text-lg">ROB / BOR Management</p>
          <p className="text-gray-600 text-sm text-center max-w-sm">Robbed parts tracking and bill of resources coming soon. See Maintenance Control for current parts data.</p>
          <Link to="/MaintenanceControl" className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            Go to MCC →
          </Link>
        </div>
      )}

      {activeTab === 'mxcomms' && (
        <div className="px-6 flex flex-col items-center justify-center py-20 gap-3">
          <Radio className="w-14 h-14 text-gray-700" />
          <p className="text-gray-400 font-extrabold text-lg">MX Communications</p>
          <p className="text-gray-600 text-sm text-center max-w-sm">Live maintenance communications feed. Route to CommCenter for full ACARS and messaging.</p>
          <Link to="/CommCenter" className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            Open CommCenter →
          </Link>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="px-6">
          <AiMaintenanceInsights aircraft={aircraft} />
        </div>
      )}

      <AnimatePresence>
        {selectedAircraft && (
          <AircraftDetailOverlay aircraft={selectedAircraft} onClose={() => setSelectedAircraft(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}