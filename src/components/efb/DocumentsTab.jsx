import { useState } from 'react';
import { FileText, X, ChevronRight, Download, BookOpen, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_DOCUMENTS = [
  {
    cat: 'Quick Reference Handbook',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    items: [
      {
        id: 'qrh-abn-1',
        title: 'Engine Failure at Takeoff',
        rev: 'Rev 47',
        updated: '2025-11-01',
        tag: 'ABNORMAL',
        tagColor: 'text-red-400 bg-red-500/15',
        content: `ENGINE FAILURE AT TAKEOFF
ATA 70 — QRH ABN-1

CONDITIONS: Engine failure recognized at or after V1.

ACTIONS:
1. Thrust lever (failed engine) ............ CLOSE
2. Autothrottle .............................. DISENGAGE
3. FD/AP ................................... AS REQUIRED
4. Airspeed ................................ V2 OR ABOVE
5. Landing gear ............................. RETRACT
6. Engine fire warning light ON?
   YES → Proceed to ENGINE FIRE IN FLIGHT (ABN-3)
   NO  → Continue
7. Engine master (failed engine) ............ OFF
8. Engine start (failed engine) ............. CONT
9. Fuel XFEED .............................. OPEN
10. Diversion decision: Evaluate fuel state, airport options, MEL

NOTES:
• Single-engine climb gradient is approximately 2.4% at 170,000 lb TOGW.
• Contact ATC immediately. Declare MAYDAY if required.
• Reference FCOM 3.10.22 for performance data.

WARNING: Do not attempt engine restart until clear of obstacles and above 800 ft AGL.`
      },
      {
        id: 'qrh-abn-2',
        title: 'Hydraulic System A Failure',
        rev: 'Rev 44',
        updated: '2025-09-15',
        tag: 'ABNORMAL',
        tagColor: 'text-red-400 bg-red-500/15',
        content: `HYDRAULIC SYSTEM A FAILURE
ATA 29 — QRH ABN-7

CONDITIONS: HYD SYS A LOW PRESSURE light illuminated.

ACTIONS:
1. Engine 1 pump switch ..................... OFF
2. Electric pump A .......................... ON
3. Hydraulic quantity ..................... CHECK
4. If quantity low (< 0.5):
   Electric pump A ......................... OFF
5. Standby hydraulic ..................... AS REQUIRED

INOPERATIVE SYSTEMS (Sys A loss):
• Autopilot A
• Autobrakes
• Normal nose wheel steering
• Thrust reversers (engine 1)
• Ground spoilers (partial)

APPROACH NOTES:
• Use alternate nose wheel steering (differential braking)
• Plan for increased landing roll — add 1,500 ft to landing distance
• Autobrake unavailable; manual braking required
• Brief cabin crew for possible rough stop

REF: FCOM 3.29.1`
      },
      {
        id: 'qrh-abn-3',
        title: 'Smoke in Cabin / Cargo',
        rev: 'Rev 51',
        updated: '2026-01-10',
        tag: 'EMERGENCY',
        tagColor: 'text-orange-400 bg-orange-500/15',
        content: `SMOKE IN CABIN / CARGO COMPARTMENT
ATA 26 — QRH EMER-4

INITIAL ACTIONS (memory items):
1. Passenger oxygen ......................... ON
2. Crew oxygen masks .................. DON & CHECK
3. Emergency descent — if required

CABIN SMOKE:
4. Notify cabin crew — investigate source
5. If electrical origin suspected:
   Galley bus (affected zone) ............... OFF
   IFE / reading lights (zone) .............. OFF
6. If smoke increases or fire confirmed:
   Proceed to DIVERSION IMMEDIATELY
7. Coordinate with ATC for priority handling

CARGO SMOKE (FWD or AFT CARGO FIRE light):
1. Cargo fire arm switch ................... ARM
2. Cargo fire discharge ................. DISCHARGE
3. Land at nearest suitable airport
4. Do not open cargo door until 30 minutes after landing

NOTES:
• Smoke in lavatory: Check detector, check for smoldering waste.
• Always declare emergency with ATC when cargo fire confirmed.
• Ref: FCOM 3.26.3 / 3.26.4`
      },
    ]
  },
  {
    cat: 'Flight Crew Operations Manual',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    items: [
      {
        id: 'fcom-vol1-ch1',
        title: 'Crew Duties & Responsibilities',
        rev: 'Rev 22',
        updated: '2025-08-01',
        tag: 'FCOM',
        tagColor: 'text-blue-400 bg-blue-500/15',
        content: `CREW DUTIES & RESPONSIBILITIES
FCOM Vol. 1 — Chapter 1.10

PILOT-IN-COMMAND (PIC):
The Captain is responsible for the safe operation of the flight and the safety of all occupants. Authority is final and absolute per 14 CFR 91.3.

Responsibilities include:
• Pre-flight: Review all NOTAMs, weather, MEL/CDL items, fuel load, weight & balance
• Dispatch release review and signature
• Crew briefing — departure, approach, emergency
• Go/No-Go authority
• In-flight command and crew management
• Post-flight: Log discrepancies, sign logbook, debrief crew

FIRST OFFICER (F/O):
• Assists PIC in all phases of flight
• Monitoring duties — callouts per SOP
• PF/PM role assignment per company SOP
• PM cross-check of all checklist items
• F/O assumes command if Captain becomes incapacitated

STERILE COCKPIT:
Below 10,000 ft MSL, no non-essential communications or activities.
Cabin crew will not call flight deck except for:
• Safety-of-flight issues
• Passenger medical emergency
• Fire or smoke

THREAT & ERROR MANAGEMENT (TEM):
All crew members are trained in TEM methodology. Threats are identified in pre-departure briefing. Errors are trapped via cross-check and challenge/response checklists.

REF: 14 CFR 121.533 / GOM Chapter 4`
      },
      {
        id: 'fcom-vol2-ch5',
        title: 'Standard Operating Procedures — Approach',
        rev: 'Rev 33',
        updated: '2025-12-01',
        tag: 'FCOM',
        tagColor: 'text-blue-400 bg-blue-500/15',
        content: `STANDARD OPERATING PROCEDURES — APPROACH
FCOM Vol. 2 — Chapter 5.40

APPROACH BRIEFING (before top of descent):
1. Destination ATIS / METAR review
2. NOTAM review — runways, navaids, lighting
3. Approach type: ILS / RNAV / VOR / Visual
4. MDA/DA and missed approach point
5. Missed approach procedure — full review
6. Alternate airport and fuel state
7. Threats: weather, runway condition, traffic

ILS APPROACH (CAT I / II / III):
• LOC capture: intercept at 30° max
• Glideslope capture: level flight until 1 dot below
• Autopilot: APPR mode engaged
• PM calls: LOC alive, GS alive, LOC capture, GS capture
• 1,000 ft AGL: "1,000 stable" or initiate go-around
• 500 ft AGL: Final stabilization check
• DA: "Decide" call — land or go-around
• CAT II/III: Do not initiate go-around after 100 ft RA unless unsafe

STABILIZATION CRITERIA (1,000 ft IMC / 500 ft VMC):
• On centerline ± 1 dot
• On glidepath ± 1 dot
• VREF + 5 to VREF + 20 knots
• Configured (gear down, flaps landing)
• Descent rate < 1,000 fpm
• All checklists complete
• Power in normal go-around range

REF: FCOM 5.40.1 through 5.40.8`
      }
    ]
  },
  {
    cat: 'Minimum Equipment List',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    items: [
      {
        id: 'mel-29-1',
        title: 'ATA 29 — Hydraulic System',
        rev: 'Rev 18',
        updated: '2026-02-15',
        tag: 'MEL',
        tagColor: 'text-amber-400 bg-amber-500/15',
        content: `MINIMUM EQUIPMENT LIST — ATA 29
HYDRAULIC SYSTEM

29-11-1 Engine Driven Pump (EDP)
  CAT: B (3 calendar days)
  Dispatch condition: One EDP may be inoperative provided:
  a) Corresponding electric pump is operative and selected ON
  b) Hydraulic quantity within normal limits
  c) Crew briefed per Ops Note 29-1
  Placard: "EDP 1 [or 2] INOP — ELEC PUMP ON"

29-11-2 Electric Motor Pump (ELEC)
  CAT: C (10 calendar days)
  Dispatch condition: One ELEC pump may be inoperative provided:
  a) Corresponding EDP is operative and selected to AUTO
  b) Operations are in Day VMC only
  c) Destination has maintenance capability

29-21-1 Hydraulic Reservoir Low Quantity Sensor
  CAT: D (120 calendar days)
  Dispatch condition: May be inoperative provided:
  a) Crew performs visual check of reservoir before departure
  b) Logbook entry made

NOTES:
• If both pumps of one system are inoperative, aircraft is AOG.
• All MEL items require applicable maintenance action before dispatch.
• Reference: MMEL Revision 48 — Boeing 737NG / MAX`
      },
      {
        id: 'mel-34-1',
        title: 'ATA 34 — Navigation Systems',
        rev: 'Rev 21',
        updated: '2026-01-20',
        tag: 'MEL',
        tagColor: 'text-amber-400 bg-amber-500/15',
        content: `MINIMUM EQUIPMENT LIST — ATA 34
NAVIGATION SYSTEMS

34-11-1 IRS (Inertial Reference System)
  CAT: B (3 calendar days)
  Three IRS installed. Two required for dispatch.
  If one IRS inoperative:
  a) Select remaining two systems to NORMAL
  b) NAV accuracy may be reduced on long-range operations
  c) FMS requires manual update every 2 hours if only one IRS
  d) ETOPS prohibited with one IRS inoperative

34-21-1 GPS (Global Positioning System)
  CAT: C (10 calendar days)
  Two GPS receivers installed. One may be inoperative.
  Dispatch conditions:
  a) RNAV operations require operative GPS
  b) RNP AR approaches prohibited
  c) Oceanic operations: verify IRS is sufficiently accurate without GPS

34-51-1 Traffic Collision Avoidance System (TCAS)
  CAT: B (3 calendar days)
  TCAS must be operative for all passenger-carrying flights.
  Inoperative TCAS: Aircraft is AOG for revenue passenger flights.
  Ferry flights permitted with MEL authorization from Chief Pilot.

REF: 14 CFR 121.628 / MMEL Rev 48`
      }
    ]
  },
  {
    cat: 'Operations Specifications',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    items: [
      {
        id: 'opsspecs-b050',
        title: 'B050 — ETOPS Authorization',
        rev: 'Rev 09',
        updated: '2025-07-01',
        tag: 'OPS SPECS',
        tagColor: 'text-green-400 bg-green-500/15',
        content: `OPERATIONS SPECIFICATIONS — B050
ETOPS AUTHORIZATION

AERODYNE FLEET LLC is authorized to conduct Extended Operations (ETOPS) subject to the following:

AUTHORIZED AIRCRAFT: Boeing 737 MAX 8, Boeing 737 MAX 9

MAXIMUM DIVERSION TIME: 180 minutes (single engine, ISA, long range cruise)

AUTHORIZED ROUTES:
• North Atlantic (NAT) — above 30°N
• Caribbean / Central America corridor
• Select Pacific island pairs (per route-specific approval)

REQUIREMENTS FOR EACH ETOPS FLIGHT:
1. ETOPS pre-departure check completed (Form ETOPS-1)
2. Fuel computed for diversion to adequate alternate (180-min divert)
3. Both engines serviceable — no ETOPS-critical MEL items
4. Weather at all ETOPS alternates meets CAT I minimums
5. ETOPS Significant Systems check completed by certified technician
6. Dispatch release indicates ETOPS approval

ETOPS ALTERNATES (current authorization):
• KBDA — Bermuda Int'l (primary NAT alternate)
• LPLA — Lajes Field, Azores
• KPVD — T.F. Green (continental alternate)

LIMITATIONS:
• ETOPS prohibited if TCAS inoperative (see MEL 34-51-1)
• ETOPS prohibited if one IRS inoperative (see MEL 34-11-1)
• Max cabin altitude exceedance voids ETOPS for the flight

REF: 14 CFR 121.161 / AC 120-42B / OpSpec B050 Revision 9`
      },
      {
        id: 'opsspecs-c60',
        title: 'C060 — CAT II/III Approach',
        rev: 'Rev 14',
        updated: '2025-10-01',
        tag: 'OPS SPECS',
        tagColor: 'text-green-400 bg-green-500/15',
        content: `OPERATIONS SPECIFICATIONS — C060
CATEGORY II / III APPROACH AUTHORIZATION

AERODYNE FLEET LLC is authorized to conduct CAT II and CAT III ILS approaches.

AUTHORIZED MINIMA:
• CAT II:   DH 100 ft / RVR 1,200 ft
• CAT IIIa: DH 50 ft  / RVR 700 ft
• CAT IIIb: DH 50 ft  / RVR 300 ft (select airports, crew qualified)

AUTHORIZED AIRCRAFT: Boeing 737-800, 737 MAX 8/9 with dual autoland

CREW QUALIFICATION:
• Both pilots must hold current CAT II/III qualification
• Recency: 3 CAT II/III approaches in preceding 6 months (sim or line)
• If not current: CAT I minima apply regardless of aircraft capability

AUTHORIZED AIRPORTS (CAT IIIb):
• KEWR — Newark Liberty
• KJFK — John F. Kennedy
• KORD — O'Hare International
• KLAX — Los Angeles International
• EGLL — London Heathrow (EASA bilateral)

PRE-APPROACH REQUIREMENTS:
1. Both autopilots engaged by 1,500 ft AGL
2. Both autoland systems operative
3. ROLLOUT / TURNOFF mode available (CAT III)
4. RVR at or above applicable minima at all sensors
5. Approach lighting serviceable (ALS required for CAT II)

REF: 14 CFR 121.651 / AC 120-29A / OpSpec C060 Rev 14`
      }
    ]
  }
];

export default function DocumentsTab() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = MOCK_DOCUMENTS.map(cat => ({
    ...cat,
    items: cat.items.filter(d =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      cat.cat.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  if (selectedDoc) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setSelectedDoc(null)}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Close Document
        </button>
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{selectedDoc.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedDoc.rev} · Updated {selectedDoc.updated}</p>
            </div>
            <span className={cn('text-[10px] font-extrabold px-2 py-1 rounded-full', selectedDoc.tagColor)}>
              {selectedDoc.tag}
            </span>
          </div>
          <div className="p-4">
            <pre className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap bg-background/40 rounded-lg p-4 overflow-x-auto">
              {selectedDoc.content}
            </pre>
          </div>
          <div className="px-4 py-3 border-t border-border bg-secondary/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Sample document — for demo purposes only
            </p>
            <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 bg-secondary border border-border rounded-lg pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered.map(({ cat, color, bg, border, items }) => (
        <div key={cat} className="rounded-xl bg-card border border-border overflow-hidden">
          <div className={cn('px-4 py-3 border-b border-border flex items-center gap-2', bg)}>
            <BookOpen className={cn('w-4 h-4', color)} />
            <p className={cn('text-xs font-extrabold uppercase tracking-wider', color)}>{cat}</p>
            <span className="text-xs text-muted-foreground ml-auto">{items.length} docs</span>
          </div>
          <div className="divide-y divide-border/50">
            {items.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.rev} · {doc.updated}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', doc.tagColor)}>{doc.tag}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No documents match your search
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pb-2">
        Sample documents — connect your airline's DMS for live content
      </p>
    </div>
  );
}