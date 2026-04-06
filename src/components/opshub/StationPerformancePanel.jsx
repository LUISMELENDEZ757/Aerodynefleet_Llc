import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Clock, AlertTriangle, Fuel, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StationPerformancePanel({ groundOps, flights }) {
  const today = new Date().toISOString().split('T')[0];

  const todayOps = useMemo(() => groundOps.filter(o => o.flight_date === today), [groundOps, today]);

  const total    = todayOps.length;
  const departed = todayOps.filter(o => o.boarding_status === 'closed').length;
  const boarding = todayOps.filter(o => ['boarding','final_boarding'].includes(o.boarding_status)).length;
  const fueling  = todayOps.filter(o => o.fuel_truck_status === 'fueling').length;

  // Gate conflicts: multiple ops at same gate same time
  const gateMap = {};
  todayOps.forEach(o => {
    if (o.gate) { gateMap[o.gate] = (gateMap[o.gate] || 0) + 1; }
  });
  const gateConflicts = Object.entries(gateMap).filter(([, c]) => c > 1);

  // Turns at risk: ops that are boarding but have incomplete pre-departure tasks
  const atRisk = todayOps.filter(o =>
    ['boarding','pre_boarding','final_boarding'].includes(o.boarding_status) &&
    (o.fuel_truck_status !== 'complete' || o.catering_status !== 'complete' || !o.bags_loaded)
  ).length;

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-extrabold text-white tracking-wide">STATION PERFORMANCE</p>
        </div>
        <Link to="/GroundOps" className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">
          Ground Ops <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Active Turns', value: total,    color: 'text-primary',   icon: Clock },
            { label: 'Departed',     value: departed, color: 'text-green-400', icon: CheckCircle },
            { label: 'Fueling',      value: fueling,  color: 'text-amber-400', icon: Fuel },
            { label: 'Turns at Risk',value: atRisk,   color: atRisk > 0 ? 'text-red-400' : 'text-gray-500', icon: AlertTriangle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-[#0d1117] rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
              <div>
                <p className={cn('text-xl font-extrabold font-mono', color)}>{value}</p>
                <p className="text-[10px] text-gray-600">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Gate conflicts */}
        {gateConflicts.length > 0 && (
          <div className="bg-amber-900/15 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Gate Conflicts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gateConflicts.map(([gate, count]) => (
                <span key={gate} className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                  Gate {gate} · {count} ops
                </span>
              ))}
            </div>
          </div>
        )}

        {total === 0 && (
          <p className="text-center text-gray-600 text-xs py-2">No ground ops active today</p>
        )}

        {/* Boarding summary */}
        {boarding > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            {boarding} aircraft currently boarding
          </div>
        )}
      </div>
    </div>
  );
}