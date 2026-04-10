import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Airport coordinates (ICAO → [lat, lng])
const AIRPORT_COORDS = {
  KEWR: [40.6895, -74.1745], KJFK: [40.6413, -73.7781], KLAX: [33.9425, -118.4081],
  KORD: [41.8742, -87.6233], KDFW: [32.8975, -97.0382], KATL: [33.6407, -84.4277],
  KMIA: [25.7959, -80.2870], KSFO: [37.6213, -122.3790], KBOS: [42.3656, -71.0096],
  KDEN: [39.8561, -104.6737], KSEA: [47.4502, -122.3088], KPHX: [33.4342, -112.0116],
  EGLL: [51.4700, -0.4543], EDDF: [50.0379, 8.5622], LFPG: [49.0097, 2.5479],
  LEMD: [40.4168, -3.6038], OMDB: [25.2532, 55.3657], RJTT: [35.5494, 139.7798],
};

// Custom aircraft icon
const aircraftIcon = L.divIcon({
  html: `<div style="font-size: 24px; transform: rotate(45deg);">✈️</div>`,
  iconSize: [24, 24],
  className: 'aircraft-marker',
});

const airportIcon = L.divIcon({
  html: `<div style="font-size: 18px;">✈</div>`,
  iconSize: [18, 18],
  className: 'airport-marker',
});

export default function LiveAircraftMap({ flights = [] }) {
  const [center, setCenter] = useState([39.8282, -98.5795]);
  const [zoom, setZoom] = useState(4);
  const [aircraftPositions, setAircraftPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState(null);

  // Fetch real FlightAware positions
  useEffect(() => {
    const fetchPositions = async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke('flightAwarePositions', {});
        setAircraftPositions(res.data?.aircraft || []);
      } catch (e) {
        console.error('Failed to fetch positions:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Get unique airlines
  const airlines = [...new Set(aircraftPositions.map(a => a.airline).filter(Boolean))].sort();

  // Apply airline filter
  const filteredAircraft = selectedAirline
    ? aircraftPositions.filter(a => a.airline === selectedAirline)
    : aircraftPositions;

  // Filter unique airports
  const airportsToShow = new Set();
  filteredAircraft.forEach(a => {
    if (a.origin) airportsToShow.add(a.origin);
    if (a.destination) airportsToShow.add(a.destination);
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-full bg-background flex flex-col">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50 flex-shrink-0 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0">Airline:</span>
        <button
          onClick={() => setSelectedAirline(null)}
          className={cn(
            'text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0',
            !selectedAirline
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
          )}
        >
          Select Airline
        </button>
        {airlines.map(airline => (
          <button
            key={airline}
            onClick={() => setSelectedAirline(airline)}
            className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex-shrink-0',
              selectedAirline === airline
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {airline}
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">{filteredAircraft.length} aircraft</span>
      </div>

      <div className="flex-1">
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Airport markers */}
        {[...airportsToShow].map(icao => {
          const coords = AIRPORT_COORDS[icao];
          if (!coords) return null;
          return (
            <Marker key={`airport-${icao}`} position={coords} icon={airportIcon}>
              <Popup>{icao}</Popup>
            </Marker>
          );
        })}

        {/* Aircraft from FlightAware */}
        {filteredAircraft.map(aircraft => {
          if (!aircraft.latitude || !aircraft.longitude) return null;
          const originCoords = AIRPORT_COORDS[aircraft.origin];
          const destCoords = AIRPORT_COORDS[aircraft.destination];

          return (
            <div key={aircraft.id}>
              {/* Flight path */}
              {originCoords && destCoords && (
                <Polyline
                  positions={[originCoords, destCoords]}
                  color="#3b82f6"
                  weight={2}
                  opacity={0.4}
                  dashArray="5, 5"
                />
              )}

              {/* Aircraft marker */}
              <CircleMarker
                center={[aircraft.latitude, aircraft.longitude]}
                radius={8}
                fill
                fillColor="#06b6d4"
                color="#0891b2"
                weight={2}
                opacity={1}
                fillOpacity={0.9}
              >
                <Tooltip direction="top" permanent={false}>
                  <span className="text-xs font-bold">{aircraft.flight_number}</span>
                </Tooltip>
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{aircraft.flight_number}</p>
                    <p className="text-[10px]">Tail: {aircraft.tail}</p>
                    <p className="text-[10px]">{aircraft.origin} → {aircraft.destination}</p>
                    <p className="text-[10px]">Alt: {aircraft.altitude} ft</p>
                    <p className="text-[10px]">Speed: {aircraft.ground_speed} kts</p>
                    <p className="text-[10px]">Hdg: {aircraft.heading}°</p>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}
        </MapContainer>
      </div>
    </div>
  );
}