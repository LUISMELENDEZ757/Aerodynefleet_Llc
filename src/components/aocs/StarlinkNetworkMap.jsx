import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Satellite, Wifi, WifiOff, Signal, ExternalLink, RefreshCw, Zap, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Department node definitions (static ground nodes) ────────────────────
const DEPARTMENTS = [
  { id: 'aocs',       label: 'AOCS',         sublabel: 'Control Center',    color: '#38bdf8', bg: '#0c4a6e', x: 50,  y: 50  },
  { id: 'dispatch',   label: 'Dispatch',      sublabel: 'Flight Release',    color: '#818cf8', bg: '#312e81', x: 15,  y: 22  },
  { id: 'ops',        label: 'OPS Center',    sublabel: 'Operations',        color: '#f472b6', bg: '#831843', x: 85,  y: 22  },
  { id: 'mcc',        label: 'MCC',           sublabel: 'Maint. Control',    color: '#fb923c', bg: '#7c2d12', x: 8,   y: 50  },
  { id: 'crew',       label: 'Crew Control',  sublabel: 'FAR 117',           color: '#a78bfa', bg: '#4c1d95', x: 92,  y: 50  },
  { id: 'fuel',       label: 'Fuel Ops',      sublabel: 'Fuel Management',   color: '#fbbf24', bg: '#78350f', x: 15,  y: 78  },
  { id: 'safety',     label: 'Safety & QA',   sublabel: 'ASAP / SMS',        color: '#34d399', bg: '#064e3b', x: 85,  y: 78  },
  { id: 'ground',     label: 'Ground Ops',    sublabel: 'Ramp / GSE',        color: '#94a3b8', bg: '#1e293b', x: 50,  y: 88  },
];

// Signal quality → color
function signalColor(q) {
  if (q == null) return '#475569';
  if (q >= 80) return '#22c55e';
  if (q >= 50) return '#f59e0b';
  return '#ef4444';
}

function signalLabel(q) {
  if (q == null) return 'NO DATA';
  if (q >= 80) return 'STRONG';
  if (q >= 50) return 'FAIR';
  return 'WEAK';
}

// ── Animated data packet along a path ────────────────────────────────────
function DataPacket({ x1, y1, x2, y2, color, delay = 0, duration = 2.5 }) {
  return (
    <circle r="2.5" fill={color} opacity="0.9">
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={`M${x1},${y1} L${x2},${y2}`}
      />
      <animate attributeName="opacity" values="0;1;1;0" dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
  );
}

