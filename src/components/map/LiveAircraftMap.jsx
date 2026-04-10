import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Airline display names
const AIRLINE_DISPLAY = {
  'UAL': 'United (UAL)',
  'AAL': 'American (AA)',
  'JBU': 'Jet Blue',
  'SWA': 'Southwest',
};

// Fallback airlines list
const FALLBACK_AIRLINES = ['UAL', 'AAL', 'JBU', 'SWA', 'DAL', 'FDX', 'UPS'];

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
  const [showAirlineModal, setShowAirlineModal] = useState(false);

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

  // Get unique airlines, fallback to common airlines if none found
  const airlines = aircraftPositions.length > 0
    ? [...new Set(aircraftPositions.map(a => a.airline).filter(Boolean))].sort()
    : FALLBACK_AIRLINES;

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
          onClick={() => setShowAirlineModal(true)}
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
            {AIRLINE_DISPLAY[airline] || airline}
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
                radius={selectedAirline ? 12 : 8}
                fill
                fillColor={selectedAirline ? '#f59e0b' : '#06b6d4'}
                color={selectedAirline ? '#d97706' : '#0891b2'}
                weight={selectedAirline ? 3 : 2}
                opacity={1}
                fillOpacity={selectedAirline ? 1 : 0.9}
              >
                <Tooltip direction="top" permanent={selectedAirline}>
                  <span className="text-xs font-bold">{aircraft.flight_number}</span>
                </Tooltip>
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{aircraft.flight_number}</p>
                    <p className="text-[10px]">Airline: {AIRLINE_DISPLAY[aircraft.airline] || aircraft.airline}</p>
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

      {/* Airline Selection Modal */}
      {showAirlineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full max-h-96 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-foreground">Select Airline</p>
              <button
                onClick={() => setShowAirlineModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <button
              onClick={() => setSelectedAirline(null)}
              className={cn(
                'w-full text-left text-xs font-bold px-3 py-2 rounded-lg border transition-all',
                !selectedAirline
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Available Airlines</p>
              {airlines.map(airline => (
                <button
                  key={airline}
                  onClick={() => {
                    setSelectedAirline(airline);
                    setShowAirlineModal(false);
                  }}
                  className={cn(
                    'w-full text-left text-xs font-bold px-3 py-2 rounded-lg border transition-all',
                    selectedAirline === airline
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {AIRLINE_DISPLAY[airline] || airline}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}