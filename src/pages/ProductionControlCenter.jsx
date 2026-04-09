import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, AlertTriangle, Plus, Eye, Play, Settings,
  Activity, CheckCircle, AlertCircle, Clock, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BOWPlanner from '@/components/production/BOWPlanner';
import WorkforceScheduler from '@/components/production/WorkforceScheduler';
import BOWInventoryTracker from '@/components/production/BOWInventoryTracker';
import BOWAnalytics from '@/components/production/BOWAnalytics';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: '📊', badge: 3 },
  { id: 'planning', label: 'Planning', icon: '📋' },
  { id: 'bow', label: 'BOW Planner', icon: '🔨' },
  { id: 'inventory', label: 'Inventory', icon: '📦', badge: 2 },
  { id: 'ai', label: 'AI Assistant', icon: '🤖' },
  { id: 'overview', label: 'Overview', icon: '👁️' },
  { id: 'hangar', label: 'Hangar Bays', icon: '🏭' },
  { id: 'tasks', label: 'Task Board', icon: '✓' },
  { id: 'workforce', label: 'Workforce', icon: '👥', badge: 8 },
  { id: 'goals', label: 'Daily Goals', icon: '🎯', badge: 1 },
  { id: 'integrations', label: 'Integrations', icon: '⚙️' },
];

const KPI_CARDS = [
  { label: 'ON SHIFT NOW', value: '6', color: 'text-green-400' },
  { label: 'TOTAL TECHS', value: '8', color: 'text-white' },
  { label: 'BAYS OCCUPIED', value: '0/2', color: 'text-orange-400' },
  { label: 'BLOCKED TASKS', value: '0', color: 'text-white' },
  { label: 'CRITICAL OPEN', value: '0', color: 'text-white' },
  { label: 'MH TODAY', value: '39h', color: 'text-cyan-400' },
  { label: 'GOALS MET', value: '1/5', color: 'text-green-400' },
];

function KpiCard({ label, value, color }) {
  return (
    <div className="bg-[#0f1419] border border-white/10 rounded-2xl px-5 py-4 min-w-[140px]">
      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={cn('text-3xl font-black tracking-tight', color)}>{value}</p>
    </div>
  );
}

function TabButton({ tab, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      )}
    >
      <span>{tab.icon}</span>
      {tab.label}
      {tab.badge && (
        <span className="ml-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
          {tab.badge}
        </span>
      )}
    </button>
  );
}

