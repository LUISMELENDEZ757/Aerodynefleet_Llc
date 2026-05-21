import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Plane, Wrench, CheckCircle, Clock, ExternalLink, Lock, Eye, EyeOff,
  AlertTriangle, Zap, CalendarClock, Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Industry-standard aviation status palette ─────────────────────────────
const STATUS_CFG = {
  active:      { label: 'IN SERVICE', bg: 'bg-[#388E3C]', dot: 'bg-[#66BB6A]', border: 'border-[#388E3C]/40' },
  oos:         { label: 'AOG',        bg: 'bg-[#D32F2F]', dot: 'bg-[#EF5350]', border: 'border-[#D32F2F]/60' },
  maintenance: { label: 'IN WORK',   bg: 'bg-[#1976D2]', dot: 'bg-[#42A5F5]', border: 'border-[#1976D2]/50' },
  retired:     { label: 'RETIRED',   bg: 'bg-[#757575]', dot: 'bg-[#BDBDBD]', border: 'border-[#757575]/40' },
};

const FILTER_OPTIONS = [
  { value: 'all',         label: 'All' },
  { value: 'active',      label: '🟢 In Service' },
  { value: 'oos',         label: '🔴 AOG' },
  { value: 'maintenance', label: '🔵 In Work' },
  { value: 'retired',     label: '⚫ Retired' },
];

// MEL impact flags
const MEL_IMPACT_LABELS = {
  etops: 'ETOPS',
  cat2:  'CAT II',
  cat3:  'CAT III',
  dispatch: 'DISPATCH',
};

