import React from 'react';
import { cn } from '@/lib/utils';
import { Wrench, Search, Package, Phone, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

const EVENT_ICONS = {
  troubleshooting: Search,
  repair: Wrench,
  parts_order: Package,
  moc_contact: Phone,
  log_page: FileText,
  release: CheckCircle,
  inspection: Search,
  other: FileText,
};

const EVENT_COLORS = {
  troubleshooting: 'bg-primary/10 border-primary/30 text-primary',
  repair: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  parts_order: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  moc_contact: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  log_page: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  release: 'bg-green-500/10 border-green-500/30 text-green-400',
  inspection: 'bg-primary/10 border-primary/30 text-primary',
  other: 'bg-muted border-border text-muted-foreground',
};

export default function EventCard({ event }) {
  const Icon = EVENT_ICONS[event.event_type] || FileText;
  const colorClass = EVENT_COLORS[event.event_type] || EVENT_COLORS.other;

  return (
    <div className="flex gap-3">
      {/* Time column */}
      <div className="w-14 flex-shrink-0 text-right pt-1">
        <span className="text-xs font-mono font-medium text-muted-foreground">{event.event_time}</span>
        {event.end_time && (
          <div className="text-xs font-mono text-muted-foreground/60">
            – {event.end_time}
          </div>
        )}
      </div>

      {/* Timeline dot & line */}
      <div className="flex flex-col items-center">
        <div className={cn("w-2 h-2 rounded-full mt-2", event.event_type === 'release' ? 'bg-green-400' : 'bg-primary')} />
        <div className="w-px flex-1 bg-border/60 my-1" />
      </div>

      {/* Content */}
      <div className={cn("flex-1 mb-4 rounded-lg border p-3", colorClass)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-sm font-semibold">{event.title}</span>
          </div>
          {event.duration && (
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{event.duration}</span>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 ml-5.5">{event.description}</p>
        )}

        <div className="flex items-center gap-2 mt-1.5 ml-5.5 flex-wrap">
          {event.reference_number && (
            <span className="text-xs font-mono bg-background/50 px-1.5 py-0.5 rounded">{event.reference_number}</span>
          )}
          {event.is_aog && (
            <span className="text-xs font-semibold text-orange-400 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" />
              AOG
            </span>
          )}
          {event.progress_percent != null && event.progress_percent > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-background/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${event.progress_percent}%` }}
                />
              </div>
              <span className="text-xs font-mono">{event.progress_percent}%</span>
            </div>
          )}
          {event.technician && (
            <span className="text-xs text-muted-foreground">— {event.technician}</span>
          )}
        </div>
      </div>
    </div>
  );
}