import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Plus, Search, Filter, Clock, Plane, ArrowRight, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const ENTRY_TYPES = ['IFR', 'VFR', 'Sim', 'Check', 'Training'];
const APPROACHES = ['ILS', 'RNAV', 'VOR', 'NDB', 'Visual', 'GLS'];

function LogbookEntryRow({ entry }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Plane className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono font-bold text-foreground">{entry.flight_number || '—'}</span>
          <span className="text-xs text-muted-foreground">{entry.origin} <ArrowRight className="w-3 h-3 inline" /> {entry.destination}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">{entry.aircraft_type || '—'}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{entry.flight_date}</span>
          {entry.flight_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.flight_time}h</span>}
          {entry.approach_type && <span className="text-primary font-semibold">{entry.approach_type}</span>}
        </div>
      </div>
      {entry.landings > 0 && (
        <span className="text-xs font-bold text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />{entry.landings} ldg
        </span>
      )}
    </div>
  );
}

function AddEntryModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    flight_date: new Date().toISOString().split('T')[0],
    flight_number: '', origin: '', destination: '',
    aircraft_type: 'B737-800', aircraft_tail: '',
    flight_time: '', night_time: '', instrument_time: '',
    approach_type: '', landings: 1,
    pic: false, sic: false, notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">New Logbook Entry</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Date', key: 'flight_date', type: 'date' },
              { label: 'Flight #', key: 'flight_number', type: 'text', placeholder: 'AAL4474' },
              { label: 'Origin', key: 'origin', type: 'text', placeholder: 'KEWR' },
              { label: 'Destination', key: 'destination', type: 'text', placeholder: 'KORD' },
              { label: 'Aircraft Type', key: 'aircraft_type', type: 'text', placeholder: 'B737-800' },
              { label: 'Tail #', key: 'aircraft_tail', type: 'text', placeholder: 'N455GJ' },
              { label: 'Flight Time (hrs)', key: 'flight_time', type: 'number', placeholder: '2.5' },
              { label: 'Night Time (hrs)', key: 'night_time', type: 'number', placeholder: '0.0' },
              { label: 'Instrument (hrs)', key: 'instrument_time', type: 'number', placeholder: '0.0' },
              { label: 'Landings', key: 'landings', type: 'number', placeholder: '1' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Approach Type</label>
            <div className="flex gap-2 flex-wrap">
              {APPROACHES.map(a => (
                <button key={a} onClick={() => set('approach_type', form.approach_type === a ? '' : a)}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                    form.approach_type === a ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  )}>{a}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => onSave(form)}
              className="flex-1 h-10 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors">
              Save Entry
            </button>
            <button onClick={onClose}
              className="flex-1 h-10 bg-secondary text-foreground font-semibold text-sm rounded-lg hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Logbook() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  // Use Flight entity as logbook source (read-only view)
  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['logbook-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 100),
  });

  const [localEntries, setLocalEntries] = useState([]);

  const allEntries = [
    ...localEntries,
    ...flights.map(f => ({
      id: f.id,
      flight_date: f.flight_date,
      flight_number: f.flight_number,
      origin: f.origin,
      destination: f.destination,
      aircraft_type: f.aircraft_type,
      aircraft_tail: f.aircraft_tail,
      flight_time: null,
      landings: 1,
      approach_type: null,
    }))
  ];

  const filtered = allEntries.filter(e =>
    !search ||
    e.flight_number?.toLowerCase().includes(search.toLowerCase()) ||
    e.origin?.toLowerCase().includes(search.toLowerCase()) ||
    e.destination?.toLowerCase().includes(search.toLowerCase())
  );

  const totalHours = localEntries.reduce((sum, e) => sum + (Number(e.flight_time) || 0), 0);
  const totalLandings = allEntries.reduce((sum, e) => sum + (Number(e.landings) || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {showAdd && (
        <AddEntryModal
          onClose={() => setShowAdd(false)}
          onSave={(entry) => { setLocalEntries(p => [{ ...entry, id: Date.now() }, ...p]); setShowAdd(false); }}
        />
      )}

      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
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
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 h-9 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Entry
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Flights', value: allEntries.length },
            { label: 'Logged Hours', value: totalHours.toFixed(1) },
            { label: 'Total Landings', value: totalLandings },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-card border border-border px-3 py-3 text-center">
              <p className="text-xl font-extrabold font-mono text-primary">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by flight, airport..."
            className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Entries */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Flight Log</p>
            <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
          </div>
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No entries found</div>
          ) : (
            filtered.map(entry => <LogbookEntryRow key={entry.id} entry={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}