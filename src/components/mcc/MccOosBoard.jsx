import { Link } from 'react-router-dom';
import { Wrench, Clock, Package, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  in_work:           { label: 'IN WORK',         color: 'text-orange-400', bg: 'bg-orange-500/20' },
  waiting_on_parts:  { label: 'WAITING PARTS',   color: 'text-red-400',    bg: 'bg-red-500/20' },
  released:          { label: 'RELEASED',         color: 'text-green-400',  bg: 'bg-green-500/20' },
  deferred:          { label: 'DEFERRED',         color: 'text-amber-400',  bg: 'bg-amber-500/20' },
};

export default function MccOosBoard({ oosEntries, aircraft }) {
  const open = oosEntries.filter(e => e.status !== 'released');
  const released = oosEntries.filter(e => e.status === 'released').slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">Open OOS / MX Items</p>
        <Link to="/OOSDashboard" className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300">
          Technician Mode <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {open.length === 0 ? (
        <div className="bg-green-900/20 border border-green-500/30 rounded-2xl px-5 py-10 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-bold">All aircraft cleared — no open OOS items</p>
        </div>
      ) : (
        <div className="space-y-3">
          {open.map(entry => {
            const cfg = STATUS_CFG[entry.status] || STATUS_CFG.in_work;
            return (
              <div key={entry.id} className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span className="font-bold text-white font-mono">{entry.tail_number}</span>
                    {entry.station && <span className="text-xs text-gray-500">{entry.station}</span>}
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0', cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{entry.work_description}</p>
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                  {entry.logpage_number && <span>LP: {entry.logpage_number}</span>}
                  {entry.oos_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.oos_date} {entry.oos_time || ''}</span>}
                  {entry.delay_category && <span>Delay Cat: {entry.delay_category}</span>}
                </div>
                {entry.notes && <p className="text-xs text-gray-500 italic">{entry.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {released.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Recently Released</p>
          <div className="space-y-2">
            {released.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-[#141922] border border-white/5 rounded-xl px-4 py-3">
                <span className="font-mono font-bold text-white text-sm">{e.tail_number}</span>
                <span className="text-xs text-gray-400 truncate mx-3 flex-1">{e.work_description}</span>
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">RELEASED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}