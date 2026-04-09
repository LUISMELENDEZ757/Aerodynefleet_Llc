import { ChevronDown, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChronicItemsWatchlist({ items = [] }) {
  if (items.length === 0) {
    items = [
      { id: 1, tail: 'N123AB', ata: 'PRI6', system: 'Left Pack Fault', status: 'Chronic', events: 9, dates: ['07.29', '22.29', '22.29'], mel: 82, daysOpen: 82 },
      { id: 2, tail: 'N456GT', ata: 'B000', system: 'Landing Gear Sensor Fault', status: 'Chronic', events: 8, dates: ['02.22', '22.21', '21.21'], mel: 42, daysOpen: 42 },
      { id: 3, tail: 'N789LM', ata: 'RD20', system: 'Yaw Damper INOP', status: 'Troubleshooting', events: 7, dates: ['08.22', '22.29', '22.29'], mel: 81, daysOpen: 81 },
      { id: 4, tail: 'N212GP', ata: 'PRI6', system: 'Main Gree Brake', status: 'Monitoring', events: 6, dates: ['07.22', '22.21', '21.21'], mel: 35, daysOpen: 35 },
    ];
  }

  const statusColors = {
    Chronic: 'bg-red-500/20 text-red-400 border-red-500/40',
    Troubleshooting: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    Monitoring: 'bg-green-500/20 text-green-400 border-green-500/40',
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-foreground">Chronic Items Watchlist</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Tail</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">ATA</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">System / Component</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Discrepancy</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Rpt Events</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Last 3 Dates</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">MEL</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Days Open</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="px-3 py-2.5 font-mono font-bold text-primary">{item.tail}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.ata}</td>
                <td className="px-3 py-2.5 text-xs text-foreground">{item.system}</td>
                <td className="px-3 py-2.5">
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full border', statusColors[item.status] || 'bg-secondary text-muted-foreground')}>
                    {item.status === 'Chronic' && '●'} {item.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-bold text-center text-foreground">{item.events}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.dates.join(', ')}</td>
                <td className="px-3 py-2.5 font-bold text-lg text-orange-400">{item.mel}</td>
                <td className="px-3 py-2.5 font-bold text-foreground">{item.daysOpen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}