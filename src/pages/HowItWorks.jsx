import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Zap, Database, GitBranch, CheckCircle, Radio, Cpu, FileCheck, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    num: 1,
    icon: <Radio className="w-6 h-6" />,
    color: '#06b6d4',
    title: 'Event Ingestion',
    subtitle: 'ACARS · Starlink · EFB · Manual Entry',
    body: 'Every operational event enters the system through one of four channels: ACARS datalink messages from the aircraft, Starlink telemetry feeds, Electronic Flight Bag (EFB) submissions from the crew, or manual entry by ground personnel. Each event is timestamped, tagged with a tail number, and placed into the processing queue.',
  },
  {
    num: 2,
    icon: <Database className="w-6 h-6" />,
    color: '#f59e0b',
    title: 'Data Normalization',
    subtitle: 'Multi-source unification · Schema mapping',
    body: 'Raw data from disparate sources — Boeing AHM, Airbus Skywise, Embraer AHEAD, FlightAware AeroAPI — is normalized into a unified schema. Aircraft tail numbers, ATA chapters, flight numbers, and station codes are resolved to canonical identifiers, enabling cross-fleet analytics without source-system conflicts.',
  },
  {
    num: 3,
    icon: <Cpu className="w-6 h-6" />,
    color: '#8b5cf6',
    title: 'Logic Engine',
    subtitle: 'Rules · Thresholds · AI inference',
    body: 'The logic engine evaluates each normalized event against a ruleset: MEL category thresholds, ETOPS authorization requirements, FAR 117 duty limits, oil consumption rates, EGT margin trends, and AD compliance windows. AI models layer on top, providing predictive AOG probability scores and anomaly flags before a human ever sees the event.',
  },
  {
    num: 4,
    icon: <GitBranch className="w-6 h-6" />,
    color: '#ec4899',
    title: 'Workflow Routing',
    subtitle: 'MCC · Dispatch · TechOps · Engineering',
    body: 'Processed events are routed to the correct operational team. A hydraulic fault goes to MCC and TechOps simultaneously. An ETOPS downgrade alert routes to Dispatch and Engineering. A MEL deferral triggers the logbook workflow and notifies the Captain via EFB. No event falls through the cracks — every routing rule is auditable.',
  },
  {
    num: 5,
    icon: <FileCheck className="w-6 h-6" />,
    color: '#22c55e',
    title: 'Documentation & Compliance',
    subtitle: '14 CFR 43.9 · SHA-256 signatures · RII workflow',
    body: 'Every corrective action, deferral, and inspection generates a legally compliant record. Technicians apply digital signatures (SHA-256 hashed against the record state). RII inspectors countersign. The Certificate of Release to Service (CRS) is issued electronically. All records are immutable and retained per the configured retention policy.',
  },
  {
    num: 6,
    icon: <CheckCircle className="w-6 h-6" />,
    color: '#f97316',
    title: 'Release & Return to Service',
    subtitle: 'Dispatch release · Captain acceptance · MCC clearance',
    body: 'Once documentation is complete, the workflow closes the loop: MCC removes any Positive Fix Lock, Dispatch issues the electronic flight release, and the Captain accepts via EFB. The aircraft status updates fleet-wide in real time — from OOS to Active — visible to every stakeholder simultaneously.',
  },
  {
    num: 7,
    icon: <Zap className="w-6 h-6" />,
    color: '#a78bfa',
    title: 'Analytics & Continuous Learning',
    subtitle: 'Reliability · OTP · Cost · Predictive models',
    body: 'Every resolved event feeds back into the analytics engine. Reliability trends, OTP impact, delay cost attribution, and AOG frequency are computed continuously. The AI forecasting models retrain against new data, sharpening future predictions. The system gets measurably smarter with every flight cycle.',
  },
];

const MODULE_GROUPS = [
  {
    label: 'Fleet Health',
    color: '#f59e0b',
    modules: ['Fleet Dashboard', 'ETOPS Monitor', 'Engine Health Analytics', 'Avionics Dashboard', 'AOG Probability Forecast', 'AI Forecasting'],
  },
  {
    label: 'Maintenance Control',
    color: '#ef4444',
    modules: ['MCC Ops Hub', 'Maintenance Control', 'Positive Fix Locks', 'Field Trip Operations', 'OOS Dashboard'],
  },
  {
    label: 'Technical Operations',
    color: '#8b5cf6',
    modules: ['TechOps E-Logbook', 'Line Maintenance Dashboard', 'Crew Chief Dashboard', 'Work Assignments', 'Shift Handover'],
  },
  {
    label: 'Dispatch & Flight Ops',
    color: '#06b6d4',
    modules: ['Dispatch Workstation', 'AI Dispatch Copilot', 'IROPS Recovery', 'Flight Board', 'World Route Map'],
  },
  {
    label: 'Compliance & Records',
    color: '#22c55e',
    modules: ['Certificate of Release', 'Signature Audit', 'AD Tracking', 'Records Retention', 'QA / QC'],
  },
];

