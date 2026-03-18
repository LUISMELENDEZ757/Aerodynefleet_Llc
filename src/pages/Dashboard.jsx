import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StatusFilterBar from '@/components/oos/StatusFilterBar';
import OOSCard from '@/components/oos/OOSCard';

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['oos-entries'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date'),
  });

  const filteredEntries = entries.filter(entry => {
    const matchesFilter = activeFilter === 'all'
      ? entry.status !== 'released'
      : activeFilter === 'released'
        ? entry.status === 'released'
        : entry.status === activeFilter;

    const matchesSearch = !searchQuery ||
      entry.tail_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.work_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.station?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-foreground tracking-wide">Aerodyne Fleet LLC</h1>
        <p className="text-xs text-muted-foreground">Out of Service Tracker</p>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tail #, station, description..."
            className="pl-9 bg-secondary border-border text-sm h-9"
          />
        </div>
      </div>

      {/* Filters */}
      <StatusFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 pb-3">
        <span className="text-xs text-muted-foreground">
          {filteredEntries.length} {activeFilter === 'all' ? 'open' : ''} entries
        </span>
        <span className="text-xs text-muted-foreground">
          Today · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">No entries found</p>
        </div>
      ) : (
        <div>
          {filteredEntries.map(entry => (
            <OOSCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}