import { Package, Globe, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  installed:      { color: 'text-green-400',  bg: 'bg-green-900/30' },
  serviceable:    { color: 'text-blue-400',   bg: 'bg-blue-900/30' },
  unserviceable:  { color: 'text-red-400',    bg: 'bg-red-900/30' },
  on_order:       { color: 'text-amber-400',  bg: 'bg-amber-900/30' },
  scrapped:       { color: 'text-gray-400',   bg: 'bg-gray-900/30' },
};

export default function PartsComponents({ engineParts, tailNumber }) {
  const installed = engineParts.filter(p => p.status === 'installed');
  const unserviceable = engineParts.filter(p => p.status === 'unserviceable');
  const onOrder = engineParts.filter(p => p.status === 'on_order');

  if (engineParts.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-foreground">Parts & Components</h2>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-bold text-muted-foreground">No component records found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-foreground">Parts & Components</h2>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Installed', count: installed.length, color: 'text-green-400' },
          { label: 'Unserviceable', count: unserviceable.length, color: unserviceable.length > 0 ? 'text-red-400' : 'text-muted-foreground' },
          { label: 'On Order', count: onOrder.length, color: onOrder.length > 0 ? 'text-amber-400' : 'text-muted-foreground' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-3 py-2.5 text-center">
            <p className={cn('text-2xl font-black font-mono', color)}>{count}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Parts List */}
      <div className="space-y-2">
        {engineParts.map(part => {
          const cfg = STATUS_CFG[part.status] || STATUS_CFG.installed;
          const cyclesRemaining = part.cycle_life_limit && part.total_cycles_since_new
            ? part.cycle_life_limit - part.total_cycles_since_new : null;
          const isNearLimit = cyclesRemaining !== null && cyclesRemaining < 500;

          return (
            <div key={part.id} className={cn('rounded-2xl border bg-card p-4', isNearLimit ? 'border-amber-500/40' : 'border-border')}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-foreground">{part.part_name}</p>
                    {isNearLimit && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" title="Near life limit" />}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{part.part_number} · S/N {part.serial_number}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', cfg.bg, cfg.color)}>
                  {part.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground">{part.engine_position}</span>
                <span className="text-[10px] text-muted-foreground">{part.part_category}</span>
                {part.total_cycles_since_new > 0 && (
                  <span className="text-[10px] text-muted-foreground">{part.total_cycles_since_new.toLocaleString()} CSN</span>
                )}
                {cyclesRemaining !== null && (
                  <span className={cn('text-[10px] font-bold', isNearLimit ? 'text-amber-400' : 'text-muted-foreground')}>
                    {cyclesRemaining.toLocaleString()} cycles remaining
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}