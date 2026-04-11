import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Cloud, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Status color mapping
const STATUS_COLORS = {
  green: { bg: '#10b981', icon: '🟢', label: 'Airworthy' },
  yellow: { bg: '#f59e0b', icon: '🟡', label: 'MEL Item' },
  red: { bg: '#ef4444', icon: '🔴', label: 'OOS' },
};

// Create custom icons
const createAircraftIcon = (status = 'green') => {
  const color = STATUS_COLORS[status]?.bg || '#10b981';
  return L.divIcon({
    html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">✈️</div>`,
    className: 'aircraft-marker',
    iconSize: [24, 24],
    popupAnchor: [0, -12],
  });
};

// Weather grid layer
function WeatherGrid({ bounds }) {
  const weatherCells = [
    { lat: 40, lng: -80, intensity: 0.3, type: 'light' },
    { lat: 35, lng: -90, intensity: 0.6, type: 'moderate' },
    { lat: 45, lng: -100, intensity: 0.2, type: 'light' },
    { lat: 50, lng: -120, intensity: 0.4, type: 'moderate' },
  ];

  return (
    <>
      {weatherCells.map((cell, idx) => (
        <CircleMarker
          key={idx}
          center={[cell.lat, cell.lng]}
          radius={40}
          fillColor={cell.intensity > 0.5 ? '#ef4444' : '#f59e0b'}
          color="transparent"
          weight={0}
          opacity={0}
          fillOpacity={0.15}
        >
          <Popup>
            <p className="text-xs font-bold">{cell.type.toUpperCase()} Weather</p>
            <p className="text-[10px] text-gray-600">Intensity: {Math.round(cell.intensity * 100)}%</p>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

export default function GlobalFleetMap({ flights = [], aircraft = [], melItems = [] }) {
  const [mapKey, setMapKey] = useState(0);

  // Build maintenance status map
  const melByTail = new Set(melItems.map(m => m.aircraft_tail));
  const oosAircraft = new Set(aircraft.filter(a => a.status === 'oos').map(a => a.tail_number));

  // Enrich flights with status and position
  const enrichedFlights = flights.map(f => {
    const tail = f.aircraft_tail;
    let status = 'green';
    if (oosAircraft.has(tail)) status = 'red';
    else if (melByTail.has(tail)) status = 'yellow';

    // Simulate lat/lng based on origin/destination (for demo)
    const originMap = {
      KEWR: [40.6895, -74.1745],
      KJFK: [40.6413, -73.7781],
      KORD: [41.8742, -87.6278],
      KLAX: [33.9425, -118.4081],
      EGLL: [51.4701, -0.4543],
      CDMX: [25.2038, -99.0735],
      KMIA: [25.7959, -80.2870],
    };

    const destMap = {
      KEWR: [40.6895, -74.1745],
      KJFK: [40.6413, -73.7781],
      KORD: [41.8742, -87.6278],
      KLAX: [33.9425, -118.4081],
      EGLL: [51.4701, -0.4543],
      CDMX: [25.2038, -99.0735],
      KMIA: [25.7959, -80.2870],
    };

    const originPos = originMap[f.origin] || [40, -75];
    const destPos = destMap[f.destination] || [35, -100];

    // Interpolate position based on flight progress (0-1)
    const progress = Math.random() * 0.8; // Demo: random progress
    const lat = originPos[0] + (destPos[0] - originPos[0]) * progress;
    const lng = originPos[1] + (destPos[1] - originPos[1]) * progress;

    return { ...f, status, lat, lng };
  });

  return (
    <div className="relative w-full h-full bg-background rounded-xl overflow-hidden">
      <MapContainer
        key={mapKey}
        center={[37, -95]}
        zoom={4}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        {/* Base tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; CartoDB'
          maxZoom={18}
        />

        {/* Weather overlay */}
        <WeatherGrid />

        {/* Aircraft markers */}
        {enrichedFlights.map((flight, idx) => {
          const statusColor = STATUS_COLORS[flight.status];
          return (
            <Marker
              key={`${flight.id}-${idx}`}
              position={[flight.lat, flight.lng]}
              icon={createAircraftIcon(flight.status)}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold">{flight.flight_number}</p>
                  <p className="text-[10px]">{flight.origin} → {flight.destination}</p>
                  <p className="text-[10px] text-gray-600">{flight.aircraft_tail}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: statusColor.bg }}
                    />
                    <span className="text-[10px] font-semibold">{statusColor.label}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 bg-background/90 border border-border rounded-xl p-3 space-y-2 text-xs z-10">
        <p className="font-extrabold text-foreground">Maintenance Status</p>
        {Object.entries(STATUS_COLORS).map(([key, { icon, label }]) => (
          <div key={key} className="flex items-center gap-2">
            <span>{icon}</span>
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-border mt-2">
          <p className="font-semibold text-foreground mb-1">Weather</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-40" />
            <span className="text-muted-foreground text-[9px]">Light conditions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-40" />
            <span className="text-muted-foreground text-[9px]">Severe conditions</span>
          </div>
        </div>
      </div>

      {/* Aircraft count */}
      <div className="absolute top-3 right-3 bg-background/90 border border-border rounded-xl px-3 py-2 z-10 text-xs font-bold">
        <p className="text-foreground">{enrichedFlights.length} Aircraft</p>
        <p className="text-[10px] text-muted-foreground">Airborne</p>
      </div>
    </div>
  );
}