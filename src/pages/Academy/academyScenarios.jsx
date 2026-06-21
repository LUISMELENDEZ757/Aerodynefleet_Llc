// ── Mock Aircraft Discrepancy Scenarios ──────────────────────────────────────

export const MOCK_DISCREPANCIES = [
  {
    id: 'disc-001',
    title: '#1 Engine Hydraulic Overheat',
    aircraft: 'N455GJ',
    aircraft_type: 'B737-800',
    station: 'KEWR',
    ata: '29-10',
    severity: 'warning',
    flight_number: 'AFL4474',
    scenario: `During pushback at KEWR, the flight crew reports an EICAS WARNING: HYD SYS A OVERHEAT. Aircraft returned to gate. Fault code: HYD-29-0042.

The #1 Engine hydraulic pump has shown an overheat indication. Ground temperature is 94°F. The aircraft has been in service for 3 hours with no prior write-ups today.

**Your task:** Create a logbook discrepancy entry and determine the appropriate corrective action per AMM 29-10-00.`,
    correctAction: 'Inspect #1 engine hydraulic pump for leaks and overheating. Check hydraulic fluid level. If fluid level satisfactory and no leaks found, perform ground run to verify system returns to normal. If fault persists, replace hydraulic pump per AMM 29-10-00-400.',
    mel_applicable: false,
    ata_system: 'Hydraulic Power',
    difficulty: 'Intermediate',
    hints: ['Check fluid level first', 'Ground run required to verify repair', 'Document ambient temperature in notes'],
  },
  {
    id: 'disc-002',
    title: 'Left Main Landing Gear Door Light',
    aircraft: 'N123AB',
    aircraft_type: 'B737-900',
    station: 'KORD',
    ata: '32-30',
    severity: 'caution',
    flight_number: 'AFL2201',
    scenario: `Post-flight inspection at KORD reveals the Left Main Landing Gear door light (DOOR OPEN) is illuminated on the gear panel during the transit check. Crew report no abnormal gear indications in flight. Ground time is 45 minutes before next departure.

**Your task:** Evaluate if this is MEL-able, create the appropriate logbook entry, and determine if aircraft can depart on schedule.`,
    correctAction: 'Inspect LH MLG door micro-switch. Clean and check micro-switch contacts per AMM 32-30-00. If switch fails continuity check, replace per AMM 32-30-00-400. MEL 32-30-1 permits dispatch with door light inop provided visual confirmation of door closed position.',
    mel_applicable: true,
    mel_ref: '32-30-1',
    mel_category: 'C',
    ata_system: 'Landing Gear',
    difficulty: 'Intermediate',
    hints: ['Check MEL section 32', 'Visual check of door position required', 'Category C allows 10-day deferral'],
  },
  {
    id: 'disc-003',
    title: 'APU Bleed Air Fault — No Ground Air',
    aircraft: 'N789CF',
    aircraft_type: 'B737 MAX 8',
    station: 'KDFW',
    ata: '49-20',
    severity: 'caution',
    flight_number: 'AFL8801',
    scenario: `Aircraft arrived at KDFW with an EICAS CAUTION: APU BLEED. APU started normally but bleed air system indicates fault. Cabin not cooling at gate. External ground air unit is unavailable at this gate. Outside temperature: 102°F. Next departure in 90 minutes.

**Your task:** Troubleshoot APU bleed fault, determine MEL applicability, and ensure passenger comfort for boarding.`,
    correctAction: 'Check APU bleed air duct for leaks per AMM 49-20-00. Reset APU bleed valve via maintenance BITE page. If fault clears, monitor for 10 minutes. If fault recurs, defer per MEL 49-21-1 (Category B — 3 days). Coordinate ground air unit from adjacent gate for cabin conditioning.',
    mel_applicable: true,
    mel_ref: '49-21-1',
    mel_category: 'B',
    ata_system: 'APU',
    difficulty: 'Advanced',
    hints: ['APU BITE reset should be first action', 'Category B = 3 calendar days', 'Passenger comfort requires coordination'],
  },
  {
    id: 'disc-004',
    title: 'Windshield Heat Inoperative',
    aircraft: 'N342PW',
    aircraft_type: 'B737-700',
    station: 'KDEN',
    ata: '30-20',
    severity: 'warning',
    flight_number: 'AFL5512',
    scenario: `Pre-departure check at KDEN reveals the Captain's side windshield heat (L WSHLD HTR) is showing INOP on the overhead panel. Flight is scheduled for a 3.5-hour route to KSEA with forecast icing conditions en route (Moderate icing between FL200-FL280).

**Your task:** Determine airworthiness, MEL applicability, and any operational restrictions.`,
    correctAction: 'Check windshield heat controller circuit breaker (CB panel, row D). If CB tripped, reset once. If fault persists, check windshield heat controller per AMM 30-20-00. MEL 30-21-1 permits dispatch with L windshield heat INOP provided flight is restricted to routes/altitudes where icing conditions are not forecast. For KDEN-KSEA with forecast icing, aircraft is NOT DISPATCHABLE until repaired or route modified to avoid icing.',
    mel_applicable: true,
    mel_ref: '30-21-1',
    mel_category: 'B',
    ata_system: 'Ice & Rain Protection',
    difficulty: 'Advanced',
    hints: ['Check circuit breakers first', 'Icing forecast affects MEL applicability', 'Route modification may allow dispatch'],
  },
  {
    id: 'disc-005',
    title: 'Galley Power Bus 3 Tripped',
    aircraft: 'N901GH',
    aircraft_type: 'B737-800',
    station: 'KMIA',
    ata: '24-22',
    severity: 'caution',
    flight_number: 'AFL7733',
    scenario: `Flight attendant reports Aft Galley power is out. No coffee makers, ovens, or refrigeration in rows 28-34. Aircraft is 45 minutes from departure with 165 passengers boarded.

**Your task:** Troubleshoot, determine if this is dispatch-critical, and coordinate with the cabin crew.`,
    correctAction: 'Check Galley Power Bus 3 circuit breaker — ELEC panel, CB C-15. Reset once. If bus does not restore, isolate specific galley unit causing the trip (likely oven or refrigeration unit). Disconnect suspect unit, reset bus. MEL 24-22-1 (Category D, 120 days) permits dispatch with individual galley bus inop provided IFE and safety equipment circuits are verified functional.',
    mel_applicable: true,
    mel_ref: '24-22-1',
    mel_category: 'D',
    ata_system: 'Electrical Power',
    difficulty: 'Basic',
    hints: ['Circuit breakers first', 'Category D = 120 days — aircraft can depart', 'Notify cabin crew of limitation'],
  },
  // ── MEL Scenarios ─────────────────────────────────────────────────────────
  {
    id: 'mel-001',
    title: 'MEL CAT A — Cargo Fire Loop Inoperative (ETOPS)',
    aircraft: 'N881LT',
    aircraft_type: 'B737 MAX 8',
    station: 'KJFK',
    ata: '26-15',
    severity: 'warning',
    flight_number: 'AFL2244',
    category: 'MEL',
    scenario: `Post-maintenance check at KJFK reveals the Aft Cargo Compartment Fire Detection Loop B is inoperative. EICAS: AFT CARGO FIRE DET. Aircraft is scheduled for a JFK-LHR ETOPS-180 transatlantic departure in 4 hours.

**Background:** The aircraft holds ETOPS-180 approval. MEL 26-15-1 permits dispatch with one fire detection loop inop under specific conditions. However, the cargo fire protection loop is an ETOPS-critical item per the company's ETOPS operations manual.

**Your task:** Determine MEL category, ETOPS impact, required placards, and if dispatch is authorized for the transatlantic route.`,
    correctAction: `MEL 26-15-1 applies — Category A (must be addressed before departure per the time limit specified in MEL remarks).

ETOPS Impact: With one cargo fire loop INOP, ETOPS operations are restricted. Per ETOPS program, both fire detection loops must be operative for ETOPS-180 dispatch. Aircraft may be dispatched on non-ETOPS routing under MEL 26-15-1 with:
1. Placard required — "AFT CARGO FIRE DET LOOP B INOP — MEL 26-15-1"
2. Crew notification in the dispatch release
3. Flight restricted to routes with diversion airports within 60 min (non-ETOPS)

For JFK-LHR ETOPS-180: Aircraft is NOT authorized for this route until repaired. Reschedule or swap aircraft.`,
    mel_applicable: true,
    mel_ref: '26-15-1',
    mel_category: 'A',
    etops_critical: true,
    ata_system: 'Fire Protection',
    difficulty: 'Advanced',
    hints: ['Category A — no standard interval, check MEL remarks for specific time limit', 'ETOPS critical items require BOTH loops operative', 'JFK-LHR is ETOPS-180 — route is blocked'],
  },
  {
    id: 'mel-002',
    title: 'MEL CAT B — Passenger Oxygen System Partial',
    aircraft: 'N334WK',
    aircraft_type: 'B737-800',
    station: 'KATL',
    ata: '35-10',
    severity: 'warning',
    flight_number: 'AFL5599',
    category: 'MEL',
    scenario: `Pre-flight inspection at KATL reveals 4 passenger oxygen mask generators in Row 22 failed deployment test (units 22A, 22B, 22C, 22D). All other rows pass. Aircraft has 162 passengers booked for a 2.5-hour flight to KBOS at FL350.

**Your task:** Determine MEL applicability, required crew procedures, and any seating restrictions.`,
    correctAction: `MEL 35-10-1 (Category B — 3 calendar days) permits dispatch with up to 4 inop passenger oxygen units provided:
1. Affected seats (22A, 22B, 22C, 22D) are placarded INOP and must not be occupied
2. Crew procedures (M-procedure): Flight crew must verify adjacent units functional
3. O-procedure: Announce to passengers that row 22 seats are blocked
4. Create MEL deferral in Aerodyne Fleet OS with placard_required = TRUE
5. Dispatch release must note oxygen restriction and seat blocking`,
    mel_applicable: true,
    mel_ref: '35-10-1',
    mel_category: 'B',
    ata_system: 'Oxygen',
    difficulty: 'Intermediate',
    hints: ['Affected seats must be blocked — not just placarded', 'Both M and O procedures apply', 'Notify load control immediately'],
  },
  {
    id: 'mel-003',
    title: 'MEL CAT C — TCAS II RA Inoperative',
    aircraft: 'N220FG',
    aircraft_type: 'B737-900',
    station: 'KSFO',
    ata: '34-43',
    severity: 'caution',
    flight_number: 'AFL9910',
    category: 'MEL',
    scenario: `During preflight BITE check at KSFO, the TCAS II system generates a fault: RA (Resolution Advisory) function is inoperative. Traffic Advisories (TA) are functional. Aircraft is scheduled for 6 segments today across busy Class B airspace.

**Your task:** Assess MEL 34-43-1 applicability, determine if aircraft can operate in Class B/C airspace, and identify required ATC coordination.`,
    correctAction: `MEL 34-43-1 (Category C — 10 calendar days) permits dispatch with TCAS RA inop provided:
1. Traffic Advisory (TA) function remains operative (confirmed)
2. Placard: "TCAS RA INOP — MEL 34-43-1" on EFIS/TCAS control panel
3. O-procedure: Flight crew must advise ATC that TCAS RA is inop: "Unable TCAS RA, TCAS TA operative"
4. Operations in Class A, B, C airspace are permitted with TA only`,
    mel_applicable: true,
    mel_ref: '34-43-1',
    mel_category: 'C',
    ata_system: 'Navigation',
    difficulty: 'Intermediate',
    hints: ['TA still works — verify this first', 'ATC must be notified on EVERY flight segment', 'Class B airspace is still permitted'],
  },
  // ── NEF Scenarios ──────────────────────────────────────────────────────────
  {
    id: 'nef-001',
    title: 'NEF — Seat Back Pocket Torn (Rows 14-17)',
    aircraft: 'N445PQ',
    aircraft_type: 'B737-800',
    station: 'KBOS',
    ata: '25-20',
    severity: 'advisory',
    flight_number: 'AFL1122',
    category: 'NEF',
    scenario: `Cabin crew reports multiple seat back pockets are torn in rows 14-17 (8 pockets total). The pockets cannot hold the safety card in position. No structural damage to seat frames. Aircraft departs in 2 hours with a full load.

**Your task:** Determine if this qualifies as a NEF deferral, the documentation required, and any safety implications.`,
    correctAction: `This qualifies as a NEF (Non-Essential Equipment and Furnishings) deferral:

✓ Item not required by FAR 121 or airworthiness regulations for dispatch
✓ Item is cosmetic/non-structural
✗ EXCEPTION: Safety cards must be accessible to passengers per FAR 121.571

Required Action:
1. Ensure safety briefing cards are secured by alternate means for affected rows
2. Notify cabin crew to manually distribute safety cards pre-departure
3. Create NEF logbook entry: "8x seat back pockets torn, rows 14-17. Safety cards secured via alternate method per NEF program."
4. Repair at next scheduled maintenance opportunity`,
    mel_applicable: false,
    nef_applicable: true,
    ata_system: 'Equipment / Furnishings',
    difficulty: 'Basic',
    hints: ['Not every cabin defect is MEL-applicable', 'Safety cards must still be accessible — this is the key issue', 'NEF items have no hard repair interval'],
  },
  {
    id: 'nef-002',
    title: 'NEF — IFE Screen Row 28 Inoperative',
    aircraft: 'N667RS',
    aircraft_type: 'B737 MAX 8',
    station: 'KLAX',
    ata: '23-73',
    severity: 'advisory',
    flight_number: 'AFL3388',
    category: 'NEF',
    scenario: `Gate agent reports 3 IFE (In-Flight Entertainment) seat-back screens are dark in Row 28 (28D, 28E, 28F). The main cabin IFE server is functional. Overhead safety video plays normally. Aircraft departs in 75 minutes for a 5-hour flight to KEWR.

**Your task:** Determine MEL vs. NEF applicability, required placards, and passenger handling.`,
    correctAction: `IFE seat-back screens are Non-Essential Equipment and Furnishings (NEF):

✓ IFE screens not required by FAR 121 for dispatch
✓ Safety videos delivered via overhead screens (functional)
✓ No structural or safety impact

Required Actions:
1. NEF logbook entry: "3x IFE seat screens inop — 28D, 28E, 28F. NEF deferral per approved program."
2. Placard seats: "IFE INOP"
3. Notify affected passengers prior to boarding — offer seat reassignment if available
4. Flag for next C-check cabin refurbishment`,
    mel_applicable: false,
    nef_applicable: true,
    ata_system: 'Communications / IFE',
    difficulty: 'Basic',
    hints: ['IFE is entertainment, not safety equipment', 'Overhead safety video must still work', 'Check fleet NEF percentage limits'],
  },
  // ── CDL Scenarios ──────────────────────────────────────────────────────────
  {
    id: 'cdl-001',
    title: 'CDL — Wing Fairing Panel Missing (RH)',
    aircraft: 'N778HJ',
    aircraft_type: 'B737-800',
    station: 'KIAH',
    ata: '57-40',
    severity: 'caution',
    flight_number: 'AFL6621',
    category: 'CDL',
    scenario: `During pre-departure walk-around at KIAH, the technician discovers the RH Wing-to-Body fairing panel (Station 663-737, lower surface) is missing. Fastener holes show no damage. Aircraft had just completed heavy maintenance and the panel was not reinstalled. Flight departs in 3 hours to KDFW.

**Your task:** Determine if a CDL applies, identify any performance penalties, and document the deferral correctly.`,
    correctAction: `CDL Application — Boeing B737-800 AFM Supplement CDL 57-40-1: "Wing Lower Surface Fairing Panel — One panel may be missing provided:
1. Panel area does not exceed 18" x 24"
2. No structural damage to surrounding skin
3. Performance penalty: +0.3% drag increase — apply fuel correction per CDL performance table"

Required Documentation:
- Entry type: Deferred / CDL
- ATA: 57-40
- Description: "RH wing-to-body lower fairing panel missing — CDL 57-40-1. No structural damage confirmed."
- Placard: Required — "CDL 57-40-1 ACTIVE — SEE DISPATCH RELEASE"
- Notify dispatch to apply performance correction`,
    mel_applicable: false,
    cdl_applicable: true,
    cdl_ref: 'CDL 57-40-1',
    ata_system: 'Wings',
    difficulty: 'Advanced',
    hints: ['CDL is in the AFM Supplement — different from MEL', 'Performance penalty means fuel burn increases', 'Structural damage would void CDL applicability'],
  },
  {
    id: 'cdl-002',
    title: 'CDL — Static Wick Missing (Multiple)',
    aircraft: 'N112MX',
    aircraft_type: 'B737-900',
    station: 'KPHX',
    ata: '24-60',
    severity: 'advisory',
    flight_number: 'AFL4455',
    category: 'CDL',
    scenario: `Walk-around at KPHX reveals 3 static discharge wicks are missing: 1 from the RH aileron trailing edge and 2 from the RH elevator. Aircraft has 72 wicks total installed (69 remaining). Departure is in 90 minutes.

**Your task:** Apply the correct CDL, assess weather impact on the CDL's operational limits, and document.`,
    correctAction: `CDL 24-60-1 — Static Discharge Wicks: "Missing wicks are permissible provided no more than 10% of total wicks are missing per surface."

Assessment:
- RH aileron: 1 missing of 8 = 12.5% → EXCEEDS 10% limit → CDL NOT APPLICABLE
- RH elevator: 2 missing of 12 = 16.7% → ALSO EXCEEDS 10% limit

ACTION: Neither surface qualifies for CDL deferral. Both aileron and elevator wicks must be replaced before dispatch. Installation takes <30 min — order wicks from stores and install per AMM 24-60-00.`,
    mel_applicable: false,
    cdl_applicable: false,
    cdl_ref: 'CDL 24-60-1',
    ata_system: 'Electrical Power',
    difficulty: 'Advanced',
    hints: ['Calculate the % missing per surface — not total aircraft', 'CDL has specific percentage limits per surface', 'Static wicks are simple to replace — check stores first'],
  },
  {
    id: 'cdl-003',
    title: 'CDL + MEL Combo — Flap Vortex Generator Missing & Speed Brake Advisory',
    aircraft: 'N560WR',
    aircraft_type: 'B737-800',
    station: 'KSEA',
    ata: '27-61',
    severity: 'caution',
    flight_number: 'AFL7711',
    category: 'CDL',
    scenario: `During transit check at KSEA, two issues found simultaneously:
1. One vortex generator (VG) is missing from the LH wing leading edge (CDL item)
2. Speed brake EICAS advisory: SPEED BRAKE — intermittent (possible MEL item)

The flight is a 3:20 route to KORD at FL370.

**Your task:** Work both issues independently, determine combined dispatch status, and create separate logbook entries for each.`,
    correctAction: `Issue 1 — Missing VG (CDL):
B737-800 CDL 57-20-1: Up to 3 VGs may be missing from the leading edge, provided they are not consecutive. 1 VG missing is within CDL limits.
- Performance penalty: Small increase in stall speed — apply CDL Vspeed corrections
- Placard: "CDL 57-20-1 — 1 LH LE VG MISSING"
- Logbook entry: Deferred/CDL, ATA 57-20

Issue 2 — Speed Brake Advisory (MEL):
Run BITE on speed brake system. If fault is intermittent and ground test passes, MEL 27-61-1 (Category C, 10 days) may apply.
- Placard: "SPEED BRAKE ADVISORY INOP — MEL 27-61-1"
- Logbook entry: Deferred/MEL, ATA 27-61

Combined Dispatch: Both deferrals are permissible as they are independent. Dispatch release must reflect both CDL performance correction and MEL note.`,
    mel_applicable: true,
    cdl_applicable: true,
    mel_ref: '27-61-1',
    mel_category: 'C',
    cdl_ref: 'CDL 57-20-1',
    ata_system: 'Flight Controls / Wings',
    difficulty: 'Advanced',
    hints: ['CDL and MEL are separate documents — handle independently', 'Multiple deferrals can be active simultaneously', 'Combined impact on performance must be assessed'],
  },
  {
    id: 'disc-006',
    title: 'Oil Consumption — Engine 1 High',
    aircraft: 'N567KT',
    aircraft_type: 'B737-900',
    station: 'KLAX',
    ata: '79-00',
    severity: 'advisory',
    flight_number: 'AFL3344',
    scenario: `Engineering trend monitoring shows Engine 1 consumed 0.9 quarts per flight hour over the last 12 flights (normal is <0.3 qt/hr). No EICAS messages. Borescope inspection was performed 3 flights ago — no findings. Today's oil quantity is at MIN.

**Your task:** Service the oil, create a logbook entry, and determine if an engineering write-up is required.`,
    correctAction: 'Service Engine 1 oil to FULL per AMM 79-00-00. Create Oil Servicing logbook entry documenting: amount added, oil type (Mobil Jet II or approved), engine cycles, and oil consumption rate. Flag for engineering review — consumption >0.5 qt/hr for 10 consecutive flights requires Engineering Action (EA) per continuous airworthiness program. Notify MCC of consumption trend.',
    mel_applicable: false,
    ata_system: 'Oil System',
    difficulty: 'Intermediate',
    hints: ['Document exact amount added', 'Consumption rate triggers EA threshold', 'MCC notification required for trending'],
  },
];