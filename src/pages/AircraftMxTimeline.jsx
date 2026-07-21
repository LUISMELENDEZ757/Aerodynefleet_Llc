import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Plane, Clock, AlertTriangle, UserCheck, Plus, BookOpen, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AircraftInfoSidebar from '@/components/fleet/AircraftInfoSidebar';
import MxTimelineEventCard from '@/components/fleet/MxTimelineEventCard';
import PlaceOOSModal from '@/components/fleet/PlaceOOSModal';
import TakingOwnershipModal from '@/components/fleet/TakingOwnershipModal';
import AddTimelineEventModal from '@/components/fleet/AddTimelineEventModal';
import { allocateLogPage, syncAfterEntryCreate } from '@/lib/logbookOsSync';

const STATUS_BADGE = {
  active:      { label: 'IN SERVICE', bg: 'bg-green-600' },
  mel_ops:     { label: 'MEL OPS',    bg: 'bg-blue-600' },
  oos:         { label: 'AOG',        bg: 'bg-red-600' },
  maintenance: { label: 'IN MX',      bg: 'bg-orange-600' },
  rts_pending: { label: 'RTS PENDING', bg: 'bg-amber-600' },
  released:    { label: 'RELEASED',   bg: 'bg-emerald-600' },
  retired:     { label: 'RETIRED',    bg: 'bg-gray-600' },
};

const TYPE_ENUM = [
  'B737-700', 'B737-800', 'B737-900', 'B737 MAX 8', 'B737 MAX 9',
  'B757', 'B767', 'B777', 'B787', 'A320', 'A321', 'A350', 'E190', 'E175', 'CRJ700', 'CRJ900',
];
const normalizeType = (v) =>
  TYPE_ENUM.includes(v) ? v : (TYPE_ENUM.find(t => (v || '').startsWith(t)) || 'B737-800');

// Guard against duplicate auto-provisioning (e.g. StrictMode double-fetch)
const provisioning = new Set();

