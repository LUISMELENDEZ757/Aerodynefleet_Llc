import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plane, Radio, BookOpen, CalendarDays, Zap, Globe, Shield, Cloud, BookMarked, LayoutDashboard, AlertTriangle, Fuel, FileText, BarChart3, Weight, Navigation2, DollarSign, CalendarCheck, Wrench, GraduationCap, Satellite, MessageSquare, Truck, UserCheck, MonitorPlay, PieChart, UserCog, Activity, Layers } from 'lucide-react';
import { FleetBadge } from '@/components/fleet/FleetSwitcher';

import useTieredPreload from '@/hooks/useTieredPreload';
import { useRail } from '@/lib/RailContext';
import TechOpsDashboard from '@/components/techops/TechOpsDashboard';

// ── Tier 1: Critical modules ──────────────────────────────────────────────────
const TIER1 = [
  { icon: Plane,         iconBg: 'bg-primary',    iconColor: 'text-primary-foreground', title: 'FLIGHT OPS',    subtitle: 'Operations Center',       borderColor: 'border-primary/30',    path: '/Dashboard' },
  { icon: BookOpen,      iconBg: 'bg-yellow-500', iconColor: 'text-white',              title: 'EFB',           subtitle: 'Electronic Flight Bag',   borderColor: 'border-yellow-500/30', path: '/EFB' },
  { icon: Radio,         iconBg: 'bg-blue-500',   iconColor: 'text-white',              title: 'FLIGHT CREW',   subtitle: 'Cockpit Operations',      borderColor: 'border-blue-500/30',   path: '/FlightCrew' },
  { icon: Users,         iconBg: 'bg-purple-500', iconColor: 'text-white',              title: 'CABIN CREW',    subtitle: 'FA Dashboard',            borderColor: 'border-purple-500/30', path: '/FlightAttendant' },
  { icon: Zap,           iconBg: 'bg-red-500',    iconColor: 'text-white',              title: 'CREW CONTROL',  subtitle: 'FAR 117 · AI Assist',     borderColor: 'border-red-500/30',    path: '/CrewControl' },
  { icon: Cloud,         iconBg: 'bg-cyan-500',   iconColor: 'text-white',              title: 'WEATHER',       subtitle: 'METAR · TAF · SIGMET',    borderColor: 'border-cyan-500/30',   path: '/Weather' },
];

// ── Tier 2: Operational modules ───────────────────────────────────────────────
const TIER2 = [
  { icon: CalendarDays,  iconBg: 'bg-sky-500',    iconColor: 'text-white',              title: 'SCHEDULING',    subtitle: 'Pairings · Bidlines',     borderColor: 'border-sky-500/30',    path: '/Scheduling' },
  { icon: CalendarDays,  iconBg: 'bg-indigo-500', iconColor: 'text-white',              title: 'CREW CALENDAR', subtitle: 'Assignments · Duty',      borderColor: 'border-indigo-500/30', path: '/CrewCalendar' },
  { icon: Globe,         iconBg: 'bg-teal-500',   iconColor: 'text-white',              title: 'WORLD CLOCK',   subtitle: 'Aviation Hubs · UTC',     borderColor: 'border-teal-500/30',   path: '/WorldClock' },
  { icon: Shield,        iconBg: 'bg-orange-500', iconColor: 'text-white',              title: 'SAFETY & QA',   subtitle: 'ASAP · Incidents',        borderColor: 'border-orange-500/30', path: '/SafetyQA' },
  { icon: AlertTriangle, iconBg: 'bg-red-600',    iconColor: 'text-white',              title: 'IROPS',         subtitle: 'Recovery · AI Assist',    borderColor: 'border-red-600/30',    path: '/IROPS' },
  { icon: Fuel,          iconBg: 'bg-amber-500',  iconColor: 'text-white',              title: 'FUEL MGMT',     subtitle: 'Variance · Tankering',    borderColor: 'border-amber-500/30',  path: '/Fuel' },
  { icon: Weight,        iconBg: 'bg-cyan-600',   iconColor: 'text-white',              title: 'LOAD CONTROL',  subtitle: 'PAX Manifest · W&B',      borderColor: 'border-cyan-600/30',   path: '/LoadControl' },
  { icon: Navigation2,   iconBg: 'bg-blue-600',   iconColor: 'text-white',              title: 'FLIGHT PLANS',  subtitle: 'IFR · Clearances',        borderColor: 'border-blue-600/30',   path: '/FlightPlanner' },
  { icon: BookOpen,      iconBg: 'bg-emerald-500',iconColor: 'text-white',              title: 'LEARNING CENTER',subtitle: 'App Guide · Tutorials',   borderColor: 'border-emerald-500/30',path: '/Learning' },
];

