import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EngineeringActionQueue({ items = [] }) {
  if (items.length === 0) {
    items = [
      { id: 1, tail: 'N455GT', discrepancy: 'Flap Position Fault', ata: 27, priority: 'High', status: 'Roper', dueDate: 'Apr 24', owner: 'T. Collins' },
      { id: 2, tail: 'N789LM', discrepancy: 'Fregle Fault', ata: 27, priority: 'High', status: 'Roper', dueDate: 'Apr 24', owner: 'D. Delta' },
      { id: 3, tail: 'N789J', discrepancy: 'PP Code Droper', ata: 27, priority: 'High', status: 'Roper', dueDate: 'Apr 21', owner: 'P. Faler' },
      { id: 4, tail: 'H27IEM', discrepancy: 'Deferred Maintenjer Alarm', ata: 27, priority: 'Medium', status: 'Ropen', dueDate: 'Apr 22', owner: 'L. Kosak' },
      { id: 5, tail: 'N212GP', discrepancy: 'Ref-In Air Conditioning Pack Fault', ata: 27, priority: 'High', status: 'Roper', dueDate: 'Apr 22', owner: 'M. Mulhaney' },
    ];
  }

  const priorityColors = {
    'High': 'text-red-400 bg-red-500/20',
    'Medium': 'text-yellow-400 bg-yellow-500/20',
    'Low': 'text-green-400 bg-green-500/20',
  };

  const statusIcons = {
    'Roper': { icon: AlertTriangle, color: 'text-orange-400' },
    'Ropen': { icon: Clock, color: 'text-yellow-400' },
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-foreground">Engineering Action Queue</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Tail</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Discrepancy</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">ATA</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Priority</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Due Date</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Owner</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const StatusIcon = statusIcons[item.status]?.icon || AlertTriangle;
              return (
                <tr key={item.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary">{item.tail}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground max-w-xs truncate">{item.discrepancy}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.ata}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', priorityColors[item.priority] || 'bg-secondary text-muted-foreground')}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center gap-1 w-fit')}>
                      <StatusIcon className="w-3 h-3" /> {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{item.dueDate}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground">{item.owner}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}