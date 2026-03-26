import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Generates a random N-series tail number e.g. N455GJ
function randomTail(i) {
  const num = 100 + (i % 900);
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const l1 = letters[Math.floor(i / 26) % letters.length];
  const l2 = letters[i % letters.length];
  return `N${num}${l1}${l2}`;
}

const TYPES = ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9'];
const ENGINES = {
  'B737-700': 'CFM56-7B22',
  'B737-800': 'CFM56-7B27',
  'B737-900': 'CFM56-7B27E',
  'B737 MAX 8': 'LEAP-1B27',
  'B737 MAX 9': 'LEAP-1B28',
};
const PERFORMANCE = {
  'B737-700': 'B737_profile',
  'B737-800': 'B737_profile',
  'B737-900': 'B737_profile',
  'B737 MAX 8': 'B737_profile',
  'B737 MAX 9': 'B737_profile',
};
const BASES = ['KEWR','KLAX','KORD','KDFW','KATL','KSFO','KDEN','KJFK','KBOS','KIAH','KPHX','KSEA','KMCO','KLAS','KMSP'];
const STATUSES = ['active','active','active','active','active','active','active','active','maintenance','oos'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const count = Math.min(body.count || 100, 200); // max 200 per call
    const offset = body.offset || 0;
    const fleetId = body.fleet_id || null;
    const airline = body.airline || 'Aerodyne Mainline';

    const records = [];
    for (let i = 0; i < count; i++) {
      const idx = offset + i;
      const acType = TYPES[idx % TYPES.length];
      records.push({
        tail_number: randomTail(idx),
        msn: `MSN${String(40000 + idx).padStart(6,'0')}`,
        aircraft_type: acType,
        engine_type: ENGINES[acType],
        performance_profile: PERFORMANCE[acType],
        base_station: BASES[idx % BASES.length],
        line_number: String(6000 + idx),
        status: STATUSES[idx % STATUSES.length],
        fleet_id: fleetId,
        airline: airline,
      });
    }

    const created = await base44.asServiceRole.entities.Aircraft.bulkCreate(records);
    return Response.json({ created: created.length, offset, next_offset: offset + count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});