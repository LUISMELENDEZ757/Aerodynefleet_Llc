import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FA_BASE = 'https://aeroapi.flightaware.com/aeroapi';
const FA_KEY = Deno.env.get('FLIGHTAWARE_API_KEY');

async function faGet(path) {
  const res = await fetch(`${FA_BASE}${path}`, {
    headers: { 'x-apikey': FA_KEY }
  });
  if (!res.ok) return null;
  return res.json();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Fetch all active aircraft
  const aircraft = await base44.asServiceRole.entities.Aircraft.list('tail_number', 1000);
  const active = aircraft.filter(a => a.status === 'active' || a.status === 'maintenance');

  const results = { updated: 0, skipped: 0, errors: 0 };

  for (const ac of active) {
    const tail = ac.tail_number?.trim();
    if (!tail) { results.skipped++; continue; }

    // Query FlightAware for most recent flight by tail
    const data = await faGet(`/flights/${encodeURIComponent(tail)}?max_pages=1&per_page=1`);

    if (!data || !data.flights || data.flights.length === 0) {
      results.skipped++;
      continue;
    }

    const flight = data.flights[0];

    // Map FlightAware status to our status enum
    const faStatus = flight.status?.toLowerCase() || '';
    let newStatus = ac.status;
    if (faStatus.includes('cancelled')) newStatus = 'oos';
    else if (faStatus.includes('landed') || faStatus.includes('arrived')) newStatus = 'active';
    else if (faStatus.includes('en route') || faStatus.includes('airborne')) newStatus = 'active';
    else if (faStatus.includes('scheduled') || faStatus.includes('filed')) newStatus = 'active';

    // Find or update the matching Flight record
    const flightNumber = flight.ident || flight.flight_number || '';
    const origin = flight.origin?.code_icao || flight.origin?.code || '';
    const destination = flight.destination?.code_icao || flight.destination?.code || '';
    const scheduledDep = flight.scheduled_out ? new Date(flight.scheduled_out).toISOString().split('T')[1].substring(0,5) : null;
    const scheduledArr = flight.scheduled_in ? new Date(flight.scheduled_in).toISOString().split('T')[1].substring(0,5) : null;
    const actualDep = flight.actual_out ? new Date(flight.actual_out).toISOString().split('T')[1].substring(0,5) : null;
    const actualArr = flight.actual_in ? new Date(flight.actual_in).toISOString().split('T')[1].substring(0,5) : null;
    const flightDate = flight.scheduled_out ? new Date(flight.scheduled_out).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Map FlightAware status to Flight entity status enum
    let flightStatus = 'scheduled';
    if (faStatus.includes('en route') || faStatus.includes('airborne')) flightStatus = 'airborne';
    else if (faStatus.includes('landed')) flightStatus = 'landed';
    else if (faStatus.includes('arrived')) flightStatus = 'arrived';
    else if (faStatus.includes('cancelled')) flightStatus = 'cancelled';
    else if (faStatus.includes('departed')) flightStatus = 'departed';
    else if (faStatus.includes('delayed')) flightStatus = 'delayed';

    const delayMinutes = flight.departure_delay ? Math.round(flight.departure_delay / 60) : 0;

    // Try to find existing Flight record for this tail + today
    const existingFlights = await base44.asServiceRole.entities.Flight.filter({
      aircraft_tail: tail,
      flight_date: flightDate,
    });

    if (existingFlights.length > 0) {
      // Update the most recent one
      await base44.asServiceRole.entities.Flight.update(existingFlights[0].id, {
        status: flightStatus,
        scheduled_departure: scheduledDep,
        scheduled_arrival: scheduledArr,
        actual_departure: actualDep,
        actual_arrival: actualArr,
        delay_minutes: delayMinutes,
        flight_number: flightNumber || existingFlights[0].flight_number,
        origin: origin || existingFlights[0].origin,
        destination: destination || existingFlights[0].destination,
      });
    } else if (flightNumber && origin && destination) {
      // Create a new flight record
      await base44.asServiceRole.entities.Flight.create({
        flight_number: flightNumber,
        aircraft_tail: tail,
        aircraft_type: ac.aircraft_type,
        origin,
        destination,
        flight_date: flightDate,
        status: flightStatus,
        scheduled_departure: scheduledDep,
        scheduled_arrival: scheduledArr,
        actual_departure: actualDep,
        actual_arrival: actualArr,
        delay_minutes: delayMinutes,
        airline: ac.airline || '',
        fleet_id: ac.fleet_id || '',
      });
    }

    // Update aircraft base_station to current position if landed/arrived
    if ((flightStatus === 'landed' || flightStatus === 'arrived') && destination) {
      await base44.asServiceRole.entities.Aircraft.update(ac.id, {
        base_station: destination,
        status: newStatus,
      });
    } else if (newStatus !== ac.status) {
      await base44.asServiceRole.entities.Aircraft.update(ac.id, { status: newStatus });
    }

    results.updated++;
  }

  console.log(`Fleet sync complete: ${results.updated} updated, ${results.skipped} skipped, ${results.errors} errors`);
  return Response.json({ success: true, ...results, total: active.length });
});