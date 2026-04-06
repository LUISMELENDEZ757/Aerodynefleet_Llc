/**
 * Auto-Wire Fault → E-Logbook
 * Triggered by entity automation on FaultMessage create.
 * 
 * Creates a LogbookEntry discrepancy pre-populated with:
 * - Fault code, ATA chapter, system, severity
 * - Aircraft type, engine type, MSN from the Aircraft registry
 * - Fleet-specific specs (ETOPS, CAT, RNP) for dispatch awareness
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ATA chapter → system description mapping for context
const ATA_SYSTEM_MAP = {
  '21': 'Air Conditioning',      '22': 'Auto Flight',
  '23': 'Communications',        '24': 'Electrical Power',
  '25': 'Equipment / Furnishings','26': 'Fire Protection',
  '27': 'Flight Controls',       '28': 'Fuel',
  '29': 'Hydraulic Power',       '30': 'Ice & Rain Protection',
  '31': 'Instruments',           '32': 'Landing Gear',
  '33': 'Lights',                '34': 'Navigation',
  '35': 'Oxygen',                '36': 'Pneumatics',
  '38': 'Water / Waste',         '42': 'IMA',
  '44': 'Cabin Systems',         '45': 'CMS',
  '46': 'Information Systems',   '49': 'APU',
  '52': 'Doors',                 '53': 'Fuselage',
  '54': 'Nacelles / Pylons',     '55': 'Stabilizers',
  '56': 'Windows',               '57': 'Wings',
  '71': 'Power Plant',           '72': 'Engine',
  '73': 'Engine Fuel & Control', '74': 'Ignition',
  '75': 'Air',                   '76': 'Engine Controls',
  '77': 'Engine Indicating',     '78': 'Exhaust',
  '79': 'Oil',                   '80': 'Starting',
};

function getAtaDesc(ataChapter) {
  if (!ataChapter) return '';
  const chapter = String(ataChapter).split('-')[0];
  return ATA_SYSTEM_MAP[chapter] ? ` (${ATA_SYSTEM_MAP[chapter]})` : '';
}

function buildNextLogPage(existingCount) {
  return `LP#${String(existingCount + 1).padStart(4, '0')}`;
}

function buildDescription(fault, aircraft) {
  const lines = [];
  lines.push(`[FAULT → LOGBOOK] ${fault.fault_code}${fault.description ? ` — ${fault.description}` : ''}`);
  lines.push(`Severity: ${(fault.severity || 'CAUTION').toUpperCase()} | System: ${(fault.system || 'other').toUpperCase()}${getAtaDesc(fault.ata_chapter)}`);
  if (fault.flight_phase) lines.push(`Flight Phase: ${fault.flight_phase}`);

  if (aircraft) {
    const specParts = [
      aircraft.aircraft_type && `Type: ${aircraft.aircraft_type}`,
      aircraft.engine_type   && `Engine: ${aircraft.engine_type}`,
      aircraft.msn           && `MSN: ${aircraft.msn}`,
      aircraft.airline       && `Operator: ${aircraft.airline}`,
    ].filter(Boolean);
    if (specParts.length) lines.push(`Aircraft: ${specParts.join(' | ')}`);

    const capParts = [
      aircraft.etops_approval && aircraft.etops_approval > 0 && `ETOPS-${aircraft.etops_approval}`,
      aircraft.cat_approval   && `${aircraft.cat_approval}`,
      aircraft.rnp_capability && aircraft.rnp_capability !== 'None' && `RNP: ${aircraft.rnp_capability}`,
    ].filter(Boolean);
    if (capParts.length) lines.push(`Capabilities: ${capParts.join(' | ')}`);
  }

  return lines.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct call and entity automation payload
    const fault = body.data || body.fault;
    const faultId = body.event?.entity_id || fault?.id;

    if (!faultId && !fault) {
      return Response.json({ error: 'No fault data provided' }, { status: 400 });
    }

    // Fetch fault if we only have an ID
    let faultRecord = fault;
    if (!faultRecord || !faultRecord.fault_code) {
      const results = await base44.asServiceRole.entities.FaultMessage.filter({ id: faultId });
      faultRecord = results[0];
    }
    if (!faultRecord) return Response.json({ error: 'Fault not found' }, { status: 404 });

    // Only process active faults
    if (faultRecord.status !== 'active') {
      return Response.json({ skipped: true, reason: 'Fault is not active' });
    }

    // Fetch aircraft specs from registry
    let aircraft = null;
    if (faultRecord.aircraft_tail) {
      const acResults = await base44.asServiceRole.entities.Aircraft.filter({ tail_number: faultRecord.aircraft_tail });
      aircraft = acResults[0] || null;
    }

    // Check if a logbook entry for this fault already exists (dedup)
    const existingEntries = faultRecord.aircraft_tail
      ? await base44.asServiceRole.entities.LogbookEntry.filter({ aircraft_tail: faultRecord.aircraft_tail })
      : [];

    const alreadyLogged = existingEntries.some(e =>
      e.description?.includes(`FaultMessage ID: ${faultRecord.id}`) ||
      e.description?.includes(`[FAULT → LOGBOOK] ${faultRecord.fault_code}`)
    );

    if (alreadyLogged) {
      return Response.json({ skipped: true, reason: 'Fault already logged to e-logbook' });
    }

    const nextLogPage = buildNextLogPage(existingEntries.length);

    const logEntry = await base44.asServiceRole.entities.LogbookEntry.create({
      aircraft_tail: faultRecord.aircraft_tail,
      log_page: nextLogPage,
      entry_type: 'discrepancy',
      ata_chapter: faultRecord.ata_chapter || '',
      station: aircraft?.base_station || '',
      description: buildDescription(faultRecord, aircraft),
      notes: `Auto-wired from FaultMessage ID: ${faultRecord.id}. Detected: ${faultRecord.detected_at ? new Date(faultRecord.detected_at).toLocaleString() : new Date().toLocaleString()}`,
    });

    return Response.json({
      success: true,
      logbook_entry_id: logEntry.id,
      log_page: nextLogPage,
      aircraft_tail: faultRecord.aircraft_tail,
      fault_code: faultRecord.fault_code,
      aircraft_type: aircraft?.aircraft_type || '—',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});