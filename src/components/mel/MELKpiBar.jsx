import { AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function KpiCard({ label, value, unit, color, icon: Icon, trend, onClick }) {
  return (
    <button onClick={onClick}
      className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-primary/40 transition-colors text-left">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-black text-foreground">{value}</p>
          {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
        </div>
      </div>
      {trend && (
        <div className={cn('text-xs font-bold px-2 py-1 rounded-full', trend > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400')}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </button>
  );
}

export default function MELKpiBar({ stats = {} }) {
  const {
    openMels = 42,
    chronicItems = 18,
    repeatWriteUps = 27,
    melsExpiring = { urgent: 6, warning: 4, watch: 3 },
    highDefectAircraft = 5,
    deferredActions = 0,
    topAtaCode = '36',
    topAtaLabel = 'Hydraulics',
    aogRiskAircraft = 2,
  } = stats;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      <KpiCard label="Open MELs" value={openMels} color="bg-blue-500/20 text-blue-400" icon={AlertTriangle} />
      <KpiCard label="Chronic Items" value={chronicItems} color="bg-orange-500/20 text-orange-400" icon={TrendingUp} />
      <KpiCard label="Repeat Write-Ups" value={repeatWriteUps} color="bg-yellow-500/20 text-yellow-400" icon={AlertTriangle} />
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">MELs Expiring</p>
        <div className="flex gap-1.5 mt-2">
          <span className="text-lg font-black text-red-400">{melsExpiring.urgent}</span>
          <span className="text-lg font-black text-yellow-400">{melsExpiring.warning}</span>
          <span className="text-lg font-black text-blue-400">{melsExpiring.watch}</span>
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">High Defect</p>
        <p className="text-2xl font-black text-foreground mt-1">{highDefectAircraft}</p>
        <p className="text-[10px] text-muted-foreground">Aircraft</p>
      </div>
    </div>
  );
}