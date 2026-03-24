/**
 * Aircraft Registry Utility
 * Supports multifleet identification by tail number, MSN (serial), or operator number
 */

export const AIRCRAFT_TYPES = {
  B737_700: 'B737-700',
  B737_800: 'B737-800',
  B737_900: 'B737-900',
  B737_MAX_8: 'B737 MAX 8',
  B737_MAX_9: 'B737 MAX 9',
  B757: 'B757',
  B767: 'B767',
  B777: 'B777',
  B787: 'B787',
  A320: 'A320',
  A350: 'A350',
  E190: 'E190',
  CRJ700: 'CRJ700',
};

export const PERFORMANCE_PROFILES = {
  B737_700: 'B737_profile',
  B737_800: 'B737_profile',
  B737_900: 'B737_profile',
  B737_MAX_8: 'B737_profile',
  B737_MAX_9: 'B737_profile',
  B757: 'B757_profile',
  B767: 'B767_profile',
  B777: 'B777_profile',
  B787: 'B787_profile',
  A320: 'A320_profile',
  A350: 'A350_profile',
  E190: 'E190_profile',
  CRJ700: 'CRJ700_profile',
};

/**
 * Resolves aircraft identifier to full aircraft record
 * Supports lookup by tail number, MSN, or operator number
 */
export async function resolveAircraft(identifier, aircraftList) {
  if (!identifier || !aircraftList) return null;

  const id = String(identifier).trim().toUpperCase();

  // Try tail number first (most common)
  let aircraft = aircraftList.find(a => a.tail_number?.toUpperCase() === id);
  if (aircraft) return aircraft;

  // Try MSN (serial number)
  aircraft = aircraftList.find(a => a.msn?.toUpperCase() === id);
  if (aircraft) return aircraft;

  // Try operator number
  aircraft = aircraftList.find(a => a.operator_number?.toUpperCase() === id);
  if (aircraft) return aircraft;

  return null;
}

/**
 * Gets human-readable aircraft display label
 * Format: "N455GJ (B737-800) [MSN: 28556]" or with operator number
 */
export function formatAircraftLabel(aircraft) {
  if (!aircraft) return 'Unknown';

  let label = `${aircraft.tail_number}`;

  if (aircraft.aircraft_type) {
    label += ` (${aircraft.aircraft_type})`;
  }

  if (aircraft.msn) {
    label += ` [MSN: ${aircraft.msn}]`;
  }

  if (aircraft.operator_number) {
    label += ` {${aircraft.operator_number}}`;
  }

  return label;
}

/**
 * Gets aircraft short identifier (for compact displays)
 * Prefers operator number if available, otherwise tail number
 */
export function getAircraftShortId(aircraft) {
  if (!aircraft) return '—';
  return aircraft.operator_number || aircraft.tail_number || '—';
}

/**
 * Validates aircraft configuration
 */
export function validateAircraft(aircraft) {
  const errors = [];

  if (!aircraft.tail_number?.trim()) {
    errors.push('Tail number is required');
  }

  if (!aircraft.aircraft_type || !AIRCRAFT_TYPES[aircraft.aircraft_type.replace(/ /g, '_').replace('-', '_')]) {
    errors.push('Valid aircraft type is required');
  }

  if (aircraft.msn && aircraft.msn.trim()) {
    // MSN should be numeric or alphanumeric
    if (!/^[A-Z0-9]+$/i.test(aircraft.msn.trim())) {
      errors.push('MSN must be alphanumeric');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}