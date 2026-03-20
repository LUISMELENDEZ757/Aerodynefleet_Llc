import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Shield, Zap, Globe, ChevronRight, CheckCircle, BarChart2, Radio, Users, FileText, Cloud, BookOpen } from 'lucide-react';

const UNIFIED_FEATURES = [
  {
    icon: FileText,
    title: 'Shared Release & Flight Plan',
    desc: 'Dispatchers and pilots operate from the same release. Fuel decisions, alternates, and amendments flow to the cockpit instantly.',
  },
  {
    icon: Cloud,
    title: 'Live Weather & NOTAMs',
    desc: 'One weather package. One NOTAM brief. Updated in real time and visible to every role that needs it: dispatch, crew, and OCC.',
  },
  {
    icon: Users,
    title: 'Crew Legality (FAR 117)',
    desc: 'Flight duty periods, rest requirements, and cumulative limits tracked automatically and shared between crew scheduling and dispatch.',
  },
  {
    icon: Shield,
    title: 'MEL / CDL & Maintenance Impact',
    desc: 'Open MEL items and OOS entries surface directly inside the dispatch workflow. No phone calls, no surprises at the gate.',
  },
  {
    icon: Radio,
    title: 'ACARS Datalink',
    desc: 'OOOI reporting, dispatch messaging, and ATC relay in one thread. Shared between cockpit and operations control.',
  },
  {
    icon: BarChart2,
    title: 'One Operational Picture',
    desc: 'Fuel, performance, runway analysis, W&B, and post-flight reporting — all connected, all current, all in one system.',
  },
];

const CAPABILITIES = [
  'Dispatch Release Generation & Amendments',
  'Flight Plan & Fuel Decision Sharing',
  'Real-Time Weather (METAR / TAF / SIGMET)',
  'NOTAM Management by Airport',
  'FAR Part 117 Crew Legality Tracking',
  'Weight & Balance (737 Family)',
  'Takeoff & Landing Performance',
  'Fuel Planning & Burn Profiles',
  'Runway Analysis & Crosswind Limits',
  'OOS / AOG Tracking & Timeline Events',
  'ACARS Datalink & OOOI Reporting',
  'Post-Flight Discrepancy & Delay Codes',
];

const OCC_MODELS = [
  { code: 'UAL', label: 'United NOC' },
  { code: 'DAL', label: 'Delta OCC' },
  { code: 'AAL', label: 'American IOC' },
  { code: 'DLH', label: 'Lufthansa OCC' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative px-6 pt-12 pb-10 border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Plane className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-primary tracking-widest uppercase">Aerodyne Fleet LLC</p>
              <p className="text-xs text-muted-foreground">aerodynefleet.com</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Dispatch + Flight Ops · Unified Module</span>
          </div>

          <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-3">
            One operational picture<br />
            <span className="text-primary">for the entire flight.</span>
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-2 max-w-xl">
            Aerodyne Fleet brings Dispatch and Flight Ops together in a single, unified workspace designed for real-time airline decision-making.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xl">
            Dispatchers and pilots finally operate from the <span className="text-foreground font-semibold">same source of truth</span> — shared flight plans, weather, NOTAMs, MEL/CDL impact, crew legality, fuel decisions, and day-of-ops changes all flow through one connected system.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {['No Silos.', 'No Delays.', 'No Conflicting Data.'].map(t => (
              <span key={t} className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">{t}</span>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/Dashboard"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Flight Operations
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/EFB"
              className="inline-flex items-center gap-2 border border-border text-foreground font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Open EFB
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">

        {/* OCC model reference */}
        <div>
          <p className="text-xs font-mono font-semibold text-primary tracking-widest uppercase mb-3">The Model That Powers the World's Largest Airlines</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {OCC_MODELS.map(({ code, label }) => (
              <div key={code} className="rounded-xl bg-card border border-border px-4 py-3 text-center">
                <p className="text-base font-extrabold font-mono text-primary">{code}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Where dispatchers and pilots share the same release, the same weather package, the same NOTAMs, the same MEL/CDL impact, and the same fuel decisions.
            <span className="text-foreground font-semibold"> This is exactly how a real airline runs.</span>
          </p>
        </div>

        {/* Unified feature cards */}
        <div>
          <p className="text-xs font-mono font-semibold text-primary tracking-widest uppercase mb-4">Integrated Dispatch & Flight Operations</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UNIFIED_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Capability checklist */}
        <div className="rounded-xl bg-card border border-border p-5">
          <p className="text-xs font-mono font-semibold text-primary tracking-widest uppercase mb-4">What's Included</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAPABILITIES.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-5">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Plan smarter. Fly safer. Decide faster.</p>
          <p className="text-sm text-foreground italic leading-relaxed mb-4">
            "The connected workflow airlines have been missing. Aerodyne Fleet unifies dispatchers and flight crews into a single operational environment — flight planning, release generation, crew legality, weather, NOTAMs, ETOPS, and maintenance impact all live in one place, updated in real time."
          </p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Plane className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Luis</p>
              <p className="text-xs text-muted-foreground">Founder, Aerodyne Fleet LLC</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}