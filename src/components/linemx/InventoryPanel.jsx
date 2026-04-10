import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, AlertTriangle, Plus, X, Search, Edit2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputCls = 'w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary';

function AddItemModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    part_number: '', part_name: '', ata_chapter: '', quantity_on_hand: 1,
    min_quantity: 2, unit: 'ea', location: '', station: '', unit_cost: '', supplier: '',
    me_number: '', pcn: '', sceptre_id: '', amos_id: '', trax_id: '', nsn: '', cage_code: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      quantity_on_hand: Number(form.quantity_on_hand),
      min_quantity: Number(form.min_quantity),
      unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-[#141922] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="font-extrabold text-white text-sm uppercase tracking-wide">Add Inventory Item</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><X className="w-4 h-4 text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Part Number *</label>
              <input required value={form.part_number} onChange={e => set('part_number', e.target.value)} placeholder="e.g. 65-48253-2" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">ATA Chapter</label>
              <input value={form.ata_chapter} onChange={e => set('ata_chapter', e.target.value)} placeholder="e.g. 79" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Part Name *</label>
            <input required value={form.part_name} onChange={e => set('part_name', e.target.value)} placeholder="e.g. Oil Filter" className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Qty on Hand</label>
              <input type="number" min="0" value={form.quantity_on_hand} onChange={e => set('quantity_on_hand', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Min Qty</label>
              <input type="number" min="0" value={form.min_quantity} onChange={e => set('min_quantity', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={inputCls}>
                {['ea','qt','lbs','ft','kit'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bin 12A" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Station</label>
              <input value={form.station} onChange={e => set('station', e.target.value.toUpperCase())} placeholder="KEWR" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Unit Cost ($)</label>
              <input type="number" min="0" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Supplier</label>
              <input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Aviall, Boeing, Heico…" className={inputCls} />
            </div>
          </div>

          {/* Alternate numbering systems */}
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Airline & MRO System References</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">M&amp;E Number</label>
                <input value={form.me_number} onChange={e => set('me_number', e.target.value)} placeholder="e.g. ME-00045321" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">PCN (Part Control #)</label>
                <input value={form.pcn} onChange={e => set('pcn', e.target.value)} placeholder="e.g. PCN-88234" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">SCEPTRE ID</label>
                <input value={form.sceptre_id} onChange={e => set('sceptre_id', e.target.value)} placeholder="SCEPTRE ref" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">AMOS ID</label>
                <input value={form.amos_id} onChange={e => set('amos_id', e.target.value)} placeholder="AMOS ref" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">TRAX ID</label>
                <input value={form.trax_id} onChange={e => set('trax_id', e.target.value)} placeholder="TRAX ref" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">NSN / CAGE Code</label>
                <input value={form.nsn} onChange={e => set('nsn', e.target.value)} placeholder="NSN or CAGE" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'low' | 'out'

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => base44.entities.InventoryItem.list('part_number', 500),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-items'] }),
  });

  const updateQtyMutation = useMutation({
    mutationFn: ({ id, qty }) => base44.entities.InventoryItem.update(id, { quantity_on_hand: qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-items'] }),
  });

  const lowStock = inventory.filter(i => i.quantity_on_hand > 0 && i.quantity_on_hand <= i.min_quantity);
  const outOfStock = inventory.filter(i => i.quantity_on_hand === 0);

  const filtered = inventory.filter(i => {
    const matchSearch = !search ||
      i.part_number?.toLowerCase().includes(search.toLowerCase()) ||
      i.part_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.ata_chapter?.includes(search) ||
      i.location?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low') return matchSearch && i.quantity_on_hand > 0 && i.quantity_on_hand <= i.min_quantity;
    if (filter === 'out') return matchSearch && i.quantity_on_hand === 0;
    return matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Alerts Banner */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-2">
          {outOfStock.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-2xl px-4 py-3">
              <p className="text-xs font-extrabold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> {outOfStock.length} Part{outOfStock.length > 1 ? 's' : ''} Out of Stock
              </p>
              <div className="flex flex-wrap gap-2">
                {outOfStock.map(i => (
                  <span key={i.id} className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-800/40 border border-red-500/40 text-red-300">
                    {i.part_number} — {i.part_name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl px-4 py-3">
              <p className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> {lowStock.length} Low-Stock Alert{lowStock.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStock.map(i => (
                  <span key={i.id} className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-800/30 border border-amber-500/30 text-amber-300">
                    {i.part_number} ({i.quantity_on_hand}/{i.min_quantity} min)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search part number, name, ATA, location…"
            className="w-full bg-[#141922] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: `All (${inventory.length})` },
            { id: 'low', label: `Low (${lowStock.length})` },
            { id: 'out', label: `Out (${outOfStock.length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn('px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all',
                filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white')}>
              {f.label}
            </button>
          ))}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Part
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <div className="text-center text-gray-600 text-sm py-12">Loading inventory…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#141922] border border-white/10 py-16 text-center space-y-3">
          <Package className="w-10 h-10 text-gray-700 mx-auto" />
          <p className="font-extrabold text-gray-500">No inventory items found</p>
          <button onClick={() => setShowAdd(true)}
            className="px-5 py-2 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-500 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add First Part
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const isOut = item.quantity_on_hand === 0;
            const isLow = !isOut && item.quantity_on_hand <= item.min_quantity;
            return (
              <div key={item.id} className={cn('bg-[#141922] border rounded-xl px-4 py-3 flex items-center gap-4',
                isOut ? 'border-red-500/40' : isLow ? 'border-amber-500/30' : 'border-white/8'
              )}>
                <div className={cn('w-2 h-10 rounded-full flex-shrink-0', isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.part_name}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-0.5">
                    <span className="font-mono text-white/70">{item.part_number}</span>
                    {item.me_number && <span className="text-blue-400">M&amp;E: {item.me_number}</span>}
                    {item.pcn && <span className="text-purple-400">PCN: {item.pcn}</span>}
                    {item.sceptre_id && <span className="text-cyan-400">SCEPTRE: {item.sceptre_id}</span>}
                    {item.amos_id && <span className="text-teal-400">AMOS: {item.amos_id}</span>}
                    {item.trax_id && <span className="text-emerald-400">TRAX: {item.trax_id}</span>}
                    {item.ata_chapter && <span>ATA {item.ata_chapter}</span>}
                    {item.location && <span>📍 {item.location}</span>}
                    {item.station && <span>{item.station}</span>}
                    {item.supplier && <span>Supplier: {item.supplier}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => updateQtyMutation.mutate({ id: item.id, qty: Math.max(0, item.quantity_on_hand - 1) })}
                      className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 text-sm font-bold">−</button>
                    <p className={cn('text-xl font-black w-8 text-center', isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-green-400')}>
                      {item.quantity_on_hand}
                    </p>
                    <button onClick={() => updateQtyMutation.mutate({ id: item.id, qty: item.quantity_on_hand + 1 })}
                      className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 text-sm font-bold">+</button>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">{item.unit} · min {item.min_quantity}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onSave={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
}