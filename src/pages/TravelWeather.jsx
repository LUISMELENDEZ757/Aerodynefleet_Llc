import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, Wind, Droplets, Thermometer,
  MapPin, Search, Umbrella, Eye, Gauge, Sunrise, Sunset,
  Waves, TreePalm, Star, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const DESTINATIONS = [
  { name: 'Cancún', country: 'Mexico', emoji: '🇲🇽', lat: 21.16, lon: -86.85, vibe: 'Beach Paradise', temp: 31, feels: 36, humidity: 78, wind: 18, uv: 11, vis: 16, pressure: 1012, condition: 'sunny', high: 33, low: 26, sunrise: '6:14 AM', sunset: '6:58 PM', icon: '☀️', desc: 'Crystal clear skies. Perfect beach day!', activities: ['Snorkeling', 'Beach Volleyball', 'Cenote Swim'] },
  { name: 'Bali', country: 'Indonesia', emoji: '🇮🇩', lat: -8.34, lon: 115.09, vibe: 'Tropical Bliss', temp: 28, feels: 33, humidity: 82, wind: 12, uv: 9, vis: 14, pressure: 1009, condition: 'partly_cloudy', high: 30, low: 24, sunrise: '6:02 AM', sunset: '6:10 PM', icon: '⛅', desc: 'Warm & humid with afternoon clouds.', activities: ['Surfing', 'Temple Visit', 'Rice Terrace Trek'] },
  { name: 'Santorini', country: 'Greece', emoji: '🇬🇷', lat: 36.39, lon: 25.46, vibe: 'Aegean Dream', temp: 24, feels: 26, humidity: 55, wind: 22, uv: 8, vis: 20, pressure: 1018, condition: 'sunny', high: 26, low: 18, sunrise: '6:45 AM', sunset: '7:42 PM', icon: '☀️', desc: 'Mediterranean perfection. Light Meltemi winds.', activities: ['Sunset Cruise', 'Wine Tasting', 'Caldera Hike'] },
  { name: 'Maldives', country: 'Maldives', emoji: '🇲🇻', lat: 3.20, lon: 73.22, vibe: 'Overwater Heaven', temp: 30, feels: 35, humidity: 80, wind: 10, uv: 10, vis: 18, pressure: 1010, condition: 'sunny', high: 31, low: 27, sunrise: '5:55 AM', sunset: '6:05 PM', icon: '☀️', desc: 'Perfect diving & snorkeling conditions.', activities: ['Scuba Diving', 'Dolphin Watching', 'Overwater Dining'] },
  { name: 'Tulum', country: 'Mexico', emoji: '🇲🇽', lat: 20.21, lon: -87.47, vibe: 'Bohemian Coast', temp: 29, feels: 34, humidity: 75, wind: 15, uv: 10, vis: 15, pressure: 1013, condition: 'sunny', high: 31, low: 25, sunrise: '6:18 AM', sunset: '6:55 PM', icon: '☀️', desc: 'Stunning cenotes & turquoise Caribbean.', activities: ['Cenote Swim', 'Ruins Tour', 'Jungle Yoga'] },
  { name: 'Maui', country: 'Hawaii, USA', emoji: '🇺🇸', lat: 20.80, lon: -156.33, vibe: 'Aloha Vibes', temp: 27, feels: 29, humidity: 65, wind: 20, uv: 9, vis: 17, pressure: 1020, condition: 'partly_cloudy', high: 29, low: 22, sunrise: '6:20 AM', sunset: '6:48 PM', icon: '⛅', desc: 'Trade winds keep it fresh. Great surf!', activities: ['Whale Watching', 'Road to Hana', 'Kitesurfing'] },
  { name: 'Ibiza', country: 'Spain', emoji: '🇪🇸', lat: 38.91, lon: 1.43, vibe: 'Mediterranean Sun', temp: 26, feels: 28, humidity: 58, wind: 16, uv: 8, vis: 19, pressure: 1016, condition: 'sunny', high: 28, low: 20, sunrise: '7:10 AM', sunset: '7:55 PM', icon: '☀️', desc: 'Golden sunshine over the Balearics.', activities: ['Beach Clubs', 'Boat Day', 'Sunset at Es Vedrà'] },
  { name: 'Phuket', country: 'Thailand', emoji: '🇹🇭', lat: 7.88, lon: 98.39, vibe: 'Thai Tropics', temp: 32, feels: 38, humidity: 85, wind: 8, uv: 11, vis: 12, pressure: 1007, condition: 'thunderstorm', high: 33, low: 27, sunrise: '6:15 AM', sunset: '6:25 PM', icon: '⛈️', desc: 'Monsoon season — brief heavy showers.', activities: ['Island Hopping', 'Thai Massage', 'Night Market'] },
  { name: 'Nassau', country: 'Bahamas', emoji: '🇧🇸', lat: 25.08, lon: -77.35, vibe: 'Caribbean Paradise', temp: 28, feels: 31, humidity: 76, wind: 14, uv: 10, vis: 17, pressure: 1015, condition: 'sunny', high: 30, low: 24, sunrise: '6:35 AM', sunset: '6:42 PM', icon: '☀️', desc: 'Turquoise waters & white sand beaches.', activities: ['Beach Hopping', 'Snorkeling', 'Water Sports'] },
  { name: 'Aruba', country: 'Aruba', emoji: '🇦🇼', lat: 12.18, lon: -69.96, vibe: 'Sunshine Isle', temp: 30, feels: 33, humidity: 71, wind: 16, uv: 11, vis: 18, pressure: 1013, condition: 'sunny', high: 32, low: 27, sunrise: '6:28 AM', sunset: '6:38 PM', icon: '☀️', desc: 'One Happy Island — perpetually sunny & dry.', activities: ['Windsurfing', 'Ostrich Farm', 'Eagle Beach'] },
  { name: 'St. Lucia', country: 'St. Lucia', emoji: '🇱🇨', lat: 14.01, lon: -60.98, vibe: 'Pitons Paradise', temp: 28, feels: 32, humidity: 78, wind: 12, uv: 10, vis: 15, pressure: 1010, condition: 'partly_cloudy', high: 30, low: 25, sunrise: '6:12 AM', sunset: '6:20 PM', icon: '⛅', desc: 'Dramatic peaks & lush tropical charm.', activities: ['Piton Hiking', 'Sulphur Springs', 'Catamaran Sail'] },
  { name: 'Turks & Caicos', country: 'Turks & Caicos', emoji: '🇹🇨', lat: 21.89, lon: -71.78, vibe: 'Crystal Waters', temp: 29, feels: 33, humidity: 73, wind: 13, uv: 11, vis: 19, pressure: 1014, condition: 'sunny', high: 31, low: 26, sunrise: '6:40 AM', sunset: '6:48 PM', icon: '☀️', desc: 'Some of the world\'s best beaches & diving.', activities: ['Beach Luxury', 'Diving', 'Island Tours'] },
  { name: 'Grand Cayman', country: 'Cayman Islands', emoji: '🇰🇾', lat: 19.30, lon: -81.39, vibe: 'Dive Capital', temp: 28, feels: 32, humidity: 74, wind: 15, uv: 10, vis: 17, pressure: 1012, condition: 'sunny', high: 30, low: 26, sunrise: '6:32 AM', sunset: '6:42 PM', icon: '☀️', desc: 'World-class diving & pristine shores.', activities: ['Scuba Diving', 'Stingray City', 'Beach Dining'] },
  { name: 'Miami', country: 'USA', emoji: '🇺🇸', lat: 25.76, lon: -80.19, vibe: 'Vibrant Beach City', temp: 27, feels: 30, humidity: 72, wind: 10, uv: 9, vis: 12, pressure: 1016, condition: 'partly_cloudy', high: 29, low: 24, sunrise: '6:38 AM', sunset: '6:50 PM', icon: '⛅', desc: 'Sunny beaches, nightlife, & Art Deco charm.', activities: ['Beach Life', 'Art District', 'Water Sports'] },
  { name: 'Puerto Rico', country: 'Puerto Rico', emoji: '🇵🇷', lat: 18.22, lon: -66.59, vibe: 'Tropical Flavor', temp: 29, feels: 33, humidity: 77, wind: 12, uv: 10, vis: 14, pressure: 1011, condition: 'sunny', high: 31, low: 26, sunrise: '6:20 AM', sunset: '6:28 PM', icon: '☀️', desc: 'Beautiful beaches, rainforests & El Yunque.', activities: ['Rainforest Hike', 'Bioluminescent Bay', 'Beach Exploration'] },
];

