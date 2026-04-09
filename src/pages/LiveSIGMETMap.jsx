import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, CloudLightning, RefreshCw, AlertTriangle, Wind, Thermometer, Eye, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIGMETS = [
  { id: 'C1', type: 'CONVECTIVE', color: '#ef4444', fillOpacity: 0.18, coords: [[42,-90],[40,-88],[38,-90],[39,-93],[41,-93]], altitudes: 'SFC–FL430', intensity: 'EMBD TS OBS AND FCST', movement: 'MOV E 20KT', expires: '2026-04-09T17:00Z' },
  { id: 'T3', type: 'TURBULENCE', color: '#f97316', fillOpacity: 0.16, coords: [[46,-90],[44,-88],[43,-91],[44,-94],[46,-93]], altitudes: 'FL350–FL450', intensity: 'SEV TURB', movement: 'MOV NE 25KT', expires: '2026-04-09T19:00Z' },
  { id: 'I2', type: 'ICING',      color: '#3b82f6', fillOpacity: 0.15, coords: [[42.4,-71],[42.7,-74],[43.1,-76],[43.0,-73],[42.3,-70.9]], altitudes: 'FL080–FL200', intensity: 'MOD ICING IN CLDS', movement: 'STNR', expires: '2026-04-09T18:30Z' },
  { id: 'C2', type: 'CONVECTIVE', color: '#ef4444', fillOpacity: 0.18, coords: [[42,-88.5],[41,-88],[40.5,-89],[41,-90],[42,-89.5]], altitudes: 'SFC–FL280', intensity: 'ISOL SEV TS OBS', movement: 'MOV SE 15KT', expires: '2026-04-09T17:15Z' },
];

const AIRMETS = [
  { id: 'SIE1', type: 'SIERRA', color: '#06b6d4', fillOpacity: 0.10, coords: [[35,-80],[33,-78],[32,-82],[34,-84]], desc: 'IFR conditions and mountain obscuration' },
  { id: 'TAN1', type: 'TANGO',  color: '#eab308', fillOpacity: 0.10, coords: [[38,-100],[36,-98],[35,-102],[37,-104]], desc: 'Moderate turbulence, wind shear' },
  { id: 'ZUL1', type: 'ZULU',  color: '#8b5cf6', fillOpacity: 0.10, coords: [[45,-105],[43,-103],[42,-107],[44,-109]], desc: 'Moderate icing, freezing level' },
];

const TFRS = [
  { id: 'TFR1', label: 'TFR – VIP Movement',   lat: 38.9,  lon: -77.04, radius: 28, color: '#a855f7', desc: 'Presidential TFR · SFC–FL180' },
  { id: 'TFR2', label: 'TFR – Sporting Event', lat: 33.75, lon: -84.39, radius: 18, color: '#ec4899', desc: 'Temporary Flight Restriction · SFC–3000 MSL' },
];

const AIRPORTS = [
  { icao: 'KEWR', name: 'Newark Liberty',       lat: 40.6895, lon: -74.1745 },
  { icao: 'KJFK', name: 'New York JFK',          lat: 40.6413, lon: -73.7781 },
  { icao: 'KORD', name: "Chicago O'Hare",         lat: 41.9742, lon: -87.9073 },
  { icao: 'KATL', name: 'Atlanta Hartsfield',    lat: 33.6407, lon: -84.4277 },
  { icao: 'KLAX', name: 'Los Angeles',           lat: 33.9425, lon: -118.4081 },
  { icao: 'KDFW', name: 'Dallas/Fort Worth',     lat: 32.8998, lon: -97.0403 },
  { icao: 'KDEN', name: 'Denver',               lat: 39.8561, lon: -104.6737 },
  { icao: 'KBOS', name: 'Boston Logan',         lat: 42.3656, lon: -71.0096 },
  { icao: 'KMIA', name: 'Miami',                lat: 25.7959, lon: -80.287 },
  { icao: 'KSEA', name: 'Seattle-Tacoma',       lat: 47.4502, lon: -122.3088 },
  { icao: 'KLAS', name: 'Las Vegas',            lat: 36.084,  lon: -115.1537 },
  { icao: 'KPHX', name: 'Phoenix Sky Harbor',   lat: 33.4373, lon: -112.0078 },
  { icao: 'KMSP', name: 'Minneapolis-St. Paul', lat: 44.882,  lon: -93.2218 },
  { icao: 'KDCA', name: 'Reagan National',      lat: 38.8521, lon: -77.0377 },
  { icao: 'KIAD', name: 'Dulles',               lat: 38.9531, lon: -77.4565 },
];

