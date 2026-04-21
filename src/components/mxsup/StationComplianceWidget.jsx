import { cn } from '@/lib/utils';

export default function StationComplianceWidget({ 
  title = 'Station Compliance Rate', 
  compliancePercent = 0, 
  total = 0, 
  closed = 0, 
  signed = 0, 
  rejected = 0,
  color = 'text-red-400'
}) {
  const pendingCount = total - closed;
  
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className={cn('text-3xl font-black', color)}>{compliancePercent}%</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div 
            className={cn('h-full rounded-full transition-all', color === 'text-red-400' ? 'bg-red-500' : color === 'text-green-400' ? 'bg-green-500' : 'bg-blue-500')}
            style={{ width: `${compliancePercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        <div className="text-center">
          <p className="text-xl font-black text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground font-semibold">Total</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-green-400">{closed}</p>
          <p className="text-xs text-muted-foreground font-semibold">Closed</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-cyan-400">{signed}</p>
          <p className="text-xs text-muted-foreground font-semibold">Signed</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-red-400">{rejected}</p>
          <p className="text-xs text-muted-foreground font-semibold">Rejected</p>
        </div>
      </div>
    </div>
  );
}