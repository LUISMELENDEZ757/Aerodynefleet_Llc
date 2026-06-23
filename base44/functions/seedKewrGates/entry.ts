import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    const kewrGates = [
      // Terminal A: 33 gates (A1-A33)
      ...Array.from({ length: 33 }, (_, i) => ({
        code: `A${i + 1}`,
        name: `A${i + 1}`,
        type: 'gate',
        terminal: 'A',
        label: i < 10 ? 'Domestic' : i < 20 ? 'International' : 'Wide-body',
        numeric: i + 1,
        station_icao: 'KEWR',
        occupied: false,
        flight: null,
      })),
      // Terminal B: 27 gates across 3 concourses
      // B1: Gates B40-B47 (10 gates)
      ...Array.from({ length: 10 }, (_, i) => ({
        code: `B${40 + i}`,
        name: `B${40 + i}`,
        type: 'gate',
        terminal: 'B',
        label: 'International - Concourse B1',
        numeric: 40 + i,
        station_icao: 'KEWR',
        occupied: false,
        flight: null,
      })),
      // B2: Gates B51-B58 (8 gates)
      ...Array.from({ length: 8 }, (_, i) => ({
        code: `B${51 + i}`,
        name: `B${51 + i}`,
        type: 'gate',
        terminal: 'B',
        label: 'International - Concourse B2',
        numeric: 51 + i,
        station_icao: 'KEWR',
        occupied: false,
        flight: null,
      })),
      // B3: Gates B60-B68 (9 gates)
      ...Array.from({ length: 9 }, (_, i) => ({
        code: `B${60 + i}`,
        name: `B${60 + i}`,
        type: 'gate',
        terminal: 'B',
        label: 'International - Concourse B3',
        numeric: 60 + i,
        station_icao: 'KEWR',
        occupied: false,
        flight: null,
      })),
      // Terminal C: United Airlines (exclusive) - ~63 gates
      // C1: Gates C70-C99 (30 gates)
      ...Array.from({ length: 30 }, (_, i) => ({
        code: `C${70 + i}`,
        name: `C${70 + i}`,
        type: 'gate',
        terminal: 'C',
        label: 'United - Concourse C1',
        numeric: 70 + i,
        station_icao: 'KEWR',
        occupied: false,
        flight: null,
      })),
      // C2: Gates C101-C113 (13 gates)
      ...Array.from({ length: 13 }, (_, i) => ({
        code: `C${101 + i}`,
        name: `C${101 + i}`,
        type: 'gate',
        terminal: 'C',
        label: 'United - Concourse C2',
        numeric: 101 + i,
        station_icao: 'KEWR',
        occupied: false,
        flight: null,
      })),
      // C3: Gates C120-C139 (20 gates)
      ...Array.from({ length: 20 }, (_, i) => ({
        code: `C${120 + i}`,
        name: `C${120 + i}`,
        type: 'gate',
        terminal: 'C',
        label: 'United - Concourse C3',
        numeric: 120 + i,
        station_icao: 'KEWR',
        occupied: false,
        flight: null,
      })),
    ];
    
    // Check if all 120 gates already exist
    const existingGates = await base44.entities.Gate.filter({ station_icao: 'KEWR' }, 'code', 500);
    
    if (existingGates.length >= 120) {
      return Response.json({ 
        message: 'KEWR gates already exist',
        count: existingGates.length,
      });
    }
    
    // Bulk create all gates
    await base44.entities.Gate.bulkCreate(kewrGates);
    
    return Response.json({ 
      message: 'KEWR gates seeded successfully',
      count: kewrGates.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});