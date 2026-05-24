import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

// CDL items are MEL items tagged with ATA chapter 06 or explicitly marked as CDL
export function getCDLItems(melItems = []) {
  return melItems.filter(m =>
    m.ata_chapter?.startsWith('06') ||
    m.description?.toLowerCase().includes('cdl') ||
    m.mel_reference?.toLowerCase().includes('cdl') ||
    m.ops_procedure?.toLowerCase().includes('cdl')
  );
}

const CAT_COLORS = {
  A: 'text-red-400 bg-red-900/30',
  B: 'text-orange-400 bg-orange-900/30',
  C: 'text-amber-400 bg-amber-900/30',
  D: 'text-blue-400 bg-blue-900/30',
};

export default function CDLItemsTable({ melItems }) {
  const cdlItems = getCDLItems(melItems);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-extrabold text-foreground">CDL Items</h2>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-[10px] font-extrabold',
          cdlItems.length > 0 ? 'bg-amber-900/30 text-amber-400' : 'bg-green-900/30 text-green-400'
        )}>
          {cdlItems.length}
        </span>
      </div>

      {cdlItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <p className="text-sm font-bold text-green-400">No CDL items — aircraft configuration is standard</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/60 border-b border-border">
                  {['Ref', 'ATA', 'Description', 'Cat', 'Deferred', 'Expires', 'Ops Procedure'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-extrabold text-muted-foreground uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cdlItems.map(item => {
                  const isExpired = item.status === 'expired';
                  return (
                    <tr key={item.id} className={cn('border-b border-border/50 hover:bg-secondary/20', isExpired && 'bg-red-900/5')}>
                      <td className="px-3 py-3 font-mono font-bold text-primary">{item.item_number || item.mel_reference || '—'}</td>
                      <td className="px-3 py-3 text-muted-foreground">{item.ata_chapter || '—'}</td>
                      <td className="px-3 py-3 text-foreground max-w-xs truncate">{item.description || '—'}</td>
                      <td className="px-3 py-3">
                        {item.category && (
                          <span className={cn('px-2 py-0.5 rounded font-bold text-[10px]', CAT_COLORS[item.category] || '')}>
                            CAT {item.category}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                        {item.deferred_date ? new Date(item.deferred_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        {item.expiry_date ? (
                          <span className={cn('font-bold whitespace-nowrap', isExpired ? 'text-red-400' : 'text-foreground')}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground max-w-xs truncate">{item.ops_procedure || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {cdlItems.map(item => (
              <div key={item.id} className="rounded-2xl border border-amber-500/30 bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-extrabold text-primary font-mono">{item.item_number || item.mel_reference || '—'}</p>
                  {item.category && (
                    <span className={cn('px-2 py-0.5 rounded font-bold text-[10px]', CAT_COLORS[item.category] || '')}>CAT {item.category}</span>
                  )}
                </div>
                <p className="text-xs text-foreground">{item.description}</p>
                {item.ops_procedure && (
                  <p className="text-[10px] text-muted-foreground">Procedure: {item.ops_procedure}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}