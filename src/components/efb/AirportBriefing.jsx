import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  MapPin, AlertTriangle, Volume2, Route, ChevronDown, ChevronRight,
  Navigation, Info, BookOpen, Map
} from 'lucide-react';

const AIRPORTS_DB = {
  KEWR: {
    name: 'Newark Liberty International',
    city: 'Newark, NJ',
    elevation: 18,
    runways: [
      { id: '04L/22R', length: 11000, width: 150, surface: 'Asphalt/Grooved', ils: ['ILS 22R CAT III', 'ILS 04L CAT I'] },
      { id: '04R/22L', length: 9394,  width: 150, surface: 'Asphalt',         ils: ['ILS 22L CAT I'] },
      { id: '11/29',   length: 6800,  width: 150, surface: 'Asphalt',         ils: ['ILS 29 CAT I'] },
    ],
    hotspots: [
      { id: 'HS-1', desc: 'Taxiway C / Runway 04R intersection — high incursion risk during low visibility' },
      { id: 'HS-2', desc: 'Runway 11/29 hold short of Runway 22R — complex intersection, confirm clearance' },
      { id: 'HS-3', desc: 'Terminal B South ramp — congestion during peak hours, follow marshaller' },
    ],
    noise: [
      'Runway 22L/R departure: climbing right turn to 2000 ft before tracking course — avoid residential east of field',
      'Night operations restricted 22:00–06:00 local — Stage 3 minimum',
      'Runway 04L climb to 3000 ft before reaching NJ Turnpike corridor',
    ],
    procedures: [
      'TETERBORO corridor — Class B altitudes apply, coordinate with NY TRACON',
      'RNAV departure via BIGGY or PARKE preferred for southbound routing',
      'CAT III ops: RVR 1200 required, crew currency within 6 months',
    ],
    sid_star: ['BIGGY 7', 'PARKE 5', 'CAMRN 4', 'PHLBO 3 STAR', 'LENDY 8 STAR'],
  },
  KJFK: {
    name: 'John F. Kennedy International',
    city: 'New York, NY',
    elevation: 13,
    runways: [
      { id: '04L/22R', length: 12079, width: 200, surface: 'Asphalt/Grooved', ils: ['ILS 22R CAT III', 'ILS 04L CAT I'] },
      { id: '04R/22L', length: 8400,  width: 150, surface: 'Asphalt',         ils: ['ILS 22L CAT II'] },
      { id: '13L/31R', length: 10000, width: 150, surface: 'Asphalt/Grooved', ils: ['ILS 31R CAT I'] },
      { id: '13R/31L', length: 14572, width: 200, surface: 'Asphalt/Grooved', ils: ['ILS 13R CAT III'] },
    ],
    hotspots: [
      { id: 'HS-1', desc: 'Taxiway B / Runway 13R-31L — complex crossing, verify clearance with ground' },
      { id: 'HS-2', desc: 'Terminal 4 remote gates — verify pushback direction against active runway' },
      { id: 'HS-3', desc: 'Runway 31R hold short of 13R — parallel runway operations active' },
    ],
    noise: [
      'Canarise Climb: runway 13L departure — climb runway heading to 2500 ft then left turn south',
      'North Shore restriction: avoid Flight Path over Great Neck 23:00–06:00',
      'Stage 4 minimum for all scheduled service',
    ],
    procedures: [
      'RNAV Q-routes preferred for transcons — file CAMRN or HAPIE',
      'Simultaneous parallel approaches authorized 22L/22R and 31L/31R in VMC',
      'Engine run-up restrictions at terminal gates — coordinate with ops',
    ],
    sid_star: ['SKORR 5', 'CAMRN 4', 'HAPIE 4', 'PARCH 4 STAR', 'LENDY 8 STAR'],
  },
  KORD: {
    name: "O'Hare International",
    city: 'Chicago, IL',
    elevation: 672,
    runways: [
      { id: '10C/28C', length: 13000, width: 200, surface: 'Concrete/Grooved', ils: ['ILS 10C CAT III', 'ILS 28C CAT III'] },
      { id: '10L/28R', length: 13000, width: 200, surface: 'Concrete/Grooved', ils: ['ILS 28R CAT III'] },
      { id: '10R/28L', length: 7967,  width: 150, surface: 'Asphalt',          ils: ['ILS 10R CAT I'] },
      { id: '09L/27R', length: 10003, width: 150, surface: 'Concrete',          ils: ['ILS 27R CAT II'] },
    ],
    hotspots: [
      { id: 'HS-1', desc: 'Taxiway K — crosses three runways. Stop and verify each clearance independently' },
      { id: 'HS-2', desc: 'Runway 10C/28C / Taxiway ER — complex geometry, night/low-vis caution' },
      { id: 'HS-3', desc: 'International Terminal remote apron — verify taxi route with ground' },
    ],
    noise: [
      'Preferential Runway System (PRS) in effect — arrivals north complex preferred 22:00–06:00',
      'SID altitude restrictions apply over Lake Michigan corridor',
      'Stage 4 aircraft mandatory — no exemptions',
    ],
    procedures: [
      'Complex runway system — read-back all runway crossing clearances verbatim',
      'LAHSO operations may be in effect — must accept or reject before entering runway',
      'LOC BC approach 19R available in IMC — review non-standard approach briefing',
    ],
    sid_star: ['LEWKE 3', 'OHARE 3', 'BENKY 1', 'DYLIN 5 STAR', 'CHCGO 5 STAR'],
  },
  KATL: {
    name: 'Hartsfield-Jackson Atlanta International',
    city: 'Atlanta, GA',
    elevation: 1026,
    runways: [
      { id: '08L/26R', length: 12390, width: 150, surface: 'Asphalt/Grooved', ils: ['ILS 26R CAT III', 'ILS 08L CAT I'] },
      { id: '08R/26L', length: 9000,  width: 150, surface: 'Asphalt',          ils: ['ILS 26L CAT II'] },
      { id: '09L/27R', length: 12390, width: 150, surface: 'Asphalt/Grooved', ils: ['ILS 27R CAT III'] },
      { id: '09R/27L', length: 9000,  width: 150, surface: 'Asphalt',          ils: ['ILS 27L CAT I'] },
      { id: '10/28',   length: 9000,  width: 150, surface: 'Asphalt',          ils: ['ILS 28 CAT I'] },
    ],
    hotspots: [
      { id: 'HS-1', desc: 'Taxiway M between south complex runways — extremely high incursion risk' },
      { id: 'HS-2', desc: 'International Terminal T gates — ground frequency change during pushback' },
    ],
    noise: [
      'South complex preferred for nighttime arrivals — avoids downtown Atlanta',
      'Noise abatement departure: climb 3000 ft before power reduction',
      'Continuous descent operations (CDO) in effect for arrivals — idle thrust preferred',
    ],
    procedures: [
      'Five parallel runways — complex taxi system, use cockpit moving map',
      'Simultaneous operations on all 5 runways in VMC',
    ],
    sid_star: ['TAYLE 7', 'SHEAR 3', 'DOGGG 4', 'FLCON 7 STAR', 'HAHND 6 STAR'],
  },
};

