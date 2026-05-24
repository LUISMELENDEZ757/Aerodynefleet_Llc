import { Clock, Plane, Wrench, AlertTriangle, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const ENTRY_CFG = {
  discrepancy:      { icon: AlertTriangle, color: 'text-red-400',   bg: 'bg-red-900/20',   label: 'Discrepancy' },
  corrective_action:{ icon: Wrench,        color: 'text-green-400', bg: 'bg-green-900/20', label: 'Corrective Action' },
  deferred:         { icon: Clock,         color: 'text-amber-400', bg: 'bg-amber-900/20', label: 'Deferred' },
  cleared:          { icon: Plane,         color: 'text-cyan-400',  bg: 'bg-cyan-900/20',  label: 'Cleared' },
  info:             { icon: Clock,         color: 'text-blue-400',  bg: 'bg-blue-900/20',  label: 'Info' },
};

export default function FlightHistoryTimeline({ logEntries, tailNumber }) {
  const recent = [...logEntries]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 15);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-foreground">Flight & Maintenance History</h2>

      {recent.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-bold text-muted-foreground">No history entries</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-1">
            {recent.map((entry, i) => {
              const cfg = ENTRY_CFG[entry.entry_type] || ENTRY_CFG.info;
              const Icon = cfg.icon;
              const isEtops = entry.description?.includes('ETOPS') || entry.notes?.includes('ETOPS');
              return (
                <div key={entry.id} className="relative flex items-start gap-4 pl-12 pb-4">
                  {/* Node */}
                  <div className={cn('absolute left-3 w-4 h-4 rounded-full flex items-center justify-center border-2 border-background flex-shrink-0 mt-1', cfg.bg)}>
                    <div className={cn('w-1.5 h-1.5 rounded-full', cfg.color.replace('text-', 'bg-'))} />
                  </div>

                  <div className="flex-1 bg-card border border-border rounded-xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded uppercase', cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                        {entry.ata_chapter && (
                          <span className="text-[10px] text-muted-foreground">ATA {entry.ata_chapter}</span>
                        )}
                        {isEtops && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 bg-cyan-900/20 px-1.5 py-0.5 rounded border border-cyan-700/30">
                            <Globe className="w-2.5 h-2.5" /> ETOPS
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_date).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-foreground mt-1.5 leading-relaxed">{entry.description}</p>
                    {entry.corrective_action && (
                      <p className="text-xs text-green-400 mt-1">✓ {entry.corrective_action}</p>
                    )}
                    {entry.technician_name && (
                      <p className="text-[10px] text-muted-foreground mt-1">Tech: {entry.technician_name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}