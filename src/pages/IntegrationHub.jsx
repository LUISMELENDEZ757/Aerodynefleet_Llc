import { useState } from 'react';
import {
  Plug, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle,
  ArrowRight, ArrowDown, Database, Zap, FileCode, Globe, Server,
  Layers, Activity, ChevronRight, Radio, Settings, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── SYSTEM DATA ───────────────────────────────────────────────────────────

const EXTERNAL_SYSTEMS = [
  {
    category: 'M&E / MRO',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    systems: [
      { id: 'trax',   name: 'TRAX',      type: 'REST/JSON',  status: 'active',      latency: '42ms',  events: 1240 },
      { id: 'amos',   name: 'AMOS',       type: 'SOAP/XML',   status: 'active',      latency: '88ms',  events: 870  },
      { id: 'ramco',  name: 'Ramco',      type: 'REST/JSON',  status: 'degraded',    latency: '320ms', events: 104  },
      { id: 'rusada', name: 'Rusada',     type: 'REST/JSON',  status: 'inactive',    latency: '—',     events: 0    },
    ]
  },
  {
    category: 'Flight Ops',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    systems: [
      { id: 'lido',     name: 'LIDO',       type: 'REST/JSON',  status: 'active',   latency: '61ms',  events: 543  },
      { id: 'sabre',    name: 'Sabre',      type: 'REST/XML',   status: 'active',   latency: '95ms',  events: 2100 },
      { id: 'navblue',  name: 'NavBlue',    type: 'REST/JSON',  status: 'inactive', latency: '—',     events: 0    },
    ]
  },
  {
    category: 'Tracking & ADS-B',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    systems: [
      { id: 'aeroapi',  name: 'AeroAPI',    type: 'REST/JSON',  status: 'active',   latency: '55ms',  events: 9800 },
      { id: 'adsb',     name: 'ADS-B Exch', type: 'WebSocket',  status: 'active',   latency: '12ms',  events: 45200},
      { id: 'opensky',  name: 'OpenSky',    type: 'REST/JSON',  status: 'active',   latency: '110ms', events: 3400 },
    ]
  },
  {
    category: 'PSS / DCS / Crew',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    systems: [
      { id: 'altea',    name: 'Altéa (Amadeus)', type: 'SOAP/XML',  status: 'active',   latency: '74ms',  events: 1890 },
      { id: 'aims',     name: 'AIMS Crew',        type: 'REST/JSON', status: 'degraded', latency: '280ms', events: 210  },
      { id: 'internal', name: 'Internal AOCS API',type: 'REST/JSON', status: 'active',   latency: '18ms',  events: 6700 },
    ]
  },
];

const INGESTION_ROUTES = [
  { id: 'api',  label: 'API / Webhook', icon: Globe,    desc: '/v1/events, /v1/events/batch', protocols: ['REST', 'SOAP', 'XML', 'JSON'] },
  { id: 'sftp', label: 'SFTP / Files',  icon: FileCode, desc: 'CSV, XML, JSON file drops',    protocols: ['CSV', 'XML', 'JSON'] },
];

const CORE_ENTITIES = [
  'Aircraft', 'Flights', 'MEL / Deferrals', 'Work Orders',
  'Crew', 'Weather / NOTAM', 'Performance Snapshots',
  'Turn / Gate / Milestones', 'Audit Logs',
];

const CONSUMERS = [
  { label: 'TechOps / Mx',    desc: 'Logbook, Mx Supervisor',  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { label: 'Flight Ops / EFB', desc: 'Timeline, EFB modules',  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
  { label: 'OpsCenter / Crew', desc: 'Turn tracking, Status',  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30'  },
];

const RECENT_EVENTS = [
  { ts: '14:32:01Z', system: 'AeroAPI',   topic: 'flight.position',     status: 'ok',    payload: '{ "flight": "AAL4474", "lat": 40.63, "lon": -73.78 }' },
  { ts: '14:31:58Z', system: 'TRAX',      topic: 'mel.update',          status: 'ok',    payload: '{ "tail": "N455GJ", "mel_item": "29-11-1", "status": "deferred" }' },
  { ts: '14:31:44Z', system: 'Sabre',     topic: 'flight.schedule',     status: 'ok',    payload: '{ "flight": "DAL882", "origin": "KATL", "dep": "16:20Z" }' },
  { ts: '14:31:39Z', system: 'AIMS Crew', topic: 'crew.assignment',     status: 'error', payload: 'Connection timeout — retrying (attempt 3/5)' },
  { ts: '14:31:22Z', system: 'ADS-B',     topic: 'aircraft.position',   status: 'ok',    payload: '{ "icao": "A4C2F1", "alt": 35000, "spd": 480 }' },
  { ts: '14:31:05Z', system: 'AMOS',      topic: 'workorder.closed',    status: 'ok',    payload: '{ "wo": "WO-2026-0821", "tail": "N281AE", "ata": "72" }' },
  { ts: '14:30:51Z', system: 'Ramco',     topic: 'inventory.update',    status: 'warn',  payload: 'High latency (320ms) — threshold 200ms' },
  { ts: '14:30:33Z', system: 'Internal',  topic: 'flight.status',       status: 'ok',    payload: '{ "flight": "AEX101", "status": "airborne", "dep_actual": "14:28Z" }' },
];

const STATUS_CFG = {
  active:   { label: 'Active',   color: 'text-green-400',  bg: 'bg-green-500/10',  dot: 'bg-green-400'  },
  degraded: { label: 'Degraded', color: 'text-amber-400',  bg: 'bg-amber-500/10',  dot: 'bg-amber-400'  },
  inactive: { label: 'Inactive', color: 'text-gray-500',   bg: 'bg-gray-500/10',   dot: 'bg-gray-500'   },
  error:    { label: 'Error',    color: 'text-red-400',    bg: 'bg-red-500/10',    dot: 'bg-red-400'    },
};

const EVENT_CFG = {
  ok:    { icon: CheckCircle, color: 'text-green-400' },
  warn:  { icon: AlertTriangle, color: 'text-amber-400' },
  error: { icon: XCircle, color: 'text-red-400' },
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.inactive;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full',
      cfg.bg, cfg.color
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot, status === 'active' && 'animate-pulse')} />
      {cfg.label}
    </span>
  );
}

function SystemCard({ sys, onClick }) {
  return (
    <button
      onClick={() => onClick(sys)}
      className="w-full flex items-center justify-between bg-background/40 hover:bg-secondary/50 border border-border/60 rounded-lg px-3 py-2.5 transition-all text-left group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <StatusDot status={sys.status} />
        <span className="text-xs font-bold text-foreground truncate">{sys.name}</span>
        <span className="text-[10px] text-muted-foreground hidden sm:block">{sys.type}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground">{sys.latency}</span>
        <span className="text-[10px] font-mono text-primary">{sys.events.toLocaleString()} ev</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </button>
  );
}

function ArchFlow() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <p className="text-xs font-extrabold uppercase tracking-wider text-foreground">Integration Architecture</p>
      </div>
      <div className="p-4 flex flex-col items-center gap-2 text-xs">

        {/* External systems */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          {[
            { label: 'M&E Systems', sub: 'TRAX · AMOS · Ramco', color: 'border-orange-500/40 bg-orange-500/5 text-orange-400' },
            { label: 'Flight Ops',  sub: 'LIDO · Sabre · NavBlue', color: 'border-blue-500/40 bg-blue-500/5 text-blue-400' },
            { label: 'ADS-B / Tracking', sub: 'AeroAPI · OpenSky', color: 'border-cyan-500/40 bg-cyan-500/5 text-cyan-400' },
            { label: 'PSS / Crew',  sub: 'Amadeus · AIMS · AOCS', color: 'border-purple-500/40 bg-purple-500/5 text-purple-400' },
          ].map(({ label, sub, color }) => (
            <div key={label} className={cn('rounded-lg border px-3 py-2 text-center', color)}>
              <p className="font-extrabold leading-tight">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <ArrowDown className="w-4 h-4 text-muted-foreground" />

        {/* Ingestion routes */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {INGESTION_ROUTES.map(r => {
            const Icon = r.icon;
            return (
              <div key={r.id} className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-center">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="font-bold">{r.label}</p>
                <p className="text-[10px] text-muted-foreground">{r.desc}</p>
              </div>
            );
          })}
        </div>

        <ArrowDown className="w-4 h-4 text-muted-foreground" />

        {/* Gateway + Normalization */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {[
            { label: 'Ingestion Gateway', sub: '/v1/events · /v1/events/batch', icon: Server },
            { label: 'Normalization Engine', sub: 'Vendor payload → Aerodyne schema', icon: Zap },
          ].map(({ label, sub, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="font-bold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        <ArrowDown className="w-4 h-4 text-muted-foreground" />

        {/* Event Bus */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-center w-full max-w-md">
          <Radio className="w-4 h-4 text-accent mx-auto mb-1" />
          <p className="font-bold text-foreground">Internal Event Bus</p>
          <p className="text-[10px] text-muted-foreground font-mono">aircraft.* · flight.* · mel.* · crew.* · wx.*</p>
        </div>

        <ArrowDown className="w-4 h-4 text-muted-foreground" />

        {/* Core Data */}
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 w-full max-w-md">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Database className="w-4 h-4 text-green-400" />
            <p className="font-bold text-foreground">Core Data Layer</p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {CORE_ENTITIES.map(e => (
              <span key={e} className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">{e}</span>
            ))}
          </div>
        </div>

        <ArrowDown className="w-4 h-4 text-muted-foreground" />

        {/* Consumers */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {CONSUMERS.map(({ label, desc, color, bg, border }) => (
            <div key={label} className={cn('rounded-lg border px-3 py-2 text-center', bg, border)}>
              <p className={cn('font-extrabold text-[11px]', color)}>{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SystemDetailModal({ sys, onClose }) {
  const cfg = STATUS_CFG[sys.status] || STATUS_CFG.inactive;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-extrabold text-foreground">{sys.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sys.type} integration</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status={sys.status} />
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 text-muted-foreground">✕</button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Latency', value: sys.latency, color: sys.latency === '—' ? 'text-muted-foreground' : parseInt(sys.latency) > 200 ? 'text-amber-400' : 'text-green-400' },
              { label: 'Events (24h)', value: sys.events.toLocaleString(), color: 'text-primary' },
              { label: 'Protocol', value: sys.type, color: 'text-foreground' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-lg px-3 py-2.5 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-sm font-extrabold font-mono mt-0.5', color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-secondary/30 border border-border px-4 py-3 space-y-1.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Configuration</p>
            {[
              { k: 'Endpoint', v: `https://api.aerodyne.internal/v1/ingest/${sys.id}` },
              { k: 'Auth',     v: 'Bearer Token (rotates every 24h)' },
              { k: 'Timeout', v: '30s' },
              { k: 'Retry',   v: '3x with exponential backoff' },
              { k: 'Batch',   v: '/v1/events/batch (max 500 records)' },
            ].map(({ k, v }) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-muted-foreground w-20 flex-shrink-0">{k}</span>
                <span className="font-mono text-foreground break-all">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Test Connection
            </button>
            <button className="flex-1 py-2 rounded-lg bg-secondary border border-border text-sm font-bold text-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function IntegrationHub() {
  const [activeTab, setActiveTab] = useState('systems');
  const [selectedSys, setSelectedSys] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);

  const allSystems = EXTERNAL_SYSTEMS.flatMap(g => g.systems);
  const activeCount   = allSystems.filter(s => s.status === 'active').length;
  const degradedCount = allSystems.filter(s => s.status === 'degraded').length;
  const inactiveCount = allSystems.filter(s => s.status === 'inactive').length;
  const totalEvents   = allSystems.reduce((s, x) => s + x.events, 0);

  const TABS = [
    { key: 'systems',  label: 'Systems',      icon: Plug },
    { key: 'arch',     label: 'Architecture', icon: Layers },
    { key: 'events',   label: 'Event Stream', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-30 px-5 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-extrabold text-foreground">Integration Hub</h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">External Systems · Ingestion Gateway · Event Bus</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* KPI bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active',    value: activeCount,             color: 'text-green-400' },
            { label: 'Degraded',  value: degradedCount,           color: degradedCount > 0 ? 'text-amber-400' : 'text-muted-foreground' },
            { label: 'Inactive',  value: inactiveCount,           color: 'text-muted-foreground' },
            { label: 'Events/24h',value: totalEvents.toLocaleString(), color: 'text-primary' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
              <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all',
                activeTab === key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground bg-card'
              )}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* Systems tab */}
        {activeTab === 'systems' && (
          <div className="space-y-4">
            {EXTERNAL_SYSTEMS.map(({ category, color, bg, border, systems }) => (
              <div key={category} className="rounded-xl bg-card border border-border overflow-hidden">
                <div className={cn('px-4 py-3 border-b border-border flex items-center justify-between', bg)}>
                  <p className={cn('text-xs font-extrabold uppercase tracking-wider', color)}>{category}</p>
                  <span className="text-xs text-muted-foreground">{systems.filter(s => s.status === 'active').length}/{systems.length} active</span>
                </div>
                <div className="p-3 space-y-2">
                  {systems.map(sys => (
                    <SystemCard key={sys.id} sys={sys} onClick={setSelectedSys} />
                  ))}
                </div>
              </div>
            ))}

            {/* Add integration CTA */}
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
              <Plus className="w-4 h-4" /> Add Integration
            </button>
          </div>
        )}

        {/* Architecture tab */}
        {activeTab === 'arch' && <ArchFlow />}

        {/* Event Stream tab */}
        {activeTab === 'events' && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <p className="text-xs font-extrabold uppercase tracking-wider text-foreground">Live Event Stream</p>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <span className="text-xs text-muted-foreground">Last 24h · {RECENT_EVENTS.length} shown</span>
            </div>
            <div className="divide-y divide-border/50">
              {RECENT_EVENTS.map((ev, i) => {
                const evCfg = EVENT_CFG[ev.status] || EVENT_CFG.ok;
                const Icon = evCfg.icon;
                const open = expandedEvent === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => setExpandedEvent(open ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                    >
                      <Icon className={cn('w-4 h-4 flex-shrink-0', evCfg.color)} />
                      <span className="text-xs font-mono text-muted-foreground w-20 flex-shrink-0">{ev.ts}</span>
                      <span className="text-xs font-bold text-foreground w-24 flex-shrink-0">{ev.system}</span>
                      <span className="text-xs font-mono text-primary flex-1 truncate">{ev.topic}</span>
                      <ChevronRight className={cn('w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform', open && 'rotate-90')} />
                    </button>
                    {open && (
                      <div className="px-4 pb-3">
                        <pre className="text-xs font-mono text-foreground bg-background/50 rounded-lg px-3 py-2 overflow-x-auto border border-border/50">
                          {ev.payload}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedSys && (
        <SystemDetailModal sys={selectedSys} onClose={() => setSelectedSys(null)} />
      )}
    </div>
  );
}