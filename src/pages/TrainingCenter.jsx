import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle, Circle, BookOpen, Plane, Users, Radio, Zap, CalendarDays, Globe, Shield, Cloud, Calculator, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES = [
  { id: 'all',        label: 'All Roles' },
  { id: 'dispatcher', label: 'Dispatcher' },
  { id: 'pilot',      label: 'Pilot' },
  { id: 'cabin',      label: 'Cabin Crew' },
];

const MODULES = [
  {
    id: 'home',
    icon: Plane,
    iconBg: 'bg-primary',
    iconColor: 'text-primary-foreground',
    title: 'Operations Hub',
    description: 'Navigate the main dashboard and understand the layout.',
    roles: ['all', 'dispatcher', 'pilot', 'cabin'],
    steps: [
      {
        title: 'Welcome to Aerodyne Fleet LLC',
        content: 'The Operations Hub is your central launchpad. From here you can access every module in the platform — Flight Ops, EFB, Crew Control, Scheduling, and more.',
        tip: 'Bookmark this page as your starting point each shift.',
      },
      {
        title: 'Left Navigation Rail',
        content: 'On desktop, the left rail gives you quick access to all modules. Click the Home icon to toggle it collapsed or expanded. On mobile, use the bottom tab bar.',
        tip: 'The rail remembers your last expanded/collapsed preference.',
      },
      {
        title: 'Module Cards',
        content: 'Each colored card on the Home screen represents a module. Tap or click any card to enter that module. Color coding helps identify the function at a glance.',
        tip: 'Yellow = EFB, Blue = Flight Crew, Purple = Cabin Crew, Red = Crew Control.',
      },
    ],
  },
  {
    id: 'flightops',
    icon: Plane,
    iconBg: 'bg-yellow-500',
    iconColor: 'text-white',
    title: 'Flight Ops Dashboard',
    description: 'Monitor flight status, crew legality, dispatch releases, and live weather.',
    roles: ['all', 'dispatcher'],
    steps: [
      {
        title: 'Flight Board',
        content: 'The Flight Board tab shows all flights scheduled for today. Each card displays the flight number, origin/destination, gate, scheduled departure, and current status with color-coded badges.',
        tip: 'Status badges: Green = Airborne, Yellow = Boarding, Orange = Delayed, Red = Cancelled.',
      },
      {
        title: 'Crew Legality Tab',
        content: 'The Crew Legality tab shows all assigned crew for today with their FAR Part 117 compliance status. Red "ILLEGAL" badges require immediate attention — do not depart with an illegal crew member.',
        tip: 'Near-limit (orange) crew should be monitored closely for extended duty.',
      },
      {
        title: 'Dispatch Tab',
        content: 'The Dispatch tab shows all dispatch releases. You can also open the full Dispatch Panel to review aircraft-specific policies, fuel requirements, MEL/CDL rules, and alternate selection criteria.',
        tip: 'Always verify release status is "RELEASED" before sign-off.',
      },
      {
        title: 'WX / METAR Tab',
        content: 'Live weather data from aviationweather.gov is displayed for all airports in today\'s flight schedule. Expand each station to see raw METAR, decoded summary, and TAF forecast.',
        tip: 'IFR/LIFR conditions are highlighted in red — plan alternates accordingly.',
      },
    ],
  },
  {
    id: 'efb',
    icon: BookOpen,
    iconBg: 'bg-yellow-500',
    iconColor: 'text-white',
    title: 'Electronic Flight Bag (EFB)',
    description: 'Full EFB suite — W&B, fuel planning, performance, NOTAMs, ACARS and more.',
    roles: ['all', 'pilot', 'dispatcher'],
    steps: [
      {
        title: 'EFB Overview',
        content: 'The EFB is a pilot-facing module with 14 tabs. Use the left vertical rail to switch between modules. Your scroll position is preserved so switching tabs does not jump you back to the top.',
        tip: 'Use "Sync data" at the top to refresh flight data at any time.',
      },
      {
        title: 'Flight Brief Tab',
        content: 'The Flight Brief shows today\'s flights with crew, dispatch release, fuel, and NOTAMs consolidated in one view. This is your pre-departure overview.',
        tip: 'Check crew legality badges here before signing the release.',
      },
      {
        title: 'Weight & Balance',
        content: 'Select your aircraft tail, enter cargo/pax loads per station, and the W&B calculator shows your ZFW, TOW, and CG position against the envelope limits in real time.',
        tip: 'CG limits are aircraft-type specific — always verify against the AFM.',
      },
      {
        title: 'Performance Calculator',
        content: 'Enter OAT, pressure altitude, gross weight, and wind data to compute V1/VR/V2, N1, and takeoff field length. Select your 737 variant for type-specific performance reference values.',
        tip: '⚠ Demo reference values only — always use approved AFM/QRH data.',
      },
      {
        title: 'Fuel Planning',
        content: 'Input block fuel, trip fuel, contingency, alternate, and final reserve to compute minimum required fuel and margin. The burn profile breakdown shows climb/cruise/descent estimates.',
        tip: 'Green = sufficient, Orange = low margin (<500 lbs), Red = insufficient.',
      },
      {
        title: 'ACARS Messaging',
        content: 'Send and receive ACARS-style messages between cockpit and dispatch. Log OOOI (Out, Off, On, In) events with timestamps. Select your active flight from the dropdown.',
        tip: 'OOOI events are time-stamped automatically in Zulu (UTC).',
      },
    ],
  },
  {
    id: 'flightcrew',
    icon: Radio,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    title: 'Flight Crew Dashboard',
    description: 'Cockpit crew interface — flights, dispatch releases, preflight checklist, e-logbook.',
    roles: ['all', 'pilot'],
    steps: [
      {
        title: 'Today\'s Flight Schedule',
        content: 'Expand any flight card to see aircraft details, crew assignments, dispatch release info, and operational notes. The crew legality badge shows your FAR 117 status.',
        tip: 'Always verify your rest hours prior are shown correctly before accepting duty.',
      },
      {
        title: 'Preflight Checklist',
        content: 'A 12-item interactive preflight checklist covers weather, NOTAMs, fuel, W&B, MEL, ATIS, and more. Check each item off to track completion. A green banner confirms all items complete.',
        tip: 'Checklist state is local to your session — complete it fresh each flight.',
      },
      {
        title: 'Cabin Configuration',
        content: 'If an aircraft type is assigned to today\'s flight, the cabin zone layout, exits, and emergency equipment summary is shown below the checklist.',
        tip: 'Review emergency exit positions and crew station assignments before each flight.',
      },
      {
        title: 'E-Logbook',
        content: 'Switch between MEL Review (pre-flight) and Discrepancy Entry (post-flight). MEL Review shows active OOS/deferred items. Discrepancy Entry lets you log system issues for maintenance.',
        tip: 'All discrepancies submitted here notify maintenance — do not use for critical AOG items that need immediate action.',
      },
    ],
  },
  {
    id: 'cabin',
    icon: Users,
    iconBg: 'bg-purple-500',
    iconColor: 'text-white',
    title: 'Cabin Crew Dashboard',
    description: 'FA interface — flight status, pilot briefing, cabin checklists, zone layout.',
    roles: ['all', 'cabin'],
    steps: [
      {
        title: 'Today\'s Flights',
        content: 'Expand any flight to see the full operational picture: aircraft, timing, delays, and cabin crew assignment. Each FA is listed with their duty window and legality status.',
        tip: 'If a flight shows DELAYED status, check the delay reason in the card.',
      },
      {
        title: 'Pilot Crew Briefing',
        content: 'Inside each flight card, the Pilot Crew Briefing section shows the captain and F/O with their legality status, rest hours, and the current dispatch release summary including weather and dispatcher remarks.',
        tip: 'This is your pre-departure captain briefing reference — review before boarding.',
      },
      {
        title: 'Pre-Departure Cabin Checklist',
        content: 'A 10-item interactive checklist covers emergency exit briefing, galley securing, door arming, passenger count, and safety equipment checks. Each item timestamps when checked.',
        tip: 'All doors must be armed and cross-checked — this is a critical safety item.',
      },
      {
        title: 'Arrival Cabin Checklist',
        content: 'A separate 10-item arrival checklist covers seatbelts, tray tables, lavatories vacated, door disarm confirmation, and cabin secure verification.',
        tip: '"DISARMED confirmed" is mandatory before opening doors on arrival.',
      },
      {
        title: 'Cabin Zones Panel',
        content: 'If an aircraft type is available, the Cabin Zones Panel shows zone layouts, door positions, crew jump seat locations, and emergency equipment inventory.',
        tip: 'Know your designated exits and nearest AED location before every flight.',
      },
    ],
  },
  {
    id: 'crewcontrol',
    icon: Zap,
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    title: 'Crew Control',
    description: 'Real-time crew legality, FAR 117, fatigue prediction, AI dispatcher assistant.',
    roles: ['all', 'dispatcher'],
    steps: [
      {
        title: 'Ops Pipeline',
        content: 'The Ops Pipeline gives a Kanban-style view of all flights moving from scheduled → released → airborne → arrived. OOS maintenance items are surfaced alongside flights for full situational awareness.',
        tip: 'Red alert banners at the top signal active FAR 117 violations requiring immediate action.',
      },
      {
        title: 'Crew Status Board',
        content: 'The Crew Board shows every crew member\'s duty status, live duty timer, rest hours, and legal status. Filter by legal/near-limit/illegal to focus on problem crew.',
        tip: 'A crew member with <10 hours rest is flagged automatically — do not assign additional duty.',
      },
      {
        title: 'Fatigue Predictor',
        content: 'The Fatigue Predictor scores crew fatigue risk using FAA FRMS guidelines. You can simulate a delay to see how it affects fatigue scores before making scheduling decisions.',
        tip: 'Scores above 70 are high risk — consider crew swap or rest extension.',
      },
      {
        title: 'AI Dispatcher Assistant',
        content: 'The AI Assistant is aware of current crew assignments, flight status, dispatch releases, and OOS entries. Ask questions like "Who is near their duty limit?" or "Which flights are at risk of delay?"',
        tip: 'Use the Quick Action buttons for the most common queries to save time.',
      },
    ],
  },
  {
    id: 'scheduling',
    icon: CalendarDays,
    iconBg: 'bg-sky-500',
    iconColor: 'text-white',
    title: 'Scheduling',
    description: 'Pairings, bidlines, reserve assignment, aircraft routing, swaps & recovery.',
    roles: ['all', 'dispatcher'],
    steps: [
      {
        title: 'Pairing Generator',
        content: 'The Pairing Generator groups today\'s flights into crew pairings and checks FAR 117 compliance automatically. Each pairing shows assigned captain and F/O with rest and legality indicators.',
        tip: 'Pairings are generated based on flight chains — origin must match previous destination.',
      },
      {
        title: 'Bidlines',
        content: 'Assign monthly bidlines to crew members based on seniority. Toggle the bidding window open/closed and use dropdowns to match crew to available bidlines.',
        tip: 'More senior crew bid first — seniority order is shown on each card.',
      },
      {
        title: 'Reserve Assignment',
        content: 'View the reserve crew pool with availability and assign reserve crew to flights that have open positions. Filter available crew by role (captain, F/O, F/A).',
        tip: 'Reserve crew with "Available" status are ready for immediate assignment.',
      },
      {
        title: 'Swaps & Recovery',
        content: 'Three sub-tabs: Tail Swaps (aircraft re-routing), Crew Swaps (resolving violations), and Recovery Optimization (AI-suggested recovery strategies with delay/cost scoring).',
        tip: 'Apply the highest-scoring recovery option first to minimize overall delay impact.',
      },
    ],
  },
  {
    id: 'weather',
    icon: Cloud,
    iconBg: 'bg-cyan-500',
    iconColor: 'text-white',
    title: 'Weather Dashboard',
    description: 'Live METAR, TAF, SIGMET, and flight category for any ICAO station.',
    roles: ['all', 'dispatcher', 'pilot'],
    steps: [
      {
        title: 'Station Grid',
        content: 'Eight default US hub airports are shown as compact tiles. Each tile shows flight category (VFR/MVFR/IFR/LIFR), wind, visibility, and ceiling at a glance. Click a tile to load the detail panel.',
        tip: 'Color coding: Green = VFR, Blue = MVFR, Red = IFR, Purple = LIFR.',
      },
      {
        title: 'Adding a Station',
        content: 'Type any ICAO code (4 letters, e.g. EGLL for London Heathrow) in the search box and press Enter or click Add. The station is added to your grid and loaded immediately.',
        tip: 'Data is from aviationweather.gov — METAR refreshes every 5 min, TAF every 15 min.',
      },
      {
        title: 'Detail Panel',
        content: 'The detail panel shows a decoded weather summary (wind, visibility, temp/dew, altimeter), cloud layer breakdown, raw METAR string, and the full TAF forecast.',
        tip: 'Check the TAF for forecast trends before selecting alternates for long flights.',
      },
      {
        title: 'SIGMET Alerts',
        content: 'Active SIGMETs are shown in a red alert banner at the top of the page when present. Always check for active SIGMETs (severe turbulence, icing, volcanic ash) before dispatch.',
        tip: 'SIGMETs are fetched from aviationweather.gov and refresh every 15 minutes.',
      },
    ],
  },
  {
    id: 'safety',
    icon: Shield,
    iconBg: 'bg-orange-500',
    iconColor: 'text-white',
    title: 'Safety & QA',
    description: 'ASAP reporting, safety incidents, fatigue reports, QA audits, hazard tracking.',
    roles: ['all', 'dispatcher', 'pilot', 'cabin'],
    steps: [
      {
        title: 'Report Types',
        content: 'Five report types are supported: ASAP (Aviation Safety Action Program), Safety Incident, Fatigue Report, QA Audit, and Hazard Tracking. Each has type-specific fields.',
        tip: 'ASAP reports are voluntary and confidential — encourage crew to report without fear.',
      },
      {
        title: 'Risk Scoring',
        content: 'Each report is automatically scored 0–100 based on severity (40%), status urgency (30%), and age of report (30%). Reports are sorted highest risk first.',
        tip: 'Scores ≥75 (red) require immediate review. Scores 50–74 (orange) need follow-up within 48 hours.',
      },
      {
        title: 'Filtering Reports',
        content: 'Use the Filters panel to narrow reports by type (ASAP, incident, fatigue, etc.) and severity (low/medium/high/critical). This helps focus on priority items during shift review.',
        tip: 'Check critical severity reports at the start of every shift.',
      },
      {
        title: 'Report Details',
        content: 'Expand any report card to see full description, fatigue assessment, QA findings, mitigation steps, and assignment/due date. All details are visible to authorized personnel.',
        tip: 'Use the "Assigned To" field to ensure every open report has an owner.',
      },
    ],
  },
];

