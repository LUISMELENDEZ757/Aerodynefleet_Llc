import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, AlertTriangle, CheckCircle, Clock, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

const AVIONICS_ATA_CHAPTERS = ['23', '24', '25', '34', '35', '45', '46'];

export default function AvionicsWriteUpsTab({ typeFilter, aircraft }) {
  const [selectedTail, setSelectedTail] = useState('');

  const { data: logbookEntries = [], isLoading } = useQuery({
    queryKey: ['avionics-writeups', typeFilter],
    queryFn: async () => {
      const entries = await base44.entities.LogbookEntry.list('-created_date', 1000);
      return entries.filter(e => 
        AVIONICS_ATA_CHAPTERS.includes(e.ata_chapter) && 
        e.entry_type === 'discrepancy'
      );
    },
    refetchInterval: 60000,
  });

  // Filter by aircraft type
  const filteredByType = typeFilter === 'All Types' 
    ? logbookEntries 
    : logbookEntries.filter(e => {
        const ac = aircraft.find(a => a.tail_number === e.aircraft_tail);
        return ac?.aircraft_type === typeFilter;
      });

  // Further filter by selected tail if specified
  const filtered = selectedTail 
    ? filteredByType.filter(e => e.aircraft_tail === selectedTail)
    : filteredByType;

  // Get unique tails for current type filter
  const uniqueTails = [...new Set(
    filteredByType.map(e => e.aircraft_tail)
  )].sort();

  // Group by aircraft tail
  const byTail = {};
  filtered.forEach(entry => {
    if (!byTail[entry.aircraft_tail]) {
      byTail[entry.aircraft_tail] = [];
    }
    byTail[entry.aircraft_tail].push(entry);
  });

  const openCount = filtered.filter(e => e.discrepancy_status === 'OPEN').length;
  const inProgressCount = filtered.filter(e => e.discrepancy_status === 'IN_PROGRESS').length;
  const closedCount = filtered.filter(e => e.discrepancy_status === 'CLOSED').length;

  const getStatusColor = (status) => {
    switch(status) {
      case 'OPEN':
        return 'bg-red-500/20 text-red-400';
      case 'IN_PROGRESS':
        return 'bg-amber-500/20 text-amber-400';
      case 'CLOSED':
        return 'bg-green-500/20 text-green-400';
      case 'PENDING_RII':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getATALabel = (ata) => {
    const labels = {
      '23': 'Comm/Avionics',
      '24': 'Electrical Power',
      '25': 'Equipment/Furnishings',
      '34': 'Flight Controls',
      '35': 'Oxygen System',
      '45': 'Central Maint Computer',
      '46': 'Information Systems',
    };
    return labels[ata] || `ATA ${ata}`;
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#141922] border border-white/8 rounded-xl px-4 py-3">
          <p className="text-2xl font-black text-white">{filtered.length}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Write-ups</p>
        </div>
        <div className="bg-[#141922] border border-white/8 rounded-xl px-4 py-3">
          <p className="text-2xl font-black text-red-400">{openCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Open</p>
        </div>
        <div className="bg-[#141922] border border-white/8 rounded-xl px-4 py-3">
          <p className="text-2xl font-black text-amber-400">{inProgressCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">In Progress</p>
        </div>
        <div className="bg-[#141922] border border-white/8 rounded-xl px-4 py-3">
          <p className="text-2xl font-black text-green-400">{closedCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Closed</p>
        </div>
      </div>

      {/* Aircraft tail filter */}
      {uniqueTails.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Filter by Aircraft</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedTail('')}
              className={cn('text-[10px] font-bold px-3 py-2 rounded-lg border transition-all',
                selectedTail === '' 
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-white/10 text-gray-400 hover:text-white')}>
              All
            </button>
            {uniqueTails.map(tail => (
              <button key={tail} onClick={() => setSelectedTail(tail)}
                className={cn('text-[10px] font-bold px-3 py-2 rounded-lg border transition-all font-mono',
                  selectedTail === tail
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-white/10 text-gray-400 hover:text-white')}>
                {tail}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <FileText className="w-12 h-12 text-gray-700" />
          <p className="text-gray-500 font-bold">No avionics write-ups found</p>
          <p className="text-gray-600 text-xs">Avionics discrepancies will appear here</p>
        </div>
      )}

      {/* Write-ups by aircraft */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {Object.entries(byTail).map(([tail, entries]) => (
            <div key={tail} className="bg-[#141922] border border-white/8 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <Plane className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-extrabold text-white font-mono">{tail}</p>
                <span className="text-[10px] text-gray-600 ml-auto">{entries.length} item(s)</span>
              </div>

              <div className="space-y-2">
                {entries.map((entry, i) => (
                  <div key={i} className="bg-[#0d1117] rounded-lg p-3 space-y-1.5 border border-white/5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{entry.description}</p>
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-400">
                            {getATALabel(entry.ata_chapter)}
                          </span>
                          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded', getStatusColor(entry.discrepancy_status))}>
                            {entry.discrepancy_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Technician info */}
                    {entry.technician_name && (
                      <p className="text-[10px] text-gray-500">
                        Logged by: <span className="text-gray-300 font-semibold">{entry.technician_name}</span>
                      </p>
                    )}

                    {/* Corrective action */}
                    {entry.corrective_action && (
                      <div className="bg-white/5 rounded px-2 py-1.5 border border-white/5">
                        <p className="text-[9px] text-gray-500 mb-0.5">Corrective Action:</p>
                        <p className="text-[10px] text-gray-300">{entry.corrective_action}</p>
                      </div>
                    )}

                    {/* RII info */}
                    {entry.rii_required && (
                      <p className="text-[9px] font-bold text-blue-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> RII Inspection Required
                        {entry.rii_inspector_name && ` - Inspected by ${entry.rii_inspector_name}`}
                      </p>
                    )}

                    {/* Dates */}
                    <p className="text-[9px] text-gray-600">
                      Logged: {new Date(entry.created_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}