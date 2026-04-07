import { useState } from 'react';
import { Wind, Cloud, AlertTriangle, Eye } from 'lucide-react';

const FLIGHT_CAT = {
  VFR:  { color: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-700/40' },
  MVFR: { color: 'text-blue-400',   bg: 'bg-blue-900/30',   border: 'border-blue-700/40' },
  IFR:  { color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-700/40' },
  LIFR: { color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-700/40' },
};

function flightCategory(metar = '') {
  if (metar.includes('LIFR') || metar.match(/\b[0-9]SM\b/) && parseInt(metar) < 1) return 'LIFR';
  if (metar.includes('OVC003') || metar.includes('OVC005') || metar.includes('BKN005')) return 'IFR';
  if (metar.includes('BKN012') || metar.includes('OVC012') || metar.includes('3SM')) return 'MVFR';
  return 'VFR';
}

function MetarCard({ label, metar, taf }) {
  const [showTaf, setShowTaf] = useState(false);
  const cat = flightCategory(metar || '');
  const cfg = FLIGHT_CAT[cat] || FLIGHT_CAT.VFR;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.color} bg-black/30`}>{cat}</span>
      </div>
      <p className="text-xs font-mono text-slate-300 leading-relaxed">{metar || 'No METAR available'}</p>
      {taf && (
        <>
          <button onClick={() => setShowTaf(v => !v)} className="text-[10px] text-sky-400 underline">{showTaf ? 'Hide TAF' : 'Show TAF'}</button>
          {showTaf && <p className="text-[11px] font-mono text-slate-400 leading-relaxed border-t border-white/10 pt-2">{taf}</p>}
        </>
      )}
    </div>
  );
}

function WindsAloft({ route }) {
  const waypoints = (route || '').split(' ').slice(0, 6).filter(Boolean);
  const mockWinds = waypoints.map((wp, i) => ({
    wp,
    alt: 'FL350',
    dir: Math.round(240 + i * 15),
    spd: Math.round(65 + i * 8),
    temp: -58 + i,
  }));

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">Winds Aloft — FL350</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-slate-500 uppercase tracking-widest">
              <th className="text-left py-1.5 pr-3">Waypoint</th>
              <th className="text-right py-1.5 pr-3">Dir</th>
              <th className="text-right py-1.5 pr-3">Spd</th>
              <th className="text-right py-1.5">Temp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {mockWinds.map(w => (
              <tr key={w.wp}>
                <td className="py-1.5 pr-3 font-mono font-bold text-slate-200">{w.wp}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-slate-300">{w.dir}°</td>
                <td className="py-1.5 pr-3 text-right font-mono text-sky-300">{w.spd}kt</td>
                <td className="py-1.5 text-right font-mono text-blue-300">{w.temp}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WeatherBriefingPanel({ flight }) {
  const [activeTab, setActiveTab] = useState('stations');

  const sigmets = [
    { id: 'WSNT01', area: 'Atlantic North', type: 'SEV TURB', level: 'FL280-FL360', valid: '23:00–03:00Z', severity: 'warn' },
    { id: 'WSDX02', area: 'CDG TMA', type: 'TS EMBD', level: 'SFC-CB', valid: '22:30–01:00Z', severity: 'bad' },
  ];

  const tfrs = [
    { id: 'TFR-NYC-01', area: 'KEWR 5nm', type: 'Security', alt: 'SFC-3000', active: true },
  ];

  return (
    <div className="space-y-4 mt-3">
      {/* Tabs */}
      <div className="flex gap-1">
        {[['stations', 'METARs/TAFs'], ['sigmet', 'SIGMETs/AIRMETs'], ['winds', 'Winds Aloft'], ['tfr', 'TFRs']].map(([key, lbl]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {activeTab === 'stations' && (
        <div className="space-y-3">
          <MetarCard label={`Departure — ${flight.origin}`} metar={flight.wx?.dep} taf={`TAF ${flight.origin} 232300Z 2400/2506 04008KT 9999 BKN040 TEMPO 2401/2405 3000 -RA BKN015`} />
          <MetarCard label={`Destination — ${flight.destination}`} metar={flight.wx?.arr} taf={`TAF ${flight.destination} 232300Z 2400/2506 20012KT 6000 SHRA SCT020 BKN050 BECMG 2408/2410 9999 SCT040`} />
          <MetarCard label={`Alternate — ${flight.alternate}`} metar={flight.wx?.alt} taf={`TAF ${flight.alternate} 232300Z 2400/2506 19008KT 8000 SHRA SCT025 BECMG 2406/2408 9999`} />
        </div>
      )}

      {activeTab === 'sigmet' && (
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 mb-2">
            <p className="text-[10px] text-slate-500">Graphical SIGMET overlay — field visualization</p>
            <div className="mt-2 rounded-lg bg-slate-900 border border-slate-800 h-36 flex items-center justify-center text-slate-700 text-xs">
              [ SVG SIGMET Map — Atlantic + Europe ]
            </div>
          </div>
          {sigmets.map(s => (
            <div key={s.id} className={`rounded-xl border px-3 py-2.5 space-y-1 ${s.severity === 'bad' ? 'border-rose-700/40 bg-rose-950/20' : 'border-amber-700/40 bg-amber-950/20'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold ${s.severity === 'bad' ? 'text-rose-400' : 'text-amber-400'}`}>{s.id}</span>
                <span className="text-[10px] text-slate-500">{s.valid}</span>
              </div>
              <p className="text-xs font-bold text-slate-200">{s.type}</p>
              <p className="text-[11px] text-slate-400">{s.area} · {s.level}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'winds' && <WindsAloft route={flight.route} />}

      {activeTab === 'tfr' && (
        <div className="space-y-2">
          {tfrs.map(t => (
            <div key={t.id} className="rounded-xl border border-sky-700/40 bg-sky-950/20 px-3 py-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-sky-400">{t.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.active ? 'bg-rose-900/40 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>{t.active ? 'ACTIVE' : 'INACTIVE'}</span>
              </div>
              <p className="text-xs text-slate-200">{t.type} · {t.area}</p>
              <p className="text-[11px] text-slate-400">Altitude: {t.alt}</p>
            </div>
          ))}
          {tfrs.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No active TFRs on route</p>}
        </div>
      )}
    </div>
  );
}