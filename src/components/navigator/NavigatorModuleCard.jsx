import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export default function NavigatorModuleCard({ mod, active, count, onClick }) {
  const Icon = mod.icon;
  const isDisposition = mod.id === 'disposition';

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative text-left p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 flex flex-col gap-2 min-h-[128px] overflow-hidden',
        isDisposition
          ? 'bg-gradient-to-br from-primary/15 to-violet-600/15 border-primary/30 hover:border-primary/50'
          : 'bg-white/[0.04] border-white/10 hover:border-white/25 hover:bg-white/[0.07]',
        active && 'border-primary/60 ring-1 ring-primary/40'
      )}
    >
      <div
        className={cn(
          'absolute -top-12 -right-8 w-28 h-28 rounded-full blur-3xl opacity-40 transition-opacity group-hover:opacity-60',
          isDisposition ? 'bg-primary/40' : 'bg-primary/10'
        )}
      />
      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
            isDisposition ? 'bg-primary/20 text-primary' : 'bg-white/5 text-primary'
          )}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
        {mod.stat ? (
          <span className="text-2xl font-black text-primary leading-none">{count ?? 0}</span>
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        )}
      </div>
      <div className="relative">
        <p className="text-sm font-bold text-foreground leading-tight">{mod.label}</p>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{mod.desc}</p>
      </div>
      {!mod.stat && count > 0 && (
        <span className="relative text-[10px] font-mono text-muted-foreground/80">
          {count} item{count !== 1 ? 's' : ''}
        </span>
      )}
    </button>
  );
}