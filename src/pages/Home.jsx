import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Shield, Zap, Globe, ChevronRight, CheckCircle, BarChart2, Settings } from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    title: 'FAA-Compliant',
    desc: 'Immutable audit trails, RII tracking, and full regulatory compliance — 14 CFR Part 43, Part 121, and ETOPS 121.374.',
  },
  {
    icon: Zap,
    title: 'Real-Time Intelligence',
    desc: 'Live AOG tracking, OOS status monitoring, and department-specific workflows across maintenance, QC, and dispatch.',
  },
  {
    icon: Globe,
    title: 'Multi-Fleet Architecture',
    desc: 'Modeled on the Boeing 737, engineered for every fleet — CRJ, ERJ, Airbus A320, and more.',
  },
  {
    icon: BarChart2,
    title: 'Enterprise MRO Platform',
    desc: 'From line maintenance to heavy MRO: work packages, parts supply, ETOPS, MEL/CDL, and crew qualifications — unified.',
  },
];

const CAPABILITIES = [
  'OOS / AOG Tracking & Timeline Events',
  'Parts Ordering & Inventory Management',
  'E-Logbook & Airworthiness Records',
  'ETOPS Compliance & Monitoring',
  'MEL/CDL Enforcement (Categories A–D)',
  'ROB/BOR Cannibalization Workflows',
  'Real-Time Fleet Status Dashboard',
  'Quality Control & RII Sign-Off',
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative px-6 pt-12 pb-10 border-b border-border overflow-hidden">
        {/* Subtle grid bg */}
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

          <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-3">
            See the entire operation<br />
            <span className="text-primary">in one place.</span>
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg">
            AerodyneFleet's unified engine connects maintenance, reliability, cabin, and OCC workflows into one clear picture.
            Less stress. More control. Better decisions.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/Dashboard"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Open OOS Tracker
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="https://www.aerodynefleet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border text-foreground font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Globe className="w-4 h-4" />
              Visit Website
            </a>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="px-6 py-8">
        <p className="text-xs font-mono font-semibold text-primary tracking-widest uppercase mb-4">Platform Capabilities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
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

        {/* Capability checklist */}
        <div className="rounded-xl bg-card border border-border p-5 mb-8">
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
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-sm text-foreground italic leading-relaxed mb-3">
            "Aviation deserves software that understands the operation and teaches it. Aerodyne Fleet was built to bring clarity, speed, and reliability back to aviation operations."
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