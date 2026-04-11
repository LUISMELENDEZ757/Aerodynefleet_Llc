import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Cloud, AlertTriangle, CheckCircle, ChevronDown, X, Plane, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedFlight, setSelectedFlight] = useState(null);
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

        {/* Sunlit Earth overlay */}
        {overlays.sunlitEarth && (
          <TileLayer
            url="https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
            attribution="NASA VIIRS"
            opacity={0.5}
            maxZoom={8}
          />
        )}

        {/* Weather Radar overlay */}
        {overlays.weatherRadar && (
          <TileLayer
            url="https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png"
            attribution="IEM"
            opacity={0.6}
          />
        )}

        {/* Worldwide Weather overlay */}
        {overlays.worldwideWeather && <WeatherGrid />}

        {/* Nearby Airports overlay */}
        {overlays.nearbyAirports && (
          <>
            {[
              { name: 'KEWR', lat: 40.6895, lng: -74.1745 },
              { name: 'KJFK', lat: 40.6413, lng: -73.7781 },
              { name: 'KLGA', lat: 40.7769, lng: -73.8740 },
              { name: 'KBOS', lat: 42.3656, lng: -71.0096 },
              { name: 'KPHL', lat: 39.8716, lng: -75.2411 },
              { name: 'KORD', lat: 41.8742, lng: -87.6278 },
              { name: 'KDFW', lat: 32.8975, lng: -97.0382 },
              { name: 'KATL', lat: 33.6407, lng: -84.4277 },
              { name: 'KMIA', lat: 25.7959, lng: -80.2870 },
              { name: 'KLAX', lat: 33.9425, lng: -118.4081 },
              { name: 'KSFO', lat: 37.6213, lng: -122.3790 },
              { name: 'KSEA', lat: 47.4502, lng: -122.3088 },
              { name: 'KDEN', lat: 39.8561, lng: -104.6737 },
              { name: 'KLAS', lat: 36.0801, lng: -115.1537 },
              { name: 'KPHX', lat: 33.4342, lng: -112.0116 },
              { name: 'KAUS', lat: 30.1945, lng: -97.6699 },
              { name: 'KIAH', lat: 29.9844, lng: -95.3414 },
            ].map(airport => (
              <Marker key={airport.name} position={[airport.lat, airport.lng]}>
                <Popup>
                  <p className="text-xs font-bold">{airport.name}</p>
                </Popup>
              </Marker>
            ))}
          </>
        )}

        {/* Flight route polylines */}
        {enrichedFlights.map((flight, idx) => {
          const airportMap = {
            // US Hubs
            KEWR: [40.6895, -74.1745], KJFK: [40.6413, -73.7781], KLGA: [40.7769, -73.8740],
            KORD: [41.8742, -87.6278], KMDW: [41.7861, -87.7521],
            KLAX: [33.9425, -118.4081], KSFO: [37.6213, -122.3790], KSEA: [47.4502, -122.3088],
            KDEN: [39.8561, -104.6737], KDFW: [32.8975, -97.0382], KDAL: [32.8471, -96.8519], KIAH: [29.9844, -95.3414],
            KATL: [33.6407, -84.4277], KMIA: [25.7959, -80.2870], KBOS: [42.3656, -71.0096],
            KLAS: [36.0801, -115.1537], KPHX: [33.4342, -112.0116], KAUS: [30.1945, -97.6699],
            KMSP: [44.8848, -93.2224], KDCA: [38.8521, -77.0377], KIAD: [38.8951, -77.0375],
            KBWI: [39.1754, -76.6681], KPHL: [39.8716, -75.2411], KPIT: [40.4915, -80.2324],
            KCLE: [41.4117, -81.8498], KMCI: [39.2976, -94.7139],
            // International Hubs
            EGLL: [51.4701, -0.4543], CDMX: [25.2038, -99.0735], CYYZ: [43.6769, -79.6305],
            CYUL: [45.4652, -73.7420], KJFK: [40.6413, -73.7781], UUDD: [55.4125, 37.9072],
            RJTT: [35.5494, 139.7798], KSFO: [37.6213, -122.3790], LFPG: [49.0097, 2.5479],
            EDDF: [50.0379, 8.5622], LIRF: [41.8045, 12.2508], LEMD: [40.4168, -3.5628],
          };
          const origin = airportMap[flight.origin] || null;
          const destination = airportMap[flight.destination] || null;
          if (!origin || !destination) return null;
          return (
            <Polyline
              key={`route-${flight.id}-${idx}`}
              positions={[origin, destination]}
              color={STATUS_COLORS[flight.status]?.bg || '#10b981'}
              weight={2}
              dashArray="5, 5"
              opacity={0.6}
            />
          );
        })}

        {/* Aircraft markers */}
        {enrichedFlights.map((flight, idx) => {
          const statusColor = STATUS_COLORS[flight.status];
          return (
            <Marker
              key={`${flight.id}-${idx}`}
              position={[flight.lat, flight.lng]}
              icon={createAircraftIcon(flight.status)}
              eventHandlers={{
                click: () => setSelectedFlight(flight),
              }}
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

      {/* Flight Detail Modal */}
      <AnimatePresence>
        {selectedFlight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            drag
            dragElastic={0.2}
            className="absolute bottom-24 left-3 z-40 bg-card border border-border rounded-2xl shadow-2xl w-48 h-64 overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <div className="bg-primary/10 border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-foreground">{selectedFlight.flight_number}</h3>
              </div>
              <button onClick={() => setSelectedFlight(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100%-60px)]">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">From</p>
                  <p className="text-sm font-extrabold text-foreground">{selectedFlight.origin}</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">To</p>
                  <p className="text-sm font-extrabold text-foreground">{selectedFlight.destination}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Altitude</p>
                  <p className="text-lg font-black text-primary">{Math.floor(Math.random() * 35000 + 5000).toLocaleString()} ft</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Ground Speed</p>
                  <p className="text-lg font-black text-chart-2">{Math.floor(Math.random() * 450 + 250)} kt</p>
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Aircraft</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{selectedFlight.aircraft_type}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedFlight.aircraft_tail}</p>
                  </div>
                  <Activity className="w-5 h-5 text-chart-3" />
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Est. Arrival</p>
                <p className="text-sm font-extrabold text-foreground">~{(Math.random() > 0.5 ? Math.floor(Math.random() * 240 + 30) : '—')} min</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: STATUS_COLORS[selectedFlight.status]?.bg || '#10b981', opacity: 0.2 }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[selectedFlight.status]?.bg }} />
                <span className="text-xs font-bold text-foreground">{STATUS_COLORS[selectedFlight.status]?.label || 'Active'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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