import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Settings2, AlertTriangle, CheckCircle, Activity,
  Package, Search, RefreshCw, ChevronDown, Wrench, Zap, Wind,
  Cpu, Flame, ExternalLink, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────
const ENGINE_POSITIONS = ['#1 (Left)', '#2 (Right)', '#3 (Center)', '#4 (Right Outer)', 'APU'];

const CATEGORY_ICONS = {
  'Fuel System':               Flame,
  'Ignition & Start':          Zap,
  'Oil System':                Wind,
  'Accessory Gearbox':         Settings2,
  'Turbine Section':           Cpu,
  'Compressor Section':        Activity,
  'Fan & Inlet':               Wind,
  'Exhaust & Thrust Reverser': Flame,
  'Electrical':                Zap,
  'Bleed Air':                 Wind,
  'Other':                     Package,
};

const STATUS_CFG = {
  installed:     { label: 'INSTALLED',     bg: 'bg-green-600',   text: 'text-green-400',  dot: 'bg-green-400' },
  serviceable:   { label: 'SERVICEABLE',   bg: 'bg-blue-600',    text: 'text-blue-400',   dot: 'bg-blue-400' },
  unserviceable: { label: 'UNSERVICEABLE', bg: 'bg-red-700',     text: 'text-red-400',    dot: 'bg-red-400' },
  on_order:      { label: 'ON ORDER',      bg: 'bg-amber-600',   text: 'text-amber-400',  dot: 'bg-amber-400' },
  scrapped:      { label: 'SCRAPPED',      bg: 'bg-gray-700',    text: 'text-gray-400',   dot: 'bg-gray-400' },
};

// ── Life Limit Helpers ─────────────────────────────────────────────────────────
function getLifeStatus(current, limit) {
  if (!limit || current == null) return null;
  const pct = (current / limit) * 100;
  if (pct >= 100) return { label: 'EXPIRED',  color: 'text-red-400',   barColor: 'bg-red-500',   pct: 100 };
  if (pct >= 90)  return { label: 'CRITICAL', color: 'text-red-400',   barColor: 'bg-red-500',   pct };
  if (pct >= 75)  return { label: 'WARNING',  color: 'text-amber-400', barColor: 'bg-amber-500', pct };
  return              { label: 'OK',       color: 'text-green-400', barColor: 'bg-green-500', pct };
}

function getWorstLifeStatus(part) {
  const statuses = [
    getLifeStatus(part.total_cycles_since_new, part.cycle_life_limit),
    getLifeStatus(part.cycles_since_overhaul, part.overhaul_interval_cycles),
    getLifeStatus(part.total_hours_since_new, part.hour_life_limit),
    getLifeStatus(part.hours_since_overhaul, part.overhaul_interval_hours),
  ].filter(Boolean);
  if (statuses.some(s => s.label === 'EXPIRED'))  return 'EXPIRED';
  if (statuses.some(s => s.label === 'CRITICAL')) return 'CRITICAL';
  if (statuses.some(s => s.label === 'WARNING'))  return 'WARNING';
  if (statuses.length > 0) return 'OK';
  return null;
}

