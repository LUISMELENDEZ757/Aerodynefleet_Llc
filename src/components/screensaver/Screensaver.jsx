import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Shield, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS = {
  safety: '🛡️', engine: '⚙️', hydraulics: '🔧', avionics: '📡',
  flight_controls: '🕹️', apu: '⚡', fuel: '⛽', emergency: '🚨',
  regulatory: '📋', general: '✈️',
};

const DEFAULT_SLIDES = [
  {
    id: 'default-1', order: 0, is_active: true, duration_seconds: 9, category: 'engine',
    ata_chapter: '79', accent_color: '#f59e0b',
    image_url: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&q=80',
    title: 'Engine Oil System — ATA 79',
    subtitle: 'CFM56-7B Series',
    narration: 'Engine oil serves as the lifeblood of turbofan propulsion — lubricating bearings, cooling rotating components, and providing hydraulic pressure for variable stator actuators. Oil consumption above 0.8 qt/hr on the CFM56-7B warrants immediate investigation. Always verify oil level on cold engine soak; hot readings can deviate by up to 2 quarts due to thermal expansion.',
  },
  {
    id: 'default-2', order: 1, is_active: true, duration_seconds: 9, category: 'safety',
    ata_chapter: '05', accent_color: '#ef4444',
    image_url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80',
    title: 'Safety-First Culture',
    subtitle: 'FAA SMS & 14 CFR Part 5',
    narration: 'Safety Management Systems require every technician to report hazards without fear of reprisal. A single unresolved MEL item can cascade into an AOG event. Before signing any logbook entry, ask: "Would I put my family on this aircraft?" Your signature is your professional and legal commitment to airworthiness.',
  },
  {
    id: 'default-3', order: 2, is_active: true, duration_seconds: 9, category: 'avionics',
    ata_chapter: '34', accent_color: '#06b6d4',
    image_url: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1600&q=80',
    title: 'CAT III Autoland — Low Visibility Operations',
    subtitle: 'ILS CAT IIIb · RVR 75m',
    narration: 'Category III ILS approaches allow landings in near-zero visibility conditions down to RVR 75 meters. Both autopilot channels must be operative with redundant radio altimeters and autobrake armed. Ground crews must maintain ILS critical area protection from outer marker inbound. A single avionics anomaly detected by the FCC during the approach will trigger an automatic go-around.',
  },
  {
    id: 'default-4', order: 3, is_active: true, duration_seconds: 9, category: 'hydraulics',
    ata_chapter: '29', accent_color: '#3b82f6',
    image_url: 'https://images.unsplash.com/photo-1578615437406-511cafe4a5c7?w=1600&q=80',
    title: 'Hydraulic System A & B — ATA 29',
    subtitle: 'Boeing 737 Series · 3,000 PSI',
    narration: 'The 737NG operates three independent hydraulic systems at 3,000 PSI. System A powers ground spoilers, thrust reversers, nose wheel steering, and autopilot A. Loss of System A requires alternate nose wheel steering via differential braking. Always check reservoir quantity visually before dispatch — low-level sensors are MEL-able only with a maintenance action performed.',
  },
  {
    id: 'default-5', order: 4, is_active: true, duration_seconds: 9, category: 'emergency',
    ata_chapter: '26', accent_color: '#f97316',
    image_url: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1600&q=80',
    title: 'Fire Detection & Suppression — ATA 26',
    subtitle: 'Engine & APU Fire Systems',
    narration: 'Engine fire bottles are single-shot, non-rechargeable. During an engine fire drill, confirm the warning light is illuminated before discharge. The fire handle closes the fuel SOV, bleed air, arms the bottles, and trips the generator simultaneously. Time is critical — an uncontrolled engine fire can cause structural failure within 90 seconds.',
  },
  {
    id: 'default-6', order: 5, is_active: true, duration_seconds: 9, category: 'regulatory',
    ata_chapter: '05', accent_color: '#10b981',
    image_url: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=1600&q=80',
    title: 'MRO Line Operations — Return to Service',
    subtitle: '14 CFR 43.9 · Certificate of Release',
    narration: 'Every maintenance action on a U.S.-registered aircraft requires a signed return to service entry per 14 CFR 43.9. MRO facilities must maintain complete traceability from part removal through overhaul, re-installation, and final sign-off. An incomplete entry can render the maintenance legally invalid — exposing both the technician and operator to certificate action.',
  },
  {
    id: 'default-7', order: 6, is_active: true, duration_seconds: 9, category: 'flight_controls',
    ata_chapter: '27', accent_color: '#8b5cf6',
    image_url: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=1600&q=80',
    title: 'Departure — Flap & Slat Configuration',
    subtitle: 'ATA 27 · Takeoff Configuration Warning',
    narration: 'Takeoff configuration warnings exist because improper flap or slat settings are a leading cause of departure accidents. The TOCW system monitors flap position, stabilizer trim, speed brake, and parking brake before thrust application. Never silence a configuration warning without verifying the actual aircraft state. A rushed departure with flaps up has no survivable outcome below V1.',
  },
  {
    id: 'default-8', order: 7, is_active: true, duration_seconds: 9, category: 'apu',
    ata_chapter: '49', accent_color: '#eab308',
    image_url: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?w=1600&q=80',
    title: 'APU Operations — ATA 49',
    subtitle: 'Honeywell 131-9B · Ground Start Envelope',
    narration: 'The Auxiliary Power Unit provides bleed air for main engine start and ground electrical power. APU start is inhibited above 41,000 feet. Oil level must be checked within the approved servicing window — typically within 30 minutes of shutdown. An APU fire on the ground during boarding is a silent emergency; crew must initiate evacuation while APU fire suppression engages automatically.',
  },
  {
    id: 'default-9', order: 8, is_active: true, duration_seconds: 10, category: 'engine',
    ata_chapter: '72', accent_color: '#f97316',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    title: 'GE90-115B — World’s Most Powerful Turbofan',
    subtitle: 'Boeing 777-300ER · ATA 72 · 115,300 lbf Thrust',
    narration: 'The GE90-115B holds the world record for highest thrust produced by a commercial jet engine at 127,900 lbf during certification testing. Its 128-inch composite fan — the largest in commercial aviation — delivers exceptional bypass efficiency at a 9:1 ratio. On-wing life monitoring via GE’s Flight Pulse system tracks EGT margins, vibration signatures, and LLP cycle counts in real time. Oil consumption trending above baseline on either module requires immediate borescope evaluation before the next revenue flight.',
  },
  {
    id: 'default-10', order: 9, is_active: true, duration_seconds: 10, category: 'avionics',
    ata_chapter: '31', accent_color: '#06b6d4',
    image_url: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1600&q=80',
    title: 'Boeing 787 Dreamliner Cockpit — ATA 31',
    subtitle: 'Common Core System · Five 15.1" LCD Displays',
    narration: 'The 787 flight deck introduces the Common Core System — a centralised computing architecture replacing traditional line-replaceable avionics boxes with a network of standardised blade servers. Five large-format LCD displays present primary flight, navigation, engine, and systems data with fully configurable crew formats. The dual Head-Up Displays provide primary flight reference down to CAT IIIa minimums. Electronic checklists, e-enabled maintenance access, and real-time Boeing Airplane Health Management data are all integrated through the aircraft’s IP-based avionics network.',
  },
];

