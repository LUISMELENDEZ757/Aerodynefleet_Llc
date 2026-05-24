import { Link } from 'react-router-dom';
import { ChevronLeft, Globe, Shield, Radio, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  active:      { label: 'IN SERVICE', bg: 'bg-green-600',   text: 'text-white' },
  oos:         { label: 'AOG',        bg: 'bg-red-600',     text: 'text-white' },
  maintenance: { label: 'MX HOLD',   bg: 'bg-blue-600',    text: 'text-white' },
  retired:     { label: 'RETIRED',   bg: 'bg-gray-600',    text: 'text-white' },
};

function ApprovalBadge({ icon: Icon, label, value, ok, warn }) {
  const color = ok ? 'text-green-400 border-green-600/40 bg-green-900/20'
    : warn ? 'text-amber-400 border-amber-600/40 bg-amber-900/20'
    : 'text-red-400 border-red-600/40 bg-red-900/20';
  return (
    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold', color)}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] text-current/60 mr-0.5">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function AircraftHeader({ aircraft, tailNumber, complianceStatus, openMelCount }) {
  const status = STATUS_CFG[aircraft?.status] ?? STATUS_CFG.active;

  const etopsOk = complianceStatus?.etops_allowed !== false;
  const rvsmOk = complianceStatus?.rvsm_allowed !== false;
  const catOk = complianceStatus?.catii_allowed !== false;
  const severity = complianceStatus?.severity || 'NORMAL';

  const severityColor = {
    NORMAL:     'border-green-600/30 bg-green-900/10',
    LIMITED:    'border-amber-600/30 bg-amber-900/10',
    RESTRICTED: 'border-orange-600/30 bg-orange-900/10',
    BLOCKED:    'border-red-600/30 bg-red-900/10',
  }[severity] || 'border-border';

  return (
    <div className={cn('border-b px-5 pt-5 pb-4', severityColor)}>
      {/* Back nav */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/FleetDashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Fleet
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs font-bold text-primary">{tailNumber}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left — Identity */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Plane className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-primary font-mono tracking-wider">{tailNumber}</h1>
              <span className={cn('px-3 py-1 rounded-lg text-xs font-extrabold', status.bg, status.text)}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-sm font-bold text-foreground">{aircraft?.aircraft_type || '—'}</p>
              {aircraft?.airline && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg">
                  {aircraft.airline}
                </span>
              )}
              {aircraft?.etops_approval && (
                <span className="text-xs font-bold text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded-lg border border-cyan-700/30">
                  ETOPS-{aircraft.etops_approval}
                </span>
              )}
              {openMelCount > 0 && (
                <span className="text-xs font-bold text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-lg border border-amber-700/30">
                  {openMelCount} Open MEL{openMelCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {aircraft?.base_station && (
              <p className="text-xs text-muted-foreground mt-0.5">Base: {aircraft.base_station}</p>
            )}
          </div>
        </div>

        {/* Right — Approval Badges */}
        <div className="flex flex-wrap gap-2">
          <ApprovalBadge
            icon={Globe}
            label="ETOPS"
            value={etopsOk ? 'Authorized' : 'Not Authorized'}
            ok={etopsOk}
            warn={false}
          />
          <ApprovalBadge
            icon={Radio}
            label="RVSM"
            value={rvsmOk ? 'Authorized' : 'Restricted'}
            ok={rvsmOk}
            warn={false}
          />
          <ApprovalBadge
            icon={Shield}
            label="CAT II/III"
            value={catOk ? 'Authorized' : 'Downgraded'}
            ok={catOk}
            warn={!catOk && rvsmOk}
          />
        </div>
      </div>
    </div>
  );
}