import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Package, Search, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

export default function LinkPartsModal({ entry, onClose }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [linked, setLinked] = useState([]);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => base44.entities.InventoryItem.list('part_number', 500),
  });

  const decrementMutation = useMutation({
    mutationFn: ({ item, qty }) =>
      base44.entities.InventoryItem.update(item.id, {
        quantity_on_hand: Math.max(0, item.quantity_on_hand - qty),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-items'] }),
  });

  const updateLogMutation = useMutation({
    mutationFn: (partsStr) =>
      base44.entities.LogbookEntry.update(entry.id, { parts_used: partsStr }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lmx-entries'] });
      onClose();
    },
  });

  const filteredInventory = inventory.filter(i =>
    !search ||
    i.part_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.part_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.ata_chapter?.includes(search)
  );

  const addPart = (item) => {
    if (linked.find(l => l.id === item.id)) return;
    setLinked(p => [...p, { ...item, qty_used: 1 }]);
  };

  const setQty = (id, qty) => {
    setLinked(p => p.map(l => l.id === id ? { ...l, qty_used: Math.max(1, parseInt(qty) || 1) } : l));
  };

  const removePart = (id) => setLinked(p => p.filter(l => l.id !== id));

  const handleConfirm = () => {
    // Decrement stock for each linked part
    linked.forEach(l => decrementMutation.mutate({ item: l, qty: l.qty_used }));
    // Save parts_used string to logbook entry
    const partsStr = linked.map(l => `${l.part_number} (${l.qty_used} ${l.unit}) — ${l.part_name}`).join('; ');
    updateLogMutation.mutate(partsStr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <p className="font-extrabold text-white text-sm uppercase tracking-wide">Link Parts to Repair</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Task context */}
          <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Repair Task</p>
            <p className="text-sm text-white font-semibold mt-0.5 line-clamp-2">
              {entry.description?.replace('[LINE MX]', '').replace(/\n.*/g, '').trim()}
            </p>
            <p className="text-[10px] text-primary mt-1">{entry.aircraft_tail} · ATA {entry.ata_chapter || '—'}</p>
          </div>

          {/* Linked parts */}
          {linked.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parts to Use ({linked.length})</p>
              {linked.map(l => (
                <div key={l.id} className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{l.part_name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{l.part_number}</p>
                  </div>
                  <input type="number" min="1" max={l.quantity_on_hand}
                    value={l.qty_used}
                    onChange={e => setQty(l.id, e.target.value)}
                    className="w-14 bg-[#0d1117] border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-center outline-none" />
                  <span className="text-[10px] text-gray-500">{l.unit}</span>
                  <button onClick={() => removePart(l.id)} className="text-gray-500 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search inventory */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Search Inventory</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Part number, name, or ATA…"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary" />
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {filteredInventory.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-6">No inventory items found</p>
              ) : (
                filteredInventory.map(item => {
                  const isLow = item.quantity_on_hand <= item.min_quantity;
                  const isLinked = linked.find(l => l.id === item.id);
                  return (
                    <div key={item.id}
                      className={cn('flex items-center gap-3 rounded-xl px-4 py-3 border transition-all',
                        isLinked ? 'bg-primary/10 border-primary/30' : 'bg-[#0d1117] border-white/8 hover:border-white/20'
                      )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-white truncate">{item.part_name}</p>
                          {isLow && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">{item.part_number} · ATA {item.ata_chapter || '—'} · {item.location || '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={cn('text-sm font-black', isLow ? 'text-red-400' : 'text-green-400')}>{item.quantity_on_hand}</p>
                        <p className="text-[10px] text-gray-600">{item.unit} on hand</p>
                      </div>
                      <button onClick={() => addPart(item)} disabled={!!isLinked || item.quantity_on_hand === 0}
                        className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
                          isLinked ? 'bg-primary/20 text-primary cursor-default' :
                          item.quantity_on_hand === 0 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' :
                          'bg-primary/20 text-primary hover:bg-primary/30'
                        )}>
                        {isLinked ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={linked.length === 0 || updateLogMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Confirm & Deduct Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}