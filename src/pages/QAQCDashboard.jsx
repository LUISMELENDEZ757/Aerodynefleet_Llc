import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, CheckCircle2, AlertTriangle, Users, TrendingUp,
  Download, Clipboard, Eye, BarChart3, Shield, Activity, Filter,
  Clock, Zap, ChevronRight, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TOP_TABS = [
  { id: 'dashboard', label: 'QC/RII Dashboard' },
  { id: 'fleet_sync', label: 'Fleet Sync' },
  { id: 'qa_env', label: 'QA Environment' },
  { id: 'qc_inspection', label: 'QC Inspection' },
  { id: 'qa_workflow', label: 'QC/QA Workflow' },
  { id: 'webrtc', label: 'WebRTC Dept-Link' },
];

const TABS = [
  { id: 'overview',   label: 'Overview',      icon: Eye },
  { id: 'rii_items',  label: 'RII Items',     icon: Clipboard },
  { id: 'findings',   label: 'QC Findings',   icon: AlertTriangle },
  { id: 'inspectors', label: 'Inspectors',    icon: Users },
  { id: 'audit_trail', label: 'Audit Trail',  icon: Activity },
];

const MODULES = [
  { id: 'fleet_health', label: 'Fleet Health Dashboard', icon: TrendingUp, desc: 'Real-time fleet health monitoring and analytics' },
  { id: 'audit_schedule', label: 'QA Audit Schedule', icon: Clipboard, desc: 'Quality audit planning and tracking' },
];

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');
  return (
    <div className="text-right">
      <p className="text-3xl font-black font-mono text-primary">{h}:{m}:{s}</p>
      <p className="text-xs text-muted-foreground">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sublabel, dotColor }) {
  return (
    <div className="bg-card/50 border border-border rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3 text-muted-foreground" />
        {dotColor && <span className={cn('w-2 h-2 rounded-full', dotColor)} />}
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clipboard} label="Total RII Items" value="5" sublabel="2 completed, 3 pending" />
        <KpiCard icon={TrendingUp} label="RII Pass Rate" value="50%" sublabel="40% compliance rate" />
        <KpiCard icon={AlertTriangle} label="Open Findings" value="2" sublabel="1 critical, 5 total" />
        <KpiCard icon={Users} label="Active Inspectors" value="3" sublabel="0 expiring soon, 3 expired" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-extrabold text-foreground mb-4">Findings by Severity</p>
          <div className="space-y-3">
            {[
              { label: 'Critical', count: 1, color: 'bg-red-600' },
              { label: 'Major', count: 2, color: 'bg-orange-500' },
              { label: 'Minor', count: 2, color: 'bg-yellow-500' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{label}</span>
                <div className="flex-1 bg-secondary rounded-full h-2 relative">
                  <div className={cn('h-full rounded-full', color)} style={{ width: `${(count / 2) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-extrabold text-foreground mb-4">RII Status Breakdown</p>
          <div className="space-y-2">
            {[
              { label: 'Pending Assignment', count: 2 },
              { label: 'Assigned', count: 1 },
              { label: 'Completed Pass', count: 1 },
            ].map(({ label, count }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm font-extrabold text-foreground mb-4">Inspector Roster</p>
        <div className="space-y-3">
          {[
            { name: 'Michael Torres', id: 'MT-441', inspections: '142 Inspections', status: 'active', statusColor: 'bg-green-500' },
            { name: 'Sandra Lee', id: 'SL-220', inspections: '98 Inspections', status: 'expired', statusColor: 'bg-red-500' },
          ].map(({ name, id, inspections, status, statusColor }) => (
            <div key={name} className="flex items-center justify-between p-3 bg-background/40 rounded-lg">
              <div>
                <p className="text-sm font-bold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{id} · {inspections}</p>
              </div>
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full text-white', statusColor)}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QAQCDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTopTab, setActiveTopTab] = useState('qa_env');
  const [selectedModule, setSelectedModule] = useState('fleet_health');

  if (activeTopTab === 'qa_env') {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Top Navigation Tabs */}
        <div className="border-b border-border bg-secondary/40 px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {TOP_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTopTab(id)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTopTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* QA Environment Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-wide">QUALITY ASSURANCE ENVIRONMENT</h1>
                <p className="text-sm opacity-90">Comprehensive QA Oversight & Compliance Management System</p>
              </div>
            </div>
            <LiveClock />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-5 py-4 bg-background/50">
          <KpiCard icon={Zap} label="Fleet Aircraft" value="0" dotColor="bg-blue-500" />
          <KpiCard icon={TrendingUp} label="Fleet Health" value="87%" dotColor="bg-green-500" />
          <KpiCard icon={Clock} label="Active Audits" value="2" dotColor="bg-yellow-500" />
          <KpiCard icon={AlertTriangle} label="Open NCs" value="3" dotColor="bg-orange-500" />
          <KpiCard icon={Clipboard} label="Pending RII" value="5" dotColor="bg-red-500" />
          <KpiCard icon={AlertTriangle} label="Safety Reports" value="2" dotColor="bg-pink-500" />
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-0">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-border bg-secondary/20 p-4 flex flex-col gap-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search modules..." className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">FLEET OVERSIGHT</p>
              {MODULES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setSelectedModule(id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-all',
                    selectedModule === id
                      ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-600'
                      : 'border-border hover:border-border/80'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-5">
            {selectedModule === 'fleet_health' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">Fleet Health Dashboard</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Fleet Oversight • Real-time fleet health monitoring and analytics</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 bg-secondary text-muted-foreground hover:text-foreground text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                      <Filter className="w-3.5 h-3.5" /> Filter
                    </button>
                    <button className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary/90">
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                  </div>
                </div>

                <div className="bg-card/50 border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-extrabold text-foreground mb-2 flex items-center gap-2">
                    <span className="text-xl">📊</span> FLEET HEALTH & COMPLIANCE OVERVIEW
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Comprehensive fleet-wide health monitoring and compliance tracking</p>
                  
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'All Aircraft', icon: '✈️', color: 'bg-pink-500/20 text-pink-600' },
                      { label: 'High Risk', icon: '⚠️', color: 'bg-orange-500/20 text-orange-600' },
                      { label: 'Deferred Items', icon: '⏸️', color: 'bg-blue-500/20 text-blue-600' },
                      { label: 'Repeat Issues', icon: '🔄', color: 'bg-purple-500/20 text-purple-600' },
                      { label: 'High Impact', icon: '💥', color: 'bg-red-500/20 text-red-600' },
                    ].map(({ label, icon, color }) => (
                      <button key={label} className={cn('px-4 py-2 rounded-lg text-xs font-bold', color)}>
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedModule === 'audit_schedule' && (
              <div className="text-muted-foreground py-12 text-center">
                <Clipboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Audit schedule management coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Navigation Tabs */}
      <div className="border-b border-border bg-secondary/40 px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {TOP_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTopTab(id)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
              activeTopTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">QC/RII Management System</h1>
              <p className="text-xs text-muted-foreground">FAA-Compliant Quality Control & Required Inspection Items · 14 CFR §43.9 / §65.95 / §121.371</p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Only show tabs content if not in QA Environment */}
        {activeTab === 'overview' && <OverviewTab />}

        {activeTab === 'rii_items' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-secondary/60 border-b border-border">
                <p className="text-sm font-extrabold">Required Inspection Items</p>
              </div>
              <div className="divide-y divide-border">
                {[
                  { id: '001', item: 'Engine Oil Change', status: 'Completed Pass', inspector: 'Michael Torres', date: '04/01/2026' },
                  { id: '002', item: 'Brake Fluid Inspection', status: 'Pending Assignment', inspector: '—', date: '—' },
                  { id: '003', item: 'Landing Gear Serviceability', status: 'Assigned', inspector: 'Sandra Lee', date: '04/03/2026' },
                  { id: '004', item: 'Hydraulic System Check', status: 'Pending Assignment', inspector: '—', date: '—' },
                  { id: '005', item: 'Avionics System Test', status: 'Completed Pass', inspector: 'Michael Torres', date: '03/28/2026' },
                ].map(({ id, item, status, inspector, date }) => (
                  <div key={id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{item}</p>
                      <p className="text-xs text-muted-foreground">RII-{id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-semibold">{inspector}</p>
                        <p className="text-xs text-muted-foreground">{date}</p>
                      </div>
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full',
                        status === 'Completed Pass' ? 'bg-green-500/20 text-green-600' :
                        status === 'Assigned' ? 'bg-blue-500/20 text-blue-600' :
                        'bg-yellow-500/20 text-yellow-600'
                      )}>{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-secondary/60 border-b border-border">
                <p className="text-sm font-extrabold">Quality Control Findings</p>
              </div>
              <div className="divide-y divide-border">
                {[
                  { finding: 'Oil filter installation debris', severity: 'Critical', ata: '79-10', status: 'Open', date: '04/05/2026' },
                  { finding: 'Brake assembly wear documentation incomplete', severity: 'Major', ata: '32-00', status: 'Open', date: '04/03/2026' },
                  { finding: 'Hydraulic hose labeling non-compliant', severity: 'Major', ata: '29-11', status: 'Closed', date: '03/30/2026' },
                  { finding: 'Missing calibration sticker on torque wrench', severity: 'Minor', ata: '05-00', status: 'Open', date: '04/02/2026' },
                  { finding: 'Work order signature incomplete', severity: 'Minor', ata: '05-00', status: 'Closed', date: '03/25/2026' },
                ].map((finding, i) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{finding.finding}</p>
                        <p className="text-xs text-muted-foreground">ATA {finding.ata}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-xs font-bold px-2 py-1 rounded',
                          finding.severity === 'Critical' ? 'bg-red-500/20 text-red-600' :
                          finding.severity === 'Major' ? 'bg-orange-500/20 text-orange-600' :
                          'bg-yellow-500/20 text-yellow-600'
                        )}>{finding.severity}</span>
                        <span className={cn('text-xs font-bold px-2 py-1 rounded',
                          finding.status === 'Open' ? 'bg-red-500/20 text-red-600' : 'bg-green-500/20 text-green-600'
                        )}>{finding.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{finding.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inspectors' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Michael Torres', id: 'MT-441', cert: 'A&P Certificate', expires: '06/15/2027', inspections: 142, status: 'active' },
                { name: 'Sandra Lee', id: 'SL-220', cert: 'A&P Certificate', expires: '01/20/2024', inspections: 98, status: 'expired' },
                { name: 'James Martinez', id: 'JM-335', cert: 'Inspection Auth', expires: '09/10/2028', inspections: 67, status: 'active' },
              ].map(({ name, id, cert, expires, inspections, status }) => (
                <div key={id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{id}</p>
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-1 rounded-full text-white',
                      status === 'active' ? 'bg-green-600' : 'bg-red-600'
                    )}>{status}</span>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">{cert}</p>
                    <p className="text-xs font-semibold text-foreground">Expires: {expires}</p>
                    <p className="text-xs text-muted-foreground">{inspections} completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit_trail' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-secondary/60 border-b border-border">
                <p className="text-sm font-extrabold">Activity Log</p>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {[
                  { action: 'Finding closed', details: 'Critical finding RII-002 closed by Michael Torres', time: '04/06/2026 14:32' },
                  { action: 'RII assigned', details: 'RII-003 assigned to Sandra Lee', time: '04/05/2026 10:15' },
                  { action: 'Inspection completed', details: 'Engine inspection RII-001 marked complete', time: '04/05/2026 09:45' },
                  { action: 'Finding created', details: 'Critical finding logged for brake assembly', time: '04/03/2026 16:20' },
                  { action: 'Inspector activated', details: 'James Martinez added to inspector roster', time: '03/30/2026 11:05' },
                  { action: 'Report exported', details: 'Monthly compliance report generated', time: '03/28/2026 08:30' },
                ].map((log, i) => (
                  <div key={i} className="px-5 py-3 flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}