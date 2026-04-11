import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aircraft types config
    const AC_TYPES = [
      { type: 'B737-800', engine: 'CFM56-7B27', etops: 120, cat: 'CAT IIIa', qty: 250 },
      { type: 'B737-900', engine: 'CFM56-7B27', etops: 120, cat: 'CAT IIIa', qty: 125 },
      { type: 'B737 MAX 8', engine: 'LEAP-1B', etops: 180, cat: 'CAT IIIb', qty: 180 },
      { type: 'A320', engine: 'CFM56-5B4', etops: 180, cat: 'CAT IIIb', qty: 100 },
      { type: 'B777', engine: 'GE90', etops: 370, cat: 'CAT IIIc', qty: 90 },
    ];

    const routes = [
      { origin: 'KEWR', destination: 'KJFK', distance: 120 },
      { origin: 'KEWR', destination: 'KORD', distance: 720 },
      { origin: 'KEWR', destination: 'KLAX', distance: 2460 },
      { origin: 'KJFK', destination: 'KORD', distance: 720 },
      { origin: 'KORD', destination: 'KLAX', distance: 1740 },
    ];

    const ataChapters = ['27', '29', '32', '72', '73', '74', '75', '76', '79'];
    const discrepancies = [
      'Oil quantity low on engine 1',
      'Hydraulic pressure fluctuating',
      'Landing gear warning light intermittent',
      'Avionics display flicker',
      'Brake pressure uneven',
    ];

    // Generate aircraft
    const aircraft = [];
    let tailCounter = 100;
    for (const { type, engine, qty } of AC_TYPES) {
      for (let i = 0; i < Math.min(qty, 50); i++) {
        aircraft.push({
          tail_number: `N${String(tailCounter++).padStart(5, '0')}`,
          aircraft_type: type,
          engine_type: engine,
          status: ['active', 'maintenance', 'oos'][Math.floor(Math.random() * 3)],
          base_station: ['KEWR', 'KJFK', 'KORD', 'KLAX'][Math.floor(Math.random() * 4)],
        });
      }
    }

    // Create aircraft in batches
    for (let i = 0; i < aircraft.length; i += 50) {
      const batch = aircraft.slice(i, i + 50);
      await base44.entities.Aircraft.bulkCreate(batch);
    }
    console.log(`✈️ Created ${aircraft.length} aircraft`);

    // Generate flights
    const flights = [];
    const today = new Date();
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
        });
      }
    }

    for (let i = 0; i < flights.length; i += 100) {
      const batch = flights.slice(i, i + 100);
      await base44.entities.Flight.bulkCreate(batch);
    }
    console.log(`✈️ Created ${flights.length} flights`);

    // Generate logbook entries
    const logbookEntries = [];
    for (let i = 0; i < 100; i++) {
      const ac = aircraft[Math.floor(Math.random() * aircraft.length)];
      logbookEntries.push({
        aircraft_tail: ac.tail_number,
        log_page: `LP#${String(i + 1).padStart(4, '0')}`,
        entry_type: 'discrepancy',
        ata_chapter: ataChapters[Math.floor(Math.random() * ataChapters.length)],
        description: discrepancies[Math.floor(Math.random() * discrepancies.length)],
        discrepancy_status: ['OPEN', 'IN_PROGRESS', 'CLOSED'][Math.floor(Math.random() * 3)],
        technician_name: `Tech ${Math.floor(Math.random() * 100)}`,
      });
    }

    for (let i = 0; i < logbookEntries.length; i += 100) {
      const batch = logbookEntries.slice(i, i + 100);
      await base44.entities.LogbookEntry.bulkCreate(batch);
    }
    console.log(`📖 Created ${logbookEntries.length} logbook entries`);

    return Response.json({
      status: 'success',
      aircraft: aircraft.length,
      flights: flights.length,
      logbookEntries: logbookEntries.length,
      message: 'Demo data seeded successfully',
    });
  } catch (error) {
    console.error('seedDemoData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});