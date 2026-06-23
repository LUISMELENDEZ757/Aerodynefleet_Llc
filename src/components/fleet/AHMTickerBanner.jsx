import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MONO = "'JetBrains Mono', monospace";

const SEV_COLOR = {
  warning:  { bg: 'rgba(240,50,82,0.18)',  border: 'rgba(240,50,82,0.5)',  text: '#F03252', label: 'WARNING' },
  caution:  { bg: 'rgba(245,166,35,0.15)', border: 'rgba(245,166,35,0.5)', text: '#F5A623', label: 'CAUTION' },
  advisory: { bg: 'rgba(61,142,240,0.15)', border: 'rgba(61,142,240,0.4)', text: '#3D8EF0', label: 'ADVISORY' },
  memo:     { bg: 'rgba(122,150,188,0.1)',  border: 'rgba(122,150,188,0.3)', text: '#7A96BC', label: 'MEMO' },
};

// Static fallback faults shown when no DB data exists yet
const FALLBACK_FAULTS = [
  { id: 'f1', aircraft_tail: 'N455GJ', ata_chapter: '72', fault_code: 'ENG-7201', severity: 'warning',  description: 'ENG 1 oil pressure low — check oil servicing' },
  { id: 'f2', aircraft_tail: 'N892UA', ata_chapter: '29', fault_code: 'HYD-2901', severity: 'caution',  description: 'HYD system B pressure fluctuation detected' },
  { id: 'f3', aircraft_tail: 'N123AA', ata_chapter: '24', fault_code: 'ELEC-2408', severity: 'warning', description: 'IDG 2 oil temp high — exceedance recorded' },
  { id: 'f4', aircraft_tail: 'N455GJ', ata_chapter: '34', fault_code: 'NAV-3401', severity: 'advisory', description: 'IRS 1 alignment degraded — cross-check position' },
  { id: 'f5', aircraft_tail: 'N892UA', ata_chapter: '21', fault_code: 'PNEU-2101', severity: 'caution',  description: 'Pack 1 temp out of range — monitor bleed air' },
];

function TickerItem({ fault }) {
  const sev = SEV_COLOR[fault.severity] || SEV_COLOR.advisory;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 0, flexShrink: 0, marginRight: 40, whiteSpace: 'nowrap' }}>
      {/* AHM pill */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: '4px 0 0 4px', background: 'rgba(245,166,35,0.18)', border: '1px solid rgba(245,166,35,0.35)', borderRight: 'none', fontFamily: MONO, fontSize: 9, fontWeight: 800, color: '#F5A623', letterSpacing: '0.1em' }}>
        ✈ AHM
      </span>
      {/* Tail */}
      <span style={{ padding: '2px 10px', background: '#131929', border: '1px solid #1E2A42', borderRight: 'none', fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#EEF3FF', letterSpacing: '0.06em' }}>
        {fault.aircraft_tail}
      </span>
      {/* ATA */}
      <span style={{ padding: '2px 8px', background: '#0F1422', border: '1px solid #1E2A42', borderRight: 'none', fontFamily: MONO, fontSize: 9, color: '#7A96BC', letterSpacing: '0.06em' }}>
        ATA {fault.ata_chapter || '—'}
      </span>
      {/* Fault code + severity */}
      <span style={{ padding: '2px 8px', background: sev.bg, border: `1px solid ${sev.border}`, borderRight: 'none', fontFamily: MONO, fontSize: 9, fontWeight: 700, color: sev.text, letterSpacing: '0.08em' }}>
        {fault.fault_code} {sev.label}
      </span>
      {/* Description */}
      <span style={{ padding: '2px 12px 2px 10px', background: '#0F1422', border: '1px solid #1E2A42', borderRadius: '0 4px 4px 0', fontFamily: MONO, fontSize: 10, color: '#B0C4DE', letterSpacing: '0.02em' }}>
        {fault.description}
      </span>
      {/* Separator */}
      <span style={{ marginLeft: 20, color: '#1E2A42', fontSize: 14, fontWeight: 300 }}>│</span>
    </span>
  );
}

export default function AHMTickerBanner() {
  const trackRef = useRef(null);
  const animRef  = useRef(null);
  const posRef   = useRef(0);
  const [paused, setPaused] = useState(false);

  const { data: faults = [] } = useQuery({
    queryKey: ['ahm-faults-ticker'],
    queryFn: () => base44.entities.FaultMessage.filter({ status: 'active' }, '-created_date', 50),
    refetchInterval: 30000,
  });

  const items = faults.length > 0 ? faults : FALLBACK_FAULTS;
  // Duplicate for seamless loop
  const loopItems = [...items, ...items];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let lastTs = null;
    const speed = 60; // px/sec

    const step = (ts) => {
      if (!paused) {
        if (lastTs !== null) {
          const delta = (ts - lastTs) / 1000;
          posRef.current -= speed * delta;
          // Reset when first half scrolled
          const halfW = track.scrollWidth / 2;
          if (Math.abs(posRef.current) >= halfW) {
            posRef.current = 0;
          }
          track.style.transform = `translateX(${posRef.current}px)`;
        }
        lastTs = ts;
      } else {
        lastTs = null;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [paused, items.length]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        height: 34,
        background: '#060A14',
        borderBottom: '1px solid #1E2A42',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Left label badge */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px 0 12px',
        height: '100%',
        background: '#0F1422',
        borderRight: '1px solid #1E2A42',
        zIndex: 2,
      }}>
        {/* Pulsing live dot */}
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F03252', animation: 'ahmblink 1s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, color: '#EEF3FF', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
          AHM FLEET MONITORING
        </span>
        <span style={{ fontFamily: MONO, fontSize: 8, color: '#3D4F6E', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
          BOEING · AIRBUS · LIVE
        </span>
        <style>{`@keyframes ahmblink { 0%,100%{opacity:1} 50%{opacity:.2} }`}</style>
      </div>

      {/* Scrolling track */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        {/* Fade edges */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to right, #060A14, transparent)', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, #060A14, transparent)', zIndex: 1, pointerEvents: 'none' }} />

        <div
          ref={trackRef}
          style={{ display: 'inline-flex', alignItems: 'center', willChange: 'transform', whiteSpace: 'nowrap' }}
        >
          {loopItems.map((f, i) => (
            <TickerItem key={`${f.id}-${i}`} fault={f} />
          ))}
        </div>
      </div>

      {/* Pause indicator */}
      {paused && (
        <div style={{ position: 'absolute', right: 48, top: '50%', transform: 'translateY(-50%)', fontFamily: MONO, fontSize: 8, color: '#3D4F6E', letterSpacing: '0.1em', pointerEvents: 'none' }}>
          PAUSED
        </div>
      )}

      {/* Live count badge */}
      <div style={{
        flexShrink: 0,
        padding: '0 12px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        borderLeft: '1px solid #1E2A42',
        background: '#0F1422',
      }}>
        <span style={{ fontFamily: MONO, fontSize: 8, color: '#3D4F6E', letterSpacing: '0.08em' }}>
          <span style={{ color: faults.length > 0 ? '#F03252' : '#3D4F6E', fontWeight: 700 }}>{items.length}</span> FAULTS
        </span>
      </div>
    </div>
  );
}