/**
 * OEM Telemetry Integration Hub
 * 
 * This function acts as a unified proxy/stub for all OEM telemetry integrations.
 * Each OEM section is ready to activate once real credentials & contracts are in place.
 * 
 * Supported OEMs:
 *   - Boeing AHM (Aircraft Health Management)
 *   - Airbus Skywise
 *   - GE Aviation (GE Digital / Flight Pulse)
 *   - Honeywell Forge / GoDirect
 *   - Safran/SNECMA (CFM International)
 *   - Pratt & Whitney e-Service
 *   - Rolls-Royce Blue Data Thread
 *   - Embraer AHEAD
 *   - Mitsubishi Aircraft
 *   - Bombardier Smart Link+
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ── OEM connector registry ────────────────────────────────────────────────────
const OEM_CONNECTORS = {

  boeing_ahm: {
    name: 'Boeing AHM',
    description: 'Boeing Aircraft Health Management — real-time fault monitoring, ACMS data, flight reports',
    baseUrl: () => Deno.env.get('BOEING_AHM_BASE_URL') || 'https://ahm.boeing.com/api/v2',
    authHeader: () => ({ 'X-API-Key': Deno.env.get('BOEING_AHM_API_KEY'), 'X-Partner-ID': Deno.env.get('BOEING_AHM_PARTNER_ID') }),
    requiredSecrets: ['BOEING_AHM_API_KEY', 'BOEING_AHM_PARTNER_ID', 'BOEING_AHM_BASE_URL'],
    endpoints: {
      flightReports:    '/fleet/{tail}/flight-reports',
      faultMessages:    '/fleet/{tail}/fault-messages',
      engineHealth:     '/fleet/{tail}/engines/health',
      maintenanceAlerts:'/fleet/{tail}/maintenance-alerts',
    },
    aircraftTypes: ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','B757','B767','B777','B787'],
  },

  airbus_skywise: {
    name: 'Airbus Skywise',
    description: 'Airbus Skywise Open Platform — predictive maintenance, fleet analytics, health monitoring',
    baseUrl: () => Deno.env.get('SKYWISE_BASE_URL') || 'https://skywise.airbus.com/api/v1',
    authHeader: () => ({
      'Authorization': `Bearer ${Deno.env.get('SKYWISE_ACCESS_TOKEN')}`,
      'X-Skywise-Partner': Deno.env.get('SKYWISE_PARTNER_ID'),
    }),
    requiredSecrets: ['SKYWISE_ACCESS_TOKEN', 'SKYWISE_PARTNER_ID', 'SKYWISE_BASE_URL'],
    endpoints: {
      flightRecords:    '/aircraft/{tail}/flight-records',
      healthIndicators: '/aircraft/{tail}/health-indicators',
      predictiveAlerts: '/aircraft/{tail}/predictive-alerts',
      apuData:          '/aircraft/{tail}/apu',
    },
    aircraftTypes: ['A320','A321','A350'],
  },

  ge_aviation: {
    name: 'GE Aviation / Flight Pulse',
    description: 'GE Digital Flight Pulse — engine health, EGT margins, vibration, on-wing life management',
    baseUrl: () => Deno.env.get('GE_FLIGHTPULSE_BASE_URL') || 'https://api.ge.com/digital/flightpulse/v2',
    authHeader: () => ({
      'Authorization': `Bearer ${Deno.env.get('GE_FLIGHTPULSE_TOKEN')}`,
      'X-GE-ClientID': Deno.env.get('GE_FLIGHTPULSE_CLIENT_ID'),
    }),
    requiredSecrets: ['GE_FLIGHTPULSE_TOKEN', 'GE_FLIGHTPULSE_CLIENT_ID'],
    endpoints: {
      engineHealth:   '/engines/{serial}/health',
      egtMargin:      '/engines/{serial}/egt-margin',
      cycleCounts:    '/engines/{serial}/cycle-counts',
      flightHours:    '/engines/{serial}/flight-hours',
      vibration:      '/engines/{serial}/vibration',
    },
    aircraftTypes: ['B737-700','B737-800','B737-900','B777','B787'],
  },

  honeywell_forge: {
    name: 'Honeywell Forge / GoDirect',
    description: 'Honeywell Forge Flight Efficiency & GoDirect — APU health, avionics diagnostics, ACARS',
    baseUrl: () => Deno.env.get('HONEYWELL_FORGE_BASE_URL') || 'https://forge.honeywell.com/api/v3',
    authHeader: () => ({
      'Authorization': `Bearer ${Deno.env.get('HONEYWELL_FORGE_TOKEN')}`,
      'Ocp-Apim-Subscription-Key': Deno.env.get('HONEYWELL_APIM_KEY'),
    }),
    requiredSecrets: ['HONEYWELL_FORGE_TOKEN', 'HONEYWELL_APIM_KEY'],
    endpoints: {
      apuHealth:        '/apu/{serial}/health',
      avionicsFaults:   '/avionics/{tail}/faults',
      flightEfficiency: '/fleet/{tail}/efficiency',
      prognostics:      '/fleet/{tail}/prognostics',
    },
    aircraftTypes: ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','A320','A321','CRJ700','CRJ900'],
  },

  cfm_snecma: {
    name: 'CFM International / Safran',
    description: 'CFM LEAP & CFM56 engine health — EGT trends, LLP tracking, shop visit forecasting',
    baseUrl: () => Deno.env.get('CFM_BASE_URL') || 'https://services.cfmaeroengines.com/api/v1',
    authHeader: () => ({
      'X-API-Key': Deno.env.get('CFM_API_KEY'),
      'X-Operator-Code': Deno.env.get('CFM_OPERATOR_CODE'),
    }),
    requiredSecrets: ['CFM_API_KEY', 'CFM_OPERATOR_CODE'],
    endpoints: {
      engineStatus:    '/engines/{serial}/status',
      llpTracking:     '/engines/{serial}/llp',
      egtTrend:        '/engines/{serial}/egt-trend',
      shopVisit:       '/engines/{serial}/shop-visit-forecast',
    },
    aircraftTypes: ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','A320','A321'],
  },

  pratt_whitney: {
    name: 'Pratt & Whitney e-Service',
    description: 'P&W e-Service Center — PW1000G / JT8D health monitoring, LLP management, ADs',
    baseUrl: () => Deno.env.get('PW_ESERVICE_BASE_URL') || 'https://eservice.pw.utc.com/api/v2',
    authHeader: () => ({
      'Authorization': `Basic ${Deno.env.get('PW_ESERVICE_CREDENTIALS')}`,
      'X-Operator-ICAO': Deno.env.get('PW_OPERATOR_ICAO'),
    }),
    requiredSecrets: ['PW_ESERVICE_CREDENTIALS', 'PW_OPERATOR_ICAO'],
    endpoints: {
      engineHealth:  '/engines/{serial}/health-report',
      llpStatus:     '/engines/{serial}/llp-status',
      adCompliance:  '/engines/{serial}/ad-compliance',
    },
    aircraftTypes: ['B757','A320','A321','E190','E175'],
  },

  rolls_royce: {
    name: 'Rolls-Royce Blue Data Thread',
    description: 'Rolls-Royce Blue Data Thread — Trent engine health, digital twin, predictive analytics',
    baseUrl: () => Deno.env.get('RR_BDT_BASE_URL') || 'https://bdt.rolls-royce.com/api/v1',
    authHeader: () => ({
      'Authorization': `Bearer ${Deno.env.get('RR_BDT_TOKEN')}`,
      'X-RR-EngineProgram': Deno.env.get('RR_ENGINE_PROGRAM'),
    }),
    requiredSecrets: ['RR_BDT_TOKEN', 'RR_ENGINE_PROGRAM'],
    endpoints: {
      engineHealth:   '/engines/{serial}/health',
      trendMonitor:   '/engines/{serial}/trend-monitoring',
      predictedEOL:   '/engines/{serial}/predicted-eol',
    },
    aircraftTypes: ['B777','B787','A350'],
  },

  embraer_ahead: {
    name: 'Embraer AHEAD',
    description: 'Embraer AHEAD — E-Jet / E2 predictive maintenance, AHM, fleet health analytics',
    baseUrl: () => Deno.env.get('EMBRAER_AHEAD_BASE_URL') || 'https://ahead.embraer.com/api/v2',
    authHeader: () => ({
      'Authorization': `Bearer ${Deno.env.get('EMBRAER_AHEAD_TOKEN')}`,
      'X-AHEAD-OperatorCode': Deno.env.get('EMBRAER_OPERATOR_CODE'),
    }),
    requiredSecrets: ['EMBRAER_AHEAD_TOKEN', 'EMBRAER_OPERATOR_CODE'],
    endpoints: {
      flightData:     '/aircraft/{tail}/flight-data',
      healthScore:    '/aircraft/{tail}/health-score',
      maintenancePlan:'/aircraft/{tail}/maintenance-plan',
    },
    aircraftTypes: ['E190','E175'],
  },

  mitsubishi_aircraft: {
    name: 'Mitsubishi Aircraft',
    description: 'Mitsubishi Aircraft health monitoring for SpaceJet / MRJ series',
    baseUrl: () => Deno.env.get('MITSUBISHI_BASE_URL') || 'https://support.mitsubishiaircraft.com/api/v1',
    authHeader: () => ({
      'X-API-Key': Deno.env.get('MITSUBISHI_API_KEY'),
    }),
    requiredSecrets: ['MITSUBISHI_API_KEY'],
    endpoints: {
      aircraftHealth: '/aircraft/{tail}/health',
      engineData:     '/aircraft/{tail}/engine-data',
    },
    aircraftTypes: [],
  },

  bombardier_smartlink: {
    name: 'Bombardier Smart Link+',
    description: 'Bombardier Smart Link+ — CRJ/Q-Series real-time health monitoring & diagnostics',
    baseUrl: () => Deno.env.get('BOMBARDIER_BASE_URL') || 'https://smartlink.bombardier.com/api/v2',
    authHeader: () => ({
      'Authorization': `Bearer ${Deno.env.get('BOMBARDIER_SMARTLINK_TOKEN')}`,
      'X-Operator-ID': Deno.env.get('BOMBARDIER_OPERATOR_ID'),
    }),
    requiredSecrets: ['BOMBARDIER_SMARTLINK_TOKEN', 'BOMBARDIER_OPERATOR_ID'],
    endpoints: {
      aircraftStatus: '/aircraft/{tail}/status',
      faultLog:       '/aircraft/{tail}/fault-log',
      healthReport:   '/aircraft/{tail}/health-report',
    },
    aircraftTypes: ['CRJ700','CRJ900'],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
function checkSecrets(connector) {
  const missing = connector.requiredSecrets.filter(s => !Deno.env.get(s));
  return missing;
}

async function fetchOEM(connector, endpoint, pathParams = {}) {
  let url = `${connector.baseUrl()}${endpoint}`;
  for (const [k, v] of Object.entries(pathParams)) {
    url = url.replace(`{${k}}`, encodeURIComponent(v));
  }
  const headers = { ...connector.authHeader(), 'Content-Type': 'application/json', 'Accept': 'application/json' };
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${connector.name} API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, oem_id, tail_number, engine_serial, params = {} } = body;

    // ── Action: list_connectors ────────────────────────────────────────────
    if (action === 'list_connectors') {
      const result = Object.entries(OEM_CONNECTORS).map(([id, c]) => ({
        oem_id: id,
        name: c.name,
        description: c.description,
        aircraftTypes: c.aircraftTypes,
        endpoints: Object.keys(c.endpoints),
        missingSecrets: checkSecrets(c),
        isConfigured: checkSecrets(c).length === 0,
      }));
      return Response.json({ connectors: result });
    }

    // ── Action: check_connector ────────────────────────────────────────────
    if (action === 'check_connector') {
      const connector = OEM_CONNECTORS[oem_id];
      if (!connector) return Response.json({ error: `Unknown OEM: ${oem_id}` }, { status: 404 });
      const missing = checkSecrets(connector);
      return Response.json({
        oem_id,
        name: connector.name,
        isConfigured: missing.length === 0,
        missingSecrets: missing,
        availableEndpoints: Object.keys(connector.endpoints),
      });
    }

    // ── Action: fetch_data ─────────────────────────────────────────────────
    if (action === 'fetch_data') {
      const connector = OEM_CONNECTORS[oem_id];
      if (!connector) return Response.json({ error: `Unknown OEM: ${oem_id}` }, { status: 404 });

      const missing = checkSecrets(connector);
      if (missing.length > 0) {
        return Response.json({
          error: 'Connector not configured',
          missingSecrets: missing,
          instructions: `Add the following environment variables in Dashboard → Settings → Secrets: ${missing.join(', ')}`,
        }, { status: 422 });
      }

      const { endpoint_key } = params;
      const endpointPath = connector.endpoints[endpoint_key];
      if (!endpointPath) {
        return Response.json({ error: `Unknown endpoint: ${endpoint_key}. Available: ${Object.keys(connector.endpoints).join(', ')}` }, { status: 400 });
      }

      const pathParams = { tail: tail_number, serial: engine_serial, ...params.pathParams };
      const data = await fetchOEM(connector, endpointPath, pathParams);
      return Response.json({ oem: connector.name, endpoint: endpoint_key, data });
    }

    return Response.json({ error: 'Unknown action. Use: list_connectors | check_connector | fetch_data' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});