function ProgressBar({ duration, onComplete, paused }) {
  const [pct, setPct] = useState(0);
  const startRef = useRef(Date.now());
  const pausedRef = useRef(0);
  const pauseStartRef = useRef(null);

  useEffect(() => {
    setPct(0);
    startRef.current = Date.now();
    pausedRef.current = 0;
    pauseStartRef.current = null;
  }, [duration, onComplete]);

  useEffect(() => {
    if (paused) {
      pauseStartRef.current = Date.now();
    } else if (pauseStartRef.current) {
      pausedRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
  }, [paused]);

  useEffect(() => {
    const tick = () => {
      if (paused) return;
      const elapsed = Date.now() - startRef.current - pausedRef.current;
      const p = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setPct(p);
      if (p >= 100) onComplete();
    };
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [duration, onComplete, paused]);

  return (
    <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-primary transition-none rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Screensaver({ onDismiss }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data: dbSlides = [] } = useQuery({
    queryKey: ['screensaver-slides'],
    queryFn: () => base44.entities.ScreensaverSlide.list('order', 200),
  });

  const slides = (dbSlides.filter(s => s.is_active).length > 0
    ? [...dbSlides.filter(s => s.is_active)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : DEFAULT_SLIDES);

  const slide = slides[idx] || slides[0];

  const next = useCallback(() => setIdx(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), [slides.length]);

  const accent = slide?.accent_color || '#f59e0b';
  const catIcon = CATEGORY_ICONS[slide?.category] || '✈️';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[9999] bg-[#030508] flex flex-col overflow-hidden cursor-pointer select-none"
      onClick={onDismiss}
    >
      {/* Background subtle grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Background image */}
      {slide?.image_url && (
        <>
          <img
            src={slide.image_url}
            alt="Slide background"
            className="absolute inset-0 w-full h-full object-cover opacity-20 transition-opacity duration-1000"
            onError={e => e.currentTarget.style.display = 'none'}
          />
          {/* Dark gradient overlay for text legibility */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #030508 30%, rgba(3,5,8,0.55) 70%, rgba(3,5,8,0.4) 100%)' }} />
        </>
      )}

      {/* Accent glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 100%, ${accent}22 0%, transparent 70%)` }} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-6 pb-2 flex-shrink-0 relative z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}33` }}>
            <Plane className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white/80 uppercase tracking-[0.2em]">Aerodyne Fleet OS v2.1</p>
            <p className="text-[10px] text-white/30 tracking-widest">Safety & Systems Knowledge Database</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/50">SYSTEM OK</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-white/50">DATA SYNC</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDismiss(); }}
            className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Slide progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-2 flex-shrink-0 relative z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); setIdx(i); }}
            className="rounded-full transition-all"
            style={{
              width: i === idx ? 20 : 6, height: 6,
              background: i === idx ? accent : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-3xl w-full text-center space-y-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Category badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{catIcon}</span>
              <span className="text-xs font-extrabold uppercase tracking-[0.25em]"
                style={{ color: accent }}>
                {slide?.category?.replace(/_/g, ' ')}
                {slide?.ata_chapter ? ` · ATA ${slide.ata_chapter}` : ''}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {slide?.title}
              </h1>
              {slide?.subtitle && (
                <p className="text-lg font-semibold mt-2" style={{ color: accent }}>{slide.subtitle}</p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 max-w-16 h-px" style={{ background: `${accent}40` }} />
              <Shield className="w-4 h-4 opacity-40" style={{ color: accent }} />
              <div className="flex-1 max-w-16 h-px" style={{ background: `${accent}40` }} />
            </div>

            {/* Narration */}
            <p className="text-base md:text-lg text-white/75 leading-relaxed font-light max-w-2xl mx-auto">
              {slide?.narration}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* System status bar */}
      <div className="flex-shrink-0 px-8 py-3 relative z-10 border-t border-white/10 bg-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[9px] text-white/40 tracking-widest uppercase">
          <span>Fleet Status: OPERATIONAL</span>
          <span>·</span>
          <span>Maintenance Data: SYNCED</span>
          <span>·</span>
          <span>Compliance: 98.7%</span>
          <span>·</span>
          <span>Last Update: Live</span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 px-8 pb-8 relative z-10 space-y-4">
        {/* Progress bar */}
        <div className="max-w-xl mx-auto">
          <ProgressBar
            key={`${idx}-${slide?.duration_seconds}`}
            duration={slide?.duration_seconds || 8}
            onComplete={next}
            paused={paused}
          />
        </div>

        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/80 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <p className="text-[10px] text-white/25 tracking-widest uppercase">
            Click anywhere to dismiss · {idx + 1} / {slides.length}
          </p>
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/80 transition-colors">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}