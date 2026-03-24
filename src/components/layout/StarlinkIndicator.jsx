import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Satellite } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarlinkIndicator() {
  const { data: terminals = [] } = useQuery({
    queryKey: ['starlink-terminals-indicator'],
    queryFn: () => base44.entities.StarlinkTerminal.list(),
    refetchInterval: 30000,
  });

  const active = terminals.filter(t => t.activation_status === 'active');
  const statusColor = active.length > 0 ? 'text-green-400' : 'text-muted-foreground';
  const statusBg = active.length > 0 ? 'bg-green-500/20' : 'bg-secondary';

  return (
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-colors', statusBg)}>
      <Satellite className={cn('w-5 h-5', statusColor)} />
    </div>
  );
}