import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp, Shield, BarChart3,
  RefreshCw, Plus, ChevronDown, ChevronRight, User, Zap, Activity,
  Flag, Wrench, GitBranch
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TODAY = new Date().toISOString().split('T')[0];

const REPORT_TYPE_CONFIG = {
  asap: { label: 'ASAP', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  safety_incident: { label: 'Safety Incident', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/15' },
  fatigue_report: { label: 'Fatigue Report', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  qa_audit: { label: 'QA Audit', icon: BarChart3, color: 'text-primary', bg: 'bg-primary/15' },
  hazard_tracking: { label: 'Hazard Tracking', icon: Flag, color: 'text-purple-400', bg: 'bg-purple-500/15' },
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'text-green-400', bg: 'bg-green-500/15' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/15' },
  critical: { label: 'Critical', color: 'text-destructive', bg: 'bg-destructive/15' },
};

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-muted-foreground', bg: 'bg-muted' },
  investigating: { label: 'Investigating', color: 'text-primary', bg: 'bg-primary/15' },
  resolved: { label: 'Resolved', color: 'text-green-400', bg: 'bg-green-500/15' },
  closed: { label: 'Closed', color: 'text-muted-foreground', bg: 'bg-muted/40' },
};

// Risk scoring: severity (40%) + status urgency (30%) + time open (30%)
function calculateRiskScore(report) {
  const severityMap = { low: 20, medium: 50, high: 75, critical: 100 };
  const statusMap = { open: 100, investigating: 60, resolved: 30, closed: 0 };
  
  const daysOpen = Math.floor((new Date() - new Date(report.created_date)) / (1000 * 60 * 60 * 24));
  const ageScore = Math.min(100, daysOpen * 5);
  
  const severity = severityMap[report.severity] || 50;
  const status = statusMap[report.status] || 50;
  
  return Math.round(severity * 0.4 + status * 0.3 + ageScore * 0.3);
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ReportCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = REPORT_TYPE_CONFIG[report.report_type] || {};
  const sevConfig = SEVERITY_CONFIG[report.severity] || {};
  const statConfig = STATUS_CONFIG[report.status] || {};
  const riskScore = calculateRiskScore(report);

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', typeConfig.bg)}>
            {typeConfig.icon && <typeConfig.icon className={cn('w-4 h-4', typeConfig.color)} />}
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{report.title}</p>
            <p className="text-xs text-muted-foreground">
              {report.flight_number || report.aircraft_tail || 'N/A'} · {report.reporter_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className={cn('text-xs font-bold', sevConfig.color)}>{sevConfig.label}</p>
            <p className={cn('text-xs font-mono', statConfig.color)}>{statConfig.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('text-xs font-bold px-2 py-0.5 rounded-full', riskScore >= 75 ? 'bg-destructive/15 text-destructive' : riskScore >= 50 ? 'bg-orange-500/15 text-orange-400' : 'bg-green-500/15 text-green-400')}>
              {riskScore}
            </div>
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3 bg-secondary/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-bold text-foreground">{typeConfig.label}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Severity</p>
              <p className={cn('text-sm font-bold', sevConfig.color)}>{sevConfig.label}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={cn('text-sm font-bold', statConfig.color)}>{statConfig.label}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Risk Score</p>
              <p className="text-sm font-bold text-foreground">{riskScore}/100</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold">Description</p>
            <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2">{report.description}</p>
          </div>

          {/* Reporter & Details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Reporter</p>
              <p className="text-xs font-mono text-foreground">{report.reporter_name}</p>
              <p className="text-xs text-muted-foreground">{report.reporter_role}</p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Date Reported</p>
              <p className="text-xs font-mono text-foreground">{report.date_reported}</p>
            </div>
          </div>

          {/* Fatigue-specific */}
          {report.fatigue_level && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-orange-400 mb-1">Fatigue Assessment</p>
              <div className="flex gap-3">
                <span className="text-xs text-foreground">Level: <span className="font-bold">{report.fatigue_level}</span></span>
                {report.rest_hours_prior != null && <span className="text-xs text-foreground">Rest: <span className="font-bold">{report.rest_hours_prior}h</span></span>}
              </div>
            </div>
          )}

          {/* QA-specific */}
          {report.qa_score != null && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-primary mb-2">QA Audit Score: {report.qa_score}/100</p>
              {report.findings?.length > 0 && (
                <div className="space-y-1">
                  {report.findings.map((f, i) => (
                    <div key={i} className="text-xs text-foreground">
                      <p className="font-semibold">{f.description}</p>
                      <p className="text-muted-foreground">Action: {f.corrective_action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hazard-specific */}
          {report.mitigation_steps?.length > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-purple-400 mb-1">Mitigation Steps</p>
              <ul className="text-xs text-foreground space-y-0.5">
                {report.mitigation_steps.map((step, i) => (
                  <li key={i} className="flex gap-2"><span className="text-purple-400">•</span> {step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Assignment & Due Date */}
          {(report.assigned_to || report.due_date) && (
            <div className="grid grid-cols-2 gap-2">
              {report.assigned_to && (
                <div className="bg-background/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="text-xs font-mono text-foreground">{report.assigned_to}</p>
                </div>
              )}
              {report.due_date && (
                <div className="bg-background/40 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-xs font-mono text-foreground">{report.due_date}</p>
                </div>
              )}
            </div>
          )}

          {report.notes && (
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-xs text-foreground">{report.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SafetyQA() {
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['safety-reports'],
    queryFn: () => base44.entities.SafetyReport.list(),
    refetchInterval: 60000,
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Statistics
  const openReports = reports.filter(r => r.status === 'open').length;
  const criticalReports = reports.filter(r => r.severity === 'critical').length;
  const avgRiskScore = reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + calculateRiskScore(r), 0) / reports.length) : 0;
  const resolvedToday = reports.filter(r => r.status === 'closed' && r.updated_date === TODAY).length;

  // Filter
  const filtered = reports.filter(r => {
    if (filterType !== 'all' && r.report_type !== filterType) return false;
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">SAFETY & QA</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Incident Tracking & Risk Management</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-2xl font-mono font-bold text-foreground">{timeStr}</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <button
          onClick={refetch}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Sync reports
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stat bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={AlertTriangle} label="Open Reports" value={openReports} color={openReports > 0 ? 'text-orange-400' : 'text-muted-foreground'} />
          <StatCard icon={Flag} label="Critical" value={criticalReports} color={criticalReports > 0 ? 'text-destructive' : 'text-muted-foreground'} />
          <StatCard icon={TrendingUp} label="Avg Risk Score" value={avgRiskScore} color={avgRiskScore >= 75 ? 'text-destructive' : avgRiskScore >= 50 ? 'text-orange-400' : 'text-green-400'} />
          <StatCard icon={CheckCircle} label="Resolved Today" value={resolvedToday} color={resolvedToday > 0 ? 'text-green-400' : 'text-muted-foreground'} />
        </div>

        {/* Filters */}
        <div className="rounded-xl bg-card border border-border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</p>
          <div className="flex flex-wrap gap-2">
            {/* Report type filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-8 bg-secondary border border-border rounded-lg px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Types</option>
              {Object.entries(REPORT_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="h-8 bg-secondary border border-border rounded-lg px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Severities</option>
              {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports list */}
        <div>
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Safety Reports ({filtered.length})
          </p>
          {isLoading ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Loading reports…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No reports matching filters
            </div>
          ) : (
            <div className="space-y-2">
              {filtered
                .sort((a, b) => calculateRiskScore(b) - calculateRiskScore(a))
                .map(r => (
                  <ReportCard key={r.id} report={r} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}