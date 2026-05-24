import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useFleet } from '@/lib/FleetContext';
import { FleetBadge } from '@/components/fleet/FleetSwitcher';
import {
  Plane, Search, LayoutGrid, List, Wrench, CheckCircle, Globe, Shield, ClipboardList,
  BookOpen, MapPin, Cpu, X, AlertTriangle, UserCheck, Plus, Clock,
  ChevronDown, Activity, Zap, Brain, Lock, LockOpen, Eye, ExternalLink
} from 'lucide-react';

const TerminalIcon = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Control tower crenellations */}
    <line x1="16" y1="14" x2="20" y2="14" strokeWidth="2" />
    <line x1="20" y1="14" x2="20" y2="18" strokeWidth="2" />
    <line x1="20" y1="18" x2="24" y2="18" strokeWidth="2" />
    <line x1="24" y1="18" x2="24" y2="14" strokeWidth="2" />
    <line x1="24" y1="14" x2="28" y2="14" strokeWidth="2" />
    <line x1="28" y1="14" x2="28" y2="18" strokeWidth="2" />
    {/* Tower body - wide base */}
    <path d="M 14 20 L 18 28 L 30 28 L 34 20 Z" strokeWidth="2" />
    {/* Tower main shaft */}
    <rect x="18" y="28" width="12" height="20" strokeWidth="2" />
    {/* Tower connector line to building */}
    <line x1="30" y1="35" x2="36" y2="35" strokeWidth="2" />
    {/* Terminal building main box */}
    <rect x="36" y="30" width="18" height="18" strokeWidth="2" />
    {/* Terminal roof line */}
    <line x1="36" y1="30" x2="54" y2="30" strokeWidth="2" />
    {/* Terminal windows */}
    <circle cx="41" cy="37" r="2" strokeWidth="1.5" />
    <circle cx="48" cy="37" r="2" strokeWidth="1.5" />
    <circle cx="41" cy="44" r="2" strokeWidth="1.5" />
    <circle cx="48" cy="44" r="2" strokeWidth="1.5" />
    {/* Ground line */}
    <line x1="8" y1="48" x2="56" y2="48" strokeWidth="2.5" />
  </svg>
);

const HangarIcon = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Outer peaked roof */}
    <path d="M 10 28 L 32 8 L 54 28" strokeWidth="2.5" />
    {/* Outer walls */}
    <line x1="10" y1="28" x2="10" y2="52" strokeWidth="2.5" />
    <line x1="54" y1="28" x2="54" y2="52" strokeWidth="2.5" />
    {/* Ground line */}
    <line x1="10" y1="52" x2="54" y2="52" strokeWidth="2.5" />
    {/* Inner peaked roof */}
    <path d="M 14 32 L 32 16 L 50 32" strokeWidth="2" />
    {/* Inner walls */}
    <line x1="14" y1="32" x2="14" y2="50" strokeWidth="2" />
    <line x1="50" y1="32" x2="50" y2="50" strokeWidth="2" />
    {/* Large door */}
    <rect x="20" y="35" width="24" height="15" strokeWidth="2" />
    {/* Door handle/window */}
    <rect x="28" y="38" width="8" height="4" strokeWidth="1.5" />
  </svg>
);
import AiMaintenanceInsights from '@/components/fleet/AiMaintenanceInsights';
import AircraftLocationBadge from '@/components/fleet/AircraftLocationBadge';
import LocationTypeToggle from '@/components/fleet/LocationTypeToggle';
import AiMaintenanceCard from '@/components/ai/AiMaintenanceCard';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import { motion, AnimatePresence } from 'framer-motion';
import AddTimelineEventModal from '@/components/fleet/AddTimelineEventModal';
import TakingOwnershipModal from '@/components/fleet/TakingOwnershipModal';
import PlaceOOSModal from '@/components/fleet/PlaceOOSModal';
import VirtualizedFleetGrid from '@/components/fleet/VirtualizedFleetGrid';
import { useThrottledFleet } from '@/hooks/useThrottledFleet';

const STATUS_OPTIONS = ['All Status', 'active', 'oos', 'maintenance', 'retired'];

// Industry-standard aviation status color palette
const STATUS_STYLES = {
  active:      { label: 'IN SERVICE',    bg: 'bg-[#388E3C]',  border: 'border-[#388E3C]', text: 'text-[#66BB6A]', icon: CheckCircle },
  oos:         { label: 'AOG',           bg: 'bg-[#D32F2F]',  border: 'border-[#D32F2F]', text: 'text-[#EF5350]', icon: Wrench },
  maintenance: { label: 'IN WORK',       bg: 'bg-[#1565C0]',  border: 'border-[#1565C0]', text: 'text-[#42A5F5]', icon: Wrench },
  retired:     { label: 'RETIRED',       bg: 'bg-[#616161]',  border: 'border-[#616161]', text: 'text-[#9E9E9E]', icon: Plane },
  ron:         { label: 'RON',           bg: 'bg-[#546E7A]',  border: 'border-[#546E7A]', text: 'text-[#90A4AE]', icon: Clock },
};

// MCC priority sort order: AOG → IN WORK → RON → IN SERVICE → RETIRED
const STATUS_PRIORITY = { oos: 0, maintenance: 1, ron: 2, active: 3, retired: 4 };