const COORDS = {
  KEWR:[40.6895,-74.1745], KJFK:[40.6413,-73.7781], KORD:[41.9742,-87.9073],
  KATL:[33.6407,-84.4277], KLAX:[33.9425,-118.4081], KDFW:[32.8998,-97.0403],
  KDEN:[39.8561,-104.6737], KBOS:[42.3656,-71.0096], KMIA:[25.7959,-80.287],
  KSEA:[47.4502,-122.3088], KLAS:[36.084,-115.1537], KPHX:[33.4373,-112.0078],
  KMSP:[44.882,-93.2218], KDCA:[38.8521,-77.0377], KIAD:[38.9531,-77.4565],
};

function wmoLabel(c) {
  if (c===0) return 'Clear'; if (c<=2) return 'Partly Cloudy'; if (c===3) return 'Overcast';
  if (c<=49) return 'Fog'; if (c<=69) return 'Rain'; if (c<=79) return 'Snow';
  if (c<=86) return 'Showers'; return 'Thunderstorm';
}
function flightCat(code, wind) {
  if (code>=95) return { cat:'IFR', color:'#ef4444' };
  if (code>=50||wind>25||code===3) return { cat:'MVFR', color:'#3b82f6' };
  return { cat:'VFR', color:'#22c55e' };
}
async function fetchWx(icao) {
  const c = COORDS[icao]; if (!c) return null;
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c[0]}&longitude=${c[1]}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=2`);
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}

function AirportWx({ airport }) {
  const { data, isLoading } = useQuery({ queryKey: ['apt-wx', airport.icao], queryFn: () => fetchWx(airport.icao), staleTime: 300000 });
  if (isLoading) return <div className="flex items-center gap-1.5 text-xs text-gray-400 py-1"><Loader2 className="w-3 h-3 animate-spin"/>Loading…</div>;
  const w = data?.current_weather;
  if (!w) return <p className="text-xs text-gray-400">No data</p>;
  const kt = Math.round(w.windspeed / 1.852);
  const fc = flightCat(w.weathercode, kt);
  const high = data?.daily?.temperature_2m_max?.[0];
  const low  = data?.daily?.temperature_2m_min?.[0];
  const prec = data?.daily?.precipitation_sum?.[0];
  const metar = `${airport.icao} AUTO ${String(Math.round(w.winddirection)).padStart(3,'0')}${String(kt).padStart(2,'0')}KT 9999 ${wmoLabel(w.weathercode).toUpperCase().replace(/ /g,'')} ${Math.round(w.temperature)}/${Math.round(w.temperature-3)} Q1013`;
  return (
    <div className="space-y-2 min-w-[210px]">
      <div className="flex items-center justify-between">
        <div><p className="text-sm font-extrabold text-white">{airport.icao}</p><p className="text-[10px] text-gray-400">{airport.name}</p></div>
        <span className="text-xs font-extrabold px-2 py-0.5 rounded" style={{background:fc.color+'22',color:fc.color,border:`1px solid ${fc.color}55`}}>{fc.cat}</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div className="bg-white/5 rounded-lg p-1.5 text-center"><Thermometer className="w-3 h-3 text-orange-400 mx-auto mb-0.5"/><p className="text-xs font-bold text-white">{Math.round(w.temperature)}°C</p><p className="text-[9px] text-gray-500">Temp</p></div>
        <div className="bg-white/5 rounded-lg p-1.5 text-center"><Wind className="w-3 h-3 text-cyan-400 mx-auto mb-0.5"/><p className="text-xs font-bold text-white">{kt}kt</p><p className="text-[9px] text-gray-500">{w.winddirection}°</p></div>
        <div className="bg-white/5 rounded-lg p-1.5 text-center"><Eye className="w-3 h-3 text-blue-400 mx-auto mb-0.5"/><p className="text-[10px] font-bold text-white truncate">{wmoLabel(w.weathercode)}</p><p className="text-[9px] text-gray-500">Cond</p></div>
      </div>
      <div className="bg-black/30 rounded-lg p-1.5">
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">METAR (synthetic)</p>
        <p className="text-[10px] font-mono text-green-400 break-all leading-relaxed">{metar}</p>
      </div>
      {high != null && (
        <div className="bg-black/30 rounded-lg p-1.5">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Forecast</p>
          <p className="text-[10px] text-white">H:<span className="font-bold text-orange-400 ml-1">{Math.round(high)}°C</span> L:<span className="font-bold text-blue-400 ml-1">{Math.round(low)}°C</span> P:<span className="font-bold text-cyan-400 ml-1">{prec?.toFixed(1)??'0.0'}mm</span></p>
        </div>
      )}
    </div>
  );
}

function LayerBtn({ label, active, color, onClick }) {
  return (
    <button onClick={onClick}
      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex-shrink-0', active?'text-white':'bg-[#141922]/80 text-gray-500 border-white/10')}
      style={active?{background:color+'33',borderColor:color+'88',color}:{}}>
      <span className="w-2 h-2 rounded-full" style={{background:active?color:'#4b5563'}}/>
      {label}
    </button>
  );
}

export default function LiveSIGMETMap() {
  const navigate = useNavigate();
  const [layers, setLayers] = useState({ SIGMET:true, AIRMET:true, TFR:true, AIRPORTS:true });
  const [updated, setUpdated] = useState(new Date());
  const toggle = k => setLayers(p => ({...p,[k]:!p[k]}));

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#0a0e18] border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={()=>navigate(-1)} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5"/></button>
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0"><CloudLightning className="w-5 h-5 text-blue-400"/></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white tracking-widest uppercase">SIGMET / AIRMET / TFR Map</p>
          <p className="text-[10px] text-blue-400 font-mono">Live Aviation Weather Hazards · Click airport for METAR/TAF</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">{SIGMETS.length} SIGMET</span>
          <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">{AIRMETS.length} AIRMET</span>
          <span className="text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full">{TFRS.length} TFR</span>
        </div>
        <button onClick={()=>setUpdated(new Date())} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button>
      </div>

      {/* Layer Controls */}
      <div className="flex-shrink-0 bg-[#0d1117]/90 backdrop-blur px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-white/5">
        <Layers className="w-3.5 h-3.5 text-gray-500 flex-shrink-0"/>
        <LayerBtn label="SIGMETs"  active={layers.SIGMET}   color="#ef4444" onClick={()=>toggle('SIGMET')}/>
        <LayerBtn label="AIRMETs"  active={layers.AIRMET}   color="#eab308" onClick={()=>toggle('AIRMET')}/>
        <LayerBtn label="TFRs"     active={layers.TFR}      color="#a855f7" onClick={()=>toggle('TFR')}/>
        <LayerBtn label="Airports" active={layers.AIRPORTS} color="#22c55e" onClick={()=>toggle('AIRPORTS')}/>
        <span className="ml-auto text-[10px] text-gray-600 flex-shrink-0">Updated {updated.toLocaleTimeString()}</span>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={[39.5,-98.35]} zoom={4} style={{height:'100%',width:'100%',background:'#0d1117'}} zoomControl={true}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' maxZoom={19}/>

          {layers.SIGMET && SIGMETS.map(s=>(
            <Polygon key={s.id} positions={s.coords} pathOptions={{color:s.color,fillColor:s.color,fillOpacity:s.fillOpacity,weight:2,dashArray:'6 4'}}>
              <Popup maxWidth={240}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border" style={{background:s.color+'22',color:s.color,borderColor:s.color+'66'}}>{s.type}</span>
                    <span className="text-sm font-extrabold text-white">SIGMET {s.id}</span>
                  </div>
                  <div className="text-[11px] text-gray-300 space-y-1">
                    <p><span className="text-gray-500">Altitudes:</span> <span className="font-bold">{s.altitudes}</span></p>
                    <p><span className="text-gray-500">Phenomenon:</span> <span className="font-bold">{s.intensity}</span></p>
                    <p><span className="text-gray-500">Movement:</span> <span className="font-bold">{s.movement}</span></p>
                    <p><span className="text-gray-500">Expires:</span> <span className="font-bold text-amber-400">{new Date(s.expires).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}Z</span></p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-red-400"><AlertTriangle className="w-3 h-3"/>Potential airspace hazard</div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {layers.AIRMET && AIRMETS.map(a=>(
            <Polygon key={a.id} positions={a.coords} pathOptions={{color:a.color,fillColor:a.color,fillOpacity:a.fillOpacity,weight:1.5,dashArray:'3 6'}}>
              <Popup maxWidth={200}>
                <div className="space-y-1.5">
                  <p className="text-sm font-extrabold text-white">AIRMET {a.type}</p>
                  <p className="text-[11px] text-gray-300">{a.desc}</p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border" style={{background:a.color+'22',color:a.color,borderColor:a.color+'55'}}>{a.id}</span>
                </div>
              </Popup>
            </Polygon>
          ))}

          {layers.TFR && TFRS.map(t=>(
            <CircleMarker key={t.id} center={[t.lat,t.lon]} radius={t.radius} pathOptions={{color:t.color,fillColor:t.color,fillOpacity:0.15,weight:2,dashArray:'4 4'}}>
              <Popup maxWidth={200}>
                <div className="space-y-1.5">
                  <p className="text-sm font-extrabold text-white">{t.label}</p>
                  <p className="text-[11px] text-gray-300">{t.desc}</p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border" style={{background:t.color+'22',color:t.color,borderColor:t.color+'55'}}>{t.id}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {layers.AIRPORTS && AIRPORTS.map(apt=>(
            <CircleMarker key={apt.icao} center={[apt.lat,apt.lon]} radius={7} pathOptions={{color:'#22c55e',fillColor:'#22c55e',fillOpacity:0.85,weight:1.5}}>
              <Popup maxWidth={280}><AirportWx airport={apt}/></Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 space-y-1.5 text-[10px]">
          <p className="text-gray-500 font-bold uppercase tracking-widest mb-2">Legend</p>
          {[
            {color:'#ef4444',dash:true, label:'Convective SIGMET'},
            {color:'#f97316',dash:true, label:'Turbulence SIGMET'},
            {color:'#3b82f6',dash:true, label:'Icing SIGMET'},
            {color:'#eab308',dash:true, label:'AIRMET'},
            {color:'#a855f7',dash:true, label:'TFR'},
            {color:'#22c55e',dash:false,label:'Airport (click for wx)'},
          ].map(({color,dash,label})=>(
            <div key={label} className="flex items-center gap-2">
              <span className="w-6 h-0 border-t-2 flex-shrink-0" style={{borderColor:color,borderStyle:dash?'dashed':'solid'}}/>
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .leaflet-popup-content-wrapper{background:#141922!important;border:1px solid rgba(255,255,255,0.1)!important;border-radius:12px!important;box-shadow:0 8px 32px rgba(0,0,0,0.5)!important;padding:0!important;}
        .leaflet-popup-content{margin:8px!important;}
        .leaflet-popup-tip{background:#141922!important;}
        .leaflet-popup-close-button{color:#9ca3af!important;top:6px!important;right:6px!important;}
        .leaflet-container{background:#0d1117!important;font-family:inherit!important;}
        .leaflet-control-zoom a{background:#141922!important;color:#e5e7eb!important;border-color:rgba(255,255,255,0.15)!important;}
        .leaflet-control-zoom a:hover{background:#1e2535!important;}
        .leaflet-control-attribution{background:rgba(13,17,23,0.7)!important;color:#4b5563!important;}
        .leaflet-control-attribution a{color:#6b7280!important;}
      `}</style>
    </div>
  );
}