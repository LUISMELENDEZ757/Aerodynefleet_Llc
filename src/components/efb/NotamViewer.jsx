import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, Filter, ChevronDown, ChevronRight } from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

// Simulated NOTAM database
const SAMPLE_NOTAMS = {
  'KEWR': [
    { id: 'KEWR-A0021', type: 'RWY', priority: 'high', subject: 'RWY 4L/22R', text: 'RWY 4L/22R CLSD 0200-0600Z DLY FOR MAINT. MIRL INOP.', expires: '2026-03-25' },
    { id: 'KEWR-A0022', type: 'NAV', priority: 'medium', subject: 'ILS RWY 22L', text: 'ILS RWY 22L LOC LLZ U/S. GLIDEPATH NORMAL. EXPECT LOCALIZER APCH.', expires: '2026-03-22' },
    { id: 'KEWR-A0023', type: 'OBS', priority: 'low', subject: 'Crane', text: 'CRANE ERECTED 1.2NM NE OF ARPT 250FT AGL LGTD.', expires: '2026-04-01' },
    { id: 'KEWR-A0024', type: 'ADMIN', priority: 'low', subject: 'Customs', text: 'CUSTOMS AVBL 24HRS. PRIOR PPR REQUIRED FOR GA OPS 3HRS.', expires: '2026-06-01' },
  ],
  'KORD': [
    { id: 'KORD-A0011', type: 'TWY', priority: 'medium', subject: 'TWY L', text: 'TWY L BTN PAPA AND KILO CLSD TO AIR CARRIER ACFT OVER 80K LBS.', expires: '2026-03-28' },
    { id: 'KORD-A0012', type: 'RWY', priority: 'high', subject: 'RWY 10C/28C', text: 'RWY 10C/28C CLSD UNTIL FURTHER NOTICE FOR RECONFIGURATION.', expires: '2026-05-01' },
    { id: 'KORD-A0013', type: 'NAV', priority: 'low', subject: 'VOR', text: 'ORD VOR/DME OPR LIMITED. USE ALTERNATE NAVIGATION.', expires: '2026-03-21' },
  ],
  'KJFK': [
    { id: 'KJFK-A0031', type: 'RWY', priority: 'medium', subject: 'RWY 4L', text: 'RWY 4L THRESHOLD DSPLCD 1400FT. TODA/TORA UNAFFECTED.', expires: '2026-03-30' },
    { id: 'KJFK-A0032', type: 'OBS', priority: 'high', subject: 'Crane', text: 'TWO CRANES 330FT AGL W OF ARPT DURING TERMINAL CONSTRUCTION. LGTD.', expires: '2026-07-01' },
  ],
};

const PRIORITY_CONFIG = {
  high:   { color: 'text-destructive',      bg: 'bg-destructive/15',  label: 'HIGH',   icon: AlertTriangle },
  medium: { color: 'text-orange-400',       bg: 'bg-orange-500/15',   label: 'MED',    icon: AlertTriangle },
  low:    { color: 'text-muted-foreground', bg: 'bg-muted',           label: 'LOW',    icon: Info },
};

const TYPE_LABELS = { RWY: 'Runway', TWY: 'Taxiway', NAV: 'Navigation', OBS: 'Obstacle', ADMIN: 'Admin' };

function NotamCard({ notam }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PRIORITY_CONFIG[notam.priority];
  const Icon = cfg.icon;
  const isExpired = new Date(notam.expires) < new Date();

  return (
    <div className={cn('rounded-xl bg-card border overflow-hidden', isExpired ? 'border-border/30 opacity-50' : 'border-border')}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors">
        <div className="flex items-center gap-3">
          <span className={cn('flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded', cfg.bg, cfg.color)}>
            <Icon className="w-3 h-3" /> {cfg.label}
          </span>
          <div className="text-left">
            <p className="text-xs font-mono font-semibold text-foreground">{notam.id}</p>
            <p className="text-xs text-muted-foreground">{TYPE_LABELS[notam.type] || notam.type} · {notam.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpired && <span className="text-xs text-muted-foreground">Expired</span>}
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 bg-secondary/10">
          <p className="text-xs font-mono text-foreground bg-background/60 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">{notam.text}</p>
          <p className="text-xs text-muted-foreground mt-2">Expires: {notam.expires}</p>
        </div>
      )}
    </div>
  );
}

export default function NotamViewer() {
  const { data: flights = [] } = useQuery({
    queryKey: ['efb-flights-notam', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
  });

  const [filter, setFilter] = useState('all');

  // Get airports from today's flights + common stations
  const airports = React.useMemo(() => {
    const s = new Set(['KEWR', 'KORD', 'KJFK']);
    flights.forEach(f => { if (f.origin) s.add(f.origin); if (f.destination) s.add(f.destination); });
    return [...s].filter(a => SAMPLE_NOTAMS[a]);
  }, [flights]);

  const allNotams = airports.flatMap(icao =>
    (SAMPLE_NOTAMS[icao] || []).map(n => ({ ...n, airport: icao }))
  );

  const filtered = filter === 'all' ? allNotams : allNotams.filter(n => n.priority === filter);
  const high = allNotams.filter(n => n.priority === 'high').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {high > 0 && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm font-semibold text-destructive">{high} high-priority NOTAM{high > 1 ? 's' : ''} affecting today's flights</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'high', 'medium', 'low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all border capitalize',
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'
            )}>{f === 'all' ? `All (${allNotams.length})` : `${f} (${allNotams.filter(n => n.priority === f).length})`}</button>
        ))}
      </div>

      {/* NOTAMs by airport */}
      {airports.length === 0 ? (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Add flights to load relevant NOTAMs
        </div>
      ) : (
        airports.map(icao => {
          const airportNotams = filtered.filter(n => n.airport === icao);
          if (airportNotams.length === 0) return null;
          return (
            <div key={icao} className="space-y-2">
              <p className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">{icao}</p>
              {airportNotams.map(n => <NotamCard key={n.id} notam={n} />)}
            </div>
          );
        })
      )}
    </div>
  );
}