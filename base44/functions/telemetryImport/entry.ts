/**
 * Telemetry Data Import Handler
 * Processes CSV/Excel/JSON uploads from OEM export portals
 * and normalizes data into the TelemetryImport + MaintenanceForecast entities.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ── Field normalizers per OEM + data_type ─────────────────────────────────
const FIELD_MAPS = {
  boeing_ahm: {
    flight_hours:  { hours: ['FLIGHT_HOURS','FH','flight_hours','Total FH'], cycles: ['CYCLES','FC','flight_cycles','Total Cycles'] },
    fault_codes:   { code: ['FAULT_CODE','ATA_CODE','fault_code'], description: ['DESCRIPTION','MSG','message'], severity: ['SEVERITY','LEVEL'] },
    engine_health: { serial: ['ENGINE_SERIAL','ESN'], egt_margin: ['EGT_MARGIN','EGTM'], oil_consumption: ['OIL_QT','OIL_CONSUMPTION'] },
  },
  airbus_skywise: {
    flight_hours:  { hours: ['totalFlightHours','fh','flight_hours'], cycles: ['totalCycles','fc','flight_cycles'] },
    engine_health: { serial: ['engineSerial','esn'], egt_margin: ['egtMargin'], health_score: ['healthScore','score'] },
    apu_health:    { serial: ['apuSerial'], hours: ['apuHours','apu_hours'], starts: ['apuStarts','starts'] },
  },
  ge_aviation: {
    engine_health: { serial: ['ENGINE_SN','SerialNumber'], egt_margin: ['EGT_MARGIN','EGTM_VALUE'], flight_hours: ['FH_SINCE_NEW','TCSN_HR'], cycles: ['FC_SINCE_NEW','TCSN_CYC'] },
    vibration:     { serial: ['ENGINE_SN'], n1_vib: ['N1_VIB'], n2_vib: ['N2_VIB'], reading_date: ['DATE','REPORT_DATE'] },
  },
  honeywell_forge: {
    apu_health:    { serial: ['APU_SERIAL','apuSerial'], hours: ['APU_HRS','apuHours'], starts: ['APU_STARTS'], egt: ['EGT_VALUE'] },
    avionics:      { unit: ['LRU_NAME','unit'], fault_code: ['FAULT_CODE'], description: ['DESCRIPTION'] },
  },
  cfm_snecma: {
    engine_health: { serial: ['ESN','EngineSerial'], egt_margin: ['EGTM','EGT_MARGIN'], llp_life: ['LLP_REMAINING_CYC','llpRemaining'], hours: ['TSN_HR','Hours_Since_New'], cycles: ['CSN','Cycles_Since_New'] },
    egt_trend:     { date: ['DATE'], egt: ['EGT_DEV','EGT_DEVIATION'], trend: ['TREND'] },
  },
  embraer_ahead: {
    flight_hours:  { hours: ['TotalAircraftHours','fh'], cycles: ['TotalAircraftCycles','fc'], tail: ['AircraftRegistration','tail'] },
    engine_health: { serial: ['EngineSerialNumber'], health: ['HealthScore'], egt: ['EGTMargin'] },
  },
  default: {
    flight_hours:  { hours: ['flight_hours','FH','hours','HOURS','FlightHours'], cycles: ['cycles','FC','CYCLES','FlightCycles'] },
    engine_health: { serial: ['serial','ESN','engine_serial'], egt_margin: ['egt_margin','EGTM','EGTMargin'], hours: ['hours','FH'] },
    fault_codes:   { code: ['fault_code','FAULT_CODE','code','ATA'], description: ['description','DESCRIPTION','msg'] },
    apu_health:    { serial: ['apu_serial','APU_SERIAL'], hours: ['apu_hours','APU_HRS','hours'], starts: ['starts','APU_STARTS'] },
  },
};

function resolveField(row, candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return null;
}

function normalizeRow(row, oem_id, data_type) {
  const map = FIELD_MAPS[oem_id]?.[data_type] || FIELD_MAPS.default[data_type] || {};
  const normalized = {};
  for (const [field, candidates] of Object.entries(map)) {
    normalized[field] = resolveField(row, candidates);
  }
  return normalized;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function buildSummary(rows, oem_id, data_type) {
  const normalized = rows.map(r => normalizeRow(r, oem_id, data_type));
  const summary = { record_count: rows.length, data_type, oem_id, sample_fields: Object.keys(rows[0] || {}).slice(0, 10) };

  if (data_type === 'flight_hours') {
    const hours = normalized.map(r => parseFloat(r.hours)).filter(n => !isNaN(n));
    const cycles = normalized.map(r => parseFloat(r.cycles)).filter(n => !isNaN(n));
    if (hours.length) summary.max_flight_hours = Math.max(...hours);
    if (cycles.length) summary.max_cycles = Math.max(...cycles);
  }

  if (data_type === 'engine_health') {
    const egts = normalized.map(r => parseFloat(r.egt_margin)).filter(n => !isNaN(n));
    if (egts.length) {
      summary.avg_egt_margin = (egts.reduce((a, b) => a + b, 0) / egts.length).toFixed(1);
      summary.min_egt_margin = Math.min(...egts);
    }
  }

  if (data_type === 'apu_health') {
    const hrs = normalized.map(r => parseFloat(r.hours)).filter(n => !isNaN(n));
    if (hrs.length) summary.total_apu_hours = Math.max(...hrs);
  }

  if (data_type === 'fault_codes') {
    const codes = normalized.map(r => r.code).filter(Boolean);
    const freq = {};
    codes.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
    summary.top_fault_codes = Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,5).map(([code, count]) => ({ code, count }));
  }

  summary.normalized_sample = normalized.slice(0, 3);
  return summary;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, import_id, file_url, file_name, oem_id, aircraft_tail, data_type, period_start, period_end, notes } = body;

    // ── Create import record ────────────────────────────────────────────────
    if (action === 'create_import') {
      const record = await base44.entities.TelemetryImport.create({
        oem_id,
        oem_name: body.oem_name || oem_id,
        aircraft_tail,
        data_type,
        file_url,
        file_name,
        period_start,
        period_end,
        status: 'pending',
        imported_by: user.email,
        notes,
      });
      return Response.json({ success: true, import_id: record.id, record });
    }

    // ── Process import ──────────────────────────────────────────────────────
    if (action === 'process_import') {
      const record = (await base44.entities.TelemetryImport.filter({ id: import_id }))[0];
      if (!record) return Response.json({ error: 'Import record not found' }, { status: 404 });

      await base44.entities.TelemetryImport.update(record.id, { status: 'processing' });

      const fileRes = await fetch(record.file_url);
      const fileText = await fileRes.text();
      let rows = [];

      if (record.file_name?.endsWith('.json')) {
        const parsed = JSON.parse(fileText);
        rows = Array.isArray(parsed) ? parsed : (parsed.data || parsed.records || [parsed]);
      } else {
        rows = parseCSV(fileText);
      }

      if (rows.length === 0) {
        await base44.entities.TelemetryImport.update(record.id, { status: 'error', error_message: 'No data rows found in file' });
        return Response.json({ error: 'No data rows found' }, { status: 400 });
      }

      const summary = buildSummary(rows, record.oem_id, record.data_type);

      // Auto-update MaintenanceForecast if flight_hours or engine_health
      let forecastUpdates = [];
      if (record.data_type === 'flight_hours' && summary.max_flight_hours && record.aircraft_tail) {
        const existing = await base44.entities.MaintenanceForecast.filter({ aircraft_tail: record.aircraft_tail, component: 'engine_1' });
        if (existing.length > 0) {
          await base44.entities.MaintenanceForecast.update(existing[0].id, {
            total_flight_hours: summary.max_flight_hours,
            total_cycles: summary.max_cycles || existing[0].total_cycles,
          });
          forecastUpdates.push(`Updated MaintenanceForecast for ${record.aircraft_tail} ENG1`);
        }
      }

      await base44.entities.TelemetryImport.update(record.id, {
        status: 'imported',
        record_count: rows.length,
        raw_summary: JSON.stringify(summary),
      });

      return Response.json({ success: true, record_count: rows.length, summary, forecastUpdates });
    }

    return Response.json({ error: 'Unknown action. Use: create_import | process_import' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});