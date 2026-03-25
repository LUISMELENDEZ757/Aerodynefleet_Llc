import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Plane, Search, LayoutGrid, List, Wrench, CheckCircle, Globe, Shield,
  BookOpen, MapPin, Cpu, X, AlertTriangle, UserCheck, Plus, Clock, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AddTimelineEventModal from '@/components/fleet/AddTimelineEventModal';
import TakingOwnershipModal from '@/components/fleet/TakingOwnershipModal';
import PlaceOOSModal from '@/components/fleet/PlaceOOSModal';

const STATUS_OPTIONS = ['All Status', 'active', 'oos', 'maintenance', 'retired'];

const STATUS_STYLES = {
  active:      { label: 'RELEASED',    bg: 'bg-green-600',  icon: CheckCircle },
  oos:         { label: 'OOS',         bg: 'bg-red-600',    icon: Wrench },
  maintenance: { label: 'MAINTENANCE', bg: 'bg-orange-500', icon: Wrench },
  retired:     { label: 'RETIRED',     bg: 'bg-gray-600',   icon: Plane },
};

// ── Aircraft Detail Overlay ─────────────────────────────────────────────────
function AircraftDetailOverlay({ aircraft, onClose }) {
  const queryClient = useQueryClient();
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
    // Update aircraft status to OOS
    queryClient.setQueryData(['fleet-aircraft'], (old = []) =>
      old.map(a => a.tail_number === aircraft.tail_number ? { ...a, status: 'oos' } : a)
    );
    base44.entities.Aircraft.update(aircraft.id, { status: 'oos' });
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
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-50 bg-[#0d1117] overflow-y-auto"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141922] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Plane className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-white tracking-wide">{aircraft.tail_number}</p>
            <p className="text-xs text-gray-500 font-mono">{aircraft.aircraft_type}</p>
          </div>
          <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white ml-2', status.bg)}>
            <StatusIcon className="w-3 h-3" /> {status.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-65px)]">

        {/* ── LEFT: Aircraft Information ── */}
        <div className="w-full lg:w-72 flex-shrink-0 bg-[#111620] border-r border-white/10 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-base font-extrabold text-white">Aircraft Information</p>
            <Link
              to="/TechOpsLogbook"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold tracking-wide hover:bg-primary/90 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              E-logbook<br />SIGN-OFF
            </Link>
          </div>

          {/* Info fields */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Location</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-600 text-white">LIVE</span>
                </div>
                <p className="text-base font-extrabold text-white">{aircraft.base_station || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gate</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-600 text-white">LIVE</span>
                </div>
                <p className="text-base font-extrabold text-white">{aircraft.operator_number || 'N/A'}</p>
              </div>
            </div>

            {aircraft.engine_type && (
              <div className="flex items-start gap-3">
                <Cpu className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Engines</p>
                  <p className="text-base font-extrabold text-white">{aircraft.engine_type}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">CAT Status</p>
                <p className="text-base font-extrabold text-white">CAT II</p>
              </div>
            </div>
          </div>

          {/* CAT II STATUS Selector */}
          <div className="rounded-xl border border-green-600/40 bg-green-900/20 px-4 py-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">CAT II</p>
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">STATUS</p>
                </div>
              </div>
              <button
                onClick={() => setShowCatDropdown(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-[#1a1f2e] text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                {catStatus} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showCatDropdown && (
              <div className="absolute right-3 top-full mt-1 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                {['CAPABLE', 'NOT CAPABLE', 'DOWNGRADED'].map(opt => (
                  <button key={opt} onClick={() => { setCatStatus(opt); setShowCatDropdown(false); }}
                    className="block w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ETOPS STATUS Selector */}
          <div className="rounded-xl border border-white/10 bg-[#1a1f2e] px-4 py-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ETOPS</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">STATUS</p>
                </div>
              </div>
              <button
                onClick={() => setShowEtopsDropdown(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-[#141922] text-xs font-bold text-white hover:bg-white/10 transition-colors"
              >
                {etopsStatus} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showEtopsDropdown && (
              <div className="absolute right-3 top-full mt-1 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                {['NON-ETOPS', 'ETOPS-120', 'ETOPS-180', 'ETOPS-207'].map(opt => (
                  <button key={opt} onClick={() => { setEtopsStatus(opt); setShowEtopsDropdown(false); }}
                    className="block w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {aircraft.notes && (
            <p className="text-xs text-gray-500 bg-white/5 rounded-xl px-3 py-2 leading-snug">{aircraft.notes}</p>
          )}
        </div>

        {/* ── RIGHT: Maintenance Timeline ── */}
        <div className="flex-1 p-6 flex flex-col gap-5">
          {/* Timeline header */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-extrabold text-white">Maintenance Timeline</h2>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPlaceOOSModal(true)}
              disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700/80 border border-red-600 text-white text-sm font-extrabold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" /> PLACE OOS
            </button>
            <button
              onClick={() => setShowTakingOwnershipModal(true)}
              disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1f2e] border border-white/15 text-white text-sm font-extrabold hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" /> TAKING OWNERSHIP
            </button>
            <button
              onClick={() => setShowAddEventModal(true)}
              disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          {/* Timeline entries */}
          {logEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
              <Clock className="w-16 h-16 text-gray-700" />
              <p className="text-lg font-extrabold text-gray-400">No Timeline Events</p>
              <p className="text-sm text-gray-600">Use "PLACE OOS" to begin the maintenance record.</p>
              <button
                onClick={() => setShowPlaceOOSModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-700/80 border border-red-600 text-white text-sm font-extrabold hover:bg-red-600 transition-colors mt-2"
              >
                <AlertTriangle className="w-4 h-4" /> PLACE OOS
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logEntries.map((entry, i) => (
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

          {/* Add Event Modal */}
          <AnimatePresence>
            {showAddEventModal && (
              <AddTimelineEventModal
                aircraftTail={aircraft.tail_number}
                onClose={() => setShowAddEventModal(false)}
                onSubmit={(data) => createEntryMutation.mutate(data)}
                isPending={createEntryMutation.isPending}
              />
            )}
          </AnimatePresence>

          {/* Taking Ownership Modal */}
          <AnimatePresence>
            {showTakingOwnershipModal && (
              <TakingOwnershipModal
                aircraft={aircraft}
                onClose={() => setShowTakingOwnershipModal(false)}
                onSubmit={handleTakingOwnershipSubmit}
                isPending={createEntryMutation.isPending}
              />
            )}
          </AnimatePresence>

          {/* Place OOS Modal */}
          <AnimatePresence>
            {showPlaceOOSModal && (
              <PlaceOOSModal
                aircraft={aircraft}
                onClose={() => setShowPlaceOOSModal(false)}
                onSubmit={handlePlaceOOSSubmit}
                isPending={createEntryMutation.isPending}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Aircraft Card (grid) ────────────────────────────────────────────────────
function AircraftCard({ aircraft, onSelect }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;

  return (
    <div
      onClick={() => onSelect(aircraft)}
      className="rounded-2xl border border-white/10 bg-[#161b27] p-5 flex flex-col gap-3 hover:border-orange-500/40 hover:bg-[#1e2436] transition-all cursor-pointer active:scale-[0.97]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-extrabold text-primary tracking-wide">{aircraft.tail_number}</p>
          <p className="text-sm text-gray-400 mt-0.5">{aircraft.aircraft_type}</p>
        </div>
        <Plane className="w-5 h-5 text-gray-500 mt-1" />
      </div>
      <p className="text-sm text-gray-400">
        Location: <span className="font-bold text-white">{aircraft.base_station || '—'}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white', status.bg)}>
          <StatusIcon className="w-3.5 h-3.5" /> {status.label}
        </span>
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-gray-700 border border-gray-600">
          <Shield className="w-3 h-3" /> FOB
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-green-400 border border-green-500/40 bg-green-500/10">
          <CheckCircle className="w-3 h-3" /> CAT II
        </span>
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-blue-300 border border-blue-400/30 bg-blue-400/10">
          <Globe className="w-3 h-3" /> NON-ETOPS
        </span>
      </div>
      {aircraft.airline && <p className="text-xs text-gray-500">{aircraft.airline}</p>}
    </div>
  );
}

function AircraftRow({ aircraft, onSelect }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;
  return (
    <div
      onClick={() => onSelect(aircraft)}
      className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-[#161b27] hover:border-orange-500/30 hover:bg-[#1e2436] transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <p className="text-base font-extrabold text-primary w-28">{aircraft.tail_number}</p>
        <p className="text-sm text-gray-400 w-24">{aircraft.aircraft_type}</p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Loc:</span> <span className="text-white font-semibold">{aircraft.base_station || '—'}</span>
        </p>
      </div>
      <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white', status.bg)}>
        <StatusIcon className="w-3 h-3" /> {status.label}
      </span>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function FleetDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAircraft, setSelectedAircraft] = useState(null);

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
    refetchInterval: 60000,
  });

  const filtered = aircraft.filter(a => {
    const matchesSearch =
      !search ||
      a.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.base_station?.toLowerCase().includes(search.toLowerCase()) ||
      a.aircraft_type?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Fleet Dashboard</h1>
          <p className="text-xs font-mono text-orange-400 tracking-widest uppercase">TechOps · Aircraft Status</p>
        </div>
      </div>

      {/* Search + Filter + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-[#161b27] border border-white/10 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by tail number or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#161b27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 capitalize"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s} className="capitalize">{s === 'All Status' ? s : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="flex rounded-xl overflow-hidden border border-white/10 self-start sm:self-auto">
          <button onClick={() => setViewMode('grid')} className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-[#161b27] text-gray-400 hover:text-white')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-[#161b27] text-gray-400 hover:text-white')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-5 flex items-center gap-1.5">
        <span className="text-gray-400">↗</span>
        Showing {filtered.length} of {aircraft.length} aircraft
      </p>

      {isLoading ? (
        <div className="text-center text-gray-500 py-16">Loading fleet data…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">No aircraft found</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(a => <AircraftCard key={a.id} aircraft={a} onSelect={setSelectedAircraft} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(a => <AircraftRow key={a.id} aircraft={a} onSelect={setSelectedAircraft} />)}
        </div>
      )}

      {/* Full-page detail overlay */}
      <AnimatePresence>
        {selectedAircraft && (
          <AircraftDetailOverlay aircraft={selectedAircraft} onClose={() => setSelectedAircraft(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}