// ─── WALKTHROUGH MODAL ───────────────────────────────────────────────────────
function WalkthroughModal({ module, onClose }) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  const current = module.steps[step];
  const isLast = step === module.steps.length - 1;
  const Icon = module.icon;

  const markComplete = () => {
    setCompleted(prev => new Set([...prev, step]));
    if (!isLast) setStep(s => s + 1);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border bg-secondary/40 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', module.iconBg)}>
              <Icon className={cn('w-5 h-5', module.iconColor)} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">{module.title}</p>
              <p className="text-xs text-muted-foreground">Step {step + 1} of {module.steps.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 px-5 pt-4">
          {module.steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={cn('h-1.5 rounded-full transition-all flex-1',
                i === step ? 'bg-primary' : completed.has(i) ? 'bg-green-500' : 'bg-border'
              )} />
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <h3 className="text-base font-bold text-foreground">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.content}</p>
          {current.tip && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-primary mb-0.5">💡 Pro Tip</p>
              <p className="text-xs text-foreground">{current.tip}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            {completed.has(step) && (
              <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Done
              </span>
            )}
            {isLast ? (
              <button
                onClick={() => { markComplete(); onClose(); }}
                className="flex items-center gap-1.5 bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Complete Module
              </button>
            ) : (
              <button
                onClick={markComplete}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MODULE CARD ─────────────────────────────────────────────────────────────
function ModuleCard({ module, progress, onStart }) {
  const Icon = module.icon;
  const done = progress?.completed || 0;
  const total = module.steps.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-all">
      <div className="p-4 flex items-start gap-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', module.iconBg)}>
          <Icon className={cn('w-5 h-5', module.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{module.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{module.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {module.roles.filter(r => r !== 'all').map(r => (
              <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wide">{r}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {/* Progress bar */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{total} steps</span>
          <span className={cn('font-semibold', pct === 100 ? 'text-green-400' : 'text-muted-foreground')}>
            {pct === 100 ? '✓ Complete' : pct > 0 ? `${pct}%` : 'Not started'}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-500' : 'bg-primary')}
            style={{ width: `${pct}%` }} />
        </div>
        <button
          onClick={() => onStart(module)}
          className={cn(
            'w-full h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5',
            pct === 100
              ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
              : pct > 0
              ? 'bg-primary/15 text-primary hover:bg-primary/25'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {pct === 100 ? <><CheckCircle className="w-4 h-4" /> Review</> : pct > 0 ? <>Continue <ChevronRight className="w-4 h-4" /></> : <>Start Walkthrough <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TrainingCenter() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [activeModule, setActiveModule] = useState(null);
  const [progress, setProgress] = useState({}); // { moduleId: { completed: N } }

  const filtered = MODULES.filter(m => m.roles.includes(selectedRole));
  const totalSteps = filtered.reduce((s, m) => s + m.steps.length, 0);
  const doneSteps  = filtered.reduce((s, m) => s + (progress[m.id]?.completed || 0), 0);
  const overallPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const handleComplete = (moduleId) => {
    const mod = MODULES.find(m => m.id === moduleId);
    if (mod) setProgress(prev => ({ ...prev, [moduleId]: { completed: mod.steps.length } }));
    setActiveModule(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <GraduationCap className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">TRAINING CENTER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Interactive Module Walkthroughs · All Roles</p>
            </div>
          </div>
          {/* Overall progress */}
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-mono font-bold text-foreground">{overallPct}%</p>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{doneSteps} of {totalSteps} steps completed</span>
            <span className="sm:hidden font-bold text-foreground">{overallPct}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Role filter */}
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setSelectedRole(r.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                selectedRole === r.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              )}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(mod => (
            <ModuleCard
              key={mod.id}
              module={mod}
              progress={progress[mod.id]}
              onStart={m => setActiveModule(m)}
            />
          ))}
        </div>
      </div>

      {/* Walkthrough modal */}
      {activeModule && (
        <WalkthroughModal
          module={activeModule}
          onClose={() => handleComplete(activeModule.id)}
        />
      )}
    </div>
  );
}