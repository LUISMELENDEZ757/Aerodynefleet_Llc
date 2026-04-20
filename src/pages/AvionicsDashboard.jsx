import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Cpu, ChevronLeft, Download, RefreshCw, CheckCircle, AlertTriangle,
  Clock, Wifi, Radio, Navigation, Database, HardDrive, Activity,
  ChevronDown, FileDown, Plane, Layers, BarChart3, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Aircraft type groupings ──────────────────────────────────────────────────
const AIRCRAFT_TYPES = ['All Types', 'B737-700', 'B737-800', 'B737-900', 'B737 MAX 8', 'B737 MAX 9', 'B757', 'B767', 'B777', 'B787', 'A320', 'A321', 'A350', 'E190', 'CRJ900'];

// ── Mock avionics system status per aircraft ─────────────────────────────────
function getAvionicsStatus(tail) {
  // deterministic pseudo-random based on tail string
  const hash = tail.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const statuses = ['nominal', 'nominal', 'nominal', 'nominal', 'caution', 'caution', 'fault'];
  const systems = [
    { name: 'FMS',        icon: Navigation, status: statuses[hash % 7] },
    { name: 'ACARS',      icon: Radio,      status: statuses[(hash + 1) % 7] },
    { name: 'ADS-B',      icon: Wifi,       status: statuses[(hash + 2) % 7] },
    { name: 'TCAS II',    icon: Shield,     status: statuses[(hash + 3) % 7] },
    { name: 'IRS/IRU',    icon: Activity,   status: statuses[(hash + 4) % 7] },
    { name: 'EGPWS',      icon: Layers,     status: statuses[(hash + 5) % 7] },
    { name: 'CMC',        icon: Cpu,        status: statuses[(hash + 6) % 7] },
    { name: 'SATCOM',     icon: Database,   status: statuses[(hash + 7) % 7] },
  ];
  return systems;
}

// ── Nav/Data DB versions by aircraft type ───────────────────────────────────
const NAV_DB_VERSIONS = {
  'B737-700': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'U10.8A', status: 'current' },
  'B737-800': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'U10.8A', status: 'current' },
  'B737-900': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'U10.8A', status: 'current' },
  'B737 MAX 8': { current: 'AIRAC 2603', next: 'AIRAC 2605', fms: 'U12.1', status: 'outdated' },
  'B737 MAX 9': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'U12.1', status: 'current' },
  'B757': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'U1.7', status: 'current' },
  'B767': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'U1.7', status: 'current' },
  'B777': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'U7.2', status: 'current' },
  'B787': { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'CDS R14.2', status: 'current' },
  'A320':  { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'FM1B9M2', status: 'current' },
  'A321':  { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'FM1B9M2', status: 'current' },
  'A350':  { current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'FM2E.M10', status: 'current' },
  'E190':  { current: 'AIRAC 2603', next: 'AIRAC 2605', fms: 'MSP845', status: 'outdated' },
  'CRJ900':{ current: 'AIRAC 2604', next: 'AIRAC 2605', fms: 'R13.0', status: 'current' },
};

// ── DFDR / QAR download records per aircraft type ───────────────────────────
const DFDR_RECORDS = {
  'B737-800': [
    { tail: 'N455GJ', date: '2026-04-19', flight: 'AEX1042', duration: '4h 12m', size: '42 MB', status: 'available' },
    { tail: 'N456GJ', date: '2026-04-18', flight: 'AEX0891', duration: '2h 55m', size: '28 MB', status: 'available' },
    { tail: 'N455GJ', date: '2026-04-17', flight: 'AEX1120', duration: '5h 03m', size: '51 MB', status: 'pending' },
  ],
  'B737 MAX 8': [
    { tail: 'N701AX', date: '2026-04-19', flight: 'AEX2211', duration: '3h 40m', size: '37 MB', status: 'available' },
    { tail: 'N702AX', date: '2026-04-18', flight: 'AEX2198', duration: '1h 58m', size: '19 MB', status: 'available' },
  ],
  'B777': [
    { tail: 'N771AX', date: '2026-04-19', flight: 'AEX0011', duration: '10h 22m', size: '103 MB', status: 'available' },
    { tail: 'N772AX', date: '2026-04-18', flight: 'AEX0042', duration: '9h 50m', size: '98 MB', status: 'processing' },
  ],
  'B787': [
    { tail: 'N781AX', date: '2026-04-19', flight: 'AEX0088', duration: '12h 05m', size: '121 MB', status: 'available' },
  ],
  'A320': [
    { tail: 'N320AX', date: '2026-04-19', flight: 'AEX3301', duration: '1h 45m', size: '17 MB', status: 'available' },
    { tail: 'N321AX', date: '2026-04-18', flight: 'AEX3288', duration: '2h 10m', size: '21 MB', status: 'available' },
  ],
};