const CONDITION_CONFIG = {
  sunny:          { bg: 'from-amber-400 via-orange-400 to-yellow-300',   card: 'bg-orange-500/10 border-orange-500/20', badge: 'bg-orange-500/20 text-orange-300' },
  partly_cloudy:  { bg: 'from-sky-400 via-blue-400 to-cyan-300',         card: 'bg-sky-500/10 border-sky-500/20',    badge: 'bg-sky-500/20 text-sky-300' },
  cloudy:         { bg: 'from-slate-500 via-gray-400 to-slate-400',       card: 'bg-slate-500/10 border-slate-500/20',badge: 'bg-slate-500/20 text-slate-300' },
  thunderstorm:   { bg: 'from-purple-700 via-indigo-600 to-blue-700',     card: 'bg-purple-500/10 border-purple-500/20', badge: 'bg-purple-500/20 text-purple-300' },
  rainy:          { bg: 'from-blue-600 via-indigo-500 to-blue-500',       card: 'bg-blue-500/10 border-blue-500/20',  badge: 'bg-blue-500/20 text-blue-300' },
};

function UvIndex({ uv }) {
  const color = uv <= 2 ? 'text-green-400' : uv <= 5 ? 'text-yellow-400' : uv <= 7 ? 'text-orange-400' : uv <= 10 ? 'text-red-400' : 'text-purple-400';
  const label = uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : uv <= 10 ? 'Very High' : 'Extreme';
  return <span className={cn('font-bold', color)}>{uv} {label}</span>;
}

