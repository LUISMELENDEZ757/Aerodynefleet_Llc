import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plane, Wrench, CheckCircle, Clock, ExternalLink, Lock, Eye, EyeOff, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  active:      { label: 'ACTIVE',       bg: 'bg-green-600',  dot: 'bg-green-400' },
  oos:         { label: 'OOS',          bg: 'bg-red-700',    dot: 'bg-red-400' },
  maintenance: { label: 'MAINTENANCE',  bg: 'bg-orange-600', dot: 'bg-orange-400' },
  retired:     { label: 'RETIRED',      bg: 'bg-gray-600',   dot: 'bg-gray-400' },
};

const FILTER_OPTIONS = [
  { value: 'all',         label: 'All',         color: 'bg-white/10 text-white' },
  { value: 'active',      label: 'Active',      color: 'bg-green-600 text-white' },
  { value: 'oos',         label: 'OOS',         color: 'bg-red-700 text-white' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-600 text-white' },
  { value: 'retired',     label: 'Retired',     color: 'bg-gray-600 text-white' },
];

export default function MccFleetStatus({ aircraft, oosEntries, logbookEntries, removeMode, selectedForDelete, onSelectForDelete }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const qc = useQueryClient();
  const openDiscrepancies = logbookEntries.filter(e => !e.is_cleared && e.entry_type === 'discrepancy');
  const filteredAircraft = statusFilter === 'all' ? aircraft : aircraft.filter(a => a.status === statusFilter);

  const watchMutation = useMutation({
    mutationFn: ({ id, mcc_watch }) => base44.entities.Aircraft.update(id, { mcc_watch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fleet-aircraft'] }),
  });

  const ferryMutation = useMutation({
    mutationFn: ({ id, ferry_flight }) => base44.entities.Aircraft.update(id, { ferry_flight }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fleet-aircraft'] }),
  });

  const { data: locks = [] } = useQuery({
    queryKey: ['mcc-locks'],
    queryFn: () => base44.entities.MccLock.list('-created_date', 200),
    refetchInterval: 30000,
  });
  const activeLocks = locks.filter(l => l.is_active);

  return (
    <div className="space-y-4">
      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Fleet Dashboard',   path: '/FleetDashboard',       color: 'bg-orange-600' },
          { label: 'E-Logbook',         path: '/TechOpsLogbook',       color: 'bg-violet-600' },
          { label: 'Technician Mode',   path: '/OOSDashboard',         color: 'bg-amber-600' },
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
        {FILTER_OPTIONS.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all border',
              statusFilter === value
                ? cn(color, 'border-transparent')
                : 'bg-[#141922] border-white/10 text-gray-400 hover:text-white'
            )}
          >
            {label}
            <span className="ml-1.5 opacity-70">
              ({value === 'all' ? aircraft.length : aircraft.filter(a => a.status === value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Aircraft grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAircraft.map(ac => {
          const cfg = STATUS_CFG[ac.status] || STATUS_CFG.active;
          const acOOS = oosEntries.filter(e => e.tail_number === ac.tail_number && (e.status === 'in_work' || e.status === 'waiting_on_parts'));
          const acDiscr = openDiscrepancies.filter(e => e.aircraft_tail === ac.tail_number);
          const acLock = activeLocks.find(l => l.aircraft_tail === ac.tail_number);

          // 24h+ hourglass: check oos_date or created_date of most recent OOS entry
          const isOosOver24h = (() => {
            if (ac.status !== 'oos' && ac.status !== 'maintenance') return false;
            const entry = oosEntries.find(e => e.tail_number === ac.tail_number);
            if (!entry) return false;
            const dateStr = entry.oos_date || entry.created_date;
            const hoursOos = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
            return hoursOos >= 24;
          })();

          return (
            <div
              key={ac.id}
              onClick={removeMode ? () => onSelectForDelete(ac.id) : undefined}
              className={cn(
                'relative bg-[#141922] border rounded-2xl p-4 space-y-3 transition-all',
                removeMode ? 'cursor-pointer' : '',
                acLock ? 'border-red-500/60 bg-red-950/20' :
                removeMode && selectedForDelete === ac.id
                  ? 'border-red-500 bg-red-900/20'
                  : 'border-white/10'
              )}
            >
              {removeMode && selectedForDelete === ac.id && (
                <div className="absolute top-2 right-2 text-[10px] font-extrabold text-red-300 bg-red-900/80 px-2 py-0.5 rounded-lg">SELECTED</div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-extrabold text-white font-mono">{ac.tail_number}</span>
                  {ac.mcc_watch && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 border border-amber-400 animate-pulse">
                      <Eye className="w-3 h-3 text-black" />
                      <span className="text-[9px] font-extrabold text-black">WATCH</span>
                    </div>
                  )}
                  {ac.ferry_flight && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500 border border-sky-400 animate-pulse">
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
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-600 border border-red-500" title={`MCC Lock: ${acLock.reason}`}>
                      <Lock className="w-3 h-3 text-white" />
                      <span className="text-[9px] font-extrabold text-white">LOCKED</span>
                    </div>
                  )}
                </div>
                <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white', cfg.bg)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />{cfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">{ac.aircraft_type} · {ac.base_station || '—'}</p>

              <div className="flex gap-2 flex-wrap">
                {acOOS.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/20 text-red-400">
                    {acOOS.length} OOS OPEN
                  </span>
                )}
                {acDiscr.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400">
                    {acDiscr.length} DISCREPANCY
                  </span>
                )}
                {acOOS.length === 0 && acDiscr.length === 0 && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-500/20 text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> CLEAR
                  </span>
                )}
              </div>
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
        })}
        {filteredAircraft.length === 0 && (
          <p className="col-span-3 text-center text-gray-600 text-sm py-12">No aircraft found</p>
        )}
      </div>
    </div>
  );
}