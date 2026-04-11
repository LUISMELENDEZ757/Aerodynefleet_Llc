import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const AIRCRAFT_TYPES = [
  { type: 'B737-800',  engine: 'CFM56-7B27',  cat: 'CAT II',  etops: 180, rnp: 'RNP 0.3', mtow: '79.0t' },
  { type: 'B737-900',  engine: 'CFM56-7B27',  cat: 'CAT II',  etops: 180, rnp: 'RNP 0.3', mtow: '85.1t' },
  { type: 'B737 MAX 8',engine: 'LEAP-1B28',   cat: 'CAT IIIa',etops: 180, rnp: 'RNP AR 0.1', mtow: '82.2t' },
  { type: 'B737 MAX 9',engine: 'LEAP-1B28',   cat: 'CAT IIIa',etops: 180, rnp: 'RNP AR 0.1', mtow: '88.3t' },
  { type: 'B757',      engine: 'RB211-535E4', cat: 'CAT III', etops: 370, rnp: 'RNP 0.3', mtow: '86.2t' },
  { type: 'B767',      engine: 'CF6-80C2B6',  cat: 'CAT II',  etops: 180, rnp: 'RNP 0.3', mtow: '179.2t' },
  { type: 'B777',      engine: 'GE90-115B',   cat: 'CAT IIIb',etops: 370, rnp: 'RNP AR 0.1', mtow: '347.8t' },
  { type: 'B787',      engine: 'GEnx-1B76',   cat: 'CAT IIIb',etops: 370, rnp: 'RNP AR 0.1', mtow: '254.0t' },
  { type: 'A320',      engine: 'CFM56-5B4',   cat: 'CAT IIIa',etops: 120, rnp: 'RNP 0.3', mtow: '77.0t' },
  { type: 'A321',      engine: 'CFM56-5B3',   cat: 'CAT IIIa',etops: 120, rnp: 'RNP 0.3', mtow: '93.5t' },
  { type: 'A350',      engine: 'Trent XWB-97',cat: 'CAT IIIb',etops: 370, rnp: 'RNP AR 0.1', mtow: '316.0t' },
  { type: 'E190',      engine: 'GE CF34-10E7',cat: 'CAT I',   etops: 120, rnp: 'RNP 1.0', mtow: '50.3t' },
  { type: 'E175',      engine: 'GE CF34-8E5', cat: 'CAT I',   etops: 120, rnp: 'RNP 1.0', mtow: '38.8t' },
];

const AIRLINES = [
  'Aerodyne Express', 'Aerodyne Express', 'Aerodyne Express',
  'Regional Partners', 'Regional Partners',
  'Aerodyne Cargo', 'Aerodyne Charter',
];

const STATIONS = [
  'KEWR','KLAX','KORD','KDFW','KATL','KBOS','KSEA','KDEN',
  'KPHX','KMIA','KSFO','KJFK','KLAS','KMSP','KDTW','KCLT',
  'KIAH','KFLL','KSLC','KBWI',
];

const STATUSES = ['active','active','active','active','active','active','maintenance','oos'];

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function genTail(i) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const n = String(100 + (i % 900)).padStart(3, '0');
  const l1 = letters[Math.floor(i / 100) % letters.length];
  const l2 = letters[i % letters.length];
  return `N${n}${l1}${l2}`;
}

function genMSN(i) {
  return String(30000 + i);
}

function genDate(yearsAgo) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  d.setMonth(Math.floor(Math.random() * 12));
  d.setDate(1 + Math.floor(Math.random() * 28));
  return d.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const total = 1000;
    const batchSize = 100;
    let created = 0;

    for (let b = 0; b < total / batchSize; b++) {
      const batch = [];
      for (let i = 0; i < batchSize; i++) {
        const idx = b * batchSize + i;
        const ac = randItem(AIRCRAFT_TYPES);
        const yearsAgo = 1 + Math.floor(Math.random() * 18);
        batch.push({
          tail_number:        genTail(idx + 1000), // offset to avoid collisions with existing tails
          aircraft_type:      ac.type,
          engine_type:        ac.engine,
          airline:            randItem(AIRLINES),
          base_station:       randItem(STATIONS),
          status:             randItem(STATUSES),
          msn:                genMSN(idx),
          mtow_variant:       ac.mtow,
          etops_approval:     ac.etops,
          cat_approval:       ac.cat,
          rnp_capability:     ac.rnp,
          rvsm_approved:      true,
          polar_approved:     ac.etops >= 370 && Math.random() > 0.5,
          delivery_date:      genDate(yearsAgo),
          fleet_id:           '',
        });
      }
      await base44.asServiceRole.entities.Aircraft.bulkCreate(batch);
      created += batch.length;
    }

    return Response.json({ success: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});