import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, X, Clock, Wrench, ChevronDown, ChevronUp, Info } from 'lucide-react';

// ── RVSM-critical ATA system definitions ────────────────────────────────────
export const RVSM_SYSTEMS = [
  {
    id: 'pitot_static',
    label: 'Pitot-Static System',
    ata: 'ATA 34',
    subsystems: ['Captain Pitot', 'FO Pitot', 'Standby Pitot', 'Static Ports (L)', 'Static Ports (R)', 'Alternate Static'],
    impact: 'rvsm',
    severity: 'critical',
    note: 'Any blocked or degraded pitot-static port directly violates RVSM tolerance (±60ft). Auto-triggers RVSM N/O.',
    icaoRef: 'ICAO Doc 9574 §3.4',
  },
  {
    id: 'adc',
    label: 'Air Data Computers (ADC)',
    ata: 'ATA 34',
    subsystems: ['ADC-1 (Captain)', 'ADC-2 (FO)', 'ADC-3 (Standby)'],
    impact: 'rvsm',
    severity: 'critical',
    note: 'Dual ADC failure causes altitude deviation >300ft. Single degraded ADC may invalidate RVSM cross-check.',
    icaoRef: 'ICAO Doc 9574 §3.2',
  },
  {
    id: 'autopilot',
    label: 'Autopilot / AFCS',
    ata: 'ATA 22',
    subsystems: ['AP Channel A', 'AP Channel B', 'Altitude Hold Mode', 'VNAV/LNAV'],
    impact: 'both',
    severity: 'critical',
    note: 'RVSM requires one serviceable autopilot with altitude-hold. CAT III requires dual-channel autoland-capable AP.',
    icaoRef: 'FAA AC 91-85B / ICAO Doc 9574',
  },
  {
    id: 'altimetry',
    label: 'Primary Altimeters',
    ata: 'ATA 34',
    subsystems: ['Captain Altimeter', 'FO Altimeter', 'Standby Altimeter', 'Baro Reference System'],
    impact: 'rvsm',
    severity: 'critical',
    note: 'Cross-check tolerance: ≤75ft between Captain/FO altimeters. Non-conformance = immediate RVSM N/O.',
    icaoRef: 'ICAO Doc 9574 Table 3-1',
  },
  {
    id: 'transponder',
    label: 'ATC Transponders',
    ata: 'ATA 34',
    subsystems: ['Transponder 1 (Mode C/S)', 'Transponder 2 (Mode C/S)', 'ADS-B OUT'],
    impact: 'rvsm',
    severity: 'high',
    note: 'Mode C altitude encoding must agree with altimeters ±25ft. ADS-B OUT required in Class A airspace.',
    icaoRef: 'TSO-C166b / ICAO Annex 10',
  },
  {
    id: 'ils_receivers',
    label: 'ILS / MMR Receivers',
    ata: 'ATA 34',
    subsystems: ['ILS Receiver 1', 'ILS Receiver 2', 'MMR (Multi-Mode Receiver)', 'Glideslope Antenna'],
    impact: 'cat',
    severity: 'critical',
    note: 'Dual ILS receivers required for CAT IIIa/b/c operations. Single receiver limits to CAT I.',
    icaoRef: 'FAA AC 120-29A / EASA AMC1 SPA.LVO',
  },
  {
    id: 'radio_altimeter',
    label: 'Radio Altimeters (RA)',
    ata: 'ATA 34',
    subsystems: ['RA-1 (Captain)', 'RA-2 (FO)', 'RA Antennas'],
    impact: 'cat',
    severity: 'critical',
    note: 'Both RAs required for CAT IIIa and below. RA failure degrades minima from DH 50ft → CAT II (100ft) at minimum.',
    icaoRef: 'FAA AC 120-29A §6.4',
  },
  {
    id: 'fma_displays',
    label: 'FMA / PFD Displays',
    ata: 'ATA 31',
    subsystems: ['Captain PFD', 'FO PFD', 'FMA Annunciations', 'HUD (if installed)'],
    impact: 'cat',
    severity: 'high',
    note: 'FMA required to display approach mode engagement. PFD degradation restricts low-vis ops.',
    icaoRef: 'EASA CS-AWO §AWO 131',
  },
  {
    id: 'ground_spoilers',
    label: 'Ground Spoilers / Autobrakes',
    ata: 'ATA 27/32',
    subsystems: ['Ground Spoiler System', 'Autobrake System', 'Decel Computer'],
    impact: 'cat',
    severity: 'high',
    note: 'Autobrakes (MIN/MED) required for CAT IIIb. Ground spoiler failure may restrict auto-landing approval.',
    icaoRef: 'FAA AC 120-29A §6.7',
  },
  {
    id: 'aoa_sensors',
    label: 'AOA / Stall Protection',
    ata: 'ATA 27',
    subsystems: ['AOA Sensor L', 'AOA Sensor R', 'Stick Shaker / Pusher', 'SMYD Computer'],
    impact: 'rvsm',
    severity: 'high',
    note: 'AOA vane blockage can corrupt air data computation. Stall protection degradation affects RVSM monitoring program.',
    icaoRef: 'FAA AD / Boeing AMM 27-31-00',
  },
];

