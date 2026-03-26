import { Package, AlertTriangle, CheckCircle, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  aog_ordered: { label: 'AOG ORDER',  color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/30' },
  ordered:     { label: 'ORDERED',    color: 'text-amber-400',  bg: 'bg-amber-500/20',  border: 'border-white/10' },
  in_transit:  { label: 'IN TRANSIT', color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-white/10' },
  received:    { label: 'RECEIVED',   color: 'text-teal-400',   bg: 'bg-teal-500/20',   border: 'border-white/10' },
  installed:   { label: 'INSTALLED',  color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-white/10' },
};

export default function MccPartsBoard({ parts, oosEntries }) {
  const sorted = [...parts].sort((a, b) => {
    const order = { aog_ordered: 0, ordered: 1, in_transit: 2, received: 3, installed: 4 };
    return (order[a.status] ?? 5) - (order[b.status] ?? 5);
  });

  const aogCount     = parts.filter(p => p.status === 'aog_ordered').length;
  const inTransit    = parts.filter(p => p.status === 'in_transit').length;
  const pending      = parts.filter(p => p.status === 'ordered').length;

  const getOosInfo = (part) => oosEntries.find(e => e.id === part.oos_entry_id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">Parts Tracking</p>
        <div className="flex gap-2 text-xs font-bold">
          {aogCount > 0 && <span className="text-red-400 bg-red-500/20 px-2 py-1 rounded-lg">{aogCount} AOG</span>}
          {inTransit > 0 && <span className="text-blue-400 bg-blue-500/20 px-2 py-1 rounded-lg">{inTransit} In Transit</span>}
          {pending > 0 && <span className="text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg">{pending} Ordered</span>}
        </div>
      </div>

      {aogCount > 0 && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm font-extrabold text-red-400">{aogCount} AOG Part Order{aogCount > 1 ? 's' : ''} — Aircraft on Ground</p>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="bg-[#141922] border border-white/10 rounded-2xl px-5 py-10 text-center">
          <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No parts records found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(part => {
            const cfg = STATUS_CFG[part.status] || STATUS_CFG.ordered;
            const oos = getOosInfo(part);
            return (
              <div key={part.id} className={cn('bg-[#141922] border rounded-2xl p-4 space-y-2', cfg.border)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-bold text-white text-sm">{part.part_name}</span>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0', cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {part.part_number && <span className="font-mono">P/N: {part.part_number}</span>}
                  {part.quantity > 1 && <span>Qty: {part.quantity}</span>}
                  {part.source && <span>Source: {part.source}</span>}
                  {part.eta && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> ETA: {part.eta}</span>}
                </div>
                {oos && (
                  <p className="text-[10px] text-gray-500">Linked OOS: <span className="font-bold text-gray-400">{oos.tail_number}</span> — {oos.work_description?.substring(0, 50)}…</p>
                )}
                {part.notes && <p className="text-xs text-gray-500 italic">{part.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}