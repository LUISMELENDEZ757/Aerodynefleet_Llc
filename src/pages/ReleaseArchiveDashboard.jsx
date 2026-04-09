import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, Archive, Clock, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TABS = [
  { id: 'all', label: 'All Events' },
  { id: 'released', label: 'Released Handovers' },
  { id: 'oos', label: 'Out of Service Events' },
];

function EventCard({ event, type }) {
  const isReleased = type === 'released';
  const isOOS = type === 'oos';
  const timestamp = isReleased 
    ? event.shift_end_time || event.created_date
    : event.created_date || event.timestamp;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', 
            isReleased ? 'bg-green-500/20' : 'bg-red-500/20'
          )}>
            {isReleased ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {isReleased ? `${event.shift_period?.toUpperCase() || 'Shift'} Handover` : 'Out of Service Event'}
            </p>
            {isReleased && (
              <p className="text-xs text-muted-foreground">
                {event.submitted_by} • {event.submitted_by_cert || '—'}
              </p>
            )}
            {isOOS && (
              <p className="text-xs text-muted-foreground">
                {event.tail_number || '—'} • {event.work_description?.substring(0, 40)}...
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {isReleased ? 'RELEASED' : 'LOGGED'}
          </p>
          <p className="text-xs text-foreground font-mono font-bold">
            {format(new Date(timestamp), 'MMM d, yyyy')}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(timestamp), 'HH:mm:ss')}
          </p>
        </div>
      </div>

      {isReleased && event.safety_critical_notes && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 font-bold">{event.safety_critical_notes}</p>
        </div>
      )}

      {isReleased && event.pending_issues?.length > 0 && (
        <p className="text-xs text-amber-400">
          📋 {event.pending_issues.length} pending issue{event.pending_issues.length !== 1 ? 's' : ''}
        </p>
      )}

      {isOOS && event.station && (
        <p className="text-xs text-cyan-400">📍 Station: {event.station}</p>
      )}
    </div>
  );
}

export default function ReleaseArchiveDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data: handovers = [] } = useQuery({
    queryKey: ['release-archive-handovers'],
    queryFn: () => base44.entities.ShiftHandover.filter({ status: 'acknowledged' }, '-shift_end_time', 500),
    refetchInterval: 60000,
  });

  const { data: oosEntries = [] } = useQuery({
    queryKey: ['release-archive-oos'],
    queryFn: () => base44.entities.OOSEntry.filter({ status: 'released' }, '-created_date', 500),
    refetchInterval: 60000,
  });

  const filteredHandovers = handovers.filter(h =>
    !search || 
    h.submitted_by?.toLowerCase().includes(search.toLowerCase()) ||
    h.shift_date?.includes(search)
  );

  const filteredOOS = oosEntries.filter(e =>
    !search ||
    e.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
    e.station?.toLowerCase().includes(search.toLowerCase())
  );

  const allEvents = [
    ...filteredHandovers.map(h => ({ ...h, _type: 'released' })),
    ...filteredOOS.map(e => ({ ...e, _type: 'oos' })),
  ].sort((a, b) => {
    const timeA = new Date(a.shift_end_time || a.created_date);
    const timeB = new Date(b.shift_end_time || b.created_date);
    return timeB - timeA;
  });

  const displayEvents = 
    activeTab === 'released' ? filteredHandovers.map(h => ({ ...h, _type: 'released' })) :
    activeTab === 'oos' ? filteredOOS.map(e => ({ ...e, _type: 'oos' })) :
    allEvents;

  const totalReleased = handovers.length;
  const totalOOS = oosEntries.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/MaintenanceControl" className="w-9 h-9 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Archive className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Release Archive</h1>
            <p className="text-xs text-muted-foreground">Released history &amp; OOS event timeline</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-2xl font-black text-green-400">{totalReleased}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Released Handovers</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-2xl font-black text-red-400">{totalOOS}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">OOS Events</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 col-span-2 sm:col-span-1">
            <p className="text-2xl font-black text-primary">{displayEvents.length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Total Archived</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, tail, station, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {displayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Archive className="w-16 h-16 text-muted-foreground/30" />
              <p className="text-muted-foreground font-bold">No archived events found</p>
            </div>
          ) : (
            displayEvents.map((event) => (
              <EventCard key={event.id} event={event} type={event._type} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}