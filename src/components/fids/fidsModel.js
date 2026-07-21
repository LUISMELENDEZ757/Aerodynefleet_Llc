// ─── Aerodyne FIDS MVP model — status logic, colors, FA→record normalization ───

export const STATUS_COLORS = {
  'ON TIME':   { color: 'text-green-400',  bg: 'bg-green-500/10',  dot: 'bg-green-400' },
  'DELAYED':   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400 animate-pulse' },
  'BOARDING':  { color: 'text-blue-400',   bg: 'bg-blue-500/10',   dot: 'bg-blue-400 animate-pulse' },
  'DEPARTED':  { color: 'text-blue-300',   bg: 'bg-blue-500/5',    dot: 'bg-blue-300' },
  'ARRIVED':   { color: 'text-green-400',  bg: 'bg-green-500/10',  dot: 'bg-green-400' },
  'CANCELLED': { color: 'text-red-400',    bg: 'bg-red-500/10',    dot: 'bg-red-400' },
  'DIVERTED':  { color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400 animate-pulse' },
  'IN RANGE':  { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   dot: 'bg-cyan-400 animate-pulse' },
  'TAXIING':   { color: 'text-cyan-300',   bg: 'bg-cyan-500/5',    dot: 'bg-cyan-300 animate-pulse' },
  'AT GATE':   { color: 'text-muted-foreground', bg: 'bg-muted/30', dot: 'bg-muted-foreground' },
};

export function fmtZulu(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

// Status Logic Model (per MVP spec)
function deriveStatus(f, type, now) {
  if (f.cancelled) return 'CANCELLED';
  if (f.diverted) return 'DIVERTED';

  if (type === 'departure') {
    const std = f.scheduled_out || f.scheduled_off;
    const etd = f.estimated_out || f.estimated_off || std;
    if (f.actual_off || (etd && now > new Date(etd).getTime() && f.actual_out)) return 'DEPARTED';
    if (f.actual_out) return 'TAXIING';
    if (std && etd && new Date(etd) > new Date(std)) return 'DELAYED';
    if (std && now > new Date(std).getTime() - 40 * 60000 && now < new Date(std).getTime()) return 'BOARDING';
    return 'ON TIME';
  }

  // arrival
  const sta = f.scheduled_in || f.scheduled_on;
  const eta = f.estimated_in || f.estimated_on || sta;
  if (f.actual_in) return 'AT GATE';
  if (f.actual_on || (eta && now > new Date(eta).getTime())) return 'ARRIVED';
  if ((f.progress_percent || 0) >= 85) return 'IN RANGE';
  if (sta && eta && new Date(eta) > new Date(sta)) return 'DELAYED';
  return 'ON TIME';
}

// Remarks: delay reason / gate-change style annotations
function deriveRemarks(f, type) {
  const parts = [];
  const delay = type === 'departure' ? f.departure_delay : f.arrival_delay;
  if (delay > 300) parts.push(`Delay +${Math.round(delay / 60)}m`);
  if (f.diverted) parts.push('Diverted');
  if (f.cancelled) parts.push('Cancelled');
  return parts.join(' · ');
}

// Normalize a FlightAware flight object into the Flight Record Model
export function normalizeFlight(f, type, now = Date.now()) {
  const scheduled = type === 'departure' ? (f.scheduled_out || f.scheduled_off) : (f.scheduled_in || f.scheduled_on);
  const estimated = type === 'departure'
    ? (f.actual_out || f.estimated_out || f.estimated_off || scheduled)
    : (f.actual_in || f.estimated_in || f.estimated_on || scheduled);
  return {
    id: f.fa_flight_id || `${f.ident}-${scheduled}`,
    fa_id: f.fa_flight_id || null,
    type,                                              // Flight Type
    airline: f.operator_iata || f.operator || '—',     // Airline
    flight_number: f.ident_iata || f.ident || '—',     // Flight Number
    origin: f.origin?.code_iata || f.origin?.code || '—',
    destination: f.destination?.code_iata || f.destination?.code || '—',
    scheduled,                                         // STD / STA
    estimated,                                         // ETD / ETA
    gate: (type === 'departure' ? f.gate_origin : f.gate_destination) || f.gate || '—',
    terminal: (type === 'departure' ? f.terminal_origin : f.terminal_destination) || f.terminal || '—',
    status: deriveStatus(f, type, now),                // Status
    aircraft_type: f.aircraft_type || '—',             // Aircraft Type
    tail_number: f.registration || '—',                // Tail Number
    remarks: deriveRemarks(f, type),                   // Remarks
  };
}