import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * MRO System Ingestion Engine
 * Supports: AMOS, TRAX, SCEPTRE, Boeing AHM/AHN, Airbus Skywise,
 *            Rolls-Royce FAST, Mitsubishi MHI, Snecma/CFM, Honeywell MPM, Embraer Portal
 *
 * POST payload:
 *   source        {string}  - mro system key (see SUPPORTED_SOURCES)
 *   data_type     {string}  - what kind of data (task_cards | work_orders | parts | fault_codes | health | airworthiness)
 *   aircraft_tail {string?} - tail number if applicable
 *   raw_data      {object|array} - the parsed payload from the source system
 *   file_url      {string?} - if ingesting from an uploaded CSV/JSON file
 */

const SUPPORTED_SOURCES = {
  amos:       { name: 'AMOS MRO',           category: 'mro' },
  trax:       { name: 'TRAX MRO',           category: 'mro' },
  sceptre:    { name: 'SCEPTRE MRO',        category: 'mro' },
  boeing_ahm: { name: 'Boeing AHM/AHN',     category: 'oem' },
  skywise:    { name: 'Airbus Skywise',      category: 'oem' },
  rolls_royce:{ name: 'Rolls-Royce FAST',   category: 'engine' },
  mhi:        { name: 'Mitsubishi MHI',      category: 'engine' },
  cfm_snecma: { name: 'CFM / Snecma',       category: 'engine' },
  honeywell:  { name: 'Honeywell MPM',       category: 'engine' },
  embraer:    { name: 'Embraer Service Portal', category: 'oem' },
};

// ── Normalizers: map source-specific field names → canonical schema ─────────
function normalizeAmosWorkOrder(record) {
  return {
    external_id:  record.wo_number || record.work_order_number || record.id,
    aircraft_tail: record.ac_registration || record.registration,
    ata_chapter:  record.ata_chapter || record.ata,
    description:  record.task_description || record.description,
    status:       record.wo_status || record.status,
    station:      record.station || record.base,
    open_date:    record.open_date || record.created_date,
    close_date:   record.close_date || record.completed_date,
    technician:   record.mechanic || record.technician,
    part_number:  record.pn || record.part_number,
    raw:          record,
  };
}

function normalizeTraxWorkOrder(record) {
  return {
    external_id:  record.TASK_ID || record.WO_ID || record.id,
    aircraft_tail: record.AC_REG || record.REGISTRATION,
    ata_chapter:  record.ATA,
    description:  record.TASK_DESC || record.DESCRIPTION,
    status:       record.STATUS,
    station:      record.STATION,
    open_date:    record.OPEN_DATE,
    close_date:   record.CLOSE_DATE,
    technician:   record.TECHNICIAN,
    part_number:  record.PART_NO || record.PN,
    raw:          record,
  };
}

function normalizeSceptreRecord(record) {
  return {
    external_id:  record.item_id || record.sceptre_id || record.id,
    aircraft_tail: record.aircraft || record.tail,
    ata_chapter:  record.ata,
    description:  record.description || record.item_description,
    status:       record.status || record.item_status,
    station:      record.location || record.station,
    open_date:    record.created || record.open_date,
    part_number:  record.part_number || record.pn,
    raw:          record,
  };
}

function normalizeBoeingAhm(record) {
  return {
    external_id:  record.messageId || record.id,
    aircraft_tail: record.acRegistration || record.tailNumber,
    ata_chapter:  record.ataChapter,
    description:  record.faultMessage || record.description || record.alertDescription,
    status:       record.status || 'active',
    flight_hours: record.totalFlightHours || record.flightHours,
    cycles:       record.totalCycles || record.cycles,
    raw:          record,
  };
}

function normalizeSkywise(record) {
  return {
    external_id:  record.id || record.eventId,
    aircraft_tail: record.aircraft?.registration || record.acReg,
    ata_chapter:  record.ataChapter || record.ata,
    description:  record.title || record.description || record.eventDescription,
    status:       record.status,
    flight_hours: record.flightHours,
    cycles:       record.cycles,
    raw:          record,
  };
}

function normalizeEngineRecord(source, record) {
  // Rolls-Royce FAST, MHI, CFM/Snecma, Honeywell MPM all share similar health schemas
  return {
    external_id:    record.engineSerial || record.serialNumber || record.id,
    aircraft_tail:  record.acRegistration || record.tailNumber || record.aircraft,
    engine_position: record.enginePosition || record.position || record.enginePos,
    egt_margin:     record.egtMargin || record.egt_margin,
    oil_consumption: record.oilConsumption || record.oil_consumption,
    vibration:      record.vibration || record.vibLevel,
    cycles:         record.cycles || record.totalCycles,
    flight_hours:   record.flightHours || record.totalHours,
    fault_codes:    record.faultCodes || record.faults || [],
    next_shop_visit: record.nextShopVisit || record.scheduledOverhaul,
    raw:            record,
  };
}

function normalizeEmbraer(record) {
  return {
    external_id:  record.serviceOrderId || record.soNumber || record.id,
    aircraft_tail: record.registration || record.aircraft,
    ata_chapter:  record.ataSystem,
    description:  record.workDescription || record.description,
    status:       record.status || record.soStatus,
    station:      record.base || record.station,
    part_number:  record.partNumber || record.pn,
    raw:          record,
  };
}

