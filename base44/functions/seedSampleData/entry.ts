import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Sample aircraft
    const aircraft = await base44.asServiceRole.entities.Aircraft.bulkCreate([
      { tail_number: 'N455GJ', aircraft_type: 'B737-800', airline: 'Aerodyne Fleet LLC', base_station: 'KEWR', status: 'active' },
      { tail_number: 'N789AB', aircraft_type: 'B737-900', airline: 'Aerodyne Fleet LLC', base_station: 'KEWR', status: 'active' },
      { tail_number: 'N123CD', aircraft_type: 'B757', airline: 'Aerodyne Fleet LLC', base_station: 'KJFK', status: 'active' },
    ]);

    // Sample flights
    const flights = await base44.asServiceRole.entities.Flight.bulkCreate([
      { flight_number: 'AER101', flight_date: today, origin: 'KEWR', destination: 'KMCO', aircraft_tail: 'N455GJ', aircraft_type: 'B737-800', status: 'scheduled', scheduled_departure: '06:00', scheduled_arrival: '09:30', gate: 'A12' },
      { flight_number: 'AER202', flight_date: today, origin: 'KMCO', destination: 'KORD', aircraft_tail: 'N789AB', aircraft_type: 'B737-900', status: 'scheduled', scheduled_departure: '11:00', scheduled_arrival: '13:45', gate: 'B05' },
      { flight_number: 'AER303', flight_date: today, origin: 'KORD', destination: 'KEWR', aircraft_tail: 'N123CD', aircraft_type: 'B757', status: 'scheduled', scheduled_departure: '16:00', scheduled_arrival: '20:30', gate: 'C08' },
    ]);

    // Sample crew assignments
    const crews = await base44.asServiceRole.entities.CrewAssignment.bulkCreate([
      { flight_number: 'AER101', flight_date: today, crew_name: 'John Smith', role: 'captain', duty_start: '05:00', duty_end: '11:00', rest_hours_prior: 12, legal_status: 'legal' },
      { flight_number: 'AER101', flight_date: today, crew_name: 'Jane Doe', role: 'first_officer', duty_start: '05:00', duty_end: '11:00', rest_hours_prior: 10, legal_status: 'legal' },
      { flight_number: 'AER202', flight_date: today, crew_name: 'Mike Johnson', role: 'captain', duty_start: '09:00', duty_end: '15:00', rest_hours_prior: 11, legal_status: 'legal' },
    ]);

    // Sample dispatch releases
    const releases = await base44.asServiceRole.entities.DispatchRelease.bulkCreate([
      { flight_number: 'AER101', flight_date: today, aircraft_tail: 'N455GJ', release_status: 'released', fuel_on_board: 45000, min_fuel_required: 38000, alternate: 'KTPA', dispatcher_name: 'Tom Brown' },
      { flight_number: 'AER202', flight_date: today, aircraft_tail: 'N789AB', release_status: 'released', fuel_on_board: 48000, min_fuel_required: 40000, alternate: 'KMDW', dispatcher_name: 'Tom Brown' },
    ]);

    // Sample fuel records
    const fuel = await base44.asServiceRole.entities.FuelRecord.bulkCreate([
      { flight_number: 'AER101', aircraft_tail: 'N455GJ', flight_date: today, station: 'KEWR', planned_fuel: 38000, actual_uplift: 45000, fuel_on_departure: 45000, trip_fuel_planned: 28000, trip_fuel_actual: 28500, variance_percent: 1.8, release_status: 'confirmed' },
    ]);

    // Sample MEL items
    const mel = await base44.asServiceRole.entities.MELItem.bulkCreate([
      { aircraft_tail: 'N455GJ', aircraft_type: 'B737-800', ata_chapter: '21-31', item_number: '001', description: 'Cabin air filter', category: 'D', deferred_date: today, expiry_date: '2026-04-24', status: 'open' },
    ]);

    // Sample OpsAlerts
    const alerts = await base44.asServiceRole.entities.OpsAlert.bulkCreate([
      { alert_type: 'flight_status', severity: 'info', title: 'Good operational day', message: 'All flights on schedule', target_roles: ['dispatcher'] },
    ]);

    // Sample Starlink terminals
    const starlink = await base44.asServiceRole.entities.StarlinkTerminal.bulkCreate([
      { aircraft_tail: 'N455GJ', aircraft_type: 'B737-800', terminal_id: 'SL-001', activation_status: 'active', signal_quality: 92, download_mbps: 150, upload_mbps: 30, latency_ms: 35, uptime_percent: 99.8, satellites_visible: 12 },
      { aircraft_tail: 'N789AB', aircraft_type: 'B737-900', terminal_id: 'SL-002', activation_status: 'active', signal_quality: 88, download_mbps: 140, upload_mbps: 28, latency_ms: 38, uptime_percent: 99.5, satellites_visible: 11 },
    ]);

    // Sample comm messages
    const comm = await base44.asServiceRole.entities.CommMessage.bulkCreate([
      { channel: 'ops-general', sender_name: 'DISPATCHER', sender_email: 'dispatch@aerodyne.local', sender_role: 'dispatcher', content: 'Good morning operations team', message_type: 'chat', priority: 'normal' },
    ]);

    return Response.json({
      success: true,
      created: {
        aircraft: aircraft.length,
        flights: flights.length,
        crews: crews.length,
        releases: releases.length,
        fuel: fuel.length,
        mel: mel.length,
        alerts: alerts.length,
        starlink: starlink.length,
        messages: comm.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});