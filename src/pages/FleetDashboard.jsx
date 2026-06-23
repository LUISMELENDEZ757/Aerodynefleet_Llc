import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useFleet } from '@/lib/FleetContext';
import {
  Plane, Search, Wrench, CheckCircle, Globe, Shield, ClipboardList,
  BookOpen, MapPin, Cpu, X, AlertTriangle, UserCheck, Plus, Clock,
  ChevronDown, Activity, Zap, Brain, Lock, Eye, ExternalLink, List, LayoutGrid
} from 'lucide-react';
import AiMaintenanceInsights from '@/components/fleet/AiMaintenanceInsights';
import AircraftLocationBadge from '@/components/fleet/AircraftLocationBadge';
import LocationTypeToggle from '@/components/fleet/LocationTypeToggle';
import AiMaintenanceCard from '@/components/ai/AiMaintenanceCard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AddTimelineEventModal from '@/components/fleet/AddTimelineEventModal';
import TakingOwnershipModal from '@/components/fleet/TakingOwnershipModal';
import PlaceOOSModal from '@/components/fleet/PlaceOOSModal';

import AHMTickerBanner from '@/components/fleet/AHMTickerBanner';

// ── Status mapping ──────────────────────────────────────────────────────────
const STATUS_STYLES = {
  active:      { label: 'RELEASED',   cardClass: 'released', regColor: '#00D48A', badgeClass: 'sb-released', dotAnim: 'sbpulse' },
  oos:         { label: 'OUT OF SVC', cardClass: 'oos',      regColor: '#F03252', badgeClass: 'sb-oos',      dotAnim: 'blink' },
  maintenance: { label: 'MAINT',      cardClass: 'maint',    regColor: '#3D8EF0', badgeClass: 'sb-maint',    dotAnim: 'none' },
  retired:     { label: 'RETIRED',    cardClass: 'maint',    regColor: '#64748b', badgeClass: 'sb-maint',    dotAnim: 'none' },
};

const STATUS_PRIORITY = { oos: 0, maintenance: 1, active: 3, retired: 4 };

const QUICK_FILTERS = [
  { id: 'all',         label: 'All Fleet' },
  { id: 'released',   label: 'Released' },
  { id: 'oos',        label: 'Out of Service' },
  { id: 'maint',      label: 'In Maintenance' },
  { id: 'mel',        label: 'MEL Active' },
  { id: 'moc',        label: '🔒 MOC Concurrence' },
];

function fuelColor(pct) {
  if (pct > 0.55) return '#00D48A';
  if (pct > 0.28) return '#F5A623';
  return '#F03252';
}

