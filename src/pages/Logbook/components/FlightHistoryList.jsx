import { Plane, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_DOT = {
  airborne:  'bg-green-400',
  departed:  'bg-blue-400',
  arrived:   'bg-green-400',
  cancelled: 'bg-destructive',
  delayed:   'bg-orange-400',
  boarding:  'bg-primary',
  scheduled: 'bg-muted-foreground',
};

function EntryRow({ entry, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(entry)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 text-left transition-colors',
        selected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-secondary/30'
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 relative">
        <Plane className="w-4 h-4 text-primary" />
        {entry.status && (
          <span className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-card', STATUS_DOT[entry.status] || 'bg-muted-foreground')} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono font-bold text-foreground">{entry.flight_number || '—'}</span>
          <span className="text-xs text-muted-foreground">
            {entry.origin} <ArrowRight className="w-3 h-3 inline" /> {entry.destination}
          </span>
          {entry.aircraft_type && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
              {entry.aircraft_type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{entry.flight_date}</span>
          {entry.flight_time && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.flight_time}h</span>
          )}
          {entry.approach_type && (
            <span className="text-primary font-semibold">{entry.approach_type}</span>
          )}
          {entry._source === 'manual' && (
            <span className="text-primary/60 italic">manual</span>
          )}
        </div>
      </div>
      {entry.landings > 0 && (
        <span className="text-xs font-bold text-green-400 flex items-center gap-1 flex-shrink-0">
          <CheckCircle className="w-3 h-3" />{entry.landings}
        </span>
      )}
    </button>
  );
}

export default function FlightHistoryList({ entries, selectedId, onSelect, isLoading }) {
  if (isLoading) {
    return <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (entries.length === 0) {
    return <div className="px-4 py-8 text-center text-sm text-muted-foreground">No entries found</div>;
  }
  return (
    <div>
      {entries.map(entry => (
        <EntryRow
          key={entry.id}
          entry={entry}
          selected={selectedId === entry.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}