import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
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

// Interpolate aircraft position along route
function interpolatePosition(origin, dest, progress) {
  if (!origin || !dest) return null;
  const [o_lat, o_lng] = origin;
  const [d_lat, d_lng] = dest;
  return [o_lat + (d_lat - o_lat) * progress, o_lng + (d_lng - o_lng) * progress];
}

function getFlightProgress(flight) {
  if (flight.status === 'airborne' || flight.status === 'En Route') {
    // Estimate progress based on scheduled times
    const now = new Date();
    const dep = flight._raw_dep ? new Date(flight._raw_dep) : null;
    const arr = flight._raw_arr ? new Date(flight._raw_arr) : null;
    if (!dep || !arr) return 0.5;
    const elapsed = now - dep;
    const total = arr - dep;
    return Math.max(0, Math.min(1, elapsed / total));
  }
  return flight.status === 'arrived' || flight.status === 'landed' ? 1 : 0;
}

export default function LiveAircraftMap({ flights = [] }) {
  const [center, setCenter] = useState([39.8282, -98.5795]); // Center of USA
  const [zoom, setZoom] = useState(4);

  const airborneFlights = flights.filter(f => {
    const s = f.status?.toLowerCase() || '';
    return s.includes('airborne') || s.includes('en route') || s.includes('departed');
  });

  // Filter unique airports to show
  const airportsToShow = new Set();
  airborneFlights.forEach(f => {
    if (f.origin) airportsToShow.add(f.origin);
    if (f.destination) airportsToShow.add(f.destination);
  });

  return (
    <div className="rounded-2xl overflow-hidden border border-border h-full bg-background">
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

        {/* Flight paths and aircraft */}
        {airborneFlights.map(flight => {
          const originCoords = AIRPORT_COORDS[flight.origin];
          const destCoords = AIRPORT_COORDS[flight.destination];
          if (!originCoords || !destCoords) return null;

          const progress = getFlightProgress(flight);
          const aircraftPos = interpolatePosition(originCoords, destCoords, progress);
          const cfg = {
            'airborne': { color: '#10b981', fillColor: '#10b981' },
            'en route': { color: '#10b981', fillColor: '#10b981' },
            'departed': { color: '#f59e0b', fillColor: '#f59e0b' },
          }[flight.status?.toLowerCase()] || { color: '#6b7280', fillColor: '#6b7280' };

          return (
            <div key={flight.id}>
              {/* Flight path line */}
              <Polyline
                positions={[originCoords, destCoords]}
                color={cfg.color}
                weight={2}
                opacity={0.5}
                dashArray="5, 5"
              />

              {/* Aircraft position */}
              {aircraftPos && (
                <CircleMarker
                  center={aircraftPos}
                  radius={6}
                  fill
                  fillColor={cfg.fillColor}
                  color={cfg.color}
                  weight={2}
                  opacity={1}
                  fillOpacity={0.8}
                >
                  <Popup>
                    <div className="text-xs font-bold space-y-1">
                      <p>{flight.flight_number}</p>
                      <p className="text-[10px] text-gray-600">
                        {flight.origin} → {flight.destination}
                      </p>
                      <p className="text-[10px] text-gray-600">{flight.aircraft_tail}</p>
                      {flight.delay_minutes > 0 && (
                        <p className="text-[10px] text-red-600">+{flight.delay_minutes}m delay</p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}