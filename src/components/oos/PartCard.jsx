import React from 'react';
import { cn } from '@/lib/utils';
import { Package, Truck, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  ordered: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Ordered' },
  aog_ordered: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'AOG Ordered' },
  in_transit: { icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Transit' },
  received: { icon: Package, color: 'text-primary', bg: 'bg-primary/10', label: 'Received' },
  installed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Installed' },
};

export default function PartCard({ part }) {
  const config = STATUS_CONFIG[part.status] || STATUS_CONFIG.ordered;
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", config.bg)}>
            <Icon className={cn("w-3.5 h-3.5", config.color)} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{part.part_name}</p>
            {part.part_number && (
              <p className="text-xs font-mono text-muted-foreground">{part.part_number}</p>
            )}
          </div>
        </div>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bg, config.color)}>
          {config.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2 ml-9 text-xs text-muted-foreground">
        {part.quantity > 1 && <span>Qty: {part.quantity}</span>}
        {part.source && <span>Source: {part.source}</span>}
        {part.eta && <span>ETA: {part.eta}</span>}
      </div>
    </div>
  );
}