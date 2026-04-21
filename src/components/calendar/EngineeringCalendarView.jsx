import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, addMonths, subMonths, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

function EventDot({ type }) {
  const colors = {
    grounding: 'bg-red-500',
    mel_expiry: 'bg-orange-500',
    heavy_mx: 'bg-blue-500',
  };
  return <div className={cn('w-1.5 h-1.5 rounded-full', colors[type] || 'bg-gray-500')} />;
}

function DayCell({ date, events, onSelectDay, selectedDay, isOtherMonth }) {
  const isSelected = selectedDay && isSameDay(date, selectedDay);
  const isToday = isSameDay(date, new Date());
  const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));

  return (
    <button
      onClick={() => onSelectDay(date)}
      className={cn(
        'min-h-20 p-2 border rounded-lg transition-all text-left',
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
        isToday ? 'ring-2 ring-primary ring-inset' : '',
        isOtherMonth ? 'opacity-40' : ''
      )}
    >
      <p className={cn('text-xs font-bold mb-1.5', isToday ? 'text-primary' : 'text-muted-foreground')}>
        {format(date, 'd')}
      </p>
      <div className="space-y-0.5">
        {dayEvents.slice(0, 3).map((evt, i) => (
          <div key={i} className="flex items-center gap-1 min-w-0">
            <EventDot type={evt.type} />
            <p className="text-[10px] text-foreground truncate font-semibold">{evt.title}</p>
          </div>
        ))}
        {dayEvents.length > 3 && <p className="text-[9px] text-muted-foreground">+{dayEvents.length - 3} more</p>}
      </div>
    </button>
  );
}

export default function EngineeringCalendarView({ events = [], onEventClick, onRefetch, isLoading }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDate = monthStart.getDay() === 0 ? subMonths(monthStart, 1) : monthStart;
  const firstDay = startDate.getDay();

  const gridDays = [];
  // Add days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    gridDays.push({ date: new Date(monthStart.getFullYear(), monthStart.getMonth(), -(i)), isOtherMonth: true });
  }
  // Add days from current month
  days.forEach(day => {
    gridDays.push({ date: day, isOtherMonth: false });
  });
  // Add days from next month
  const remaining = 42 - gridDays.length;
  for (let i = 1; i <= remaining; i++) {
    gridDays.push({ date: new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 1, i), isOtherMonth: true });
  }

  const selectedDayEvents = selectedDay ? events.filter(e => isSameDay(new Date(e.date), selectedDay)) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">{format(currentMonth, 'MMMM yyyy')}</h2>
          <p className="text-xs text-muted-foreground mt-1">{events.length} events scheduled</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80">
            Today
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
          {onRefetch && (
            <button onClick={onRefetch}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={`w-4 h-4 text-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <EventDot type="heavy_mx" />
          <span className="text-muted-foreground">Heavy Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <EventDot type="grounding" />
          <span className="text-muted-foreground">Aircraft Grounding</span>
        </div>
        <div className="flex items-center gap-2">
          <EventDot type="mel_expiry" />
          <span className="text-muted-foreground">MEL Deadline</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-3">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <p key={day} className="text-xs font-bold text-muted-foreground text-center py-2 uppercase tracking-widest">
              {day}
            </p>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-2">
          {gridDays.map((day, i) => (
            <DayCell
              key={i}
              date={day.date}
              events={events}
              onSelectDay={setSelectedDay}
              selectedDay={selectedDay}
              isOtherMonth={day.isOtherMonth}
            />
          ))}
        </div>
      </div>

      {/* Selected Day Sidebar */}
      {selectedDay && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-foreground">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No events scheduled</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((evt, i) => (
                <button
                  key={i}
                  onClick={() => onEventClick?.(evt)}
                  className="w-full text-left bg-secondary/50 border border-border rounded-lg p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <EventDot type={evt.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{evt.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{evt.detail}</p>
                      {evt.meta && <p className="text-[10px] text-muted-foreground mt-1 font-mono">{evt.meta}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}