function normalize(source, data_type, record) {
  try {
    if (source === 'amos')        return normalizeAmosWorkOrder(record);
    if (source === 'trax')        return normalizeTraxWorkOrder(record);
    if (source === 'sceptre')     return normalizeSceptreRecord(record);
    if (source === 'boeing_ahm')  return normalizeBoeingAhm(record);
    if (source === 'skywise')     return normalizeSkywise(record);
    if (source === 'embraer')     return normalizeEmbraer(record);
    if (['rolls_royce','mhi','cfm_snecma','honeywell'].includes(source)) {
      return normalizeEngineRecord(source, record);
    }
    return { ...record, external_id: record.id || String(Date.now()) };
  } catch {
    return { ...record, external_id: record.id || String(Date.now()) };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { source, data_type, aircraft_tail, raw_data, file_url, notes } = body;

    if (!source || !data_type) {
      return Response.json({ error: 'source and data_type are required' }, { status: 400 });
    }

    const sourceInfo = SUPPORTED_SOURCES[source];
    if (!sourceInfo) {
      return Response.json({
        error: `Unsupported source: ${source}`,
        supported: Object.keys(SUPPORTED_SOURCES),
      }, { status: 400 });
    }

    // ── Handle file-based ingestion via AI extraction ────────────────────────
    let records = [];
    if (file_url) {
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            records: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      });
      if (extracted.status === 'success') {
        records = extracted.output?.records || (Array.isArray(extracted.output) ? extracted.output : []);
      }
    } else if (Array.isArray(raw_data)) {
      records = raw_data;
    } else if (raw_data && typeof raw_data === 'object') {
      records = [raw_data];
    }

    if (records.length === 0) {
      return Response.json({ error: 'No records to ingest' }, { status: 400 });
    }

    // ── Normalize all records ────────────────────────────────────────────────
    const normalized = records.map(r => normalize(source, data_type, r));

    // ── Save to TelemetryImport as a tracking record ─────────────────────────
    const importRecord = await base44.asServiceRole.entities.TelemetryImport.create({
      oem_id:       source,
      oem_name:     sourceInfo.name,
      aircraft_tail: aircraft_tail || normalized[0]?.aircraft_tail || 'FLEET',
      data_type:    data_type,
      file_name:    file_url ? file_url.split('/').pop() : `${source}_${data_type}_${Date.now()}`,
      file_url:     file_url || null,
      record_count: records.length,
      status:       'imported',
      imported_by:  user.email,
      raw_summary:  JSON.stringify({
        source,
        source_name: sourceInfo.name,
        category:    sourceInfo.category,
        data_type,
        record_count: records.length,
        sample:       normalized.slice(0, 3),
        ingested_at:  new Date().toISOString(),
        notes:        notes || null,
      }),
    });

    // ── For fault codes: auto-wire into FaultMessage if engine/oem data ──────
    let faultsCreated = 0;
    if (data_type === 'fault_codes' || data_type === 'health') {
      for (const n of normalized) {
        if (n.fault_codes && Array.isArray(n.fault_codes)) {
          for (const fc of n.fault_codes) {
            await base44.asServiceRole.entities.FaultMessage.create({
              aircraft_tail: n.aircraft_tail || aircraft_tail || '—',
              fault_code:    typeof fc === 'string' ? fc : (fc.code || fc.fault_code || String(fc)),
              ata_chapter:   n.ata_chapter || '',
              system:        sourceInfo.category === 'engine' ? 'engine' : 'avionics',
              severity:      fc.severity || 'advisory',
              description:   `[${sourceInfo.name}] ${typeof fc === 'string' ? fc : (fc.description || fc.fault_code || '')}`,
              detected_at:   new Date().toISOString(),
              status:        'active',
              notes:         `Auto-ingested from ${sourceInfo.name} via MRO Ingestion Engine`,
            });
            faultsCreated++;
          }
        }
      }
    }

    // ── For work orders: create LogbookEntry records ─────────────────────────
    let logbookCreated = 0;
    if (['task_cards', 'work_orders', 'airworthiness'].includes(data_type)) {
      for (const n of normalized) {
        if (n.description && (n.aircraft_tail || aircraft_tail)) {
          await base44.asServiceRole.entities.LogbookEntry.create({
            aircraft_tail: n.aircraft_tail || aircraft_tail,
            ata_chapter:   n.ata_chapter || '',
            entry_type:    'info',
            description:   `[${sourceInfo.name} IMPORT] ${n.description}`,
            station:       n.station || '',
            technician_name: n.technician || user.email,
            notes: `External ID: ${n.external_id || '—'} | Status: ${n.status || '—'} | Source: ${sourceInfo.name}`,
          });
          logbookCreated++;
        }
      }
    }

    return Response.json({
      success: true,
      source,
      source_name: sourceInfo.name,
      records_ingested: records.length,
      faults_created: faultsCreated,
      logbook_entries_created: logbookCreated,
      import_id: importRecord.id,
      summary: `Successfully ingested ${records.length} ${data_type} records from ${sourceInfo.name}`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});