// ── Software update packages by aircraft type ────────────────────────────────
const SW_PACKAGES = {
  'B737-800': [
    { pkg: 'Nav DB AIRAC 2605', type: 'Navigation', size: '24 MB', release: '2026-04-18', status: 'ready' },
    { pkg: 'TCAS 7.1 Patch', type: 'Avionics SW', size: '8 MB', release: '2026-03-01', status: 'installed' },
    { pkg: 'FMS U10.8B', type: 'FMS Update', size: '156 MB', release: '2026-04-10', status: 'ready' },
  ],
  'B737 MAX 8': [
    { pkg: 'Nav DB AIRAC 2605', type: 'Navigation', size: '24 MB', release: '2026-04-18', status: 'ready' },
    { pkg: 'MCAS Enhancement v2.2', type: 'Flight Controls', size: '312 MB', release: '2026-04-01', status: 'installed' },
    { pkg: 'FMS U12.1B', type: 'FMS Update', size: '178 MB', release: '2026-04-10', status: 'ready' },
  ],
  'B777': [
    { pkg: 'Nav DB AIRAC 2605', type: 'Navigation', size: '24 MB', release: '2026-04-18', status: 'ready' },
    { pkg: 'FMS U7.3', type: 'FMS Update', size: '205 MB', release: '2026-04-05', status: 'ready' },
    { pkg: 'ADS-B Out Cert', type: 'Avionics SW', size: '12 MB', release: '2026-03-20', status: 'installed' },
  ],
  'B787': [
    { pkg: 'Nav DB AIRAC 2605', type: 'Navigation', size: '24 MB', release: '2026-04-18', status: 'ready' },
    { pkg: 'CDS R14.3', type: 'Core System', size: '2.1 GB', release: '2026-04-12', status: 'ready' },
  ],
  'A320': [
    { pkg: 'Nav DB AIRAC 2605', type: 'Navigation', size: '24 MB', release: '2026-04-18', status: 'ready' },
    { pkg: 'FMS FM1B9M3', type: 'FMS Update', size: '189 MB', release: '2026-04-08', status: 'ready' },
    { pkg: 'TCAS 7.1', type: 'Avionics SW', size: '8 MB', release: '2026-02-15', status: 'installed' },
  ],
};

