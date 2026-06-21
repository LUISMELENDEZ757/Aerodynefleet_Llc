// ── Aerodyne Fleet OS Academy — Part 147 Aligned Curriculum ──────────────────

export const ACADEMY_COURSES = [
  {
    id: 'orientation',
    title: 'Platform Orientation',
    subtitle: 'How Aerodyne Fleet OS Works',
    icon: '🏠',
    color: '#f59e0b',
    level: 'Foundational',
    part147: 'General — Module 1',
    estimatedMinutes: 20,
    lessons: [
      {
        id: 'orient-1',
        title: 'Welcome to Aerodyne Fleet OS',
        content: `Aerodyne Fleet OS is a fully integrated aviation maintenance operating system designed for Part 145 repair stations and airline maintenance departments. It digitizes every step of the maintenance workflow — from aircraft discrepancy entry to Return-to-Service sign-off.

**Why it matters:**
Traditional paper logbooks create compliance gaps, lost records, and delayed maintenance actions. Aerodyne Fleet OS eliminates paper by providing real-time digital records accessible from any device.

**Who uses it:**
- AMTs / A&P Technicians — log discrepancies, corrective actions, and sign off work
- Inspection Supervisors — review and approve RII items
- MCC Controllers — monitor fleet status in real-time
- Dispatchers — verify aircraft airworthiness before release
- Engineers — manage MEL items, track ADs, and issue CDLs`,
      },
      {
        id: 'orient-2',
        title: 'The 7-Step Maintenance Workflow',
        content: `Every maintenance action in Aerodyne Fleet OS follows a structured 7-step process aligned with 14 CFR Part 43 requirements:

**Step 1 — Event Detection**
A discrepancy is identified either by a pilot write-up (PIREP), EICAS/BITE fault message, or technician observation during a ground inspection.

**Step 2 — Logbook Entry**
The technician opens the E-Logbook, selects the aircraft tail, and creates a new log entry. The system auto-assigns a log page number (e.g., LP#0042).

**Step 3 — ATA Chapter Classification**
Each discrepancy is classified under the appropriate ATA chapter (e.g., ATA 27 — Flight Controls, ATA 73 — Engine Fuel & Control).

**Step 4 — Work Performed**
Technicians document corrective action, parts installed (P/N, S/N), and time. The system validates against the AMM reference.

**Step 5 — Parts & Supply**
If parts are required, a Supply Requisition (BOR/ROB) is generated automatically from the logbook entry.

**Step 6 — Inspection / RII**
Required Inspection Items (RII) are flagged for supervisor sign-off. The system enforces dual signature requirements.

**Step 7 — Return to Service**
Upon completion, the certifying technician applies a digital signature (14 CFR 43.9). The aircraft status updates to "IN SERVICE."`,
      },
      {
        id: 'orient-3',
        title: 'Navigating the Left Rail',
        content: `The left sidebar (Left Rail) is your primary navigation. It is organized into operational groups:

**Core** — Quick access to Home, Maintenance Control, MCC Ops Hub
**Fleet Health** — Fleet Dashboard, ETOPS Monitor, Engine Health Analytics
**Line Maintenance** — E-Logbook, Technician Mode, Work Assignments
**Engineering** — MEL Deferrals, AD Tracking, Heavy MX
**Records & Compliance** — CRS, Signature Audit, Release Archive
**Dispatch & Operations** — Flight Board, IROPS, AI Dispatch Copilot
**Crew Operations** — Crew Control, FAR 117 Calculator
**Admin / System** — User Management, Settings, Academy

**Pro Tip:** Click any group header to expand/collapse it. The system remembers which group is active based on your current page.`,
      },
    ],
    quiz: [
      { q: 'What regulation governs maintenance record requirements?', options: ['14 CFR Part 91', '14 CFR Part 43', '14 CFR Part 121', '14 CFR Part 65'], answer: 1 },
      { q: 'What does ATA stand for?', options: ['Aviation Technical Association', 'Air Transport Association', 'Aircraft Technical Authority', 'Airworthiness Technical Act'], answer: 1 },
      { q: 'What is an RII?', options: ['Routine Inspection Item', 'Required Inspection Item', 'Remote Inspection Interface', 'Regulatory Inspection Index'], answer: 1 },
      { q: 'In Aerodyne Fleet OS, what is auto-assigned when creating a log entry?', options: ['ATA Chapter', 'Log Page Number', 'Technician ID', 'Aircraft Type'], answer: 1 },
      { q: 'Which group in the left rail contains the E-Logbook?', options: ['Fleet Health', 'Engineering', 'Line Maintenance', 'Records & Compliance'], answer: 2 },
    ],
  },
  {
    id: 'elogbook',
    title: 'Electronic Logbook (E-Logbook)',
    subtitle: '14 CFR 43.9 Compliance',
    icon: '📖',
    color: '#3b82f6',
    level: 'Intermediate',
    part147: 'Airframe / Powerplant — Module 3',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'elog-1',
        title: 'Creating a Discrepancy Entry',
        content: `The E-Logbook is the heart of Aerodyne Fleet OS. Every maintenance action begins here.

**To create a new entry:**
1. Navigate to Line Maintenance → E-Logbook
2. Select the aircraft tail from the dropdown (or scan the QR code)
3. Click "New Entry" or choose a Quick Template:
   - **Pilot Discrepancy** — for pilot write-ups
   - **Tech Discrepancy** — for technician-identified issues
   - **Parts Installation** — documents P/N and S/N
   - **Deferral / MEL** — defers to MEL with category (A/B/C/D)
   - **Oil Service** — engine oil servicing record

**Required Fields (14 CFR 43.9):**
- Description of work performed
- Date of completion
- Name of person performing work
- Certificate number (A&P, IA, or repairman certificate)
- Signature

The system enforces all required fields before allowing submission.`,
      },
      {
        id: 'elog-2',
        title: 'MEL Deferrals and Categories',
        content: `The Minimum Equipment List (MEL) allows aircraft to be dispatched with certain inoperative items under specific conditions.

**MEL Categories:**
- **Category A** — No standard interval; repair as specified in MEL remarks. (Most critical)
- **Category B** — Must be repaired within 3 consecutive calendar days
- **Category C** — Must be repaired within 10 consecutive calendar days
- **Category D** — Must be repaired within 120 consecutive calendar days

**Creating a Deferral in Aerodyne Fleet OS:**
1. Open E-Logbook → Select "Deferral / MEL" template
2. Enter MEL reference number (e.g., 27-51-01)
3. Select category (A/B/C/D)
4. System auto-calculates expiry date
5. Placard requirement flag is triggered automatically
6. Flight restrictions are noted in the dispatch release

**IMPORTANT:** Category A deferrals with flight restrictions will trigger a red alert banner on the TechOps Logbook and Fleet Dashboard.`,
      },
      {
        id: 'elog-3',
        title: 'Digital Signatures and 14 CFR 43.9',
        content: `14 CFR 43.9 requires a signature on every maintenance record. Aerodyne Fleet OS uses cryptographic digital signatures.

**How digital signatures work in Aerodyne Fleet OS:**
- Technician enters name, certificate type, and certificate number
- System generates a SHA-256 hash of the entry content
- Signature is locked — the entry cannot be modified after signing
- Any tampering is detected via hash comparison in the Signature Audit page

**Signature Types:**
- **Technician Sign-Off** — Standard maintenance completion
- **RII Sign-Off** — Required Inspection Item approval
- **Supervisor Approval** — Engineering/MCC review
- **MCC Review** — Maintenance Control acknowledgment

**Finding signed records:** Navigate to Records & Compliance → Signature Audit to view all signed entries and verify hash integrity.`,
      },
    ],
    quiz: [
      { q: 'What CFR section governs maintenance record content requirements?', options: ['14 CFR 91.417', '14 CFR 43.9', '14 CFR 145.209', '14 CFR 65.81'], answer: 1 },
      { q: 'A Category C MEL item must be repaired within:', options: ['3 days', '7 days', '10 days', '120 days'], answer: 2 },
      { q: 'What technology does Aerodyne Fleet OS use to lock signed entries?', options: ['AES Encryption', 'SHA-256 Hashing', 'RSA Signing', 'MD5 Checksum'], answer: 1 },
      { q: 'Which MEL category has NO standard repair interval?', options: ['Category A', 'Category B', 'Category C', 'Category D'], answer: 0 },
      { q: 'A restrictive MEL item in Aerodyne Fleet OS triggers:', options: ['A yellow advisory', 'A red alert banner on the Fleet Dashboard', 'An automatic AOG status', 'A crew notification only'], answer: 1 },
    ],
  },
  {
    id: 'fleetops',
    title: 'Fleet Dashboard & MCC Operations',
    subtitle: 'Real-Time Fleet Monitoring',
    icon: '✈️',
    color: '#10b981',
    level: 'Intermediate',
    part147: 'Airframe — Module 5',
    estimatedMinutes: 25,
    lessons: [
      {
        id: 'fleet-1',
        title: 'Understanding the Fleet Dashboard',
        content: `The Fleet Dashboard is the MCC (Maintenance Control Center) primary tool for monitoring all aircraft simultaneously.

**Key Features:**
- **KPI Cards** — Total fleet count, In Service, In Work, Out of Service
- **Aircraft Cards** — Each card shows tail number, type, status, MEL count, MCC locks
- **Quick Filters** — Filter by AOG, MEL, Restrictive MEL, ETOPS, In Work, In Service
- **Status Priority Sort** — AOG aircraft always appear first, followed by In Work, then In Service

**Aircraft Status Colors:**
- 🟢 **IN SERVICE** — Aircraft airworthy and available for dispatch
- 🔵 **IN WORK** — Under active maintenance
- 🔴 **AOG (Out of Service)** — Aircraft grounded, not available
- ⚫ **RETIRED** — Aircraft removed from service

**Readiness Score:**
Each card shows RDY (green), AT RISK (yellow), or NOT RDY (red) based on open write-ups, expired MELs, and OOS status.`,
      },
      {
        id: 'fleet-2',
        title: 'MCC Locks and Positive Fix',
        content: `An MCC Lock is placed by Maintenance Control when an aircraft requires a Positive Fix concurrence before Return to Service.

**When to use MCC Lock:**
- Repetitive write-up on same ATA chapter (chronic discrepancy)
- Safety-critical system failure requiring engineering review
- After a Category A MEL item is deferred
- During a major component replacement

**Lock Process:**
1. MCC Supervisor places lock via Fleet Dashboard → Aircraft Detail
2. Lock appears as a red "LOCKED" badge on the aircraft card
3. Technician must provide concurrence notes to acknowledge the required fix
4. MCC removes lock only after verification

This process mirrors the FAA's "Positive Fix" requirement for repetitive discrepancies.`,
      },
    ],
    quiz: [
      { q: 'In the Fleet Dashboard, which status appears first in the sort order?', options: ['IN SERVICE', 'IN WORK', 'AOG', 'RETIRED'], answer: 2 },
      { q: 'What color represents an "IN WORK" aircraft status?', options: ['Green', 'Red', 'Blue', 'Yellow'], answer: 2 },
      { q: 'An MCC Lock requires what before it can be removed?', options: ['Admin approval only', 'Technician concurrence and MCC verification', 'Automatic expiry after 24 hours', 'Captain sign-off'], answer: 1 },
      { q: 'The "Readiness Score" of AT RISK (yellow) indicates:', options: ['Aircraft is airworthy with no issues', 'Minor issues present — open write-ups or 1 expired MEL', 'Aircraft is AOG', 'Aircraft has no fuel'], answer: 1 },
    ],
  },
  {
    id: 'etops',
    title: 'ETOPS & Special Approvals',
    subtitle: 'Extended-Range Operations',
    icon: '🌍',
    color: '#06b6d4',
    level: 'Advanced',
    part147: 'Powerplant — Module 7',
    estimatedMinutes: 35,
    lessons: [
      {
        id: 'etops-1',
        title: 'ETOPS Fundamentals',
        content: `ETOPS (Extended-range Twin-engine Operational Performance Standards) allows twin-engine aircraft to fly routes that pass more than 60 minutes from a suitable diversion airport.

**ETOPS Ratings:**
- **ETOPS-120** — 2-hour diversion window (most common for domestic extended ops)
- **ETOPS-180** — 3-hour diversion window (transoceanic routes: NAT, PAC)
- **ETOPS-370** — 6+ hour diversion (ultra-long range: B777, B787, A350)

**ETOPS-Critical MEL Items:**
Certain MEL items are flagged "ETOPS Critical" in Aerodyne Fleet OS. If an ETOPS-critical item is deferred, the system will:
1. Show a "NO ETOPS" or "ETOPS LIMITED" badge on the aircraft
2. Display a red restriction banner in the TechOps Logbook
3. Notify dispatch automatically

**Monitoring in Aerodyne Fleet OS:**
Navigate to Fleet Health → ETOPS Monitor to see all aircraft ETOPS ratings, program status, and any active MEL restrictions.`,
      },
    ],
    quiz: [
      { q: 'What does ETOPS stand for?', options: ['Extended Turbine Operations Performance Standards', 'Extended-range Twin-engine Operational Performance Standards', 'Engine Twin Operations Performance System', 'Extended Terminal Operations Performance Standards'], answer: 1 },
      { q: 'ETOPS-180 allows a diversion window of:', options: ['60 minutes', '120 minutes', '180 minutes', '240 minutes'], answer: 2 },
      { q: 'In Aerodyne Fleet OS, an ETOPS-critical deferred MEL displays:', options: ['A green advisory', 'NO ETOPS or ETOPS LIMITED badge', 'Only a log entry', 'Nothing — it is noted in the paper records'], answer: 1 },
      { q: 'Which aircraft type is typically rated for ETOPS-370?', options: ['B737-800', 'A320', 'B787 and A350', 'E175'], answer: 2 },
    ],
  },
  {
    id: 'compliance',
    title: 'Records, Compliance & CRS',
    subtitle: '14 CFR Part 43 Documentation',
    icon: '📜',
    color: '#8b5cf6',
    level: 'Advanced',
    part147: 'General — Module 9',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'comp-1',
        title: 'Certificate of Release to Service (CRS)',
        content: `A Certificate of Release to Service (CRS) is the official documentation certifying that maintenance was performed in accordance with approved data and the aircraft is airworthy.

**CRS Requirements (14 CFR 43.9):**
1. Description of work performed
2. Date of completion
3. Name of person performing work (or supervising)
4. Certificate type and number
5. Signature

**CRS in Aerodyne Fleet OS:**
Navigate to Records & Compliance → Certificate of Release to create and manage CRS documents.

The system auto-populates:
- Aircraft registration and type
- Log page references
- Work performed summary from logbook entries
- ATA chapters involved

**Important:** A CRS must be issued before an aircraft can be returned to service after any maintenance action under Part 43.`,
      },
      {
        id: 'comp-2',
        title: 'AD Tracking and Compliance',
        content: `Airworthiness Directives (ADs) are legally enforceable FAA regulations issued to correct an unsafe condition.

**AD Types:**
- **Emergency AD** — Must comply before next flight
- **Immediate Adopted Rule** — Requires compliance within short interval
- **Notice of Proposed Rulemaking (NPRM)** — 30-90 day comment period before final rule

**AD Tracking in Aerodyne Fleet OS:**
Navigate to Engineering → AD Tracking to:
- View all applicable ADs by aircraft type
- Track compliance status (Complied, Due, Overdue)
- Link ADs to logbook entries and CRS documents
- Set alerts for upcoming AD due dates

**IMPORTANT:** Operating an aircraft with an overdue AD is a violation of 14 CFR 91.409 and can result in certificate action.`,
      },
    ],
    quiz: [
      { q: 'CRS stands for:', options: ['Crew Release Standard', 'Certificate of Release to Service', 'Compliance Review System', 'Component Return Status'], answer: 1 },
      { q: 'An Emergency AD must be complied with:', options: ['Within 30 days', 'Within 10 days', 'Before next flight', 'At next scheduled check'], answer: 2 },
      { q: 'Where do you find AD tracking in Aerodyne Fleet OS?', options: ['Fleet Health → Fleet Dashboard', 'Engineering → AD Tracking', 'Records → Audit Logs', 'Dispatch → Flight Board'], answer: 1 },
      { q: 'Operating with an overdue AD violates:', options: ['14 CFR 43.9', '14 CFR 91.409', '14 CFR 145.211', '14 CFR 65.81'], answer: 1 },
    ],
  },
];

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

export const STUDENT_ROLES = ['student', 'instructor', 'admin'];