function DestinationCard({ dest, onSelect, selected, convertTemp }) {
  const cfg = CONDITION_CONFIG[dest.condition] || CONDITION_CONFIG.sunny;
  return (
    <motion.button
      onClick={() => onSelect(dest)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative rounded-2xl border p-4 text-left transition-all w-full',
        cfg.card,
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:brightness-110'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{dest.emoji}</span>
            <p className="text-sm font-extrabold text-white">{dest.name}</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{dest.country}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{convertTemp(dest.temp)}°</p>
          <span className="text-lg">{dest.icon}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.badge)}>{dest.vibe}</span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Droplets className="w-3 h-3" />{dest.humidity}%
        </div>
      </div>
    </motion.button>
  );
}

function DetailPanel({ dest, convertTemp, unit }) {
  const cfg = CONDITION_CONFIG[dest.condition] || CONDITION_CONFIG.sunny;

  return (
    <motion.div
      key={dest.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Hero banner */}
      <div className={cn('rounded-2xl bg-gradient-to-br p-6', cfg.bg)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-white/80" />
              <p className="text-sm font-bold text-white/90">{dest.name}, {dest.country} {dest.emoji}</p>
            </div>
            <p className="text-5xl font-black text-white">{convertTemp(dest.temp)}°{unit}</p>
            <p className="text-sm text-white/80 mt-1">Feels like {convertTemp(dest.feels)}°{unit}</p>
            <p className="text-sm text-white mt-2 font-semibold">{dest.desc}</p>
          </div>
          <div className="text-6xl">{dest.icon}</div>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="bg-black/20 rounded-xl px-3 py-2 text-center flex-1">
            <p className="text-xs text-white/70">High</p>
            <p className="text-lg font-bold text-white">{convertTemp(dest.high)}°{unit}</p>
          </div>
          <div className="bg-black/20 rounded-xl px-3 py-2 text-center flex-1">
            <p className="text-xs text-white/70">Low</p>
            <p className="text-lg font-bold text-white">{convertTemp(dest.low)}°{unit}</p>
          </div>
          <div className="bg-black/20 rounded-xl px-3 py-2 text-center flex-1">
            <p className="text-xs text-white/70">UV Index</p>
            <p className="text-lg font-bold text-white">{dest.uv}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: Droplets,    label: 'Humidity',    value: `${dest.humidity}%` },
          { icon: Wind,        label: 'Wind',        value: `${dest.wind} km/h` },
          { icon: Eye,         label: 'Visibility',  value: `${dest.vis} km` },
          { icon: Gauge,       label: 'Pressure',    value: `${dest.pressure} hPa` },
          { icon: Sunrise,     label: 'Sunrise',     value: dest.sunrise },
          { icon: Sunset,      label: 'Sunset',      value: dest.sunset },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl bg-card border border-border px-3 py-3 flex items-center gap-3">
            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* UV Detail */}
      <div className="rounded-xl bg-card border border-border px-4 py-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-yellow-400" /> UV Index
        </p>
        <div className="flex items-center justify-between">
          <UvIndex uv={dest.uv} />
          <span className="text-xs text-muted-foreground">{dest.uv >= 8 ? '🧴 Sunscreen essential!' : dest.uv >= 6 ? '🕶 Wear protection' : '😎 Enjoy safely'}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-purple-500 relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-800 shadow"
            style={{ left: `${Math.min((dest.uv / 12) * 100, 96)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0</span><span>3</span><span>6</span><span>9</span><span>12+</span>
        </div>
      </div>

      {/* Activities */}
      <div className="rounded-xl bg-card border border-border px-4 py-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TreePalm className="w-3.5 h-3.5 text-green-400" /> Top Activities
        </p>
        <div className="flex flex-wrap gap-2">
          {dest.activities.map(a => (
            <span key={a} className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/20">
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Pack tip */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" /> Packing Tip
        </p>
        <p className="text-sm text-amber-200">
          {dest.humidity > 80 ? 'High humidity — pack light, breathable fabrics and extra sunscreen.' :
           dest.wind > 20 ? 'Breezy conditions — bring a light jacket for evenings.' :
           dest.uv >= 10 ? 'Extreme UV — reef-safe SPF 50+ and a hat are must-haves.' :
           dest.condition === 'thunderstorm' ? 'Monsoon season — pack a compact rain poncho for afternoon showers.' :
           'Perfect conditions! Pack your swimsuit and sunglasses. '}
        </p>
      </div>
    </motion.div>
  );
}

export default function TravelWeather() {
  const [selected, setSelected] = useState(DESTINATIONS[0]);
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState('C');

  const convertTemp = (celsius) => unit === 'F' ? Math.round((celsius * 9/5) + 32) : celsius;

  const filtered = DESTINATIONS.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.country.toLowerCase().includes(search.toLowerCase()) ||
    d.vibe.toLowerCase().includes(search.toLowerCase())
  );

  const sunniest = [...DESTINATIONS].sort((a, b) => b.temp - a.temp)[0];

  return (
    <div className="min-h-screen bg-[#0d1117] pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-400" />
                <h1 className="text-xl font-black text-white tracking-wide">Sun Chaser</h1>
              </div>
              <p className="text-xs text-gray-500 font-mono">TRAVEL WEATHER · {new Date().toDateString().toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/30">
              <Waves className="w-3.5 h-3.5" />
              {DESTINATIONS.filter(d => d.condition === 'sunny').length} sunny destinations
            </div>
            <button
              onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
              className="text-xs font-bold bg-primary/20 text-primary px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary/30 transition-colors"
              title={`Switch to ${unit === 'C' ? 'Fahrenheit' : 'Celsius'}`}
            >
              °{unit} / °{unit === 'C' ? 'F' : 'C'}
            </button>
          </div>
        </div>

        {/* Hottest pick banner */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/10 border border-orange-500/20 px-4 py-3">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Hottest Destination Today</p>
          <p className="text-sm font-extrabold text-white">{sunniest.name}, {sunniest.country} — {convertTemp(sunniest.temp)}°{unit} {sunniest.icon}</p>
        </div>
        </div>
        </div>

      <div className="px-5 mt-5 flex flex-col lg:flex-row gap-5">
        {/* Left: destination list */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search destinations…"
              className="w-full bg-[#141922] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {filtered.map(dest => (
              <DestinationCard
                key={dest.name}
                dest={dest}
                onSelect={setSelected}
                selected={selected?.name === dest.name}
                convertTemp={convertTemp}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">No destinations found</p>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 min-w-0">
          {selected && <DetailPanel dest={selected} convertTemp={convertTemp} unit={unit} />}
        </div>
      </div>
    </div>
  );
}