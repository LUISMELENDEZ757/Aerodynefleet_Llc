import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, BookOpen, ClipboardList, Send, Waves, Package,
  GraduationCap, Radio, Wrench, ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SYSTEMS = [
  { icon: Plane, title: 'Fleet Command Board', to: '/FleetDashboard', accent: 'from-yellow-500/20', color: 'text-yellow-400',
    desc: 'Real-time fleet health at a glance — AOG, maintenance, MEL and released status for every tail, with live gate and fuel state.' },
  { icon: BookOpen, title: 'E-Logbook', to: '/TechOpsLogbook', accent: 'from-cyan-500/20', color: 'text-cyan-400',
    desc: 'FAA 14 CFR 43.9-grade electronic aircraft logbook — discrepancies, corrective actions, deferrals, RII sign-offs and digital signatures.' },
  { icon: ClipboardList, title: 'MEL Control Center', to: '/MEL', accent: 'from-amber-500/20', color: 'text-amber-400',
    desc: 'Full MEL/NEF/CDL deferral lifecycle with CAT A/B/C/D expiry tracking, chronic item watchlists and dispatch-impact analysis.' },
  { icon: Send, title: 'Dispatch Workstation', to: '/Dispatch', accent: 'from-blue-500/20', color: 'text-blue-400',
    desc: 'Release building, crew legality, fuel planning, weather briefings and flight monitoring in one dispatcher console.' },
  { icon: Waves, title: 'ETOPS Monitor', to: '/ETOPSMonitor', accent: 'from-teal-500/20', color: 'text-teal-400',
    desc: 'Extended operations compliance — tail ratings, MEL-driven ETOPS restrictions and route capability resolution.' },
  { icon: Package, title: 'Parts & Supply Chain', to: '/PartsSupply', accent: 'from-purple-500/20', color: 'text-purple-400',
    desc: 'Requisitions, BOR/ROB control numbers, component traceability with 8130-3 support and predictive parts ordering.' },
  { icon: Wrench, title: 'Maintenance Control (MCC)', to: '/MaintenanceControl', accent: 'from-red-500/20', color: 'text-red-400',
    desc: 'Fleet-wide OOS boards, positive-fix locks, fault monitoring, shift handovers and RTS orchestration for maintenance controllers.' },
  { icon: Radio, title: 'Live Flight Tracker', to: '/LiveFlightTracker', accent: 'from-green-500/20', color: 'text-green-400',
    desc: 'FlightAware-powered live positions, station operations, gate management and turn performance across the network.' },
  { icon: GraduationCap, title: 'Aerodyne Academy', to: '/Academy', accent: 'from-violet-500/20', color: 'text-violet-400',
    desc: 'Part 147-aligned curriculum, mock discrepancy lab, AI tutor and instructor grading — training the next generation of AMTs.' },
];

export default function SystemsHeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % SYSTEMS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = SYSTEMS[index];
  const Icon = slide.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1623]">
      <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none', slide.accent)} />

      <div className="relative px-8 py-10 sm:px-12 sm:py-14 min-h-[280px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="space-y-4 max-w-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
                <Icon className={cn('w-6 h-6', slide.color)} />
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Built-In System · {index + 1} / {SYSTEMS.length}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">{slide.title}</h2>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{slide.desc}</p>
            <Link
              to={slide.to}
              className={cn('inline-flex items-center gap-2 text-sm font-extrabold hover:gap-3 transition-all', slide.color)}
            >
              Open {slide.title} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-center gap-1.5">
            {SYSTEMS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-primary' : 'w-1.5 bg-white/20 hover:bg-white/40'
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIndex(i => (i - 1 + SYSTEMS.length) % SYSTEMS.length)}
              className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setIndex(i => (i + 1) % SYSTEMS.length)}
              className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}