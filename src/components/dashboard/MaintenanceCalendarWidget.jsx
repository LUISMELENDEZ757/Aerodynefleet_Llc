import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ExternalLink, RefreshCw
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, addMonths,
  subMonths, isSameDay, format
} from 'date-fns';
import { cn } from '@/lib/utils';

// ── Event type config ─────────────────────────────────────────────────────────
const TYPE_CFG = {
  aog:        { label: 'AOG',          dot: 'bg-red-500',    badge: 'bg-red-500/15 text-red-400 border-red-500/30',    emoji: '🚨' },
  inspection: { label: 'Inspection',   dot: 'bg-blue-500',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', emoji: '🔍' },
  heavy_mx:   { label: 'Heavy MX',     dot: 'bg-purple-500', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', emoji: '🔧' },
  mel_expiry: { label: 'MEL Deadline', dot: 'bg-orange-500', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', emoji: '📋' },
  grounding:  { label: 'Grounding',    dot: 'bg-rose-500',   badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',   emoji: '⚠️' },
};

function EventDot({ type, pulse }) {
  const cfg = TYPE_CFG[type] || { dot: 'bg-gray-500' };
  return <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', cfg.dot, pulse && 'animate-pulse')} />;
}

// ── Day cell ──────────────────────────────────────────────────────────────────
function DayCell({ date, events, selectedDay, onSelect, otherMonth }) {
  const isToday    = isSameDay(date, new Date());
  const isSelected = selectedDay && isSameDay(date, selectedDay);
  const dayEvents  = events.filter(e => isSameDay(new Date(e.date), date));
  const hasAog     = dayEvents.some(e => e.type === 'aog');

  return (
    <button
      onClick={() => onSelect(date)}
      className={cn(
        'min-h-[72px] p-1.5 rounded-lg border text-left transition-all',
        isSelected  ? 'border-primary bg-primary/10'           : 'border-border hover:border-primary/40',
        isToday     ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : '',
        otherMonth  ? 'opacity-30'                             : '',
        hasAog      ? 'bg-red-500/5'                           : ''
      )}
    >
      <p className={cn('text-[11px] font-bold mb-1', isToday ? 'text-primary' : 'text-muted-foreground')}>
        {format(date, 'd')}
      </p>
      <div className="space-y-0.5">
        {dayEvents.slice(0, 3).map((evt, i) => (
          <div key={i} className="flex items-center gap-1 min-w-0">
            <EventDot type={evt.type} pulse={evt.type === 'aog'} />
            <p className="text-[9px] text-foreground truncate leading-tight">{evt.title}</p>
          </div>
        ))}
        {dayEvents.length > 3 && (
          <p className="text-[9px] text-muted-foreground">+{dayEvents.length - 3} more</p>
        )}
      </div>
    </button>
  );
}

// ── Data fetcher ──────────────────────────────────────────────────────────────
function useCalendarEvents() {
  return useQuery({
    queryKey: ['dashboard-mx-calendar'],
    queryFn: async () => {
      const [forecasts, melItems, oosEntries, inspections] = await Promise.all([
        base44.entities.MaintenanceForecast.list('-suggested_window_start', 300),
        base44.entities.MELItem.filter({ status: 'open' }, '-expires_at', 200),
        base44.entities.OOSEntry.list('-created_date', 100),
        base44.entities.ScheduledInspection.list('scheduled_date', 200),
      ]);

      const events = [];

      // AOG / Grounding (OOS entries)
      oosEntries.forEach(oos => {
        const date = oos.estimated_return_date || oos.created_date?.split('T')[0];
        if (date) {
          events.push({
            id: `aog-${oos.id}`,
            type: oos.status === 'grounded' || !oos.estimated_return_date ? 'aog' : 'grounding',
            date,
            title: `${oos.aircraft_tail} ${oos.status === 'grounded' ? 'AOG' : 'RTS'}`,
            detail: oos.reason || 'Aircraft out of service',
            meta: oos.station ? `Station: ${oos.station}` : '',
          });
        }
      });

      // Scheduled Inspections
      inspections.forEach(insp => {
        if (insp.scheduled_date) {
          events.push({
            id: `insp-${insp.id}`,
            type: 'inspection',
            date: insp.scheduled_date,
            title: `${insp.aircraft_tail} ${insp.inspection_type?.replace(/_/g, ' ') || 'Inspection'}`,
            detail: insp.title || insp.inspection_type,
            meta: insp.location ? `📍 ${insp.location}` : '',
          });
        }
      });

      // Heavy MX Forecasts
      forecasts.forEach(fc => {
        if (fc.suggested_window_start) {
          events.push({
            id: `mx-${fc.id}`,
            type: 'heavy_mx',
            date: fc.suggested_window_start,
            title: `${fc.aircraft_tail} ${fc.component || 'Heavy MX'}`,
            detail: `Overhaul window`,
            meta: `ATA ${fc.component} • ${Math.round(fc.total_flight_hours || 0)}h`,
          });
        }
      });

      // MEL Deadlines
      melItems.forEach(mel => {
        if (mel.expires_at) {
          events.push({
            id: `mel-${mel.id}`,
            type: 'mel_expiry',
            date: mel.expires_at,
            title: `${mel.aircraft_tail} MEL expires`,
            detail: mel.description || 'MEL deadline',
            meta: `ATA ${mel.ata_chapter || '—'}`,
          });
        }
      });

      return events.sort((a, b) => a.date.localeCompare(b.date));
    },
    refetchInterval: 300000,
    staleTime: 240000,
  });
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function MaintenanceCalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState(new Date());
  const { data: events = [], isLoading, refetch } = useCalendarEvents();

  // Build grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDow   = monthStart.getDay(); // 0 = Sun

  const gridDays = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    gridDays.push({ date: new Date(monthStart.getFullYear(), monthStart.getMonth(), -i), other: true });
  }
  days.forEach(d => gridDays.push({ date: d, other: false }));
  const rem = 42 - gridDays.length;
  for (let i = 1; i <= rem; i++) {
    gridDays.push({ date: new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, i), other: true });
  }

  const selectedEvents = selectedDay
    ? events.filter(e => isSameDay(new Date(e.date), selectedDay))
    : [];

  // Upcoming 7-day summary
  const today = new Date();
  const in7  = new Date(today); in7.setDate(today.getDate() + 7);
  const upcoming = events.filter(e => {
    const d = new Date(e.date);
    return d >= today && d <= in7;
  });

  const aogCount    = events.filter(e => e.type === 'aog').length;
  const inspCount   = events.filter(e => e.type === 'inspection').length;
  const mxCount     = events.filter(e => e.type === 'heavy_mx').length;
  const melCount    = events.filter(e => e.type === 'mel_expiry').length;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'AOG Events',    value: aogCount,  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Inspections',   value: inspCount,  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Heavy MX',      value: mxCount,    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { label: 'MEL Deadlines', value: melCount,   color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl border px-3 py-2.5 text-center', bg)}>
            <p className={cn('text-2xl font-black', color)}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming 7 days alert strip */}
      {upcoming.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest mb-2">
            ⚡ Next 7 Days — {upcoming.length} event{upcoming.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {upcoming.slice(0, 6).map((evt, i) => {
              const cfg = TYPE_CFG[evt.type] || {};
              return (
                <span key={i} className={cn('flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border', cfg.badge)}>
                  {cfg.emoji} {evt.title} · {format(new Date(evt.date), 'MMM d')}
                </span>
              );
            })}
            {upcoming.length > 6 && (
              <span className="text-[10px] text-muted-foreground px-2 py-1">+{upcoming.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-card border border-border rounded-2xl p-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-black text-foreground">{format(currentMonth, 'MMMM yyyy')}</p>
            <p className="text-[10px] text-muted-foreground">{events.length} total events</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => refetch()} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-3.5 h-3.5 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
              className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-[10px] font-bold hover:bg-secondary/80">
              Today
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {Object.entries(TYPE_CFG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <EventDot type={key} pulse={key === 'aog'} />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <p key={d} className="text-[10px] font-bold text-muted-foreground text-center py-1 uppercase tracking-widest">{d}</p>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((g, i) => (
            <DayCell
              key={i}
              date={g.date}
              events={events}
              selectedDay={selectedDay}
              onSelect={setSelectedDay}
              otherMonth={g.other}
            />
          ))}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</h3>
            <Link to="/EngCalendar"
              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
              Full Calendar <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No events scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((evt, i) => {
                const cfg = TYPE_CFG[evt.type] || {};
                return (
                  <div key={i} className={cn('flex items-start gap-3 rounded-xl border px-3 py-2.5', cfg.badge)}>
                    <span className="text-base flex-shrink-0">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-foreground">{evt.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{evt.detail}</p>
                      {evt.meta && <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{evt.meta}</p>}
                    </div>
                    <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border self-start', cfg.badge)}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}