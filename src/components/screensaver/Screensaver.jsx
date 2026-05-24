import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, X, ChevronLeft, ChevronRight, Shield, Wrench,
  Activity, BookOpen, Zap, AlertTriangle, Clock, Globe,
  Radio, Wind, Map, Users, FileCheck, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Module showcase data ──────────────────────────────────────────────────────
const MODULE_SLIDES = [
  {
    id: 'mod-mcc', accent: '#ef4444', icon: 'mcc',
    label: 'Maintenance Control Center',
    sub: 'AOG Recovery · Positive Fix Locks · Field Trip Ops',
    body: 'The nerve center of fleet airworthiness. MCC controllers manage AOG recovery, place Positive Fix Locks requiring technician concurrence, and coordinate real-time field trip operations with full logistics tracking.',
    stat1: { label: 'AOG Response', value: '< 15 min' },
    stat2: { label: 'Lock Protocol', value: 'Active' },
    img: 'https://images.unsplash.com/photo-1578615437406-511cafe4a5c7?w=1600&q=80',
  },
  {
    id: 'mod-fleet', accent: '#f59e0b', icon: 'fleet',
    label: 'Fleet Health Dashboard',
    sub: 'B737 · B777 · B787 · A320/321 · A350 · E190 · CRJ',
    body: 'Real-time airworthiness tracking across every tail number. Status, MEL deferrals, ETOPS authorization, CAT approval, engine health, and RNP capability — all in one operational view.',
    stat1: { label: 'Fleet Types', value: '16 A/C' },
    stat2: { label: 'Avg Availability', value: '98.4%' },
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80',
  },
  {
    id: 'mod-dispatch', accent: '#06b6d4', icon: 'dispatch',
    label: 'Dispatch Workstation',
    sub: 'Electronic Flight Release · ETOPS · CAT · FAR 117',
    body: 'Integrated dispatch platform issuing electronic flight releases with ETOPS validation, CAT authorization checks, crew legality enforcement under FAR 117, and real-time weather briefings.',
    stat1: { label: 'Release Time', value: '4.2 min' },
    stat2: { label: 'Compliance', value: '100%' },
    img: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1600&q=80',
  },
  {
    id: 'mod-techops', accent: '#8b5cf6', icon: 'techops',
    label: 'TechOps Electronic Logbook',
    sub: 'Digital Discrepancies · RII Sign-off · 14 CFR 43.9',
    body: 'Fully digital aircraft logbook with cryptographic signing, RII inspection workflow, MEL cross-reference, and automatic escalation to MCC. Every entry is legally traceable per 14 CFR Part 43.',
    stat1: { label: 'Entries/Day', value: '340+' },
    stat2: { label: 'Sign Method', value: 'SHA-256' },
    img: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=1600&q=80',
  },
  {
    id: 'mod-etops', accent: '#a78bfa', icon: 'etops',
    label: 'ETOPS Monitor',
    sub: '120 · 180 · 370 Min Authorization · Real-Time Alerts',
    body: 'Per-tail ETOPS authorization tracking cross-referenced against engine health, oil consumption trends, and MEL deferrals. Dispatchers and MCC see live downgrade alerts before any oceanic departure.',
    stat1: { label: 'Max ETOPS', value: '370 min' },
    stat2: { label: 'Alert Lead', value: 'Pre-flight' },
    img: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1600&q=80',
  },
  {
    id: 'mod-engine', accent: '#f97316', icon: 'engine',
    label: 'Engine Health Analytics',
    sub: 'EGT Margin · Oil Consumption · LLP Life · OEM Telemetry',
    body: 'Real-time EGT margin trending, oil consumption monitoring, and Life-Limited Parts cycle tracking. Telemetry ingested from Boeing AHM, Airbus Skywise, and Embraer AHEAD with automated escalation to Engineering.',
    stat1: { label: 'Engines Tracked', value: 'All Fleet' },
    stat2: { label: 'OEM Feeds', value: '3 Live' },
    img: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&q=80',
  },
  {
    id: 'mod-tracker', accent: '#22c55e', icon: 'tracker',
    label: 'World Route Map',
    sub: 'FlightAware AeroAPI · Live Position · Track Overlay',
    body: 'Live global flight tracking powered by FlightAware AeroAPI. Aircraft positions, route tracks, altitude, groundspeed, and heading — rendered in real time on a world map with airline and airport filtering.',
    stat1: { label: 'Data Source', value: 'AeroAPI' },
    stat2: { label: 'Refresh', value: '2 min' },
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
  },
  {
    id: 'mod-mel', accent: '#3b82f6', icon: 'mel',
    label: 'MEL Dashboard',
    sub: 'Category A/B/C/D · Expiry Tracking · AI Insights',
    body: 'Minimum Equipment List management with automated expiry countdown, AI-driven maintenance prioritization, and fleet-wide deferral visibility. Chronic item watchlist flags repeat discrepancies before they impact reliability.',
    stat1: { label: 'Categories', value: 'A/B/C/D' },
    stat2: { label: 'AI Analysis', value: 'Live' },
    img: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=1600&q=80',
  },
];

