import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MELControlBoard({ items = [] }) {
  if (items.length === 0) {
    items = [
      { id: 1, tail: 'N782CA', mel: 'W430BF', category: 'AC Bus Fault', description: 'AC Bus Fault', openTime: '14h 22m', expiresIn: '14h 22m', nextAction: 'Break' },
      { id: 2, tail: 'N305RP', mel: 'M433GA', category: 'Power Tomke', description: 'Power Tomke', openTime: '1d 3m', expiresIn: '1d 12m', nextAction: 'Netibank' },
      { id: 3, tail: 'N640BD', mel: 'E32759', category: 'Elos Brier Deferred', description: 'Elos Brier Deferred', openTime: '1d 8h', expiresIn: '1d 8h', nextAction: 'Biengor' },
      { id: 4, tail: 'N819KJ', mel: 'N819KJ', category: 'Autopilot Deferred', description: 'Autopilot Deferred', openTime: '1d 3h', expiresIn: '1d 12m', nextAction: 'Robert' },
    ];
  }

  const categoryColors = {
    'AC Bus Fault': 'text-blue-400',
    'Power Tomke': 'text-yellow-400',
    'Elos Brier Deferred': 'text-green-400',
    'Autopilot Deferred': 'text-purple-400',
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-foreground">MEL Control Board</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Tail</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">MEL No.</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Description</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Open Time</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Expires In</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Next Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isExpiring = item.expiresIn.includes('14h') || item.expiresIn.includes('1d 8h');
              return (
                <tr key={item.id} className={cn('border-b border-border hover:bg-secondary/50 transition-colors', isExpiring && 'bg-orange-500/5')}>
                  <td className="px-3 py-2.5 font-mono font-bold text-primary">{item.tail}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.mel}</td>
                  <td className={cn('px-3 py-2.5 text-xs font-bold', categoryColors[item.category] || 'text-foreground')}>{item.category}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground">{item.description}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {item.openTime}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {isExpiring ? (
                      <span className="flex items-center gap-1 text-orange-400 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> {item.expiresIn}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{item.expiresIn}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-foreground">{item.nextAction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}