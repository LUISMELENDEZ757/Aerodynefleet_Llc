import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { CAT_STATE_CONFIG, CAT_REMEDIATION } from './CatSystemEngine';

const ICONS = {
  ok:       CheckCircle,
  warn:     AlertTriangle,
  degraded: AlertTriangle,
  critical: AlertTriangle,
  unknown:  Info,
};

/**
 * CatStatusBanner
 * Renders the current CAT state with affected systems and remediation guidance.
 *
 * Props:
 *   catResult — return value of computeCatState()
 *   showRemediation — bool (default true), show remediation text
 */
export default function CatStatusBanner({ catResult, showRemediation = true }) {
  if (!catResult || !catResult.state) return null;

  const { state, designMax, affectedSystems } = catResult;
  const cfg = CAT_STATE_CONFIG[state];
  if (!cfg) return null;

  const Icon = ICONS[cfg.severity] || AlertTriangle;
  const remediation = CAT_REMEDIATION[state];

  const designLabel = designMax
    ? designMax.replace('_', ' ').replace('CAT ', 'CAT ')
    : null;

  return (
    <div className={cn('rounded-xl border px-4 py-4 space-y-3', cfg.bg)}>
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        <div className={cn('w-2 h-2 rounded-full mt-1 flex-shrink-0', cfg.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Shield className={cn('w-3.5 h-3.5 flex-shrink-0', cfg.color)} />
            <p className={cn('text-xs font-extrabold uppercase tracking-wider', cfg.color)}>
              {cfg.label}
            </p>
            {designLabel && (
              <span className="text-[10px] text-gray-500 font-mono">
                (Design max: {designLabel.replace('CAT_', 'CAT ')})
              </span>
            )}
          </div>

          {/* Affected systems chips */}
          {affectedSystems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {affectedSystems.map(s => (
                <span key={s.system}
                  className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider', cfg.bg, cfg.color)}>
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', cfg.color)} />
      </div>

      {/* Remediation guidance */}
      {showRemediation && remediation && (
        <div className="border-t border-white/10 pt-2.5">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Required Action</p>
          <p className={cn('text-xs leading-relaxed', cfg.color, 'opacity-80')}>
            {remediation}
          </p>
        </div>
      )}
    </div>
  );
}