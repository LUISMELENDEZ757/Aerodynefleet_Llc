import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Activity, TrendingDown, CalendarDays, Wrench,
  RefreshCw, ChevronLeft, AlertTriangle, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EGTMarginChart from '@/components/enginehealth/EGTMarginChart';
import LLPLifeTable from '@/components/enginehealth/LLPLifeTable';
import ShopVisitTimeline from '@/components/enginehealth/ShopVisitTimeline';

const TABS = [
  { id: 'egt',      label: 'EGT Margin Trends',     icon: TrendingDown },
  { id: 'llp',      label: 'Remaining Engine Life',  icon: Wrench },
  { id: 'shopvisit',label: 'Shop Visit Forecast',    icon: CalendarDays },
];

export default function EngineHealthAnalytics() {
  const [activeTab, setActiveTab] = useState('egt');
  const [tailFilter, setTailFilter] = useState('all');

  const { data: imports = [], refetch: refetchImports, isLoading: loadingImports } = useQuery({
    queryKey: ['eha-imports'],
    queryFn: () => base44.entities.TelemetryImport.list('-created_date', 200),
  });

  const { data: forecasts = [], refetch: refetchForecasts, isLoading: loadingForecasts } = useQuery({
    queryKey: ['eha-forecasts'],
    queryFn: () => base44.entities.MaintenanceForecast.list('-created_date', 500),
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['eha-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const isLoading = loadingImports || loadingForecasts;

  const refetch = () => { refetchImports(); refetchForecasts(); };

  // Tails present in either dataset
  const allTails = [...new Set([
    ...imports.filter(i => i.aircraft_tail).map(i => i.aircraft_tail),
    ...forecasts.filter(f => f.aircraft_tail).map(f => f.aircraft_tail),
  ])].sort();

  const filteredImports  = tailFilter === 'all' ? imports  : imports.filter(i => i.aircraft_tail === tailFilter);
  const filteredForecasts = tailFilter === 'all' ? forecasts : forecasts.filter(f => f.aircraft_tail === tailFilter);

  // Summary KPIs
  const egtImports = imports.filter(i => ['egt_margin','engine_health'].includes(i.data_type));
  const criticalEGT = egtImports.filter(i => {
    try { return JSON.parse(i.raw_summary || '{}').min_egt_margin < 20; } catch { return false; }
  }).length;

  const overdueComponents = forecasts.filter(f => {
    const interval = f.overhaul_interval_hours || 20000;
    const sinceOH  = f.total_flight_hours - (f.last_overhaul_hours || 0);
    return sinceOH >= interval;
  }).length;

  const dueSoon = forecasts.filter(f => {
    const interval = f.overhaul_interval_hours || 20000;
    const sinceOH  = f.total_flight_hours - (f.last_overhaul_hours || 0);
    const pct = (sinceOH / interval) * 100;
    return pct >= 85 && pct < 100;
  }).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0a0e18] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide">ENGINE HEALTH ANALYTICS</p>
            <p className="text-[10px] text-emerald-400 tracking-widest uppercase">EGT Margins · LLP Life · Shop Visit Forecast</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allTails.length > 0 && (
            <select
              value={tailFilter}
              onChange={e => setTailFilter(e.target.value)}
              className="bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Tails</option>
              {allTails.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-5">
        {[
          { label: 'Telemetry Imports',    value: imports.length,        color: 'text-primary',    bg: 'bg-primary/20',    icon: Database },
          { label: 'EGT Import Records',   value: egtImports.length,     color: 'text-cyan-400',   bg: 'bg-cyan-600/20',   icon: TrendingDown },
          { label: 'Critical EGT Tails',   value: criticalEGT,           color: criticalEGT > 0 ? 'text-red-400' : 'text-green-400', bg: criticalEGT > 0 ? 'bg-red-600/20' : 'bg-green-600/20', icon: AlertTriangle },
          { label: 'Components Overdue',   value: overdueComponents,     color: overdueComponents > 0 ? 'text-red-400' : 'text-green-400', bg: overdueComponents > 0 ? 'bg-red-600/20' : 'bg-green-600/20', icon: Wrench },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue + due-soon alert */}
      {(overdueComponents > 0 || dueSoon > 0) && (
        <div className={cn(
          'mx-5 mt-4 flex items-start gap-3 rounded-2xl border px-5 py-3.5',
          overdueComponents > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'
        )}>
          <AlertTriangle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', overdueComponents > 0 ? 'text-red-400' : 'text-amber-400')} />
          <div>
            <p className={cn('text-sm font-extrabold', overdueComponents > 0 ? 'text-red-400' : 'text-amber-400')}>
              {overdueComponents > 0
                ? `${overdueComponents} component${overdueComponents > 1 ? 's' : ''} overdue — immediate shop visit required`
                : `${dueSoon} component${dueSoon > 1 ? 's' : ''} approaching overhaul limit (≥85% used)`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Review the Shop Visit Forecast tab for suggested maintenance windows.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-5 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 mt-5 space-y-5">
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading engine health data…</p>
          </div>
        )}

        {!isLoading && activeTab === 'egt' && (
          <EGTMarginChart imports={filteredImports} />
        )}

        {!isLoading && activeTab === 'llp' && (
          <LLPLifeTable forecasts={filteredForecasts} />
        )}

        {!isLoading && activeTab === 'shopvisit' && (
          <ShopVisitTimeline forecasts={filteredForecasts} />
        )}

        {/* Data source info */}
        {!isLoading && (
          <div className="bg-[#0a0e18] border border-white/5 rounded-2xl px-5 py-4 flex items-start gap-3">
            <Database className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-0.5">
              <p><span className="text-gray-400 font-bold">Data sources:</span> OEM Telemetry Hub imports + Maintenance Forecast records</p>
              <p>To enrich EGT trend data: import <span className="text-gray-400">egt_margin</span> or <span className="text-gray-400">engine_health</span> CSVs via <Link to="/TelemetryHub" className="text-emerald-400 hover:underline">Telemetry Hub</Link>.</p>
              <p>To enrich LLP / shop visit data: add component records via <Link to="/EngineeringDashboard" className="text-emerald-400 hover:underline">Engineering Dashboard → Maintenance Forecast</Link>.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}