// ── Tier 3: Enterprise modules ────────────────────────────────────────────────
const TIER3 = [
  { icon: LayoutDashboard,iconBg: 'bg-rose-500',  iconColor: 'text-white',              title: 'OPS CENTER',    subtitle: 'Unified Command View',    borderColor: 'border-rose-500/30',   path: '/OpsCenter' },
  { icon: BookMarked,    iconBg: 'bg-violet-500', iconColor: 'text-white',              title: 'LOGBOOK',       subtitle: 'Hours · Approaches · Currency', borderColor: 'border-violet-500/30', path: '/Logbook' },
  { icon: BarChart3,     iconBg: 'bg-lime-600',   iconColor: 'text-white',              title: 'ANALYTICS',     subtitle: 'OTP · Delays · Fleet',    borderColor: 'border-lime-600/30',   path: '/Analytics' },
  { icon: FileText,      iconBg: 'bg-slate-500',  iconColor: 'text-white',              title: 'AUDIT LOG',     subtitle: 'FAA Compliance Trail',    borderColor: 'border-slate-500/30',  path: '/AuditLog' },
  { icon: DollarSign,    iconBg: 'bg-red-700',    iconColor: 'text-white',              title: 'DELAY COSTS',   subtitle: 'Cost Tracker',            borderColor: 'border-red-700/30',    path: '/DelayCost' },
  { icon: CalendarCheck, iconBg: 'bg-indigo-600', iconColor: 'text-white',              title: 'CREW BIDDING',  subtitle: 'Monthly Pairings',        borderColor: 'border-indigo-600/30', path: '/CrewBidding' },
  { icon: Wrench,        iconBg: 'bg-orange-600', iconColor: 'text-white',              title: 'MEL DASHBOARD', subtitle: 'Deferrals · Expiring',      borderColor: 'border-orange-600/30', path: '/MEL' },
  { icon: BookMarked,    iconBg: 'bg-teal-600',   iconColor: 'text-white',              title: 'DOCUMENTS',     subtitle: 'FARs · SOPs · CBAs',      borderColor: 'border-teal-600/30',   path: '/Documents' },
  { icon: GraduationCap, iconBg: 'bg-green-600',  iconColor: 'text-white',              title: 'TRAINING',      subtitle: 'Records · Currency',      borderColor: 'border-green-600/30',  path: '/Training' },
  { icon: Fuel,          iconBg: 'bg-yellow-600', iconColor: 'text-white',              title: 'FUEL CONTRACTS',subtitle: 'Suppliers · Invoices',     borderColor: 'border-yellow-600/30', path: '/FuelContracts' },
  { icon: Users,         iconBg: 'bg-pink-600',   iconColor: 'text-white',              title: 'PAX REACCOM',   subtitle: 'IROPS Rebooking',         borderColor: 'border-pink-600/30',   path: '/PaxReaccom' },
  { icon: Satellite,     iconBg: 'bg-sky-700',    iconColor: 'text-white',              title: 'STARLINK',      subtitle: 'Aviation Connectivity',   borderColor: 'border-sky-700/30',    path: '/Starlink' },
  { icon: MessageSquare, iconBg: 'bg-emerald-700',iconColor: 'text-white',              title: 'COMM CENTER',   subtitle: 'Channels · ACARS · Broadcast', borderColor: 'border-emerald-700/30',path: '/CommCenter' },
  { icon: Truck,         iconBg: 'bg-zinc-600',   iconColor: 'text-white',              title: 'GROUND OPS',    subtitle: 'Turnaround · Pushback',   borderColor: 'border-zinc-600/30',   path: '/GroundOps' },
  { icon: AlertTriangle, iconBg: 'bg-red-800',    iconColor: 'text-white',              title: 'NOTAMs',        subtitle: 'Notices · Field Alerts',  borderColor: 'border-red-800/30',    path: '/NOTAMs' },
  { icon: UserCheck,     iconBg: 'bg-violet-700', iconColor: 'text-white',              title: 'CREW DIRECTORY',subtitle: 'Roster · FAR 117 Status', borderColor: 'border-violet-700/30', path: '/CrewDirectory' },
  { icon: MonitorPlay,   iconBg: 'bg-cyan-800',   iconColor: 'text-white',              title: 'FLIGHT BOARD',  subtitle: 'Live FIDS · Departures',  borderColor: 'border-cyan-800/30',   path: '/FlightBoard' },
  { icon: Wrench,        iconBg: 'bg-stone-600',  iconColor: 'text-white',              title: 'OOS DASHBOARD', subtitle: 'Fleet MX · Status',       borderColor: 'border-stone-600/30',  path: '/OOSDashboard' },
  { icon: PieChart,      iconBg: 'bg-rose-700',   iconColor: 'text-white',              title: 'COST REPORTING',subtitle: 'P&L · Delay · Fuel ROI',  borderColor: 'border-rose-700/30',   path: '/CostReporting' },
  { icon: UserCog,       iconBg: 'bg-slate-600',  iconColor: 'text-white',              title: 'USER MGMT',     subtitle: 'Roles · Invitations',     borderColor: 'border-slate-600/30',  path: '/UserManagement' },
  { icon: Activity,      iconBg: 'bg-emerald-700',iconColor: 'text-white',              title: 'ENGINEERING',   subtitle: 'Trend Analysis · Engine Health', borderColor: 'border-emerald-700/30', path: '/EngineeringDashboard' },
  { icon: Layers,        iconBg: 'bg-sky-600',    iconColor: 'text-white',              title: 'FLEET REGISTRY',subtitle: 'Multi-Fleet · Operators',        borderColor: 'border-sky-600/30',    path: '/FleetRegistry' },
];