// ── Mini Life Bar ──────────────────────────────────────────────────────────────
function MiniLifeBar({ current, limit, label }) {
  const status = getLifeStatus(current, limit);
  if (!status) return null;
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[9px] text-gray-500">{label}</span>
        <span className={cn('text-[9px] font-bold', status.color)}>{status.label}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1">
        <div className={cn('h-full rounded-full', status.barColor)} style={{ width: `${Math.min(status.pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ── Part Card ──────────────────────────────────────────────────────────────────
function PartCard({ part }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[part.status] || STATUS_CFG.installed;
  const worstStatus = getWorstLifeStatus(part);
  const Icon = CATEGORY_ICONS[part.part_category] || Package;
  const isAlert = ['EXPIRED', 'CRITICAL'].includes(worstStatus);
  const isWarning = worstStatus === 'WARNING';

  return (
    <div className={cn(
      'border rounded-xl overflow-hidden transition-all',
      isAlert ? 'border-red-500/40 bg-red-950/10' :
      isWarning ? 'border-amber-500/30 bg-amber-950/10' :
      'border-white/8 bg-[#0d1117]'
    )}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
          isAlert ? 'bg-red-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-white/10'
        )}>
          {isAlert
            ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            : <Icon className={cn('w-3.5 h-3.5', isWarning ? 'text-amber-400' : 'text-gray-400')} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{part.part_name}</p>
          <p className="text-[10px] font-mono text-gray-500 truncate">P/N: {part.part_number} · S/N: {part.serial_number}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {worstStatus && worstStatus !== 'OK' && (
            <span className={cn(
              'text-[9px] font-extrabold px-1.5 py-0.5 rounded',
              isAlert ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
            )}>{worstStatus}</span>
          )}
          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full text-white', cfg.bg)}>{cfg.label}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-gray-500 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {[
              { label: 'Category', value: part.part_category },
              { label: 'ATA', value: part.ata_chapter || '—' },
              { label: 'Manufacturer', value: part.manufacturer || '—' },
              { label: 'Station', value: part.station || '—' },
              { label: 'CSN', value: part.total_cycles_since_new?.toLocaleString() ?? '—' },
              { label: 'CSO', value: part.cycles_since_overhaul?.toLocaleString() ?? '—' },
              { label: 'HSN', value: part.total_hours_since_new?.toLocaleString() ?? '—' },
              { label: 'HSO', value: part.hours_since_overhaul?.toLocaleString() ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-600 uppercase tracking-widest font-bold">{label}</p>
                <p className="text-white font-bold">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <MiniLifeBar current={part.total_cycles_since_new} limit={part.cycle_life_limit} label="CSN vs LLP Limit" />
            <MiniLifeBar current={part.cycles_since_overhaul} limit={part.overhaul_interval_cycles} label="CSO vs Overhaul Interval" />
            <MiniLifeBar current={part.total_hours_since_new} limit={part.hour_life_limit} label="HSN vs Hour Limit" />
            <MiniLifeBar current={part.hours_since_overhaul} limit={part.overhaul_interval_hours} label="HSO vs Overhaul Interval" />
          </div>
          {part.ad_compliance && (
            <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg px-3 py-1.5">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">AD: {part.ad_compliance}</p>
            </div>
          )}
          {part.tag_document_url && (
            <a href={part.tag_document_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold hover:underline">
              <CheckCircle className="w-3 h-3" /> {part.tag_document_type || '8130-3'} Attached ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Engine/APU Unit Block ──────────────────────────────────────────────────────
function EngineBlock({ position, parts, isAPU }) {
  const [expanded, setExpanded] = useState(true);
  const alertCount = parts.filter(p => ['EXPIRED','CRITICAL'].includes(getWorstLifeStatus(p))).length;
  const warnCount  = parts.filter(p => getWorstLifeStatus(p) === 'WARNING').length;
  const installedCount = parts.filter(p => p.status === 'installed').length;

  return (
    <div className={cn(
      'border rounded-2xl overflow-hidden',
      isAPU ? 'border-violet-500/30 bg-violet-950/10' :
      alertCount > 0 ? 'border-red-500/30' :
      warnCount > 0 ? 'border-amber-500/20' : 'border-white/10 bg-[#141922]'
    )}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            isAPU ? 'bg-violet-500/20' :
            alertCount > 0 ? 'bg-red-500/20' :
            warnCount > 0 ? 'bg-amber-500/20' : 'bg-primary/15'
          )}>
            {isAPU
              ? <Cpu className="w-5 h-5 text-violet-400" />
              : <Settings2 className={cn('w-5 h-5', alertCount > 0 ? 'text-red-400' : warnCount > 0 ? 'text-amber-400' : 'text-primary')} />
            }
          </div>
          <div className="text-left">
            <p className={cn('text-base font-extrabold', isAPU ? 'text-violet-300' : 'text-white')}>{position}</p>
            <p className="text-[10px] text-gray-500">{parts.length} parts · {installedCount} installed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-3 h-3" /> {alertCount} CRITICAL
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {warnCount} WARNING
            </span>
          )}
          {alertCount === 0 && warnCount === 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-green-500/20 text-green-400">
              <CheckCircle className="w-3 h-3" /> OK
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
          {parts.length === 0 ? (
            <p className="text-center text-gray-600 text-xs py-6">No parts recorded for this position</p>
          ) : (
            parts.map(p => <PartCard key={p.id} part={p} />)
          )}
        </div>
      )}
    </div>
  );
}

// ── Aircraft EBU Card ──────────────────────────────────────────────────────────
function AircraftEBUCard({ tail, aircraftType, parts }) {
  const [expanded, setExpanded] = useState(false);

  const totalAlerts = parts.filter(p => ['EXPIRED','CRITICAL'].includes(getWorstLifeStatus(p))).length;
  const totalWarns  = parts.filter(p => getWorstLifeStatus(p) === 'WARNING').length;

  const byPosition = ENGINE_POSITIONS.reduce((acc, pos) => {
    acc[pos] = parts.filter(p => p.engine_position === pos);
    return acc;
  }, {});

  const presentPositions = ENGINE_POSITIONS.filter(pos => byPosition[pos].length > 0);

  return (
    <div className={cn(
      'border rounded-2xl overflow-hidden',
      totalAlerts > 0 ? 'border-red-500/40' :
      totalWarns > 0 ? 'border-amber-500/30' : 'border-white/10'
    )}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 bg-[#141922] hover:bg-[#1a2030] transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            totalAlerts > 0 ? 'bg-red-600/20 border border-red-500/40' :
            totalWarns > 0 ? 'bg-amber-600/20 border border-amber-500/40' :
            'bg-primary/15 border border-primary/20'
          )}>
            <Settings2 className={cn('w-6 h-6',
              totalAlerts > 0 ? 'text-red-400' :
              totalWarns > 0 ? 'text-amber-400' : 'text-primary'
            )} />
          </div>
          <div>
            <p className="text-xl font-black text-primary font-mono">{tail}</p>
            <p className="text-xs text-gray-400">{aircraftType || '—'} · {parts.length} tracked parts · {presentPositions.length} engine/APU position{presentPositions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {totalAlerts > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-3.5 h-3.5" /> {totalAlerts} Critical
            </span>
          )}
          {totalWarns > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {totalWarns} Warning
            </span>
          )}
          {totalAlerts === 0 && totalWarns === 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-green-500/20 text-green-400">
              <CheckCircle className="w-3.5 h-3.5" /> All Clear
            </span>
          )}
          <ChevronDown className={cn('w-5 h-5 text-gray-500 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-3 bg-[#0d1117]">
          {presentPositions.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-8">No parts recorded for this aircraft</p>
          ) : (
            presentPositions.map(pos => (
              <EngineBlock
                key={pos}
                position={pos}
                parts={byPosition[pos]}
                isAPU={pos === 'APU'}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, sublabel }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
      <Icon className={cn('w-5 h-5', color)} />
      <p className={cn('text-4xl font-black tracking-tight', color)}>{value}</p>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      {sublabel && <p className="text-[9px] text-gray-600">{sublabel}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EBUDashboard() {
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [alertFilter, setAlertFilter] = useState('All'); // All | Critical | Warning | OK

  const { data: parts = [], isLoading, refetch } = useQuery({
    queryKey: ['engine-part-inventory'],
    queryFn: () => base44.entities.EnginePartInventory.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  // Group parts by tail
  const tailsWithParts = [...new Set(parts.map(p => p.aircraft_tail).filter(Boolean))];
  const uninstalled = parts.filter(p => !p.aircraft_tail);

  // Apply search & position filter at the tail level
  const filteredTails = tailsWithParts.filter(tail => {
    if (search && !tail.toLowerCase().includes(search.toLowerCase())) {
      const tailParts = parts.filter(p => p.aircraft_tail === tail);
      const matchesPart = tailParts.some(p =>
        p.part_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.part_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.serial_number?.toLowerCase().includes(search.toLowerCase())
      );
      if (!matchesPart) return false;
    }
    if (positionFilter !== 'All') {
      const tailParts = parts.filter(p => p.aircraft_tail === tail && p.engine_position === positionFilter);
      if (tailParts.length === 0) return false;
    }
    if (alertFilter !== 'All') {
      const tailParts = parts.filter(p => p.aircraft_tail === tail);
      const hasAlert = alertFilter === 'Critical'
        ? tailParts.some(p => ['EXPIRED','CRITICAL'].includes(getWorstLifeStatus(p)))
        : alertFilter === 'Warning'
        ? tailParts.some(p => getWorstLifeStatus(p) === 'WARNING')
        : tailParts.every(p => !['EXPIRED','CRITICAL','WARNING'].includes(getWorstLifeStatus(p)));
      if (!hasAlert) return false;
    }
    return true;
  });

  const totalParts    = parts.length;
  const criticalCount = parts.filter(p => ['EXPIRED','CRITICAL'].includes(getWorstLifeStatus(p))).length;
  const warnCount     = parts.filter(p => getWorstLifeStatus(p) === 'WARNING').length;
  const apuParts      = parts.filter(p => p.engine_position === 'APU').length;
  const engineParts   = parts.filter(p => p.engine_position !== 'APU' && p.aircraft_tail).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0e18] px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/EngineRemovalInstallation" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-black text-primary tracking-widest uppercase">EBU Dashboard</h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">Engine Build-Up</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Engine & APU Part Inventory · Per-Tail Life Status · Fleet-Wide Oversight</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
            <Link
              to="/PartInventory"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
            >
              <Package className="w-4 h-4" /> Part Inventory <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <KpiCard icon={Package}       label="Total Parts"     value={totalParts}      color="text-white" />
          <KpiCard icon={Settings2}     label="Engine Parts"    value={engineParts}     color="text-primary" />
          <KpiCard icon={Cpu}           label="APU Parts"       value={apuParts}        color="text-violet-400" />
          <KpiCard icon={AlertTriangle} label="Critical / Exp." value={criticalCount}   color={criticalCount > 0 ? 'text-red-400' : 'text-gray-600'} />
          <KpiCard icon={Activity}      label="Nearing Limit"   value={warnCount}       color={warnCount > 0 ? 'text-amber-400' : 'text-gray-600'} />
        </div>

        {/* Alert Banner */}
        {criticalCount > 0 && (
          <div className="flex items-center gap-3 bg-red-900/25 border border-red-500/40 rounded-2xl px-5 py-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-extrabold text-red-400">CRITICAL LIFE LIMIT ALERT</p>
              <p className="text-xs text-red-300/80">{criticalCount} part{criticalCount > 1 ? 's' : ''} at or beyond life limit — immediate action required before next flight.</p>
            </div>
            <button onClick={() => setAlertFilter('Critical')} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors">
              View Only
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tail, part name, P/N, S/N…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
          <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)}
            className="bg-[#141922] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none">
            <option value="All">All Positions</option>
            {ENGINE_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex gap-1 bg-[#141922] border border-white/10 rounded-xl p-1">
            {['All','Critical','Warning','OK'].map(f => (
              <button
                key={f}
                onClick={() => setAlertFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  alertFilter === f
                    ? f === 'Critical' ? 'bg-red-600 text-white'
                    : f === 'Warning' ? 'bg-amber-600 text-white'
                    : f === 'OK' ? 'bg-green-700 text-white'
                    : 'bg-white/15 text-white'
                    : 'text-gray-500 hover:text-white'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">{filteredTails.length} aircraft with tracked parts</p>
          {alertFilter !== 'All' && (
            <button onClick={() => setAlertFilter('All')} className="text-xs font-bold text-primary hover:underline">Clear filter</button>
          )}
        </div>

        {/* Per-Aircraft EBU Cards */}
        {isLoading ? (
          <div className="text-center text-gray-600 py-20">Loading EBU data…</div>
        ) : filteredTails.length === 0 && parts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Settings2 className="w-14 h-14 text-gray-700 mx-auto" />
            <p className="text-gray-400 font-bold">No engine/APU parts in inventory</p>
            <Link to="/PartInventory" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
              <Package className="w-4 h-4" /> Go to Part Inventory
            </Link>
          </div>
        ) : filteredTails.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No aircraft match current filters</div>
        ) : (
          <div className="space-y-3">
            {filteredTails.map(tail => {
              const ac = aircraft.find(a => a.tail_number === tail);
              const tailParts = parts.filter(p => p.aircraft_tail === tail &&
                (positionFilter === 'All' || p.engine_position === positionFilter)
              );
              return (
                <AircraftEBUCard
                  key={tail}
                  tail={tail}
                  aircraftType={ac?.aircraft_type}
                  parts={tailParts}
                />
              );
            })}
          </div>
        )}

        {/* Uninstalled / Stock Parts */}
        {uninstalled.length > 0 && (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#141922] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-extrabold text-white">Stock / Uninstalled Parts</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-400">{uninstalled.length}</span>
              </div>
              <Link to="/PartInventory" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                Manage <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-4 pb-4 pt-3 space-y-2 bg-[#0d1117]">
              {uninstalled.map(p => <PartCard key={p.id} part={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}