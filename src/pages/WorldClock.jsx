import { useState, useEffect, useMemo } from 'react';
import { Clock, Globe, Plus, X, Search, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ── World timezone data (IANA timezone IDs) ───────────────────────────────────
const WORLD_ZONES = [
  // Americas
  { id: 'utc',          label: 'UTC / Zulu',           tz: 'UTC',                      region: 'UTC',       abbr: 'UTC'  },
  { id: 'new_york',     label: 'New York',              tz: 'America/New_York',          region: 'Americas',  abbr: 'ET'   },
  { id: 'chicago',      label: 'Chicago',               tz: 'America/Chicago',           region: 'Americas',  abbr: 'CT'   },
  { id: 'denver',       label: 'Denver',                tz: 'America/Denver',            region: 'Americas',  abbr: 'MT'   },
  { id: 'los_angeles',  label: 'Los Angeles',           tz: 'America/Los_Angeles',       region: 'Americas',  abbr: 'PT'   },
  { id: 'anchorage',    label: 'Anchorage',             tz: 'America/Anchorage',         region: 'Americas',  abbr: 'AKT'  },
  { id: 'honolulu',     label: 'Honolulu',              tz: 'Pacific/Honolulu',          region: 'Americas',  abbr: 'HST'  },
  { id: 'toronto',      label: 'Toronto',               tz: 'America/Toronto',           region: 'Americas',  abbr: 'ET'   },
  { id: 'vancouver',    label: 'Vancouver',             tz: 'America/Vancouver',         region: 'Americas',  abbr: 'PT'   },
  { id: 'mexico_city',  label: 'Mexico City',           tz: 'America/Mexico_City',       region: 'Americas',  abbr: 'CST'  },
  { id: 'bogota',       label: 'Bogotá',                tz: 'America/Bogota',            region: 'Americas',  abbr: 'COT'  },
  { id: 'lima',         label: 'Lima',                  tz: 'America/Lima',              region: 'Americas',  abbr: 'PET'  },
  { id: 'sao_paulo',    label: 'São Paulo',             tz: 'America/Sao_Paulo',         region: 'Americas',  abbr: 'BRT'  },
  { id: 'buenos_aires', label: 'Buenos Aires',          tz: 'America/Argentina/Buenos_Aires', region: 'Americas', abbr: 'ART' },
  { id: 'santiago',     label: 'Santiago',              tz: 'America/Santiago',          region: 'Americas',  abbr: 'CLT'  },
  { id: 'caracas',      label: 'Caracas',               tz: 'America/Caracas',           region: 'Americas',  abbr: 'VET'  },

  // Europe
  { id: 'london',       label: 'London',                tz: 'Europe/London',             region: 'Europe',    abbr: 'GMT'  },
  { id: 'paris',        label: 'Paris / Amsterdam',     tz: 'Europe/Paris',              region: 'Europe',    abbr: 'CET'  },
  { id: 'berlin',       label: 'Berlin / Frankfurt',    tz: 'Europe/Berlin',             region: 'Europe',    abbr: 'CET'  },
  { id: 'madrid',       label: 'Madrid',                tz: 'Europe/Madrid',             region: 'Europe',    abbr: 'CET'  },
  { id: 'rome',         label: 'Rome',                  tz: 'Europe/Rome',               region: 'Europe',    abbr: 'CET'  },
  { id: 'zurich',       label: 'Zürich',                tz: 'Europe/Zurich',             region: 'Europe',    abbr: 'CET'  },
  { id: 'amsterdam',    label: 'Amsterdam',             tz: 'Europe/Amsterdam',          region: 'Europe',    abbr: 'CET'  },
  { id: 'brussels',     label: 'Brussels',              tz: 'Europe/Brussels',           region: 'Europe',    abbr: 'CET'  },
  { id: 'lisbon',       label: 'Lisbon',                tz: 'Europe/Lisbon',             region: 'Europe',    abbr: 'WET'  },
  { id: 'stockholm',    label: 'Stockholm',             tz: 'Europe/Stockholm',          region: 'Europe',    abbr: 'CET'  },
  { id: 'oslo',         label: 'Oslo',                  tz: 'Europe/Oslo',               region: 'Europe',    abbr: 'CET'  },
  { id: 'copenhagen',   label: 'Copenhagen',            tz: 'Europe/Copenhagen',         region: 'Europe',    abbr: 'CET'  },
  { id: 'helsinki',     label: 'Helsinki',              tz: 'Europe/Helsinki',           region: 'Europe',    abbr: 'EET'  },
  { id: 'athens',       label: 'Athens',                tz: 'Europe/Athens',             region: 'Europe',    abbr: 'EET'  },
  { id: 'warsaw',       label: 'Warsaw',                tz: 'Europe/Warsaw',             region: 'Europe',    abbr: 'CET'  },
  { id: 'kyiv',         label: 'Kyiv',                  tz: 'Europe/Kyiv',               region: 'Europe',    abbr: 'EET'  },
  { id: 'moscow',       label: 'Moscow',                tz: 'Europe/Moscow',             region: 'Europe',    abbr: 'MSK'  },
  { id: 'istanbul',     label: 'Istanbul',              tz: 'Europe/Istanbul',           region: 'Europe',    abbr: 'TRT'  },
  { id: 'reykjavik',    label: 'Reykjavík',             tz: 'Atlantic/Reykjavik',        region: 'Europe',    abbr: 'GMT'  },

  // Middle East & Africa
  { id: 'dubai',        label: 'Dubai',                 tz: 'Asia/Dubai',                region: 'Middle East', abbr: 'GST' },
  { id: 'riyadh',       label: 'Riyadh',                tz: 'Asia/Riyadh',               region: 'Middle East', abbr: 'AST' },
  { id: 'doha',         label: 'Doha',                  tz: 'Asia/Qatar',                region: 'Middle East', abbr: 'AST' },
  { id: 'kuwait',       label: 'Kuwait City',           tz: 'Asia/Kuwait',               region: 'Middle East', abbr: 'AST' },
  { id: 'tel_aviv',     label: 'Tel Aviv',              tz: 'Asia/Jerusalem',            region: 'Middle East', abbr: 'IST' },
  { id: 'cairo',        label: 'Cairo',                 tz: 'Africa/Cairo',              region: 'Middle East', abbr: 'EET' },
  { id: 'nairobi',      label: 'Nairobi',               tz: 'Africa/Nairobi',            region: 'Africa',    abbr: 'EAT'  },
  { id: 'johannesburg', label: 'Johannesburg',          tz: 'Africa/Johannesburg',       region: 'Africa',    abbr: 'SAST' },
  { id: 'lagos',        label: 'Lagos',                 tz: 'Africa/Lagos',              region: 'Africa',    abbr: 'WAT'  },
  { id: 'casablanca',   label: 'Casablanca',            tz: 'Africa/Casablanca',         region: 'Africa',    abbr: 'WET'  },
  { id: 'accra',        label: 'Accra',                 tz: 'Africa/Accra',              region: 'Africa',    abbr: 'GMT'  },

  // Asia & Pacific
  { id: 'karachi',      label: 'Karachi',               tz: 'Asia/Karachi',              region: 'Asia',      abbr: 'PKT'  },
  { id: 'kolkata',      label: 'Mumbai / Kolkata',      tz: 'Asia/Kolkata',              region: 'Asia',      abbr: 'IST'  },
  { id: 'dhaka',        label: 'Dhaka',                 tz: 'Asia/Dhaka',                region: 'Asia',      abbr: 'BST'  },
  { id: 'yangon',       label: 'Yangon',                tz: 'Asia/Rangoon',              region: 'Asia',      abbr: 'MMT'  },
  { id: 'bangkok',      label: 'Bangkok',               tz: 'Asia/Bangkok',              region: 'Asia',      abbr: 'ICT'  },
  { id: 'ho_chi_minh',  label: 'Ho Chi Minh City',      tz: 'Asia/Ho_Chi_Minh',          region: 'Asia',      abbr: 'ICT'  },
  { id: 'jakarta',      label: 'Jakarta',               tz: 'Asia/Jakarta',              region: 'Asia',      abbr: 'WIB'  },
  { id: 'kuala_lumpur', label: 'Kuala Lumpur',          tz: 'Asia/Kuala_Lumpur',         region: 'Asia',      abbr: 'MYT'  },
  { id: 'singapore',    label: 'Singapore',             tz: 'Asia/Singapore',            region: 'Asia',      abbr: 'SGT'  },
  { id: 'hong_kong',    label: 'Hong Kong',             tz: 'Asia/Hong_Kong',            region: 'Asia',      abbr: 'HKT'  },
  { id: 'shanghai',     label: 'Shanghai / Beijing',    tz: 'Asia/Shanghai',             region: 'Asia',      abbr: 'CST'  },
  { id: 'taipei',       label: 'Taipei',                tz: 'Asia/Taipei',               region: 'Asia',      abbr: 'CST'  },
  { id: 'manila',       label: 'Manila',                tz: 'Asia/Manila',               region: 'Asia',      abbr: 'PHT'  },
  { id: 'seoul',        label: 'Seoul',                 tz: 'Asia/Seoul',                region: 'Asia',      abbr: 'KST'  },
  { id: 'tokyo',        label: 'Tokyo',                 tz: 'Asia/Tokyo',                region: 'Asia',      abbr: 'JST'  },
  { id: 'sydney',       label: 'Sydney',                tz: 'Australia/Sydney',          region: 'Pacific',   abbr: 'AEDT' },
  { id: 'melbourne',    label: 'Melbourne',             tz: 'Australia/Melbourne',       region: 'Pacific',   abbr: 'AEDT' },
  { id: 'brisbane',     label: 'Brisbane',              tz: 'Australia/Brisbane',        region: 'Pacific',   abbr: 'AEST' },
  { id: 'perth',        label: 'Perth',                 tz: 'Australia/Perth',           region: 'Pacific',   abbr: 'AWST' },
  { id: 'auckland',     label: 'Auckland',              tz: 'Pacific/Auckland',          region: 'Pacific',   abbr: 'NZST' },
  { id: 'fiji',         label: 'Fiji',                  tz: 'Pacific/Fiji',              region: 'Pacific',   abbr: 'FJT'  },
  { id: 'guam',         label: 'Guam',                  tz: 'Pacific/Guam',              region: 'Pacific',   abbr: 'ChST' },
];

const REGIONS = ['UTC', 'Americas', 'Europe', 'Middle East', 'Africa', 'Asia', 'Pacific'];

const REGION_COLORS = {
  'UTC':         'text-primary border-primary/40 bg-primary/10',
  'Americas':    'text-blue-300 border-blue-500/30 bg-blue-950/30',
  'Europe':      'text-purple-300 border-purple-500/30 bg-purple-950/30',
  'Middle East': 'text-amber-300 border-amber-500/30 bg-amber-950/30',
  'Africa':      'text-orange-300 border-orange-500/30 bg-orange-950/30',
  'Asia':        'text-red-300 border-red-500/30 bg-red-950/30',
  'Pacific':     'text-cyan-300 border-cyan-500/30 bg-cyan-950/30',
};

const DEFAULT_PINNED = ['utc', 'new_york', 'london', 'dubai', 'tokyo', 'los_angeles', 'sydney', 'singapore'];

// ── Helper: get current time string in a timezone ─────────────────────────────
function getTimeInZone(tz) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(new Date());
}