// Quick filter definitions
const QUICK_FILTERS = [
  { id: null,          label: 'All',           color: 'text-gray-400' },
  { id: 'aog',         label: '🔴 AOG',         color: 'text-red-400' },
  { id: 'mel',         label: '🟡 MEL',         color: 'text-amber-400' },
  { id: 'etops',       label: '🌍 ETOPS',       color: 'text-cyan-400' },
  { id: 'maintenance', label: '🔵 In Work',     color: 'text-blue-400' },
  { id: 'active',      label: '🟢 In Service',  color: 'text-green-400' },
];

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sublabel, valueColor, icon: Icon, iconColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl p-6 flex flex-col gap-2 border border-border transition-all",
        onClick && "cursor-pointer hover:border-primary/40 active:scale-[0.98]"
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

  const { data: melItems = [] } = useQuery({
    queryKey: ['fleet-mel-items', aircraft.tail_number],
    queryFn: () => base44.entities.MELItem.filter({ aircraft_tail: aircraft.tail_number }),
  });

  const { data: tailLocks = [] } = useQuery({
    queryKey: ['mcc-locks-tail', aircraft.tail_number],
    queryFn: () => base44.entities.MccLock.filter({ aircraft_tail: aircraft.tail_number, is_active: true }),
    refetchInterval: 15000,
  });
  const activeTailLock = tailLocks[0] || null;

  // Derive max CAT capability from aircraft type
  // CAT IIIc: B777, B787, A350 (highest-tier autoland certified types)
  // CAT IIIb: B737 MAX, A320, A321
  // CAT IIIa: B737-800/900, B757, B767
  // CAT II:   CRJ700, CRJ900, E175, E190
  const getMaxCatOptions = (acType = '') => {
    if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) {
      return ['CAT IIIc — Zero/Zero', 'CAT IIIb', 'CAT IIIa', 'CAT II', 'CAT I', 'DOWNGRADED'];
    }
    if (['B737 MAX', 'A320', 'A321'].some(t => acType.includes(t))) {
      return ['CAT IIIb', 'CAT IIIa', 'CAT II', 'CAT I', 'DOWNGRADED'];
    }
    if (['B737-800', 'B737-900', 'B757', 'B767'].some(t => acType.includes(t))) {
      return ['CAT IIIa', 'CAT II', 'CAT I', 'DOWNGRADED'];
    }
    // CRJ, E-jets, B737-700 default
    return ['CAT II', 'CAT I', 'DOWNGRADED'];
  };

  const catOptions = getMaxCatOptions(aircraft.aircraft_type);
  const defaultCat = catOptions[0];
  const [catStatus, setCatStatus] = useState(defaultCat);
  // Derive max ETOPS capability from aircraft type
  // ETOPS-370: B777, B787, A350 (ultra long-range twins)
  // ETOPS-180: B737 MAX, A320, A321, B767
  // ETOPS-120: B737-800/900, B757
  // NON-ETOPS: CRJ, E-jets, B737-700 and below
  const getEtopsOptions = (acType = '') => {
    if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) {
      return ['ETOPS-370', 'ETOPS-330', 'ETOPS-207', 'ETOPS-180', 'ETOPS-120', 'NON-ETOPS'];
    }
    if (['B737 MAX', 'A320', 'A321', 'B767'].some(t => acType.includes(t))) {
      return ['ETOPS-180', 'ETOPS-138', 'ETOPS-120', 'NON-ETOPS'];
    }
    if (['B737-800', 'B737-900', 'B757'].some(t => acType.includes(t))) {
      return ['ETOPS-120', 'ETOPS-90', 'NON-ETOPS'];
    }
    return ['NON-ETOPS'];
  };

  const etopsOptions = getEtopsOptions(aircraft.aircraft_type);
  const [etopsStatus, setEtopsStatus] = useState(etopsOptions[0]);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showEtopsDropdown, setShowEtopsDropdown] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showTakingOwnershipModal, setShowTakingOwnershipModal] = useState(false);
  const [showPlaceOOSModal, setShowPlaceOOSModal] = useState(false);

  const createEntryMutation = useMutation({
    mutationFn: async (data) => {
      const entry = await base44.entities.LogbookEntry.create(data);
      // If this is a Return to Service event, update aircraft status back to active
      if (data._rts) {
        await base44.entities.Aircraft.update(aircraft.id, { status: 'active' });
        setAircraft(prev => ({ ...prev, status: 'active' }));
        queryClient.setQueryData(['fleet-aircraft'], (old = []) =>
          old.map(a => a.tail_number === aircraft.tail_number ? { ...a, status: 'active' } : a)
        );
      }
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-logbook', aircraft.tail_number] });
      queryClient.invalidateQueries({ queryKey: ['fleet-aircraft'] });
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
            <div className="flex items-center gap-2">
              {(aircraft.etops_approval || ['B777','B787','A350','B737 MAX','A320','A321','B767','B737-800','B737-900','B757'].some(t => aircraft.aircraft_type?.includes(t))) && (
                <Link to="/ETOPSMonitor" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-700/40 border border-cyan-600/50 text-cyan-300 text-xs font-extrabold hover:bg-cyan-700/60 transition-colors">
                  <Globe className="w-3.5 h-3.5" /> ETOPS
                </Link>
              )}
              <Link to={`/TechOpsLogbook?tail=${aircraft.tail_number}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
                <BookOpen className="w-3.5 h-3.5" /> E-Logbook
              </Link>
            </div>
          </div>
          <LocationTypeToggle
            aircraftId={aircraft.id}
            locationType={aircraft.location_type || 'unknown'}
            locationLabel={aircraft.location_label || ''}
          />
          <div className="flex flex-col gap-4">
            {[
              { icon: MapPin, label: 'Location', value: aircraft.base_station || '—', badge: 'LIVE', iconColor: 'text-primary' },
              { icon: Cpu, label: 'Engines', value: aircraft.engine_type || '—', iconColor: 'text-orange-400' },
              { icon: CheckCircle, label: 'CAT Status', value: catStatus, iconColor: catStatus === 'DOWNGRADED' ? 'text-red-400' : catStatus === 'CAT I' ? 'text-yellow-400' : 'text-green-400' },
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
          {(() => {
            const isDowngraded = catStatus === 'DOWNGRADED';
            const isCatI = catStatus === 'CAT I';
            const borderColor = isDowngraded ? 'border-red-600/40' : isCatI ? 'border-yellow-600/40' : 'border-green-600/40';
            const bgColor = isDowngraded ? 'bg-red-900/20' : isCatI ? 'bg-yellow-900/20' : 'bg-green-900/20';
            const textColor = isDowngraded ? 'text-red-400' : isCatI ? 'text-yellow-400' : 'text-green-400';
            const maxCat = catOptions[0];
            return (
              <div className={cn('rounded-xl border px-4 py-3 relative', borderColor, bgColor)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className={cn('w-4 h-4', textColor)} />
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest', textColor)}>ILS / CAT STATUS</p>
                  </div>
                  <button onClick={() => setShowCatDropdown(v => !v)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-[#1a1f2e] text-xs font-bold text-white hover:bg-white/10">
                    {catStatus} <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <p className={cn('text-[10px]', textColor)}>
                  Max certified: <span className="font-bold">{maxCat}</span>
                  {maxCat === 'CAT IIIc — Zero/Zero' && ' · No DH · No RVR'}
                  {maxCat === 'CAT IIIb' && ' · No DH · RVR ≥ 50m'}
                  {maxCat === 'CAT IIIa' && ' · DH < 100ft · RVR ≥ 200m'}
                </p>
                {showCatDropdown && (
                  <div className="absolute right-3 top-full mt-1 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl min-w-[180px]">
                    {catOptions.map(opt => (
                      <button key={opt} onClick={() => { setCatStatus(opt); setShowCatDropdown(false); }}
                        className={cn(
                          'block w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/10',
                          opt === 'DOWNGRADED' ? 'text-red-400' :
                          opt === 'CAT I' ? 'text-yellow-400' :
                          opt.includes('IIIc') ? 'text-cyan-300' :
                          opt.includes('IIIb') ? 'text-blue-300' :
                          opt.includes('IIIa') ? 'text-green-300' :
                          'text-white'
                        )}
                      >{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ETOPS Selector */}
          <div className={cn(
            "rounded-xl border px-4 py-3 relative",
            etopsStatus === 'NON-ETOPS'
              ? 'border-red-600/40 bg-red-900/20'
              : etopsStatus === 'ETOPS-370' || etopsStatus === 'ETOPS-330'
              ? 'border-cyan-600/40 bg-cyan-900/20'
              : 'border-green-600/40 bg-green-900/20'
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className={cn('w-4 h-4',
                  etopsStatus === 'NON-ETOPS' ? 'text-red-400' :
                  etopsStatus === 'ETOPS-370' || etopsStatus === 'ETOPS-330' ? 'text-cyan-400' :
                  'text-green-400'
                )} />
                <p className={cn('text-[10px] font-bold uppercase tracking-widest',
                  etopsStatus === 'NON-ETOPS' ? 'text-red-400' :
                  etopsStatus === 'ETOPS-370' || etopsStatus === 'ETOPS-330' ? 'text-cyan-400' :
                  'text-green-400'
                )}>ETOPS STATUS</p>
              </div>
              <button onClick={() => setShowEtopsDropdown(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/20 bg-[#141922] text-xs font-bold text-white hover:bg-white/10">
                {etopsStatus} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <p className={cn('text-[10px]',
              etopsStatus === 'NON-ETOPS' ? 'text-red-400' :
              etopsStatus === 'ETOPS-370' || etopsStatus === 'ETOPS-330' ? 'text-cyan-400' :
              'text-green-400'
            )}>
              Max certified: <span className="font-bold">{etopsOptions[0]}</span>
              {etopsOptions[0] === 'ETOPS-370' && ' · 370 min · Polar / Pacific'}
              {etopsOptions[0] === 'ETOPS-180' && ' · 180 min · Extended ops'}
              {etopsOptions[0] === 'ETOPS-120' && ' · 120 min · Overwater ops'}
              {etopsOptions[0] === 'NON-ETOPS' && ' · Domestic / short-haul only'}
            </p>
            {showEtopsDropdown && (
              <div className="absolute right-3 top-full mt-1 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl min-w-[160px]">
                {etopsOptions.map(opt => (
                  <button key={opt} onClick={() => { setEtopsStatus(opt); setShowEtopsDropdown(false); }}
                    className={cn(
                      'block w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/10',
                      opt === 'NON-ETOPS' ? 'text-red-400' :
                      opt === 'ETOPS-370' ? 'text-cyan-300' :
                      opt === 'ETOPS-330' ? 'text-blue-300' :
                      opt === 'ETOPS-207' ? 'text-violet-300' :
                      'text-green-300'
                    )}>{opt}</button>
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
            {aircraft.mcc_watch && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 border border-amber-400 animate-pulse">
                <Eye className="w-4 h-4 text-black" />
                <span className="text-sm font-extrabold text-black">MCC WATCH</span>
              </div>
            )}
            {activeTailLock && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-900/60 border border-red-500 text-red-300">
                <Lock className="w-4 h-4 text-red-400" />
                <div className="text-left">
                  <p className="text-xs font-extrabold text-red-400 leading-none">MCC LOCK ACTIVE</p>
                  <p className="text-[10px] text-red-300/80 mt-0.5">By {activeTailLock.placed_by} — RTS Blocked</p>
                </div>
              </div>
            )}
            <button onClick={() => setShowTakingOwnershipModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1f2e] border border-white/15 text-white text-sm font-extrabold hover:bg-white/10 transition-colors disabled:opacity-50">
              <UserCheck className="w-4 h-4" /> TAKING OWNERSHIP
            </button>
            <button onClick={() => setShowAddEventModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          {/* MEL / NEF / CDL Deferrals */}
          {melItems.length > 0 && (
            <div className="space-y-3 mb-6">
              <p className="text-base font-extrabold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> MEL / NEF / CDL Deferrals ({melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided').length})
              </p>
              {melItems.map(mel => {
                const isExpired = mel.status === 'expired';
                const isCleared = mel.status === 'cleared' || mel.status === 'voided';
                if (isCleared) return null;
                return (
                  <div key={mel.id} className={cn('flex items-start gap-4 border rounded-xl px-5 py-4',
                    isExpired ? 'bg-red-900/20 border-red-500/40' : 'bg-amber-900/20 border-amber-500/40')}>
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', isExpired ? 'bg-red-500' : 'bg-amber-500')} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                          isExpired ? 'bg-red-900 text-red-400' : 'bg-amber-900 text-amber-400')}>
                          {mel.mel_reference || 'MEL'} {mel.mel_category ? `CAT ${mel.mel_category}` : ''}
                        </span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded',
                          isExpired ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}>
                          {isExpired ? 'EXPIRED' : mel.status?.toUpperCase() || 'OPEN'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200">{mel.title || mel.description || '—'}</p>
                      {mel.expires_at && <p className="text-[10px] text-gray-500 mt-1">Deferral expires: {new Date(mel.expires_at).toLocaleDateString()}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {logEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
              <Clock className="w-16 h-16 text-gray-700" />
              <p className="text-lg font-extrabold text-gray-400">No Timeline Events</p>
              <p className="text-sm text-gray-600">Use "PLACE OOS" to begin the maintenance record.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logEntries.map(entry => {
                const notes = entry.notes || '';
                const locationMatch = notes.match(/Location:\s*([^|]+)/);
                const phoneMatch = notes.match(/POC Phone:\s*([^|]+)/);
                const pocMatch = notes.match(/POC:\s*(?!Phone)([^|]+)/);
                const location = locationMatch ? locationMatch[1].trim() : null;
                const poc = pocMatch ? pocMatch[1].trim() : null;
                const phone = phoneMatch ? phoneMatch[1].trim() : null;
                
                return (
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
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <p className="text-[10px] text-gray-600">{new Date(entry.created_date).toLocaleString()}</p>
                        {location && location !== 'N/A' && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <MapPin className="w-3 h-3 text-cyan-500" />
                            <span className="text-cyan-400 font-semibold">{location}</span>
                          </div>
                        )}
                        {poc && poc !== 'N/A' && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <UserCheck className="w-3 h-3 text-amber-500" />
                            <span className="text-amber-400 font-semibold">{poc}</span>
                            {phone && phone !== 'N/A' && (
                              <span className="text-gray-400">· {phone}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {showAddEventModal && <AddTimelineEventModal aircraftTail={aircraft.tail_number} onClose={() => setShowAddEventModal(false)} onSubmit={(data) => createEntryMutation.mutate(data)} isPending={createEntryMutation.isPending} activeLock={activeTailLock} />}
            {showTakingOwnershipModal && <TakingOwnershipModal aircraft={aircraft} onClose={() => setShowTakingOwnershipModal(false)} onSubmit={handleTakingOwnershipSubmit} isPending={createEntryMutation.isPending} />}
            {showPlaceOOSModal && <PlaceOOSModal aircraft={aircraft} onClose={() => setShowPlaceOOSModal(false)} onSubmit={handlePlaceOOSSubmit} isPending={createEntryMutation.isPending} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Parse ETR/ETA/OOS info from the most recent logbook entry notes ──────────
function parseTimelineInfo(logEntries = []) {
  // Walk entries newest-first to find the latest ETR and Flight ETA
  let etr = null;
  let flightEta = null;
  for (const entry of [...logEntries].reverse()) {
    const notes = entry.notes || '';
    if (!etr) {
      const m = notes.match(/ETR:\s*([0-9]{1,2}:[0-9]{2})/);
      if (m) etr = m[1];
    }
    if (!flightEta) {
      const m = notes.match(/Flight ETA:\s*([0-9]{1,2}:[0-9]{2})/);
      if (m) flightEta = m[1];
    }
    if (etr && flightEta) break;
  }
  return { etr, flightEta };
}

function formatOosDuration(oosEntries, tailNumber) {
  const entry = oosEntries.find(e => e.tail_number === tailNumber || e.aircraft_tail === tailNumber);
  if (!entry) return null;
  const refDate = entry.oos_date
    ? new Date(entry.oos_date + 'T00:00:00')
    : new Date(entry.created_date);
  const diffMs = Date.now() - refDate.getTime();
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

// ── Discrepancy Badge Block ──────────────────────────────────────────────────
function DiscrepancyBadges({ discrepancies, melItems, aircraftStatus }) {
  const openDiscrepancies = discrepancies?.filter(d => d.discrepancy_status !== 'CLOSED') || [];
  const expiredMels = melItems?.filter(m => m.status === 'expired') || [];
  
  // OOS Risk if: multiple serious issues (3+) OR maintenance status OR expired MELs (but not if already OOS)
  const hasOosRisk = (openDiscrepancies.length >= 3 || 
                     aircraftStatus === 'maintenance' || 
                     expiredMels.length > 0) && 
                     aircraftStatus !== 'oos';
  
  if (!openDiscrepancies.length && !expiredMels.length) return null;
  
  const count = openDiscrepancies.length;
  const hasInProgress = openDiscrepancies.some(d => d.discrepancy_status === 'IN_PROGRESS');
  const hasPendingRii = openDiscrepancies.some(d => d.discrepancy_status === 'PENDING_RII');
  
  return (
    <div className="border-t border-amber-500/20 pt-2 mt-1 flex flex-col gap-1">
      {count > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">⚠️</span>
          <span className="text-[10px] font-extrabold text-amber-400">{count} Open Write-Up{count > 1 ? 's' : ''}</span>
        </div>
      )}
      {hasOosRisk && (
        <div className="flex items-center gap-1.5">
          <span className="text-red-400 text-[10px]">🔴</span>
          <span className="text-[10px] font-bold text-red-400">OOS Risk</span>
        </div>
      )}
      {expiredMels.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-red-400" />
          <span className="text-[10px] font-bold text-red-400">{expiredMels.length} Expired MEL{expiredMels.length > 1 ? 's' : ''}</span>
        </div>
      )}
      {count > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">🛠️</span>
          <span className="text-[10px] font-bold text-gray-300">
            {hasPendingRii ? 'Awaiting RII Sign-Off' : hasInProgress ? 'Work In Progress' : 'Assigned to Line MX'}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Turn Readiness Score ─────────────────────────────────────────────────────
function ReadinessScore({ aircraft, openDiscs = [], melItems = [] }) {
  const issues = [];
  if (aircraft.status === 'oos') issues.push('AOG');
  if (aircraft.status === 'maintenance') issues.push('In Work');
  if (openDiscs.length > 0) issues.push(`${openDiscs.length} write-up${openDiscs.length > 1 ? 's' : ''}`);
  const expiredMels = melItems.filter(m => m.status === 'expired');
  if (expiredMels.length > 0) issues.push(`${expiredMels.length} expired MEL`);

  const score = issues.length === 0 ? 'green' : issues.length <= 1 ? 'yellow' : 'red';
  const colors = { green: 'bg-[#388E3C] text-white', yellow: 'bg-[#FFA000] text-black', red: 'bg-[#D32F2F] text-white' };
  const labels = { green: 'RDY', yellow: 'AT RISK', red: 'NOT RDY' };

  return (
    <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide', colors[score])}>
      {labels[score]}
    </div>
  );
}

// ── Aircraft Card ────────────────────────────────────────────────────────────
function AircraftCard({ aircraft, onSelect, discrepancies, melItems = [], activeLocks = [], oosEntries = [], timelineEvents = [], openTasks = [], logEntries = [] }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;
  const openDiscs = discrepancies?.filter(d => d.discrepancy_status !== 'CLOSED') || [];
  const acLock = activeLocks.find(l => l.aircraft_tail === aircraft.tail_number);
  const tailOpenTasks = openTasks.filter(t => t.aircraft_tail === aircraft.tail_number);
  const activeMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');
  const expiredMels = melItems.filter(m => m.status === 'expired');

  const { etr, flightEta } = parseTimelineInfo(logEntries);
  const oosDuration = (aircraft.status === 'oos' || aircraft.status === 'maintenance')
    ? formatOosDuration(oosEntries, aircraft.tail_number)
    : null;

  // OOS duration check
  const isOosOver24h = (() => {
    if (aircraft.status !== 'oos' && aircraft.status !== 'maintenance') return false;
    const tailEntry = oosEntries.find(e => e.tail_number === aircraft.tail_number || e.aircraft_tail === aircraft.tail_number);
    if (!tailEntry) return false;
    const refDate = tailEntry.oos_date
      ? new Date(tailEntry.oos_date + 'T00:00:00')
      : new Date(tailEntry.created_date);
    return (Date.now() - refDate.getTime()) / 3600000 >= 24;
  })();

  // Card border based on urgency
  const borderCls = acLock ? 'border-[#D32F2F]/70 bg-red-950/10' :
    aircraft.status === 'oos' ? 'border-[#D32F2F]/50' :
    aircraft.status === 'maintenance' ? 'border-[#1565C0]/50' :
    expiredMels.length > 0 ? 'border-[#FFA000]/50' :
    openDiscs.length > 0 ? 'border-[#FFA000]/30' : 'border-border';

  return (
    <div onClick={() => onSelect(aircraft)}
      className={cn('bg-card rounded-xl border flex flex-col cursor-pointer hover:brightness-110 transition-all active:scale-[0.97]', borderCls)}>

      {/* ── ROW 1: Identity ── */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-base font-black text-primary tracking-wide font-mono leading-none">{aircraft.tail_number}</p>
            <p className="text-[11px] font-medium text-gray-400 mt-0.5">{aircraft.aircraft_type}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{aircraft.base_station || '—'}</p>
          </div>
          <ReadinessScore aircraft={aircraft} openDiscs={openDiscs} melItems={melItems} />
        </div>
      </div>

      {/* ── ROW 2: Status + Badges ── */}
      <div className="px-3 pb-2 flex flex-wrap gap-1 items-center">
        <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black text-white', status.bg)}>
          <StatusIcon className="w-2.5 h-2.5" /> {status.label}
        </span>
        {aircraft.etops_approval && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-400 border border-cyan-700/40">
            ETOPS-{aircraft.etops_approval}
          </span>
        )}
        {aircraft.cat_approval && aircraft.cat_approval !== 'CAT I' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/40">
            {aircraft.cat_approval}
          </span>
        )}
        {activeMels.length > 0 && (() => {
          const restrictive = activeMels.filter(m =>
            m.flight_restrictions || m.etops_critical || m.etops_impact === 'NO_ETOPS' ||
            m.etops_impact === 'ETOPS_WITH_LIMITS' || m.placard_required
          );
          return restrictive.length > 0 ? (
            <Link
              to={`/AircraftDetail?tail=${aircraft.tail_number}`}
              onClick={e => e.stopPropagation()}
              className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-900/50 transition-colors"
            >
              {activeMels.length} MEL · Restrictive
            </Link>
          ) : (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#FFA000]/20 text-[#FFA000] border border-[#FFA000]/40">
              MEL {activeMels.length}
            </span>
          );
        })()}
        {acLock && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#D32F2F]/20 text-[#EF5350] border border-[#D32F2F]/40 flex items-center gap-0.5">
            <Lock className="w-2 h-2" /> LOCKED
          </span>
        )}
        {aircraft.mcc_watch && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse flex items-center gap-0.5">
            <Eye className="w-2 h-2" /> WATCH
          </span>
        )}
        {aircraft.ferry_flight && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
            FERRY
          </span>
        )}
        <AircraftLocationBadge
          locationType={aircraft.location_type || 'unknown'}
          locationLabel={aircraft.location_label || ''}
          size="sm"
        />
      </div>

      {/* ── ROW 3: OOS timing info ── */}
      {(oosDuration || etr || flightEta) && (
        <div className="px-3 pb-2 pt-1.5 border-t border-white/6 grid grid-cols-3 gap-1">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">OOS Time</span>
            <span className={cn('text-[10px] font-black', isOosOver24h ? 'text-orange-400' : 'text-gray-300')}>
              {oosDuration || '—'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">ETR</span>
            <span className="text-[10px] font-black text-amber-400">{etr || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Flt ETA</span>
            <span className="text-[10px] font-black text-cyan-400">{flightEta || '—'}</span>
          </div>
        </div>
      )}

      {/* ── ROW 4: Risk indicators ── */}
      {(openDiscs.length > 0 || expiredMels.length > 0 || isOosOver24h || tailOpenTasks.length > 0) && (
        <div className="px-3 pb-2 pt-1 border-t border-white/6 flex flex-col gap-0.5">
          {isOosOver24h && <span className="text-[9px] text-amber-400 font-bold">⏳ OOS 24h+</span>}
          {openDiscs.length > 0 && <span className="text-[9px] text-amber-400 font-bold">⚠️ {openDiscs.length} Open write-up{openDiscs.length > 1 ? 's' : ''}</span>}
          {expiredMels.length > 0 && <span className="text-[9px] text-red-400 font-bold">🔴 {expiredMels.length} Expired MEL</span>}
          {tailOpenTasks.length > 0 && <span className="text-[9px] text-blue-400 font-bold">🔧 {tailOpenTasks.length} task{tailOpenTasks.length > 1 ? 's' : ''} assigned</span>}
        </div>
      )}

      {/* ── ROW 5: Detail link ── */}
      <div className="px-3 pb-2.5 pt-1.5 border-t border-white/6">
        <Link
          to={`/AircraftDetail?tail=${aircraft.tail_number}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-[9px] font-bold text-primary/70 hover:text-primary transition-colors"
        >
          <ExternalLink className="w-2.5 h-2.5" /> View Compliance Detail
        </Link>
      </div>
    </div>
  );
}

function AircraftRow({ aircraft, onSelect, discrepancies, activeLocks = [] }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;
  const count = discrepancies?.length || 0;
  const acLock = activeLocks.find(l => l.aircraft_tail === aircraft.tail_number);
  return (
    <div onClick={() => onSelect(aircraft)}
      className={cn(
        "flex items-center justify-between px-5 py-3 rounded-xl bg-card border hover:border-primary/30 transition-all cursor-pointer",
        acLock ? 'border-red-500/60 bg-red-950/10' : count > 0 ? 'border-amber-500/40' : 'border-border'
      )}>
      <div className="flex items-center gap-5 flex-1 min-w-0">
      <div className="flex items-center gap-2 w-40">
        <p className="text-sm font-extrabold text-primary font-mono">{aircraft.tail_number}</p>
        {aircraft.mcc_watch && <Eye className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" title="MCC Watch" />}
        {aircraft.ferry_flight && <Plane className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 animate-pulse" title="Scheduled for Ferry Flight" />}
        {acLock && <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" title={`MCC Lock: ${acLock.reason}`} />}
      </div>
        <p className="text-xs text-gray-400 w-24">{aircraft.aircraft_type}</p>
        <p className="text-xs text-gray-500 hidden sm:block">{aircraft.base_station || '—'}</p>
        {aircraft.engine_type && <p className="text-xs text-gray-600 hidden lg:block">{aircraft.engine_type}</p>}
        {count > 0 && (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-[10px] font-extrabold text-amber-400">⚠️ {count} Open Write-Up{count > 1 ? 's' : ''}</span>
            <span className="text-[10px] font-bold text-red-400">🔴 OOS Risk</span>
          </div>
        )}
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
  { id: 'insights', label: 'AI Insights',icon: Brain },
];

export default function FleetDashboard() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [kpiFilter, setKpiFilter] = useState(null);
  const [quickFilter, setQuickFilter] = useState(null); // 'aog' | 'mel' | 'etops' | 'maintenance' | 'active' | null

  const queryClient = useQueryClient();

  const { activeFleet, activeFleetId } = useFleet();

  const { data: rawAircraftAll = [], isLoading } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  // Deduplicate by tail_number — keep the most recently updated record per tail
  const dedupedAircraft = Object.values(
    rawAircraftAll.reduce((acc, a) => {
      if (!acc[a.tail_number] || new Date(a.updated_date) > new Date(acc[a.tail_number].updated_date)) {
        acc[a.tail_number] = a;
      }
      return acc;
    }, {})
  );

  // B+D: throttle real-time pushes to 500 ms, track last-5 viewed tails
  const { aircraft, recentTails, recordTailView } = useThrottledFleet(dedupedAircraft);

  const { data: openDiscrepancies = [] } = useQuery({
    queryKey: ['fleet-open-discrepancies'],
    queryFn: () => base44.entities.LogbookEntry.filter({ entry_type: 'discrepancy' }),
    refetchInterval: 60000,
  });

  const { data: oosEntries = [] } = useQuery({
    queryKey: ['fleet-oos-entries'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: mccLocks = [] } = useQuery({
    queryKey: ['mcc-locks'],
    queryFn: () => base44.entities.MccLock.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ['fleet-timeline-events'],
    queryFn: () => base44.entities.TimelineEvent.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  const { data: openTasks = [] } = useQuery({
    queryKey: ['fleet-open-tasks'],
    queryFn: () => base44.entities.SupplyRequisition.filter({ status: 'pending' }),
    refetchInterval: 60000,
  });

  const { data: allMelItems = [] } = useQuery({
    queryKey: ['fleet-all-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 2000),
    refetchInterval: 120000,
  });

  const { data: allLogEntries = [] } = useQuery({
    queryKey: ['fleet-all-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 3000),
    refetchInterval: 90000,
  });

  // Map tail -> all logbook entries sorted newest-first
  const logEntriesByTailAll = allLogEntries.reduce((acc, e) => {
    if (!acc[e.aircraft_tail]) acc[e.aircraft_tail] = [];
    acc[e.aircraft_tail].push(e);
    return acc;
  }, {});

  // Map tail -> open (non-closed) discrepancy entries
  const discrepanciesByTail = openDiscrepancies.reduce((acc, e) => {
    if (e.discrepancy_status !== 'CLOSED') {
      if (!acc[e.aircraft_tail]) acc[e.aircraft_tail] = [];
      acc[e.aircraft_tail].push(e);
    }
    return acc;
  }, {});



  // Map tail -> MEL items
  const melByTail = allMelItems.reduce((acc, m) => {
    if (!acc[m.aircraft_tail]) acc[m.aircraft_tail] = [];
    acc[m.aircraft_tail].push(m);
    return acc;
  }, {});

  const total       = aircraft.length;
  const inService   = aircraft.filter(a => a.status === 'active').length;
  const inWork      = aircraft.filter(a => a.status === 'maintenance').length;
  const outOfSvc    = aircraft.filter(a => a.status === 'oos').length;
  const aogCount    = outOfSvc;

  const filtered = aircraft
    .filter(a => {
      const matchesSearch =
        !search ||
        a.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
        a.base_station?.toLowerCase().includes(search.toLowerCase()) ||
        a.aircraft_type?.toLowerCase().includes(search.toLowerCase());

      // Always surface aircraft with restrictive MELs regardless of other filters
      const activeMelsForAc = (melByTail[a.tail_number] || []).filter(m => m.status !== 'cleared' && m.status !== 'voided');
      const hasRestrictiveMel = activeMelsForAc.some(m =>
        m.flight_restrictions || m.etops_critical || m.etops_impact === 'NO_ETOPS' ||
        m.etops_impact === 'ETOPS_WITH_LIMITS' || m.placard_required
      );

      if (hasRestrictiveMel && matchesSearch) return true;

      const matchesStatus = statusFilter === 'All Status' || a.status === statusFilter;
      const matchesKpi = !kpiFilter || a.status === kpiFilter;
      // Quick filter logic
      let matchesQuick = true;
      if (quickFilter === 'aog') matchesQuick = a.status === 'oos';
      else if (quickFilter === 'mel') matchesQuick = activeMelsForAc.length > 0;
      else if (quickFilter === 'etops') matchesQuick = !!a.etops_approval;
      else if (quickFilter === 'maintenance') matchesQuick = a.status === 'maintenance';
      else if (quickFilter === 'active') matchesQuick = a.status === 'active';
      return matchesSearch && matchesStatus && matchesKpi && matchesQuick;
    })
    // MCC priority sort: AOG → IN WORK → RON → IN SERVICE → RETIRED
    .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99));

  const acTypeLabel = activeFleet
    ? `${activeFleet.name} Aircraft`
    : 'Boeing 737 Aircraft';

  // A: derive column count from viewport width for virtualized grid
  const columnCount = useMemo(() => {
    const w = window.innerWidth;
    if (w >= 1536) return 6;
    if (w >= 1280) return 5;
    if (w >= 1024) return 4;
    if (w >= 640)  return 3;
    return 2;
  }, []);

  // B: memoized renderCard so VirtualizedFleetGrid Row doesn't re-create closures
  const renderCard = useCallback((a) => (
    <AircraftCard
      aircraft={a}
      onSelect={(ac) => { setSelectedAircraft(ac); recordTailView(ac.tail_number); }}
      discrepancies={discrepanciesByTail[a.tail_number]}
      melItems={melByTail[a.tail_number] || []}
      activeLocks={mccLocks}
      oosEntries={oosEntries}
      timelineEvents={timelineEvents}
      openTasks={openTasks}
      logEntries={logEntriesByTailAll[a.tail_number] || []}
    />
  ), [discrepanciesByTail, melByTail, mccLocks, oosEntries, timelineEvents, openTasks, recordTailView, logEntriesByTailAll]);

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── HEADER ── */}
      <div className="px-6 pt-7 pb-4">
        <div className="flex items-center gap-3 mb-6 bg-card border border-border p-4 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-widest uppercase">
            Aerodyne Fleet Registry
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <LiveClock />
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
          {/* Quick Filter Bar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {QUICK_FILTERS.map(f => (
              <button
                key={String(f.id)}
                onClick={() => setQuickFilter(quickFilter === f.id ? null : f.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                  quickFilter === f.id
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-card border-border text-gray-400 hover:text-white hover:border-white/20'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="text" placeholder="Search tail, type, base..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none hover:border-primary/40">
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'All Status' ? s : s === 'oos' ? 'Out of Service' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <div className="flex rounded-xl overflow-hidden bg-card border border-border">
              <button onClick={() => setViewMode('grid')}
                className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white')}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500">
              Showing {filtered.length.toLocaleString()} of {total.toLocaleString()} aircraft
              {quickFilter && <span className="ml-1 text-primary font-bold">· filtered</span>}
            </p>
            <div className="flex items-center gap-2">
              {(kpiFilter || quickFilter) && (
                <button
                  onClick={() => { setKpiFilter(null); setQuickFilter(null); }}
                  className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-600 py-20">Loading fleet data…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-600 py-20">No aircraft found</div>
          ) : viewMode === 'grid' ? (
            /* A: Virtualized grid — only renders visible rows for smooth 1000-ac scroll */
            <VirtualizedFleetGrid
              items={filtered}
              renderCard={renderCard}
              columnCount={columnCount}
              cardHeight={168}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map(a => (
                <div key={a.id} className="relative">
                  <AircraftRow aircraft={a} onSelect={setSelectedAircraft} discrepancies={discrepanciesByTail[a.tail_number]} activeLocks={mccLocks} />
                  <div className="absolute right-24 top-1/2 -translate-y-1/2" onClick={e => e.stopPropagation()}>
                    <AircraftLocationBadge
                      locationType={a.location_type || 'unknown'}
                      locationLabel={a.location_label || ''}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="px-6 space-y-4">
          <AiMaintenanceCard aircraftTail={selectedAircraft?.tail_number || aircraft[0]?.tail_number} />
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