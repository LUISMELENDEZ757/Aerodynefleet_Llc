import { Link } from 'react-router-dom';
import { Plane, Wrench, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  active:      { label: 'ACTIVE',       bg: 'bg-green-600',  dot: 'bg-green-400' },
  oos:         { label: 'OOS',          bg: 'bg-red-700',    dot: 'bg-red-400' },
  maintenance: { label: 'MAINTENANCE',  bg: 'bg-orange-600', dot: 'bg-orange-400' },
  retired:     { label: 'RETIRED',      bg: 'bg-gray-600',   dot: 'bg-gray-400' },
};

export default function MccFleetStatus({ aircraft, oosEntries, logbookEntries }) {
  const openDiscrepancies = logbookEntries.filter(e => !e.is_cleared && e.entry_type === 'discrepancy');

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

      {/* Aircraft grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {aircraft.map(ac => {
          const cfg = STATUS_CFG[ac.status] || STATUS_CFG.active;
          const acOOS = oosEntries.filter(e => e.tail_number === ac.tail_number && (e.status === 'in_work' || e.status === 'waiting_on_parts'));
          const acDiscr = openDiscrepancies.filter(e => e.aircraft_tail === ac.tail_number);

          return (
            <div key={ac.id} className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-extrabold text-white font-mono">{ac.tail_number}</span>
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
            </div>
          );
        })}
        {aircraft.length === 0 && (
          <p className="col-span-3 text-center text-gray-600 text-sm py-12">No aircraft registered</p>
        )}
      </div>
    </div>
  );
}