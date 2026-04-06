import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plane, TrendingDown, AlertTriangle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  departed:  { label: 'DEP',      color: 'text-green-400',  bg: 'bg-green-500/15'  },
  airborne:  { label: 'AIR',      color: 'text-cyan-400',   bg: 'bg-cyan-500/15'   },
  arrived:   { label: 'ARR',      color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  boarding:  { label: 'BOARD',    color: 'text-primary',    bg: 'bg-primary/15'    },
  scheduled: { label: 'SCHED',    color: 'text-gray-400',   bg: 'bg-gray-500/10'   },
  delayed:   { label: 'DELAY',    color: 'text-amber-400',  bg: 'bg-amber-500/15'  },
  cancelled: { label: 'CXLD',     color: 'text-red-400',    bg: 'bg-red-500/15'    },
  diverted:  { label: 'DIV',      color: 'text-orange-400', bg: 'bg-orange-500/15' },
  on_time:   { label: 'ON TIME',  color: 'text-green-400',  bg: 'bg-green-500/15'  },
  landed:    { label: 'LDG',      color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
};

function KpiBox({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-[#0d1117] rounded-xl px-3 py-2.5 flex items-center gap-2 min-w-0">
      <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
      <div className="min-w-0">
        <p className={cn('text-xl font-extrabold font-mono leading-none', color)}>{value}</p>
        <p className="text-[10px] text-gray-600 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function FlightMovementPanel({ flights }) {
  const today = new Date().toISOString().split('T')[0];
  const todayFlights = useMemo(() => flights.filter(f => f.flight_date === today), [flights, today]);

  const departures  = todayFlights.filter(f => ['departed','airborne','boarding'].includes(f.status)).length;
  const arrivals    = todayFlights.filter(f => ['arrived','landed'].includes(f.status)).length;
  const delayed     = todayFlights.filter(f => f.status === 'delayed' || (f.delay_minutes || 0) >= 15).length;
  const cancelled   = todayFlights.filter(f => f.status === 'cancelled').length;
  const diversions  = todayFlights.filter(f => f.delay_reason?.toLowerCase().includes('divert')).length;

  const activeFlights = todayFlights
    .filter(f => !['arrived','landed','cancelled'].includes(f.status))
    .sort((a, b) => (a.scheduled_departure || '').localeCompare(b.scheduled_departure || ''))
    .slice(0, 6);

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" />
          <p className="text-sm font-extrabold text-white tracking-wide">LIVE FLIGHT MOVEMENT</p>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <Link to="/Dashboard" className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">
          Full View <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-2 px-4 py-3">
        <KpiBox label="Departures" value={departures} color="text-green-400"  icon={Plane} />
        <KpiBox label="Arrivals"   value={arrivals}   color="text-cyan-400"   icon={TrendingDown} />
        <KpiBox label="Diversions" value={diversions} color="text-orange-400" icon={AlertTriangle} />
        <KpiBox label="Delays"     value={delayed}    color={delayed > 0 ? 'text-amber-400' : 'text-gray-500'}   icon={Clock} />
        <KpiBox label="Cancelled"  value={cancelled}  color={cancelled > 0 ? 'text-red-400' : 'text-gray-500'}   icon={XCircle} />
      </div>

      {activeFlights.length > 0 && (
        <div className="divide-y divide-white/5 border-t border-white/10">
          {activeFlights.map(f => {
            const st = STATUS_CFG[f.status] || STATUS_CFG.scheduled;
            const late = (f.delay_minutes || 0) >= 15;
            return (
              <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
                <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded flex-shrink-0', st.bg, st.color)}>{st.label}</span>
                <span className="text-xs font-mono font-bold text-white w-20 truncate">{f.flight_number}</span>
                <span className="text-xs text-gray-500 flex-1">{f.origin} → {f.destination}</span>
                {f.aircraft_tail && <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">{f.aircraft_tail}</span>}
                {late && <span className="text-[10px] font-bold text-amber-400 flex-shrink-0">+{f.delay_minutes}m</span>}
              </div>
            );
          })}
        </div>
      )}

      {todayFlights.length === 0 && (
        <p className="text-center text-gray-600 text-xs py-6">No flights scheduled today</p>
      )}
    </div>
  );
}