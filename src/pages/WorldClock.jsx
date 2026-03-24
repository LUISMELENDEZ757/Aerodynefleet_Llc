import { useState, useEffect } from 'react';
import { Clock, Globe, Plus, X } from 'lucide-react';
import { TimeEngine, STATION_OFFSETS } from '@/lib/TimeEngine';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MAJOR_STATIONS = [
  'KEWR', 'KJFK', 'KORD', 'KMCO', 'KLAX', 'KSFO', 'KDFW', 'KATL',
  'KBOS', 'KDCA', 'KSEA', 'KDEN', 'KTPA', 'KMDW', 'KIAH', 'KLAS'
];

function StationClock({ code, offset }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const localTime = new Date(time.getTime() + offset * 60 * 60 * 1000);
  const h = String(localTime.getHours()).padStart(2, '0');
  const m = String(localTime.getMinutes()).padStart(2, '0');
  const s = String(localTime.getSeconds()).padStart(2, '0');
  const offsetStr = `UTC${offset >= 0 ? '+' : ''}${offset}`;

  return (
    <div className="rounded-xl bg-card border border-border p-4 flex flex-col items-center text-center space-y-2">
      <p className="text-sm font-mono font-bold text-foreground">{code}</p>
      <p className="text-3xl font-mono font-extrabold text-primary">{h}:{m}:{s}</p>
      <p className="text-xs text-muted-foreground">{offsetStr}</p>
    </div>
  );
}

export default function WorldClock() {
  const [selectedStations, setSelectedStations] = useState(['KEWR', 'KORD', 'KMCO', 'KLAX']);
  const [showPicker, setShowPicker] = useState(false);
  const [zuluTime, setZuluTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setZuluTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const zuluH = String(zuluTime.getHours()).padStart(2, '0');
  const zuluM = String(zuluTime.getMinutes()).padStart(2, '0');
  const zuluS = String(zuluTime.getSeconds()).padStart(2, '0');

  const toggleStation = (code) => {
    if (selectedStations.includes(code)) {
      setSelectedStations(selectedStations.filter(s => s !== code));
    } else {
      setSelectedStations([...selectedStations, code]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Globe className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">World Clock</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Global Time Engine · Station Offsets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Zulu Master Clock */}
        <div className="rounded-xl bg-card border border-primary/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-primary/30 bg-primary/10 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Coordinated Universal Time (Zulu)</p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <p className="text-5xl font-mono font-extrabold text-primary">{zuluH}:{zuluM}:{zuluS}</p>
            <p className="text-sm text-muted-foreground">UTC ± 0</p>
          </div>
        </div>

        {/* Station Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Aviation Hubs</p>
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary rounded-lg px-3 py-1.5 transition-colors"
            >
              <Plus className="w-3 h-3" /> Customize
            </button>
          </div>

          {/* Station picker */}
          {showPicker && (
            <div className="mb-4 rounded-xl bg-card border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Select stations:</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {MAJOR_STATIONS.map(code => (
                  <button
                    key={code}
                    onClick={() => toggleStation(code)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-bold transition-all',
                      selectedStations.includes(code)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground py-1 mt-2"
              >
                Close
              </button>
            </div>
          )}

          {/* Station clocks grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedStations.map(code => (
              <StationClock key={code} code={code} offset={STATION_OFFSETS[code] || 0} />
            ))}
          </div>
        </div>

        {/* Reference info */}
        <div className="rounded-xl bg-card border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Crew Legality Reference (FAR 117)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Max Flight Duty</p>
              <p className="font-mono font-bold text-foreground">9 hours</p>
            </div>
            <div>
              <p className="text-muted-foreground">Min Rest Required</p>
              <p className="font-mono font-bold text-foreground">10 hours</p>
            </div>
            <div>
              <p className="text-muted-foreground">2-Pilot Threshold</p>
              <p className="font-mono font-bold text-foreground">8 hours</p>
            </div>
            <div>
              <p className="text-muted-foreground">Split Duty Max</p>
              <p className="font-mono font-bold text-foreground">14 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}