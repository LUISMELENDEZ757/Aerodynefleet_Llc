import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  in_work: 'bg-primary/20 text-primary border-primary/30',
  waiting_on_parts: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  released: 'bg-green-500/20 text-green-400 border-green-500/30',
  deferred: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS = {
  in_work: 'In Work',
  waiting_on_parts: 'Parts',
  released: 'Released',
  deferred: 'Deferred',
};

function getElapsed(oosDate, oosTime) {
  if (!oosDate || !oosTime) return '--:--';
  const [h, m] = oosTime.split(':').map(Number);
  const start = new Date(oosDate);
  start.setHours(h, m, 0, 0);
  const now = new Date();
  const diff = Math.max(0, now - start);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export default function OOSCard({ entry }) {
  const elapsed = useMemo(() => getElapsed(entry.oos_date, entry.oos_time), [entry.oos_date, entry.oos_time]);

  return (
    <Link to={`/OOSDetail?id=${entry.id}`} className="block">
      <div className="mx-4 mb-3 rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-all active:scale-[0.98]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-primary">{entry.aircraft_type}</span>
            <span className="text-base font-bold text-foreground">{entry.tail_number}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-sm font-mono font-bold text-primary">{elapsed}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {entry.flight_number && <span>{entry.flight_number}</span>}
          {entry.flight_number && entry.station && <span>|</span>}
          {entry.station && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {entry.station}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-foreground mb-2">{entry.work_description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>OOS {entry.oos_date ? new Date(entry.oos_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '--'}</span>
            {entry.oos_time && <span>{entry.oos_time}</span>}
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full border",
            STATUS_COLORS[entry.status] || STATUS_COLORS.in_work
          )}>
            {STATUS_LABELS[entry.status] || entry.status}
          </span>
        </div>

        {entry.logpage_number && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-mono">{entry.logpage_number}</span>
          </div>
        )}
      </div>
    </Link>
  );
}