function PlanningModule() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <h2 className="text-2xl font-black text-primary">PLANNING MODULE</h2>
        </div>
        <p className="text-sm text-gray-400">Fleet Forecast → Work Package Builder → Production Scheduling</p>
        <p className="text-xs text-cyan-400">Where all maintenance work begins</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2a1f0f] border border-primary/50 text-primary font-bold text-sm hover:bg-primary/20">
          <span>📈</span> Fleet Forecast
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f1419] border border-white/10 text-gray-400 font-bold text-sm hover:text-white">
          <span>🔧</span> Work Package Builder
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f1419] border border-white/10 text-gray-400 font-bold text-sm hover:text-white">
          <span>📦</span> Active Packages
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f1419] border border-white/10 text-gray-400 font-bold text-sm hover:text-white">
          <span>🔨</span> Structural Damage
        </button>
      </div>

      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">SEARCH EVENTS</label>
            <input
              type="text"
              placeholder="Tail number, description..."
              className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">STATION</label>
            <select className="w-full bg-[#0a0d11] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-primary/40">
              <option>All Stations</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationHub() {
  const integrations = [
    { name: 'TRAX Work Package Import', status: 'ACTIVE', type: 'INBOUND', format: 'REST_API', schedule: 'Every 15 minutes', lastRun: '10:45:00 AM', processed: 47, failed: 0 },
    { name: 'AMOS Task Card Sync', status: 'ACTIVE', type: 'BIDIRECTIONAL', format: 'XML', schedule: 'Every 30 minutes', lastRun: '10:30:00 AM', processed: 134, failed: 0 },
    { name: 'Defect Status Outbound', status: 'ACTIVE', type: 'OUTBOUND', format: 'JSON', schedule: 'Every 10 minutes', lastRun: '10:40:00 AM', processed: 23, failed: 0 },
    { name: 'FlightAware AeroAPI', status: 'ACTIVE', type: 'INBOUND', format: 'REST_API', schedule: 'Real-time', lastRun: '10:47:00 AM', processed: 89, failed: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <h2 className="text-2xl font-black text-primary">Integration Hub</h2>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Interface
        </button>
      </div>

      <p className="text-sm text-gray-400">Canonical Data Model Integration — TRAX, AMOS, FlightAware & Custom Interfaces</p>

      <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-400">⚠️ INTERFACE ERROR — MCC ATTENTION REQUIRED</p>
          <p className="text-sm text-red-300 mt-1">1 interface is experiencing errors. Outbound completions may not be syncing to TRAX. Station KORD may be operating disconnected.</p>
          <button className="mt-3 px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500">
            View Error Details
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ACTIVE', value: '4', icon: <Activity className="w-5 h-5" />, color: 'text-green-400' },
          { label: 'PROCESSED', value: '3,140', sub: 'Records Today', icon: <CheckCircle className="w-5 h-5" />, color: 'text-blue-400' },
          { label: 'FAILED', value: '15', sub: 'Records w/ Errors', icon: <AlertCircle className="w-5 h-5" />, color: 'text-red-400' },
          { label: 'SYNC', value: '2m', sub: 'Last Sync Ago', icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f1419] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <p className={cn('text-3xl font-black', stat.color)}>{stat.value}</p>
            {stat.sub && <p className="text-[10px] text-gray-600 mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {integrations.map((int, idx) => (
          <div key={idx} className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-white">{int.name}</h3>
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full',
                  int.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' : 'bg-gray-900/50 text-gray-400'
                )}>
                  {int.status}
                </span>
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full',
                  int.type === 'INBOUND' ? 'bg-purple-900/50 text-purple-400' : 'bg-cyan-900/50 text-cyan-400'
                )}>
                  {int.type.includes('INBOUND') ? '📥' : int.type.includes('OUTBOUND') ? '📤' : '↔️'} {int.type}
                </span>
                <span className="text-[10px] font-bold text-gray-600">{int.format}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{int.schedule} • Last run: {int.lastRun} • Processed: {int.processed} • Failed: {int.failed}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-lg bg-green-600 hover:bg-green-500 flex items-center justify-center text-white transition-colors">
                <Play className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌐</span>
        <h2 className="text-2xl font-black text-primary">Canonical Aerofleet TechOps Data Model</h2>
      </div>
      <p className="text-sm text-gray-400">All external systems map TO and FROM this central model. Your model is the center of gravity.</p>

      <div className="grid grid-cols-3 gap-4">
        {[
          { title: 'Aircraft', fields: ['serial_number', 'fleet_type', 'station_icao', 'status'] },
          { title: 'Work Packages', fields: ['work_package_id', 'aircraft_serial', 'check_type', 'status'] },
          { title: 'Task Cards', fields: ['task_id', 'work_package_id', 'ata_chapter', 'description'] },
          { title: 'Defects', fields: ['defect_id', 'aircraft_serial', 'defect_code', 'mel_category'] },
          { title: 'Stations', fields: ['station_icao', 'name', 'capabilities', 'timezone'] },
          { title: 'Parts', fields: ['part_number', 'description', 'quantity', 'location'] },
        ].map((entity, i) => (
          <div key={i} className="bg-[#0f1419] border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold text-primary text-lg mb-4">🏷️ {entity.title}</h3>
            <div className="space-y-2">
              {entity.fields.map((field, fi) => (
                <p key={fi} className="text-xs text-gray-400 font-mono"># {field}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductionControlCenter() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="min-h-screen bg-[#060809] pb-24">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0d11] sticky top-0 z-30">
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <p className="text-[11px] font-bold text-primary tracking-widest uppercase">Aerodyne Fleet Management</p>
                <h1 className="text-2xl font-black text-white tracking-wider">MULTIFLEET PRODUCTION CONTROL CENTER</h1>
                <p className="text-xs text-gray-500 mt-0.5">Multi-Fleet Operations · Shift Management · Labor Tracking · Bay Status · Task Board</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-green-400 tracking-widest uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" /> 1000 AIRCRAFT SYNCED
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-600">
                📊 Shift Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {KPI_CARDS.map((card, i) => (
              <KpiCard key={i} {...card} />
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-2 border-t border-white/10">
            {TABS.map(tab => (
              <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        {activeTab === 'analytics' && <BOWAnalytics />}
        {activeTab === 'planning' && <PlanningModule />}
        {activeTab === 'bow' && <BOWPlanner />}
        {activeTab === 'inventory' && <BOWInventoryTracker bows={[]} />}
        {activeTab === 'integrations' && <IntegrationHub />}
        {activeTab === 'overview' && <OverviewModule />}
        {activeTab === 'workforce' && <WorkforceScheduler />}
        {['ai', 'hangar', 'tasks', 'goals'].includes(activeTab) && (
          <div className="text-center py-20 text-gray-600">
            <p className="text-lg font-bold">{TABS.find(t => t.id === activeTab)?.label} Module</p>
            <p className="text-sm mt-2">Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}