const ICON_MAP = {
  mcc:      <AlertTriangle className="w-6 h-6" />,
  fleet:    <Plane className="w-6 h-6" />,
  dispatch: <FileCheck className="w-6 h-6" />,
  techops:  <BookOpen className="w-6 h-6" />,
  etops:    <Globe className="w-6 h-6" />,
  engine:   <Zap className="w-6 h-6" />,
  tracker:  <Map className="w-6 h-6" />,
  mel:      <Layers className="w-6 h-6" />,
};

// ── Animated aircraft SVG ─────────────────────────────────────────────────────
function AircraftSVG({ color = '#f59e0b', size = 120, opacity = 0.12, className = '' }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 200 110" className={className} style={{ opacity }}>
      {/* Fuselage */}
      <ellipse cx="100" cy="55" rx="85" ry="14" fill={color} />
      {/* Nose cone */}
      <path d="M185 55 Q202 55 200 55 Q202 48 185 48 Z" fill={color} />
      {/* Wings */}
      <path d="M110 55 L130 10 L145 12 L125 58 Z" fill={color} />
      <path d="M110 55 L130 100 L145 98 L125 52 Z" fill={color} />
      {/* Horizontal stabilizer */}
      <path d="M30 55 L18 35 L28 36 L38 55 Z" fill={color} />
      <path d="M30 55 L18 75 L28 74 L38 55 Z" fill={color} />
      {/* Vertical stabilizer */}
      <path d="M32 55 L22 30 L32 32 L38 55 Z" fill={color} />
      {/* Engine #1 */}
      <ellipse cx="122" cy="22" rx="9" ry="5" fill={color} opacity="0.7" />
      {/* Engine #2 */}
      <ellipse cx="122" cy="88" rx="9" ry="5" fill={color} opacity="0.7" />
      {/* Windows */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <rect key={i} x={80 - i * 8} y={51} width="4" height="4" rx="1" fill="white" opacity="0.25" />
      ))}
    </svg>
  );
}

