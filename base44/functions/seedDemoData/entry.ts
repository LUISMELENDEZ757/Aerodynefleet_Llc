import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Demo fleet data
    const fleets = [
      { name: 'Aerodyne Express', icao_code: 'AEX', iata_code: 'AX', callsign: 'AERODYNE', hub_station: 'KEWR', fleet_type: 'mainline', aircraft_types: ['B737-800', 'B757'], color: '#3b82f6', total_aircraft: 12, status: 'active' },
      { name: 'Regional Partners', icao_code: 'RPA', iata_code: 'RP', callsign: 'REGIONAL', hub_station: 'KDFW', fleet_type: 'regional', aircraft_types: ['E190', 'CRJ900'], color: '#8b5cf6', total_aircraft: 8, status: 'active' },
    ];

    // Demo aircraft
    const aircraftData = [
      { tail_number: 'N455GJ', fleet_id: '', airline: 'Aerodyne Express', aircraft_type: 'B737-800', msn: '28000', line_number: '1234', base_station: 'KEWR', status: 'active', delivery_date: '2015-03-20', engine_type: 'CFM56-7B27', mtow_variant: '79.0t', etops_approval: 180, cat_approval: 'CAT II', rvsm_approved: true, rnp_capability: 'RNP 0.3' },
      { tail_number: 'N789HK', fleet_id: '', airline: 'Aerodyne Express', aircraft_type: 'B737-800', msn: '28001', line_number: '1235', base_station: 'KEWR', status: 'active', delivery_date: '2015-04-10', engine_type: 'CFM56-7B27', mtow_variant: '79.0t', etops_approval: 180, cat_approval: 'CAT II', rvsm_approved: true, rnp_capability: 'RNP 0.3' },
      { tail_number: 'N123AB', fleet_id: '', airline: 'Regional Partners', aircraft_type: 'E190', msn: '19000045', line_number: '4500', base_station: 'KDFW', status: 'active', delivery_date: '2018-06-15', engine_type: 'GE CF34-10E7', mtow_variant: '50.3t', etops_approval: 120, cat_approval: 'CAT I', rvsm_approved: true, rnp_capability: 'RNP 1.0' },
      { tail_number: 'N456CD', fleet_id: '', airline: 'Aerodyne Express', aircraft_type: 'B757', msn: '25000', line_number: '2000', base_station: 'KEWR', status: 'oos', delivery_date: '2008-02-01', engine_type: 'RB211-535', mtow_variant: '86.2t', etops_approval: 370, cat_approval: 'CAT III', rvsm_approved: true, rnp_capability: 'RNP 0.3' },
    ];

    // Demo flights for today
    const today = new Date().toISOString().split('T')[0];
    const flightsData = [
      { flight_number: 'AEX101', fleet_id: '', airline: 'Aerodyne Express', aircraft_tail: 'N455GJ', aircraft_type: 'B737-800', origin: 'KEWR', destination: 'KLAX', flight_date: today, status: 'airborne', scheduled_departure: '10:00', scheduled_arrival: '13:00', actual_departure: '10:05', gate: 'B12', delay_minutes: 5 },
      { flight_number: 'AEX102', fleet_id: '', airline: 'Aerodyne Express', aircraft_tail: 'N789HK', aircraft_type: 'B737-800', origin: 'KEWR', destination: 'KORD', flight_date: today, status: 'scheduled', scheduled_departure: '14:30', scheduled_arrival: '15:45', gate: 'B15', delay_minutes: 0 },
      { flight_number: 'RPA201', fleet_id: '', airline: 'Regional Partners', aircraft_tail: 'N123AB', aircraft_type: 'E190', origin: 'KDFW', destination: 'KATL', flight_date: today, status: 'departed', scheduled_departure: '08:00', scheduled_arrival: '09:30', actual_departure: '08:00', delay_minutes: 0 },
      { flight_number: 'AEX103', fleet_id: '', airline: 'Aerodyne Express', aircraft_tail: 'N456CD', aircraft_type: 'B757', origin: 'KEWR', destination: 'KBOS', flight_date: today, status: 'delayed', scheduled_departure: '09:00', scheduled_arrival: '10:15', delay_minutes: 45, delay_reason: 'Maintenance check' },
    ];

    // Demo logbook entries
    const logbookData = [
      { aircraft_tail: 'N455GJ', entry_type: 'discrepancy', description: '[LINE MX] APU bleed air valve slow to open - squawk logged', ata_chapter: '49', discrepancy_status: 'OPEN', technician_name: 'John Smith', station: 'KEWR' },
      { aircraft_tail: 'N789HK', entry_type: 'discrepancy', description: '[LINE MX] Right hand engine oil pressure fluctuating - requires investigation', ata_chapter: '79', discrepancy_status: 'IN_PROGRESS', technician_name: 'Maria Garcia', station: 'KEWR' },
      { aircraft_tail: 'N123AB', entry_type: 'corrective_action', description: '[LINE MX] Replaced faulty proximity switch on landing gear - tested and cleared', ata_chapter: '32', discrepancy_status: 'CLOSED', technician_name: 'Robert Chen', station: 'KDFW' },
    ];

    // Demo MEL items
    const melData = [
      { aircraft_tail: 'N455GJ', description: 'One air conditioning pack inoperative', category: 'B', mel_reference: 'MEL 21-2', flight_restrictions: 'Single pack operations only, max 35,000 ft', deferred_date: new Date().toISOString().split('T')[0], status: 'open', expiry_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
      { aircraft_tail: 'N789HK', description: 'Standby attitude indicator inoperative', category: 'C', mel_reference: 'MEL 31-1', flight_restrictions: 'None - autopilot must be functional', deferred_date: new Date().toISOString().split('T')[0], status: 'open', expiry_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] },
    ];

    // Demo alerts
    const alertsData = [
      { alert_type: 'mx', severity: 'warning', title: 'N456CD OOS - Scheduled C-Check', message: 'Aircraft N456CD out of service for 40-hour C-check. Expected RTS 2026-04-15.', aircraft_tail: 'N456CD', target_roles: ['dispatcher', 'all'], is_read: false, is_dismissed: false },
      { alert_type: 'flight_status', severity: 'info', title: 'AEX101 Airborne', message: 'Flight AEX101 (KEWR-KLAX) departed on schedule, now en route.', flight_number: 'AEX101', aircraft_tail: 'N455GJ', target_roles: ['dispatcher', 'all'], is_read: false, is_dismissed: false },
    ];

    // Bulk create all demo data
    await Promise.all([
      base44.asServiceRole.entities.Fleet.bulkCreate(fleets),
      base44.asServiceRole.entities.Aircraft.bulkCreate(aircraftData),
      base44.asServiceRole.entities.Flight.bulkCreate(flightsData),
      base44.asServiceRole.entities.LogbookEntry.bulkCreate(logbookData),
      base44.asServiceRole.entities.MELItem.bulkCreate(melData),
      base44.asServiceRole.entities.OpsAlert.bulkCreate(alertsData),
    ]);

    return Response.json({ success: true, message: 'Demo data seeded successfully' });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});