function getDateInZone(tz) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(new Date());
}

function getUtcOffsetLabel(tz) {
  const now = new Date();
  const utcOffset = -now.getTimezoneOffset(); // local UTC offset
  // Use Intl to compute offset for target tz
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value || '';
  } catch {
    return '';
  }
}

// ── Single clock tile ─────────────────────────────────────────────────────────
function ZoneClock({ zone, onRemove, now }) {
  const timeStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
  }, [now, zone.tz]);

  const dateStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone.tz, weekday: 'short', month: 'short', day: 'numeric',
    }).format(now);
  }, [now, zone.tz]);

  const offsetLabel = useMemo(() => getUtcOffsetLabel(zone.tz), [zone.tz]);

  const hour = parseInt(timeStr.split(':')[0], 10);
  const isNight = hour < 6 || hour >= 21;
  const isEvening = hour >= 18 && hour < 21;
  const isUtc = zone.id === 'utc';

  const regionStyle = REGION_COLORS[zone.region] || 'text-gray-300 border-gray-600/30 bg-gray-900/30';

  return (
    <div className={cn(
      'relative rounded-2xl border p-4 flex flex-col gap-1 group transition-all',
      isUtc
        ? 'bg-primary/10 border-primary/50 shadow-lg shadow-primary/10'
        : 'bg-[#141922] border-white/10 hover:border-white/20',
    )}>
      {/* Remove button */}
      {onRemove && !isUtc && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/50"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}

      {/* Region chip */}
      <span className={cn('self-start text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', regionStyle)}>
        {zone.region}
      </span>

      {/* City label */}
      <p className="text-xs font-bold text-white/90 mt-1 leading-tight truncate pr-4">{zone.label}</p>

      {/* Time */}
      <p className={cn('text-3xl font-black font-mono tracking-wider leading-none mt-1', isUtc ? 'text-primary' : isNight ? 'text-slate-400' : 'text-white')}>
        {timeStr}
      </p>

      {/* Date + offset */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-gray-500">{dateStr}</p>
        <p className="text-[10px] font-mono text-gray-600">{offsetLabel}</p>
      </div>

      {/* Day/night indicator */}
      <div className="flex items-center gap-1 mt-0.5">
        <div className={cn('w-1.5 h-1.5 rounded-full', isNight ? 'bg-slate-600' : isEvening ? 'bg-amber-400' : 'bg-green-400')} />
        <span className="text-[9px] text-gray-600">
          {isNight ? 'Night' : isEvening ? 'Evening' : 'Day'}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorldClock() {
  const [now, setNow] = useState(new Date());
  const [pinned, setPinned] = useState(DEFAULT_PINNED);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pinnedZones = useMemo(() =>
    pinned.map(id => WORLD_ZONES.find(z => z.id === id)).filter(Boolean),
  [pinned]);

  const filteredZones = useMemo(() => {
    return WORLD_ZONES.filter(z => {
      const matchSearch = !search || z.label.toLowerCase().includes(search.toLowerCase()) || z.abbr.toLowerCase().includes(search.toLowerCase());
      const matchRegion = filterRegion === 'All' || z.region === filterRegion;
      return matchSearch && matchRegion;
    });
  }, [search, filterRegion]);

  const zuluStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(now);
  }, [now]);

  const zuluDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(now);
  }, [now]);

  const toggle = (id) => {
    if (id === 'utc') return; // UTC is always pinned
    setPinned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-10">

      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d1117] px-5 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
            <Globe className="w-5 h-5 text-primary" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold tracking-wide">World Clock</h1>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Global Time Zones · {WORLD_ZONES.length} cities</p>
          </div>
        </div>
        <button
          onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Timezone
        </button>
      </div>

      <div className="p-4 space-y-5 max-w-6xl mx-auto">

        {/* Zulu master clock */}
        <div className="rounded-2xl bg-primary/10 border border-primary/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-primary/20 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-xs font-black text-primary uppercase tracking-widest">Coordinated Universal Time (UTC / ZULU)</p>
          </div>
          <div className="px-5 py-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-6xl font-black font-mono text-primary tracking-widest">{zuluStr} Z</p>
              <p className="text-sm text-gray-400 mt-1">{zuluDate}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Unix Timestamp</p>
              <p className="font-mono text-sm text-gray-400">{Math.floor(now.getTime() / 1000)}</p>
            </div>
          </div>
        </div>

        {/* Timezone picker panel */}
        {showPicker && (
          <div className="rounded-2xl bg-[#141922] border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cities or timezone…"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                autoFocus
              />
              <button onClick={() => setShowPicker(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Region filter */}
            <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-white/8">
              {['All', ...REGIONS].map(r => (
                <button key={r} onClick={() => setFilterRegion(r)}
                  className={cn('flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border transition-all',
                    filterRegion === r ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-gray-500 hover:text-white'
                  )}>
                  {r}
                </button>
              ))}
            </div>

            {/* Zone grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto">
              {filteredZones.map(zone => {
                const isPinned = pinned.includes(zone.id);
                const isUtc = zone.id === 'utc';
                return (
                  <button key={zone.id}
                    onClick={() => toggle(zone.id)}
                    disabled={isUtc}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                      isPinned ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-[#0d1117] border-white/8 text-gray-400 hover:text-white hover:border-white/20',
                      isUtc && 'opacity-60 cursor-default',
                    )}>
                    <Star className={cn('w-3 h-3 flex-shrink-0', isPinned ? 'fill-primary text-primary' : 'text-gray-600')} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{zone.label}</p>
                      <p className="text-[9px] text-gray-600">{zone.abbr}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pinned clocks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pinned Clocks — {pinnedZones.length} zones</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pinnedZones.map(zone => (
              <ZoneClock
                key={zone.id}
                zone={zone}
                now={now}
                onRemove={zone.id !== 'utc' ? () => toggle(zone.id) : undefined}
              />
            ))}
          </div>
        </div>

        {/* All zones by region — collapsed list */}
        <div className="space-y-4">
          {REGIONS.filter(r => r !== 'UTC').map(region => {
            const regionZones = WORLD_ZONES.filter(z => z.region === region);
            const regionStyle = REGION_COLORS[region];
            return (
              <RegionRow key={region} region={region} zones={regionZones} regionStyle={regionStyle} now={now} pinned={pinned} onToggle={toggle} />
            );
          })}
        </div>

        {/* Crew / FAR 117 Reference */}
        <div className="rounded-2xl bg-[#141922] border border-white/10 p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">FAR 117 Crew Legality Quick Reference</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Max Flight Duty', value: '9 hours' },
              { label: 'Min Rest Required', value: '10 hours' },
              { label: '2-Pilot Threshold', value: '8 hours' },
              { label: 'Split Duty Max', value: '14 hours' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0d1117] rounded-xl px-3 py-2.5 border border-white/8">
                <p className="text-gray-500 text-[10px] mb-1">{label}</p>
                <p className="font-mono font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Region row (collapsible) ───────────────────────────────────────────────────
function RegionRow({ region, zones, regionStyle, now, pinned, onToggle }) {
  const [open, setOpen] = useState(false);
  const pinnedInRegion = zones.filter(z => pinned.includes(z.id)).length;

  return (
    <div className="rounded-2xl bg-[#141922] border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border', regionStyle)}>
            {region}
          </span>
          <span className="text-xs text-gray-500">{zones.length} cities</span>
          {pinnedInRegion > 0 && (
            <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full">
              {pinnedInRegion} pinned
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-white/8 p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {zones.map(zone => {
            const isPinned = pinned.includes(zone.id);
            const timeStr = new Intl.DateTimeFormat('en-US', {
              timeZone: zone.tz, hour: '2-digit', minute: '2-digit', hour12: false,
            }).format(now);
            const offsetLabel = getUtcOffsetLabel(zone.tz);

            return (
              <button
                key={zone.id}
                onClick={() => onToggle(zone.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                  isPinned ? 'bg-primary/15 border-primary/40' : 'bg-[#0d1117] border-white/8 hover:border-white/20',
                )}
              >
                <Star className={cn('w-3 h-3 flex-shrink-0 transition-colors', isPinned ? 'fill-primary text-primary' : 'text-gray-700')} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{zone.label}</p>
                  <p className="text-[10px] font-mono text-gray-400">{timeStr} <span className="text-gray-600">{offsetLabel}</span></p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}