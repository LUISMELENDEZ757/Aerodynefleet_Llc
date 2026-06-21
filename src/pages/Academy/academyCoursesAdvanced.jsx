// ── Advanced / Systems Courses — Part 147 Aligned ────────────────────────────

export const ADVANCED_COURSES = [
  {
    id: 'electrical',
    title: 'Basic Electrical Systems',
    subtitle: 'DC/AC Circuits, Bus Architecture & Generators',
    icon: '⚡',
    color: '#f59e0b',
    level: 'Intermediate',
    part147: 'General — Module 4',
    estimatedMinutes: 35,
    lessons: [
      {
        id: 'elec-1',
        title: 'Why Electrical Systems Matter in Aviation',
        content: `Aircraft electrical systems are the backbone of nearly every onboard function — from engine start to avionics, lighting, fuel pumps, flight controls, and entertainment. Unlike ground vehicles, aircraft have no ability to "pull over" if power is lost.

**Why technicians must understand electrical systems:**
- Most MEL items involve electrical circuits or components
- Troubleshooting avionics faults always begins with power verification
- Improper electrical work can result in arc faults, fires, or total power loss
- 14 CFR Part 43 requires electrical repairs be performed per approved data

**Key Concepts:**
- **DC (Direct Current)** — Used for most aircraft systems: 28V DC is standard
- **AC (Alternating Current)** — 115V AC / 400Hz used for heavier loads (galleys, de-ice, avionics)
- **Bus Bar** — The distribution point that connects power sources to loads
- **Circuit Breaker (CB)** — Overcurrent protection that "trips" to protect wiring`,
      },
      {
        id: 'elec-2',
        title: 'Bus Architecture and Power Distribution',
        content: `Modern aircraft use a layered bus architecture to ensure critical systems remain powered even during partial power loss.

**Typical B737 Bus Hierarchy:**
1. **Main AC Bus** — Powered by engine generators (IDG) during normal ops
2. **AC Ground Service Bus** — Powered by GPU or APU on the ground
3. **Main DC Bus** — Converted from AC via Transformer Rectifier Units (TRU)
4. **Battery Bus** — Emergency power; always connected to aircraft battery
5. **Hot Battery Bus** — Never de-powered; powers critical items (fire handles, CVR)
6. **Essential AC/DC Bus** — Backed up by APU or backup generator

**Cross-tie and Transfer:**
If an engine generator fails, the Bus Tie Breaker (BTB) automatically connects the remaining generator to supply both sides. If both generators fail, the APU generator comes online automatically.

**In Aerodyne Fleet OS:**
Electrical fault messages appear in the Avionics Dashboard and TechOps Logbook under ATA 24. Always note which bus was affected when writing a logbook entry.`,
      },
      {
        id: 'elec-3',
        title: 'Generators, IDGs, and APU Power',
        content: `**Integrated Drive Generator (IDG):**
Each engine drives an IDG that converts variable engine RPM to a constant 400Hz AC output. The IDG uses a constant-speed drive (CSD) mechanism internally.

- **Disconnect:** IDGs can be disconnected in flight (one-way — cannot be reconnected in flight)
- **Cooling:** IDG oil cooled — oil level checked during preflight via sight glass
- **Fault:** IDG OIL TEMP or IDG DISCONNECT EICAS message → advise crew, log the fault

**APU Generator:**
- Powers the aircraft on the ground (gates without GPU)
- Can substitute for one IDG in flight (FAR 121 ops may restrict single-generator flight)
- APU bleed and electrical are separate systems — one can be INOP while other works

**External GPU (Ground Power Unit):**
- 115V AC / 400Hz supplied from ground cart or fixed ground power
- Must be within limits before connecting (voltage/frequency check)
- Never connect GPU with APU generator online without coordinating bus transfer

**AMT Tip:** When troubleshooting "No AC Power" on ground — always check: APU running? GPU connected? BTBs closed? Before opening any panel.`,
      },
    ],
    quiz: [
      { q: 'Standard aircraft DC voltage is:', options: ['12V DC', '24V DC', '28V DC', '48V DC'], answer: 2 },
      { q: 'What does IDG stand for?', options: ['Internal Drive Generator', 'Integrated Drive Generator', 'Induction Drive Gear', 'Independent Distribution Generator'], answer: 1 },
      { q: 'The Hot Battery Bus is significant because:', options: ['It powers the coffee makers', 'It is always energized and powers critical items like fire handles', 'It connects to the GPU only', 'It is the same as the main DC bus'], answer: 1 },
      { q: 'AC power on most commercial aircraft is:', options: ['60Hz / 230V', '400Hz / 115V', '50Hz / 115V', '400Hz / 28V'], answer: 1 },
      { q: 'If both engine generators fail, power is automatically supplied by:', options: ['Battery only', 'APU generator', 'GPU', 'RAM air turbine'], answer: 1 },
      { q: 'An IDG can be reconnected in flight after disconnect:', options: ['Yes, by resetting the BTB', 'No — IDG disconnect is a one-way action in flight', 'Only if temperature is below limits', 'Yes, via the overhead panel'], answer: 1 },
    ],
  },
  {
    id: 'pneumatics',
    title: 'Pneumatic & Bleed Air Systems',
    subtitle: 'ATA 36 — Bleed Air, Packs, Pressurization',
    icon: '💨',
    color: '#06b6d4',
    level: 'Intermediate',
    part147: 'Airframe — Module 6',
    estimatedMinutes: 35,
    lessons: [
      {
        id: 'pneu-1',
        title: 'Why Pneumatic Systems Are Critical',
        content: `Pneumatic (bleed air) systems extract hot, high-pressure air from the engine compressor stages and use it to power several essential aircraft functions. Without bleed air, many critical systems cannot operate.

**Systems Powered by Bleed Air:**
- **Air Conditioning Packs** — Cabin cooling and heating (ATA 21)
- **Pressurization** — Maintains cabin altitude (ATA 21)
- **Wing & Engine Anti-Ice** — Prevents ice buildup (ATA 30)
- **Hydraulic Reservoir Pressurization** — Ensures pump suction (ATA 29)
- **Water Tank Pressurization** — Lavatory and galley water supply
- **Pneumatic Starters** — Engine start air (ATA 80)

**Why AMTs Must Know This:**
A bleed air leak can cause:
1. Loss of cabin pressurization
2. Wing or engine anti-ice failure
3. Hot air damage to surrounding structure and wiring
4. Duct burnthrough — an in-flight fire hazard

Bleed air runs at temperatures of 400–500°F. Always allow systems to cool before working on ducts.`,
      },
      {
        id: 'pneu-2',
        title: 'Bleed Air Architecture — How It Works',
        content: `**Source:**
Bleed air is tapped from the engine at two compressor stages:
- **Stage 5 (low pressure)** — Used during low power settings (descent, approach)
- **Stage 9 (high pressure)** — Used during high demand (climb, cold day operations)

The Pressure Regulating and Shutoff Valve (PRSOV) controls the bleed air flow to maintain duct pressure at ~18–45 PSI.

**Cross-Bleed Operations:**
A Cross-Bleed Valve (CBV) connects the left and right pneumatic ducts. During engine start on the ground:
- APU bleed open → CBV open → air flows to opposite engine starter
- This allows APU to start Eng 2, then cross-bleed from Eng 2 to start Eng 1

**Isolation Valves:**
Each wing and each engine has isolation valves to contain bleed air during failures. A duct overheat will trigger automatic isolation.

**EICAS Messages — Common Bleed Faults:**
- **L/R PACK** — Pack fault or overheat
- **BLEED TRIP OFF** — Bleed air automatically shut off due to overheat
- **DUCT OVERHEAT** — Bleed air duct temperature exceeded limit
- **L/R ENG VALVE CLOSED** — Bleed valve stuck or commanded closed`,
      },
      {
        id: 'pneu-3',
        title: 'Pressurization and Pack Failures',
        content: `**Cabin Pressurization Basics:**
The aircraft outflow valve controls the rate at which cabin air escapes to maintain cabin altitude below 8,000 ft (typically 6,000–8,000 ft at cruise).

**Pack Failure on Ground (Common Scenario):**
- EICAS: L PACK or PACK OFF
- Cabin gets warm, passengers may complain
- First action: Verify pack valve position (open/closed), check for duct overheat

**AMT Troubleshooting Steps:**
1. Check BITE for specific fault code
2. Check pack isolation valve position
3. Verify bleed air available at pack inlet (pressure reading from BITE or gauge)
4. Check pack temperature controller — reset if possible
5. If fault cannot be cleared: MEL evaluation for single pack operation

**Single Pack Operations:**
Most aircraft can dispatch with one pack inop under MEL (Category B or C) with:
- Crew procedures for smoke or fume events
- Altitude restriction in some cases
- Passenger count limits may apply

**In Aerodyne Fleet OS:**
Bleed air and pack faults are tracked under ATA 21 in the TechOps Logbook. MCC monitors pressurization status via the Fleet Dashboard.`,
      },
    ],
    quiz: [
      { q: 'What temperature range does bleed air typically operate at?', options: ['100–200°F', '200–300°F', '400–500°F', '600–700°F'], answer: 2 },
      { q: 'The Pressure Regulating and Shutoff Valve (PRSOV) controls:', options: ['Cabin temperature', 'Bleed air flow and pressure', 'Pack cooling airflow', 'Engine RPM'], answer: 1 },
      { q: 'During cross-bleed engine start, the APU provides air to:', options: ['Both engines simultaneously', 'The opposite engine via the cross-bleed valve', 'Only the left engine', 'The hydraulic system'], answer: 1 },
      { q: 'EICAS message "BLEED TRIP OFF" indicates:', options: ['Normal operation', 'Bleed air shut off due to duct overheat', 'Engine bleed valve stuck open', 'APU bleed selected off'], answer: 1 },
      { q: 'Cabin pressurization is controlled by:', options: ['The pack controller', 'The outflow valve', 'The bleed valve position', 'The recirculation fans'], answer: 1 },
      { q: 'Which system does NOT use bleed air?', options: ['Wing anti-ice', 'Engine start', 'Main landing gear retraction', 'Cabin pressurization'], answer: 2 },
    ],
  },
  {
    id: 'lru',
    title: 'LRU Knowledge & Avionics',
    subtitle: 'Line Replaceable Units — Swap Procedures & Troubleshooting',
    icon: '📡',
    color: '#8b5cf6',
    level: 'Intermediate',
    part147: 'Airframe — Module 8',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'lru-1',
        title: 'What Is an LRU and Why Does It Matter?',
        content: `A Line Replaceable Unit (LRU) is any aircraft component designed to be quickly removed and replaced at the gate or line station — without the need for deep structural work or hangar facilities.

**Why LRUs Are Critical for Line Maintenance:**
- Aircraft turn times at gates can be as short as 45 minutes
- LRU swaps allow rapid fault isolation and return to service
- Most avionics and black boxes are LRUs
- AMTs must know how to identify, swap, and test LRUs per the AMM

**Common LRU Categories:**
| Category | Examples |
|---|---|
| Avionics Boxes | ADIRU, FMC, DFDR, CVR, TCAS, ATC transponder |
| Sensors & Probes | TAT probes, angle-of-attack sensors, pitot tubes |
| Control Units | Autopilot servos, flight control computers (AFDC) |
| Communication | VHF radios, HF radios, SELCAL decoders |
| Electrical | TRUs, IDGs (engine-on), relays, CB panels |
| Mechanical | Valves, actuators, pumps (if quick-release design) |

**Key Rule:** Every LRU swap must be documented in the E-Logbook with: P/N installed, P/N removed, S/N installed, S/N removed, operational test result, and technician certification.`,
      },
      {
        id: 'lru-2',
        title: 'How to Perform an LRU Swap',
        content: `**Standard LRU Swap Process (AMM-based):**

**Step 1 — Verify the Fault**
- Pull BITE data from the avionics system or EICAS
- Confirm which LRU is generating the fault (system test, not just a caution light)
- Avoid swapping an LRU based on assumption — false isolation wastes expensive units

**Step 2 — Obtain the Correct Part**
- Verify P/N matches the aircraft's Illustrated Parts Catalog (IPC)
- Check serviceable tag (yellow tag = serviceable, red tag = unserviceable)
- Verify shelf life has not expired (especially for batteries, seals)

**Step 3 — Power Down / Isolate (if required)**
- Most avionics LRUs require power removed before removal
- Some units (CVR) require specific IRS cooling-down procedures first
- Never pull a hot FMC — corruption risk

**Step 4 — Remove Old LRU**
- Document: P/N, S/N of removed unit
- Tag removed unit with aircraft tail, fault description, date

**Step 5 — Install New LRU**
- Seat connectors fully — verify locking mechanism engaged
- Torque any fasteners to AMM spec
- Check cooling airflow path is not obstructed

**Step 6 — Power Up and Test**
- Run BITE or system operational check per AMM
- Confirm fault code is cleared
- Log results in E-Logbook`,
      },
      {
        id: 'lru-3',
        title: 'Key Avionics LRUs Every AMT Should Know',
        content: `**ADIRU — Air Data Inertial Reference Unit**
Combines air data (altitude, airspeed, Mach) and inertial reference (attitude, heading). ADIRU faults trigger EICAS AIR DATA or IRS messages. Swap requires alignment after installation (5–17 min ground alignment).

**FMC — Flight Management Computer**
Handles navigation, performance, and fuel calculations. Single FMC failure is typically MEL-able (Category B). FMC swap requires loading current navigation database via ACARS or USB loader.

**CVR / DFDR — Cockpit Voice Recorder / Digital Flight Data Recorder**
By regulation (14 CFR 121.344), if CVR or DFDR is INOP, aircraft cannot depart. No MEL for these. Swap must be completed before dispatch.

**TCAS — Traffic Collision Avoidance System**
Required for all aircraft with 30+ seats (14 CFR 121.356). If TCAS RA is inop, aircraft may not be dispatchable without swap or engineering approval.

**VHF Radio**
Triple redundant (VHF 1, 2, 3). One VHF failure is typically MEL-able. Swap involves removing the radio rack unit and verifying transmission/reception with ground station.`,
      },
    ],
    quiz: [
      { q: 'LRU stands for:', options: ['Line Repair Unit', 'Line Replaceable Unit', 'Long Range Unit', 'Load Relief Unit'], answer: 1 },
      { q: 'A yellow maintenance tag on an LRU indicates:', options: ['Unserviceable — do not install', 'Serviceable — cleared for installation', 'Awaiting inspection', 'Scrapped'], answer: 1 },
      { q: 'Why should you never pull a hot FMC?', options: ['Risk of electric shock', 'Risk of database corruption', 'The connector will break', 'It voids the warranty'], answer: 1 },
      { q: 'After an ADIRU swap, what is required?', options: ['No action — plug and play', 'Ground alignment (5–17 minutes)', 'Full engine run', 'NAV database reload only'], answer: 1 },
      { q: 'If both CVR and DFDR are inoperative, the aircraft:', options: ['Can depart under MEL', 'Cannot depart — no MEL exists for these', 'Can depart with captain approval', 'Can depart on domestic routes only'], answer: 1 },
      { q: 'When should BITE be checked first during LRU troubleshooting?', options: ['After the swap', 'Before swapping to verify the correct LRU is faulty', 'Only if EICAS shows a warning', 'BITE is not used for LRU isolation'], answer: 1 },
    ],
  },
  {
    id: 'hydraulics',
    title: 'Hydraulic Systems',
    subtitle: 'ATA 29 — Reservoirs, Actuators & Pressure',
    icon: '🔧',
    color: '#ef4444',
    level: 'Intermediate',
    part147: 'Airframe — Module 5B',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'hyd-1',
        title: 'Why Hydraulic Systems Are Essential',
        content: `Hydraulic systems use pressurized fluid to move heavy, high-load aircraft components that cannot be moved by electric motors alone. On commercial aircraft, hydraulic power operates the largest and most critical moving parts.

**Systems Powered by Hydraulics:**
- **Flight Controls** — Ailerons, elevators, rudder (ATA 27)
- **Landing Gear** — Extension and retraction (ATA 32)
- **Flaps & Slats** — High-lift devices (ATA 27)
- **Brakes** — Main wheel braking (ATA 32)
- **Thrust Reversers** — Engine reverse deployment (ATA 78)
- **Nose Wheel Steering** — Ground maneuvering (ATA 32)

**Operating Pressure:**
Commercial transport aircraft hydraulic systems operate at **3,000 PSI** (some newer designs at 5,000 PSI). This is extremely high — never open hydraulic lines without proper depressurization.`,
      },
      {
        id: 'hyd-2',
        title: 'Hydraulic System Architecture',
        content: `**Three-System Design (B737 example):**
- **System A** — Engine 1 hydraulic pump + electric pump
  - Operates: Primary flight controls, brakes, nose wheel steering, ground spoilers
- **System B** — Engine 2 hydraulic pump + electric pump
  - Operates: Primary flight controls, flaps, autopilot, landing gear
- **Standby System** — Electric pump, powered by battery bus
  - Operates: Thrust reversers, rudder (standby only), brakes (alternate)

**Reservoir Servicing:**
- Fluid: Skydrol LD-4 or PE-5 (or Mil-H-5606 on some aircraft — not interchangeable!)
- Level checked via sight glass with systems depressurized and at correct temperature

**Pump Types:**
1. **Engine-Driven Pump (EDP)** — Main pump, from engine accessory gearbox
2. **Electric Motor-Driven Pump (EMDP)** — Backup, used on ground and supplement in flight
3. **PTU (Power Transfer Unit)** — Transfers power between systems without fluid transfer`,
      },
      {
        id: 'hyd-3',
        title: 'Hydraulic Troubleshooting & Safety',
        content: `**Safety Rules — Non-Negotiable:**
1. **Always depressurize before opening any hydraulic line** — 3,000 PSI will cause serious injury
2. **Wear Skydrol PPE** — Gloves, goggles, and Skydrol-resistant clothing
3. **Never mix hydraulic fluids** — Skydrol and mineral oil are incompatible
4. **Ground the aircraft** before connecting hydraulic test equipment

**Leak Classification:**
- **Seep** — Slight discoloration, no drops → monitor
- **Leak** — Drops forming but not running → repair within interval
- **Heavy Leak** — Running drops or stream → aircraft grounded immediately

**Common Hydraulic Faults:**
- **Low Quantity** — Find and repair leak before adding fluid
- **High Temperature** — Pump overheating or restriction in return line
- **Low Pressure** — Pump failure, reservoir empty, or PRV stuck open

**In Aerodyne Fleet OS:**
Log all hydraulic servicing (fluid type, quantity added, system pressure verified) under ATA 29 in the E-Logbook.`,
      },
    ],
    quiz: [
      { q: 'Commercial transport aircraft hydraulic systems typically operate at:', options: ['1,000 PSI', '2,000 PSI', '3,000 PSI', '5,000 PSI'], answer: 2 },
      { q: 'The Standby hydraulic system is typically powered by:', options: ['Engine-driven pump only', 'Electric pump powered by battery bus', 'APU bleed air', 'Engine 2 pump'], answer: 1 },
      { q: 'Skydrol hydraulic fluid requires:', options: ['No special precautions', 'Gloves and eye protection only', 'Full PPE — gloves, goggles, Skydrol-resistant clothing', 'Only gloves'], answer: 2 },
      { q: 'A PTU (Power Transfer Unit) transfers:', options: ['Fluid between hydraulic systems', 'Power between systems without transferring fluid', 'Electric power to hydraulic pump', 'Nothing — it is a backup pump'], answer: 1 },
      { q: 'A "Heavy Leak" classification means:', options: ['Slight discoloration — monitor', 'Drops forming — repair soon', 'Running drops or stream — aircraft grounded immediately', 'Schedule repair at next C-check'], answer: 2 },
      { q: 'Different hydraulic fluid types (e.g., Skydrol and mineral oil) can be mixed in an emergency:', options: ['Yes, if less than 10% contamination', 'No — they are completely incompatible', 'Yes, if flushed within 24 hours', 'Only for the standby system'], answer: 1 },
    ],
  },
  {
    id: 'fire_protection',
    title: 'Fire Detection & Protection',
    subtitle: 'ATA 26 — Fire Loops, Extinguishers & Procedures',
    icon: '🔥',
    color: '#f97316',
    level: 'Intermediate',
    part147: 'Powerplant — Module 6',
    estimatedMinutes: 25,
    lessons: [
      {
        id: 'fire-1',
        title: 'Why Fire Protection Knowledge Is Life-Critical',
        content: `An uncontrolled fire is one of the most dangerous in-flight emergencies. Aviation fire protection systems are designed to detect, contain, and suppress fires before they become catastrophic.

**Fire Zones Protected:**
- Engine nacelles (each has independent detection loops)
- APU compartment
- Cargo compartments (forward and aft)
- Wheel wells (some aircraft)
- Lavatory waste bins (automatic suppression)

**Why AMTs Must Know Fire Systems:**
- Fire detection loops require regular inspections and continuity checks
- Extinguisher bottles have hydrostatic test intervals — expired bottles cannot fly
- False fire warnings cause unnecessary diversions
- ETOPS aircraft have strict fire suppression time requirements

**Regulatory Requirement:**
14 CFR 25.1181 requires fire detection in each designated fire zone. 14 CFR 121.263 requires fire extinguishing systems for engine and APU compartments.`,
      },
      {
        id: 'fire-2',
        title: 'Engine Fire Detection — Loops and BITE',
        content: `**Dual-Loop Architecture:**
Each engine has two independent fire detection loops (Loop A and Loop B):
- Either loop alone can trigger a FIRE warning
- Both loops together confirm fire (reduces false alarms)
- One loop failed → MEL-able (Category A typically) — ETOPS is restricted

**How to Test Fire Loops (AMM Procedure):**
1. Avionics power ON, fire detection system armed
2. Run BITE test from maintenance panel or E/E bay
3. System simulates a fire signal — verify FIRE handle illuminates
4. Both loops tested independently
5. No actual heat applied — all electronic simulation

**Common Faults:**
- **FIRE DET FAULT** — Loop continuity broken (wire chafe, connector)
- **FIRE DET INOP** — Both loops failed — aircraft NOT dispatchable
- **FALSE FIRE WARNING** — One loop activating without real fire; check for chafing in nacelle

**In Aerodyne Fleet OS:**
Fire loop faults appear under ATA 26 in the TechOps Logbook. ETOPS-critical fire loop items are automatically flagged in MEL records.`,
      },
      {
        id: 'fire-3',
        title: 'Fire Extinguishing Systems',
        content: `**Engine Fire Extinguishers:**
Commercial aircraft carry Halon 1301 or HFC-227ea replacement bottles. Each engine typically has two bottles discharged by pulling and rotating the FIRE handle.

- **Shot 1** — First bottle discharge
- **Shot 2** — Second bottle (cross-ship from other engine)
- Once discharged, bottles must be replaced before next flight

**Extinguisher Bottle Inspection (AMT Duties):**
- Weigh bottles (must be within 10% of rated weight)
- Check pressure gauge — must be in green arc
- Hydrostatic test date — required every 5 years
- Inspect squib (initiator) for continuity

**Cargo Fire Suppression:**
Cargo compartment systems use a metered discharge rate for a certified duration (e.g., 60 minutes for ETOPS). Suppression time must exceed maximum diversion time.

**After Any Bottle Discharge:**
Document in E-Logbook: bottle P/N, S/N, weight verified, squib continuity passed, installation torque recorded.`,
      },
    ],
    quiz: [
      { q: 'Dual-loop fire detection reduces:', options: ['Cost of maintenance', 'False fire warnings', 'Loop installation time', 'Extinguisher bottle size'], answer: 1 },
      { q: 'An aircraft with BOTH engine fire detection loops failed is:', options: ['MEL-able for 10 days', 'Allowed on domestic routes only', 'NOT dispatchable', 'Allowed with captain approval'], answer: 2 },
      { q: 'The extinguishing agent used in most commercial aircraft is:', options: ['CO2', 'Dry chemical', 'Halon 1301 or HFC-227ea replacement', 'Water mist'], answer: 2 },
      { q: 'Extinguisher bottles require hydrostatic testing every:', options: ['1 year', '3 years', '5 years', '10 years'], answer: 2 },
      { q: 'For ETOPS cargo suppression, the bottle discharge duration must:', options: ['Equal the route time', 'Exceed the maximum diversion time', 'Last at least 30 minutes only', 'Last exactly 60 minutes regardless of rating'], answer: 1 },
      { q: 'After any fire extinguisher bottle is discharged, the next required step is:', options: ['Inspect and reuse if pressure is OK', 'Replace and document in E-Logbook', 'Weigh the bottle to estimate remaining agent', 'Notify the FAA within 24 hours'], answer: 1 },
    ],
  },
  {
    id: 'fuel_systems',
    title: 'Fuel Systems Fundamentals',
    subtitle: 'ATA 28 — Fuel Types, Contamination & Crossfeed',
    icon: '⛽',
    color: '#22c55e',
    level: 'Intermediate',
    part147: 'Powerplant — Module 5',
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'fuel-1',
        title: 'Aviation Fuel — Types and Contamination',
        content: `**Aviation Fuel Types:**
- **Jet-A** — Most common worldwide; flash point ~100°F; freeze point −40°C
- **Jet-A1** — International standard; lower freeze point (−47°C) — preferred for polar/ETOPS routes
- **Jet-B** — Wide-cut fuel; rarely used commercially; lower flash point
- **AvGas (100LL)** — Piston aircraft only — NEVER use in turbine engines

**Common Contaminants:**
1. **Water** — Settles to bottom of tank; checked via sump drain; causes ice crystals at cruise altitude
2. **Microbiological growth** — Dark sludge in tanks; treated with biocide
3. **Particulates (dirt, rust)** — Filter clogged; replaced at maintenance intervals
4. **Wrong fuel type** — Most dangerous; requires full defueling

**Misfueling Prevention:**
- Always verify fuel type with fueler before accepting
- Check fuel receipt: grade, quantity, density, uplift temperature`,
      },
      {
        id: 'fuel-2',
        title: 'Fuel System Architecture and Crossfeed',
        content: `**Typical B737 Fuel System:**
- **Left Main Tank** — Feeds Engine 1
- **Right Main Tank** — Feeds Engine 2
- **Center Tank** — Auxiliary fuel; center pumps transfer to main tanks
- **Surge Tank** — Overflow protection at wingtip; NOT a usable fuel tank

**Crossfeed Operation:**
The crossfeed valve connects left and right fuel manifolds:
- **Normal:** Each engine fed from its own wing tank
- **Crossfeed OPEN:** Either tank can feed either engine
- **Used when:** Fuel imbalance, engine failure, or single-engine ops
- **Risk:** If crossfeed left open unintentionally, fuel starvation possible

**Fuel Quantity System:**
Measured by capacitance probes. Probe failure → MEL evaluation. Manual dipstick can verify quantity at maintenance.`,
      },
      {
        id: 'fuel-3',
        title: 'Fuel System Maintenance and AMT Duties',
        content: `**Sump Draining:**
- All fuel sumps drained at every preflight
- Drain until clear, bubble-free fuel flows
- Contaminated sample → do not release aircraft until tank inspected

**Fuel Leak Classification:**
- **Seep** — Stain only, no drops → monitor
- **Stain** — Wet but no drops → monitor with inspection interval
- **Drip** — Drops forming → repair before flight or evaluate MEL
- **Stream** — Aircraft grounded immediately

**Defueling:**
Required for tank entry, structural repairs, or misfueling events. Follow AMM 28-00-00 defueling procedures — use approved equipment, bonding cables, and fire watch.

**IMPORTANT:** No ignition sources within 50 feet during fueling or defueling. No smoking, no phones near aircraft being fueled.`,
      },
    ],
    quiz: [
      { q: 'Jet-A1 differs from Jet-A primarily in its:', options: ['Flash point', 'Lower freeze point (better for polar routes)', 'Color', 'Additive package'], answer: 1 },
      { q: 'Water contamination in jet fuel is most dangerous because:', options: ['It clogs the fuel filter', 'It causes ice crystals that block fuel lines at altitude', 'It reacts with fuel additives', 'It increases fuel burn'], answer: 1 },
      { q: 'An open crossfeed valve with two engines running normally:', options: ['Is required for takeoff', 'Can cause fuel imbalance or starvation if managed incorrectly', 'Is the normal configuration', 'Has no operational risk'], answer: 1 },
      { q: 'Fuel quantity on commercial aircraft is measured by:', options: ['Float sensors', 'Capacitance probes', 'Ultrasonic sensors', 'Mechanical dipsticks only'], answer: 1 },
      { q: 'A "drip" fuel leak classification means:', options: ['Monitor only — no action required', 'Repair before flight or evaluate for MEL', 'Aircraft grounded immediately', 'Report to captain only'], answer: 1 },
      { q: 'Bonding cables are required during defueling to:', options: ['Provide lighting', 'Prevent static discharge ignition', 'Ground the fueling truck only', 'Satisfy local airport rules only'], answer: 1 },
    ],
  },
  {
    id: 'engines_fadec',
    title: 'Engines, FADEC & Power Generation',
    subtitle: 'ATA 70–80 — Turbofan Theory, EEC/FADEC, Generators & Flight Parameters',
    icon: '🔩',
    color: '#f43f5e',
    level: 'Intermediate',
    part147: 'Powerplant — Module 2 & 4',
    estimatedMinutes: 50,
    lessons: [
      {
        id: 'eng-1',
        title: 'Turbofan Engine Theory — How Thrust Is Generated',
        content: `Commercial aircraft use **high-bypass turbofan engines** to generate thrust efficiently at subsonic cruise speeds.

**The Four-Stage Thermodynamic Cycle (Brayton Cycle):**
1. **Intake** — Air enters the inlet at ambient conditions. The fan and compressor progressively increase pressure.
2. **Compression** — Multi-stage axial compressor stages increase air pressure up to 30–40:1 (pressure ratio). This heats the air significantly.
3. **Combustion** — Fuel (Jet-A) is injected and ignited in the combustor. Temperature rises to ~2,900°F (1,600°C) — well above what metal can survive, which is why turbine cooling is critical.
4. **Expansion & Exhaust** — Hot gas expands through the turbine stages (powering the compressor and fan) and exhausts through the nozzle, producing thrust.

**Bypass Ratio:**
Modern high-bypass turbofans (CFM56, LEAP, GEnx, Trent) have bypass ratios of 5:1 to 12:1 — meaning for every pound of air through the core, 5–12 lbs bypass the core and exit through the fan nozzle. The majority of thrust (80%+) comes from the bypass stream.

**Thrust = Mass Flow × Velocity Change**
- Higher bypass ratio → more air mass, lower velocity increase → higher efficiency (lower fuel burn)
- Core (hot section) provides turbine power and additional thrust via exhaust

**Key Engine Components (ATA 72):**
| Component | Function |
|---|---|
| Fan | Low-pressure intake, bypass air generation |
| Low-Pressure Compressor (LPC / N1) | First compression stage |
| High-Pressure Compressor (HPC / N2) | Final compression — highest pressure |
| Combustion Chamber | Fuel burn, heat addition |
| High-Pressure Turbine (HPT) | Drives the HPC |
| Low-Pressure Turbine (LPT) | Drives the fan (N1) |
| Exhaust / Nozzle | Thrust vector exit |

**N1 and N2 Speeds:**
- **N1** — Fan / LP spool speed. Primary thrust indicator. Target N1% is calculated by FADEC from thrust setting.
- **N2** — HP spool speed. Usually 92–100% at takeoff. Indicates compressor/turbine health.
- Both expressed as % of maximum rated RPM.`,
      },
      {
        id: 'eng-2',
        title: 'FADEC & EEC — Full Authority Digital Engine Control',
        content: `**What Is FADEC?**
Full Authority Digital Engine Control (FADEC) is the computer brain of the modern turbofan engine. It has **full authority** — meaning no mechanical backup. The EEC (Electronic Engine Controller) is the primary FADEC computer on most Boeing/Airbus engines.

**FADEC/EEC Functions:**
- **Fuel metering** — Precisely controls Fuel Metering Valve (FMV) to deliver exact fuel flow for commanded thrust
- **Engine start sequencing** — Controls starter valve, ignition, fuel introduction, and abort if limits exceeded
- **Thrust management** — Converts pilot thrust lever angle (TLA) or autothrottle N1 command into actual fuel flow
- **Limit protection** — Prevents exceedance of N1, N2, EGT, oil temperature, oil pressure limits — automatically derate if approaching limits
- **Fault detection and EICAS messaging** — Generates maintenance fault codes for bite retrieval
- **Variable Bleed Valve (VBV) and Variable Stator Vane (VSV) scheduling** — Optimizes compressor airflow at all power settings

**Dual-Channel Architecture:**
FADEC/EEC has two independent channels (Channel A and Channel B):
- Both channels monitor all sensors simultaneously
- Active channel controls engine; standby channel monitors
- Auto-switchover if active channel fails — pilot/technician sees EICAS "EEC CH" message
- If both channels fail → engine reverts to fixed fuel flow (partial thrust — controllable but limited)

**How Thrust Commands Flow:**
1. Pilot moves thrust lever → TLA (Thrust Lever Angle) sensed
2. FADEC reads ambient conditions (TAT, altitude, Mach from ADIRU)
3. FADEC calculates required N1 and fuel flow
4. Fuel Metering Valve opens to commanded fuel flow
5. N1 rises to target; FADEC trims fuel flow to maintain stable N1
6. EGT, N2 and all other parameters monitored every few milliseconds

**Common FADEC/EEC EICAS Messages:**
- **EEC FAULT** — Channel failure or sensor disagreement
- **ENG LIMIT** — FADEC has rate-limited thrust to protect an exceedance
- **FADEC POWER** — Loss of FADEC power supply (check EEC circuit breakers)
- **ENG CONTROL** — Loss of thrust management authority — manual thrust required

**AMT Note:**
EEC/FADEC faults must be retrieved via ACARS BITE or the maintenance terminal. Always download fault history before replacing the EEC — many "faults" are transient and do not require EEC replacement.`,
      },
      {
        id: 'eng-3',
        title: 'Engine-Driven Generators — How Engines Power the Aircraft',
        content: `**The Engine → Generator Chain:**
Each engine drives an **Integrated Drive Generator (IDG)** through the engine's Accessory Gearbox (AGB).

**Accessory Gearbox (AGB):**
The AGB is gear-driven from the engine N2 (HP) shaft and drives multiple accessories simultaneously:
- **IDG** — Main electrical generator (ATA 24)
- **Hydraulic Pump** — Engine-driven hydraulic pump (ATA 29)
- **Fuel Control Unit / FADEC fuel pump** — Fuel metering supply
- **Pneumatic Starter** — Used for engine start (disengages after start)
- **Oil pumps** — Engine lubrication and scavenge (ATA 79)
- **Permanent Magnet Alternator (PMA)** — Powers FADEC itself (dedicated, not affected by bus failures)

**IDG Output:**
- **115V AC / 400Hz** — Standard commercial aircraft AC power
- **Rated output:** Typically 90–115 kVA per generator
- **Constant frequency** achieved via the IDG's internal Constant Speed Drive (CSD) — regardless of engine N2 variation

**Power Distribution from Engine Generator:**
1. IDG output → Main AC Bus (L or R depending on engine)
2. Main AC Bus → Transformer Rectifier Unit (TRU) → 28V DC Main Bus
3. DC Bus → Aircraft battery charging, essential systems, avionics
4. Cross-tie possible: Bus Tie Breaker (BTB) connects both AC buses if one generator fails

**FADEC Self-Power (PMA):**
The FADEC/EEC is powered by its own Permanent Magnet Alternator (PMA) mounted on the AGB — separate from the main electrical bus. This means FADEC keeps running even if the main generator fails or all aircraft batteries are depleted. This is a critical safety design.

**Engine Start Sequence and Generator Pickup:**
1. APU or GPU powers aircraft
2. Engine pneumatic starter cranks N2
3. Fuel introduced at ~20% N2 — ignition active
4. Engine accelerates to idle (ground idle ~20–25% N1)
5. At idle, IDG comes online and transitions aircraft from APU/GPU to engine power
6. Generator Control Unit (GCU) closes Generator Breaker — AC bus powered from engine

**When an Engine Shuts Down:**
- IDG disconnects from bus
- BTB closes to supply power from remaining generator
- If inflight: single-generator operations — load shedding may occur on some aircraft`,
      },
      {
        id: 'eng-4',
        title: 'Engine Parameters — What AMTs Monitor',
        content: `Understanding engine parameters is essential for both maintenance troubleshooting and approving aircraft for return to service.

**Primary Engine Parameters (EICAS / Engine Indicators):**

**N1 — Fan Speed (%)**
- Primary thrust indicator
- Takeoff: 90–100% depending on FLEX/derate
- Cruise: 80–90% typical
- Idle: 20–25% ground idle
- **Watch for:** N1 oscillation (compressor surge), split between engines >5%

**N2 — HP Compressor Speed (%)**
- Indicates HP spool/core health
- Takeoff: 95–100%
- **Watch for:** N2 below expected at given N1 (possible HPT blade wear)

**EGT — Exhaust Gas Temperature (°C)**
- Critical life-limiter for turbine hardware
- Normal cruise: 700–850°C; Takeoff limit: ~950°C (engine-specific)
- **EGT Margin:** Difference between current EGT and the limit — key predictive health indicator
- **Watch for:** EGT creep over time (HPT blade degradation, compressor fouling)
- Exceedance above limit → mandatory borescope and possible engine removal

**Fuel Flow (FF) — lbs/hr or kg/hr**
- At a given thrust and altitude, FF should match historical baseline
- High FF for low thrust → fuel efficiency problem (compressor damage, bleed leak)
- **Watch for:** FF asymmetry between engines at same N1

**Oil Pressure — PSI**
- Normal: 55–90 PSI at idle; higher at cruise
- Below minimum limit → EICAS OIL PRESS LOW → immediate action required
- **Watch for:** Slow downward trend over fleet interval (bearing wear)

**Oil Temperature — °C**
- Normal: 60–150°C
- High oil temperature → overheating bearing, blockage in oil cooler
- **Watch for:** Temperature rising near limit during long taxi in hot climates

**Oil Quantity — Quarts or Liters**
- Checked at preflight via sight glass or EICAS quantity indicator
- Consumption rate tracked over time — sudden high consumption → possible seal failure
- **AMT Duty:** Log oil added per servicing event; track consumption trend

**Vibration — N1 and N2 Vibration Units**
- Measured by accelerometers on fan case and turbine case
- Normal: <3.0 vibration units (engine-specific)
- High N1 vibration → fan blade damage, foreign object damage (FOD), ice shedding
- High N2 vibration → HP compressor or turbine damage → likely shop visit

**EPR — Engine Pressure Ratio (some aircraft)**
- Ratio of turbine exit pressure to inlet total pressure
- Used instead of N1 as primary thrust reference on some GE/RR engines

**Trend Monitoring in Aerodyne Fleet OS:**
All engine parameters are tracked per flight in the Engine Health Analytics module. Deviations from fleet baseline generate automatic alerts in the TechOps Logbook and trigger MCC review.`,
      },
      {
        id: 'eng-5',
        title: 'Engine Limits, Exceedances & MEL Implications',
        content: `**Redlines and Operating Limits:**
Every engine parameter has defined limits in the Engine Type Certificate and AMM:
- **Normal Operating Range** — Green arc on indicator
- **Caution Range** — Amber arc; investigate
- **Limit (Redline)** — Exceeding this requires inspection/action before next flight

**EGT Exceedance Procedure:**
1. Record peak EGT value and duration of exceedance
2. Report immediately to MCC
3. Download FADEC fault data (engine maintenance terminal or ACARS)
4. Perform AMM-required inspection (typically borescope of HPT and combustor)
5. If visual inspection clear → document and release
6. If damage found → engine removal or repair per manufacturer's repair manual

**Engine Trend Analysis:**
FADEC stores Engine Health Monitoring (EHM) data:
- Parameters normalized to standard day conditions (ISA correction)
- Trending upward EGT at same N1/N2 → compressor fouling or turbine wear
- Sudden parameter shift → possible hardware event (FOD, surge, lightning)
- **Wash interval:** Compressor water wash reduces EGT margin loss from fouling

**MEL Items — Engine-Related:**
| Fault | MEL Category | Typical Restriction |
|---|---|---|
| One EEC channel INOP | B (3 days) | Flight may be allowed with ops approval |
| Engine anti-ice valve INOP | A (ASAP) | No known or forecast icing |
| One igniter INOP | B | No dispatch into known icing or thunderstorms |
| Oil level low but not below min | C | Service and monitor |
| Single engine vibration monitor INOP | C | Monitor alternate indicators |

**Engine Removal Criteria:**
Engines are pulled for shop visit when:
- EGT margin reaches crew-defined threshold (e.g., <25°C remaining)
- Oil consumption exceeds ops spec limits
- Borescope reveals unserviceable HPT or LPT blade condition
- HSI (Hot Section Inspection) interval is due

**In Aerodyne Fleet OS:**
Engine removals are tracked via the Engine Removal/Installation module. All parameters, trends, borescope findings, and shop visit triggers are logged against the tail number and ESN (Engine Serial Number).`,
      },
    ],
    quiz: [
      { q: 'In a high-bypass turbofan, the majority of thrust comes from:', options: ['The hot exhaust core', 'The bypass fan stream', 'The combustor', 'The N2 turbine'], answer: 1 },
      { q: 'FADEC stands for:', options: ['Fuel And Digital Engine Controller', 'Full Authority Digital Engine Control', 'Fully Automated Digital Engine Computer', 'Flight Avionics Digital Engine Control'], answer: 1 },
      { q: 'The FADEC/EEC is powered by its own PMA to ensure:', options: ['Redundant thrust rating', 'It remains operational even if the main electrical bus fails', 'Faster engine start', 'Fuel flow backup'], answer: 1 },
      { q: 'The Accessory Gearbox (AGB) is driven by:', options: ['The N1 (fan) shaft', 'The N2 (HP compressor) shaft', 'The APU', 'The IDG itself'], answer: 1 },
      { q: 'EGT margin is defined as:', options: ['Time between overhauls', 'Difference between current EGT and the engine EGT limit', 'EGT during idle vs takeoff', 'The average EGT over a flight cycle'], answer: 1 },
      { q: 'An EGT exceedance beyond the published limit requires:', options: ['Log and monitor only', 'Mandatory inspection (borescope) before next flight', 'Immediate engine shutdown only', 'Captain sign-off and continue'], answer: 1 },
      { q: 'N1 is primarily used to indicate:', options: ['Compressor health', 'Thrust setting', 'Oil system status', 'Generator output'], answer: 1 },
      { q: 'High N1 vibration is most likely caused by:', options: ['HPT blade wear', 'Fan blade damage or FOD', 'Low fuel flow', 'EEC channel failure'], answer: 1 },
      { q: 'The IDG produces:', options: ['28V DC power', '115V AC / 400Hz power', '115V AC / 60Hz power', '270V DC power'], answer: 1 },
      { q: 'If both FADEC channels fail simultaneously:', options: ['Engine shuts down immediately', 'Engine reverts to fixed fuel flow — limited but controllable', 'Crew has full manual throttle control', 'EICAS takes over engine management'], answer: 1 },
    ],
  },
  {
    id: 'logbook_compliance',
    title: 'Logbook Entries & 14 CFR Part 43',
    subtitle: 'Writing Correct, Compliant Maintenance Records',
    icon: '📝',
    color: '#64748b',
    level: 'Foundational',
    part147: 'General — Module 2',
    estimatedMinutes: 25,
    lessons: [
      {
        id: 'log-1',
        title: 'Why Proper Logbook Entries Are Non-Negotiable',
        content: `An aircraft logbook is a legal document. An improperly written maintenance entry can:
- Void an aircraft's airworthiness certificate
- Result in certificate suspension or revocation for the AMT
- Hide maintenance history from future technicians — creating safety risks
- Be used as evidence in accident investigations

**Legal Foundation — 14 CFR 43.9:**
Part 43 governs all maintenance, preventive maintenance, rebuilding, and alterations. Section 43.9 requires:

**The 5 Required Elements:**
1. Description of work performed
2. Date of completion
3. Name of person performing the work
4. Certificate number and type
5. Signature`,
      },
      {
        id: 'log-2',
        title: 'Writing a Proper Maintenance Entry',
        content: `**Good Entry vs. Bad Entry — Examples:**

❌ **Bad Entry:**
*"Checked engine. All good. — J. Smith"*
(Vague, no ATA reference, no P/N or procedure reference)

✅ **Good Entry:**
*"Engine No. 1 oil servicing performed per AMM 79-00-00. Added 2.0 qts Mobil Jet Oil II, P/N M-2947. Oil quantity verified at FULL on sight gauge. No leaks observed. Ground idle run performed, oil pressure normal at 35 PSI. — John A. Smith, A&P Cert. No. 1234567, Date: 06/21/2026"*

**When Referencing Data:**
Instead of describing every step, you may reference an approved document:
*"Performed in accordance with AMM 29-10-00-400 Rev 42."*

**Correction of Errors:**
NEVER erase or use correction fluid. If an error is made:
- Draw a single line through the error
- Write "ERROR" and initial
- Make the correct entry`,
      },
      {
        id: 'log-3',
        title: 'Return to Service Statements and RII',
        content: `**Return to Service (RTS) Statement:**
After completing maintenance, the certifying AMT must make an RTS statement:
*"Aircraft returned to service per 14 CFR Part 43.9. Work performed in accordance with approved maintenance data. Aircraft found airworthy."*

**Required Inspection Items (RII):**
RII items require a second, independent inspection and sign-off:
- Flight control rigging and adjustments
- Engine installation and run-up
- Landing gear replacement
- Primary structural repairs

**In Aerodyne Fleet OS:**
RII items automatically trigger the Inspector Mode workflow. The logbook entry cannot be closed until the RII sign-off is completed.

**Falsifying Records — Consequences:**
- A federal crime (18 U.S.C. 1001)
- Grounds for certificate revocation (14 CFR 65.14)
- Potential criminal prosecution

There is no such thing as a "minor" paperwork shortcut in aviation.`,
      },
    ],
    quiz: [
      { q: '14 CFR Part 43 governs:', options: ['Pilot certification', 'All maintenance, preventive maintenance, rebuilding, and alterations', 'Air carrier operations', 'Aviation schools'], answer: 1 },
      { q: 'Which element is NOT required in a maintenance entry per 14 CFR 43.9?', options: ['Description of work performed', 'Date of completion', 'Aircraft fuel quantity', 'Signature and certificate number'], answer: 2 },
      { q: 'If an error is made in a logbook entry, the correct action is:', options: ['Use white-out and rewrite', 'Tear out the page and start over', 'Draw a single line through the error, write ERROR, and initial', 'Leave it and note the correction in the next entry'], answer: 2 },
      { q: 'RII (Required Inspection Item) requires:', options: ['Only the original technician to sign', 'A second independent inspection by a qualified inspector', 'Captain approval', 'MCC supervisor sign-off'], answer: 1 },
      { q: 'Falsifying a maintenance record is:', options: ['A minor violation with a fine only', 'Acceptable if the work was actually performed correctly', 'A federal crime and grounds for certificate revocation', 'Only an FAA concern, not a criminal matter'], answer: 2 },
      { q: 'A Return to Service statement must be made:', options: ['Only for major repairs', 'After every maintenance action before the aircraft is dispatched', 'Only by an IA (Inspection Authorization) holder', 'Only for engine work'], answer: 1 },
    ],
  },
];