export default function AircraftMxTimeline() {
  const urlParams = new URLSearchParams(window.location.search);
  const tail = urlParams.get('tail') || '';
  const typeParam = urlParams.get('type') || '';
  const baseParam = urlParams.get('base') || '';
  const qc = useQueryClient();

  const [showPlaceOOS, setShowPlaceOOS] = useState(false);
  const [showOwnership, setShowOwnership] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);

  const { data: aircraft } = useQuery({
    queryKey: ['mx-timeline-aircraft', tail],
    queryFn: async () => {
      const [ac] = await base44.entities.Aircraft.filter({ tail_number: tail });
      if (ac) return ac;
      if (provisioning.has(tail)) return null;
      provisioning.add(tail);
      // Auto-register the tail so the timeline, OOS actions, and eLogbook share one record
      return base44.entities.Aircraft.create({
        tail_number: tail,
        aircraft_type: normalizeType(typeParam),
        base_station: baseParam || undefined,
        status: 'active',
      });
    },
    enabled: !!tail,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['mx-timeline-entries', tail],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: tail }),
    enabled: !!tail,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['mx-timeline-mel', tail],
    queryFn: () => base44.entities.MELItem.filter({ aircraft_tail: tail }),
    enabled: !!tail,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mx-timeline-entries', tail] });
    qc.invalidateQueries({ queryKey: ['mx-timeline-mel', tail] });
    qc.invalidateQueries({ queryKey: ['mx-timeline-aircraft', tail] });
  };

  // PLACE OOS — logbook entry + aircraft state via OS sync
  const placeOOSMutation = useMutation({
    mutationFn: async (payload) => {
      const log_page = await allocateLogPage(tail);
      const data = { ...payload, severity: 'aog', log_page };
      const entry = await base44.entities.LogbookEntry.create(data);
      await syncAfterEntryCreate({ ...data, id: entry.id });
      return entry;
    },
    onSuccess: () => { invalidate(); setShowPlaceOOS(false); },
  });

  // TAKING OWNERSHIP — info entry
  const ownershipMutation = useMutation({
    mutationFn: async (payload) => {
      const log_page = await allocateLogPage(tail);
      return base44.entities.LogbookEntry.create({ ...payload, log_page });
    },
    onSuccess: () => { invalidate(); setShowOwnership(false); },
  });

  // ADD EVENT — info entry; RTS event returns aircraft to service
  const addEventMutation = useMutation({
    mutationFn: async ({ _rts, ...payload }) => {
      const log_page = await allocateLogPage(tail);
      const entry = await base44.entities.LogbookEntry.create({ ...payload, log_page });
      if (_rts && aircraft && ['oos', 'maintenance', 'rts_pending', 'released'].includes(aircraft.status)) {
        await base44.entities.Aircraft.update(aircraft.id, {
          status: 'active', oos_reason: null, oos_since: null,
        });
      }
      return entry;
    },
    onSuccess: () => { invalidate(); setShowAddEvent(false); },
  });

  const activeMels = melItems.filter(m => m.status !== 'cleared');
  const sorted = [...entries].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const badge = STATUS_BADGE[aircraft?.status] || STATUS_BADGE.active;

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d1117] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/FleetDashboard" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-black tracking-wide font-mono leading-none">{tail || '—'}</p>
              <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white', badge.bg)}>
                {aircraft?.status === 'oos' && <Zap className="w-2.5 h-2.5" />}
                {badge.label}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-0.5">{aircraft?.aircraft_type || ''}</p>
          </div>
        </div>
        <Link
          to={`/TechOpsLogbook?tail=${encodeURIComponent(tail)}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
        >
          <BookOpen className="w-4 h-4" /> E-Logbook
        </Link>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row">
        {/* Left sidebar */}
        <div className="lg:w-64 xl:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0d1117] px-5 py-5">
          <AircraftInfoSidebar aircraft={aircraft} />
        </div>

        {/* Right: Maintenance Timeline */}
        <div className="flex-1 min-w-0 px-6 py-5 space-y-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-extrabold text-white">Maintenance Timeline</h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowPlaceOOS(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-extrabold uppercase tracking-widest transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Place OOS
            </button>
            <button
              onClick={() => setShowOwnership(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a1f2e] border border-white/15 hover:bg-white/10 text-white text-xs font-extrabold uppercase tracking-widest transition-colors"
            >
              <UserCheck className="w-4 h-4" /> Taking Ownership
            </button>
            <button
              onClick={() => setShowAddEvent(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-extrabold uppercase tracking-widest transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          {/* Deferrals count */}
          <p className="text-sm font-extrabold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> MEL / NEF / CDL Deferrals ({activeMels.length})
          </p>

          {/* Timeline */}
          <div className="space-y-3">
            {sorted.length === 0 ? (
              <div className="bg-[#141922] border border-white/8 rounded-2xl py-14 text-center text-gray-600 text-sm">
                No maintenance events recorded for {tail || 'this aircraft'}
              </div>
            ) : (
              sorted.map(entry => <MxTimelineEventCard key={entry.id} entry={entry} />)
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showPlaceOOS && aircraft && (
        <PlaceOOSModal
          aircraft={aircraft}
          onClose={() => setShowPlaceOOS(false)}
          onSubmit={(data) => placeOOSMutation.mutate(data)}
          isPending={placeOOSMutation.isPending}
        />
      )}
      {showOwnership && aircraft && (
        <TakingOwnershipModal
          aircraft={aircraft}
          onClose={() => setShowOwnership(false)}
          onSubmit={(data) => ownershipMutation.mutate(data)}
          isPending={ownershipMutation.isPending}
        />
      )}
      {showAddEvent && (
        <AddTimelineEventModal
          aircraftTail={tail}
          onClose={() => setShowAddEvent(false)}
          onSubmit={(data) => addEventMutation.mutate(data)}
          isPending={addEventMutation.isPending}
          activeLock={null}
        />
      )}
    </div>
  );
}