function StepCard({ step }) {
  return (
    <div className="relative flex gap-4 md:gap-6">
      {/* Connector line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 flex-shrink-0 z-10"
          style={{ background: `${step.color}18`, borderColor: `${step.color}50`, color: step.color }}>
          {step.icon}
        </div>
        {step.num < STEPS.length && (
          <div className="w-0.5 flex-1 mt-2" style={{ background: `${step.color}25`, minHeight: 32 }} />
        )}
      </div>
      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: `${step.color}80` }}>
            Step {step.num}
          </span>
        </div>
        <h3 className="text-lg font-black text-white mb-0.5">{step.title}</h3>
        <p className="text-xs font-semibold mb-2" style={{ color: step.color }}>{step.subtitle}</p>
        <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
      </div>
    </div>
  );
}

function ModuleGroup({ group }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#141922] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />
          <p className="text-sm font-bold text-white">{group.label}</p>
          <span className="text-[10px] text-gray-500">{group.modules.length} modules</span>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-white/8 pt-3">
          {group.modules.map(m => (
            <span key={m} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/10 text-gray-300 bg-white/5">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <Link to="/Learning" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <div>
          <p className="text-base font-extrabold tracking-wide leading-none">How It Works</p>
          <p className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">Aerodyne Fleet OS · System Architecture</p>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-10 max-w-2xl mx-auto">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent/8 to-transparent border border-primary/20 px-5 py-6 text-center space-y-2">
          <p className="text-2xl font-black text-white">From Event to Resolution</p>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
            A 7-step operational framework that takes any fleet event — from a pilot write-up to an ACARS fault — through ingestion, analysis, routing, documentation, and return to service.
          </p>
        </div>

        {/* Steps */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Operational Flow</p>
          <div>
            {STEPS.map(step => <StepCard key={step.num} step={step} />)}
          </div>
        </div>

        {/* AI Copilot Advantage */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-900/20 via-indigo-900/15 to-transparent border border-purple-500/30 px-6 py-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🤖</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white mb-1">AI Maintenance Copilot</p>
              <p className="text-xs text-purple-300 font-semibold mb-2">The Hidden Force Behind Every Decision</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Every event that enters the system is analyzed by our AI engine, which runs predictive models in parallel with your human technicians and MCC controllers. The Copilot:
              </p>
              <ul className="text-xs text-gray-400 mt-2.5 space-y-1.5 ml-4">
                <li className="flex gap-2"><span className="text-purple-400 font-bold">•</span> <span><strong>Predicts AOG probability</strong> before any actual failure, flagging high-risk trends in engine data, oil consumption, and fault patterns</span></li>
                <li className="flex gap-2"><span className="text-purple-400 font-bold">•</span> <span><strong>Recommends optimal maintenance windows</strong> by analyzing weather, crew scheduling, IROPS risk, and fuel cost minimization</span></li>
                <li className="flex gap-2"><span className="text-purple-400 font-bold">•</span> <span><strong>Auto-escalates critical issues</strong> to MCC when technician decision-making speed isn't fast enough</span></li>
                <li className="flex gap-2"><span className="text-purple-400 font-bold">•</span> <span><strong>Learns from every resolution</strong> — your fleet data continuously improves the predictive accuracy</span></li>
              </ul>
              <p className="text-xs text-purple-300 mt-3 font-semibold">Result: Fewer surprises, faster resolutions, measurably higher reliability and OTP.</p>
            </div>
          </div>
        </div>

        {/* Module Groups */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Platform Modules by Domain</p>
          <div className="space-y-2">
            {MODULE_GROUPS.map(g => <ModuleGroup key={g.label} group={g} />)}
          </div>
        </div>

        {/* Back CTA */}
        <div className="pt-2">
          <Link to="/Learning"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary/10 border border-primary/25 text-primary font-bold text-sm hover:bg-primary/20 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Learning Center
          </Link>
        </div>
      </div>
    </div>
  );
}