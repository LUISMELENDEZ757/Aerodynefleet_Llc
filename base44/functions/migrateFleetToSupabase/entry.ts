import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * migrateFleetToSupabase
 * Migrates all aircraft fleet data and related entities to Supabase.
 * Admin-only operation.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get Supabase service role key
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const projRes = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const projects = await projRes.json();
    const project = projects.find(p => p.name === 'AERODYNEMASTERnumber1') || projects[0];
    if (!project) throw new Error('No Supabase project found');

    const keysRes = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/api-keys`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const keys = await keysRes.json();
    const srKey = keys.find(k => k.name === 'service_role')?.api_key;
    if (!srKey) throw new Error('Service role key not found');

    const sbHeaders = {
      apikey: srKey,
      Authorization: `Bearer ${srKey}`,
      'Content-Type': 'application/json',
    };

    const sbUrl = `https://${project.ref}.supabase.co/rest/v1`;

    // Fetch all Base44 entities
    const [aircraft, flights, logbookEntries, faults, mel, maintenance, componentLifecycle, airworthiness] = await Promise.all([
      base44.entities.Aircraft.list('tail_number', 1000),
      base44.entities.Flight.list('-flight_date', 5000),
      base44.entities.LogbookEntry.list('-created_date', 10000),
      base44.entities.FaultMessage.list('-created_date', 5000),
      base44.entities.MELItem.list('-created_date', 2000),
      base44.entities.MaintenanceEvent.list('-completed_date', 3000),
      base44.entities.ComponentLifecycle.list('-created_date', 2000),
      base44.entities.AirworthinessDirective.list('-created_date', 1000),
    ]);

    console.log(`📦 Migrating: ${aircraft.length} aircraft, ${flights.length} flights, ${logbookEntries.length} logbook entries`);

    // Upsert Aircraft
    const acRes = await fetch(`${sbUrl}/Aircraft?on_conflict=tail_number`, {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify(aircraft),
    });
    if (!acRes.ok) throw new Error(`Aircraft insert failed: ${await acRes.text()}`);

    // Upsert Flights
    if (flights.length > 0) {
      const flRes = await fetch(`${sbUrl}/Flight?on_conflict=id`, {
        method: 'POST',
        headers: sbHeaders,
        body: JSON.stringify(flights.slice(0, 1000)), // Batch limit
      });
      if (!flRes.ok) console.warn(`Flights insert partial: ${await flRes.text()}`);
    }

    // Upsert Logbook Entries
    if (logbookEntries.length > 0) {
      for (let i = 0; i < logbookEntries.length; i += 1000) {
        const batch = logbookEntries.slice(i, i + 1000);
        const lbRes = await fetch(`${sbUrl}/LogbookEntry?on_conflict=id`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify(batch),
        });
        if (!lbRes.ok) console.warn(`Logbook batch ${i} partial insert`);
      }
    }

    // Upsert Faults
    if (faults.length > 0) {
      for (let i = 0; i < faults.length; i += 1000) {
        const batch = faults.slice(i, i + 1000);
        const ftRes = await fetch(`${sbUrl}/FaultMessage?on_conflict=id`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify(batch),
        });
        if (!ftRes.ok) console.warn(`Faults batch ${i} partial insert`);
      }
    }

    // Upsert MEL Items
    if (mel.length > 0) {
      for (let i = 0; i < mel.length; i += 1000) {
        const batch = mel.slice(i, i + 1000);
        const mlRes = await fetch(`${sbUrl}/MELItem?on_conflict=id`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify(batch),
        });
        if (!mlRes.ok) console.warn(`MEL batch ${i} partial insert`);
      }
    }

    // Upsert Maintenance Events
    if (maintenance.length > 0) {
      for (let i = 0; i < maintenance.length; i += 1000) {
        const batch = maintenance.slice(i, i + 1000);
        const mRes = await fetch(`${sbUrl}/MaintenanceEvent?on_conflict=id`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify(batch),
        });
        if (!mRes.ok) console.warn(`Maintenance batch ${i} partial insert`);
      }
    }

    // Upsert Component Lifecycle
    if (componentLifecycle.length > 0) {
      for (let i = 0; i < componentLifecycle.length; i += 1000) {
        const batch = componentLifecycle.slice(i, i + 1000);
        const cRes = await fetch(`${sbUrl}/ComponentLifecycle?on_conflict=id`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify(batch),
        });
        if (!cRes.ok) console.warn(`Components batch ${i} partial insert`);
      }
    }

    // Upsert Airworthiness Directives
    if (airworthiness.length > 0) {
      for (let i = 0; i < airworthiness.length; i += 1000) {
        const batch = airworthiness.slice(i, i + 1000);
        const adRes = await fetch(`${sbUrl}/AirworthinessDirective?on_conflict=id`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify(batch),
        });
        if (!adRes.ok) console.warn(`AD batch ${i} partial insert`);
      }
    }

    return Response.json({
      status: 'completed',
      aircraft: aircraft.length,
      flights: flights.length,
      logbookEntries: logbookEntries.length,
      faults: faults.length,
      mel: mel.length,
      maintenance: maintenance.length,
      components: componentLifecycle.length,
      ads: airworthiness.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});