// ── MEL Hover Tooltip ────────────────────────────────────────────────────────
function MelTooltip({ melItems }) {
  const active = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');
  if (!active.length) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-[#1a1208] border border-[#FFA000]/40 rounded-xl shadow-2xl p-3 space-y-2 pointer-events-none">
      <p className="text-[9px] font-extrabold text-[#FFA000] uppercase tracking-widest mb-1">MEL / CDL Deferrals</p>
      {active.slice(0, 4).map((m, i) => {
        // Expiration countdown
        let expStr = null;
        if (m.expires_at || m.expiry_date) {
          const exp = new Date(m.expires_at || m.expiry_date);
          const hoursLeft = Math.round((exp - Date.now()) / 3600000);
          expStr = hoursLeft < 0
            ? <span className="text-red-400 font-bold">EXPIRED</span>
            : hoursLeft < 24
            ? <span className="text-red-400 font-bold">{hoursLeft}h left</span>
            : <span className="text-gray-400">{Math.round(hoursLeft / 24)}d left</span>;
        }
        // Derive impact chips
        const impacts = [];
        const desc = (m.title || m.description || '').toLowerCase();
        if (desc.includes('etops')) impacts.push('ETOPS');
        if (desc.includes('cat ii') || desc.includes('cat 2') || m.mel_category === 'A') impacts.push('CAT II');
        if (desc.includes('cat iii') || desc.includes('cat 3')) impacts.push('CAT III');

        return (
          <div key={m.id || i} className="bg-[#0d1117] rounded-lg p-2 space-y-1 border border-white/5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-white truncate">{m.title || m.description || m.mel_reference || '—'}</span>
              {m.mel_category && (
                <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded bg-[#FFA000]/20 text-[#FFA000]">
                  CAT {m.mel_category}
                </span>
              )}
            </div>
            {m.mel_reference && <p className="text-[9px] text-gray-500 font-mono">{m.mel_reference}</p>}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {impacts.map(imp => (
                  <span key={imp} className="text-[8px] font-bold px-1 py-0.5 rounded bg-red-900/60 text-red-400">⚠ {imp}</span>
                ))}
              </div>
              {expStr && <span className="text-[9px]">{expStr}</span>}
            </div>
          </div>
        );
      })}
      {active.length > 4 && (
        <p className="text-[9px] text-gray-500 text-center">+{active.length - 4} more items</p>
      )}
    </div>
  );
}

// ── Timeline Row ──────────────────────────────────────────────────────────────
function TimelineRow({ ac, logbookEntries, flights = [] }) {
  const acLogs = logbookEntries
    .filter(e => e.aircraft_tail === ac.tail_number)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const lastMxAction = acLogs.find(e =>
    e.entry_type === 'corrective_action' || e.entry_type === 'cleared'
  );
  const lastFlight = acLogs.find(e => e.flight_number);

  // Next scheduled check (from work packages / scheduled inspections — use logbook notes as proxy)
  // In the real data model, this would come from WorkPackage or ScheduledInspection entities
  // For now, derive from any logbook entry that mentions a check
  const nextCheck = acLogs.find(e =>
    (e.description || '').toLowerCase().includes('a check') ||
    (e.description || '').toLowerCase().includes('c check') ||
    (e.description || '').toLowerCase().includes('scheduled')
  );

  // Delay risk: if last logbook entry is less than 45 min old and aircraft is still in maintenance/oos
  const lastEntry = acLogs[0];
  const lastEntryAge = lastEntry ? (Date.now() - new Date(lastEntry.created_date)) / 60000 : null;
  const hasDelayRisk = (ac.status === 'oos' || ac.status === 'maintenance') && lastEntryAge !== null && lastEntryAge < 45;

  const items = [];
  if (hasDelayRisk) items.push({ icon: '⏱️', label: 'Delay risk <45 min', color: 'text-red-400 font-bold' });
  if (lastMxAction) items.push({ icon: '🔧', label: `Last MX: ${lastMxAction.description?.slice(0, 40) || 'Corrective action'}`, color: 'text-blue-300' });
  if (lastFlight) items.push({ icon: '✈️', label: `Last flt: ${lastFlight.flight_number} · ${lastFlight.station || ''}`, color: 'text-gray-400' });
  if (nextCheck) items.push({ icon: '📅', label: `Sched: ${nextCheck.description?.slice(0, 35) || 'Upcoming check'}`, color: 'text-amber-400' });

  if (!items.length) return null;

  return (
    <div className="border-t border-white/8 pt-2 mt-1 space-y-1">
      {items.map((it, i) => (
        <p key={i} className={cn('text-[10px] leading-tight flex items-start gap-1.5', it.color)}>
          <span className="flex-shrink-0">{it.icon}</span>
          <span className="truncate">{it.label}</span>
        </p>
      ))}
    </div>
  );
}

// ── Aircraft Card ──────────────────────────────────────────────────────────────
function AircraftStatusCard({ ac, oosEntries, logbookEntries, activeLocks, melByTail, removeMode, selectedForDelete, onSelectForDelete, watchMutation, ferryMutation }) {
  const [showMelTooltip, setShowMelTooltip] = useState(false);

  const cfg = STATUS_CFG[ac.status] || STATUS_CFG.active;
  const acOOS = oosEntries.filter(e => e.tail_number === ac.tail_number && (e.status === 'in_work' || e.status === 'waiting_on_parts'));
  const acDiscr = logbookEntries.filter(e => e.aircraft_tail === ac.tail_number && !e.is_cleared && e.entry_type === 'discrepancy');
  const acLock = activeLocks.find(l => l.aircraft_tail === ac.tail_number);
  const acMels = melByTail[ac.tail_number] || [];
  const activeMels = acMels.filter(m => m.status !== 'cleared' && m.status !== 'voided');
  const expiredMels = acMels.filter(m => m.status === 'expired');

  const isSelected = removeMode && selectedForDelete === ac.id;

  const borderCls = acLock ? 'border-[#D32F2F]/70 bg-red-950/20' :
    isSelected ? 'border-red-500 bg-red-900/20' :
    ac.status === 'oos' ? 'border-[#D32F2F]/50' :
    ac.status === 'maintenance' ? 'border-[#1976D2]/40' :
    expiredMels.length > 0 ? 'border-[#FFA000]/50' :
    acDiscr.length > 0 ? 'border-[#FFA000]/25' : 'border-white/10';

  return (
    <div
      onClick={removeMode ? () => onSelectForDelete(ac.id) : undefined}
      className={cn(
        'relative bg-[#141922] border rounded-2xl p-4 space-y-3 transition-all',
        removeMode && 'cursor-pointer',
        borderCls
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 text-[10px] font-extrabold text-red-300 bg-red-900/80 px-2 py-0.5 rounded-lg">SELECTED</div>
      )}

      {/* ── Row 1: Identity + Status ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Plane className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-lg font-extrabold text-white font-mono">{ac.tail_number}</span>

          {/* MCC Watch badge */}
          {ac.mcc_watch && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 border border-amber-400 animate-pulse">
              <Eye className="w-3 h-3 text-black" />
              <span className="text-[9px] font-extrabold text-black">WATCH</span>
            </div>
          )}
          {/* Ferry badge */}
          {ac.ferry_flight && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500 border border-sky-400 animate-pulse">
              <Plane className="w-3 h-3 text-white" />
              <span className="text-[9px] font-extrabold text-white">FERRY</span>
            </div>
          )}
          {/* MCC Lock badge */}
          {acLock && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#D32F2F] border border-red-500" title={`MCC Lock: ${acLock.reason}`}>
              <Lock className="w-3 h-3 text-white" />
              <span className="text-[9px] font-extrabold text-white">LOCKED</span>
            </div>
          )}
        </div>

        {/* Status pill — industry palette */}
        <span className={cn('flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white', cfg.bg)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />{cfg.label}
        </span>
      </div>

      {/* ── Row 2: Type + Base ── */}
      <p className="text-xs text-gray-500">{ac.aircraft_type} · {ac.base_station || '—'}</p>

      {/* ── Row 3: Operational badges ── */}
      <div className="flex gap-2 flex-wrap items-center">
        {acOOS.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#D32F2F]/20 text-[#EF5350] border border-[#D32F2F]/30">
            {acOOS.length} OOS OPEN
          </span>
        )}
        {acDiscr.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FFA000]/15 text-[#FFA000] border border-[#FFA000]/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{acDiscr.length} DISCREPANCY
          </span>
        )}

        {/* MEL amber badge with hover tooltip */}
        {activeMels.length > 0 && (
          <div
            className="relative"
            onMouseEnter={() => setShowMelTooltip(true)}
            onMouseLeave={() => setShowMelTooltip(false)}
          >
            <span className={cn(
              'flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border cursor-default',
              expiredMels.length > 0
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'bg-[#FFA000]/15 text-[#FFA000] border-[#FFA000]/40'
            )}>
              <Zap className="w-3 h-3" />
              MEL {activeMels.length}
              {expiredMels.length > 0 && <span className="ml-0.5 text-red-400">(!)</span>}
            </span>
            {showMelTooltip && <MelTooltip melItems={acMels} />}
          </div>
        )}

        {acOOS.length === 0 && acDiscr.length === 0 && activeMels.length === 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#388E3C]/20 text-[#66BB6A] border border-[#388E3C]/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> CLEAR
          </span>
        )}
      </div>

      {/* ── Row 4: Timeline intelligence ── */}
      <TimelineRow ac={ac} logbookEntries={logbookEntries} />

      {/* ── Row 5: MCC action buttons ── */}
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); watchMutation.mutate({ id: ac.id, mcc_watch: !ac.mcc_watch }); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border',
            ac.mcc_watch
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
              : 'bg-white/5 border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-500/30'
          )}
        >
          {ac.mcc_watch ? <><EyeOff className="w-3 h-3" /> REMOVE WATCH</> : <><Eye className="w-3 h-3" /> WATCH</>}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); ferryMutation.mutate({ id: ac.id, ferry_flight: !ac.ferry_flight }); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border',
            ac.ferry_flight
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 hover:bg-sky-500/30'
              : 'bg-white/5 border-white/10 text-gray-500 hover:text-sky-400 hover:border-sky-500/30'
          )}
        >
          <Plane className="w-3 h-3" />
          {ac.ferry_flight ? 'REMOVE FERRY' : 'FERRY FLT'}
        </button>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function MccFleetStatus({ aircraft, oosEntries, logbookEntries, removeMode, selectedForDelete, onSelectForDelete }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();

  const { data: locks = [] } = useQuery({
    queryKey: ['mcc-locks'],
    queryFn: () => base44.entities.MccLock.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: allMelItems = [] } = useQuery({
    queryKey: ['mcc-fleet-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 2000),
    refetchInterval: 120000,
  });

  const activeLocks = locks.filter(l => l.is_active);
  const openDiscrepancies = logbookEntries.filter(e => !e.is_cleared && e.entry_type === 'discrepancy');

  // Map tail → MEL items
  const melByTail = allMelItems.reduce((acc, m) => {
    if (!acc[m.aircraft_tail]) acc[m.aircraft_tail] = [];
    acc[m.aircraft_tail].push(m);
    return acc;
  }, {});

  const filteredAircraft = statusFilter === 'all'
    ? aircraft
    : aircraft.filter(a => a.status === statusFilter);

  const watchMutation = useMutation({
    mutationFn: ({ id, mcc_watch }) => base44.entities.Aircraft.update(id, { mcc_watch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fleet-aircraft'] }),
  });

  const ferryMutation = useMutation({
    mutationFn: ({ id, ferry_flight }) => base44.entities.Aircraft.update(id, { ferry_flight }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fleet-aircraft'] }),
  });

  return (
    <div className="space-y-4">
      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Fleet Dashboard',   path: '/FleetDashboard',       color: 'bg-[#D32F2F]' },
          { label: 'E-Logbook',         path: '/TechOpsLogbook',       color: 'bg-violet-600' },
          { label: 'Engineering',       path: '/EngineeringDashboard', color: 'bg-emerald-700' },
        ].map(({ label, path, color }) => (
          <Link key={path} to={path}
            className={cn('flex items-center justify-between px-4 py-3 rounded-xl text-white text-sm font-bold hover:brightness-110 transition-all', color)}>
            {label} <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </Link>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all border',
              statusFilter === value
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#141922] border-white/10 text-gray-400 hover:text-white'
            )}
          >
            {label}
            <span className="ml-1.5 opacity-60">
              ({value === 'all' ? aircraft.length : aircraft.filter(a => a.status === value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Aircraft grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAircraft.map(ac => (
          <AircraftStatusCard
            key={ac.id}
            ac={ac}
            oosEntries={oosEntries}
            logbookEntries={logbookEntries}
            activeLocks={activeLocks}
            melByTail={melByTail}
            removeMode={removeMode}
            selectedForDelete={selectedForDelete}
            onSelectForDelete={onSelectForDelete}
            watchMutation={watchMutation}
            ferryMutation={ferryMutation}
          />
        ))}
        {filteredAircraft.length === 0 && (
          <p className="col-span-3 text-center text-gray-600 text-sm py-12">No aircraft found</p>
        )}
      </div>
    </div>
  );
}