// ── UTC Clock ────────────────────────────────────────────────────────────────
function UtcClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = v => String(v).padStart(2, '0');
      setTime(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} Z`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#EEF3FF', letterSpacing: '0.04em' }}>{time}</span>;
}

// ── AircraftCard (AeroMOS design) ────────────────────────────────────────────
function AircraftCard({ aircraft, onSelect, melItems = [], activeLocks = [], oosEntries = [], logEntries = [] }) {
  const st = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const activeMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');
  const acLock = activeLocks.find(l => l.aircraft_tail === aircraft.tail_number && l.is_active);

  // Fuel — use a synthetic pct based on status for visual demo when no real data
  const fobPct = aircraft.status === 'oos' ? 0.18 : aircraft.status === 'maintenance' ? 0.35 : 0.72;
  const fc = fuelColor(fobPct);

  // Card border color
  const borderStyle = aircraft.status === 'active'
    ? '1.5px solid rgba(0,212,138,0.3)'
    : aircraft.status === 'oos'
    ? '1.5px solid rgba(240,50,82,0.35)'
    : '1.5px solid rgba(61,142,240,0.3)';

  // Left accent
  const accentColor = aircraft.status === 'active' ? '#00D48A' : aircraft.status === 'oos' ? '#F03252' : '#3D8EF0';

  // Status badge colors
  const badgeBg = aircraft.status === 'active'
    ? 'rgba(0,212,138,0.1)' : aircraft.status === 'oos'
    ? 'rgba(240,50,82,0.12)' : 'rgba(61,142,240,0.1)';
  const badgeBorder = aircraft.status === 'active'
    ? 'rgba(0,212,138,0.25)' : aircraft.status === 'oos'
    ? 'rgba(240,50,82,0.3)' : 'rgba(61,142,240,0.25)';

  return (
    <div
      onClick={() => onSelect(aircraft)}
      style={{
        background: '#131929',
        borderRadius: 12,
        border: borderStyle,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'border-color 0.15s, transform 0.12s',
      }}
      className="hover:-translate-y-0.5 hover:brightness-110 transition-all"
    >
      {/* Left accent stripe */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accentColor, borderRadius: '12px 0 0 12px' }} />

      {/* HEAD */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '13px 14px 10px 16px', borderBottom: '1px solid #1E2A42' }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: accentColor, letterSpacing: '-0.01em', lineHeight: 1 }}>
            {aircraft.tail_number}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3D4F6E', letterSpacing: '0.08em', marginTop: 3 }}>
            {aircraft.aircraft_type}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: badgeBg, border: `1px solid ${badgeBorder}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: accentColor }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, display: 'inline-block',
            animation: aircraft.status === 'active' ? 'sbpulse 2s ease-in-out infinite' : aircraft.status === 'oos' ? 'blink 1s step-end infinite' : 'none'
          }} />
          {st.label}
        </div>
      </div>

      {/* INDICATORS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px 7px 16px', borderBottom: '1px solid #1E2A42', minHeight: 34, flexWrap: 'wrap' }}>
        {/* Wrench for maintenance */}
        {aircraft.status === 'maintenance' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 7px', borderRadius: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(240,50,82,0.1)', color: '#F03252', border: '1px solid rgba(240,50,82,0.28)' }}>
            🔧 MX
          </span>
        )}
        {/* Blinking AOG */}
        {aircraft.status === 'oos' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', background: 'rgba(240,50,82,0.13)', color: '#F03252', border: '1px solid rgba(240,50,82,0.35)', animation: 'aogblink 1s step-end infinite' }}>
            ⬤ AOG
          </span>
        )}
        {/* MEL badge */}
        {activeMels.length > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(245,166,35,0.1)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.25)' }}>
            ⚠ MEL {activeMels.length}
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(61,78,110,0.2)', color: '#3D4F6E', border: '1px solid #1E2A42' }}>
            MEL CLR
          </span>
        )}
        {/* MOC lock */}
        {acLock && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 7px', borderRadius: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', background: 'rgba(180,130,255,0.1)', color: '#C084FC', border: '1px solid rgba(180,130,255,0.3)', animation: 'mocpulse 2.4s ease-in-out infinite' }}>
            🔒 MOC CONCUR
          </span>
        )}
        {/* MCC Watch */}
        {aircraft.mcc_watch && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, background: 'rgba(245,166,35,0.15)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.4)', animation: 'sbpulse 2s ease-in-out infinite' }}>
            👁 MCC WATCH
          </span>
        )}
        {/* Fuel */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#3D4F6E', letterSpacing: '0.08em' }}>FUEL</div>
          <div style={{ width: 64, height: 5, background: '#1E2A42', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${Math.round(fobPct * 100)}%`, background: fc, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: fc }}>{Math.round(fobPct * 100)}%</div>
        </div>
      </div>

      {/* MOVEMENT / INFO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ padding: '9px 14px 9px 16px', borderRight: '1px solid #1E2A42', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600, letterSpacing: '0.12em', color: '#3D4F6E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#00D48A' }}>↑</span> STATION
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#EEF3FF', lineHeight: 1 }}>
            {aircraft.base_station || '—'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#7A96BC' }}>{aircraft.engine_type || '—'}</div>
        </div>
        <div style={{ padding: '9px 14px 9px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600, letterSpacing: '0.12em', color: '#3D4F6E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#F5A623' }}>↓</span> CAPABILITY
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#EEF3FF', lineHeight: 1 }}>
            {aircraft.cat_approval || 'CAT I'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#7A96BC' }}>
            {aircraft.etops_approval ? `ETOPS-${aircraft.etops_approval}` : 'RVSM'}
          </div>
        </div>
      </div>

      {/* LOCATION */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px 9px 16px', gap: 6, borderTop: '1px solid #1E2A42' }}>
        <span style={{ fontSize: 11 }}>📍</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#7A96BC', letterSpacing: '0.04em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {aircraft.location_label || aircraft.location_type || 'Unknown'}
        </span>
        {aircraft.status === 'oos' ? (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#F03252', animation: 'blink 1s step-end infinite' }}>⬤ AOG</span>
        ) : aircraft.status === 'maintenance' ? (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#3D8EF0' }}>MX BAY</span>
        ) : (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: '#F5A623' }}>
            {aircraft.airline?.split(' ').pop() || 'GATE'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Aircraft Detail Overlay (preserved from original) ───────────────────────
function AircraftDetailOverlay({ aircraft: initialAircraft, onClose }) {
  const queryClient = useQueryClient();
  const [aircraft, setAircraft] = useState(initialAircraft);
  const st = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;

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

  const getMaxCatOptions = (acType = '') => {
    if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) return ['CAT IIIc — Zero/Zero', 'CAT IIIb', 'CAT IIIa', 'CAT II', 'CAT I', 'DOWNGRADED'];
    if (['B737 MAX', 'A320', 'A321'].some(t => acType.includes(t))) return ['CAT IIIb', 'CAT IIIa', 'CAT II', 'CAT I', 'DOWNGRADED'];
    if (['B737-800', 'B737-900', 'B757', 'B767'].some(t => acType.includes(t))) return ['CAT IIIa', 'CAT II', 'CAT I', 'DOWNGRADED'];
    return ['CAT II', 'CAT I', 'DOWNGRADED'];
  };
  const getEtopsOptions = (acType = '') => {
    if (['B777', 'B787', 'A350'].some(t => acType.includes(t))) return ['ETOPS-370', 'ETOPS-330', 'ETOPS-207', 'ETOPS-180', 'ETOPS-120', 'NON-ETOPS'];
    if (['B737 MAX', 'A320', 'A321', 'B767'].some(t => acType.includes(t))) return ['ETOPS-180', 'ETOPS-138', 'ETOPS-120', 'NON-ETOPS'];
    if (['B737-800', 'B737-900', 'B757'].some(t => acType.includes(t))) return ['ETOPS-120', 'ETOPS-90', 'NON-ETOPS'];
    return ['NON-ETOPS'];
  };

  const catOptions = getMaxCatOptions(aircraft.aircraft_type);
  const etopsOptions = getEtopsOptions(aircraft.aircraft_type);
  const [catStatus, setCatStatus] = useState(catOptions[0]);
  const [etopsStatus, setEtopsStatus] = useState(etopsOptions[0]);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showEtopsDropdown, setShowEtopsDropdown] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showTakingOwnershipModal, setShowTakingOwnershipModal] = useState(false);
  const [showPlaceOOSModal, setShowPlaceOOSModal] = useState(false);

  const createEntryMutation = useMutation({
    mutationFn: async (data) => {
      const entry = await base44.entities.LogbookEntry.create(data);
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

  const accentColor = aircraft.status === 'active' ? '#00D48A' : aircraft.status === 'oos' ? '#F03252' : '#3D8EF0';

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 overflow-y-auto" style={{ background: '#080C17' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: '#0F1422', borderColor: '#1E2A42' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}20` }}>
            <Plane className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-wide" style={{ color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}>{aircraft.tail_number}</p>
            <p className="text-xs" style={{ color: '#3D4F6E', fontFamily: "'JetBrains Mono', monospace" }}>{aircraft.aircraft_type}</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ml-2" style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}>
            {st.label}
          </span>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-65px)]">
        <div className="w-full lg:w-72 flex-shrink-0 p-6 flex flex-col gap-5 border-r" style={{ background: '#0F1422', borderColor: '#1E2A42' }}>
          <p className="text-base font-extrabold text-white">Aircraft Information</p>
          <div className="flex items-center gap-2">
            {(aircraft.etops_approval || ['B777','B787','A350','B737 MAX','A320','A321','B767','B737-800','B737-900','B757'].some(t => aircraft.aircraft_type?.includes(t))) && (
              <Link to="/ETOPSMonitor" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold hover:opacity-80 transition-opacity" style={{ background: 'rgba(0,212,245,0.1)', border: '1px solid rgba(0,212,245,0.3)', color: '#00D4F5' }}>
                <Globe className="w-3.5 h-3.5" /> ETOPS
              </Link>
            )}
            <Link to={`/TechOpsLogbook?tail=${aircraft.tail_number}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold hover:opacity-80 transition-opacity" style={{ background: '#F5A623', color: '#0A0E1A' }}>
              <BookOpen className="w-3.5 h-3.5" /> E-Logbook
            </Link>
          </div>
          <LocationTypeToggle aircraftId={aircraft.id} locationType={aircraft.location_type || 'unknown'} locationLabel={aircraft.location_label || ''} />
          <div className="flex flex-col gap-4">
            {[
              { icon: MapPin, label: 'Station', value: aircraft.base_station || '—', color: '#F5A623' },
              { icon: Cpu, label: 'Engines', value: aircraft.engine_type || '—', color: '#F03252' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3D4F6E', fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
                  <p className="text-base font-extrabold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CAT Selector */}
          <div className="rounded-xl border px-4 py-3 relative" style={{ borderColor: catStatus === 'DOWNGRADED' ? 'rgba(240,50,82,0.4)' : 'rgba(0,212,138,0.4)', background: catStatus === 'DOWNGRADED' ? 'rgba(240,50,82,0.1)' : 'rgba(0,212,138,0.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: catStatus === 'DOWNGRADED' ? '#F03252' : '#00D48A' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: catStatus === 'DOWNGRADED' ? '#F03252' : '#00D48A', fontFamily: "'JetBrains Mono', monospace" }}>ILS / CAT STATUS</p>
              </div>
              <button onClick={() => setShowCatDropdown(v => !v)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.15)', background: '#0F1422' }}>
                {catStatus} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showCatDropdown && (
              <div className="absolute right-3 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-xl min-w-[180px]" style={{ background: '#131929', border: '1px solid #1E2A42' }}>
                {catOptions.map(opt => (
                  <button key={opt} onClick={() => { setCatStatus(opt); setShowCatDropdown(false); }} className="block w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/10" style={{ color: opt === 'DOWNGRADED' ? '#F03252' : opt === 'CAT I' ? '#F5A623' : '#00D48A', fontFamily: "'JetBrains Mono', monospace" }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ETOPS Selector */}
          <div className="rounded-xl border px-4 py-3 relative" style={{ borderColor: etopsStatus === 'NON-ETOPS' ? 'rgba(240,50,82,0.4)' : 'rgba(0,212,245,0.4)', background: etopsStatus === 'NON-ETOPS' ? 'rgba(240,50,82,0.1)' : 'rgba(0,212,245,0.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" style={{ color: etopsStatus === 'NON-ETOPS' ? '#F03252' : '#00D4F5' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: etopsStatus === 'NON-ETOPS' ? '#F03252' : '#00D4F5', fontFamily: "'JetBrains Mono', monospace" }}>ETOPS STATUS</p>
              </div>
              <button onClick={() => setShowEtopsDropdown(v => !v)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.15)', background: '#0F1422' }}>
                {etopsStatus} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showEtopsDropdown && (
              <div className="absolute right-3 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-xl min-w-[160px]" style={{ background: '#131929', border: '1px solid #1E2A42' }}>
                {etopsOptions.map(opt => (
                  <button key={opt} onClick={() => { setEtopsStatus(opt); setShowEtopsDropdown(false); }} className="block w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-white/10" style={{ color: opt === 'NON-ETOPS' ? '#F03252' : '#00D4F5', fontFamily: "'JetBrains Mono', monospace" }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: '#F5A623' }} />
            <h2 className="text-xl font-extrabold text-white">Maintenance Timeline</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowPlaceOOSModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-extrabold hover:opacity-80 transition-opacity disabled:opacity-50"
              style={{ background: 'rgba(240,50,82,0.8)', border: '1px solid #F03252' }}>
              <AlertTriangle className="w-4 h-4" /> PLACE OOS
            </button>
            {activeTailLock && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl" style={{ background: 'rgba(240,50,82,0.15)', border: '1px solid rgba(240,50,82,0.4)', color: '#F03252' }}>
                <Lock className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-xs font-extrabold leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>MCC LOCK ACTIVE</p>
                  <p className="text-[10px] opacity-80 mt-0.5">By {activeTailLock.placed_by}</p>
                </div>
              </div>
            )}
            <button onClick={() => setShowTakingOwnershipModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-extrabold hover:bg-white/10 transition-colors disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <UserCheck className="w-4 h-4" /> TAKING OWNERSHIP
            </button>
            <button onClick={() => setShowAddEventModal(true)} disabled={createEntryMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold hover:opacity-80 transition-opacity disabled:opacity-50"
              style={{ background: '#F5A623', color: '#0A0E1A' }}>
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          {melItems.filter(m => m.status !== 'cleared').length > 0 && (
            <div className="space-y-3 mb-2">
              <p className="text-base font-extrabold text-white flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: '#F5A623' }} /> MEL / NEF / CDL Deferrals ({melItems.filter(m => m.status !== 'cleared').length})
              </p>
              {melItems.filter(m => m.status !== 'cleared').map(mel => (
                <div key={mel.id} className="flex items-start gap-4 rounded-xl px-5 py-4" style={{ background: mel.status === 'expired' ? 'rgba(240,50,82,0.1)' : 'rgba(245,166,35,0.08)', border: `1px solid ${mel.status === 'expired' ? 'rgba(240,50,82,0.3)' : 'rgba(245,166,35,0.25)'}` }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: mel.status === 'expired' ? '#F03252' : '#F5A623' }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ background: mel.status === 'expired' ? 'rgba(240,50,82,0.2)' : 'rgba(245,166,35,0.2)', color: mel.status === 'expired' ? '#F03252' : '#F5A623', fontFamily: "'JetBrains Mono', monospace" }}>
                        {mel.mel_reference || 'MEL'} {mel.mel_category ? `CAT ${mel.mel_category}` : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200">{mel.description || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {logEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
              <Clock className="w-16 h-16" style={{ color: '#1E2A42' }} />
              <p className="text-lg font-extrabold" style={{ color: '#3D4F6E' }}>No Timeline Events</p>
              <p className="text-sm" style={{ color: '#3D4F6E' }}>Use "PLACE OOS" to begin the maintenance record.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logEntries.map(entry => (
                <div key={entry.id} className="flex items-start gap-4 rounded-xl px-5 py-4" style={{ background: '#0F1422', border: '1px solid #1E2A42' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#F5A623' }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{
                        background: entry.entry_type === 'discrepancy' ? 'rgba(240,50,82,0.2)' : entry.entry_type === 'corrective_action' ? 'rgba(0,212,138,0.2)' : 'rgba(61,142,240,0.2)',
                        color: entry.entry_type === 'discrepancy' ? '#F03252' : entry.entry_type === 'corrective_action' ? '#00D48A' : '#3D8EF0',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>{entry.entry_type}</span>
                      {entry.ata_chapter && <span className="text-[10px]" style={{ color: '#3D4F6E', fontFamily: "'JetBrains Mono', monospace" }}>ATA {entry.ata_chapter}</span>}
                    </div>
                    <p className="text-sm text-gray-200">{entry.description}</p>
                    <p className="text-[10px] mt-2" style={{ color: '#3D4F6E' }}>{new Date(entry.created_date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showAddEventModal && <AddTimelineEventModal aircraftTail={aircraft.tail_number} onClose={() => setShowAddEventModal(false)} onSubmit={(data) => createEntryMutation.mutate(data)} isPending={createEntryMutation.isPending} activeLock={activeTailLock} />}
            {showPlaceOOSModal && <PlaceOOSModal aircraft={aircraft} onClose={() => setShowPlaceOOSModal(false)} onSubmit={handlePlaceOOSSubmit} isPending={createEntryMutation.isPending} />}
          </AnimatePresence>
        </div>
      </div>

      {/* Ownership modal rendered at root of overlay to escape scroll container */}
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
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FleetDashboard() {
  const [quickFilter, setQuickFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [activeTab, setActiveTab] = useState('fleet');
  const { activeFleet } = useFleet();
  const queryClient = useQueryClient();

  const { data: rawAircraftAll = [], isLoading } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  const dedupedAircraft = Object.values(
    rawAircraftAll.reduce((acc, a) => {
      if (!acc[a.tail_number] || new Date(a.updated_date) > new Date(acc[a.tail_number].updated_date)) {
        acc[a.tail_number] = a;
      }
      return acc;
    }, {})
  );

  const aircraft = dedupedAircraft;
  const recordTailView = () => {};

  const { data: mccLocks = [] } = useQuery({
    queryKey: ['mcc-locks'],
    queryFn: () => base44.entities.MccLock.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const { data: allMelItems = [] } = useQuery({
    queryKey: ['fleet-all-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 2000),
    refetchInterval: 120000,
  });
  const { data: oosEntries = [] } = useQuery({
    queryKey: ['fleet-oos-entries'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const melByTail = allMelItems.reduce((acc, m) => {
    if (!acc[m.aircraft_tail]) acc[m.aircraft_tail] = [];
    acc[m.aircraft_tail].push(m);
    return acc;
  }, {});

  const total     = aircraft.length;
  const released  = aircraft.filter(a => a.status === 'active').length;
  const inMaint   = aircraft.filter(a => a.status === 'maintenance').length;
  const outOfSvc  = aircraft.filter(a => a.status === 'oos').length;
  const melActive = aircraft.filter(a => (melByTail[a.tail_number] || []).some(m => m.status !== 'cleared' && m.status !== 'voided')).length;

  const filtered = aircraft
    .filter(a => {
      const activeMels = (melByTail[a.tail_number] || []).filter(m => m.status !== 'cleared' && m.status !== 'voided');
      const hasMoc = mccLocks.some(l => l.aircraft_tail === a.tail_number && l.is_active);
      const matchSearch = !search || a.tail_number?.toLowerCase().includes(search.toLowerCase()) || a.base_station?.toLowerCase().includes(search.toLowerCase()) || a.aircraft_type?.toLowerCase().includes(search.toLowerCase());
      let matchFilter = true;
      if (quickFilter === 'released') matchFilter = a.status === 'active';
      else if (quickFilter === 'oos') matchFilter = a.status === 'oos';
      else if (quickFilter === 'maint') matchFilter = a.status === 'maintenance';
      else if (quickFilter === 'mel') matchFilter = activeMels.length > 0;
      else if (quickFilter === 'moc') matchFilter = hasMoc;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99));

  return (
    <div style={{ minHeight: '100vh', background: '#080C17', color: '#EEF3FF', fontFamily: "'Inter', sans-serif" }}>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes sbpulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes blink { 50%{opacity:.15} }
        @keyframes aogblink { 50%{opacity:.25} }
        @keyframes mocpulse { 0%,100%{box-shadow:0 0 0 0 rgba(192,132,252,0)} 50%{box-shadow:0 0 7px 2px rgba(192,132,252,.2)} }
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{ height: 48, background: '#0F1422', borderBottom: '1px solid #1E2A42', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ width: 30, height: 30, background: '#F5A623', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plane style={{ width: 16, height: 16, color: '#0A0E1A' }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#EEF3FF', letterSpacing: '0.06em' }}>Aerodyne Fleet</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3D4F6E', letterSpacing: '0.08em' }}>/ FLEET BOARD</div>
        <div style={{ flex: 1 }} />
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="hidden md:flex">
          {[
            { color: '#00D48A', label: 'RELEASED' },
            { color: '#F03252', label: 'OUT OF SVC' },
            { color: '#3D8EF0', label: 'MAINTENANCE' },
            { color: '#F5A623', label: 'MEL ACTIVE', round: true },
          ].map(({ color, label, round }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#7A96BC', letterSpacing: '0.06em' }}>
              <div style={{ width: 8, height: 8, borderRadius: round ? '50%' : 2, background: color }} />
              {label}
            </div>
          ))}
        </div>
        <div style={{ width: 1, height: 16, background: '#1E2A42', margin: '0 8px' }} />
        <UtcClock />
      </div>

      {/* ── AHM TICKER ── */}
      <AHMTickerBanner />

      {/* ── FILTER BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#0F1422', borderBottom: '1px solid #1E2A42', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131929', border: '1px solid #1E2A42', borderRadius: 8, padding: '5px 12px', minWidth: 200 }}>
          <Search style={{ width: 13, height: 13, color: '#3D4F6E' }} />
          <input type="text" placeholder="Search tail, type, station..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#EEF3FF', width: '100%' }}
          />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3D4F6E', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 4 }}>Show</span>
        {QUICK_FILTERS.map(f => (
          <button key={f.id} onClick={() => setQuickFilter(f.id)}
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '4px 11px', borderRadius: 20,
              border: quickFilter === f.id ? '1px solid #F5A623' : '1px solid #1E2A42',
              color: quickFilter === f.id ? '#F5A623' : '#3D4F6E',
              background: quickFilter === f.id ? 'rgba(245,166,35,0.07)' : 'transparent',
              cursor: 'pointer', fontWeight: 500, letterSpacing: '0.05em', transition: 'all 0.12s'
            }}>
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3D4F6E' }}>
          <span style={{ color: '#EEF3FF', fontWeight: 600 }}>{filtered.length}</span> of <span style={{ color: '#EEF3FF', fontWeight: 600 }}>{total}</span> aircraft shown
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid #1E2A42', flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL FLEET', value: total, color: '#EEF3FF' },
          { label: 'RELEASED', value: released, color: '#00D48A' },
          { label: 'MAINTENANCE', value: inMaint, color: '#3D8EF0' },
          { label: 'OUT OF SVC', value: outOfSvc, color: '#F03252' },
          { label: 'MEL ACTIVE', value: melActive, color: '#F5A623' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#0F1422', border: '1px solid #1E2A42', borderRadius: 10, padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#3D4F6E', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
              {isLoading ? '—' : value}
            </span>
          </div>
        ))}
        {/* Tab buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { id: 'fleet', label: '✈ Fleet Board' },
            { id: 'insights', label: '🧠 AI Insights' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '6px 14px', borderRadius: 8, fontWeight: 700, letterSpacing: '0.05em',
                background: activeTab === t.id ? '#F5A623' : 'transparent',
                color: activeTab === t.id ? '#0A0E1A' : '#3D4F6E',
                border: activeTab === t.id ? '1px solid #F5A623' : '1px solid #1E2A42',
                cursor: 'pointer', transition: 'all 0.12s'
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID ── */}
      {activeTab === 'fleet' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12, padding: '16px 20px 40px' }}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: '#0F1422', border: '1px solid #1E2A42', borderRadius: 12, height: 180, animation: 'sbpulse 1.5s ease-in-out infinite' }} />
            ))
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#3D4F6E', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              No aircraft found
            </div>
          ) : (
            filtered.map(a => (
              <AircraftCard
                key={a.id}
                aircraft={a}
                onSelect={(ac) => { setSelectedAircraft(ac); recordTailView(ac.tail_number); }}
                melItems={melByTail[a.tail_number] || []}
                activeLocks={mccLocks}
                oosEntries={oosEntries}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="px-5 py-6 space-y-4">
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