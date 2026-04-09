import { cn } from '@/lib/utils';
import { Package, CheckCircle, Eye } from 'lucide-react';

const PARTS = [
  {
    id: 'rep_engine',
    name: 'Replacement Engine',
    detail: 'S/N: CFM56-7B27-912445',
    meta1Label: 'TSO',
    meta1: '450 hrs',
    meta2Label: 'Location',
    meta2: 'On Stand - Ready',
    meta2Color: 'text-green-400',
    border: 'border-green-500/40',
    checked: true,
  },
  {
    id: 'qec_kit',
    name: 'QEC Kit',
    detail: 'All Components Verified',
    extra: 'Cowlings, Mounts, Lines, Accessories',
    border: 'border-blue-500/40',
    checked: true,
  },
  {
    id: 'engine_stand',
    name: 'Engine Stand',
    detail: 'Stand #7 - Available',
    extra: 'Inspection Due: 2026-04-15',
    border: 'border-purple-500/40',
    checked: true,
  },
];

function PartRow({ part }) {
  return (
    <div className={cn('rounded-xl border bg-[#0d1117] p-4 space-y-1', part.border)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">{part.name}</p>
        <div className="flex items-center gap-2">
          {part.checked && <CheckCircle className="w-4 h-4 text-green-400" />}
          <Eye className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      <p className="text-xs text-gray-400">{part.detail}</p>
      {(part.meta1 || part.meta2) && (
        <div className="flex gap-6 pt-1">
          {part.meta1 && (
            <div>
              <p className="text-[10px] text-gray-500">{part.meta1Label}</p>
              <p className="text-xs font-bold text-white">{part.meta1}</p>
            </div>
          )}
          {part.meta2 && (
            <div>
              <p className="text-[10px] text-gray-500">{part.meta2Label}</p>
              <p className={cn('text-xs font-bold', part.meta2Color || 'text-white')}>{part.meta2}</p>
            </div>
          )}
        </div>
      )}
      {part.extra && <p className="text-xs text-gray-400">{part.extra}</p>}
    </div>
  );
}

export default function PartsEngineStatus() {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-extrabold text-yellow-400 tracking-wide">Parts & Engine Status</h3>
      </div>
      <div className="space-y-3">
        {PARTS.map(p => <PartRow key={p.id} part={p} />)}
      </div>
    </div>
  );
}