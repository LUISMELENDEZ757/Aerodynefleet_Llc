import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Shield, User, Clock, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import FAR117Modal from '@/components/crew/FAR117Modal';

const ROLE_LABEL = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

const LEGAL_CFG = {
  legal:      { label: 'Legal',      color: 'text-green-400',   bg: 'bg-green-500/15',   dot: 'bg-green-400' },
  near_limit: { label: 'Near Limit', color: 'text-orange-400',  bg: 'bg-orange-500/15',  dot: 'bg-orange-400' },
  illegal:    { label: 'VIOLATION',  color: 'text-destructive', bg: 'bg-destructive/15', dot: 'bg-destructive' },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CrewCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [showFAR117, setShowFAR117] = useState(false);

  // Fetch all assignments for the visible month
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`;

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['crew-calendar', year, month],
    queryFn: () => base44.entities.CrewAssignment.list(),
    select: (data) => data.filter(a => a.flight_date >= monthStart && a.flight_date <= monthEnd),
  });

  const { data: selectedDayAssignments = [] } = useQuery({
    queryKey: ['crew-day', selectedDate],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: selectedDate }),
  });

  // Build a set of dates that have assignments
  const datesWithAssignments = new Map();
  allAssignments.forEach(a => {
    if (!datesWithAssignments.has(a.flight_date)) datesWithAssignments.set(a.flight_date, []);
    datesWithAssignments.get(a.flight_date).push(a);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthLabel = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Compliance check for selected day
  const violations = selectedDayAssignments.filter(a => a.legal_status === 'illegal');
  const nearLimit  = selectedDayAssignments.filter(a => a.legal_status === 'near_limit');

  return (
    <div className="min-h-screen bg-background">
      <BackHeader title="Crew Calendar" subtitle={format(new Date(), 'MMMM yyyy')} />
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
            <User className="w-5 h-5 text-primary" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-wide">Crew Calendar</h1>
            <p className="text-xs font-mono text-primary tracking-widest uppercase">Flight Assignments · FAR 117</p>
          </div>
        </div>
        {/* FAR 117 Quick Action */}
        <button
          onClick={() => setShowFAR117(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Shield className="w-4 h-4" />
          FAR 117 Check
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Calendar */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/60">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <p className="text-sm font-bold text-foreground">{monthLabel}</p>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 border-r border-b border-border/30 last:border-r-0" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = formatDate(year, month, day);
              const isToday = dateStr === today.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              const dayAssignments = datesWithAssignments.get(dateStr) || [];
              const hasViolation = dayAssignments.some(a => a.legal_status === 'illegal');
              const hasNear = dayAssignments.some(a => a.legal_status === 'near_limit');

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'h-12 flex flex-col items-center justify-center border-r border-b border-border/30 transition-all relative',
                    isSelected ? 'bg-primary/20' : 'hover:bg-secondary/50',
                    (day + firstDay - 1) % 7 === 6 && 'border-r-0'
                  )}
                >
                  <span className={cn(
                    'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',
                    isToday && !isSelected && 'border border-primary text-primary',
                    isSelected && 'bg-primary text-primary-foreground',
                    !isToday && !isSelected && 'text-foreground'
                  )}>{day}</span>
                  {dayAssignments.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full',
                        hasViolation ? 'bg-destructive' : hasNear ? 'bg-orange-400' : 'bg-green-400'
                      )} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day assignments */}
        <div>
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {selectedDayAssignments.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No crew assignments for this day
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayAssignments.map(a => {
                const legal = LEGAL_CFG[a.legal_status] || LEGAL_CFG.legal;
                return (
                  <div key={a.id} className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{a.crew_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABEL[a.role] || a.role}
                            {a.flight_number && <span className="ml-1.5 font-mono text-foreground">{a.flight_number}</span>}
                          </p>
                        </div>
                      </div>
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', legal.bg, legal.color)}>
                        {legal.label}
                      </span>
                    </div>

                    {(a.duty_start || a.duty_end || a.rest_hours_prior != null || a.total_flight_time_today != null) && (
                      <div className="border-t border-border/50 px-4 pb-3 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {a.duty_start && (
                          <div className="bg-background/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Duty Start</p>
                            <p className="text-sm font-mono font-bold text-foreground">{a.duty_start}Z</p>
                          </div>
                        )}
                        {a.duty_end && (
                          <div className="bg-background/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Duty End</p>
                            <p className="text-sm font-mono font-bold text-foreground">{a.duty_end}Z</p>
                          </div>
                        )}
                        {a.rest_hours_prior != null && (
                          <div className={cn('rounded-lg px-3 py-2', a.rest_hours_prior < 10 ? 'bg-destructive/10' : 'bg-background/40')}>
                            <p className="text-xs text-muted-foreground">Rest Prior</p>
                            <p className={cn('text-sm font-mono font-bold', a.rest_hours_prior < 10 ? 'text-destructive' : 'text-foreground')}>{a.rest_hours_prior}h</p>
                          </div>
                        )}
                        {a.total_flight_time_today != null && (
                          <div className={cn('rounded-lg px-3 py-2', a.total_flight_time_today > 8 ? 'bg-destructive/10' : 'bg-background/40')}>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Plane className="w-3 h-3" /> Flt Time</p>
                            <p className={cn('text-sm font-mono font-bold', a.total_flight_time_today > 8 ? 'text-destructive' : 'text-foreground')}>{a.total_flight_time_today}h</p>
                          </div>
                        )}
                      </div>
                    )}

                    {a.notes && (
                      <p className="px-4 pb-3 text-xs text-muted-foreground">{a.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily compliance summary */}
        {selectedDayAssignments.length > 0 && (
          <div className={cn(
            'rounded-xl border px-4 py-3 flex items-center gap-3',
            violations.length > 0 ? 'bg-destructive/10 border-destructive/30' :
            nearLimit.length > 0  ? 'bg-orange-500/10 border-orange-500/30' :
            'bg-green-500/10 border-green-500/30'
          )}>
            <Shield className={cn('w-5 h-5 flex-shrink-0',
              violations.length > 0 ? 'text-destructive' :
              nearLimit.length > 0  ? 'text-orange-400' : 'text-green-400'
            )} />
            <div>
              <p className={cn('text-sm font-bold',
                violations.length > 0 ? 'text-destructive' :
                nearLimit.length > 0  ? 'text-orange-400' : 'text-green-400'
              )}>
                {violations.length > 0
                  ? `${violations.length} FAR 117 Violation${violations.length > 1 ? 's' : ''} — Immediate Action Required`
                  : nearLimit.length > 0
                  ? `${nearLimit.length} Crew Member${nearLimit.length > 1 ? 's' : ''} Near Limit`
                  : 'All Crew — FAR 117 Compliant'}
              </p>
              <p className="text-xs text-muted-foreground">{selectedDayAssignments.length} assignment{selectedDayAssignments.length > 1 ? 's' : ''} on this date</p>
            </div>
          </div>
        )}
      </div>

      {showFAR117 && (
        <FAR117Modal
          assignments={selectedDayAssignments}
          date={selectedDate}
          onClose={() => setShowFAR117(false)}
        />
      )}
    </div>
  );
}