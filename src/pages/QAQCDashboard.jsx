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
        {activeTab === 'rii_items' && <div className="text-muted-foreground py-8 text-center">RII Items management coming soon</div>}
        {activeTab === 'findings' && <div className="text-muted-foreground py-8 text-center">QC Findings view coming soon</div>}
        {activeTab === 'inspectors' && <div className="text-muted-foreground py-8 text-center">Inspector management coming soon</div>}
        {activeTab === 'audit_trail' && <div className="text-muted-foreground py-8 text-center">Audit trail coming soon</div>}
      </div>
    </div>
  );
}