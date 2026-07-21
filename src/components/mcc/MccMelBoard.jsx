import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAT_COLOR = { A: 'text-red-400 bg-red-500/20', B: 'text-orange-400 bg-orange-500/20', C: 'text-amber-400 bg-amber-500/20', D: 'text-blue-400 bg-blue-500/20' };
const STATUS_COLOR = {
  open:           'text-amber-400 bg-amber-500/20',
  expiring_soon:  'text-orange-400 bg-orange-500/20',
  expired:        'text-red-400 bg-red-500/20',
  cleared:        'text-green-400 bg-green-500/20',
};

export default function MccMelBoard({ melItems, aircraft }) {
  const qc = useQueryClient();
  const clearMutation = useMutation({
    mutationFn: async (item) => {
      const me = await base44.auth.me();
      return base44.entities.MELItem.update(item.id, {
        status: 'cleared',
        cleared_date: new Date().toISOString().split('T')[0],
        cleared_by: me.full_name,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mcc-mel'] }),
  });
  const open     = melItems.filter(m => m.status !== 'cleared').sort((a, b) => {
    const order = { expired: 0, expiring_soon: 1, open: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });
  const expired  = melItems.filter(m => m.status === 'expired').length;
  const expiring = melItems.filter(m => m.status === 'expiring_soon').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">MEL — Minimum Equipment List</p>
        <Link to="/MEL" className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300">
          MEL Dashboard <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {expired > 0 && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-extrabold text-red-400">{expired} Expired MEL Item{expired > 1 ? 's' : ''}</p>
            <p className="text-xs text-red-300/80">Immediate action required — aircraft may not be airworthy</p>
          </div>
        </div>
      )}

      {expiring > 0 && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-300">{expiring} item{expiring > 1 ? 's' : ''} expiring soon — review required</p>
        </div>
      )}

      {open.length === 0 ? (
        <div className="bg-green-900/20 border border-green-500/30 rounded-2xl px-5 py-10 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-bold">No open MEL items</p>
        </div>
      ) : (
        <div className="space-y-3">
          {open.map(item => (
            <div key={item.id} className={cn('bg-[#141922] border rounded-2xl p-4 space-y-2', item.status === 'expired' ? 'border-red-500/30' : 'border-white/10')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white font-mono text-sm">{item.aircraft_tail}</span>
                  {item.category && <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', CAT_COLOR[item.category] || CAT_COLOR.D)}>CAT {item.category}</span>}
                  {item.ata_chapter && <span className="text-[10px] text-gray-500">ATA {item.ata_chapter}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg', STATUS_COLOR[item.status] || STATUS_COLOR.open)}>
                    {item.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <button
                    onClick={() => clearMutation.mutate(item)}
                    disabled={clearMutation.isPending}
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300">{item.description}</p>
              <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                {item.deferred_date && <span>Deferred: {item.deferred_date}</span>}
                {item.expiry_date   && <span className={item.status === 'expired' ? 'text-red-400 font-bold' : ''}>Expires: {item.expiry_date}</span>}
                {item.item_number   && <span>Item: {item.item_number}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}