// ── RVSM Monitoring Program expiry items ────────────────────────────────────
export const RVSM_MONITORING_ITEMS = [
  { id: 'height_monitoring', label: 'Height Monitoring (HMA)', intervalDays: 1825, description: 'ICAO RVSM height monitoring — required every 5 years or after major avionics maintenance', ref: 'ICAO Doc 9574 §4.3.3' },
  { id: 'altimetry_check', label: 'Altimetry System Check', intervalDays: 365, description: 'Annual cross-check of both altimeter systems against reference', ref: 'AMM 34-11-00' },
  { id: 'adc_calibration', label: 'ADC Calibration Check', intervalDays: 730, description: 'Air Data Computer calibration certification', ref: 'TSO-C106' },
  { id: 'transponder_test', label: 'Transponder Encode Check', intervalDays: 730, description: 'Mode C altitude encoding accuracy test — ±25ft tolerance', ref: '14 CFR 91.413' },
  { id: 'pitot_heat_check', label: 'Pitot Heat Functional Test', intervalDays: 365, description: 'Pitot and AOA heater element continuity and heating verification', ref: 'AMM 30-31-00' },
];

// ── Downgrade logic engine ───────────────────────────────────────────────────
// Returns { catDowngrade, rvsmBlock, reasons } for a given set of MEL items
export function computeApprovalImpact(melItems = [], aircraft) {
  const reasons = [];
  let catDowngradeLevel = null; // null = no downgrade, 'CAT IIIa', 'CAT II', 'CAT I', 'NONE'
  let rvsmBlock = false;

  const open = melItems.filter(m =>
    m.aircraft_tail === aircraft.tail_number &&
    (m.status === 'open' || m.status === 'deferred' || m.status === 'expired')
  );

  for (const mel of open) {
    const desc = (mel.title || mel.description || '').toLowerCase();
    const ref = (mel.mel_reference || '').toLowerCase();

    // ── RVSM-critical MEL triggers ──────────────────────────────────────────
    if (/pitot|static port|static system|pitot heat|aoa sensor|aoa vane|aoa heater/i.test(desc + ref)) {
      rvsmBlock = true;
      reasons.push({ type: 'rvsm', text: `Pitot-static MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'pitot_static' });
    }
    if (/air data computer|adc|adc-?[123]/i.test(desc + ref)) {
      rvsmBlock = true;
      reasons.push({ type: 'rvsm', text: `ADC MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'adc' });
    }
    if (/altimeter|baro|barometric|altitude encoder/i.test(desc + ref)) {
      rvsmBlock = true;
      reasons.push({ type: 'rvsm', text: `Altimetry MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'altimetry' });
    }
    if (/transponder|mode c|mode s|xpdr|ads-b/i.test(desc + ref)) {
      rvsmBlock = true;
      reasons.push({ type: 'rvsm', text: `Transponder MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'transponder' });
    }
    if (/autopilot|afcs|altitude hold|ap channel/i.test(desc + ref)) {
      rvsmBlock = true;
      if (!catDowngradeLevel || catDowngradeLevel === null) catDowngradeLevel = 'CAT I';
      reasons.push({ type: 'both', text: `Autopilot MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'autopilot' });
    }

    // ── CAT-critical MEL triggers ────────────────────────────────────────────
    if (/radio altimeter|ra-?[12]|radio alt/i.test(desc + ref)) {
      if (!catDowngradeLevel || catDowngradeLevel === 'CAT I') catDowngradeLevel = 'CAT II';
      reasons.push({ type: 'cat', text: `Radio Altimeter MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'radio_altimeter' });
    }
    if (/ils receiver|ils-?[12]|mmr|glideslope|localizer/i.test(desc + ref)) {
      if (!catDowngradeLevel) catDowngradeLevel = 'CAT I';
      else if (catDowngradeLevel === 'CAT IIIb' || catDowngradeLevel === 'CAT IIIa') catDowngradeLevel = 'CAT I';
      reasons.push({ type: 'cat', text: `ILS/MMR MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'ils_receivers' });
    }
    if (/autobrake|ground spoiler|decel computer/i.test(desc + ref)) {
      if (!catDowngradeLevel || catDowngradeLevel === 'CAT IIIb') catDowngradeLevel = 'CAT IIIa';
      reasons.push({ type: 'cat', text: `Autobrake/Spoiler MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'ground_spoilers' });
    }
    if (/pfd|primary flight display|fma|flight mode annunciator/i.test(desc + ref)) {
      if (!catDowngradeLevel || catDowngradeLevel === 'CAT IIIb') catDowngradeLevel = 'CAT IIIa';
      reasons.push({ type: 'cat', text: `FMA/PFD MEL: ${mel.title || mel.description}`, melRef: mel.mel_reference, system: 'fma_displays' });
    }
  }

  return { catDowngradeLevel, rvsmBlock, reasons };
}