const ALL_ICAO = Object.keys(AIRPORTS_DB);

function Section({ title, icon: Icon, color = 'text-primary', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', color)} />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

export default function AirportBriefing({ flights = [] }) {
  // Derive airports from today's flights, fall back to full list
  const flightAirports = [...new Set(flights.flatMap(f => [f.origin, f.destination]).filter(Boolean))];
  const airports = flightAirports.length > 0 ? flightAirports : ALL_ICAO;

  const [selected, setSelected] = useState(airports[0] || ALL_ICAO[0]);
  const airport = AIRPORTS_DB[selected];

  return (
    <div className="space-y-3">
      {/* Airport selector */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Select Airport</label>
        <div className="flex flex-wrap gap-2">
          {airports.filter(a => AIRPORTS_DB[a]).map(icao => (
            <button
              key={icao}
              onClick={() => setSelected(icao)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                selected === icao
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >{icao}</button>
          ))}
        </div>
      </div>

      {!airport ? (
        <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No briefing data available for {selected}
        </div>
      ) : (
        <>
          {/* Airport header */}
          <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{selected} — {airport.name}</p>
              <p className="text-xs text-muted-foreground">{airport.city} · Elev: {airport.elevation} ft MSL · {airport.runways.length} runways</p>
            </div>
          </div>

          {/* Runway summary */}
          <Section title="Runway Data" icon={Navigation} color="text-green-400" defaultOpen>
            <div className="p-3 space-y-2">
              {airport.runways.map(rwy => (
                <div key={rwy.id} className="bg-background/40 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-mono font-bold text-foreground">{rwy.id}</p>
                    <p className="text-xs font-mono text-muted-foreground">{rwy.length.toLocaleString()} × {rwy.width} ft</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{rwy.surface}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {rwy.ils.map(i => (
                      <span key={i} className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-mono">{i}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Hotspots */}
          <Section title="Runway Hotspots" icon={AlertTriangle} color="text-destructive" defaultOpen>
            <div className="p-3 space-y-2">
              {airport.hotspots.map(hs => (
                <div key={hs.id} className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-destructive">{hs.id}</p>
                    <p className="text-xs text-foreground mt-0.5">{hs.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Noise abatement */}
          <Section title="Noise Abatement Procedures" icon={Volume2} color="text-orange-400">
            <div className="p-3 space-y-2">
              {airport.noise.map((n, i) => (
                <div key={i} className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                  <Volume2 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{n}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Special procedures */}
          <Section title="Special Procedures & Advisories" icon={Info} color="text-blue-400">
            <div className="p-3 space-y-2">
              {airport.procedures.map((p, i) => (
                <div key={i} className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{p}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* SID/STAR */}
          <Section title="SID / STAR Quick Reference" icon={Route} color="text-primary">
            <div className="p-3">
              <div className="flex flex-wrap gap-2">
                {airport.sid_star.map(proc => (
                  <span key={proc} className={cn(
                    'text-xs font-mono font-bold px-3 py-1.5 rounded-lg border',
                    proc.includes('STAR')
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  )}>
                    {proc.replace(' STAR', '')} {proc.includes('STAR') ? '↓' : '↑'}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">↑ Departure (SID) · ↓ Arrival (STAR) · Always verify current charts via Jeppesen/Lido</p>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}