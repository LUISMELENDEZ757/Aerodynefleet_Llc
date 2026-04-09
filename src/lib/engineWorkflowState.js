// ─────────────────────────────────────────────────────────────────────────────
// Engine Removal & Installation — Complete Logic Flow
// All phase definitions, entry conditions, tasks, documents, tooling, roles,
// and completion gates live here. Components consume this as shared state.
// ─────────────────────────────────────────────────────────────────────────────

export const PHASES = [
  {
    id: 'mcc_init',
    index: 0,
    dept: 'MCC',
    label: 'MCC Initiation',
    color: 'text-primary',
    ring: 'border-primary',
    bg: 'bg-primary',
    role: 'MCC Controller',
    entryConditions: [
      'Logbook discrepancy entry verified',
      'Engineering order issued (if applicable)',
      'Work package number assigned',
    ],
    tasks: [
      {
        id: 'mcc_wp_setup',
        title: 'MCC Initiation & Work Package Setup',
        signOff: true,
        documents: ['AMM 71-00-00', 'IPC Engine Section', 'Engineering Order (if applicable)', 'Work Package Cover Sheet'],
        tooling: [],
      },
    ],
  },
  {
    id: 'pre_removal',
    index: 1,
    dept: 'Line MX',
    label: 'Pre-Removal Inspection',
    color: 'text-green-400',
    ring: 'border-green-400',
    bg: 'bg-green-500',
    role: 'Line Maintenance Technician',
    entryConditions: [
      'MCC work package issued and signed',
      'Aircraft placed in maintenance status',
      'Safety pins / locks installed',
    ],
    tasks: [
      {
        id: 'pre_visual_insp',
        title: 'Pre-Removal Visual Inspection',
        signOff: true,
        documents: ['Pre-Removal Inspection Checklist', 'AMM 71-00-00 Sec 201'],
        tooling: ['Digital Camera', 'Flashlight', 'Borescope (if required)'],
      },
      {
        id: 'qc_pre_removal_rii',
        title: 'QC Pre-Removal RII Sign-Off',
        signOff: true,
        documents: ['RII Sign-Off Card', 'Inspection Authorization Certificate'],
        tooling: [],
        isRII: true,
      },
    ],
  },
  {
    id: 'parts_tooling',
    index: 2,
    dept: 'Parts',
    label: 'Parts & Tooling Prep',
    color: 'text-yellow-400',
    ring: 'border-yellow-400',
    bg: 'bg-yellow-500',
    role: 'Parts / Stores',
    entryConditions: [
      'Pre-removal inspection complete',
      'Replacement engine serial number confirmed',
      'Parts request approved by MCC',
    ],
    tasks: [
      {
        id: 'parts_engine_staged',
        title: 'Stage Replacement Engine & QEC Kit',
        signOff: true,
        documents: ['Parts Requirement List', 'Engine Serviceable Tag', 'QEC Kit Inventory Sheet'],
        tooling: ['Engine Stand', 'Engine Sling (P/N 60-80-26)', 'Forklift'],
      },
      {
        id: 'tooling_reserved',
        title: 'Reserve & Inspect All Required Tooling',
        signOff: true,
        documents: ['Tool Control Sheet', 'Calibration Records'],
        tooling: ['Engine Sling', 'Bootstrap Kit', 'Torque Wrench Set', 'Lifting Equipment'],
      },
    ],
  },
  {
    id: 'engine_removal',
    index: 3,
    dept: 'Line MX',
    label: 'Engine Removal',
    color: 'text-blue-400',
    ring: 'border-blue-500',
    bg: 'bg-blue-600',
    role: 'Lead A&P Technician + RII Inspector',
    entryConditions: [
      'All parts and tooling staged and verified',
      'QC pre-removal RII complete',
      'Area safety briefing conducted',
      'Fire watch in place',
    ],
    tasks: [
      {
        id: 'disconnect_lines',
        title: 'Disconnect All Lines, Harnesses & Ducts',
        signOff: true,
        documents: ['AMM 71-00-00 Task 400', 'Work Card ENG-REM-001'],
        tooling: ['Blanking Caps Set', 'Torque Wrench', 'Screwdrivers'],
      },
      {
        id: 'engine_removal_amm',
        title: 'Engine Removal Per AMM',
        signOff: true,
        documents: ['AMM 71-00-00 Engine Removal', 'Work Card Package', 'Removal RII Card'],
        tooling: ['Engine Sling', 'Bootstrap Kit', 'Torque Wrenches', 'Engine Stand', 'Overhead Hoist'],
        isRII: true,
      },
    ],
  },
  {
    id: 'engine_install',
    index: 4,
    dept: 'Line MX',
    label: 'Engine Installation',
    color: 'text-cyan-400',
    ring: 'border-cyan-500',
    bg: 'bg-cyan-600',
    role: 'Lead A&P Technician + RII Inspector',
    entryConditions: [
      'Removed engine safely on stand',
      'Pylon inspected and cleared',
      'Replacement engine QEC complete',
      'Installation RII inspector on-site',
    ],
    tasks: [
      {
        id: 'engine_mating',
        title: 'Engine Positioning & Mating to Pylon',
        signOff: true,
        documents: ['AMM 71-00-00 Task 500', 'Installation RII Card'],
        tooling: ['Engine Sling', 'Alignment Pin Set', 'Torque Wrench'],
        isRII: true,
      },
      {
        id: 'reconnect_lines',
        title: 'Reconnect All Lines, Harnesses & Ducts',
        signOff: true,
        documents: ['AMM 71-00-00 Task 520', 'Connection Torque Card'],
        tooling: ['Torque Wrench Set', 'Cotter Pin Kit', 'Safety Wire Kit'],
      },
    ],
  },
  {
    id: 'post_testing',
    index: 5,
    dept: 'Line MX',
    label: 'Post-Install Testing',
    color: 'text-purple-400',
    ring: 'border-purple-500',
    bg: 'bg-purple-600',
    role: 'Lead A&P + RII Inspector',
    entryConditions: [
      'All connections torqued and safety-wired',
      'Oil serviced to proper level',
      'Cowlings closed and latched',
      'Ground fire extinguisher on-site',
    ],
    tasks: [
      {
        id: 'motoring_run',
        title: 'Dry Motoring & Oil Leak Check',
        signOff: true,
        documents: ['AMM 71-00-00 Task 600', 'Engine Motoring Procedure'],
        tooling: ['Headset', 'Fire Extinguisher', 'Fuel Flow Meter'],
      },
      {
        id: 'engine_run',
        title: 'Engine Run-Up & Functional Test',
        signOff: true,
        documents: ['Engine Run Procedure', 'Ground Run Record Card', 'Post-Run Inspection Sheet'],
        tooling: ['Headset', 'Fire Extinguisher', 'EGT Monitor', 'Chocks'],
        isRII: true,
      },
    ],
  },
  {
    id: 'final_release',
    index: 6,
    dept: 'MCC',
    label: 'Final MCC Release',
    color: 'text-primary',
    ring: 'border-primary',
    bg: 'bg-primary',
    role: 'MCC Controller + QC Inspector',
    entryConditions: [
      'All post-install tasks signed off',
      'Engine run satisfactory — no anomalies',
      'All RII items signed off',
      'Work package complete with no open items',
    ],
    tasks: [
      {
        id: 'qc_final_rii',
        title: 'Final QC / RII Inspection Sign-Off',
        signOff: true,
        documents: ['Final RII Sign-Off Card', 'QC Inspection Form'],
        tooling: [],
        isRII: true,
      },
      {
        id: 'mcc_release',
        title: 'MCC Final Release & Logbook Entry',
        signOff: true,
        documents: ['Return to Service Form', 'Completed Work Package', 'FAA Form 337 (if major repair)', 'Maintenance Release Statement'],
        tooling: [],
      },
    ],
  },
];

export const PHASE_IDS = PHASES.map(p => p.id);

export function getPhaseIndex(phaseId) {
  return PHASES.findIndex(p => p.id === phaseId);
}

export function getNextPhaseId(phaseId) {
  const idx = getPhaseIndex(phaseId);
  return idx >= 0 && idx < PHASES.length - 1 ? PHASES[idx + 1].id : null;
}

// A phase is unlocked if all tasks in all previous phases are completed
export function isPhaseUnlocked(phaseId, completedTasks) {
  const idx = getPhaseIndex(phaseId);
  if (idx === 0) return true;
  for (let i = 0; i < idx; i++) {
    const phase = PHASES[i];
    for (const task of phase.tasks) {
      if (!completedTasks[task.id]) return false;
    }
  }
  return true;
}

// Returns the current active phase id based on completed tasks
export function computeCurrentPhase(completedTasks) {
  for (const phase of PHASES) {
    const allDone = phase.tasks.every(t => completedTasks[t.id]);
    if (!allDone) return phase.id;
  }
  return 'final_release';
}