// ── Dispatch impact per degraded state ──────────────────────────────────────
export function getDispatchImpact(catDowngradeLevel, rvsmBlock) {
  const impacts = [];
  if (rvsmBlock) {
    impacts.push({ severity: 'critical', text: 'RVSM N/O — FL290–FL410 airspace prohibited', detail: 'Must operate at or below FL280 or above FL410. Fuel planning and routing must be revised.' });
    impacts.push({ severity: 'critical', text: 'North Atlantic Track (NAT) HLA operations blocked', detail: 'All NAT MNPS/RVSM tracks require RVSM approval.' });
    impacts.push({ severity: 'warning', text: 'Notify ATC at first contact — code "RVSM not approved"', detail: 'ICAO flight plan item 10 must reflect no RVSM in equipment field.' });
  }
  if (catDowngradeLevel === 'CAT I') {
    impacts.push({ severity: 'critical', text: 'Low-vis ops blocked — minima: DH 200ft / RVR 550m', detail: 'CAT II/III approaches not authorized. Airport-specific LVO procedures unavailable.' });
  } else if (catDowngradeLevel === 'CAT II') {
    impacts.push({ severity: 'warning', text: 'CAT III reduced to CAT II — DH 100ft / RVR 300m', detail: 'Autoland not authorized. Decision height minimum 100ft. CAT III runway holds required.' });
  } else if (catDowngradeLevel === 'CAT IIIa') {
    impacts.push({ severity: 'warning', text: 'Reduced to CAT IIIa — DH 50ft / RVR 200m minimum', detail: 'CAT IIIb/c autoland not available. Rollout guidance degraded.' });
  }
  return impacts;
}

const SYSTEM_STATUS_COLORS = {
  ok:       { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30',  label: 'SERVICEABLE' },
  warning:  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  label: 'MEL DEFERRED' },
  critical: { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    label: 'DEGRADED' },
  unknown:  { text: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   label: 'UNKNOWN' },
};

// ── RVSM System Matrix component ─────────────────────────────────────────────
export default function RVSMSystemMatrix({ aircraft, melItems = [], impactReasons = [] }) {
  const [expanded, setExpanded] = useState({});

  const getSystemStatus = (sysId) => {
    const affectedReasons = impactReasons.filter(r => r.system === sysId);
    if (affectedReasons.length === 0) return 'ok';
    const hasCritical = affectedReasons.some(r => {
      const sys = RVSM_SYSTEMS.find(s => s.id === sysId);
      return sys?.severity === 'critical';
    });
    return hasCritical ? 'critical' : 'warning';
  };

  return (
    <div className="space-y-2">
      {RVSM_SYSTEMS.map(sys => {
        const status = getSystemStatus(sys.id);
        const cfg = SYSTEM_STATUS_COLORS[status];
        const isOpen = expanded[sys.id];
        const affectedReasons = impactReasons.filter(r => r.system === sys.id);
        const impactTag = sys.impact === 'both' ? '⚡ RVSM + CAT' : sys.impact === 'rvsm' ? '📡 RVSM' : '🛡️ CAT';

        return (
          <div key={sys.id} className={cn('rounded-xl border transition-all', cfg.border, cfg.bg)}>
            <button
              onClick={() => setExpanded(p => ({ ...p, [sys.id]: !p[sys.id] }))}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', status === 'ok' ? 'bg-green-400' : status === 'critical' ? 'bg-red-400 animate-pulse' : 'bg-amber-400')} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{sys.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{sys.ata}</span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', cfg.text, 'bg-transparent')}>{impactTag}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className={cn('text-[9px] font-extrabold px-2 py-0.5 rounded-full border', cfg.text, cfg.border)}>
                  {cfg.label}
                </span>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 space-y-2.5 border-t border-white/8 pt-2.5">
                {/* Subsystem checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {sys.subsystems.map(sub => {
                    const subAffected = affectedReasons.some(r =>
                      sub.toLowerCase().includes(r.system?.replace('_', ' ')) ||
                      (r.text || '').toLowerCase().includes(sub.toLowerCase().split(' ')[0])
                    );
                    return (
                      <div key={sub} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px]',
                        subAffected ? 'bg-red-900/30 border border-red-500/30' : 'bg-secondary/30'
                      )}>
                        {subAffected
                          ? <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                          : <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        }
                        <span className={subAffected ? 'text-red-300' : 'text-muted-foreground'}>{sub}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Regulatory note */}
                <div className="flex items-start gap-2 bg-secondary/20 rounded-lg px-3 py-2">
                  <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-blue-300 leading-snug">{sys.note}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{sys.icaoRef}</p>
                  </div>
                </div>

                {/* Active MEL triggers */}
                {affectedReasons.length > 0 && (
                  <div className="space-y-1">
                    {affectedReasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-red-300 font-bold">{r.text}</p>
                          {r.melRef && <p className="text-[9px] font-mono text-red-400/60">REF: {r.melRef}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}