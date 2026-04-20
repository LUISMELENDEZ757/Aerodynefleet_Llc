/**
 * Avionics Data Ingestion Function
 * 
 * Accepts avionics health payloads from any aircraft manufacturer system:
 *   - Boeing AHM (Aircraft Health Management)
 *   - Airbus Skywise / OAP (Operations Analytics Platform)
 *   - Embraer AHEAD (Aircraft Health Analysis and Diagnosis)
 *   - Bombardier FAST (Fleet Analytics & Support Technology)
 *   - Generic / Manual JSON upload
 *   - ACARS raw text parsed into structured fields
 * 
 * POST body can be a single report OR an array of reports.
 * Each report is normalized into the AvionicsReport entity schema.
 * 
 * Example request body (generic format):
 * {
 *   "source": "boeing_ahm",  // or "airbus_skywise" | "embraer_ahead" | "bombardier_fast" | "generic" | "acars"
 *   "reports": [
 *     {
 *       "tail": "N455GJ",
 *       "aircraft_type": "B737-800",
 *       "timestamp": "2026-04-20T12:30:00Z",
 *       "systems": [
 *         { "name": "FMS", "ata": "34", "status": "nominal" },
 *         { "name": "ACARS", "ata": "23", "status": "caution", "fault_code": "ATC-041", "message": "Datalink intermittent" }
 *       ],
 *       "nav_db": "AIRAC 2604",
 *       "fms_version": "U10.8A",
 *       "dfdr": { "available": true, "flight": "AEX1042", "duration": "4h 12m", "size_mb": 42 }
 *     }
 *   ]
 * }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── Normalizers per data source ───────────────────────────────────────────────

function normalizeBoeing(raw) {
  // Boeing AHM format: uses "registration", "healthItems", "fmsIdent", "navDbCycle"
  return {
    aircraft_tail: raw.registration || raw.tail || raw.acId,
    aircraft_type: raw.acType || raw.aircraft_type || '',
    manufacturer: 'Boeing',
    data_source: 'Boeing AHM',
    report_timestamp: raw.reportTime || raw.timestamp || new Date().toISOString(),
    systems: (raw.healthItems || raw.systems || []).map(s => ({
      system_name: s.systemName || s.name || s.lruName || '',
      ata_chapter: s.ataChapter || s.ata || '',
      status: mapStatus(s.condition || s.status || s.healthStatus),
      fault_code: s.faultCode || s.faultMessage || '',
      message: s.description || s.message || '',
      raw_value: s.rawValue || JSON.stringify(s),
    })),
    nav_db_version: raw.navDbCycle || raw.nav_db || '',
    fms_version: raw.fmsIdent || raw.fms_version || '',
    dfdr_available: !!raw.qar || !!raw.dfdr?.available,
    dfdr_flight_number: raw.dfdr?.flightNumber || raw.flightId || '',
    dfdr_flight_duration: raw.dfdr?.duration || '',
    dfdr_file_size_mb: raw.dfdr?.sizeMb || raw.dfdr?.size_mb || 0,
    dfdr_download_url: raw.dfdr?.downloadUrl || '',
  };
}

function normalizeAirbus(raw) {
  // Airbus Skywise / OAP format: uses "msn", "acmsAlerts", "fmgcVersion", "wbsNavData"
  const tail = raw.registration || raw.tail || raw.msn;
  return {
    aircraft_tail: tail,
    aircraft_type: raw.acType || raw.aircraft_type || '',
    manufacturer: 'Airbus',
    data_source: 'Airbus Skywise',
    report_timestamp: raw.acquisitionDate || raw.timestamp || new Date().toISOString(),
    systems: (raw.acmsAlerts || raw.systems || []).map(s => ({
      system_name: s.ataSystem || s.name || s.systemId || '',
      ata_chapter: s.ata || s.ataChapter || '',
      status: mapStatus(s.alertLevel || s.severity || s.status),
      fault_code: s.warningCode || s.faultCode || '',
      message: s.wording || s.message || '',
      raw_value: s.rawValue || JSON.stringify(s),
    })),
    nav_db_version: raw.wbsNavData || raw.nav_db || '',
    fms_version: raw.fmgcVersion || raw.fms_version || '',
    dfdr_available: !!raw.dfdr?.available,
    dfdr_flight_number: raw.dfdr?.flightNumber || '',
    dfdr_flight_duration: raw.dfdr?.duration || '',
    dfdr_file_size_mb: raw.dfdr?.size_mb || 0,
    dfdr_download_url: raw.dfdr?.url || '',
  };
}

function normalizeEmbraer(raw) {
  // Embraer AHEAD format: uses "aircraftId", "aheadAlerts", "fmsPartNumber"
  return {
    aircraft_tail: raw.aircraftId || raw.tail || raw.registration,
    aircraft_type: raw.model || raw.aircraft_type || '',
    manufacturer: 'Embraer',
    data_source: 'Embraer AHEAD',
    report_timestamp: raw.reportDate || raw.timestamp || new Date().toISOString(),
    systems: (raw.aheadAlerts || raw.systems || []).map(s => ({
      system_name: s.subsystemName || s.name || '',
      ata_chapter: s.ata || '',
      status: mapStatus(s.alertType || s.status),
      fault_code: s.code || s.faultCode || '',
      message: s.alertDescription || s.message || '',
      raw_value: JSON.stringify(s),
    })),
    nav_db_version: raw.navDbVersion || raw.nav_db || '',
    fms_version: raw.fmsPartNumber || raw.fms_version || '',
    dfdr_available: !!raw.dfdr?.available,
    dfdr_flight_number: raw.dfdr?.flightNumber || '',
    dfdr_flight_duration: raw.dfdr?.duration || '',
    dfdr_file_size_mb: raw.dfdr?.size_mb || 0,
    dfdr_download_url: raw.dfdr?.url || '',
  };
}

function normalizeBombardier(raw) {
  // Bombardier FAST format: uses "serialNumber", "fastEvents", "fmsDbCycle"
  return {
    aircraft_tail: raw.registration || raw.tail || raw.serialNumber,
    aircraft_type: raw.variant || raw.aircraft_type || '',
    manufacturer: 'Bombardier',
    data_source: 'Bombardier FAST',
    report_timestamp: raw.eventTime || raw.timestamp || new Date().toISOString(),
    systems: (raw.fastEvents || raw.systems || []).map(s => ({
      system_name: s.componentName || s.name || '',
      ata_chapter: s.ataRef || s.ata || '',
      status: mapStatus(s.eventType || s.status),
      fault_code: s.eventCode || s.faultCode || '',
      message: s.eventMessage || s.message || '',
      raw_value: JSON.stringify(s),
    })),
    nav_db_version: raw.fmsDbCycle || raw.nav_db || '',
    fms_version: raw.fmsSoftwareVersion || raw.fms_version || '',
    dfdr_available: !!raw.dfdr?.available,
    dfdr_flight_number: raw.dfdr?.flightNumber || '',
    dfdr_flight_duration: raw.dfdr?.duration || '',
    dfdr_file_size_mb: raw.dfdr?.size_mb || 0,
    dfdr_download_url: raw.dfdr?.url || '',
  };
}

function normalizeGeneric(raw) {
  // Generic / manual format — direct field mapping
  return {
    aircraft_tail: raw.tail || raw.registration || raw.aircraft_tail || '',
    aircraft_type: raw.aircraft_type || raw.type || '',
    manufacturer: raw.manufacturer || 'Unknown',
    data_source: raw.source || raw.data_source || 'Manual Upload',
    report_timestamp: raw.timestamp || raw.report_timestamp || new Date().toISOString(),
    systems: (raw.systems || []).map(s => ({
      system_name: s.name || s.system_name || '',
      ata_chapter: s.ata || s.ata_chapter || '',
      status: mapStatus(s.status),
      fault_code: s.fault_code || s.faultCode || '',
      message: s.message || '',
      raw_value: s.raw_value || JSON.stringify(s),
    })),
    nav_db_version: raw.nav_db || raw.nav_db_version || '',
    fms_version: raw.fms_version || raw.fmsVersion || '',
    dfdr_available: raw.dfdr?.available || false,
    dfdr_flight_number: raw.dfdr?.flight || raw.dfdr?.flight_number || '',
    dfdr_flight_duration: raw.dfdr?.duration || '',
    dfdr_file_size_mb: raw.dfdr?.size_mb || 0,
    dfdr_download_url: raw.dfdr?.download_url || raw.dfdr?.url || '',
  };
}

// Map various manufacturer status strings to our normalized enum
function mapStatus(val = '') {
  const v = String(val).toLowerCase();
  if (['nominal', 'ok', 'normal', 'green', 'serviceable', 'go', 'no_fault', 'no fault', 'pass'].includes(v)) return 'nominal';
  if (['caution', 'warning', 'amber', 'advisory', 'monitor', 'watch', 'degraded', 'partial'].includes(v)) return 'caution';
  if (['fault', 'fail', 'failed', 'failure', 'red', 'no_go', 'no-go', 'alert', 'critical', 'error'].includes(v)) return 'fault';
  return 'unknown';
}

// Dispatch to correct normalizer
function normalizeReport(raw, source) {
  switch ((source || '').toLowerCase()) {
    case 'boeing_ahm':    return normalizeBoeing(raw);
    case 'airbus_skywise': return normalizeAirbus(raw);
    case 'embraer_ahead': return normalizeEmbraer(raw);
    case 'bombardier_fast': return normalizeBombardier(raw);
    default:              return normalizeGeneric(raw);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Support both { source, reports: [...] } and a direct array or single object
    let source = body.source || body.data_source || 'generic';
    let rawReports = [];
    if (Array.isArray(body)) {
      rawReports = body;
    } else if (Array.isArray(body.reports)) {
      rawReports = body.reports;
    } else {
      rawReports = [body];
    }

    const results = [];
    const errors = [];

    for (const raw of rawReports) {
      try {
        const normalized = normalizeReport(raw, source);
        normalized.raw_payload = JSON.stringify(raw);
        normalized.ingest_status = 'ok';

        // Upsert: check if there's already a recent report for this tail (same flight/timestamp)
        const existing = await base44.entities.AvionicsReport.filter({
          aircraft_tail: normalized.aircraft_tail,
          report_timestamp: normalized.report_timestamp,
        });

        let saved;
        if (existing && existing.length > 0) {
          saved = await base44.entities.AvionicsReport.update(existing[0].id, normalized);
        } else {
          saved = await base44.entities.AvionicsReport.create(normalized);
        }
        results.push({ tail: normalized.aircraft_tail, id: saved.id, status: 'ok' });
      } catch (e) {
        errors.push({ tail: raw.tail || raw.registration || 'unknown', error: e.message });
      }
    }

    return Response.json({
      ingested: results.length,
      errors: errors.length,
      results,
      errors_detail: errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});