// ── Status styling ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  nominal:    { label: 'NOMINAL',    color: 'text-green-400',  bg: 'bg-green-500/15',  dot: 'bg-green-400' },
  caution:    { label: 'CAUTION',    color: 'text-amber-400',  bg: 'bg-amber-500/15',  dot: 'bg-amber-400 animate-pulse' },
  fault:      { label: 'FAULT',      color: 'text-red-400',    bg: 'bg-red-500/15',    dot: 'bg-red-400 animate-pulse' },
  current:    { label: 'CURRENT',    color: 'text-green-400',  bg: 'bg-green-500/15' },
  outdated:   { label: 'OUTDATED',   color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  available:  { label: 'AVAILABLE',  color: 'text-sky-400',    bg: 'bg-sky-500/15' },
  pending:    { label: 'PENDING',    color: 'text-amber-400',  bg: 'bg-amber-500/15' },
  processing: { label: 'PROCESSING', color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  ready:      { label: 'READY',      color: 'text-sky-400',    bg: 'bg-sky-500/15' },
  installed:  { label: 'INSTALLED',  color: 'text-green-400',  bg: 'bg-green-500/15' },
};

// ── Zulu clock ────────────────────────────────────────────────────────────────
function ZuluClock() {
  const [t, setT] = useState(new Date());
  useState(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); });
  const p = n => String(n).padStart(2, '0');
  return <span className="font-mono text-xs font-extrabold text-primary tracking-widest">{p(t.getUTCHours())}:{p(t.getUTCMinutes())}:{p(t.getUTCSeconds())} Z</span>;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-[#141922] border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color + '/20')}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className="text-xl font-black text-white">{value}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

// ── Tab: Fleet Avionics Status ─────────────────────────────────────────────────
function FleetStatusTab({ aircraft, typeFilter }) {
  const filtered = aircraft.filter(a => typeFilter === 'All Types' || a.aircraft_type === typeFilter);

  const nomCount    = filtered.reduce((s, a) => s + getAvionicsStatus(a.tail_number).filter(x => x.status === 'nominal').length, 0);
  const cautCount   = filtered.reduce((s, a) => s + getAvionicsStatus(a.tail_number).filter(x => x.status === 'caution').length, 0);
  const faultCount  = filtered.reduce((s, a) => s + getAvionicsStatus(a.tail_number).filter(x => x.status === 'fault').length, 0);

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Aircraft Monitored" value={filtered.length}     color="text-white"       icon={Plane} />
        <KpiCard label="Systems Nominal"    value={nomCount}            color="text-green-400"   icon={CheckCircle} />
        <KpiCard label="Cautions"           value={cautCount}           color="text-amber-400"   icon={AlertTriangle} />
        <KpiCard label="Faults"             value={faultCount}          color="text-red-400"     icon={Activity} />
      </div>

      {/* Per-aircraft breakdown */}
      <div className="space-y-2">
        {filtered.slice(0, 40).map(ac => {
          const systems = getAvionicsStatus(ac.tail_number);
          const hasFault   = systems.some(s => s.status === 'fault');
          const hasCaution = systems.some(s => s.status === 'caution');
          const borderColor = hasFault ? 'border-red-500/40' : hasCaution ? 'border-amber-500/40' : 'border-white/8';
          return (
            <div key={ac.id} className={cn('bg-[#141922] border rounded-xl px-4 py-3', borderColor)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-extrabold text-primary font-mono">{ac.tail_number}</p>
                  <p className="text-xs text-gray-500">{ac.aircraft_type}</p>
                  {hasFault && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">FAULT</span>}
                  {!hasFault && hasCaution && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">CAUTION</span>}
                </div>
                <p className="text-[10px] text-gray-600">{ac.base_station || '—'}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {systems.map(sys => {
                  const cfg = STATUS_CFG[sys.status];
                  const Icon = sys.icon;
                  return (
                    <div key={sys.name} className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg', cfg.bg, cfg.color)}>
                      <Icon className="w-3 h-3" />
                      <span>{sys.name}</span>
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-gray-600 py-12">No aircraft for this type</div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Nav / Data Downloads ──────────────────────────────────────────────────
function NavDataTab({ typeFilter }) {
  const types = typeFilter === 'All Types'
    ? Object.keys(NAV_DB_VERSIONS)
    : (NAV_DB_VERSIONS[typeFilter] ? [typeFilter] : Object.keys(NAV_DB_VERSIONS));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map(type => {
          const db = NAV_DB_VERSIONS[type];
          const pkgs = SW_PACKAGES[type] || [];
          const cfg = STATUS_CFG[db.status];
          return (
            <div key={type} className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-primary" />
                  <p className="text-sm font-extrabold text-white">{type}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500">Current AIRAC</p>
                  <p className="font-bold text-white mt-0.5">{db.current}</p>
                </div>
                <div className="bg-[#0d1117] rounded-lg px-3 py-2">
                  <p className="text-gray-500">Next AIRAC</p>
                  <p className="font-bold text-amber-400 mt-0.5">{db.next}</p>
                </div>
                <div className="bg-[#0d1117] rounded-lg px-3 py-2 col-span-2">
                  <p className="text-gray-500">FMS Version</p>
                  <p className="font-bold text-primary mt-0.5 font-mono">{db.fms}</p>
                </div>
              </div>

              {pkgs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Software Packages</p>
                  {pkgs.map(pkg => {
                    const pc = STATUS_CFG[pkg.status];
                    return (
                      <div key={pkg.pkg} className="flex items-center justify-between bg-[#0d1117] rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs font-bold text-white">{pkg.pkg}</p>
                          <p className="text-[10px] text-gray-500">{pkg.type} · {pkg.size} · {pkg.release}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', pc.bg, pc.color)}>{pc.label}</span>
                          {pkg.status === 'ready' && (
                            <button className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20">
                              <Download className="w-3 h-3" /> DL
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: DFDR / QAR Downloads ─────────────────────────────────────────────────
function DFDRTab({ typeFilter }) {
  const types = typeFilter === 'All Types'
    ? Object.keys(DFDR_RECORDS)
    : (DFDR_RECORDS[typeFilter] ? [typeFilter] : Object.keys(DFDR_RECORDS));

  const allRecords = types.flatMap(t => (DFDR_RECORDS[t] || []).map(r => ({ ...r, type: t })));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 mb-2">
        <KpiCard label="Total Records" value={allRecords.length}                                          color="text-white"     icon={HardDrive} />
        <KpiCard label="Available"     value={allRecords.filter(r => r.status === 'available').length}   color="text-sky-400"   icon={FileDown} />
        <KpiCard label="Processing"    value={allRecords.filter(r => r.status !== 'available').length}   color="text-amber-400" icon={Clock} />
      </div>

      <div className="bg-[#141922] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">DFDR / QAR Flight Records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Tail', 'Type', 'Date', 'Flight', 'Duration', 'Size', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRecords.map((r, i) => {
                const sc = STATUS_CFG[r.status];
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-extrabold text-primary text-xs">{r.tail}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.type}</td>
                    <td className="px-4 py-3 text-xs text-gray-300 font-mono">{r.date}</td>
                    <td className="px-4 py-3 text-xs text-white font-bold">{r.flight}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.duration}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{r.size}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', sc.bg, sc.color)}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'available' && (
                        <button className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1.5 rounded-lg border border-sky-500/20 whitespace-nowrap">
                          <Download className="w-3 h-3" /> Download
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'status',  label: 'Fleet Avionics Status', icon: Activity },
  { id: 'navdata', label: 'Nav/Data Downloads',    icon: Navigation },
  { id: 'dfdr',    label: 'DFDR Downloads',         icon: HardDrive },
];

export default function AvionicsDashboard() {
  const [activeTab, setActiveTab] = useState('status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const { data: aircraft = [], isLoading, refetch } = useQuery({
    queryKey: ['avionics-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 1000),
    refetchInterval: 120000,
  });

  const faultAircraft  = aircraft.filter(a => getAvionicsStatus(a.tail_number).some(s => s.status === 'fault')).length;
  const cautionAircraft = aircraft.filter(a => getAvionicsStatus(a.tail_number).some(s => s.status === 'caution')).length;

  return (
    <div className="h-screen flex flex-col bg-[#080c12] text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-white/8 flex-shrink-0 bg-[#0a0e18]">
        <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors flex-shrink-0">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-extrabold text-white tracking-widest uppercase">Avionics Dashboard</p>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase">Fleet Systems Monitor · All Aircraft Types</p>
          </div>
        </div>

        {/* Quick KPIs */}
        <div className="hidden md:flex items-center gap-5 ml-4 border-l border-white/10 pl-4">
          {[
            { label: 'Fleet', val: aircraft.length, color: 'text-white' },
            { label: 'Faults', val: faultAircraft, color: faultAircraft > 0 ? 'text-red-400' : 'text-gray-500' },
            { label: 'Cautions', val: cautionAircraft, color: cautionAircraft > 0 ? 'text-amber-400' : 'text-gray-500' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className={cn('text-base font-black leading-none', color)}>{val}</p>
              <p className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ZuluClock />
          <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors">
            <RefreshCw className={cn('w-3.5 h-3.5 text-gray-400', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Secondary toolbar: tabs + type filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 bg-[#0a0e18] flex-shrink-0 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border transition-all uppercase tracking-widest',
              activeTab === id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30')}>
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}

        <div className="ml-auto relative">
          <button onClick={() => setShowTypeMenu(v => !v)}
            className="flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-all">
            <Layers className="w-3 h-3" /> {typeFilter} <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showTypeMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTypeMenu(false)} />
              <div className="absolute top-full right-0 mt-1 bg-[#141922] border border-white/10 rounded-xl shadow-2xl z-20 min-w-[160px] py-1 max-h-80 overflow-y-auto">
                {AIRCRAFT_TYPES.map(t => (
                  <button key={t} onClick={() => { setTypeFilter(t); setShowTypeMenu(false); }}
                    className={cn('w-full text-left px-3 py-2 text-[10px] hover:bg-white/5',
                      typeFilter === t ? 'text-primary font-bold' : 'text-gray-300')}>
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'status'  && <FleetStatusTab aircraft={aircraft} typeFilter={typeFilter} />}
        {activeTab === 'navdata' && <NavDataTab typeFilter={typeFilter} />}
        {activeTab === 'dfdr'    && <DFDRTab typeFilter={typeFilter} />}
      </div>
    </div>
  );
}