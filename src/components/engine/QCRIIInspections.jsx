import { cn } from '@/lib/utils';
import { Shield, CheckCircle, Clock, User } from 'lucide-react';

const RII_ITEMS = [
  {
    id: 'pre_removal_rii',
    label: 'Pre-Removal RII',
    inspector: 'Sarah Mitchell',
    cert: 'A&P 2847593 (RII)',
    status: 'done',
    statusLabel: null,
  },
  {
    id: 'removal_rii',
    label: 'Removal RII',
    assigned: 'John Chen',
    status: 'in_progress',
    statusLabel: 'In Progress',
  },
  {
    id: 'install_rii',
    label: 'Installation RII',
    status: 'pending',
    statusLabel: 'Not Started',
  },
  {
    id: 'final_rii',
    label: 'Final Release RII',
    status: 'pending',
    statusLabel: 'Not Started',
  },
];

function RiiCard({ item }) {
  const isDone      = item.status === 'done';
  const isInProgress = item.status === 'in_progress';

  return (
    <div className={cn(
      'flex-1 min-w-[160px] rounded-xl border p-4 space-y-2',
      isDone       ? 'border-green-500/50 bg-[#0d1117]' :
      isInProgress ? 'border-blue-500/50 bg-[#0d1117]'  :
                     'border-white/10 bg-[#0d1117]'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">{item.label}</p>
        {isDone
          ? <CheckCircle className="w-4 h-4 text-green-400" />
          : <Clock className={cn('w-4 h-4', isInProgress ? 'text-blue-400' : 'text-gray-600')} />
        }
      </div>

      {isDone && (
        <>
          <p className="text-xs text-gray-400">Inspector: {item.inspector}</p>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-primary" />
            <p className="text-[11px] text-primary font-bold font-mono">{item.cert}</p>
          </div>
        </>
      )}

      {isInProgress && (
        <>
          <p className="text-xs text-gray-400">Assigned: {item.assigned}</p>
          <p className="text-xs font-bold text-blue-400">{item.statusLabel}</p>
        </>
      )}

      {item.status === 'pending' && (
        <>
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xs text-gray-600">{item.statusLabel}</p>
        </>
      )}
    </div>
  );
}

export default function QCRIIInspections() {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-extrabold text-yellow-400 tracking-wide">QC/RII Required Inspections</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {RII_ITEMS.map(item => <RiiCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}