// ── SVG canvas for the network map ────────────────────────────────────────
function NetworkCanvas({ aircraft, starlinkTerminals, selectedAc, onSelectAc }) {
  const W = 800, H = 520;

  // Place aircraft in a ring around center
  const acNodes = aircraft.slice(0, 12).map((ac, i) => {
    const total = Math.min(aircraft.length, 12);
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const r = 26; // % radius
    const cx = 50 + r * Math.cos(angle);
    const cy = 50 + r * Math.sin(angle);
    const terminal = starlinkTerminals.find(t => t.aircraft_tail === ac.tail_number);
    const signal = terminal?.signal_quality ?? null;
    const online = terminal?.activation_status === 'active';
    return { ...ac, cx, cy, terminal, signal, online };
  });

  // Satellite hub — center
  const HUB = { cx: 50, cy: 50 };

  // Convert % to SVG coords
  const px = v => (v / 100) * W;
  const py = v => (v / 100) * H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Deep space background */}
      <defs>
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0f1a2e" />
          <stop offset="100%" stopColor="#070c14" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="softglow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="url(#bgGrad)" rx="16" />

      {/* Star field */}
      {[...Array(60)].map((_, i) => (
        <circle
          key={i}
          cx={(((i * 137.5) % 100) / 100) * W}
          cy={(((i * 97.3) % 100) / 100) * H}
          r={i % 5 === 0 ? 1.2 : 0.7}
          fill="white"
          opacity={0.1 + (i % 4) * 0.07}
        />
      ))}

      {/* ── Hub glow ── */}
      <circle cx={px(50)} cy={py(50)} r={70} fill="url(#hubGlow)" />
      {/* Orbit rings */}
      <circle cx={px(50)} cy={py(50)} r={120} fill="none" stroke="#38bdf8" strokeWidth="0.4" strokeDasharray="4 6" opacity="0.25" />
      <circle cx={px(50)} cy={py(50)} r={200} fill="none" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="2 8" opacity="0.15" />

      {/* ── Ground dept → Hub lines ── */}
      {DEPARTMENTS.map(dep => {
        const x1 = px(dep.x), y1 = py(dep.y);
        const x2 = px(HUB.cx), y2 = py(HUB.cy);
        return (
          <g key={dep.id}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dep.color} strokeWidth="1" strokeDasharray="5 5" opacity="0.35" />
            {/* animated packets dept → hub */}
            <DataPacket x1={x1} y1={y1} x2={x2} y2={y2} color={dep.color} delay={DEPARTMENTS.indexOf(dep) * 0.4} duration={2.2} />
          </g>
        );
      })}

      {/* ── Hub → Aircraft lines ── */}
      {acNodes.map((ac, i) => {
        const x1 = px(HUB.cx), y1 = py(HUB.cy);
        const x2 = px(ac.cx), y2 = py(ac.cy);
        const col = signalColor(ac.signal);
        const isSelected = selectedAc === ac.tail_number;
        return (
          <g key={ac.id}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={col}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={ac.online ? 'none' : '3 5'}
              opacity={ac.online ? 0.6 : 0.25}
            />
            {ac.online && (
              <>
                <DataPacket x1={x1} y1={y1} x2={x2} y2={y2} color={col} delay={i * 0.3} duration={2.8} />
                <DataPacket x1={x2} y1={y2} x2={x1} y2={y1} color={col} delay={i * 0.3 + 1.4} duration={2.8} />
              </>
            )}
          </g>
        );
      })}

      {/* ── Department nodes ── */}
      {DEPARTMENTS.map(dep => (
        <g key={dep.id} transform={`translate(${px(dep.x)},${py(dep.y)})`}>
          <circle r="22" fill={dep.bg} stroke={dep.color} strokeWidth="1.5" opacity="0.95" filter="url(#glow)" />
          <text y="-6" textAnchor="middle" fontSize="7.5" fontWeight="900" fill={dep.color} letterSpacing="1">{dep.label}</text>
          <text y="4" textAnchor="middle" fontSize="5.5" fill="#94a3b8">{dep.sublabel}</text>
          {/* blinking status dot */}
          <circle cx="14" cy="-14" r="4" fill={dep.color}>
            <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* ── STARLINK HUB (center) ── */}
      <g transform={`translate(${px(50)},${py(50)})`} filter="url(#softglow)">
        <circle r="30" fill="#0c2d4a" stroke="#38bdf8" strokeWidth="2.5" />
        {/* satellite dish symbol */}
        <text y="-2" textAnchor="middle" fontSize="14" fill="#38bdf8">⊕</text>
        <text y="10" textAnchor="middle" fontSize="6" fontWeight="900" fill="#38bdf8" letterSpacing="2">STARLINK</text>
        <text y="18" textAnchor="middle" fontSize="5" fill="#7dd3fc">AVIATION HUB</text>
        {/* rotating ring */}
        <circle r="34" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="8 4" opacity="0.5">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* ── Aircraft nodes ── */}
      {acNodes.map(ac => {
        const x = px(ac.cx), y = py(ac.cy);
        const col = signalColor(ac.signal);
        const isSelected = selectedAc === ac.tail_number;
        return (
          <g key={ac.id} style={{ cursor: 'pointer' }} onClick={() => onSelectAc(ac.tail_number === selectedAc ? null : ac.tail_number)}>
            <circle
              cx={x} cy={y} r={isSelected ? 20 : 16}
              fill={isSelected ? '#1e3a5f' : '#111827'}
              stroke={isSelected ? '#38bdf8' : col}
              strokeWidth={isSelected ? 2.5 : 1.5}
              filter={isSelected ? 'url(#glow)' : undefined}
              opacity="0.97"
            />
            {/* plane icon text */}
            <text x={x} y={y - 2} textAnchor="middle" fontSize="9" fill={col}>✈</text>
            <text x={x} y={y + 9} textAnchor="middle" fontSize="5.5" fontWeight="900" fill="white">{ac.tail_number}</text>
            {/* signal pulse */}
            {ac.online && (
              <circle cx={x + 12} cy={y - 12} r="4" fill={col}>
                <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
            {!ac.online && (
              <text x={x + 10} y={y - 10} fontSize="8" fill="#ef4444">✕</text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(12, ${H - 54})`}>
        {[
          { col: '#22c55e', label: 'Strong (≥80%)' },
          { col: '#f59e0b', label: 'Fair (50–79%)' },
          { col: '#ef4444', label: 'Weak (<50%)' },
          { col: '#475569', label: 'No Data' },
        ].map(({ col, label }, i) => (
          <g key={label} transform={`translate(0, ${i * 12})`}>
            <circle cx="5" cy="5" r="4" fill={col} />
            <text x="13" y="9" fontSize="7" fill="#94a3b8">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── Selected aircraft detail panel ────────────────────────────────────────
function AircraftDetailPanel({ ac, terminal }) {
  if (!ac) return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 gap-2">
      <Satellite className="w-10 h-10 text-sky-500/40" />
      <p className="text-gray-500 text-sm font-bold">Tap an aircraft on the map</p>
      <p className="text-gray-600 text-xs">to view Starlink connectivity details</p>
    </div>
  );

  const sq = terminal?.signal_quality ?? null;
  const col = signalColor(sq);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-xl">✈</div>
        <div>
          <p className="text-lg font-extrabold text-white font-mono">{ac.tail_number}</p>
          <p className="text-xs text-gray-400">{ac.aircraft_type} · {ac.base_station || '—'}</p>
        </div>
        <span className={cn('ml-auto text-[10px] font-extrabold px-2.5 py-1 rounded-full',
          ac.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        )}>{ac.status?.toUpperCase()}</span>
      </div>

      {terminal ? (
        <>
          {/* Signal bar */}
          <div className="bg-[#0d1117] rounded-xl p-3 space-y-2 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signal Quality</span>
              <span className="font-extrabold text-sm" style={{ color: col }}>{sq != null ? `${sq}%` : '—'} · {signalLabel(sq)}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sq ?? 0}%`, background: col }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Status',      value: terminal.activation_status?.toUpperCase(), color: terminal.activation_status === 'active' ? 'text-green-400' : 'text-red-400' },
              { label: 'Service',     value: terminal.service_plan?.replace('_', ' ').toUpperCase(), color: 'text-sky-400' },
              { label: 'Download',    value: terminal.download_mbps ? `${terminal.download_mbps} Mbps` : '—', color: 'text-cyan-400' },
              { label: 'Upload',      value: terminal.upload_mbps ? `${terminal.upload_mbps} Mbps` : '—', color: 'text-blue-400' },
              { label: 'Latency',     value: terminal.latency_ms ? `${terminal.latency_ms} ms` : '—', color: terminal.latency_ms > 100 ? 'text-amber-400' : 'text-green-400' },
              { label: 'Uptime',      value: terminal.uptime_percent ? `${terminal.uptime_percent}%` : '—', color: 'text-teal-400' },
              { label: 'Satellites',  value: terminal.satellites_visible ?? '—', color: 'text-violet-400' },
              { label: 'Obstruction', value: terminal.obstruction_percent != null ? `${terminal.obstruction_percent}%` : '—', color: 'text-gray-400' },
              { label: 'Firmware',    value: terminal.firmware_version || '—', color: 'text-gray-400' },
              { label: 'IP Address',  value: terminal.ip_address || '—', color: 'text-gray-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#0d1117] border border-white/5 rounded-xl px-3 py-2">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</p>
                <p className={cn('font-extrabold mt-0.5 font-mono text-xs truncate', color)}>{value}</p>
              </div>
            ))}
          </div>

          {terminal.last_seen && (
            <p className="text-[10px] text-gray-600 text-center">Last telemetry: {new Date(terminal.last_seen).toLocaleString()}</p>
          )}
        </>
      ) : (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center">
          <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-400">No Starlink Terminal</p>
          <p className="text-xs text-gray-500 mt-1">No terminal registered for this aircraft</p>
          <Link to="/Starlink" className="flex items-center justify-center gap-1.5 mt-3 text-xs font-bold text-sky-400 hover:text-sky-300">
            Starlink Dashboard <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Fleet signal summary bar ──────────────────────────────────────────────
function FleetSignalSummary({ aircraft, starlinkTerminals }) {
  const linked = starlinkTerminals.filter(t => t.activation_status === 'active').length;
  const strong  = starlinkTerminals.filter(t => (t.signal_quality ?? 0) >= 80).length;
  const fair    = starlinkTerminals.filter(t => { const q = t.signal_quality ?? 0; return q >= 50 && q < 80; }).length;
  const weak    = starlinkTerminals.filter(t => (t.signal_quality ?? 0) < 50).length;
  const noData  = aircraft.length - starlinkTerminals.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-4 py-3 border-b border-white/10 bg-[#0a0e18]">
      {[
        { label: 'Aircraft',       value: aircraft.length,         color: 'text-sky-400' },
        { label: 'SL Connected',   value: linked,                  color: 'text-green-400' },
        { label: 'Strong Signal',  value: strong,                  color: 'text-green-400' },
        { label: 'Fair Signal',    value: fair,                    color: 'text-amber-400' },
        { label: 'Weak / Offline', value: weak + noData,           color: weak + noData > 0 ? 'text-red-400' : 'text-gray-500' },
      ].map(({ label, value, color }) => (
        <div key={label} className="text-center">
          <p className={cn('text-xl font-extrabold', color)}>{value}</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────
export default function StarlinkNetworkMap() {
  const [selectedAc, setSelectedAc] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: aircraft = [], refetch: refetchAc } = useQuery({
    queryKey: ['slnet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
    refetchInterval: 30000,
  });

  const { data: starlinkTerminals = [], refetch: refetchSl } = useQuery({
    queryKey: ['slnet-terminals'],
    queryFn: () => base44.entities.StarlinkTerminal.list(),
    refetchInterval: 20000,
  });

  const handleRefresh = () => {
    refetchAc(); refetchSl();
    setLastRefresh(new Date());
  };

  const selectedAcData = aircraft.find(a => a.tail_number === selectedAc);
  const selectedTerminal = starlinkTerminals.find(t => t.aircraft_tail === selectedAc);

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#070c14] text-white">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0e18]">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-sky-400" />
          <p className="text-sm font-extrabold text-sky-400 tracking-widest uppercase">Starlink Network · Live Topology</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 font-mono">
            Updated: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}Z
          </span>
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400 text-xs font-bold hover:bg-sky-600/40 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link to="/Starlink" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 transition-colors">
            Starlink Dash <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Fleet signal summary */}
      <FleetSignalSummary aircraft={aircraft} starlinkTerminals={starlinkTerminals} />

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Network map */}
        <div className="flex-1 p-3 overflow-hidden flex items-center justify-center">
          {aircraft.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <Satellite className="w-16 h-16 text-sky-500/30" />
              <p className="text-gray-500 font-bold">No aircraft registered</p>
              <p className="text-gray-600 text-xs">Add aircraft to see the network topology</p>
            </div>
          ) : (
            <NetworkCanvas
              aircraft={aircraft}
              starlinkTerminals={starlinkTerminals}
              selectedAc={selectedAc}
              onSelectAc={setSelectedAc}
            />
          )}
        </div>

        {/* Detail panel */}
        <div className="w-72 border-l border-white/10 bg-[#0a0e18] overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Signal className="w-3 h-3" /> Terminal Details
            </p>
          </div>
          <AircraftDetailPanel ac={selectedAcData} terminal={selectedTerminal} />
        </div>
      </div>

      {/* Bottom fleet strip */}
      <div className="border-t border-white/10 bg-[#0a0e18] px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {aircraft.map(ac => {
            const t = starlinkTerminals.find(t => t.aircraft_tail === ac.tail_number);
            const sq = t?.signal_quality ?? null;
            const col = signalColor(sq);
            const isSelected = selectedAc === ac.tail_number;
            return (
              <button
                key={ac.id}
                onClick={() => setSelectedAc(ac.tail_number === selectedAc ? null : ac.tail_number)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold flex-shrink-0 transition-all',
                  isSelected
                    ? 'bg-sky-600/30 border-sky-500 text-sky-300'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                )}
              >
                <span className="text-sm">✈</span>
                <div className="text-left">
                  <p className="font-extrabold leading-none font-mono">{ac.tail_number}</p>
                  <p className="text-[9px] leading-none mt-0.5" style={{ color: col }}>
                    {sq != null ? `${sq}% · ${signalLabel(sq)}` : 'NO STARLINK'}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }}>
                  {t?.activation_status === 'active' && (
                    <div className="w-2 h-2 rounded-full animate-ping" style={{ background: col, opacity: 0.4 }} />
                  )}
                </div>
              </button>
            );
          })}
          {aircraft.length === 0 && (
            <p className="text-gray-600 text-xs py-1 px-2">No aircraft</p>
          )}
        </div>
      </div>
    </div>
  );
}