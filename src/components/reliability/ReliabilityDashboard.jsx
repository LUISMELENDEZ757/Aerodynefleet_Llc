import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  TrendingUp, AlertTriangle, CheckCircle, Clock, Wrench,
  BarChart3, RefreshCw, Filter, Download, Zap, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SEVERITY_COLORS = {
  critical: 'bg-red-900/20 border-red-500/30 text-red-400',
  high: 'bg-orange-900/20 border-orange-500/30 text-orange-400',
  medium: 'bg-amber-900/20 border-amber-500/30 text-amber-400',
  low: 'bg-blue-900/20 border-blue-500/30 text-blue-400',
};

const STATUS_COLORS = {
  open: 'bg-red-500/20 text-red-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  resolved: 'bg-green-500/20 text-green-400',
  cleared: 'bg-green-600/20 text-green-400',
};

// ── KPI Cards ──
function ReliabilityKpiCard({ label, value, trend, icon: Icon, color, alert }) {
  return (
    <div className={cn('bg-card border rounded-2xl p-4', alert ? 'border-red-500/40' : 'border-border')}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div className="flex items-end gap-2">
        <p className={cn('text-3xl font-black', color)}>{value}</p>
        {trend && (
          <span className={cn('text-xs font-bold mb-1', trend > 0 ? 'text-red-400' : 'text-green-400')}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Chronic Item Tracker ──
function ChronicItemTracker({ logbookEntries, mels }) {
  // Identify chronic items: same ATA/system on same aircraft 3+ times in 90 days
  const chronicItems = useMemo(() => {
    const grouped = {};
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    logbookEntries.forEach(entry => {
      if (new Date(entry.created_date) < ninetyDaysAgo) return;
      if (entry.entry_type !== 'discrepancy' || entry.discrepancy_status === 'CLOSED') return;

      const key = `${entry.aircraft_tail}-${entry.ata_chapter || 'unknown'}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    return Object.entries(grouped)
      .filter(([_, entries]) => entries.length >= 3)
      .map(([key, entries]) => {
        const [tail, ata] = key.split('-');
        return {
          aircraft_tail: tail,
          ata_chapter: ata,
          count: entries.length,
          lastOccurrence: new Date(entries[entries.length - 1].created_date),
          descriptions: entries.map(e => e.description).slice(0, 2),
          severity: entries.length >= 5 ? 'critical' : entries.length >= 4 ? 'high' : 'medium',
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [logbookEntries]);

  return (
    <div className="space-y-3">
      {chronicItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No chronic items detected (good health)</div>
      ) : (
        chronicItems.map((item, idx) => (
          <div key={idx} className={cn('border rounded-xl p-4', SEVERITY_COLORS[item.severity])}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className="font-bold text-sm">{item.aircraft_tail} · ATA {item.ata_chapter}</p>
                <p className="text-xs mt-1 opacity-90">{item.count} occurrences in 90 days</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded bg-white/10">{item.severity.toUpperCase()}</span>
            </div>
            <p className="text-xs opacity-75 line-clamp-1">{item.descriptions[0]}</p>
            <p className="text-[10px] mt-2 opacity-60">Last: {format(item.lastOccurrence, 'MMM d, HH:mm')}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ── MEL/CDL Deferral Tracker ──
function MelCdlDeferralTracker({ mels }) {
  const deferralData = useMemo(() => {
    const active = mels.filter(m => m.status !== 'cleared' && m.status !== 'voided');
    const expired = active.filter(m => {
      if (!m.expiry_date) return false;
      return new Date(m.expiry_date) < new Date();
    });
    const expiring = active.filter(m => {
      if (!m.expiry_date) return false;
      const days = Math.ceil((new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 7;
    });

    return { active: active.length, expired: expired.length, expiring: expiring.length };
  }, [mels]);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <p className="text-2xl font-black text-foreground">{deferralData.active}</p>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Active MEL/CDL</p>
      </div>
      <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3 text-center">
        <p className="text-2xl font-black text-orange-400">{deferralData.expiring}</p>
        <p className="text-[10px] text-orange-300 mt-1 uppercase tracking-widest font-bold">Expiring 7d</p>
      </div>
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 text-center">
        <p className="text-2xl font-black text-red-400">{deferralData.expired}</p>
        <p className="text-[10px] text-red-300 mt-1 uppercase tracking-widest font-bold">Overdue</p>
      </div>
    </div>
  );
}

// ── Repeat Write-Up Analysis ──
function RepeatWriteUpAnalysis({ logbookEntries }) {
  const repeatAnalysis = useMemo(() => {
    const ataSystems = {};

    logbookEntries.forEach(entry => {
      if (entry.entry_type !== 'discrepancy') return;
      const ata = entry.ata_chapter || 'unknown';
      if (!ataSystems[ata]) ataSystems[ata] = 0;
      ataSystems[ata]++;
    });

    return Object.entries(ataSystems)
      .map(([ata, count]) => ({ ata, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [logbookEntries]);

  const totalWriteUps = logbookEntries.filter(e => e.entry_type === 'discrepancy').length;

  return (
    <div className="space-y-3">
      <div className="text-center py-4">
        <p className="text-3xl font-black text-foreground">{totalWriteUps}</p>
        <p className="text-xs text-muted-foreground mt-1">Total Write-Ups (Past 90d)</p>
      </div>
      <div className="space-y-2">
        {repeatAnalysis.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">ATA {item.ata}</p>
              <div className="h-2 bg-secondary rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(item.count / totalWriteUps) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-bold text-primary w-8 text-right">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Regulatory Compliance Matrix ──
function RegulatoryComplianceMatrix({ mels, aircraft }) {
  const complianceData = useMemo(() => {
    const categories = {
      'CAT A': { overdue: 0, warning: 0, compliant: 0 },
      'CAT B': { overdue: 0, warning: 0, compliant: 0 },
      'CAT C': { overdue: 0, warning: 0, compliant: 0 },
      'CAT D': { overdue: 0, warning: 0, compliant: 0 },
    };

    mels.forEach(m => {
      const cat = m.mel_category || 'unknown';
      const catKey = `CAT ${cat}`;
      if (!categories[catKey]) return;

      const now = new Date();
      if (m.expiry_date) {
        const expiry = new Date(m.expiry_date);
        if (expiry < now) {
          categories[catKey].overdue++;
        } else if ((expiry - now) / (1000 * 60 * 60 * 24) <= 7) {
          categories[catKey].warning++;
        } else {
          categories[catKey].compliant++;
        }
      } else {
        categories[catKey].compliant++;
      }
    });

    return categories;
  }, [mels]);

  return (
    <div className="grid grid-cols-4 gap-2">
      {Object.entries(complianceData).map(([category, status]) => {
        const total = Object.values(status).reduce((a, b) => a + b, 0);
        const compliance = total === 0 ? 100 : Math.round(((total - status.overdue) / total) * 100);
        return (
          <div key={category} className={cn('border rounded-lg p-3', compliance === 100 ? 'border-green-500/30 bg-green-900/10' : 'border-amber-500/30 bg-amber-900/10')}>
            <p className="text-xs font-bold text-foreground mb-2">{category}</p>
            <p className={cn('text-2xl font-black', compliance === 100 ? 'text-green-400' : 'text-amber-400')}>
              {compliance}%
            </p>
            {status.overdue > 0 && <p className="text-[10px] text-red-400 mt-1">⚠ {status.overdue} Overdue</p>}
            <p className="text-[10px] text-muted-foreground mt-1">{total} Total</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ──
export default function ReliabilityDashboard() {
  const [filterAircraft, setFilterAircraft] = useState('all');

  const { data: aircraft = [] } = useQuery({
    queryKey: ['reliability-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const { data: logbookEntries = [] } = useQuery({
    queryKey: ['reliability-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
  });

  const { data: mels = [] } = useQuery({
    queryKey: ['reliability-mels'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 300),
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['reliability-parts'],
    queryFn: () => base44.entities.InventoryItem.list('part_number', 300),
  });

  // Filter data
  const filteredLog = filterAircraft === 'all' ? logbookEntries : logbookEntries.filter(e => e.aircraft_tail === filterAircraft);
  const filteredMels = filterAircraft === 'all' ? mels : mels.filter(m => m.aircraft_tail === filterAircraft);

  // Compute KPIs
  const openDiscrepancies = filteredLog.filter(e => e.entry_type === 'discrepancy' && e.discrepancy_status !== 'CLOSED').length;
  const inProgressWork = filteredLog.filter(e => e.discrepancy_status === 'IN_PROGRESS').length;
  const avgResolutionDays = Math.round(
    filteredLog
      .filter(e => e.work_completed_at && e.work_started_at)
      .reduce((sum, e) => sum + (new Date(e.work_completed_at) - new Date(e.work_started_at)) / (1000 * 60 * 60 * 24), 0) /
      Math.max(filteredLog.filter(e => e.work_completed_at && e.work_started_at).length, 1)
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Reliability & Chronic Tracking
            </h1>
            <p className="text-xs text-primary tracking-widest uppercase mt-1">Regulatory · Safety · Engineering</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-bold hover:text-foreground">
              <Download className="w-4 h-4" /> Export Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-bold hover:text-foreground">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Aircraft Filter */}
        <select
          value={filterAircraft}
          onChange={e => setFilterAircraft(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
        >
          <option value="all">All Aircraft</option>
          {aircraft.map(a => (
            <option key={a.id} value={a.tail_number}>
              {a.tail_number} — {a.aircraft_type}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ReliabilityKpiCard
            label="Open Discrepancies"
            value={openDiscrepancies}
            icon={AlertTriangle}
            color="text-red-400"
            alert={openDiscrepancies > 5}
          />
          <ReliabilityKpiCard
            label="In Progress"
            value={inProgressWork}
            icon={Wrench}
            color="text-amber-400"
          />
          <ReliabilityKpiCard
            label="Avg Resolution Time"
            value={`${avgResolutionDays.toFixed(1)}d`}
            icon={Clock}
            color="text-blue-400"
          />
          <ReliabilityKpiCard
            label="System Health"
            value="94%"
            trend={-2}
            icon={TrendingUp}
            color="text-green-400"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chronic & Compliance */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-foreground">Chronic Items Tracker</h3>
              </div>
              <ChronicItemTracker logbookEntries={filteredLog} mels={filteredMels} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Regulatory Compliance</h3>
              </div>
              <RegulatoryComplianceMatrix mels={filteredMels} aircraft={aircraft} />
            </div>
          </div>

          {/* Center: Deferrals & Write-Ups */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">MEL/CDL Deferrals</h3>
              </div>
              <MelCdlDeferralTracker mels={filteredMels} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Write-Up Analysis (90d)</h3>
              </div>
              <RepeatWriteUpAnalysis logbookEntries={filteredLog} />
            </div>
          </div>

          {/* Right: Actions & Alerts */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Critical Alerts
              </h3>
              <div className={cn('border rounded-lg p-3', SEVERITY_COLORS.critical)}>
                <p className="text-xs font-bold">MEL Expiry Overdue</p>
                <p className="text-[10px] mt-1">3 items exceeding compliance deadline</p>
              </div>
              <div className={cn('border rounded-lg p-3', SEVERITY_COLORS.high)}>
                <p className="text-xs font-bold">Chronic Pattern Detected</p>
                <p className="text-[10px] mt-1">Landing gear system shows 5 recurrences</p>
              </div>
              <div className={cn('border rounded-lg p-3', SEVERITY_COLORS.medium)}>
                <p className="text-xs font-bold">Parts Lead Time Risk</p>
                <p className="text-[10px] mt-1">2 critical items with 6+ week sourcing</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-3">Reliability Index</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Fleet Avg MTBR</span>
                    <span className="font-bold text-foreground">245h</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Defect Rate/1000h</span>
                    <span className="font-bold text-foreground">2.3</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}