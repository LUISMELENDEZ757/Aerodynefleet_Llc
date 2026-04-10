import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, Calendar, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = ['events', 'inspections', 'components', 'history'];

export default function AircraftMaintenanceTracking() {
  const [activeTab, setActiveTab] = useState('events');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['mt-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['mt-events', selectedAircraft],
    queryFn: () => base44.entities.MaintenanceEvent.filter({ aircraft_tail: selectedAircraft }),
    enabled: !!selectedAircraft,
    refetchInterval: 30000,
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['mt-inspections', selectedAircraft],
    queryFn: () => base44.entities.ScheduledInspection.filter({ aircraft_tail: selectedAircraft }),
    enabled: !!selectedAircraft,
    refetchInterval: 30000,
  });

  const { data: components = [] } = useQuery({
    queryKey: ['mt-components', selectedAircraft],
    queryFn: () => base44.entities.ComponentLifecycle.filter({ aircraft_tail: selectedAircraft }),
    enabled: !!selectedAircraft,
    refetchInterval: 60000,
  });

  const overdueMaint = events.filter(e => e.status === 'in_progress').length;
  const upcomingInspections = inspections.filter(i => i.status === 'scheduled').length;
  const overdueComponents = components.filter(c => c.status === 'due_for_overhaul' || c.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Aircraft Maintenance Tracking</h1>
              <p className="text-xs text-muted-foreground">Log events · Schedule inspections · Track components</p>
            </div>
          </div>
        </div>

        {/* Aircraft selector */}
        <select
          value={selectedAircraft}
          onChange={e => setSelectedAircraft(e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary mb-3"
        >
          <option value="">Select aircraft…</option>
          {aircraft.map(a => (
            <option key={a.id} value={a.tail_number}>
              {a.tail_number} — {a.aircraft_type}
            </option>
          ))}
        </select>

        {/* KPI Cards */}
        {selectedAircraft && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground">In Progress</p>
              <p className={cn('text-xl font-black', overdueMaint > 0 ? 'text-amber-400' : 'text-green-400')}>{overdueMaint}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Upcoming</p>
              <p className="text-xl font-black text-blue-400">{upcomingInspections}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Due for Overhaul</p>
              <p className={cn('text-xl font-black', overdueComponents > 0 ? 'text-red-400' : 'text-gray-500')}>{overdueComponents}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'events' && '📝 Events'}
              {tab === 'inspections' && '📅 Inspections'}
              {tab === 'components' && '⚙️ Components'}
              {tab === 'history' && '📋 History'}
            </button>
          ))}
        </div>
      </div>

      {!selectedAircraft ? (
        <div className="flex items-center justify-center py-20 text-center">
          <div className="space-y-3">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Select an aircraft to view maintenance tracking</p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4 max-w-4xl mx-auto">
          {/* Maintenance Events */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <button
                onClick={() => setShowEventForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" /> Log Maintenance Event
              </button>
              {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No maintenance events recorded</div>
              ) : (
                events.map(event => (
                  <div key={event.id} className="bg-card border border-border rounded-xl px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.event_type.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full',
                        event.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                      )}>{event.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      {event.completed_date && <span>📅 {event.completed_date}</span>}
                      {event.work_hours && <span>⏱️ {event.work_hours}h</span>}
                      {event.technician_name && <span>👤 {event.technician_name}</span>}
                      {event.cost && <span>💰 ${event.cost}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Scheduled Inspections */}
          {activeTab === 'inspections' && (
            <div className="space-y-3">
              <button
                onClick={() => setShowInspectionForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90"
              >
                <Calendar className="w-4 h-4" /> Schedule Inspection
              </button>
              {inspections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No inspections scheduled</div>
              ) : (
                inspections.map(insp => (
                  <div key={insp.id} className={cn('bg-card border rounded-xl px-4 py-3',
                    insp.status === 'overdue' ? 'border-red-500/40' : insp.status === 'scheduled' ? 'border-blue-500/40' : 'border-border'
                  )}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-foreground">{insp.title}</p>
                        <p className="text-xs text-muted-foreground">{insp.inspection_type.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full',
                        insp.status === 'overdue' ? 'bg-red-500/15 text-red-400' :
                        insp.status === 'in_progress' ? 'bg-amber-500/15 text-amber-400' :
                        insp.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'
                      )}>{insp.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      {insp.scheduled_date && <span>📅 Scheduled: {insp.scheduled_date}</span>}
                      {insp.due_date && <span>⏰ Due: {insp.due_date}</span>}
                      {insp.estimated_hours && <span>⏱️ Est. {insp.estimated_hours}h</span>}
                      {insp.assigned_technician && <span>👤 {insp.assigned_technician}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Component Lifecycle */}
          {activeTab === 'components' && (
            <div className="space-y-3">
              {components.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No components tracked</div>
              ) : (
                components.map(comp => (
                  <div key={comp.id} className={cn('bg-card border rounded-xl px-4 py-3',
                    comp.status === 'overdue' ? 'border-red-500/40' : comp.status === 'due_for_overhaul' ? 'border-amber-500/40' : 'border-border'
                  )}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-foreground">{comp.component_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{comp.part_number}</p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full',
                        comp.status === 'overdue' ? 'bg-red-500/15 text-red-400' :
                        comp.status === 'due_for_overhaul' ? 'bg-amber-500/15 text-amber-400' :
                        comp.status === 'under_maintenance' ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'
                      )}>{comp.status}</span>
                    </div>
                    {comp.overhaul_interval_hours && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Flight Hours: {comp.total_flight_hours}/{comp.overhaul_interval_hours}</span>
                          <span className="text-muted-foreground">{Math.round((comp.total_flight_hours / comp.overhaul_interval_hours) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (comp.total_flight_hours / comp.overhaul_interval_hours) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      {comp.total_flight_hours && <span>✈️ {comp.total_flight_hours}h</span>}
                      {comp.total_cycles && <span>🔄 {comp.total_cycles} cycles</span>}
                      {comp.last_overhaul_date && <span>🔧 Last: {comp.last_overhaul_date}</span>}
                      {comp.life_limited && <span>⚠️ Life-Limited</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-center py-12 text-muted-foreground">Maintenance history view coming soon</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}