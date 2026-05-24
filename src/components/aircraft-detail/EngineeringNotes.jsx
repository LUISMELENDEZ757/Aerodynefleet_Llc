import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EngineeringNotes({ logEntries, tailNumber }) {
  const engineeringEntries = logEntries.filter(e =>
    e.troubleshooting_notes ||
    e.entry_type === 'info' ||
    (e.notes && e.notes.length > 20)
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-extrabold text-foreground">Engineering Notes</h2>

      {engineeringEntries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-base font-bold text-muted-foreground">No engineering notes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {engineeringEntries.map(entry => (
            <div key={entry.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                    {entry.entry_type}
                  </span>
                  {entry.ata_chapter && (
                    <span className="text-[10px] text-muted-foreground">ATA {entry.ata_chapter}</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">{new Date(entry.created_date).toLocaleString()}</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{entry.description}</p>
              {entry.troubleshooting_notes && (
                <div className="bg-secondary/40 rounded-xl px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Troubleshooting Notes</p>
                  <p className="text-xs text-foreground">{entry.troubleshooting_notes}</p>
                </div>
              )}
              {entry.notes && (
                <div className="bg-secondary/40 rounded-xl px-3 py-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-xs text-foreground">{entry.notes}</p>
                </div>
              )}
              {entry.technician_name && (
                <p className="text-[10px] text-muted-foreground">By: {entry.technician_name} {entry.technician_id ? `(${entry.technician_id})` : ''}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}