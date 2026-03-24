import { useEffect, useState, useRef } from 'react';

export default function SplashScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [phase, setPhase] = useState('in'); // 'in' | 'active' | 'out'
  const startTimeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    startTimeRef.current = performance.now();

    // ── Radar sweep state ────────────────────────────────────────────────
    let sweepAngle = -Math.PI / 2; // Start at top
    const SWEEP_SPEED = 0.018; // radians per frame

    // ── Blip state ───────────────────────────────────────────────────────
    const blips = [
      { angle: -0.9, dist: 0.28, trail: [] },
      { angle: 0.3,  dist: 0.52, trail: [] },
      { angle: 1.6,  dist: 0.38, trail: [] },
      { angle: -2.1, dist: 0.62, trail: [] },
      { angle: 2.8,  dist: 0.44, trail: [] },
    ];

    // ── ILS / Localizer state ────────────────────────────────────────────
    let ilsOffset = 0;
    let gsOffset = 0;
    let ilsDir = 1;
    let gsDir = 1;
    let ilsTime = 0;
    let gsTime = 0;

    const draw = (ts) => {
      const elapsed = (ts - startTimeRef.current) / 1000;
      const w = W();
      const h = H();
      const cx = w / 2;
      const cy = h * 0.42;
      const maxR = Math.min(w, h) * 0.34;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // ── Radar background ──────────────────────────────────────────────
      // Concentric rings
      for (let r = 1; r <= 4; r++) {
        const radius = (maxR * r) / 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 80, ${0.08 + r * 0.02})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Cross hairs
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();

      // Diagonal guides
      for (let a = 0; a < 4; a++) {
        const ang = (a * Math.PI) / 4 + Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * maxR, cy + Math.sin(ang) * maxR);
        ctx.strokeStyle = 'rgba(0, 255, 80, 0.05)';
        ctx.stroke();
      }

      // Radar scope outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Sweep gradient ────────────────────────────────────────────────
      const sweepGrad = ctx.createConicalGradient
        ? null // browsers don't have native conical gradient — use manual approach
        : null;

      // Manual sweep fan using multiple segments
      const TRAIL_STEPS = 60;
      for (let i = 0; i < TRAIL_STEPS; i++) {
        const frac = i / TRAIL_STEPS;
        const startA = sweepAngle - (frac + 1 / TRAIL_STEPS) * 1.6;
        const endA   = sweepAngle - frac * 1.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, startA, endA);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 255, 80, ${(1 - frac) * 0.13})`;
        ctx.fill();
      }

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(sweepAngle) * maxR,
        cy + Math.sin(sweepAngle) * maxR
      );
      ctx.strokeStyle = 'rgba(0, 255, 120, 0.95)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00ff50';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Blips ─────────────────────────────────────────────────────────
      blips.forEach(blip => {
        const blipAngle = blip.angle;
        const diff = ((sweepAngle - blipAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const intensity = Math.max(0, 1 - diff / (Math.PI * 1.2));

        if (intensity > 0.01) {
          const bx = cx + Math.cos(blipAngle) * maxR * blip.dist;
          const by = cy + Math.sin(blipAngle) * maxR * blip.dist;

          // Blip glow
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, 12 * intensity);
          grad.addColorStop(0, `rgba(0, 255, 80, ${intensity * 0.9})`);
          grad.addColorStop(0.4, `rgba(0, 255, 80, ${intensity * 0.4})`);
          grad.addColorStop(1, 'rgba(0, 255, 80, 0)');
          ctx.beginPath();
          ctx.arc(bx, by, 12, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Blip dot
          ctx.beginPath();
          ctx.arc(bx, by, 2.5 * intensity, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 255, 200, ${intensity})`;
          ctx.fill();
        }
      });

      // ── Range labels ──────────────────────────────────────────────────
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(0, 255, 80, 0.4)';
      ctx.textAlign = 'left';
      ['10', '20', '30', '40'].forEach((label, i) => {
        ctx.fillText(label + 'NM', cx + 4, cy - (maxR * (i + 1)) / 4 - 2);
      });

      // ── ILS Panel ─────────────────────────────────────────────────────
      const ilsX = w * 0.5;
      const ilsY = h * 0.81;
      const ilsW = Math.min(w * 0.82, 340);
      const ilsH = 80;
      const ilsLeft = ilsX - ilsW / 2;

      // Panel background
      ctx.fillStyle = 'rgba(0, 20, 8, 0.85)';
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.2)';
      ctx.lineWidth = 1;
      roundRect(ctx, ilsLeft, ilsY - ilsH / 2, ilsW, ilsH, 10);
      ctx.fill();
      ctx.stroke();

      // Header
      ctx.font = 'bold 8px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(0, 255, 80, 0.55)';
      ctx.textAlign = 'left';
      ctx.fillText('ILS · LOC / GS', ilsLeft + 12, ilsY - ilsH / 2 + 13);

      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(0, 255, 80, 0.45)';
      ctx.textAlign = 'right';
      ctx.fillText('RWY 04L · ILS Z · KEWR', ilsLeft + ilsW - 12, ilsY - ilsH / 2 + 13);

      // Divider
      ctx.beginPath();
      ctx.moveTo(ilsLeft + 10, ilsY - ilsH / 2 + 18);
      ctx.lineTo(ilsLeft + ilsW - 10, ilsY - ilsH / 2 + 18);
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.12)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // ── Localizer bar (horizontal) ────────────────────────────────────
      const locY = ilsY - 12;
      const locBarW = ilsW - 60;
      const locBarX = ilsLeft + 30;
      const locBarH = 6;

      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(0, 255, 80, 0.45)';
      ctx.textAlign = 'left';
      ctx.fillText('LOC', ilsLeft + 12, locY + 4);
      ctx.textAlign = 'right';
      ctx.fillText('DDM', ilsLeft + ilsW - 12, locY + 4);

      // Track bar background
      ctx.fillStyle = 'rgba(0, 255, 80, 0.06)';
      roundRect(ctx, locBarX, locY - locBarH / 2, locBarW, locBarH, 3);
      ctx.fill();

      // Track tick marks
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.3)';
      ctx.lineWidth = 0.75;
      [-2, -1, 0, 1, 2].forEach(tick => {
        const tx = locBarX + locBarW / 2 + tick * (locBarW / 5);
        ctx.beginPath();
        ctx.moveTo(tx, locY - locBarH / 2 - 3);
        ctx.lineTo(tx, locY + locBarH / 2 + 3);
        ctx.stroke();
      });

      // Center marker (thick)
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(locBarX + locBarW / 2, locY - locBarH / 2 - 5);
      ctx.lineTo(locBarX + locBarW / 2, locY + locBarH / 2 + 5);
      ctx.stroke();

      // Animate localizer needle (slow drift)
      ilsTime += 0.008;
      ilsOffset = Math.sin(ilsTime * 0.9) * 0.35 + Math.sin(ilsTime * 0.3) * 0.08;
      const locNeedleX = locBarX + locBarW / 2 + ilsOffset * (locBarW / 2);

      // Needle
      const locColor = Math.abs(ilsOffset) > 0.5 ? '#ffaa00' : '#00ff50';
      ctx.fillStyle = locColor;
      ctx.shadowColor = locColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(locNeedleX, locY - locBarH / 2 - 4);
      ctx.lineTo(locNeedleX + 4, locY);
      ctx.lineTo(locNeedleX, locY + locBarH / 2 + 4);
      ctx.lineTo(locNeedleX - 4, locY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // DDM readout
      const locDDM = (ilsOffset * 0.155).toFixed(3);
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = Math.abs(ilsOffset) > 0.5 ? '#ffaa00' : 'rgba(0, 255, 80, 0.9)';
      ctx.textAlign = 'center';
      ctx.fillText((ilsOffset < 0 ? 'L ' : 'R ') + Math.abs(locDDM), ilsLeft + ilsW / 2, locY - locBarH / 2 - 8);

      // ── Glide Slope bar (vertical) — rendered as second row ───────────
      const gsY = ilsY + 22;
      const gsBarW = locBarW;
      const gsBarX = locBarX;
      const gsBarH = 6;

      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(0, 255, 80, 0.45)';
      ctx.textAlign = 'left';
      ctx.fillText('G/S', ilsLeft + 12, gsY + 4);
      ctx.textAlign = 'right';
      ctx.fillText('3.0°', ilsLeft + ilsW - 12, gsY + 4);

      // GS bar background
      ctx.fillStyle = 'rgba(0, 255, 80, 0.06)';
      roundRect(ctx, gsBarX, gsY - gsBarH / 2, gsBarW, gsBarH, 3);
      ctx.fill();

      // GS tick marks
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.3)';
      ctx.lineWidth = 0.75;
      [-2, -1, 0, 1, 2].forEach(tick => {
        const tx = gsBarX + gsBarW / 2 + tick * (gsBarW / 5);
        ctx.beginPath();
        ctx.moveTo(tx, gsY - gsBarH / 2 - 3);
        ctx.lineTo(tx, gsY + gsBarH / 2 + 3);
        ctx.stroke();
      });

      // Center marker
      ctx.strokeStyle = 'rgba(0, 255, 80, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gsBarX + gsBarW / 2, gsY - gsBarH / 2 - 5);
      ctx.lineTo(gsBarX + gsBarW / 2, gsY + gsBarH / 2 + 5);
      ctx.stroke();

      // Animate GS needle (different phase)
      gsTime += 0.006;
      gsOffset = Math.sin(gsTime * 0.7) * 0.28 + Math.sin(gsTime * 0.25) * 0.1;
      const gsNeedleX = gsBarX + gsBarW / 2 + gsOffset * (gsBarW / 2);

      const gsColor = Math.abs(gsOffset) > 0.5 ? '#ffaa00' : '#00ff50';
      ctx.fillStyle = gsColor;
      ctx.shadowColor = gsColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(gsNeedleX, gsY - gsBarH / 2 - 4);
      ctx.lineTo(gsNeedleX + 4, gsY);
      ctx.lineTo(gsNeedleX, gsY + gsBarH / 2 + 4);
      ctx.lineTo(gsNeedleX - 4, gsY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // GS vertical degrees readout
      const gsDeg = (3.0 + gsOffset * 0.8).toFixed(2);
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = Math.abs(gsOffset) > 0.5 ? '#ffaa00' : 'rgba(0, 255, 80, 0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(gsDeg + '°', gsBarX + gsBarW / 2, gsY - gsBarH / 2 - 8);

      // ── Status dots ───────────────────────────────────────────────────
      const dots = [
        { label: 'LOC', active: Math.abs(ilsOffset) < 0.3 },
        { label: 'GS',  active: Math.abs(gsOffset) < 0.3 },
        { label: 'APP', active: elapsed > 1.5 },
        { label: 'ALT', active: true },
      ];
      dots.forEach((dot, i) => {
        const dx = ilsLeft + 14 + i * 54;
        const dy = ilsY - ilsH / 2 + 30;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = dot.active ? '#00ff50' : 'rgba(0, 255, 80, 0.2)';
        if (dot.active) { ctx.shadowColor = '#00ff50'; ctx.shadowBlur = 6; }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '7px JetBrains Mono, monospace';
        ctx.fillStyle = dot.active ? 'rgba(0, 255, 80, 0.85)' : 'rgba(0, 255, 80, 0.25)';
        ctx.textAlign = 'left';
        ctx.fillText(dot.label, dx + 6, dy + 3);
      });

      // ── Sweep advance ─────────────────────────────────────────────────
      sweepAngle += SWEEP_SPEED;
      if (sweepAngle > Math.PI * 2 - Math.PI / 2) sweepAngle = -Math.PI / 2;

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Auto-dismiss after 3.2 seconds
  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setPhase('out');
    }, 3000);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3600);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0a1a0d 0%, #060d08 60%, #030608 100%)',
        opacity: phase === 'in' ? 1 : phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.6s ease-out' : 'opacity 0.4s ease-in',
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
      onClick={() => { setPhase('out'); setTimeout(() => onComplete?.(), 600); }}
    >
      {/* Canvas — fills most of screen */}
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0"
        style={{ display: 'block' }}
      />

      {/* Overlay text */}
      <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-none" style={{ marginTop: '-18vh' }}>
        <p className="text-[10px] font-mono font-bold tracking-[0.35em] text-green-400/70 uppercase">Aerodyne Fleet LLC</p>
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-widest text-green-400"
          style={{ textShadow: '0 0 24px #00ff50, 0 0 48px #00ff5055' }}
        >
          AERODYNE
        </h1>
        <p className="text-[11px] font-mono text-green-500/60 tracking-[0.25em] uppercase">Ops Platform · v2.0</p>
      </div>

      {/* Tap to continue hint */}
      <p
        className="absolute bottom-10 text-[10px] font-mono text-green-600/40 tracking-widest"
        style={{ animation: 'pulse 2s infinite' }}
      >
        TAP TO CONTINUE
      </p>
    </div>
  );
}

// Helper: rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}