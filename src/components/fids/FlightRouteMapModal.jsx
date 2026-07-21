import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, fmtZulu, derivePhase } from './fidsModel';

// Live route map for a clicked board flight — track polyline + current position via AeroAPI
export default function FlightRouteMapModal({ flight, onClose }) {
  const cfg = STATUS_COLORS[flight.status] || STATUS_COLORS['ON TIME'];

  const { data, isLoading } = useQuery({
    queryKey: ['flight-track', flight.fa_id || flight.flight_number],
    queryFn: async () => {
      const res = await base44.functions.invoke('flightAwareSearch', {
        type: 'flight_track',
        ident: flight.fa_id || flight.flight_number,
      });
      return res.data;
    },
  });

  const rawPositions = (data?.track?.positions || [])
    .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
  const positions = rawPositions.map(p => [p.latitude, p.longitude]);

  const lastPos = rawPositions.length ? rawPositions[rawPositions.length - 1] : null;
  const current = lastPos ? [lastPos.latitude, lastPos.longitude] : null;
  const center = current || positions[0] || [40.69, -74.17];
  const phase = derivePhase(lastPos);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-mono font-extrabold text-lg text-foreground">{flight.flight_number}</span>
            <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
              {flight.origin} <ArrowRight className="w-3.5 h-3.5" /> {flight.destination}
            </span>
            <span className={cn('text-[10px] font-extrabold px-2 py-1 rounded-md border border-current/20', cfg.color, cfg.bg)}>
              {flight.status}
            </span>
            {phase && (
              <span className="text-[10px] font-extrabold px-2 py-1 rounded-md border" style={{ color: phase.color, borderColor: `${phase.color}55`, background: `${phase.color}18` }}>
                ✈ {phase.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-3 text-xs font-mono text-muted-foreground">
              <span>{flight.type === 'departure' ? 'STD' : 'STA'} <b className="text-foreground">{fmtZulu(flight.scheduled)}</b></span>
              <span>{flight.type === 'departure' ? 'ETD' : 'ETA'} <b className="text-foreground">{fmtZulu(flight.estimated)}</b></span>
              <span>GATE <b className="text-foreground">{flight.gate}</b></span>
              <span className="hidden sm:inline">A/C <b className="text-foreground">{flight.aircraft_type}</b> {flight.tail_number !== '—' && `· ${flight.tail_number}`}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="h-[420px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-background">
              Loading flight track…
            </div>
          ) : positions.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-background px-6 text-center">
              No live position data yet — the aircraft hasn't departed or track data is unavailable for {flight.flight_number}.
            </div>
          ) : (
            <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} className="z-0">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap &copy; CARTO"
              />
              <Polyline positions={positions} pathOptions={{ color: '#f5c542', weight: 2.5, opacity: 0.85 }} />
              {/* Origin point */}
              <CircleMarker center={positions[0]} radius={6} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.9 }}>
                <Tooltip>{flight.origin} · Departure</Tooltip>
              </CircleMarker>
              {/* Current position */}
              {current && (
                <CircleMarker center={current} radius={8} pathOptions={{ color: phase?.color || '#38bdf8', fillColor: phase?.color || '#38bdf8', fillOpacity: 1 }}>
                  <Tooltip permanent direction="top">
                    {flight.flight_number} · {phase ? phase.label : 'current position'}
                  </Tooltip>
                </CircleMarker>
              )}
            </MapContainer>
          )}
          {/* Live telemetry strip */}
          {lastPos && (
            <div className="absolute bottom-2 left-2 right-2 z-[500] flex items-center gap-4 flex-wrap bg-card/90 backdrop-blur border border-border rounded-xl px-4 py-2 text-xs font-mono">
              <span className="font-extrabold" style={{ color: phase?.color }}>{phase?.detail}</span>
              <span className="text-muted-foreground">ALT <b className="text-foreground">{((lastPos.altitude || 0) * 100).toLocaleString()} ft</b></span>
              <span className="text-muted-foreground">GS <b className="text-foreground">{lastPos.groundspeed ?? '—'} kts</b></span>
              {typeof lastPos.heading === 'number' && <span className="text-muted-foreground">HDG <b className="text-foreground">{String(lastPos.heading).padStart(3, '0')}°</b></span>}
              {lastPos.timestamp && <span className="text-muted-foreground ml-auto">as of {fmtZulu(lastPos.timestamp)}Z</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}