import { MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_CFG = {
  info:              { label: 'INFO',        bg: 'bg-blue-900/60',   text: 'text-blue-300' },
  discrepancy:       { label: 'DISCREPANCY', bg: 'bg-red-900/60',    text: 'text-red-300' },
  corrective_action: { label: 'CORRECTED',   bg: 'bg-green-900/60',  text: 'text-green-300' },
  deferred:          { label: 'DEFERRED',    bg: 'bg-amber-900/60',  text: 'text-amber-300' },
  cleared:           { label: 'CLEARED',     bg: 'bg-sky-900/60',    text: 'text-sky-300' },
};

export default function MxTimelineEventCard({ entry }) {
  const typeKey = entry.is_cleared ? 'cleared' : entry.entry_type;
  const cfg = TYPE_CFG[typeKey] || TYPE_CFG.info;

  // Best-effort phone extraction from notes (POC Phone / raw number)
  const phone = /(\+?\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/.exec(entry.notes || '')?.[1];

  return (
    <div className="bg-[#141922] border border-white/8 rounded-2xl px-5 py-4 flex gap-3">
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded', cfg.bg, cfg.text)}>{cfg.label}</span>
          {entry.ata_chapter && <span className="text-[10px] font-bold text-gray-500">ATA {entry.ata_chapter}</span>}
          {entry.log_page && <span className="text-[10px] font-mono text-gray-600">{entry.log_page}</span>}
        </div>
        <p className="text-sm text-gray-100 font-semibold leading-snug">{entry.description}</p>
        <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11px] text-gray-500">
          <span>{new Date(entry.created_date).toLocaleString()}</span>
          {entry.station && (
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <MapPin className="w-3 h-3" /> {entry.station}
            </span>
          )}
          {entry.technician_name && (
            <span className="flex items-center gap-1 text-yellow-500 font-bold">
              <User className="w-3 h-3" /> {entry.technician_name}{phone ? ` · ${phone}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}