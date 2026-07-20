import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import { FleetBadge } from '@/components/fleet/FleetSwitcher';

const METRICS = [
  { key: 'fleet',  label: 'FLEET',   border: 'border-white/25',      text: 'text-white',     value: 'total' },
  { key: 'ots',    label: 'OTS',     border: 'border-[#e74c3c]/40', text: 'text-[#e74c3c]', value: 'outOfSvc' },
  { key: 'inmx',   label: 'IN MX',   border: 'border-[#3498db]/40', text: 'text-[#3498db]', value: 'inWork' },
  { key: 'mine',   label: 'MINE',    border: 'border-[#f1c40f]/40', text: 'text-[#f1c40f]', value: 'mine' },
  { key: 'watch',  label: 'WATCH',   border: 'border-amber-500/40', text: 'text-amber-400', value: 'watch' },
  { key: 'ferry',  label: 'FERRY',   border: 'border-sky-500/40',   text: 'text-sky-400',   value: 'ferry' },
];

export default function FleetCommandHeader({ stats, activeMetric, onMetricClick }) {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const controllerName = user?.full_name || '—';

  return (
    <div className="px-6 pt-5 pb-3">
      {/* Top row: back + title + controller + clock */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-[#1e262e] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase font-mono leading-none">
              Fleet Command
            </h1>
            <p className="text-[11px] text-[#7f8c8d] font-mono tracking-widest uppercase mt-1">
              All Tails · All Stations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#1e262e] border border-white/10 rounded-xl px-4 py-2">
            <p className="text-[9px] font-bold text-[#7f8c8d] uppercase tracking-widest font-mono">Controller on Duty</p>
            <p className="text-sm font-bold text-white font-mono mt-0.5">{controllerName}</p>
          </div>
          <LiveClock />
          <FleetBadge />
        </div>
      </div>

      {/* Metric grid 2x3 */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
        {METRICS.map(m => {
          const value = stats?.[m.value] ?? 0;
          const isActive = activeMetric === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onMetricClick && onMetricClick(isActive ? null : m.key)}
              className={cn(
                'bg-[#1e262e] rounded-xl border p-3 text-left transition-all hover:brightness-110',
                m.border,
                isActive && 'brightness-125 ring-1 ring-white/20'
              )}
            >
              <p className={cn('text-3xl font-black font-mono leading-none', m.text)}>{value}</p>
              <p className="text-[9px] font-bold text-[#7f8c8d] uppercase tracking-widest font-mono mt-1.5">{m.label}</p>
            </button>
          );
        })}
      </div>

      {/* System status line */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-[#7f8c8d] font-mono">System Status</span>
        <span className="w-2 h-2 rounded-full bg-[#2ecd71] animate-pulse" />
        <span className="text-xs font-extrabold text-[#2ecd71] tracking-widest font-mono">OPERATIONAL</span>
      </div>
    </div>
  );
}