import { useState } from 'react';
import { Plane, Clock, ArrowRight, CheckCircle, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import Playback from './Playback';

const STATUS_COLOR = {
  airborne:  'text-green-400 bg-green-500/15',
  departed:  'text-blue-400 bg-blue-500/15',
  arrived:   'text-green-400 bg-green-500/15',
  cancelled: 'text-destructive bg-destructive/15',
  delayed:   'text-orange-400 bg-orange-500/15',
  boarding:  'text-primary bg-primary/15',
  scheduled: 'text-muted-foreground bg-muted',
};

export default function FlightHistoryDetail({ entry, onClose }) {
  const [showPlayback, setShowPlayback] = useState(false);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <Plane className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Select a flight to view details</p>
      </div>
    );
  }

  const statusCfg = STATUS_COLOR[entry.status] || STATUS_COLOR.scheduled;

  const fields = [
    { label: 'Flight #',     value: entry.flight_number },
    { label: 'Date',         value: entry.flight_date },
    { label: 'Aircraft',     value: entry.aircraft_type },
    { label: 'Tail',         value: entry.aircraft_tail },
    { label: 'Gate',         value: entry.gate },
    { label: 'Flight Time',  value: entry.flight_time ? `${entry.flight_time} hrs` : null },
    { label: 'Night',        value: entry.night_time ? `${entry.night_time} hrs` : null },
    { label: 'Instrument',   value: entry.instrument_time ? `${entry.instrument_time} hrs` : null },
    { label: 'Landings',     value: entry.landings },
    { label: 'Approach',     value: entry.approach_type },
    { label: 'STD',          value: entry.scheduled_departure },
    { label: 'STA',          value: entry.scheduled_arrival },
    { label: 'ATD',          value: entry.actual_departure },
    { label: 'ATA',          value: entry.actual_arrival },
    { label: 'Delay',        value: entry.delay_minutes > 0 ? `+${entry.delay_minutes} min` : null, warn: true },
  ].filter(f => f.value != null && f.value !== '');

  return (
    <div className="h-full flex flex-col">
      {/* Detail header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" />
          <p className="text-sm font-mono font-bold text-foreground">{entry.flight_number}</p>
          <span className="text-xs text-muted-foreground">{entry.origin} → {entry.destination}</span>
        </div>
        <div className="flex items-center gap-2">
          {entry.status && (
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', statusCfg)}>
              {entry.status}
            </span>
          )}
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Route banner */}
        <div className="flex items-center justify-center gap-4 bg-card border border-border rounded-xl px-5 py-4">
          <div className="text-center">
            <p className="text-2xl font-extrabold font-mono text-foreground">{entry.origin}</p>
            <p className="text-xs text-muted-foreground">{entry.scheduled_departure || '—'}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="text-center">
            <p className="text-2xl font-extrabold font-mono text-foreground">{entry.destination}</p>
            <p className="text-xs text-muted-foreground">{entry.scheduled_arrival || '—'}</p>
          </div>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-2">
          {fields.map(({ label, value, warn }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className={cn('text-sm font-mono font-bold', warn ? 'text-orange-400' : 'text-foreground')}>
                {String(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="bg-card border border-border rounded-xl px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-xs text-foreground leading-relaxed">{entry.notes}</p>
          </div>
        )}

        {/* Playback button */}
        <button
          onClick={() => setShowPlayback(true)}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary/15 border border-primary/30 text-primary text-sm font-bold rounded-xl hover:bg-primary/25 transition-colors"
        >
          <Play className="w-4 h-4" /> Flight Playback
        </button>
      </div>

      {showPlayback && <Playback entry={entry} onClose={() => setShowPlayback(false)} />}
    </div>
  );
}