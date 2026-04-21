import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Radio, Plus, RefreshCw, Upload, CheckCircle, AlertTriangle,
  Clock, Wifi, WifiOff, FileText, Database, Activity, Zap,
  ChevronRight, BarChart3, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import OEMConnectorCard from '@/components/telemetry/OEMConnectorCard';
import TelemetryImportModal from '@/components/telemetry/TelemetryImportModal';
import OEMConfigModal from '@/components/telemetry/OEMConfigModal';

// ── Pre-seeded OEM definitions (shown even before user creates DB records) ──
const DEFAULT_OEMS = [
  { oem_id: 'boeing_ahm',          name: 'Boeing AHM',                    category: 'airframe', status: 'pending_contract', description: 'Boeing Aircraft Health Management — fault monitoring, ACMS data, flight reports', applicable_aircraft_types: ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','B757','B767','B777','B787'], data_types: ['flight_hours','fault_codes','engine_health'], logo: '🛩️' },
  { oem_id: 'airbus_skywise',      name: 'Airbus Skywise',                category: 'airframe', status: 'pending_contract', description: 'Airbus Skywise Open Platform — predictive maintenance, fleet analytics, APU health', applicable_aircraft_types: ['A320','A321','A350'], data_types: ['flight_hours','engine_health','apu_health','fault_codes'], logo: '✈️' },
  { oem_id: 'ge_aviation',         name: 'GE Aviation / Flight Pulse',    category: 'engine',   status: 'pending_contract', description: 'GE Digital Flight Pulse — EGT margins, vibration, on-wing life management', applicable_aircraft_types: ['B737-700','B737-800','B737-900','B777','B787'], data_types: ['engine_health','egt_margin','vibration','engine_cycles'], logo: '⚙️' },
  { oem_id: 'honeywell_forge',     name: 'Honeywell Forge / GoDirect',    category: 'avionics', status: 'pending_contract', description: 'Honeywell Forge — APU health, avionics diagnostics, ACARS, flight efficiency', applicable_aircraft_types: ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','A320','A321','CRJ700','CRJ900'], data_types: ['apu_health','avionics','fuel_burn'], logo: '📡' },
  { oem_id: 'cfm_snecma',          name: 'CFM International / Safran',    category: 'engine',   status: 'pending_contract', description: 'CFM LEAP & CFM56 — EGT trends, LLP tracking, shop visit forecasting', applicable_aircraft_types: ['B737-700','B737-800','B737-900','B737 MAX 8','B737 MAX 9','A320','A321'], data_types: ['engine_health','egt_margin','engine_cycles'], logo: '🔧' },
  { oem_id: 'pratt_whitney',       name: 'Pratt & Whitney e-Service',     category: 'engine',   status: 'pending_contract', description: 'P&W e-Service — PW1000G / JT8D health, LLP management, AD compliance', applicable_aircraft_types: ['B757','A320','A321','E190','E175'], data_types: ['engine_health','engine_cycles','fault_codes'], logo: '⚡' },
  { oem_id: 'rolls_royce',         name: 'Rolls-Royce Blue Data Thread',  category: 'engine',   status: 'pending_contract', description: 'Rolls-Royce BDT — Trent engine digital twin, predictive analytics, EOL forecast', applicable_aircraft_types: ['B777','B787','A350'], data_types: ['engine_health','egt_margin','vibration'], logo: '🏆' },
  { oem_id: 'embraer_ahead',       name: 'Embraer AHEAD',                 category: 'airframe', status: 'pending_contract', description: 'Embraer AHEAD — E-Jet / E2 predictive maintenance, AHM, fleet health analytics', applicable_aircraft_types: ['E190','E175'], data_types: ['flight_hours','engine_health','fault_codes'], logo: '🛫' },
  { oem_id: 'mitsubishi_aircraft', name: 'Mitsubishi Aircraft',           category: 'airframe', status: 'pending_contract', description: 'Mitsubishi Aircraft health monitoring for SpaceJet series', applicable_aircraft_types: [], data_types: ['engine_health','flight_hours'], logo: '🇯🇵' },
  { oem_id: 'bombardier_smartlink',name: 'Bombardier Smart Link+',        category: 'airframe', status: 'pending_contract', description: 'Bombardier Smart Link+ — CRJ/Q real-time health monitoring & diagnostics', applicable_aircraft_types: ['CRJ700','CRJ900'], data_types: ['fault_codes','engine_health','apu_health'], logo: '📶' },
];

const CATEGORY_FILTERS = ['all','airframe','engine','avionics','apu','systems'];
const STATUS_SUMMARY_LABELS = { active: 'Connected', pending_credentials: 'Needs Creds', pending_contract: 'Pending Contract', inactive: 'Inactive', error: 'Error' };

const TABS = [
  { id: 'integrations', label: 'OEM Integrations', icon: Radio },
  { id: 'imports',      label: 'Data Imports',     icon: Database },
];

export default function TelemetryHub() {
  const [activeTab, setActiveTab] = useState('integrations');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [configConnector, setConfigConnector] = useState(null);
  const [stubMap, setStubMap] = useState({});
  const qc = useQueryClient();

  const { data: dbConnectors = [], refetch: refetchConnectors } = useQuery({
    queryKey: ['oem-integrations'],
    queryFn: () => base44.entities.OEMIntegration.list('-created_date', 100),
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['telemetry-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const { data: imports = [], refetch: refetchImports } = useQuery({
    queryKey: ['telemetry-imports'],
    queryFn: () => base44.entities.TelemetryImport.list('-created_date', 100),
  });

  // Merge default OEM list with DB records
  const mergedConnectors = DEFAULT_OEMS.map(def => {
    const dbRecord = dbConnectors.find(d => d.oem_id === def.oem_id);
    return dbRecord ? { ...def, ...dbRecord } : def;
  });

  // Extra DB-only connectors not in defaults
  const extraConnectors = dbConnectors.filter(d => !DEFAULT_OEMS.find(def => def.oem_id === d.oem_id));
  const allConnectors = [...mergedConnectors, ...extraConnectors];

  // Load stub status from backend
  useEffect(() => {
    base44.functions.invoke('oemTelemetryStub', { action: 'list_connectors' })
      .then(res => {
        const map = {};
        (res.data?.connectors || []).forEach(c => { map[c.oem_id] = c; });
        setStubMap(map);
      })
      .catch(() => {});
  }, []);

  const filtered = allConnectors.filter(c => {
    const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const connected = allConnectors.filter(c => c.status === 'active').length;
  const needsCreds = allConnectors.filter(c => c.status === 'pending_credentials').length;
  const pendingContract = allConnectors.filter(c => c.status === 'pending_contract').length;

  const importStatusColor = { pending: 'text-gray-400', processing: 'text-blue-400', imported: 'text-green-400', error: 'text-red-400' };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Radio className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">OEM TELEMETRY HUB</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Boeing · Airbus · GE · Honeywell · Safran · Embraer + more</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <LiveClock />
            <button onClick={() => { refetchConnectors(); refetchImports(); }}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import Data
            </button>
            <button onClick={() => setConfigConnector({})}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-extrabold hover:bg-secondary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add OEM
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mt-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all',
                activeTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground bg-secondary')}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Connected', value: connected,       color: 'text-green-400',  bg: 'bg-green-600/20',  icon: Wifi },
            { label: 'Needs Setup', value: needsCreds,   color: 'text-amber-400',  bg: 'bg-amber-600/20',  icon: AlertTriangle },
            { label: 'OEMs Registered', value: allConnectors.length, color: 'text-primary', bg: 'bg-primary/20', icon: Activity },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <div>
                <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Setup guide banner */}
        {connected === 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl px-5 py-4 flex items-start gap-3">
            <Radio className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-extrabold text-blue-400 mb-1">How to Activate an OEM Integration</p>
              <ol className="text-xs text-blue-300 space-y-1 list-decimal list-inside">
                <li>Sign a data-sharing agreement with the OEM's airline services team</li>
                <li>Receive API credentials (API key, OAuth client, or certificate)</li>
                <li>Add secrets in <strong>Dashboard → Settings → Secrets</strong></li>
                <li>Click "Configure" on the connector and set status to <strong>Active</strong></li>
                <li>In the meantime, use <strong>Import Data</strong> to upload CSV exports manually</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── INTEGRATIONS TAB ── */}
        {activeTab === 'integrations' && (
          <>
            {/* Search + category filter */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-48 bg-card border border-border rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search OEM, aircraft type…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {CATEGORY_FILTERS.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={cn('px-3 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all flex-shrink-0',
                      categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(connector => (
                <OEMConnectorCard
                  key={connector.oem_id}
                  connector={connector}
                  stubInfo={stubMap[connector.oem_id]}
                  onConfigure={setConfigConnector}
                />
              ))}
            </div>
          </>
        )}

        {/* ── IMPORTS TAB ── */}
        {activeTab === 'imports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-foreground">{imports.length} Import Records</p>
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors">
                <Upload className="w-3.5 h-3.5" /> New Import
              </button>
            </div>

            {imports.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border py-16 text-center space-y-3">
                <Database className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="font-extrabold text-muted-foreground">No imports yet</p>
                <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">Export data from your OEM portal (Boeing AHM, Skywise, GE Flight Pulse, etc.) and import it here as CSV or JSON.</p>
                <button onClick={() => setShowImport(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
                  Import First Dataset
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {imports.map(imp => {
                    let summary = {};
                    try { summary = JSON.parse(imp.raw_summary || '{}'); } catch {}
                    return (
                      <div key={imp.id} className="flex items-start gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-bold text-foreground">{imp.oem_name || imp.oem_id}</span>
                            <span className="text-xs font-mono text-muted-foreground">{imp.aircraft_tail || 'Fleet-wide'}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                              {imp.data_type?.replace(/_/g, ' ')}
                            </span>
                            <span className={cn('text-[10px] font-bold capitalize', importStatusColor[imp.status] || 'text-muted-foreground')}>
                              {imp.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{imp.file_name}</p>
                          {imp.record_count && (
                            <p className="text-xs text-muted-foreground">{imp.record_count?.toLocaleString()} records</p>
                          )}
                          {summary.max_flight_hours && (
                            <p className="text-[10px] text-primary mt-0.5">Max FH: {summary.max_flight_hours?.toLocaleString()} · Cycles: {summary.max_cycles?.toLocaleString()}</p>
                          )}
                          {summary.avg_egt_margin && (
                            <p className="text-[10px] text-amber-400 mt-0.5">Avg EGT Margin: {summary.avg_egt_margin}°C · Min: {summary.min_egt_margin}°C</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-muted-foreground font-mono">{new Date(imp.created_date).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted-foreground">{imp.imported_by}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showImport && (
        <TelemetryImportModal
          aircraft={aircraft}
          onClose={() => setShowImport(false)}
          onSuccess={() => { refetchImports(); setShowImport(false); }}
        />
      )}

      {configConnector !== null && (
        <OEMConfigModal
          connector={configConnector?.id ? configConnector : null}
          onClose={() => setConfigConnector(null)}
        />
      )}
    </div>
  );
}