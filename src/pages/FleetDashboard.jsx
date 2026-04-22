import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useFleet } from '@/lib/FleetContext';
import { FleetBadge } from '@/components/fleet/FleetSwitcher';
import {
  Plane, Search, LayoutGrid, List, Wrench, CheckCircle, Globe, Shield,
  BookOpen, MapPin, Cpu, X, AlertTriangle, UserCheck, Plus, Clock,
  ChevronDown, Radio, Activity, Zap, Package, Brain, Settings2, Lock, LockOpen, Eye
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
import AiMaintenanceCard from '@/components/ai/AiMaintenanceCard';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import { motion, AnimatePresence } from 'framer-motion';
import AddTimelineEventModal from '@/components/fleet/AddTimelineEventModal';
import TakingOwnershipModal from '@/components/fleet/TakingOwnershipModal';
import PlaceOOSModal from '@/components/fleet/PlaceOOSModal';
import FleetIngestionHub from '@/components/fleet/FleetIngestionHub';

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
            <Link to={`/TechOpsLogbook?tail=${aircraft.tail_number}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
              <BookOpen className="w-3.5 h-3.5" /> E-Logbook
            </Link>
          </div>
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
            {showAddEventModal && <AddTimelineEventModal aircraftTail={aircraft.tail_number} onClose={() => setShowAddEventModal(false)} onSubmit={(data) => createEntryMutation.mutate(data)} isPending={createEntryMutation.isPending} activeLock={activeTailLock} />}
            {showTakingOwnershipModal && <TakingOwnershipModal aircraft={aircraft} onClose={() => setShowTakingOwnershipModal(false)} onSubmit={handleTakingOwnershipSubmit} isPending={createEntryMutation.isPending} />}
            {showPlaceOOSModal && <PlaceOOSModal aircraft={aircraft} onClose={() => setShowPlaceOOSModal(false)} onSubmit={handlePlaceOOSSubmit} isPending={createEntryMutation.isPending} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
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

// ── Aircraft Card ────────────────────────────────────────────────────────────
function AircraftCard({ aircraft, onSelect, discrepancies, activeLocks = [], oosEntries = [] }) {
  const [locationType, setLocationType] = useState('terminal');
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;
  const openDiscs = discrepancies?.filter(d => d.discrepancy_status !== 'CLOSED') || [];
  const hasHighRisk = openDiscs.length >= 3 || aircraft.status === 'oos' || aircraft.status === 'maintenance';
  const acLock = activeLocks.find(l => l.aircraft_tail === aircraft.tail_number);

  // Check if aircraft has been OOS for 24+ hours
  const isOosOver24h = (() => {
    if (aircraft.status !== 'oos' && aircraft.status !== 'maintenance') return false;
    const tailEntry = oosEntries.find(e => e.tail_number === aircraft.tail_number || e.aircraft_tail === aircraft.tail_number);
    if (!tailEntry) return false;
    // Use oos_date if available (YYYY-MM-DD string), else fall back to created_date
    let refDate;
    if (tailEntry.oos_date) {
      // oos_date is "YYYY-MM-DD" — compare as date strings against yesterday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oosDay = new Date(tailEntry.oos_date + 'T00:00:00');
      refDate = oosDay;
    } else {
      refDate = new Date(tailEntry.created_date);
    }
    const hoursOos = (Date.now() - refDate.getTime()) / (1000 * 60 * 60);
    return hoursOos >= 24;
  })();
  
  const LocationIcon = locationType === 'terminal' ? TerminalIcon : HangarIcon;
  
  return (
    <div onClick={() => onSelect(aircraft)}
    className={cn(
      "bg-card rounded-2xl border p-5 flex flex-col gap-3 hover:border-primary/40 transition-all cursor-pointer active:scale-[0.97]",
      acLock ? 'border-red-500/60 bg-red-950/10' : hasHighRisk ? 'border-red-500/40' : openDiscs.length > 0 ? 'border-amber-500/40' : 'border-border'
    )}>
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xl font-extrabold text-primary tracking-wide font-mono">{aircraft.tail_number}</p>
          {aircraft.mcc_watch && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 border border-amber-400 animate-pulse" title="MCC Watch — Focus on this aircraft">
              <Eye className="w-3 h-3 text-black" />
              <span className="text-[9px] font-extrabold text-black">MCC WATCH</span>
            </div>
          )}
          {aircraft.ferry_flight && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500 border border-sky-400 animate-pulse" title="Scheduled for Ferry Flight">
              <Plane className="w-3 h-3 text-white" />
              <span className="text-[9px] font-extrabold text-white">FERRY</span>
            </div>
          )}
          {isOosOver24h && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-800/60 border border-amber-600/60" title="Aircraft has been OOS for 24+ hours">
              <span className="text-[11px]">⏳</span>
              <span className="text-[9px] font-extrabold text-amber-400">24H+</span>
            </div>
          )}
          {acLock && (
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-lg border", acLock.is_active ? "bg-red-600 border-red-500" : "bg-green-600 border-green-500")} title={acLock.is_active ? `MCC Lock: ${acLock.reason}` : "Released by Maintenance Control"}>
              {acLock.is_active ? <Lock className="w-3 h-3 text-white" /> : <LockOpen className="w-3 h-3 text-white" />}
              <span className="text-[9px] font-extrabold text-white">{acLock.is_active ? "LOCKED" : "UNLOCKED"}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{aircraft.aircraft_type}</p>
      </div>
      <Plane className={cn("w-4 h-4 mt-1", aircraft.status === 'active' ? 'text-green-400' : aircraft.status === 'oos' ? 'text-red-400' : aircraft.status === 'maintenance' ? 'text-orange-400' : 'text-gray-600')} />
    </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Base: <span className="font-bold text-gray-300">{aircraft.base_station || '—'}</span>
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLocationType(locationType === 'terminal' ? 'hangar' : 'terminal');
          }}
          className="flex-shrink-0 ml-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          title={`Click to switch to ${locationType === 'terminal' ? 'hangar' : 'terminal'}`}
        >
          <LocationIcon className="w-6 h-6 text-primary" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white', status.bg)}>
          <StatusIcon className="w-3 h-3" /> {status.label}
        </span>
        {aircraft.engine_type && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-gray-400 truncate max-w-[100px]">{aircraft.engine_type}</span>
        )}
      </div>
      <DiscrepancyBadges discrepancies={discrepancies} melItems={[]} aircraftStatus={aircraft.status} />
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
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const queryClient = useQueryClient();

  const { activeFleet, activeFleetId } = useFleet();

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 1000),
    refetchInterval: 60000,
  });

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

  // Map tail -> open (non-closed) discrepancy entries
  const discrepanciesByTail = openDiscrepancies.reduce((acc, e) => {
    if (e.discrepancy_status !== 'CLOSED') {
      if (!acc[e.aircraft_tail]) acc[e.aircraft_tail] = [];
      acc[e.aircraft_tail].push(e);
    }
    return acc;
  }, {});

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
    <div className="min-h-screen bg-background pb-24">

      {/* ── HEADER ── */}
      <div className="px-6 pt-7 pb-4">
        <div className="flex items-center gap-3 mb-6 bg-card border border-border p-4 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-widest uppercase">
            Aerodyne Fleet Management
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

          {/* Right-side action buttons */}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddWizard(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-all border border-primary"
            >
              <Plus className="w-3.5 h-3.5" /> ADD AIRCRAFT
            </button>
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
            <p className="text-xs text-gray-600">Showing {filtered.length.toLocaleString()} of {total.toLocaleString()} aircraft</p>
            <div className="flex items-center gap-2">
              {kpiFilter && (
                <button
                  onClick={() => setKpiFilter(null)}
                  className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filter
                </button>
              )}

            </div>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-600 py-20">Loading fleet data…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-600 py-20">No aircraft found</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filtered.map(a => (
                <div key={a.id} className="relative">
                  <AircraftCard aircraft={a} onSelect={setSelectedAircraft} discrepancies={discrepanciesByTail[a.tail_number]} activeLocks={mccLocks} oosEntries={oosEntries} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map(a => (
                <div key={a.id} className="relative">
                  <AircraftRow aircraft={a} onSelect={setSelectedAircraft} discrepancies={discrepanciesByTail[a.tail_number]} activeLocks={mccLocks} />
                </div>
              ))}
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

      {showAddWizard && (
        <FleetIngestionHub
          onClose={() => setShowAddWizard(false)}
          onSuccess={() => setShowAddWizard(false)}
        />
      )}
    </div>
  );
}