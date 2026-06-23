import { useState } from 'react';
import { Plus, X, Search, Filter, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const GATE_TYPES = [
  { id: 'terminal', label: 'Terminal Gate', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { id: 'concourse', label: 'Concourse Gate', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  { id: 'remote', label: 'Remote Ramp', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { id: 'hardstand', label: 'Hardstand', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
];

const GATE_PREFIXES = {
  terminal: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  concourse: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
  remote: ['R'],
  hardstand: ['H'],
};

function GateTypeBadge({ type }) {
  const cfg = GATE_TYPES.find(t => t.id === type) || GATE_TYPES[0];
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', cfg.bg, cfg.border, cfg.color)}>
      {cfg.label}
    </span>
  );
}

function GateCard({ gate, onRemove, onToggleOccupancy, viewMode }) {
  const typeCfg = GATE_TYPES.find(t => t.id === gate.type) || GATE_TYPES[0];
  
  if (viewMode === 'list') {
    return (
      <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
        gate.occupied ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30')}>
        <div className="flex items-center gap-3 flex-1">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm',
            gate.occupied ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-400')}>
            {gate.name}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{gate.name} {gate.label && `— ${gate.label}`}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <GateTypeBadge type={gate.type} />
              {gate.occupied && gate.flight && (
                <span className="text-[10px] text-gray-400">{gate.flight}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggleOccupancy(gate.id)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
              gate.occupied ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-orange-600 text-white hover:bg-orange-500')}>
            {gate.occupied ? 'OCCUPIED' : 'AVAILABLE'}
          </button>
          <button onClick={() => onRemove(gate.id)}
            className="w-8 h-8 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center hover:bg-red-900/60 transition-colors">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    );
  }
  
  // Grid view
  return (
    <div className={cn('rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all relative group',
      gate.occupied ? 'bg-orange-500/10 border-orange-500/40' : 'bg-green-500/10 border-green-500/30')}>
      <button onClick={() => onRemove(gate.id)}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-900/60 transition-all">
        <X className="w-3 h-3 text-red-400" />
      </button>
      
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mb-2',
        gate.occupied ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-400')}>
        {gate.name}
      </div>
      
      {gate.label && <p className="text-[10px] text-gray-400 mb-2">{gate.label}</p>}
      
      <GateTypeBadge type={gate.type} />
      
      {gate.occupied && gate.flight && (
        <p className="text-[10px] text-gray-500 mt-2 font-mono">{gate.flight}</p>
      )}
      
      <button onClick={() => onToggleOccupancy(gate.id)}
        className={cn('mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors w-full',
          gate.occupied ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-orange-600 text-white hover:bg-orange-500')}>
        {gate.occupied ? 'OCCUPIED' : 'AVAILABLE'}
      </button>
    </div>
  );
}

export default function GateManagement({ initialGates = [], onChange }) {
  const [gates, setGates] = useState(initialGates || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical'); // 'alphabetical' | 'type'
  
  // Add gate form state
  const [newGate, setNewGate] = useState({
    prefix: 'A',
    number: '',
    type: 'terminal',
    label: '',
  });
  
  // Generate gate name from prefix + number
  const generateGateName = () => {
    if (newGate.type === 'remote') {
      return `R${newGate.number || '1'}`;
    }
    if (newGate.type === 'hardstand') {
      return `H${newGate.number || '1'}`;
    }
    return `${newGate.prefix}${newGate.number}`;
  };
  
  const handleAddGate = () => {
    if (!newGate.number) return;
    
    const gate = {
      id: Date.now().toString(),
      name: generateGateName(),
      type: newGate.type,
      label: newGate.label,
      occupied: false,
      flight: null,
    };
    
    const updated = [...gates, gate];
    setGates(updated);
    onChange?.(updated);
    setShowAddModal(false);
    setNewGate({ prefix: 'A', number: '', type: 'terminal', label: '' });
  };
  
  const handleRemoveGate = (gateId) => {
    const updated = gates.filter(g => g.id !== gateId);
    setGates(updated);
    onChange?.(updated);
  };
  
  const handleToggleOccupancy = (gateId) => {
    const updated = gates.map(g => {
      if (g.id === gateId) {
        return { ...g, occupied: !g.occupied, flight: !g.occupied ? 'FLT1234' : null };
      }
      return g;
    });
    setGates(updated);
    onChange?.(updated);
  };
  
  // Filter and sort gates
  const filteredGates = gates
    .filter(g => {
      if (filterType !== 'all' && g.type !== filterType) return false;
      if (searchQuery && !g.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !g.label?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        // Natural sort for gate names (A1, A2, A10, B1, R1, H1)
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (sortBy === 'type') {
        const typeOrder = { terminal: 0, concourse: 1, remote: 2, hardstand: 3 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }
      return 0;
    });
  
  // Group gates by type for display
  const groupedGates = filteredGates.reduce((acc, gate) => {
    if (!acc[gate.type]) acc[gate.type] = [];
    acc[gate.type].push(gate);
    return acc;
  }, {});
  
  const totalGates = gates.length;
  const occupiedCount = gates.filter(g => g.occupied).length;
  const availableCount = totalGates - occupiedCount;
  
  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search gates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a2035] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
            />
          </div>
          
          {/* Filter by type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
          >
            <option value="all">All Types</option>
            {GATE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="type">By Type</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-[#1a2035] border border-white/10 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')}
              className={cn('px-2 py-1.5 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white')}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('px-2 py-1.5 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white')}>
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Add gate button */}
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Gate
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-white">{totalGates}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Gates</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-green-400">{availableCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Available</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-black text-orange-400">{occupiedCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Occupied</p>
        </div>
      </div>
      
      {/* Gates Display */}
      {filteredGates.length === 0 ? (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No gates found. Add your first gate to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortBy === 'type' ? (
            // Grouped by type
            Object.entries(groupedGates).map(([type, typeGates]) => {
              const typeCfg = GATE_TYPES.find(t => t.id === type);
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-2 h-2 rounded-full', typeCfg?.bg.replace('bg-', 'bg-').replace('/15', ''))} />
                    <p className={cn('text-xs font-bold uppercase tracking-widest', typeCfg?.color)}>
                      {typeCfg?.label} ({typeGates.length})
                    </p>
                  </div>
                  <div className={cn('grid gap-3',
                    viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1')}>
                    {typeGates.map(gate => (
                      <GateCard
                        key={gate.id}
                        gate={gate}
                        onRemove={handleRemoveGate}
                        onToggleOccupancy={handleToggleOccupancy}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Alphabetical (all together)
            <div className={cn('grid gap-3',
              viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1')}>
              {filteredGates.map(gate => (
                <GateCard
                  key={gate.id}
                  gate={gate}
                  onRemove={handleRemoveGate}
                  onToggleOccupancy={handleToggleOccupancy}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Add Gate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-md bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <p className="text-base font-extrabold text-white">Add New Gate</p>
              <button onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Gate Type */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Gate Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {GATE_TYPES.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => setNewGate(p => ({ ...p, type: t.id }))}
                      className={cn('px-3 py-2.5 rounded-xl border text-sm font-bold transition-all',
                        newGate.type === t.id
                          ? `${t.bg} ${t.border} ${t.color}`
                          : 'border-white/10 bg-[#1a2035] text-gray-400 hover:text-white')}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gate Number */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                  Gate {newGate.type === 'remote' ? 'Ramp' : newGate.type === 'hardstand' ? 'Stand' : 'Number'}
                </label>
                <div className="flex items-center gap-2">
                  {(newGate.type === 'terminal' || newGate.type === 'concourse') && (
                    <select
                      value={newGate.prefix}
                      onChange={(e) => setNewGate(p => ({ ...p, prefix: e.target.value }))}
                      className="bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                    >
                      {GATE_PREFIXES[newGate.type].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="1"
                    value={newGate.number}
                    onChange={(e) => setNewGate(p => ({ ...p, number: e.target.value }))}
                    className="flex-1 bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Will be named: <span className="text-primary font-bold">{generateGateName()}</span>
                </p>
              </div>
              
              {/* Optional Label */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., International, Domestic, Cargo"
                  value={newGate.label}
                  onChange={(e) => setNewGate(p => ({ ...p, label: e.target.value }))}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl border border-white/15 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddGate} disabled={!newGate.number}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors">
                Add Gate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}