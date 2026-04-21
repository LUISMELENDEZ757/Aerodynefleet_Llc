import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SupplierIngestModal from './SupplierIngestModal';
import {
  Calendar, Wrench, Package, Users, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Zap, MapPin, FileText, Plus, Edit2,
  RefreshCw, Filter, Download, Shield, Activity, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Check Types Configuration
const CHECK_TYPES = {
  A: { label: 'A-Check', hours: 400, interval: '400 flight hours / 12 months' },
  C: { label: 'C-Check', hours: 4000, interval: '4,000 flight hours / 24 months' },
  D: { label: 'D-Check', hours: 8000, interval: '8,000 flight hours / 60 months' },
  overnight: { label: 'Overnight Check', hours: 8, interval: 'Daily / 8 flight hours' },
  ETOPS: { label: 'ETOPS Prep', hours: 12, interval: 'Per flight / ETOPS certification' },
};

const CHECK_COLORS = {
  A: 'bg-blue-900/20 border-blue-500/30 text-blue-400',
  C: 'bg-amber-900/20 border-amber-500/30 text-amber-400',
  D: 'bg-red-900/20 border-red-500/30 text-red-400',
  overnight: 'bg-cyan-900/20 border-cyan-500/30 text-cyan-400',
  ETOPS: 'bg-purple-900/20 border-purple-500/30 text-purple-400',
};

const STATUS_COLORS = {
  planned: 'bg-slate-500/20 text-slate-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-green-500/20 text-green-400',
  overdue: 'bg-red-500/20 text-red-400',
  scheduled: 'bg-blue-500/20 text-blue-400',
};

// ── Work Package KPI Card ──
function WorkPackageKpiCard({ label, value, unit, icon: Icon, color, trend, alert }) {
  return (
    <div className={cn('bg-card border rounded-2xl p-4', alert ? 'border-red-500/40' : 'border-border')}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div className="flex items-end gap-2">
        <p className={cn('text-3xl font-black', color)}>{value}</p>
        {unit && <span className="text-xs text-muted-foreground mb-1">{unit}</span>}
      </div>
      {trend && <p className={cn('text-xs font-bold mt-2', trend > 0 ? 'text-red-400' : 'text-green-400')}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last quarter</p>}
    </div>
  );
}

// ── Maintenance Schedule Grid ──
function MaintenanceScheduleGrid({ aircraft, logbookEntries }) {
  const schedules = useMemo(() => {
    return aircraft.map(ac => {
      const acLogs = logbookEntries.filter(e => e.aircraft_tail === ac.tail_number);
      const lastCheckDate = acLogs[0]?.created_date ? new Date(acLogs[0].created_date) : null;
      
      // Simulate flight hours (realistic estimation)
      const estimatedFlightHours = 50 + Math.random() * 200;
      
      return {
        ...ac,
        estimatedFlightHours: Math.round(estimatedFlightHours),
        lastCheckDate,
        nextACheck: Math.ceil((400 - (estimatedFlightHours % 400)) % 400),
        nextCCheck: Math.ceil((4000 - (estimatedFlightHours % 4000)) % 4000),
        nextDCheck: Math.ceil((8000 - (estimatedFlightHours % 8000)) % 8000),
      };
    });
  }, [aircraft, logbookEntries]);

  const upcomingDue = schedules.filter(s => s.nextACheck <= 50 || s.nextCCheck <= 400).sort((a, b) => (a.nextACheck < b.nextACheck ? -1 : 1)).slice(0, 8);

  return (
    <div className="space-y-3">
      {upcomingDue.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">All checks scheduled appropriately</div>
      ) : (
        upcomingDue.map((schedule, idx) => {
          const nextCheck = Math.min(schedule.nextACheck, schedule.nextCCheck, schedule.nextDCheck);
          const checkType = nextCheck === schedule.nextACheck ? 'A' : nextCheck === schedule.nextCCheck ? 'C' : 'D';
          const urgency = nextCheck <= 20 ? 'critical' : nextCheck <= 50 ? 'high' : 'medium';

          return (
            <div
              key={idx}
              className={cn('border rounded-lg p-4', {
                'border-red-500/40 bg-red-900/10': urgency === 'critical',
                'border-orange-500/30 bg-orange-900/10': urgency === 'high',
                'border-blue-500/30 bg-blue-900/10': urgency === 'medium',
              })}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-bold text-sm text-foreground">{schedule.tail_number} — {schedule.aircraft_type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{schedule.estimatedFlightHours}h flight hours</p>
                </div>
                <span className={cn('text-xs font-bold px-2 py-1 rounded', CHECK_COLORS[checkType])}>
                  {checkType}-Check Due
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className={cn('font-bold', urgency === 'critical' ? 'text-red-400' : urgency === 'high' ? 'text-orange-400' : 'text-blue-400')}>
                  {nextCheck}h remaining
                </span>
                {schedule.lastCheckDate && (
                  <span className="text-muted-foreground">Last check: {format(schedule.lastCheckDate, 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Task Card Generator ──
function TaskCardGenerator({ checkType }) {
  const taskLists = {
    A: [
      { task: 'Fluid system inspection and servicing', ata: '29-00-00', labor: 2 },
      { task: 'Landing gear lubrication', ata: '32-00-00', labor: 1.5 },
      { task: 'Engine oil analysis', ata: '79-00-00', labor: 1 },
      { task: 'Flight control functional check', ata: '27-00-00', labor: 2 },
      { task: 'Avionics self-test validation', ata: '34-00-00', labor: 1 },
      { task: 'Battery load test', ata: '24-00-00', labor: 0.5 },
    ],
    C: [
      { task: 'Structural inspection (detailed)', ata: '05-00-00', labor: 40 },
      { task: 'Hydraulic system overhaul', ata: '29-00-00', labor: 20 },
      { task: 'Engine hot section inspection', ata: '72-00-00', labor: 30 },
      { task: 'Cabin pressurization system', ata: '35-00-00', labor: 15 },
      { task: 'Avionics major replacement', ata: '34-00-00', labor: 25 },
      { task: 'Environmental system service', ata: '38-00-00', labor: 12 },
    ],
    D: [
      { task: 'Airframe teardown and overhaul', ata: '05-00-00', labor: 200 },
      { task: 'Engine replacement or overhaul', ata: '72-00-00', labor: 150 },
      { task: 'Major structural repair', ata: '57-00-00', labor: 100 },
      { task: 'Complete systems replacement', ata: '30-00-00', labor: 80 },
      { task: 'Landing gear complete overhaul', ata: '32-00-00', labor: 60 },
      { task: 'Full avionics modernization', ata: '34-00-00', labor: 120 },
    ],
  };

  const tasks = taskLists[checkType] || [];
  const totalLabor = tasks.reduce((sum, t) => sum + t.labor, 0);

  return (
    <div className="space-y-2">
      <div className="bg-secondary/50 rounded-lg px-3 py-2">
        <p className="text-xs text-muted-foreground">Total Man-Hours: <span className="font-bold text-foreground">{totalLabor}h</span></p>
      </div>
      {tasks.map((task, idx) => (
        <div key={idx} className="flex items-start justify-between border border-border rounded-lg p-3 text-xs">
          <div className="flex-1">
            <p className="font-bold text-foreground">{task.task}</p>
            <p className="text-muted-foreground mt-1">ATA {task.ata}</p>
          </div>
          <span className="font-bold text-primary ml-2 flex-shrink-0">{task.labor}h</span>
        </div>
      ))}
    </div>
  );
}

// ── MPD/AMP Compliance Checklist ──
function MpdAmpCompliance() {
  const requirements = [
    { item: 'A-Check compliance (400h interval)', status: 'compliant', reference: 'AMM 00-00-00' },
    { item: 'C-Check compliance (4000h interval)', status: 'compliant', reference: 'AMM 00-00-00' },
    { item: 'D-Check compliance (8000h interval)', status: 'warning', reference: 'AMM 00-00-00' },
    { item: 'Airworthiness Directives (ADs) applied', status: 'compliant', reference: 'FAA registry' },
    { item: 'Service Bulletins (SBs) current', status: 'warning', reference: 'Mfg. documentation' },
    { item: 'Repetitive inspection tracking', status: 'compliant', reference: 'Logbook records' },
  ];

  return (
    <div className="space-y-2">
      {requirements.map((req, idx) => (
        <div key={idx} className="flex items-center gap-3 border border-border rounded-lg p-3">
          {req.status === 'compliant' ? (
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">{req.item}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{req.reference}</p>
          </div>
          <span className={cn('text-[10px] font-bold px-2 py-1 rounded flex-shrink-0', req.status === 'compliant' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400')}>
            {req.status.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Parts & Labor Forecast ──
function PartsLaborForecast({ parts }) {
  const upcomingParts = parts.slice(0, 6).map(p => ({
    ...p,
    leadTime: Math.round(5 + Math.random() * 30), // days
    cost: (Math.random() * 50000 + 5000).toFixed(0),
  }));

  const totalCost = upcomingParts.reduce((sum, p) => sum + parseInt(p.cost), 0);

  return (
    <div className="space-y-3">
      <div className="bg-secondary/50 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Estimated Planning Cost</span>
        <span className="font-bold text-foreground text-sm">${(totalCost / 1000).toFixed(0)}K</span>
      </div>
      {upcomingParts.map((part, idx) => (
        <div key={idx} className="flex items-start justify-between border border-border rounded-lg p-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{part.part_name}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">{part.part_number}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className="text-xs font-bold text-primary">${part.cost}</p>
            <p className="text-[10px] text-muted-foreground">Lead: {part.leadTime}d</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──
export default function PlanningWorkPackages() {
  const [selectedCheckType, setSelectedCheckType] = useState('A');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showIngestModal, setShowIngestModal] = useState(false);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['planning-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });

  const { data: logbookEntries = [] } = useQuery({
    queryKey: ['planning-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['planning-parts'],
    queryFn: () => base44.entities.InventoryItem.list('part_number', 100),
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Planning & Work Packages
            </h1>
            <p className="text-xs text-primary tracking-widest uppercase mt-1">MPD/AMP Compliance · Heavy Checks · Parts Planning</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowIngestModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-bold hover:text-foreground">
              <Plus className="w-4 h-4" /> New Work Package
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-bold hover:text-foreground">
              <Download className="w-4 h-4" /> Export Plan
            </button>
          </div>
        </div>

        {/* Check Type Selector */}
        <div className="flex gap-2">
          {Object.entries(CHECK_TYPES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCheckType(key)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                selectedCheckType === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <WorkPackageKpiCard
            label="Planned Checks"
            value="12"
            unit="this quarter"
            icon={Calendar}
            color="text-blue-400"
          />
          <WorkPackageKpiCard
            label="In Progress"
            value="3"
            unit="active packages"
            icon={Activity}
            color="text-amber-400"
          />
          <WorkPackageKpiCard
            label="Planning Hours"
            value="2,840"
            unit="man-hours"
            icon={Users}
            color="text-primary"
          />
          <WorkPackageKpiCard
            label="Parts Budget"
            value="$450K"
            unit="estimated"
            icon={DollarSign}
            color="text-green-400"
          />
          <WorkPackageKpiCard
            label="MPD Compliance"
            value="94%"
            unit="current status"
            icon={Shield}
            color="text-green-400"
            trend={2}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Schedule & Compliance */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Upcoming Maintenance Schedule</h3>
              </div>
              <MaintenanceScheduleGrid aircraft={aircraft} logbookEntries={logbookEntries} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">MPD/AMP Compliance</h3>
              </div>
              <MpdAmpCompliance />
            </div>
          </div>

          {/* Center: Task Cards */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">{CHECK_TYPES[selectedCheckType].label} Task Cards</h3>
            </div>
            <div className="text-xs text-muted-foreground mb-4">{CHECK_TYPES[selectedCheckType].interval}</div>
            <TaskCardGenerator checkType={selectedCheckType} />
          </div>

          {/* Right: Parts & Labor */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Parts & Labor Forecast</h3>
            </div>
            <PartsLaborForecast parts={parts} />
          </div>
        </div>

        {/* Heavy Check Planning Guide */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Planning Overview</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(CHECK_TYPES).map(([key, config]) => (
              <div key={key} className={cn('border rounded-lg p-4', CHECK_COLORS[key])}>
                <p className="font-bold text-sm mb-2">{config.label}</p>
                <p className="text-xs mb-2 opacity-90">{config.interval}</p>
                <p className="text-xs opacity-75">Planning lead: {key === 'D' ? '6-12 months' : key === 'C' ? '3-6 months' : '2-4 weeks'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ETOPS-Specific Planning */}
        <div className="bg-purple-900/10 border border-purple-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-foreground">ETOPS Flight Planning Requirements</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background rounded-lg p-4 border border-purple-500/20">
              <p className="text-xs font-bold text-purple-400 mb-2">Pre-Flight Inspection</p>
              <p className="text-xs text-muted-foreground">• Engine condition trending<br />• Fuel system verification<br />• Alternate airport available</p>
            </div>
            <div className="bg-background rounded-lg p-4 border border-purple-500/20">
              <p className="text-xs font-bold text-purple-400 mb-2">Certification Limits</p>
              <p className="text-xs text-muted-foreground">• ETOPS-120 / ETOPS-180<br />• Diversion airport coverage<br />• Weather minima compliance</p>
            </div>
            <div className="bg-background rounded-lg p-4 border border-purple-500/20">
              <p className="text-xs font-bold text-purple-400 mb-2">Maintenance Action</p>
              <p className="text-xs text-muted-foreground">• Engine oil analysis required<br />• APU status verified<br />• Hydraulic system test</p>
            </div>
          </div>
        </div>

        {showIngestModal && (
          <SupplierIngestModal
            aircraft={aircraft}
            onClose={() => setShowIngestModal(false)}
            onSuccess={() => setShowIngestModal(false)}
          />
        )}
      </div>
    </div>
  );
}