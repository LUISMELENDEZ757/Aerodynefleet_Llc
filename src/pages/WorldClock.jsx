import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Globe, Plane, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

// IATA Delay Codes
const DELAY_CODES = {
  maintenance: [
    { code: '31', label: 'Aircraft Technical' },
    { code: '32', label: 'Maintenance Required' },
    { code: '33', label: 'Cabin Equipment' },
    { code: '34', label: 'Ground Equipment' },
  ],
  crew: [
    { code: '41', label: 'Flight Crew' },
    { code: '42', label: 'Cabin Crew' },
    { code: '43', label: 'Crew Legality' },
  ],
  weather: [
    { code: '71', label: 'Weather at Departure' },
    { code: '72', label: 'Weather Enroute' },
    { code: '73', label: 'Weather at Arrival' },
  ],
  operations: [
    { code: '81', label: 'ATC Restrictions' },
    { code: '82', label: 'Airport Congestion' },
    { code: '83', label: 'Slot Restrictions' },
  ],
  commercial: [
    { code: '91', label: 'Late Passengers' },
    { code: '92', label: 'Late Bags' },
  ],
};

// Aviation hub definitions (name, ICAO, timezone offset from UTC, region)
const AVIATION_HUBS = {
  'North America': [
    { name: 'New York', icao: 'KJFK', tzOffset: -5, region: 'NA' },
    { name: 'Chicago', icao: 'KORD', tzOffset: -6, region: 'NA' },
    { name: 'Denver', icao: 'KDEN', tzOffset: -7, region: 'NA' },
    { name: 'Los Angeles', icao: 'KLAX', tzOffset: -8, region: 'NA' },
  ],
  'Europe': [
    { name: 'London', icao: 'EGLL', tzOffset: 0, region: 'EU' },
    { name: 'Frankfurt', icao: 'EDDF', tzOffset: 1, region: 'EU' },
    { name: 'Paris', icao: 'CDGC', tzOffset: 1, region: 'EU' },
  ],
  'Middle East': [
    { name: 'Dubai', icao: 'OMDB', tzOffset: 4, region: 'ME' },
    { name: 'Doha', icao: 'OTHH', tzOffset: 3, region: 'ME' },
    { name: 'Riyadh', icao: 'OERK', tzOffset: 3, region: 'ME' },
  ],
  'Asia-Pacific': [
    { name: 'Singapore', icao: 'WSSS', tzOffset: 8, region: 'AP' },
    { name: 'Tokyo', icao: 'RJTT', tzOffset: 9, region: 'AP' },
    { name: 'Sydney', icao: 'YSSY', tzOffset: 10, region: 'AP' },
  ],
  'South America': [
    { name: 'São Paulo', icao: 'SBGR', tzOffset: -3, region: 'SA' },
    { name: 'Bogotá', icao: 'SKBO', tzOffset: -5, region: 'SA' },
  ],
  'Africa': [
    { name: 'Johannesburg', icao: 'FAOR', tzOffset: 2, region: 'AF' },
    { name: 'Cairo', icao: 'HECA', tzOffset: 2, region: 'AF' },
  ],
};

// Calculate delay bucket
function getDelayBucket(minutes) {
  if (minutes < 15) return { label: 'D0', color: 'text-green-400', bg: 'bg-green-500/15' };
  if (minutes < 30) return { label: 'D15', color: 'text-orange-400', bg: 'bg-orange-500/15' };
  if (minutes < 60) return { label: 'D30', color: 'text-orange-400', bg: 'bg-orange-500/15' };
  if (minutes < 120) return { label: 'D60', color: 'text-destructive', bg: 'bg-destructive/15' };
  return { label: 'D120+', color: 'text-destructive', bg: 'bg-destructive/15' };
}

