import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wrench, Gauge, Truck, AlertTriangle, ClipboardList,
  Package, BookOpen, GraduationCap, FileText, DollarSign,
  BarChart3, Home, Activity, Shield
} from 'lucide-react';

const TECH_CARDS = [
  { icon: Shield,        iconBg: 'bg-red-700',    title: 'MCC',            subtitle: 'Maintenance Control Center', path: '/MaintenanceControl' },
  { icon: Wrench,        iconBg: 'bg-orange-600', title: 'MEL Dashboard',  subtitle: 'Deferrals · Expiring',       path: '/MEL' },
  { icon: Activity,      iconBg: 'bg-stone-600',  title: 'Fleet Dashboard', subtitle: 'Aircraft Status · Registry',  path: '/FleetDashboard' },
  { icon: Gauge,         iconBg: 'bg-stone-600',  title: 'OOS Dashboard',  subtitle: 'Fleet MX · Status',          path: '/OOSDashboard' },
  { icon: Truck,         iconBg: 'bg-zinc-600',   title: 'Ground Ops',     subtitle: 'Turnaround · Pushback',      path: '/GroundOps' },
  { icon: AlertTriangle, iconBg: 'bg-red-800',    title: 'NOTAMs',         subtitle: 'Notices · Field Alerts',     path: '/NOTAMs' },
  { icon: ClipboardList, iconBg: 'bg-orange-500', title: 'Safety & QA',    subtitle: 'ASAP · Incidents',           path: '/SafetyQA' },
  { icon: Package,       iconBg: 'bg-yellow-700', title: 'Parts / OOS',    subtitle: 'New OOS Entry',              path: '/NewOOS' },
  { icon: BookOpen,      iconBg: 'bg-violet-600', title: 'E-Logbook',      subtitle: 'Discrepancies · Faults · MEL', path: '/TechOpsLogbook' },
  { icon: GraduationCap, iconBg: 'bg-green-600',  title: 'Training',       subtitle: 'Records · Currency',         path: '/Training' },
  { icon: FileText,      iconBg: 'bg-teal-600',   title: 'Documents',      subtitle: 'FARs · SOPs · CBAs',         path: '/Documents' },
  { icon: BookOpen,      iconBg: 'bg-emerald-500',title: 'Learning',       subtitle: 'App Guide · Tutorials',      path: '/Learning' },
  { icon: DollarSign,    iconBg: 'bg-rose-700',   title: 'Cost Reporting', subtitle: 'P&L · Delay · Fuel ROI',     path: '/CostReporting' },
  { icon: BarChart3,     iconBg: 'bg-lime-600',   title: 'Analytics',      subtitle: 'OTP · Delays · Fleet',       path: '/Analytics' },
  { icon: Activity,      iconBg: 'bg-emerald-700',title: 'Engineering',    subtitle: 'Trends · Engine Health', path: '/EngineeringDashboard' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function TechOpsDashboard() {
  return (
    <div className="min-h-screen bg-[#0d1117] px-4 pt-6 pb-24 flex flex-col items-center gap-6">
      <motion.div
        className="text-center w-full max-w-lg"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xs font-mono font-bold text-orange-400 tracking-widest uppercase">TechOps</p>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Tech Operations</h1>
        <p className="text-sm text-gray-500 mt-1">Maintenance, MEL, Ground Ops & more</p>
      </motion.div>

      <div className="w-full max-w-lg">
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
        >
          {TECH_CARDS.map(({ icon: Icon, iconBg, title, subtitle, path }) => (
            <motion.div key={path} variants={cardVariants}>
              <Link
                to={path}
                className="relative rounded-2xl border border-orange-500/20 bg-[#161b27] p-4 flex flex-col items-center text-center active:scale-[0.96] transition-all duration-150 hover:bg-[#1e2436] hover:shadow-lg hover:shadow-black/40 block"
              >
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-md mb-3 flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-extrabold text-white tracking-widest leading-tight mb-1">{title}</p>
                <p className="text-[11px] text-gray-400 leading-snug">{subtitle}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <p className="text-xs text-gray-600 font-mono">AERODYNE FLEET LLC · TECHOPS v2.0</p>
    </div>
  );
}