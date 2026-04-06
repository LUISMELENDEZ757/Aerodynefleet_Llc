import React from "react";

const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-baseline justify-between">
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
      {title}
    </h2>
    {subtitle && (
      <span className="text-[11px] text-slate-500">
        {subtitle}
      </span>
    )}
  </div>
);

const Pill = ({ label, tone = "default" }) => {
  const toneClasses = {
    default: "bg-slate-800 text-slate-200",
    good: "bg-emerald-900/60 text-emerald-100",
    warn: "bg-amber-900/60 text-amber-100",
    bad: "bg-rose-900/60 text-rose-100",
    info: "bg-sky-900/60 text-sky-100",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${toneClasses}`}
    >
      {label}
    </span>
  );
};

export default function SituationalAwarenessMap({ flights }) {
  // SVG map dimensions
  const mapWidth = 400;
  const mapHeight = 300;

  // Normalize coordinates to SVG space (simplified projection)
  const normalizeCoord = (lat, lon) => {
    const x = ((lon + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    return { x, y };
  };

  // Flight positions (simplified for demo)
  const flightPositions = [
    { flight: "ADY 102", lat: 52, lon: -20, alt: "FL350", status: "ENROUTE" },
    { flight: "ADY 204", lat: 45, lon: -40, alt: "FL310", status: "CLIMBING" },
    { flight: "ADY 306", lat: 40, lon: -85, alt: "FL280", status: "ENROUTE" },
  ];

  // SIGMET areas (simplified polygon points)
  const sigmets = [
    { id: "S1", points: [[48, -15], [50, -10], [52, -12], [50, -18]], label: "SIGMET CDG", severity: "warn" },
    { id: "S2", points: [[47, -55], [50, -50], [48, -45], [45, -50]], label: "SIGMET ATL", severity: "bad" },
  ];

  // Turbulence areas
  const turbulence = [
    { lat: 43, lon: -70, radius: 80, label: "CAT" },
    { lat: 51, lon: -35, radius: 100, label: "TURB" },
  ];

  // ETOPS alternates with diversion circles
  const etopsAlternates = [
    { code: "DUB", lat: 53.4, lon: -6.2, radiusNm: 330 },
    { code: "SNN", lat: 52.7, lon: -8.9, radiusNm: 330 },
    { code: "BRU", lat: 50.9, lon: 4.5, radiusNm: 240 },
  ];

  // Convert nautical miles to SVG pixels (rough approximation)
  const nmToPixels = (nm) => (nm / 5000) * mapWidth;

  return (
    <div className="lg:col-span-3 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <SectionHeader
        title="Situational Awareness Map"
        subtitle="Atlantic traffic & weather overlay"
      />

      {/* Map container */}
      <div className="relative rounded-xl border border-slate-700 bg-slate-950 overflow-hidden">
        <svg
          width={mapWidth}
          height={mapHeight}
          className="w-full border-b border-slate-700"
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        >
          {/* Background */}
          <defs>
            <pattern
              id="gridPattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={mapWidth} height={mapHeight} fill="url(#gridPattern)" />

          {/* Lat/lon reference lines */}
          <line x1="0" y1={mapHeight / 2} x2={mapWidth} y2={mapHeight / 2} stroke="#475569" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={mapWidth / 2} y1="0" x2={mapWidth / 2} y2={mapHeight} stroke="#475569" strokeWidth="0.5" strokeDasharray="3" />

          {/* ETOPS alternates with diversion circles */}
          {etopsAlternates.map((alt) => {
            const { x, y } = normalizeCoord(alt.lat, alt.lon);
            const radiusPx = nmToPixels(alt.radiusNm);
            return (
              <g key={alt.code}>
                {/* Diversion circle */}
                <circle cx={x} cy={y} r={radiusPx} fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2" opacity="0.6" />
                {/* Alternate airport */}
                <circle cx={x} cy={y} r="3" fill="#10b981" />
                <text x={x + 6} y={y - 2} fontSize="10" fill="#10b981" fontWeight="bold">
                  {alt.code}
                </text>
              </g>
            );
          })}

          {/* SIGMET areas */}
          {sigmets.map((sigmet) => {
            const polygonPoints = sigmet.points
              .map((point) => {
                const { x, y } = normalizeCoord(point[0], point[1]);
                return `${x},${y}`;
              })
              .join(" ");

            const fillColor = sigmet.severity === "bad" ? "rgba(244, 63, 94, 0.2)" : "rgba(251, 146, 60, 0.2)";
            const strokeColor = sigmet.severity === "bad" ? "#f43f5e" : "#fb923c";

            return (
              <g key={sigmet.id}>
                <polygon points={polygonPoints} fill={fillColor} stroke={strokeColor} strokeWidth="1" />
                <text
                  x={sigmet.points[0][1]}
                  y={sigmet.points[0][0]}
                  fontSize="9"
                  fill={strokeColor}
                  fontWeight="bold"
                >
                  {sigmet.label}
                </text>
              </g>
            );
          })}

          {/* Turbulence areas */}
          {turbulence.map((turb, idx) => {
            const { x, y } = normalizeCoord(turb.lat, turb.lon);
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r={turb.radius / 100} fill="rgba(139, 92, 246, 0.15)" stroke="#a78bfa" strokeWidth="0.5" strokeDasharray="1.5" />
                <text x={x - 8} y={y} fontSize="9" fill="#a78bfa" fontWeight="bold">
                  {turb.label}
                </text>
              </g>
            );
          })}

          {/* Flight positions and paths */}
          {flightPositions.map((f, idx) => {
            const { x, y } = normalizeCoord(f.lat, f.lon);
            const nextF = flightPositions[(idx + 1) % flightPositions.length];
            const { x: nextX, y: nextY } = normalizeCoord(nextF.lat, nextF.lon);

            return (
              <g key={f.flight}>
                {/* Flight path line */}
                <line x1={x} y1={y} x2={nextX} y2={nextY} stroke="#64748b" strokeWidth="1" strokeDasharray="3" opacity="0.5" />
                {/* Flight position */}
                <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                {/* Flight label */}
                <text x={x + 8} y={y - 4} fontSize="10" fill="#3b82f6" fontWeight="bold">
                  {f.flight}
                </text>
                <text x={x + 8} y={y + 6} fontSize="8" fill="#94a3b8">
                  {f.alt}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-300">Active Flights</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300">ETOPS Alternates</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <circle cx="6" cy="6" r="4" fill="none" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="1" />
          </svg>
          <span className="text-slate-300">Diversion Circles</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500/30 border border-orange-500" />
          <span className="text-slate-300">SIGMETs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500/20 border border-purple-400" />
          <span className="text-slate-300">Turbulence</span>
        </div>
      </div>

      {/* Active threats */}
      <div className="border-t border-slate-700 pt-2">
        <p className="text-[10px] uppercase text-slate-500 mb-1.5">Active Constraints</p>
        <div className="flex flex-wrap gap-1">
          <Pill label="SIGMET ATL" tone="bad" />
          <Pill label="TURB 51N/35W" tone="warn" />
          <Pill label="SIGMET CDG" tone="warn" />
        </div>
      </div>
    </div>
  );
}