// Format time with timezone
function formatTimeInZone(date, tzOffset) {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const zonedDate = new Date(utcDate.getTime() + tzOffset * 3600000);
  return zonedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Calculate block time
function calcBlockTime(std, sta) {
  if (!std || !sta) return null;
  const stdMin = parseInt(std.split(':')[0]) * 60 + parseInt(std.split(':')[1]);
  const staMin = parseInt(sta.split(':')[0]) * 60 + parseInt(sta.split(':')[1]);
  const diffMin = Math.max(0, staMin - stdMin);
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hrs}h${mins.toString().padStart(2, '0')}m`;
}

function TimeZoneCard({ hub, currentTime }) {
  const isDaylight = currentTime.getHours() >= 6 && currentTime.getHours() < 18;
  
  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      <div className="px-3 py-2.5 bg-secondary/40 flex items-center justify-between border-b border-border/50">
        <div>
          <p className="text-sm font-bold text-foreground">{hub.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{hub.icao}</p>
        </div>
        <div className="text-right">
          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto mb-0.5"
            style={{ borderColor: isDaylight ? '#fbbf24' : '#64748b', background: isDaylight ? 'rgba(251, 191, 36, 0.1)' : 'rgba(100, 116, 139, 0.1)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: isDaylight ? '#fbbf24' : '#64748b' }} />
          </div>
          <p className="text-xs text-muted-foreground">{isDaylight ? 'Day' : 'Night'}</p>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-mono font-bold text-foreground">
            {formatTimeInZone(currentTime, hub.tzOffset).split(':')[0]}:{formatTimeInZone(currentTime, hub.tzOffset).split(':')[1]}
          </p>
          <p className="text-xs text-muted-foreground">UTC{hub.tzOffset >= 0 ? '+' : ''}{hub.tzOffset}</p>
        </div>
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
          <p className="text-xs text-muted-foreground flex-1">Local</p>
          <p className="text-xs font-mono text-foreground">{formatTimeInZone(currentTime, hub.tzOffset)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground flex-1">Zulu</p>
          <p className="text-xs font-mono text-blue-400">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}Z</p>
        </div>
      </div>
    </div>
  );
}

function FlightBlockTimeCard({ flight, release }) {
  const std = flight.scheduled_departure;
  const sta = flight.scheduled_arrival;
  const atd = flight.actual_departure;
  const ata = flight.actual_arrival;
  const sbt = calcBlockTime(std, sta);
  const abt = ata && atd ? calcBlockTime(atd, ata) : null;

  const delayMin = flight.delay_minutes || 0;
  const delayBucket = getDelayBucket(delayMin);

  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      <div className="px-3 py-2.5 bg-secondary/40 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-primary" />
          <div>
            <p className="text-sm font-mono font-bold text-foreground">{flight.flight_number}</p>
            <p className="text-xs text-muted-foreground">{flight.origin} → {flight.destination}</p>
          </div>
        </div>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', delayBucket.bg, delayBucket.color)}>
          {delayBucket.label}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">STD</p>
            <p className="font-mono font-bold text-foreground">{std || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">STA</p>
            <p className="font-mono font-bold text-foreground">{sta || '—'}</p>
          </div>
          {atd && (
            <div>
              <p className="text-muted-foreground">ATD</p>
              <p className={cn('font-mono font-bold', delayMin > 0 ? 'text-orange-400' : 'text-green-400')}>{atd}</p>
            </div>
          )}
          {ata && (
            <div>
              <p className="text-muted-foreground">ATA</p>
              <p className="font-mono font-bold text-foreground">{ata}</p>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 pt-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Block Time</p>
            <p className="text-sm font-mono font-bold text-foreground">{sbt || '—'}</p>
          </div>
          {abt && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Actual</p>
              <p className="text-sm font-mono font-bold text-blue-400">{abt}</p>
            </div>
          )}
        </div>

        {delayMin > 0 && flight.delay_reason && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1.5">
            <p className="text-xs text-orange-400 font-semibold">Delay Reason</p>
            <p className="text-xs text-foreground">{flight.delay_reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorldClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: flights = [] } = useQuery({
    queryKey: ['world-clock-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: releases = [] } = useQuery({
    queryKey: ['world-clock-releases', TODAY],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const activeFlights = flights.filter(f => ['airborne', 'departed', 'boarding', 'delayed'].includes(f.status));

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
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Aviation Hub Time Reference</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-blue-400">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}Z</p>
            <p className="text-xs text-muted-foreground">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Regional time zones */}
        {Object.entries(AVIATION_HUBS).map(([region, hubs]) => (
          <div key={region} className="space-y-2">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{region}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {hubs.map(hub => (
                <TimeZoneCard key={hub.icao} hub={hub} currentTime={currentTime} />
              ))}
            </div>
          </div>
        ))}

        {/* Active flights block time */}
        {activeFlights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Active Flights — Block Time</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeFlights.map(f => {
                const rel = releases.find(r => r.flight_number === f.flight_number);
                return <FlightBlockTimeCard key={f.id} flight={f} release={rel} />;
              })}
            </div>
          </div>
        )}

        {/* IATA Delay Codes Reference */}
        <div className="space-y-2">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">IATA Delay Codes Reference</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(DELAY_CODES).map(([category, codes]) => (
              <div key={category} className="rounded-lg bg-card border border-border overflow-hidden">
                <div className="px-3 py-2 bg-secondary/40 border-b border-border/50">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">{category}</p>
                </div>
                <div className="p-2 space-y-1">
                  {codes.map(({ code, label }) => (
                    <div key={code} className="flex items-start gap-2 text-xs">
                      <span className="font-mono font-bold text-primary flex-shrink-0">{code}</span>
                      <span className="text-muted-foreground flex-1">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}