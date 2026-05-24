import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X, Globe, Shield, Radio, Zap, Wind, Gauge, Weight, Cpu, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_CFG = {
  NORMAL:     { color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-600/40',  label: 'No Restrictions' },
  LIMITED:    { color: 'text-amber-400',  bg: 'bg-amber-900/20',  border: 'border-amber-600/40',  label: 'Limited Operations' },
  RESTRICTED: { color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-600/40', label: 'Restricted Operations' },
  BLOCKED:    { color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-600/40',    label: 'Dispatch Blocked' },
};

function buildRestrictions(melItems, complianceStatus) {
  const restrictions = [];
  const cs = complianceStatus || {};

  if (cs.etops_allowed === false || melItems.some(m => m.etops_impact === 'NO_ETOPS')) {
    restrictions.push({ id: 'etops', label: 'NO ETOPS', icon: Globe, color: 'text-red-400 bg-red-900/20 border-red-600/40', mel: melItems.find(m => m.etops_impact === 'NO_ETOPS') });
  }
  if (cs.rvsm_allowed === false) {
    restrictions.push({ id: 'rvsm', label: 'NO RVSM', icon: Radio, color: 'text-red-400 bg-red-900/20 border-red-600/40', mel: null });
  }
  if (cs.catii_allowed === false) {
    restrictions.push({ id: 'cat', label: 'CAT II/III DOWNGRADE', icon: Shield, color: 'text-orange-400 bg-orange-900/20 border-orange-600/40', mel: null });
  }
  if (cs.apu_required) {
    restrictions.push({ id: 'apu', label: 'APU REQUIRED FOR DISPATCH', icon: Cpu, color: 'text-amber-400 bg-amber-900/20 border-amber-600/40', mel: null });
  }
  if (cs.altitude_limit) {
    restrictions.push({ id: 'alt', label: `ALT LIMIT: ${cs.altitude_limit}`, icon: Wind, color: 'text-amber-400 bg-amber-900/20 border-amber-600/40', mel: null });
  }
  if (cs.speed_limit) {
    restrictions.push({ id: 'spd', label: `SPEED LIMIT: ${cs.speed_limit}`, icon: Gauge, color: 'text-amber-400 bg-amber-900/20 border-amber-600/40', mel: null });
  }
  if (cs.route_limited) {
    restrictions.push({ id: 'route', label: 'NO OVERWATER OPS', icon: Globe, color: 'text-orange-400 bg-orange-900/20 border-orange-600/40', mel: null });
  }
  if (cs.crew_procedures_required) {
    restrictions.push({ id: 'crew', label: 'CREW PROCEDURES REQUIRED', icon: AlertTriangle, color: 'text-yellow-400 bg-yellow-900/20 border-yellow-600/40', mel: null });
  }
  if (cs.dispatch_procedures_required) {
    restrictions.push({ id: 'dispatch', label: 'DISPATCH PROCEDURES REQUIRED', icon: AlertTriangle, color: 'text-yellow-400 bg-yellow-900/20 border-yellow-600/40', mel: null });
  }
  if (cs.fire_protection_limit) {
    restrictions.push({ id: 'fire', label: `FIRE PROT: ${cs.fire_protection_limit}`, icon: Flame, color: 'text-red-400 bg-red-900/20 border-red-600/40', mel: null });
  }

  // Auto-derive from melItems if no compliance status
  melItems.forEach(m => {
    if (m.etops_impact === 'ETOPS_WITH_LIMITS' && !restrictions.find(r => r.id === 'etops_limit')) {
      restrictions.push({ id: 'etops_limit', label: `ETOPS LIMITED: ${m.etops_limit_rating || '?'} MIN`, icon: Globe, color: 'text-amber-400 bg-amber-900/20 border-amber-600/40', mel: m });
    }
  });

  return restrictions;
}

function RestrictionDrawer({ restriction, melItems, deferrals, onClose }) {
  const mel = restriction.mel || melItems.find(m =>
    restriction.id === 'etops' ? m.etops_impact === 'NO_ETOPS' : false
  );
  const deferral = mel ? deferrals.find(d => d.mel_item_id === mel.id) : null;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-[#141922] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-foreground">{restriction.label}</p>
        <button onClick={onClose} className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
      {mel ? (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-muted-foreground">MEL Reference</p>
              <p className="font-bold text-foreground">{mel.item_number || mel.mel_reference || '—'}</p>
            </div>
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-muted-foreground">ATA Chapter</p>
              <p className="font-bold text-foreground">{mel.ata_chapter || '—'}</p>
            </div>
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-muted-foreground">Category</p>
              <p className="font-bold text-foreground">{mel.category ? `CAT ${mel.category}` : '—'}</p>
            </div>
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-muted-foreground">Status</p>
              <p className={cn('font-bold', mel.status === 'expired' ? 'text-red-400' : 'text-amber-400')}>
                {mel.status?.toUpperCase() || 'OPEN'}
              </p>
            </div>
          </div>
          {deferral && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary/40 rounded-lg px-3 py-2">
                <p className="text-muted-foreground">Deferral #</p>
                <p className="font-bold text-foreground font-mono">{deferral.deferral_number}</p>
              </div>
              <div className="bg-secondary/40 rounded-lg px-3 py-2">
                <p className="text-muted-foreground">Date Opened</p>
                <p className="font-bold text-foreground">{deferral.date_opened ? new Date(deferral.date_opened).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          )}
          {(mel.etops_notes || mel.flight_restrictions) && (
            <div className="bg-secondary/40 rounded-lg px-3 py-2">
              <p className="text-muted-foreground mb-1">Notes</p>
              <p className="text-foreground">{mel.etops_notes || mel.flight_restrictions}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Derived from aggregate MEL compliance status. Review individual MEL items for source details.</p>
      )}
    </div>
  );
}

export default function RestrictedMELPanel({ melItems, complianceStatus, deferrals }) {
  const [expanded, setExpanded] = useState(null);

  const severity = complianceStatus?.severity || (melItems.length > 0 ? 'LIMITED' : 'NORMAL');
  const cfg = SEVERITY_CFG[severity] || SEVERITY_CFG.NORMAL;
  const restrictions = buildRestrictions(melItems, complianceStatus);

  // Build summary text
  const summaryParts = [];
  if (restrictions.length === 0) summaryParts.push('No active MEL-driven operational restrictions.');
  else {
    summaryParts.push(`This aircraft has ${restrictions.length} active MEL-related restriction${restrictions.length > 1 ? 's' : ''}.`);
    const noEtops = restrictions.find(r => r.id === 'etops');
    const noRvsm = restrictions.find(r => r.id === 'rvsm');
    const noCat = restrictions.find(r => r.id === 'cat');
    const parts = [];
    if (noEtops) parts.push('ETOPS not authorized');
    if (noRvsm) parts.push('RVSM not authorized');
    if (noCat) parts.push('CAT II/III downgraded');
    if (parts.length) summaryParts.push(parts.join('. ') + '.');
  }

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className={cn('rounded-2xl border p-5', cfg.border, cfg.bg)}>
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className={cn('w-5 h-5', cfg.color)} />
          <h2 className="text-base font-extrabold text-foreground">Operational Restrictions (MEL-Driven)</h2>
          <span className={cn('ml-auto px-3 py-1 rounded-full text-xs font-extrabold border', cfg.color, cfg.border)}>
            {cfg.label}
          </span>
        </div>

        {/* Summary Bar */}
        <p className={cn('text-sm font-medium mb-4', cfg.color)}>
          {summaryParts.join(' ')}
        </p>

        {/* Restriction Tags */}
        {restrictions.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {restrictions.map(r => {
                const Icon = r.icon;
                const isOpen = expanded === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all',
                      r.color,
                      isOpen && 'ring-2 ring-white/20'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {r.label}
                    {isOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Expandable Drawer */}
            {expanded && (
              <RestrictionDrawer
                restriction={restrictions.find(r => r.id === expanded)}
                melItems={melItems}
                deferrals={deferrals}
                onClose={() => setExpanded(null)}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <p className="text-sm font-bold">All systems authorized — no MEL restrictions active</p>
          </div>
        )}
      </div>
    </div>
  );
}