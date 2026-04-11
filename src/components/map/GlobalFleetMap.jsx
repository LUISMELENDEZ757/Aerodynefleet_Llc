import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Cloud, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
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
  const [baseLayer, setBaseLayer] = useState('esri-ocean');
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [overlays, setOverlays] = useState({
    sunlitEarth: false,
    weatherRadar: false,
    worldwideWeather: false,
    nearbyAirports: true,
    nearbyFlights: true,
    arrivals: true,
    departures: true,
  });

  const tileLayers = {
    'esri-ocean': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
      label: 'Ocean Base',
      attribution: 'Tiles &copy; Esri',
    },
    'dark': {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      label: 'Dark',
      attribution: '&copy; CartoDB',
    },
    'satellite': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      label: 'Satellite',
      attribution: 'Tiles &copy; Esri',
    },
  };

  const overlayOptions = [
    { key: 'sunlitEarth', label: 'Sunlit Earth' },
    { key: 'weatherRadar', label: 'Weather Radar' },
    { key: 'worldwideWeather', label: 'Worldwide Weather' },
    { key: 'nearbyAirports', label: 'Nearby Airports 🛬' },
    { key: 'nearbyFlights', label: 'Nearby Flights' },
    { key: 'arrivals', label: 'Arrivals' },
    { key: 'departures', label: 'Departures' },
  ];

  const toggleOverlay = (key) => {
    setOverlays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Build maintenance status map
  const melByTail = new Set(melItems.map(m => m.aircraft_tail));
  const oosAircraft = new Set(aircraft.filter(a => a.status === 'oos').map(a => a.tail_number));

  // Enrich flights with status and position
  const enrichedFlights = flights.map(f => {
    const tail = f.aircraft_tail;
    let status = 'green';
    if (oosAircraft.has(tail)) status = 'red';
    else if (melByTail.has(tail)) status = 'yellow';

    // Airport coordinates map
    const airportMap = {
      KEWR: [40.6895, -74.1745],
      KJFK: [40.6413, -73.7781],
      KORD: [41.8742, -87.6278],
      KLAX: [33.9425, -118.4081],
      EGLL: [51.4701, -0.4543],
      CDMX: [25.2038, -99.0735],
      KMIA: [25.7959, -80.2870],
      KATL: [33.6407, -84.4277],
      KDFW: [32.8975, -97.0382],
      KDEN: [39.8561, -104.6737],
      KSFO: [37.6213, -122.3790],
      KLAS: [36.0801, -115.1537],
    };

    // Place aircraft at origin or destination based on flight status
    const position = ['arrived', 'landed'].includes(f.status)
      ? (airportMap[f.destination] || [35, -100])
      : (airportMap[f.origin] || [40, -75]);

    const station = ['arrived', 'landed'].includes(f.status) ? f.destination : f.origin;

    return { ...f, status, lat: position[0], lng: position[1], station };
  });

  return (
    <div className="relative w-full h-96 bg-background rounded-xl overflow-hidden">
      <MapContainer
        key={mapKey}
        center={[37, -95]}
        zoom={4}
        className="w-full h-full"
        style={{ filter: 'hue-rotate(200deg) saturate(1.2) brightness(1.05)' }}
      >
        {/* Base tile layer */}
        <TileLayer
          url={tileLayers[baseLayer].url}
          attribution={tileLayers[baseLayer].attribution}
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

      {/* Layer control panel */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="bg-blue-900 text-white px-4 py-2 rounded-t-lg font-bold flex items-center gap-2 border-b-2 border-blue-800"
        >
          BASE LAYER
          <ChevronDown className="w-3 h-3" />
        </button>
        {showLayerPanel && (
          <div className="bg-blue-900 border border-blue-800 text-white shadow-lg">
            <div className="border-b border-blue-800 px-4 py-2 bg-gray-100 text-blue-900 font-bold text-xs">
              CLICK TO CHANGE
            </div>
            <div className="px-4 py-3 space-y-2">
              {Object.entries(tileLayers).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => { setBaseLayer(key); setShowLayerPanel(false); }}
                  className={cn(
                    'block w-full text-left text-xs py-1.5 px-2 rounded',
                    baseLayer === key ? 'bg-blue-700 font-bold' : 'hover:bg-blue-800'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="border-t border-blue-800 px-4 py-2 bg-gray-100">
              <p className="text-blue-900 font-bold text-xs mb-2">OVERLAYS</p>
              <div className="space-y-1.5">
                {overlayOptions.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-xs text-blue-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overlays[key]}
                      onChange={() => toggleOverlay(key)}
                      className="w-3 h-3"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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