// Stagger config per tier
const tierVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

function TierSection({ label, modules, delayStart = 0 }) {
  return (
    <div className="w-full max-w-lg">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delayStart, duration: 0.3 }}
        className="text-[10px] font-mono font-bold text-gray-600 tracking-widest uppercase mb-2 px-1"
      >
        {label}
      </motion.p>
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        variants={tierVariants}
        initial="hidden"
        animate="show"
        transition={{ delayChildren: delayStart }}
      >
        {modules.map(({ icon: Icon, iconBg, iconColor, title, subtitle, borderColor, path }) => (
          <motion.div key={title} variants={cardVariants}>
            <Link
              to={path}
              className={`relative rounded-2xl border ${borderColor} bg-[#161b27] p-4 flex flex-col items-center text-center active:scale-[0.96] transition-all duration-150 hover:bg-[#1e2436] hover:shadow-lg hover:shadow-black/40 block`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-md mb-3 flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <p className="text-xs font-extrabold text-white tracking-widest leading-tight mb-1">{title}</p>
              <p className="text-[11px] text-gray-400 leading-snug">{subtitle}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Home() {
  useTieredPreload();
  const { mode } = useRail();

  if (mode === 'tech') {
    return <TechOpsDashboard />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 pt-6 pb-24 flex flex-col items-center gap-6">
      {/* Header */}
      <motion.div
        className="mb-2 text-center w-full max-w-lg"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-mono font-bold text-primary tracking-widest uppercase">Aerodyne Fleet LLC</p>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Operations Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Airline-grade flight operations platform</p>
        <div className="mt-2 flex justify-center">
          <FleetBadge />
        </div>
      </motion.div>

      {/* Tier 1 — Critical (loads first, ~0ms) */}
      <TierSection label="Core Systems" modules={TIER1} delayStart={0.05} />

      {/* Tier 2 — Operational (~staggered after tier 1) */}
      <TierSection label="Operational" modules={TIER2} delayStart={0.45} />

      {/* Tier 3 — Enterprise (loads last) */}
      <TierSection label="More Tools" modules={TIER3} delayStart={0.85} />

      {/* Footer */}
      <p className="text-xs text-gray-600 font-mono">AERODYNE FLEET LLC · OPS v2.0</p>
    </div>
  );
}