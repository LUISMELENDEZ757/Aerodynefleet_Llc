import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import AircraftQRScanner from '@/components/techops/AircraftQRScanner';
import {
  BookOpen, Plane, AlertTriangle, ChevronDown, Plus,
  Printer, Clock, CheckCircle, Wrench, Zap, Tag,
  Radio, Flame, Wind, Settings, Shield, ChevronRight,
  FilePlus, QrCode, Filter, User, HardHat, Send,
  XCircle, FileText, Package, Mic, TrendingUp, History, Archive, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import CatCapabilityBadge from '@/components/techops/CatCapabilityBadge';
import EtopsCapabilityBadge from '@/components/techops/EtopsCapabilityBadge';
import NewLogEntryModal from '@/components/techops/NewLogEntryModal';
import GlobalLogbookSearch from '@/components/techops/GlobalLogbookSearch';
import NewFaultModal from '@/components/techops/NewFaultModal';
import LogEntryCard from '@/components/techops/LogEntryCard';
import MELSignOffModal from '@/components/techops/MELSignOffModal';
import OOSTriggerBanner from '@/components/oos/OOSTriggerBanner';
import { allocateLogPage, syncAfterEntryCreate } from '@/lib/logbookOsSync';

// ── Config ───────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  active:      { label: 'IN SERVICE',     bg: 'bg-green-600',  dot: 'bg-green-400' },
  oos:         { label: 'OUT OF SERVICE', bg: 'bg-red-700',    dot: 'bg-red-400' },
  maintenance: { label: 'MAINTENANCE',    bg: 'bg-orange-600', dot: 'bg-orange-400' },
  retired:     { label: 'RETIRED',        bg: 'bg-gray-600',   dot: 'bg-gray-400' },
};

const SEVERITY_STYLES = {
  warning:  { label: 'WARNING',  bg: 'bg-red-700',    text: 'text-red-300',    border: 'border-red-600' },
  caution:  { label: 'CAUTION',  bg: 'bg-amber-700',  text: 'text-amber-300',  border: 'border-amber-600' },
  advisory: { label: 'ADVISORY', bg: 'bg-blue-700',   text: 'text-blue-300',   border: 'border-blue-600' },
  memo:     { label: 'MEMO',     bg: 'bg-gray-700',   text: 'text-gray-300',   border: 'border-gray-600' },
};

const SYSTEM_ICONS = {
  engine: Flame, hydraulics: Settings, avionics: Radio,
  electrical: Zap, fuel: Plane, pneumatics: Wind,
  flight_controls: Plane, apu: Zap, landing_gear: Plane, other: AlertTriangle,
};

// ── Role tabs ─────────────────────────────────────────────────────────────────
const ROLE_TABS = [
  { id: 'mx',       label: 'MX / Tech Ops', icon: HardHat },
  { id: 'pilot',    label: 'Pilot View',    icon: Plane },
  { id: 'dispatch', label: 'Dispatch',      icon: Send },
];

// ── Quick filters ─────────────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'open',      label: '🔴 Open' },
  { id: 'rii',       label: '🟣 Pending RII' },
  { id: 'mel',       label: '🟡 MEL / Deferred' },
  { id: 'inwork',    label: '🔵 In Work' },
  { id: 'closed',    label: '✅ Closed' },
  { id: 'cabin',     label: '✈️ Cabin' },
  { id: 'pilot',     label: '🛫 Pilot Reports' },
];

function useElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function TechOpsLogbook() {
  const urlParams = new URLSearchParams(window.location.search);
  const tailParam = urlParams.get('tail');

  const [selectedTail, setSelectedTail] = useState(tailParam || null);
  const [tailDropdown, setTailDropdown] = useState(false);
  const [tailSearch, setTailSearch] = useState('');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showNewFault, setShowNewFault] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [faultTab, setFaultTab] = useState('active');
  const [entryPreset, setEntryPreset] = useState(null);
  const [viewRole, setViewRole] = useState('mx');       // mx | pilot | dispatch
  const [quickFilter, setQuickFilter] = useState('all');
  const [signOffMel, setSignOffMel] = useState(null); // MELItem being signed off
  const elapsed = useElapsedTime();
  const queryClient = useQueryClient();

  const { data: aircraft = [] } = useQuery({
    queryKey: ['logbook-aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
  });

  const selectedAc = aircraft.find(a => a.tail_number === selectedTail) || aircraft[0];

  // Filter aircraft based on search query
  const filteredAircraft = useMemo(() => {
    if (!tailSearch.trim()) return aircraft;
    const search = tailSearch.toLowerCase();
    return aircraft.filter(a =>
      a.tail_number?.toLowerCase().includes(search) ||
      a.aircraft_type?.toLowerCase().includes(search) ||
      a.base_station?.toLowerCase().includes(search) ||
      a.msn?.toLowerCase().includes(search)
    );
  }, [aircraft, tailSearch]);

  useEffect(() => {
    if (!selectedTail && aircraft.length > 0) setSelectedTail(aircraft[0].tail_number);
  }, [aircraft, selectedTail]);

  const { data: entries = [] } = useQuery({
    queryKey: ['logbook-entries', selectedTail],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: selectedTail }),
    enabled: !!selectedTail,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['logbook-faults', selectedTail],
    queryFn: () => base44.entities.FaultMessage.filter({ aircraft_tail: selectedTail }),
    enabled: !!selectedTail,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['logbook-mel', selectedTail],
    queryFn: () => base44.entities.MELItem.filter({ aircraft_tail: selectedTail }),
    enabled: !!selectedTail,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data) => {
      // Allocate LP# fresh at save time — avoids stale collisions between devices/sessions
      const log_page = await allocateLogPage(selectedTail);
      const entry = await base44.entities.LogbookEntry.create({ ...data, log_page });
      // Drive OS state: AOG → OOS, deferral → MELItem + mel_ops
      await syncAfterEntryCreate({ ...data, log_page, id: entry.id });
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['logbook-mel'] });
      queryClient.invalidateQueries({ queryKey: ['logbook-aircraft'] });
      setShowNewEntry(false);
    },
  });

  const createFaultMutation = useMutation({
    mutationFn: (data) => base44.entities.FaultMessage.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['logbook-faults'] }); setShowNewFault(false); },
  });

  const clearFaultMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.FaultMessage.update(id, { status: 'cleared', cleared_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logbook-faults'] }),
  });

  const wireToLogbookMutation = useMutation({
    mutationFn: ({ fault, ac }) => {
      const nextPage = `LP#${String(entries.length + 1).padStart(4, '0')}`;
      return base44.entities.LogbookEntry.create({
        aircraft_tail: fault.aircraft_tail,
        log_page: nextPage,
        source_fault_id: fault.id,
        entry_type: 'discrepancy',
        ata_chapter: fault.ata_chapter || '',
        station: ac?.base_station || '',
        description: `[FAULT → LOGBOOK] ${fault.fault_code}${fault.description ? ` — ${fault.description}` : ''}` +
          `\nSeverity: ${fault.severity?.toUpperCase()} | System: ${fault.system?.toUpperCase()}` +
          (fault.flight_phase ? ` | Phase: ${fault.flight_phase}` : '') +
          `\nAircraft: ${ac?.aircraft_type || fault.aircraft_tail} | Engine: ${ac?.engine_type || '—'} | MSN: ${ac?.msn || '—'}`,
        notes: `Auto-wired from FaultMessage ID: ${fault.id}. Detected: ${fault.detected_at ? new Date(fault.detected_at).toLocaleString() : '—'}`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['logbook-entries'] }),
  });

  // ── Derived stats ─────────────────────────────────────────────────────────
  const openItems = entries.filter(e => e.is_deferred && !e.is_cleared).length;
  const activeMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');
  const restrictiveMels = activeMels.filter(m =>
    m.flight_restrictions || m.etops_critical || m.etops_impact === 'NO_ETOPS' ||
    m.etops_impact === 'ETOPS_WITH_LIMITS' || m.placard_required
  );
  const openWriteUps = entries.filter(e => e.entry_type === 'discrepancy' && e.discrepancy_status !== 'CLOSED' && !e.is_cleared);
  const pendingRiiItems = entries.filter(e => e.rii_required && !e.rii_signed_at && !e.rii_rejected && e.discrepancy_status !== 'CLOSED');
  const activeFaults = faults.filter(f => f.status === 'active');
  const clearedFaults = faults.filter(f => f.status === 'cleared');
  const nextLogPage = `LP#${String(entries.length + 1).padStart(4, '0')}`;
  const statusCfg = STATUS_STYLES[selectedAc?.status] || STATUS_STYLES.active;

  // ── Filtered entries based on role + quickFilter ──────────────────────────
  const filteredEntries = useMemo(() => {
    let list = [...entries].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Role filter
    if (viewRole === 'pilot') {
      list = list.filter(e => e.entry_type === 'discrepancy' || e.is_deferred);
    } else if (viewRole === 'dispatch') {
      list = list.filter(e => e.is_deferred || e.entry_type === 'deferred' || e.mel_reference);
    }

    // Quick filter
    switch (quickFilter) {
      case 'open':   list = list.filter(e => e.discrepancy_status === 'OPEN'); break;
      case 'rii':    list = list.filter(e => e.discrepancy_status === 'PENDING_RII' || (e.rii_required && !e.rii_signed_at && !e.rii_rejected)); break;
      case 'mel':    list = list.filter(e => e.is_deferred && !e.is_cleared); break;
      case 'inwork': list = list.filter(e => e.discrepancy_status === 'IN_PROGRESS'); break;
      case 'closed': list = list.filter(e => e.discrepancy_status === 'CLOSED' || e.is_cleared); break;
      case 'cabin':  list = list.filter(e => e.description?.toLowerCase().includes('cabin') || e.ata_chapter === '25'); break;
      case 'pilot':  list = list.filter(e => e.description?.toLowerCase().includes('[pilot') || e.flight_number); break;
      default: break;
    }

    return list;
  }, [entries, viewRole, quickFilter]);

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = () => {
    const entriesHtml = entries.length === 0
      ? '<tr><td colspan="5" style="text-align:center;color:#888;padding:16px;">No log entries</td></tr>'
      : entries.map(e => {
          const date = new Date(e.created_date);
          return `<tr>
            <td>${e.log_page || '—'}</td>
            <td>${e.entry_type?.toUpperCase()}</td>
            <td>ATA ${e.ata_chapter || '—'}</td>
            <td>${e.description || '—'}${e.corrective_action ? `<br/><span style="color:green">✓ ${e.corrective_action}</span>` : ''}${e.is_deferred && !e.is_cleared ? `<br/><span style="color:orange">MEL ${e.mel_category} — ${e.mel_reference || ''}</span>` : ''}${e.is_cleared ? '<br/><span style="color:green">✓ CLEARED</span>' : ''}</td>
            <td>${e.technician_name || '—'}<br/><small>${date.toLocaleDateString()} ${date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}</small></td>
          </tr>`;
        }).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>E-Logbook — ${selectedAc?.tail_number || ''}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 32px; }
        h1 { font-size: 20px; margin: 0 0 2px; } .sub { color: #555; font-size: 11px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
        .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
        .info-box label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
        .info-box span { font-size: 18px; font-weight: 900; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #111; padding-bottom: 4px; margin: 20px 0 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        .footer { margin-top: 32px; font-size: 10px; color: #aaa; border-top: 1px solid #ddd; padding-top: 8px; }
      </style></head><body>
      <h1>E-LOGBOOK — ${selectedAc?.tail_number || '—'}</h1>
      <div class="sub">Aerodyne Fleet LLC | ${selectedAc?.aircraft_type || '—'} | Station: ${selectedAc?.base_station || '—'} | Status: ${statusCfg.label}</div>
      <div class="info-grid">
        <div class="info-box"><label>Log Entries</label><span>${entries.length}</span></div>
        <div class="info-box"><label>Open Items</label><span>${openItems}</span></div>
        <div class="info-box"><label>Active Faults</label><span>${activeFaults.length}</span></div>
        <div class="info-box"><label>Next Log Page</label><span>${nextLogPage}</span></div>
      </div>
      <h2>Log Entries</h2>
      <table><thead><tr><th>Log Page</th><th>Type</th><th>ATA</th><th>Description</th><th>Technician / Date</th></tr></thead>
      <tbody>${entriesHtml}</tbody></table>
      <div class="footer">Printed: ${new Date().toLocaleString()} | ${selectedAc?.tail_number || ''} | Aerodyne Fleet LLC E-Logbook</div>
      </body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-28">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d1117] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">E-Logbook</p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">FAA Records System</p>
          </div>
          <div className="flex items-center gap-1 bg-[#1a1f2e] border border-white/10 rounded-full px-3 py-1 ml-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-mono text-amber-400">{elapsed}</span>
          </div>
          <LiveClock />
        </div>

        {/* Aircraft selector + actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setTailDropdown(!tailDropdown)}
              className="flex items-center gap-2 bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2 hover:border-white/20 transition-all">
              <Plane className="w-4 h-4 text-gray-400" />
              <span className="font-bold text-sm tracking-wide">{selectedAc?.tail_number || '—'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            {tailDropdown && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                {/* Search input */}
                <div className="p-3 border-b border-white/10">
                  <input
                    autoFocus
                    value={tailSearch}
                    onChange={e => setTailSearch(e.target.value)}
                    placeholder="Search tail, type, station..."
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
                  />
                </div>
                {/* Aircraft list */}
                <div className="max-h-80 overflow-y-auto">
                  {filteredAircraft.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-xs">
                      No aircraft found
                    </div>
                  ) : (
                    filteredAircraft.map(a => {
                      const statusCfg = STATUS_STYLES[a.status] || STATUS_STYLES.active;
                      return (
                        <button
                          key={a.id}
                          onClick={() => { setSelectedTail(a.tail_number); setTailDropdown(false); setTailSearch(''); }}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0',
                            a.tail_number === selectedTail && 'bg-primary/10 text-primary'
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-white">{a.tail_number}</span>
                              <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{a.aircraft_type}</span>
                              <span>·</span>
                              <span>{a.base_station || '—'}</span>
                              {a.msn && (
                                <>
                                  <span>·</span>
                                  <span>MSN {a.msn}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setShowQRScanner(true)} className="w-9 h-9 bg-[#1a1f2e] border border-white/10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors">
            <QrCode className="w-4 h-4 text-primary" />
          </button>
          <button onClick={handlePrint} className="w-9 h-9 bg-[#1a1f2e] border border-white/10 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors">
            <Printer className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-w-5xl mx-auto">

        {/* ── GLOBAL SEARCH ──────────────────────────────────────────────────── */}
        <GlobalLogbookSearch onSelectTail={(tail) => setSelectedTail(tail)} />

        {/* ── AIRCRAFT INFO + KPI STRIP ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Aircraft card */}
          <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
              <Plane className="w-3 h-3" /> AIRCRAFT
            </p>
            <p className="text-5xl font-black tracking-wide text-white">{selectedAc?.tail_number || '—'}</p>
            <p className="text-sm text-gray-400 font-semibold">{selectedAc?.aircraft_type || '—'}</p>
            <div>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">STATION</p>
              <p className="text-3xl font-black tracking-wide">{selectedAc?.base_station || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">STATUS</p>
              <span className={cn('inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white', statusCfg.bg)}>
                <span className={cn('w-2 h-2 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* KPI stats */}
          <div className="sm:col-span-2 grid grid-cols-3 gap-4">
            {[
              { label: 'LOG ENTRIES', value: entries.length, sub: 'total records', icon: BookOpen, color: 'text-white' },
              { label: 'OPEN ITEMS',  value: openItems, sub: 'active deferrals', icon: AlertTriangle, color: openItems > 0 ? 'text-amber-400' : 'text-white' },
              { label: 'ACTIVE FAULTS', value: activeFaults.length, sub: 'EICAS/BITE', icon: Zap, color: activeFaults.length > 0 ? 'text-red-400' : 'text-white' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
                  <Icon className="w-3 h-3" /> {label}
                </p>
                <div>
                  <p className={cn('text-5xl font-black', color)}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{sub}</p>
                </div>
              </div>
            ))}
            {/* Next LP# */}
            <div className="col-span-3 bg-[#141922] border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">NEXT LOG PAGE</p>
                <p className="text-2xl font-black text-primary font-mono">{nextLogPage}</p>
              </div>
              <button onClick={() => { setEntryPreset(null); setShowNewEntry(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> New Entry
              </button>
            </div>
          </div>
        </div>

        {/* ── OOS HARD TRIGGER BANNER ───────────────────────────────────────── */}
        {selectedTail && <OOSTriggerBanner aircraftTail={selectedTail} />}

        {/* ── CAT + ETOPS CAPABILITY BADGES ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CatCapabilityBadge aircraft={selectedAc} melItems={activeMels} />
          <EtopsCapabilityBadge aircraft={selectedAc} melItems={activeMels} />
        </div>

        {/* ── RESTRICTIVE MEL ALERTS ─────────────────────────────────────────── */}
        {restrictiveMels.length > 0 && (
          <div className="bg-red-950/40 border border-red-500/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm font-extrabold text-red-400 uppercase tracking-widest">
                {restrictiveMels.length} Restrictive MEL{restrictiveMels.length > 1 ? 's' : ''} — Operational Restrictions Apply
              </p>
            </div>
            {restrictiveMels.map(m => (
              <div key={m.id} className="flex items-start gap-3 bg-red-900/30 rounded-xl px-4 py-3 border border-red-700/40">
                <Zap className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-800 text-red-300 uppercase">
                      CAT {m.category} · {m.ata_chapter || 'MEL'}
                    </span>
                    {m.etops_impact === 'NO_ETOPS' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-900 text-orange-300 border border-orange-700/50">NO ETOPS</span>
                    )}
                    {m.etops_impact === 'ETOPS_WITH_LIMITS' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-900 text-amber-300 border border-amber-700/50">ETOPS LIMITED</span>
                    )}
                    {m.placard_required && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-yellow-900 text-yellow-300 border border-yellow-700/50">PLACARD REQ'D</span>
                    )}
                  </div>
                  <p className="text-xs text-red-200 font-semibold">{m.description}</p>
                  {m.flight_restrictions && (
                    <p className="text-[10px] text-red-400 mt-0.5">⚠ {m.flight_restrictions}</p>
                  )}
                  {m.expiry_date && (
                    <p className="text-[10px] text-gray-500 mt-0.5">Expires: {new Date(m.expiry_date).toLocaleDateString()}</p>
                  )}
                </div>
                <button
                  onClick={() => setSignOffMel(m)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-800/50 border border-green-600/50 text-green-300 text-[10px] font-extrabold hover:bg-green-700/60 transition-colors whitespace-nowrap"
                >
                  <CheckCircle className="w-3 h-3" /> Sign Off
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── OPEN WRITE-UPS ──────────────────────────────────────────────────── */}
        {openWriteUps.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-500/50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm font-extrabold text-amber-400 uppercase tracking-widest">
                {openWriteUps.length} Open Write-Up{openWriteUps.length > 1 ? 's' : ''}
              </p>
            </div>
            {openWriteUps.map(e => (
              <div key={e.id} className="flex items-start gap-3 bg-amber-900/20 rounded-xl px-4 py-3 border border-amber-700/30">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {e.log_page && <span className="text-[10px] font-mono font-bold text-amber-300">{e.log_page}</span>}
                    {e.ata_chapter && <span className="text-[10px] text-gray-500">ATA {e.ata_chapter}</span>}
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                      e.discrepancy_status === 'IN_PROGRESS' ? 'bg-blue-900/50 text-blue-400' :
                      e.discrepancy_status === 'PENDING_RII' ? 'bg-purple-900/50 text-purple-400' :
                      'bg-amber-900/50 text-amber-400'
                    )}>{e.discrepancy_status || 'OPEN'}</span>
                  </div>
                  <p className="text-xs text-amber-100">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PENDING RII ALERT BANNER ──────────────────────────────────────── */}
        {pendingRiiItems.length > 0 && (
          <div className="bg-violet-950/40 border border-violet-500/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <p className="text-sm font-extrabold text-violet-400 uppercase tracking-widest">
                  {pendingRiiItems.length} Item{pendingRiiItems.length > 1 ? 's' : ''} Awaiting RII Inspector Sign-Off
                </p>
              </div>
              <Link
                to="/InspectorMode"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-extrabold hover:bg-violet-500 transition-colors whitespace-nowrap"
              >
                <Shield className="w-3 h-3" /> Inspector Mode →
              </Link>
            </div>
            {pendingRiiItems.map(e => (
              <div key={e.id} className="flex items-start gap-3 bg-violet-900/25 rounded-xl px-4 py-3 border border-violet-700/40">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {e.log_page && <span className="text-[10px] font-mono font-bold text-violet-300">{e.log_page}</span>}
                    {e.ata_chapter && <span className="text-[10px] text-gray-500">ATA {e.ata_chapter}</span>}
                    {e.station && <span className="text-[10px] text-gray-500">{e.station}</span>}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">PENDING RII</span>
                  </div>
                  <p className="text-xs text-violet-100 line-clamp-1">{e.description}</p>
                  {e.technician_name && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Tech: <span className="text-gray-300">{e.technician_name}</span>
                      {e.technician_id ? ` · ${e.technician_id}` : ''}
                      {' · '}Submitted {new Date(e.updated_date || e.created_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}Z
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAULT MESSAGES ─────────────────────────────────────────────────── */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-base font-extrabold tracking-wide">FAULT MESSAGES (EICAS/BITE)</p>
              <p className="text-xs text-gray-500 mt-0.5">System-generated fault codes and maintenance alerts</p>
            </div>
            <div className="flex items-center gap-2">
              {[{ id: 'active', label: 'ACTIVE', count: activeFaults.length, urgent: activeFaults.length > 0 },
                { id: 'cleared', label: 'CLEARED', count: clearedFaults.length, urgent: false }].map(t => (
                <button key={t.id} onClick={() => setFaultTab(t.id)}
                  className={cn('flex flex-col items-center px-4 py-2 rounded-lg transition-all',
                    faultTab === t.id ? 'bg-red-900/50 border border-red-700' : 'bg-[#1a1f2e] border border-white/10')}>
                  <span className="text-[10px] text-gray-400 uppercase">{t.label}</span>
                  <span className={cn('text-xl font-black', t.urgent ? 'text-red-400' : 'text-white')}>{t.count}</span>
                </button>
              ))}
              <button onClick={() => setShowNewFault(true)}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> LOG FAULT
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {(faultTab === 'active' ? activeFaults : clearedFaults).length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-600 text-sm">
                {faultTab === 'active' ? 'No active fault messages' : 'No cleared faults'}
              </div>
            ) : (
              (faultTab === 'active' ? activeFaults : clearedFaults).map(fault => {
                const sev = SEVERITY_STYLES[fault.severity] || SEVERITY_STYLES.caution;
                const SysIcon = SYSTEM_ICONS[fault.system] || AlertTriangle;
                const alreadyLogged = entries.some(e => e.description?.includes(`[FAULT → LOGBOOK] ${fault.fault_code}`));
                return (
                  <div key={fault.id} className={cn('flex items-start justify-between px-5 py-4 hover:bg-white/5 transition-colors border-l-2', sev.border)}>
                    <div className="flex items-start gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', sev.bg)}>
                        <SysIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded', sev.bg, 'text-white')}>{sev.label}</span>
                          <span className="font-mono font-bold text-sm">{fault.fault_code}</span>
                        </div>
                        <p className="text-xs text-gray-400">{fault.description}</p>
                        {fault.ata_chapter && <p className="text-xs text-gray-600 mt-0.5">ATA {fault.ata_chapter}</p>}
                      </div>
                    </div>
                    {fault.status === 'active' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => { if (!alreadyLogged) wireToLogbookMutation.mutate({ fault, ac: selectedAc }); }}
                          disabled={wireToLogbookMutation.isPending || alreadyLogged}
                          className={cn('text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1',
                            alreadyLogged ? 'bg-primary/10 text-primary border-primary/30 opacity-60 cursor-default' : 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30')}>
                          <FilePlus className="w-3 h-3" />{alreadyLogged ? 'LOGGED' : 'LOG ENTRY'}
                        </button>
                        <button onClick={() => clearFaultMutation.mutate({ id: fault.id })}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-800/50 text-green-400 border border-green-700 hover:bg-green-700/50 transition-colors">
                          CLEAR
                        </button>
                      </div>
                    )}
                    {fault.status === 'cleared' && (
                      <span className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5" /> Cleared
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── LOG ENTRIES ─────────────────────────────────────────────────────── */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">

          {/* Role tabs */}
          <div className="flex items-center gap-0 border-b border-white/10 px-5 pt-4">
            {ROLE_TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setViewRole(id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-lg transition-all mr-1',
                  viewRole === id
                    ? 'bg-primary/15 text-primary border border-primary/30 border-b-0'
                    : 'text-gray-500 hover:text-gray-300'
                )}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Quick filter bar */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/6 overflow-x-auto scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            {QUICK_FILTERS.map(f => (
              <button key={f.id} onClick={() => setQuickFilter(f.id)}
                className={cn('flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                  quickFilter === f.id
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-[#1a1f2e] border-white/10 text-gray-400 hover:text-white hover:border-white/20')}>
                {f.label}
              </button>
            ))}
          </div>

          {/* CREATE ENTRY QUICK PANEL */}
          <div className="px-5 py-4 border-b border-white/6">
            <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Quick Entry Templates
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Pilot Discrepancy',  border: 'border-red-700',    text: 'text-red-400',    bg: 'bg-red-950/40',
                  preset: { entry_type: 'discrepancy', severity: 'ops', reporter_role: 'captain', description_template: '[PILOT REPORT] ' } },
                { label: 'Tech Discrepancy',   border: 'border-amber-800',  text: 'text-amber-500',  bg: 'bg-amber-950/40',
                  preset: { entry_type: 'discrepancy', severity: 'mel', reporter_role: 'maintenance', description_template: '[TECH FINDING] ' } },
                { label: 'Parts Installation', border: 'border-purple-700', text: 'text-purple-400', bg: 'bg-purple-950/40',
                  preset: { entry_type: 'corrective_action', severity: 'info', reporter_role: 'maintenance', description_template: 'Parts Installation — removed/installed component(s) as listed in Parts section. ' } },
                { label: 'Deferral / MEL',     border: 'border-yellow-700', text: 'text-yellow-400', bg: 'bg-yellow-950/40',
                  preset: { entry_type: 'deferred', severity: 'mel', reporter_role: 'maintenance', is_deferred: true, description_template: 'Item deferred per MEL. Discrepancy: ' } },
                { label: 'Parts Ordering',     border: 'border-amber-900',  text: 'text-amber-600',  bg: 'bg-amber-950/30',
                  preset: { entry_type: 'info', severity: 'info', reporter_role: 'maintenance', description_template: 'Parts Ordering — BOR/ROB request raised for P/N: ' } },
                { label: 'Oil Service',        border: 'border-blue-800',   text: 'text-blue-300',   bg: 'bg-blue-950/40',
                  preset: { entry_type: 'info', severity: 'info', reporter_role: 'maintenance', ata_chapter: '79', description_template: 'Engine / APU oil service performed — quantities recorded in Oil Service section (ATA 79). ' } },
                { label: 'Oxygen Service',     border: 'border-cyan-700',   text: 'text-cyan-400',   bg: 'bg-cyan-950/40',
                  preset: { entry_type: 'info', severity: 'info', reporter_role: 'maintenance', ata_chapter: '35', description_template: 'Crew oxygen system serviced per AMM 35-11 — bottle pressure before/after: ' } },
              ].map(({ label, border, text, bg, preset }) => (
                <button key={label}
                  onClick={() => { setEntryPreset(preset); setShowNewEntry(true); }}
                  className={cn('px-3 py-2.5 rounded-xl border font-bold text-xs tracking-wide transition-all hover:brightness-125', border, text, bg)}>
                  {label}
                </button>
              ))}
              {/* Aircraft History tab */}
              <Link
                to={`/MaintenanceLogbook?tail=${selectedTail || ''}`}
                className="px-3 py-2.5 rounded-xl border border-indigo-700 text-indigo-300 bg-indigo-950/40 font-bold text-xs tracking-wide transition-all hover:brightness-125 flex items-center justify-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" /> Aircraft History
              </Link>
              <Link
                to={`/ReleaseArchive?tail=${selectedTail || ''}`}
                className="px-3 py-2.5 rounded-xl border border-slate-600 text-slate-300 bg-slate-900/40 font-bold text-xs tracking-wide transition-all hover:brightness-125 flex items-center justify-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" /> Archived Records
              </Link>
            </div>
          </div>

          {/* Section header */}
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-sm text-gray-500">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
              {quickFilter !== 'all' && <span className="text-primary ml-1 font-bold">· filtered</span>}
            </p>
            <button onClick={() => { setEntryPreset(null); setShowNewEntry(true); }}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> NEW ENTRY
            </button>
          </div>

          {/* Entry list */}
          <div className="px-5 pb-5 space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="py-14 text-center text-gray-600 text-sm space-y-2">
                <BookOpen className="w-10 h-10 text-gray-800 mx-auto" />
                <p>No log entries match this filter</p>
              </div>
            ) : (
              filteredEntries.map(entry => (
                <LogEntryCard key={entry.id} entry={entry} viewRole={viewRole} />
              ))
            )}
          </div>
        </div>


      </div>

      {/* ── STICKY MOBILE ACTIONS ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 backdrop-blur border-t border-white/10 px-5 py-3 flex items-center gap-2 lg:hidden">
        <button onClick={() => { setEntryPreset({ entry_type: 'discrepancy' }); setShowNewEntry(true); }}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-red-900/40 border border-red-700/50 text-red-400 hover:bg-red-900/60 transition-colors">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase">Discrepancy</span>
        </button>
        <button onClick={() => { setEntryPreset({ entry_type: 'corrective_action' }); setShowNewEntry(true); }}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-green-900/40 border border-green-700/50 text-green-400 hover:bg-green-900/60 transition-colors">
          <CheckCircle className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase">Fix / RTS</span>
        </button>
        <button onClick={() => { setEntryPreset({ entry_type: 'deferred' }); setShowNewEntry(true); }}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-amber-900/40 border border-amber-700/50 text-amber-400 hover:bg-amber-900/60 transition-colors">
          <Tag className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase">Defer</span>
        </button>
        <button onClick={() => { setEntryPreset({ entry_type: 'info', description: 'Parts Installation' }); setShowNewEntry(true); }}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-purple-900/40 border border-purple-700/50 text-purple-400 hover:bg-purple-900/60 transition-colors">
          <Package className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase">Add Part</span>
        </button>
        <button onClick={() => { setEntryPreset({ entry_type: 'info', description: 'Photo documentation' }); setShowNewEntry(true); }}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-blue-900/40 border border-blue-700/50 text-blue-400 hover:bg-blue-900/60 transition-colors">
          <FileText className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase">Notes</span>
        </button>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {showQRScanner && (
        <AircraftQRScanner aircraft={aircraft} onScan={(tail) => setSelectedTail(tail)} onClose={() => setShowQRScanner(false)} />
      )}
      {showNewEntry && (
        <NewLogEntryModal
          aircraftTail={selectedTail}
          aircraftType={selectedAc?.aircraft_type}
          nextLogPage={nextLogPage}
          preset={entryPreset}
          onClose={() => { setShowNewEntry(false); setEntryPreset(null); }}
          onSave={(data) => createEntryMutation.mutate(data)}
        />
      )}
      {showNewFault && (
        <NewFaultModal aircraftTail={selectedTail} onClose={() => setShowNewFault(false)} onSave={(data) => createFaultMutation.mutate(data)} />
      )}
      {signOffMel && (
        <MELSignOffModal
          melItem={signOffMel}
          aircraftTail={selectedTail}
          nextLogPage={nextLogPage}
          onClose={() => setSignOffMel(null)}
        />
      )}
    </div>
  );
}