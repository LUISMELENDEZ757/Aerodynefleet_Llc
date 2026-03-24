import { cn } from '@/lib/utils';
import { Clock, Wrench, AlertTriangle, CheckCircle, Package, Radio, FileText, Zap } from 'lucide-react';
import { useFlightTimeline } from '@/hooks/useFlightTimeline';

const EVENT_ICONS = {
  troubleshooting: Wrench,
  repair:          Wrench,
  inspection:      CheckCircle,
  parts_order:     Package,
  moc_contact:     Radio,
  log_page:        FileText,
  release:         CheckCircle,
  other:           Clock,
};

const EVENT_COLORS = {
  troubleshooting: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
  repair:          'text-blue-400 bg-blue-500/15 border-blue-500/30',
  inspection:      'text-primary bg-primary/15 border-primary/30',
  parts_order:     'text-purple-400 bg-purple-500/15 border-purple-500/30',
  moc_contact:     'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  log_page:        'text-foreground bg-secondary border-border',
  release:         'text-green-400 bg-green-500/15 border-green-500/30',
  other:           'text-muted-foreground bg-muted border-border',
};

function TimelineItem({ event, isLast }) {
  const Icon = EVENT_ICONS[event.type] || Clock;
  const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.other;

  return (
    <div className="flex gap-3">
      {/* Spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={cn('w-8 h-8 rounded-full border flex items-center justify-center', colorClass)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground leading-tight">{event.title}</p>
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{event.time}</span>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {event.is_aog && (
            <span className="text-xs font-bold text-destructive bg-destructive/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> AOG
            </span>
          )}
          {event.progress != null && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${event.progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{event.progress}%</span>
            </div>
          )}
          <span className={cn('text-xs px-1.5 py-0.5 rounded border capitalize', colorClass)}>
            {event.type?.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Timeline({ flightNumber }) {
  const { timeline, oosEntries, isLoading } = useFlightTimeline(flightNumber, true);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground p-2">Loading timeline…</p>;
  }

  if (oosEntries.length === 0) {
    return (
      <div className="rounded-xl bg-secondary/30 border border-border px-4 py-6 text-center">
        <Zap className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No maintenance events for this flight</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* OOS summary chips */}
      <div className="flex flex-wrap gap-2">
        {oosEntries.map(o => (
          <span key={o.id} className="text-xs font-mono bg-secondary border border-border rounded-lg px-2.5 py-1 text-foreground">
            {o.tail_number} · <span className="text-muted-foreground">{o.work_description?.slice(0, 30)}</span>
          </span>
        ))}
      </div>

      {/* Timeline */}
      {timeline.length === 0 ? (
        <p className="text-xs text-muted-foreground">No timeline events recorded</p>
      ) : (
        <div className="pt-2">
          {timeline.map((event, i) => (
            <TimelineItem key={event.id} event={event} isLast={i === timeline.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}