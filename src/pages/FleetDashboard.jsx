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
import AiMaintenanceCard from '@/components/ai/AiMaintenanceCard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AddTimelineEventModal from '@/components/fleet/AddTimelineEventModal';
import TakingOwnershipModal from '@/components/fleet/TakingOwnershipModal';
import PlaceOOSModal from '@/components/fleet/PlaceOOSModal';
import AddAircraftWizard from '@/components/fleet/AddAircraftWizard';

const STATUS_OPTIONS = ['All Status', 'active', 'oos', 'maintenance', 'retired'];

// Airline-authentic three-state maintenance status system
const MAINTENANCE_STATUS = {
  airworthy:    { label: 'AIRWORTHY',           bg: 'bg-green-600',  icon: CheckCircle },
  mel:          { label: 'AIRWORTHY WITH MEL',  bg: 'bg-yellow-500', icon: AlertTriangle },
  oos:          { label: 'OUT OF SERVICE',      bg: 'bg-red-600',    icon: Wrench },
};

// Legacy status mapping for compatibility
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

// ── Discrepancy Badge Block ──────────────────────────────────────────────────
function DiscrepancyBadges({ discrepancies }) {
  if (!discrepancies || discrepancies.length === 0) return null;
  const count = discrepancies.length;
  const hasInProgress = discrepancies.some(d => d.discrepancy_status === 'IN_PROGRESS');
  const hasPendingRii = discrepancies.some(d => d.discrepancy_status === 'PENDING_RII');
  return (
    <div className="border-t border-amber-500/20 pt-2 mt-1 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-amber-400">⚠️</span>
        <span className="text-[10px] font-extrabold text-amber-400">{count} Open Write-Up{count > 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-red-400 text-[10px]">🔴</span>
        <span className="text-[10px] font-bold text-red-400">RON Risk</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]">🛠️</span>
        <span className="text-[10px] font-bold text-gray-300">
          {hasPendingRii ? 'Awaiting RII Sign-Off' : hasInProgress ? 'Work In Progress' : 'Assigned to Line MX'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 text-sky-400" />
        <span className="text-[10px] font-bold text-sky-400">ETA: 06:30</span>
      </div>
    </div>
  );
}

// ── Aircraft Card ────────────────────────────────────────────────────────────
function AircraftCard({ aircraft, onSelect, discrepancies, maintenanceStatus }) {
  const status = MAINTENANCE_STATUS[maintenanceStatus] || MAINTENANCE_STATUS.airworthy;
  const StatusIcon = status.icon;
  const hasDiscrepancies = discrepancies && discrepancies.length > 0;
  return (
    <div onClick={() => onSelect(aircraft)}
      className={cn(
        "bg-card rounded-2xl border p-5 flex flex-col gap-3 hover:border-primary/40 transition-all cursor-pointer active:scale-[0.97]",
        hasDiscrepancies ? 'border-amber-500/40' : 'border-border'
      )}>
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
      <DiscrepancyBadges discrepancies={discrepancies} />
    </div>
  );
}

function AircraftRow({ aircraft, onSelect, discrepancies, maintenanceStatus }) {
  const status = MAINTENANCE_STATUS[maintenanceStatus] || MAINTENANCE_STATUS.airworthy;
  const StatusIcon = status.icon;
  const count = discrepancies?.length || 0;
  return (
    <div onClick={() => onSelect(aircraft)}
      className={cn(
        "flex items-center justify-between px-5 py-3 rounded-xl bg-card border hover:border-primary/30 transition-all cursor-pointer",
        count > 0 ? 'border-amber-500/40' : 'border-border'
      )}>
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <p className="text-sm font-extrabold text-primary font-mono w-24">{aircraft.tail_number}</p>
        <p className="text-xs text-gray-400 w-24">{aircraft.aircraft_type}</p>
        <p className="text-xs text-gray-500 hidden sm:block">{aircraft.base_station || '—'}</p>
        {aircraft.engine_type && <p className="text-xs text-gray-600 hidden lg:block">{aircraft.engine_type}</p>}
        {count > 0 && (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-[10px] font-extrabold text-amber-400">⚠️ {count} Open Write-Up{count > 1 ? 's' : ''}</span>
            <span className="text-[10px] font-bold text-red-400">🔴 RON Risk</span>
            <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1"><Clock className="w-3 h-3" /> ETA: 06:30</span>
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
  const queryClient = useQueryClient();

  const { activeFleet } = useFleet();

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

  const { data: melItems = [] } = useQuery({
    queryKey: ['fleet-mel-items'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 500),
    refetchInterval: 60000,
  });

  // Map tail -> open (non-closed) discrepancy entries
  const discrepanciesByTail = openDiscrepancies.reduce((acc, e) => {
    if (e.discrepancy_status !== 'CLOSED') {
      if (!acc[e.aircraft_tail]) acc[e.aircraft_tail] = [];
      acc[e.aircraft_tail].push(e);
    }
    return acc;
  }, {});
  
  const oosAircraft = new Set(aircraft.filter(a => a.status === 'oos').map(a => a.tail_number));
  const melByTail = new Set(melItems.map(m => m.aircraft_tail));

  const total       = aircraft.length;
  const airworthy   = aircraft.filter(a => !oosAircraft.has(a.tail_number) && !melByTail.has(a.tail_number)).length;
  const withMel     = aircraft.filter(a => melByTail.has(a.tail_number)).length;
  const outOfSvc    = aircraft.filter(a => oosAircraft.has(a.tail_number)).length;

  // Determine maintenance status using three-state logic
  const getMaintenanceStatus = (tail) => {
    if (oosAircraft.has(tail)) return 'oos';      // RED: Out of Service
    if (melByTail.has(tail)) return 'mel';        // YELLOW: Airworthy with MEL
    return 'airworthy';                            // GREEN: Airworthy
  };

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
            label="Airworthy"
            value={isLoading ? '…' : airworthy.toLocaleString()}
            sublabel="No Restrictions"
            valueColor="text-green-400"
            icon={CheckCircle}
            iconColor="text-green-400"
            onClick={() => setKpiFilter(kpiFilter === 'airworthy' ? null : 'airworthy')}
          />
          <KpiCard
            label="Airworthy with MEL"
            value={isLoading ? '…' : withMel.toLocaleString()}
            sublabel="Dispatch Restricted"
            valueColor="text-yellow-400"
            icon={AlertTriangle}
            iconColor="text-yellow-400"
            onClick={() => setKpiFilter(kpiFilter === 'mel' ? null : 'mel')}
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
                <option key={s} value={s}>{s === 'All Status' ? s : s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
                  <AircraftCard aircraft={a} onSelect={setSelectedAircraft} discrepancies={discrepanciesByTail[a.tail_number]} maintenanceStatus={getMaintenanceStatus(a.tail_number)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map(a => (
                <div key={a.id} className="relative">
                  <AircraftRow aircraft={a} onSelect={setSelectedAircraft} discrepancies={discrepanciesByTail[a.tail_number]} maintenanceStatus={getMaintenanceStatus(a.tail_number)} />
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
        <AddAircraftWizard
          onClose={() => setShowAddWizard(false)}
          onSuccess={() => setShowAddWizard(false)}
        />
      )}
    </div>
  );
}