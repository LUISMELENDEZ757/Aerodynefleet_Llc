import { Globe, Shield, Radio, Activity, MapPin, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAT_COLORS = { A: 'text-red-400 bg-red-900/30', B: 'text-orange-400 bg-orange-900/30', C: 'text-amber-400 bg-amber-900/30', D: 'text-blue-400 bg-blue-900/30' };

function RestrictionIcon({ show, icon: Icon, label, color }) {
  if (!show) return null;
  return (
    <span title={label} className={cn('inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold', color)}>
      <Icon className="w-3 h-3" />
    </span>
  );
}

export default function OpenMELTable({ melItems, deferrals }) {
  if (melItems.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-base font-bold text-muted-foreground">No Open MEL Items</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-foreground">Open MEL Items ({melItems.length})</h2>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              {['MEL #', 'ATA', 'Description', 'Cat', 'Deferral #', 'Opened', 'Due', 'Restrictions'].map(h => (
                <th key={h} className="px-3 py-3 text-left font-extrabold text-muted-foreground uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {melItems.map(mel => {
              const deferral = deferrals.find(d => d.mel_item_id === mel.id);
              const isExpired = mel.status === 'expired';
              return (
                <tr key={mel.id} className={cn('border-b border-border/50 hover:bg-secondary/20 transition-colors', isExpired && 'bg-red-900/5')}>
                  <td className="px-3 py-3 font-mono font-bold text-primary">{mel.item_number || mel.mel_reference || '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground">{mel.ata_chapter || '—'}</td>
                  <td className="px-3 py-3 text-foreground max-w-xs truncate">{mel.description || '—'}</td>
                  <td className="px-3 py-3">
                    {mel.category && (
                      <span className={cn('px-2 py-0.5 rounded font-bold text-[10px]', CAT_COLORS[mel.category] || 'text-foreground')}>
                        CAT {mel.category}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-muted-foreground">{deferral?.deferral_number || '—'}</td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {mel.deferred_date ? new Date(mel.deferred_date).toLocaleDateString() : deferral?.date_opened ? new Date(deferral.date_opened).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-3">
                    {mel.expiry_date ? (
                      <span className={cn('font-bold whitespace-nowrap', isExpired ? 'text-red-400' : new Date(mel.expiry_date) < new Date(Date.now() + 3 * 86400000) ? 'text-amber-400' : 'text-foreground')}>
                        {new Date(mel.expiry_date).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <RestrictionIcon show={mel.etops_critical || mel.etops_impact !== 'OK'} icon={Globe} label="ETOPS Restriction" color="bg-cyan-900/40 text-cyan-400" />
                      <RestrictionIcon show={mel.flight_restrictions?.includes('RVSM')} icon={Radio} label="RVSM Restriction" color="bg-blue-900/40 text-blue-400" />
                      <RestrictionIcon show={mel.flight_restrictions?.includes('CAT')} icon={Shield} label="CAT Restriction" color="bg-purple-900/40 text-purple-400" />
                      <RestrictionIcon show={!!mel.flight_restrictions?.includes('PERF') || mel.flight_restrictions?.includes('performance')} icon={Activity} label="Performance" color="bg-amber-900/40 text-amber-400" />
                      <RestrictionIcon show={!!mel.flight_restrictions?.includes('ROUTE') || mel.flight_restrictions?.includes('overwater')} icon={MapPin} label="Route Restriction" color="bg-orange-900/40 text-orange-400" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {melItems.map(mel => {
          const deferral = deferrals.find(d => d.mel_item_id === mel.id);
          const isExpired = mel.status === 'expired';
          return (
            <div key={mel.id} className={cn('rounded-2xl border bg-card p-4 space-y-2', isExpired ? 'border-red-500/40' : 'border-border')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-extrabold text-primary font-mono">{mel.item_number || mel.mel_reference || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ATA {mel.ata_chapter || '—'}</p>
                </div>
                {mel.category && (
                  <span className={cn('px-2 py-0.5 rounded font-bold text-[10px]', CAT_COLORS[mel.category] || '')}>CAT {mel.category}</span>
                )}
              </div>
              <p className="text-xs text-foreground">{mel.description}</p>
              {deferral && <p className="text-[10px] text-muted-foreground font-mono">Deferral: {deferral.deferral_number}</p>}
              <div className="flex items-center gap-1 pt-1">
                <RestrictionIcon show={mel.etops_critical} icon={Globe} label="ETOPS" color="bg-cyan-900/40 text-cyan-400" />
                <RestrictionIcon show={mel.flight_restrictions?.includes('RVSM')} icon={Radio} label="RVSM" color="bg-blue-900/40 text-blue-400" />
                <RestrictionIcon show={mel.flight_restrictions?.includes('CAT')} icon={Shield} label="CAT" color="bg-purple-900/40 text-purple-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}