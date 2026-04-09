import { cn } from '@/lib/utils';
import { Wrench, CheckCircle } from 'lucide-react';

const TOOLS = [
  {
    id: 'sling',
    name: 'Engine Sling',
    toolId: 'SLING-CFM-001',
    calDue: '2026-08-22',
    status: 'Current',
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap Kit',
    toolId: 'BOOT-KIT-737-02',
    calDue: '2026-06-15',
    status: 'Current',
  },
  {
    id: 'torque',
    name: 'Torque Wrench Set',
    toolId: 'TRQ-SET-014',
    calDue: '2026-05-30',
    status: 'Current',
  },
  {
    id: 'lifting',
    name: 'Lifting Equipment',
    toolId: null,
    extra: 'Fork Lift #4 Reserved',
    status: 'Inspection Current ✓',
  },
];

function ToolRow({ tool }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] p-4 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">{tool.name}</p>
        <CheckCircle className="w-4 h-4 text-green-400" />
      </div>
      {tool.toolId && <p className="text-xs text-gray-400">Tool ID: {tool.toolId}</p>}
      {tool.extra && <p className="text-xs text-gray-400">{tool.extra}</p>}
      <p className="text-xs font-bold text-green-400">
        {tool.calDue ? `Cal Due: ${tool.calDue} ✓ ${tool.status}` : tool.status}
      </p>
    </div>
  );
}

export default function ToolingReservations() {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-yellow-400" />
        <h3 className="text-sm font-extrabold text-yellow-400 tracking-wide">Tooling Reservations</h3>
      </div>
      <div className="space-y-3">
        {TOOLS.map(t => <ToolRow key={t.id} tool={t} />)}
      </div>
    </div>
  );
}