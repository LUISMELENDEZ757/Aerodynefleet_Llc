import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const APPROACHES = ['ILS', 'RNAV', 'VOR', 'NDB', 'Visual', 'GLS'];

/**
 * Centralised data layer for the Logbook module.
 * - Fetches Flight records as base logbook entries.
 * - Maintains locally-added entries (not yet persisted to a dedicated entity).
 * - Exposes search + computed totals.
 */
export function useFlightHistory() {
  const [localEntries, setLocalEntries] = useState([]);
  const [search, setSearch] = useState('');

  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['logbook-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 200),
  });

  const fromFlights = flights.map(f => ({
    id: f.id,
    flight_date: f.flight_date,
    flight_number: f.flight_number,
    origin: f.origin,
    destination: f.destination,
    aircraft_type: f.aircraft_type,
    aircraft_tail: f.aircraft_tail,
    flight_time: null,
    night_time: null,
    instrument_time: null,
    approach_type: null,
    landings: 1,
    pic: false,
    sic: false,
    notes: f.notes || '',
    status: f.status,
    scheduled_departure: f.scheduled_departure,
    scheduled_arrival: f.scheduled_arrival,
    actual_departure: f.actual_departure,
    actual_arrival: f.actual_arrival,
    delay_minutes: f.delay_minutes,
    gate: f.gate,
    _source: 'flight',
  }));

  const allEntries = [...localEntries, ...fromFlights];

  const filtered = allEntries.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.flight_number?.toLowerCase().includes(q) ||
      e.origin?.toLowerCase().includes(q) ||
      e.destination?.toLowerCase().includes(q) ||
      e.aircraft_type?.toLowerCase().includes(q) ||
      e.aircraft_tail?.toLowerCase().includes(q)
    );
  });

  const totalHours    = allEntries.reduce((s, e) => s + (Number(e.flight_time) || 0), 0);
  const totalLandings = allEntries.reduce((s, e) => s + (Number(e.landings)    || 0), 0);
  const totalNight    = allEntries.reduce((s, e) => s + (Number(e.night_time)  || 0), 0);
  const totalIFR      = allEntries.reduce((s, e) => s + (Number(e.instrument_time) || 0), 0);

  const addEntry = (entry) =>
    setLocalEntries(prev => [{ ...entry, id: `local-${Date.now()}`, _source: 'manual' }, ...prev]);

  return {
    allEntries,
    filtered,
    isLoading,
    search,
    setSearch,
    addEntry,
    totals: { hours: totalHours, landings: totalLandings, night: totalNight, ifr: totalIFR, flights: allEntries.length },
    APPROACHES,
  };
}