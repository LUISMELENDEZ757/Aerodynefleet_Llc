import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Plane, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Playback — animated flight route replay component.
 * Simulates an aircraft icon travelling from origin → destination
 * along a curved SVG arc with elapsed time + altitude profile.
 */

const TOTAL_STEPS = 100;

// Simple great-circle-ish arc between two points on an SVG canvas
function buildArc(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 40; // curve lift
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

// Quadratic bezier point at t
function bezierPoint(x1, y1, cx, cy, x2, y2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
  };
}

// Altitude profile: climb → cruise → descent (bell-ish)
function altProfile(t) {
  if (t < 0.2)       return Math.round((t / 0.2) * 35000);
  else if (t > 0.8)  return Math.round(((1 - t) / 0.2) * 35000);
  else               return 35000;
}

// Speed profile: accelerate → cruise → decelerate
function speedProfile(t) {
  if (t < 0.1)       return Math.round((t / 0.1) * 480);
  else if (t > 0.9)  return Math.round(((1 - t) / 0.1) * 480);
  else               return 480;
}

// Phase label
function phase(t) {
  if (t < 0.05)  return 'Taxi / Pushback';
  if (t < 0.15)  return 'Takeoff & Climb';
  if (t < 0.25)  return 'Initial Climb';
  if (t < 0.75)  return 'Cruise';
  if (t < 0.85)  return 'Descent';
  if (t < 0.95)  return 'Approach';
  return 'Landing';
}

// Interpolate elapsed time string from STD → STA
function elapsedTime(entry, t) {
  const pad = (n) => String(n).padStart(2, '0');
  try {
    const [dh, dm] = (entry.scheduled_departure || '09:00').split(':').map(Number);
    const [ah, am] = (entry.scheduled_arrival   || '11:30').split(':').map(Number);
    const startMin = dh * 60 + dm;
    const endMin   = ah * 60 + am;
    const total    = (endMin - startMin + 1440) % 1440 || 90;
    const curr     = Math.round(startMin + t * total) % 1440;
    return `${pad(Math.floor(curr / 60))}:${pad(curr % 60)} Z`;
  } catch {
    return '—';
  }
}

export default function Playback({ entry, onClose }) {
  const [step, setStep]       = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useState(1); // 1×, 2×, 4×
  const rafRef                = useRef(null);
  const lastRef               = useRef(null);
  const accRef                = useRef(0);

  // SVG layout
  const W = 320, H = 140;
  const x1 = 40, y1 = 100, x2 = 280, y2 = 100;
  const cx  = (x1 + x2) / 2;
  const cy  = (y1 + y2) / 2 - 40;
  const arc = buildArc(x1, y1, x2, y2);

  const t   = step / TOTAL_STEPS;
  const pos = bezierPoint(x1, y1, cx, cy, x2, y2, t);
  const alt   = altProfile(t);
  const spd   = speedProfile(t);
  const label = phase(t);

  // Heading angle along bezier tangent
  const dt   = 0.01;
  const pos2 = bezierPoint(x1, y1, cx, cy, x2, y2, Math.min(t + dt, 1));
  const angle = Math.atan2(pos2.y - pos.y, pos2.x - pos.x) * (180 / Math.PI);

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(rafRef.current); return; }
    const tick = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const delta = now - lastRef.current;
      lastRef.current = now;
      accRef.current += delta * speed;
      const STEP_MS = 80; // ms per step at 1×
      while (accRef.current >= STEP_MS) {
        accRef.current -= STEP_MS;
        setStep(s => {
          if (s >= TOTAL_STEPS) { setPlaying(false); return s; }
          return s + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [playing, speed]);

  const reset = () => { setStep(0); setPlaying(false); lastRef.current = null; accRef.current = 0; };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/60">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <p className="text-sm font-mono font-bold text-foreground">
              {entry.flight_number} · {entry.origin} → {entry.destination}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SVG map */}
        <div className="bg-background/50 px-4 pt-4 pb-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
            {/* Track line */}
            <path d={arc} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Travelled portion */}
            <path
              d={arc}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray={`${t * 320} 999`}
              opacity="0.7"
            />
            {/* Origin dot */}
            <circle cx={x1} cy={y1} r="5" fill="hsl(var(--primary))" opacity="0.8" />
            <text x={x1} y={y1 + 16} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{entry.origin}</text>
            {/* Destination dot */}
            <circle cx={x2} cy={y2} r="5" fill="hsl(var(--muted-foreground))" opacity="0.5" />
            <text x={x2} y={y2 + 16} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{entry.destination}</text>
            {/* Aircraft */}
            {step > 0 && step < TOTAL_STEPS && (
              <g transform={`translate(${pos.x}, ${pos.y}) rotate(${angle})`}>
                <circle r="9" fill="hsl(var(--primary) / 0.2)" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="12">✈</text>
              </g>
            )}
            {step === TOTAL_STEPS && (
              <g transform={`translate(${x2}, ${y2})`}>
                <circle r="7" fill="hsl(var(--primary) / 0.25)" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="11">✈</text>
              </g>
            )}
          </svg>
        </div>

        {/* Telemetry */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
          {[
            { label: 'Altitude', value: step === 0 || step === TOTAL_STEPS ? '0 ft' : `${alt.toLocaleString()} ft` },
            { label: 'Speed',    value: step === 0 || step === TOTAL_STEPS ? '0 kt' : `${spd} kt` },
            { label: 'Time',     value: elapsedTime(entry, t) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-secondary rounded-xl px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-xs font-mono font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Phase */}
        <p className="text-center text-xs text-primary font-semibold px-4 pb-2">{step > 0 ? label : 'Ready'}</p>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 pb-4 gap-3">
          <button onClick={reset} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => { if (step >= TOTAL_STEPS) reset(); setPlaying(p => !p); }}
            className="flex-1 h-10 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {playing ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> {step >= TOTAL_STEPS ? 'Replay' : 'Play'}</>}
          </button>

          {/* Speed toggle */}
          <button
            onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
            className="w-12 h-9 rounded-xl bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}