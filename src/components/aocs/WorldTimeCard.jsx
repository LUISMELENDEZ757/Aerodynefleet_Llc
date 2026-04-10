import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMMON_ZONES = [
  { name: 'New York', tz: 'America/New_York', code: 'EST/EDT' },
  { name: 'Los Angeles', tz: 'America/Los_Angeles', code: 'PST/PDT' },
  { name: 'London', tz: 'Europe/London', code: 'GMT/BST' },
  { name: 'Paris', tz: 'Europe/Paris', code: 'CET/CEST' },
  { name: 'Dubai', tz: 'Asia/Dubai', code: 'GST' },
  { name: 'Tokyo', tz: 'Asia/Tokyo', code: 'JST' },
  { name: 'Sydney', tz: 'Australia/Sydney', code: 'AEDT/AEST' },
  { name: 'UTC', tz: 'UTC', code: 'UTC' },
];

function TimeZoneDisplay({ name, tz, onRemove }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: '2-digit',
  });

  const getUTCOffset = () => {
    const now = new Date();
    const tzString = now.toLocaleString('en-US', { timeZone: tz });
    const tzDate = new Date(tzString);
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offsetMs = tzDate - utcDate;
    const offsetHours = Math.floor(offsetMs / 3600000);
    const sign = offsetHours >= 0 ? '+' : '';
    return `UTC${sign}${offsetHours}`;
  };

  return (
    <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 border border-border hover:border-primary/30 transition-colors group">
      <div className="flex-1">
        <p className="text-sm font-bold text-primary">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{getUTCOffset()}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-foreground font-mono">{formatter.format(time)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{dateFormatter.format(time)}</p>
      </div>
      <button
        onClick={() => onRemove(tz)}
        className="ml-3 flex-shrink-0 w-7 h-7 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function WorldTimeCard() {
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem('aocsTimeZones');
    return saved ? JSON.parse(saved) : [COMMON_ZONES[0], COMMON_ZONES[1], COMMON_ZONES[7]];
  });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem('aocsTimeZones', JSON.stringify(zones));
  }, [zones]);

  const addZone = (zone) => {
    if (!zones.find(z => z.tz === zone.tz)) {
      setZones([...zones, zone]);
    }
    setShowDropdown(false);
  };

  const removeZone = (tz) => {
    setZones(zones.filter(z => z.tz !== tz));
  };

  const availableZones = COMMON_ZONES.filter(z => !zones.find(existing => existing.tz === z.tz));

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">World Time Zones</p>
          <p className="text-xs text-muted-foreground mt-0.5">AOCS Operations Hub</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg z-30 min-w-[200px] py-1">
                {availableZones.length === 0 ? (
                  <p className="px-4 py-2 text-xs text-muted-foreground">All zones added</p>
                ) : (
                  availableZones.map(zone => (
                    <button
                      key={zone.tz}
                      onClick={() => addZone(zone)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 transition-colors"
                    >
                      {zone.name} <span className="text-muted-foreground">({zone.code})</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {zones.map(zone => (
          <TimeZoneDisplay key={zone.tz} name={zone.name} tz={zone.tz} onRemove={removeZone} />
        ))}
      </div>
    </div>
  );
}