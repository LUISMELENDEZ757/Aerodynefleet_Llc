import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useFlightHistory } from './hooks/useFlightHistory';
import FlightHistoryList from './components/FlightHistoryList';
import FlightHistoryDetail from './components/FlightHistoryDetail';
import AddEntryModal from './components/AddEntryModal';

export default function Logbook() {
  const { filtered, isLoading, search, setSearch, addEntry, totals } = useFlightHistory();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <BookMarked className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">LOGBOOK</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Flight Hours · Approaches · Currency</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 h-9 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> New Entry
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div className="flex gap-0 border-b border-border bg-card flex-shrink-0">
        {[
          { label: 'Flights', value: totals.flights },
          { label: 'Hours',   value: totals.hours.toFixed(1) },
          { label: 'Night',   value: totals.night.toFixed(1) },
          { label: 'IFR',     value: totals.ifr.toFixed(1) },
          { label: 'Ldgs',    value: totals.landings },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 px-2 py-3 text-center border-r border-border last:border-0">
            <p className="text-sm font-extrabold font-mono text-primary">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search flight, airport, aircraft…"
            className="w-full h-9 bg-secondary border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Body — split view on desktop */}
      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        <div className={cn(
          'flex flex-col overflow-y-auto border-r border-border',
          selected ? 'hidden sm:flex sm:w-72 lg:w-80 flex-shrink-0' : 'flex-1'
        )}>
          <div className="px-4 py-2 bg-secondary/40 border-b border-border flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Flight Log</p>
            <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
          </div>
          <FlightHistoryList
            entries={filtered}
            selectedId={selected?.id}
            onSelect={setSelected}
            isLoading={isLoading}
          />
        </div>

        {/* Detail panel */}
        {(selected || true) && (
          <div className={cn(
            'flex-1 overflow-y-auto',
            !selected && 'hidden sm:flex sm:items-center sm:justify-center'
          )}>
            <FlightHistoryDetail
              entry={selected}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {showAdd && (
        <AddEntryModal
          onClose={() => setShowAdd(false)}
          onSave={(entry) => { addEntry(entry); setShowAdd(false); }}
        />
      )}
    </div>
  );
}