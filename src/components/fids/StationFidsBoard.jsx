import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Radar, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import FidsRow from './FidsRow';
import FlightRouteMapModal from './FlightRouteMapModal';
import { normalizeFlight } from './fidsModel';

// Compact live FIDS board embedded in the Station Dashboard — powered by AeroAPI
export default function StationFidsBoard({ icao }) {
  const [mode, setMode] = useState('departures');
  const [selectedFlight, setSelectedFlight] = useState(null);

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['fids-board', icao],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareSearch', { type: 'airport_board', airport: icao });
      return res.data;
    },
    enabled: !!icao && icao.length >= 3,
    refetchInterval: 60000,
  });

  const now = Date.now();
  const rows = (mode === 'departures' ? (data?.departures || []) : (data?.arrivals || []))
    .map(f => normalizeFlight(f, mode === 'departures' ? 'departure' : 'arrival', now))
    .sort((a, b) => (a.scheduled || '').localeCompare(b.scheduled || ''))
    .slice(0, 12);

  const updated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-extrabold text-white text-sm flex items-center gap-2">
            <Radar className="w-4 h-4 text-primary" /> Live Flight Board · {icao}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            AeroAPI live data
            {updated && ` · updated ${String(updated.getUTCHours()).padStart(2, '0')}:${String(updated.getUTCMinutes()).padStart(2, '0')}Z`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {['departures', 'arrivals'].map(mo => (
            <button key={mo} onClick={() => setMode(mo)}
              className={cn('h-8 px-3 rounded-lg text-[10px] font-extrabold uppercase border transition-colors',
                mode === mo ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-white/10 text-gray-400 hover:text-white')}>
              {mo}
            </button>
          ))}
          <button onClick={() => refetch()} title="Refresh"
            className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          </button>
          <Link to={`/FlightBoard?icao=${icao}`} title="Open full board"
            className="h-8 px-3 rounded-lg border border-primary/30 bg-primary/10 flex items-center gap-1.5 text-[10px] font-extrabold text-primary hover:bg-primary/20 transition-colors">
            FULL BOARD <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-center text-gray-600 text-sm py-8">Loading live {icao} flights…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-600 text-sm py-8">No live {mode} for {icao}</p>
        ) : (
          rows.map(f => <FidsRow key={`${f.type}-${f.id}`} flight={f} onClick={() => setSelectedFlight(f)} />)
        )}
      </div>
      {selectedFlight && (
        <FlightRouteMapModal flight={selectedFlight} onClose={() => setSelectedFlight(null)} />
      )}
    </div>
  );
}