// ── Floating aircraft trail ───────────────────────────────────────────────────
function FloatingAircraft({ accent }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large bg aircraft */}
      <motion.div
        className="absolute"
        style={{ top: '8%', left: '-15%' }}
        animate={{ x: ['0%', '130%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        <AircraftSVG color={accent} size={340} opacity={0.06} />
      </motion.div>

      {/* Mid aircraft going right */}
      <motion.div
        className="absolute"
        style={{ top: '55%', left: '-10%' }}
        animate={{ x: ['0%', '120%'] }}
        transition={{ duration: 38, repeat: Infinity, ease: 'linear', delay: 6 }}
      >
        <AircraftSVG color="#ffffff" size={200} opacity={0.04} />
      </motion.div>

      {/* Small high aircraft */}
      <motion.div
        className="absolute"
        style={{ top: '22%', right: '-8%' }}
        animate={{ x: ['-120%', '0%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear', delay: 2 }}
      >
        <AircraftSVG color={accent} size={150} opacity={0.07} />
      </motion.div>

      {/* Dotted contrail lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
        <line x1="0" y1="20%" x2="100%" y2="18%" stroke="white" strokeWidth="1" strokeDasharray="8 14" />
        <line x1="0" y1="62%" x2="100%" y2="65%" stroke="white" strokeWidth="1" strokeDasharray="6 18" />
        <line x1="0" y1="40%" x2="100%" y2="38%" stroke={accent} strokeWidth="0.8" strokeDasharray="4 20" />
      </svg>
    </div>
  );
}

// ── HUD corner elements ───────────────────────────────────────────────────────
function HudCorner({ position = 'tl', color }) {
  const posClass = {
    tl: 'top-4 left-4',
    tr: 'top-4 right-4',
    bl: 'bottom-4 left-4',
    br: 'bottom-4 right-4',
  }[position];
  const borders = {
    tl: 'border-t-2 border-l-2 rounded-tl-lg',
    tr: 'border-t-2 border-r-2 rounded-tr-lg',
    bl: 'border-b-2 border-l-2 rounded-bl-lg',
    br: 'border-b-2 border-r-2 rounded-br-lg',
  }[position];
  return (
    <div className={cn('absolute w-6 h-6 pointer-events-none', posClass, borders)}
      style={{ borderColor: `${color}60` }} />
  );
}

// ── Live stats bar ────────────────────────────────────────────────────────────
function LiveStatsBar({ aircraft, oosEntries, melItems }) {
  const total = aircraft.length;
  const down = aircraft.filter(a => a.status === 'oos' || a.status === 'maintenance').length;
  const active = aircraft.filter(a => a.status === 'active').length;
  const openMel = melItems.filter(m => m.status !== 'closed').length;
  const openOos = oosEntries.filter(e => e.status !== 'released').length;

  const items = [
    { label: 'Fleet', value: total || '—' },
    { label: 'Active', value: active || '—', green: true },
    { label: 'OOS/MX', value: down || '0', red: down > 0 },
    { label: 'Open OOS', value: openOos || '0' },
    { label: 'Open MEL', value: openMel || '0', amber: openMel > 0 },
  ];

  return (
    <div className="flex items-center gap-6">
      {items.map(({ label, value, green, red, amber }) => (
        <div key={label} className="text-center">
          <p className={cn('text-base font-black leading-none',
            green ? 'text-green-400' : red ? 'text-red-400' : amber ? 'text-amber-400' : 'text-white/60'
          )}>{value}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ duration, onComplete, accent }) {
  const [pct, setPct] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setPct(0);
    startRef.current = Date.now();
  }, [duration, onComplete]);

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setPct(p);
      if (p >= 100) onComplete();
    }, 50);
    return () => clearInterval(id);
  }, [duration, onComplete]);

  return (
    <div className="h-0.5 bg-white/10 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-none"
        style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

// ── Module dot grid ───────────────────────────────────────────────────────────
function ModuleDots({ slides, currentIdx, onSelect, accent }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap max-w-md mx-auto">
      {slides.map((s, i) => (
        <button
          key={s.id}
          onClick={e => { e.stopPropagation(); onSelect(i); }}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === currentIdx ? 24 : 8,
            height: 8,
            background: i === currentIdx ? accent : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  );
}

// ── Main Screensaver ──────────────────────────────────────────────────────────
export default function Screensaver({ onDismiss }) {
  const [idx, setIdx] = useState(0);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['ss-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    staleTime: 300000,
  });
  const { data: oosEntries = [] } = useQuery({
    queryKey: ['ss-oos'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 100),
    staleTime: 300000,
  });
  const { data: melItems = [] } = useQuery({
    queryKey: ['ss-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 200),
    staleTime: 300000,
  });

  const slides = MODULE_SLIDES;
  const slide = slides[idx];
  const accent = slide?.accent || '#f59e0b';

  const next = useCallback(() => setIdx(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), [slides.length]);

  // Current time
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="fixed inset-0 z-[9999] bg-[#020508] flex flex-col overflow-hidden cursor-pointer select-none"
      onClick={onDismiss}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Background image with cinematic overlay */}
      <AnimatePresence mode="wait">
        <motion.div key={`bg-${idx}`} className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}>
          <img
            src={slide.img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.12 }}
            onError={e => e.currentTarget.style.display = 'none'}
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #020508 0%, rgba(2,5,8,0.7) 50%, #020508 100%)' }} />
        </motion.div>
      </AnimatePresence>

      {/* Accent radial glow */}
      <AnimatePresence mode="wait">
        <motion.div key={`glow-${idx}`}
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 85%, ${accent}18 0%, transparent 65%)` }} />
      </AnimatePresence>

      {/* Floating aircraft graphics */}
      <FloatingAircraft accent={accent} />

      {/* HUD corner brackets */}
      <HudCorner position="tl" color={accent} />
      <HudCorner position="tr" color={accent} />
      <HudCorner position="bl" color={accent} />
      <HudCorner position="br" color={accent} />

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-10 pt-6 pb-3 border-b flex-shrink-0"
        style={{ borderColor: `${accent}20` }}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ background: `${accent}18`, borderColor: `${accent}40` }}>
            <Plane className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-xs font-black tracking-[0.25em] uppercase text-white/80">Aerodyne Fleet OS</p>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: `${accent}80` }}>
              Aviation Operations Platform · v2.1
            </p>
          </div>
        </div>

        {/* Live stats from DB */}
        <LiveStatsBar aircraft={aircraft} oosEntries={oosEntries} melItems={melItems} />

        {/* Time + dismiss */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-xl font-black font-mono text-white/70 leading-none">{time}</p>
            <p className="text-[9px] text-white/30 tracking-widest uppercase mt-0.5">UTC / ZULU</p>
          </div>
          <div className="flex items-center gap-2 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/30 uppercase tracking-widest">Live</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDismiss(); }}
            className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors border border-white/10"
          >
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex items-center justify-center px-10 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Module icon + label row */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2"
                style={{ background: `${accent}18`, borderColor: `${accent}50`, color: accent }}>
                {ICON_MAP[slide.icon]}
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.3em]"
                  style={{ color: `${accent}90` }}>
                  Module {idx + 1} of {slides.length}
                </p>
                <p className="text-sm font-black text-white/50 tracking-widest uppercase">{slide.label}</p>
              </div>
            </div>

            {/* Main title */}
            <div className="text-center mb-4">
              <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight">
                {slide.label}
              </h1>
              <p className="text-base font-semibold mt-2 tracking-wide" style={{ color: accent }}>
                {slide.sub}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6 max-w-sm mx-auto">
              <div className="flex-1 h-px" style={{ background: `${accent}30` }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              <div className="flex-1 h-px" style={{ background: `${accent}30` }} />
            </div>

            {/* Body */}
            <p className="text-center text-lg text-white/65 leading-relaxed font-light max-w-2xl mx-auto mb-8">
              {slide.body}
            </p>

            {/* Stat cards */}
            <div className="flex items-center justify-center gap-4">
              {[slide.stat1, slide.stat2].map((s, i) => (
                <div key={i}
                  className="px-6 py-3 rounded-2xl border flex flex-col items-center gap-1 min-w-[120px]"
                  style={{ background: `${accent}0d`, borderColor: `${accent}35` }}>
                  <p className="text-2xl font-black" style={{ color: accent }}>{s.value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── BOTTOM ── */}
      <div className="relative z-10 flex-shrink-0 px-10 pb-8 space-y-4 border-t"
        style={{ borderColor: `${accent}20` }}>

        {/* Progress bar */}
        <div className="pt-4 max-w-lg mx-auto">
          <ProgressBar
            key={`prog-${idx}`}
            duration={12}
            onComplete={next}
            accent={accent}
          />
        </div>

        {/* Dots */}
        <ModuleDots slides={slides} currentIdx={idx} onSelect={setIdx} accent={accent} />

        {/* Nav */}
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="flex items-center gap-2 text-xs font-bold text-white/30 hover:text-white/70 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <p className="text-[9px] text-white/20 tracking-widest uppercase">
            Click anywhere to dismiss
          </p>
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="flex items-center gap-2 text-xs font-bold text-white/30 hover:text-white/70 transition-colors">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}