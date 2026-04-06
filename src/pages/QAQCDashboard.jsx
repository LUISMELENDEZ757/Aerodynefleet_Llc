import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, CheckCircle2, AlertTriangle, Users, TrendingUp,
  Download, Clipboard, Eye, BarChart3, Shield, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview',   label: 'Overview',      icon: Eye },
  { id: 'rii_items',  label: 'RII Items',     icon: Clipboard },
  { id: 'findings',   label: 'QC Findings',   icon: AlertTriangle },
  { id: 'inspectors', label: 'Inspectors',    icon: Users },
  { id: 'audit_trail', label: 'Audit Trail',  icon: Activity },
];

function KpiCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-foreground">{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
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

  return (
    <div className="min-h-screen bg-background pb-24">
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