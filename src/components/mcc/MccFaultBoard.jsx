import { Link } from 'react-router-dom';
import { Zap, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEV_CFG = {
  warning:  { color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/30' },
  caution:  { color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-amber-500/30' },
  advisory: { color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/30' },
  memo:     { color: 'text-gray-400',   bg: 'bg-gray-500/20',   border: 'border-gray-500/20' },
};

export default function MccFaultBoard({ faults, aircraft }) {
  const active  = faults.filter(f => f.status === 'active').sort((a, b) => {
    const order = { warning: 0, caution: 1, advisory: 2, memo: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });
  const cleared = faults.filter(f => f.status === 'cleared').slice(0, 5);

  // Group by aircraft
  const byTail = {};
  active.forEach(f => {
    if (!byTail[f.aircraft_tail]) byTail[f.aircraft_tail] = [];
    byTail[f.aircraft_tail].push(f);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">EICAS / BITE Fault Messages</p>
        <Link to="/TechOpsLogbook" className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300">
          E-Logbook <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="bg-green-900/20 border border-green-500/30 rounded-2xl px-5 py-10 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-bold">No active fault messages</p>
        </div>
      ) : (
        Object.entries(byTail).map(([tail, tailFaults]) => (
          <div key={tail} className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-extrabold text-white font-mono">{tail}</span>
              <span className="text-xs text-gray-400">{tailFaults.length} active fault{tailFaults.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-white/5">
              {tailFaults.map(f => {
                const cfg = SEV_CFG[f.severity] || SEV_CFG.advisory;
                return (
                  <div key={f.id} className={cn('flex items-start gap-3 px-4 py-3 border-l-2', cfg.border)}>
                    <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded flex-shrink-0 mt-0.5', cfg.bg, cfg.color)}>
                      {f.severity?.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white font-mono">{f.fault_code}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>
                      {f.ata_chapter && <p className="text-[10px] text-gray-600 mt-0.5">ATA {f.ata_chapter}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {cleared.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Recently Cleared</p>
          <div className="space-y-2">
            {cleared.map(f => (
              <div key={f.id} className="flex items-center gap-3 bg-[#141922] border border-white/5 rounded-xl px-4 py-3">
                <span className="font-mono text-xs text-gray-400 w-20">{f.aircraft_tail}</span>
                <span className="font-mono font-bold text-white text-sm">{f.fault_code}</span>
                <span className="flex-1 text-xs text-gray-500 truncate">{f.description}</span>
                <span className="text-[10px] text-green-400 font-bold">CLEARED</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}