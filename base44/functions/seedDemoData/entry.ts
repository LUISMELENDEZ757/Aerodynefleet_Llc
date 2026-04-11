import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * seedDemoData
 * Populates the app with realistic demo data: 1000 aircraft + flights, logbook, faults, MEL, etc.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aircraft types and their capabilities — 200 total
    const AC_TYPES = [
      { type: 'B737-800', engine: 'CFM56-7B27', etops: 120, cat: 'CAT IIIa', qty: 50 },
      { type: 'B737-900', engine: 'CFM56-7B27', etops: 120, cat: 'CAT IIIa', qty: 25 },
      { type: 'B737 MAX 8', engine: 'LEAP-1B', etops: 180, cat: 'CAT IIIb', qty: 36 },
      { type: 'B757', engine: 'RB211', etops: 120, cat: 'CAT IIIa', qty: 20 },
      { type: 'B767', engine: 'CF6-80C2', etops: 180, cat: 'CAT IIIb', qty: 16 },
      { type: 'B777', engine: 'GE90', etops: 370, cat: 'CAT IIIc', qty: 18 },
      { type: 'A320', engine: 'CFM56-5B4', etops: 180, cat: 'CAT IIIb', qty: 20 },
      { type: 'A321', engine: 'CFM56-5B3', etops: 180, cat: 'CAT IIIb', qty: 10 },
      { type: 'E190', engine: 'GE CF34-10E5', etops: 0, cat: 'CAT II', qty: 5 },
    ];

    const BASES = ['KEWR', 'KJFK', 'KBOS', 'KORD', 'KDFW', 'KIAH', 'KLAX', 'KSFO', 'KSLC', 'KDEN'];
    const STATUSES = ['active', 'oos', 'maintenance', 'retired'];

    // Generate 200 aircraft
    console.log('Generating 200 aircraft...');
    const aircraft = [];
    let tailCounter = 1;
    for (const acDef of AC_TYPES) {
      for (let i = 0; i < acDef.qty; i++) {
        const tail = `N${String(tailCounter).padStart(5, '0')}X`;
        aircraft.push({
          tail_number: tail,
          aircraft_type: acDef.type,
          msn: String(Math.floor(Math.random() * 50000)).padStart(5, '0'),
          airline: 'Aerodyne Express',
          base_station: BASES[Math.floor(Math.random() * BASES.length)],
          status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
          delivery_date: new Date(2015 + Math.random() * 8).toISOString().split('T')[0],
          engine_type: acDef.engine,
          etops_approval: acDef.etops,
          cat_approval: acDef.cat,
          rvsm_approved: true,
          rnp_capability: 'RNP 0.3',
        });
        tailCounter++;
      }
    }

    // Bulk insert aircraft
    await base44.entities.Aircraft.bulkCreate(aircraft);
    console.log(`✈️ Created ${aircraft.length} aircraft`);

    // Generate flights for next 7 days
    console.log('Generating flights...');
    const flights = [];
    const today = new Date();
    const routes = [
      { origin: 'KEWR', destination: 'KJFK', distance: 200 },
      { origin: 'KJFK', destination: 'KORD', distance: 800 },
      { origin: 'KEWR', destination: 'KLAX', distance: 2450 },
      { origin: 'KORD', destination: 'KSFO', distance: 1750 },
      { origin: 'KLAX', destination: 'KEWR', distance: 2450 },
      { origin: 'KDFW', destination: 'KEWR', distance: 1400 },
      { origin: 'KBOS', destination: 'KORD', distance: 900 },
    ];

    for (let d = 0; d < 3; d++) {
      const flightDate = new Date(today);
      flightDate.setDate(flightDate.getDate() + d);
      const dateStr = flightDate.toISOString().split('T')[0];

      for (let f = 0; f < 10; f++) {
        const route = routes[Math.floor(Math.random() * routes.length)];
        const acIdx = Math.floor(Math.random() * aircraft.length);
        const stdHour = 6 + Math.floor(Math.random() * 16);
        const staHour = stdHour + Math.floor(route.distance / 450);

        flights.push({
          aircraft_tail: aircraft[acIdx].tail_number,
          aircraft_type: aircraft[acIdx].aircraft_type,
          flight_number: `AE${String(f + 1).padStart(4, '0')}`,
          origin: route.origin,
          destination: route.destination,
          flight_date: dateStr,
          scheduled_departure: `${String(stdHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}Z`,
          scheduled_arrival: `${String(staHour % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}Z`,
          status: d === 0 ? (Math.random() > 0.8 ? 'delayed' : 'scheduled') : 'scheduled',
          delay_minutes: Math.random() > 0.8 ? Math.floor(Math.random() * 120) : 0,
          gate: String.fromCharCode(65 + Math.floor(Math.random() * 26)) + (1 + Math.floor(Math.random() * 30)),
        });
      }
    }

    for (let i = 0; i < flights.length; i += 100) {
      const batch = flights.slice(i, i + 100);
      await base44.entities.Flight.bulkCreate(batch);
    }
    console.log(`✈️ Created ${flights.length} flights`);

    // Generate logbook entries
    console.log('Generating logbook entries...');
    const logbookEntries = [];
    const ataChapters = ['27', '29', '32', '72', '73', '74', '75', '76', '79'];
    const discrepancies = [
      'Oil quantity low on engine 1',
      'Hydraulic pressure fluctuating',
      'Landing gear warning light intermittent',
      'Avionics display flicker',
      'Brake pressure uneven',
      'Nose wheel shimmy on landing',
      'Engine vibration on startup',
      'Electrical system anomaly',
    ];

    for (let i = 0; i < 100; i++) {
      const ac = aircraft[Math.floor(Math.random() * aircraft.length)];
      const logPage = `LP#${String(i + 1).padStart(4, '0')}`;
      logbookEntries.push({
        aircraft_tail: ac.tail_number,
        log_page: logPage,
        entry_type: 'discrepancy',
        ata_chapter: ataChapters[Math.floor(Math.random() * ataChapters.length)],
        description: discrepancies[Math.floor(Math.random() * discrepancies.length)],
        discrepancy_status: ['OPEN', 'IN_PROGRESS', 'CLOSED'][Math.floor(Math.random() * 3)],
        technician_name: `Tech ${Math.floor(Math.random() * 100)}`,
        is_deferred: Math.random() > 0.7,
        mel_category: Math.random() > 0.7 ? ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] : null,
      });
    }

    for (let i = 0; i < logbookEntries.length; i += 100) {
      const batch = logbookEntries.slice(i, i + 100);
      await base44.entities.LogbookEntry.bulkCreate(batch);
    }
    console.log(`📖 Created ${logbookEntries.length} logbook entries`);

    // Generate fault messages
    console.log('Generating fault messages...');
    const faults = [];
    const faultCodes = [
      { code: 'E-A1-001', desc: 'Engine 1 Overheat' },
      { code: 'E-A1-002', desc: 'Engine 1 Vibration High' },
      { code: 'H-B2-003', desc: 'Hydraulic Sys B Pressure Low' },
      { code: 'L-C3-004', desc: 'Landing Gear Unsafe' },
      { code: 'A-D4-005', desc: 'Avionics Display Failure' },
      { code: 'E-A1-006', desc: 'Engine 2 EGT High' },
      { code: 'F-E5-007', desc: 'Fuel Pump Failure' },
    ];

    for (let i = 0; i < 50; i++) {
      const ac = aircraft[Math.floor(Math.random() * aircraft.length)];
      const fault = faultCodes[Math.floor(Math.random() * faultCodes.length)];
      faults.push({
        aircraft_tail: ac.tail_number,
        fault_code: fault.code,
        description: fault.desc,
        system: ['engine', 'hydraulics', 'electrical', 'avionics'][Math.floor(Math.random() * 4)],
        severity: ['warning', 'caution', 'advisory'][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.6 ? 'cleared' : 'active',
        ata_chapter: ataChapters[Math.floor(Math.random() * ataChapters.length)],
      });
    }

    for (let i = 0; i < faults.length; i += 50) {
      const batch = faults.slice(i, i + 50);
      await base44.entities.FaultMessage.bulkCreate(batch);
    }
    console.log(`⚠️ Created ${faults.length} fault messages`);

    // Generate maintenance events
    console.log('Generating maintenance events...');
    const maintenanceEvents = [];
    for (let i = 0; i < 60; i++) {
      const ac = aircraft[Math.floor(Math.random() * aircraft.length)];
      maintenanceEvents.push({
        aircraft_tail: ac.tail_number,
        event_type: ['inspection', 'repair', 'component_replacement'][Math.floor(Math.random() * 3)],
        title: `Maintenance Event ${i + 1}`,
        description: `Routine maintenance performed on ${ac.tail_number}`,
        ata_chapter: ataChapters[Math.floor(Math.random() * ataChapters.length)],
        work_hours: Math.floor(Math.random() * 40),
        completed_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        technician_name: `Tech ${Math.floor(Math.random() * 100)}`,
        status: 'completed',
      });
    }

    for (let i = 0; i < maintenanceEvents.length; i += 60) {
      const batch = maintenanceEvents.slice(i, i + 60);
      await base44.entities.MaintenanceEvent.bulkCreate(batch);
    }
    console.log(`🔧 Created ${maintenanceEvents.length} maintenance events`);

    return Response.json({
      status: 'success',
      aircraft: aircraft.length,
      flights: flights.length,
      logbookEntries: logbookEntries.length,
      faults: faults.length,
      maintenanceEvents: maintenanceEvents.length,
      message: 'Demo data seeded successfully',
    });
  } catch (error) {
    console.error('seedDemoData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});