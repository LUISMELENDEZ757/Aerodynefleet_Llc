import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Plus, Loader2, MoreHorizontal, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import EventCard from '@/components/oos/EventCard';
import PartCard from '@/components/oos/PartCard';
import AddEventDialog from '@/components/oos/AddEventDialog';
import AddPartDialog from '@/components/oos/AddPartDialog';
import BackHeader from '@/components/layout/BackHeader';

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

export default function OOSDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const queryClient = useQueryClient();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);

  const { data: entry, isLoading: loadingEntry } = useQuery({
    queryKey: ['oos-entry', id],
    queryFn: () => base44.entities.OOSEntry.filter({ id }),
    select: (data) => data[0],
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['timeline-events', id],
    queryFn: () => base44.entities.TimelineEvent.filter({ oos_entry_id: id }, 'event_time'),
    enabled: !!id,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['parts', id],
    queryFn: () => base44.entities.Part.filter({ oos_entry_id: id }),
    enabled: !!id,
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.TimelineEvent.create({ ...data, oos_entry_id: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline-events', id] }),
  });

  const createPartMutation = useMutation({
    mutationFn: (data) => base44.entities.Part.create({ ...data, oos_entry_id: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parts', id] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => base44.entities.OOSEntry.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['oos-entry', id] }),
  });

  const elapsed = useMemo(() => entry ? getElapsed(entry.oos_date, entry.oos_time) : '--:--', [entry]);

  if (loadingEntry) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Entry not found</p>
        <Link to="/Dashboard" className="text-primary text-sm mt-2 block">Go back</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <Link to="/Dashboard" className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate('in_work')}>
                Mark In Work
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate('waiting_on_parts')}>
                Mark Waiting on Parts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate('released')}>
                <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-400" />
                Release Aircraft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-primary">{entry.aircraft_type}</span>
              <span className="text-xl font-bold text-foreground">{entry.tail_number}</span>
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
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-lg font-mono font-bold text-primary">{elapsed}</span>
          </div>
        </div>

        <h2 className="text-base font-bold text-foreground mb-2">{entry.work_description}</h2>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>OOS {entry.oos_date ? new Date(entry.oos_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '--'} {entry.oos_time || ''}</span>
          {entry.logpage_number && (
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{entry.logpage_number}</span>
          )}
          {entry.delay_category && <span>{entry.delay_category}</span>}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="w-full justify-start bg-card border-b border-border rounded-none h-10 px-4">
          <TabsTrigger value="timeline" className="text-xs data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="parts" className="text-xs data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Parts
          </TabsTrigger>
          <TabsTrigger value="release" className="text-xs data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Release
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="p-4 mt-0">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No events yet</p>
          ) : (
            <div>
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
          <Button
            onClick={() => setShowAddEvent(true)}
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Event
          </Button>
        </TabsContent>

        <TabsContent value="parts" className="p-4 mt-0">
          {parts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No parts tracked</p>
          ) : (
            <div className="space-y-3">
              {parts.map(part => (
                <PartCard key={part.id} part={part} />
              ))}
            </div>
          )}
          <Button
            onClick={() => setShowAddPart(true)}
            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Part
          </Button>
        </TabsContent>

        <TabsContent value="release" className="p-4 mt-0">
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            {entry.status === 'released' ? (
              <div>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Aircraft Released</h3>
                <p className="text-sm text-muted-foreground">This aircraft has been released to service.</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  When all work is complete and signed off, release the aircraft.
                </p>
                <Button
                  onClick={() => updateStatusMutation.mutate('released')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Release Aircraft
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddEventDialog
        open={showAddEvent}
        onOpenChange={setShowAddEvent}
        onSave={(data) => createEventMutation.mutate(data)}
      />
      <AddPartDialog
        open={showAddPart}
        onOpenChange={setShowAddPart}
        onSave={(data) => createPartMutation.mutate(data)}
      />
    </div>
  );
}