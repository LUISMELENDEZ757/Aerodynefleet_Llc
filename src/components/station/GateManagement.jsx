import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Search, Grid, List, Plane, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const GATE_TYPES = [
  { id: 'gate', label: 'Terminal Gate', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { id: 'concourse', label: 'Concourse Gate', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  { id: 'remote', label: 'Remote Ramp', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { id: 'hardstand', label: 'Hardstand', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
];

const TERMINALS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function GateTypeBadge({ type }) {
  const cfg = GATE_TYPES.find(t => t.id === type) || GATE_TYPES[0];
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', cfg.bg, cfg.border, cfg.color)}>
      {cfg.label}
    </span>
  );
}

function GateCard({ gate, onRemove, onToggleOccupancy, viewMode, stationTimezone }) {
  const typeCfg = GATE_TYPES.find(t => t.id === gate.type) || GATE_TYPES[0];
  
  const formatTime = (timeStr, timezone = 'UTC') => {
    if (!timeStr) return null;
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone });
  };
  
  if (viewMode === 'list') {
    return (
      <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
        gate.occupied ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30')}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm',
            gate.occupied ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-400')}>
            {gate.name || gate.code}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white">{gate.name || gate.code} {gate.label && `— ${gate.label}`}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <GateTypeBadge type={gate.type} />
              {gate.terminal && gate.type === 'gate' && (
                <span className="text-[10px] text-gray-500">Terminal {gate.terminal}</span>
              )}
              {gate.occupied && gate.flight && (
                <>
                  <span className="text-[10px] text-primary font-mono flex items-center gap-1">
                    <Plane className="w-2.5 h-2.5" /> {gate.flight}
                  </span>
                  {gate.aircraft_tail && (
                    <span className="text-[10px] text-gray-400 font-mono">{gate.aircraft_tail}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gate.occupied && gate.scheduled_departure && (
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Departure</p>
              <p className="text-xs font-bold text-white font-mono">{formatTime(gate.scheduled_departure, stationTimezone)}</p>
            </div>
          )}
          <button onClick={() => onToggleOccupancy(gate)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
              gate.occupied ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-orange-600 text-white hover:bg-orange-500')}>
            {gate.occupied ? 'OCCUPIED' : 'AVAILABLE'}
          </button>
          <button onClick={() => onRemove(gate)}
            className="w-8 h-8 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center hover:bg-red-900/60 transition-colors">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all relative group',
      gate.occupied ? 'bg-orange-500/10 border-orange-500/40' : 'bg-green-500/10 border-green-500/30')}>
      <button onClick={() => onRemove(gate)}
        className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-red-900/30 border border-red-700/30 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-900/60 transition-all">
        <X className="w-3 h-3 text-red-400" />
      </button>
      
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mb-2',
        gate.occupied ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-400')}>
        {gate.name || gate.code}
      </div>
      
      {gate.label && <p className="text-[10px] text-gray-400 mb-2">{gate.label}</p>}
      
      <GateTypeBadge type={gate.type} />
      
      {gate.terminal && gate.type === 'gate' && (
        <p className="text-[10px] text-gray-500 mt-1">Terminal {gate.terminal}</p>
      )}
      
      {gate.occupied && gate.flight && (
        <div className="w-full mt-3 pt-3 border-t border-white/10 space-y-2">
          <div className="text-center">
            <p className="text-sm font-bold text-primary font-mono">{gate.flight}</p>
            {gate.aircraft_tail && (
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{gate.aircraft_tail}</p>
            )}
          </div>
          {gate.scheduled_departure && (
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase">Departure</p>
              <p className="text-xs font-bold text-white font-mono">{formatTime(gate.scheduled_departure)}</p>
            </div>
          )}
        </div>
      )}
      
      <button onClick={() => onToggleOccupancy(gate)}
        className={cn('mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors w-full',
          gate.occupied ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-orange-600 text-white hover:bg-orange-500')}>
        {gate.occupied ? 'OCCUPIED' : 'AVAILABLE'}
      </button>
    </div>
  );
}

export default function GateManagement({ stationIcao }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [syncing, setSyncing] = useState(false);
  
  const [newGate, setNewGate] = useState({
    code: '',
    type: 'gate',
    terminal: 'A',
    label: '',
  });
  const [validationError, setValidationError] = useState(null);
  
  const { data: gates = [], isLoading } = useQuery({
    queryKey: ['station-gates', stationIcao],
    queryFn: () => base44.entities.Gate.filter({ station_icao: stationIcao }, 'code', 500),
    enabled: !!stationIcao,
  });
  
  const addGateMutation = useMutation({
    mutationFn: async (gateData) => {
      return await base44.entities.Gate.create(gateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['station-gates', stationIcao]);
    },
  });
  
  const updateGateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Gate.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['station-gates', stationIcao]);
    },
  });
  
  const deleteGateMutation = useMutation({
    mutationFn: async (gateId) => {
      return await base44.entities.Gate.delete(gateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['station-gates', stationIcao]);
    },
  });
  
  const handleAddGate = () => {
    const code = newGate.code.toUpperCase().trim();
    if (!code || code.length < 2 || !/^[A-Z]+\d+$/.test(code)) {
      setValidationError('Format must be letter(s) + number(s) (e.g., A1, B12, R3)');
      return;
    }
    
    if (gates.some(g => g.code.toUpperCase() === code)) {
      setValidationError('This gate already exists');
      return;
    }
    
    addGateMutation.mutate({
      code,
      name: code,
      type: newGate.type,
      terminal: (newGate.type === 'gate' || newGate.type === 'concourse') ? newGate.terminal : null,
      label: newGate.label,
      numeric: parseInt(code.match(/(\d+)$/)?.[1] || '0', 10),
      station_icao: stationIcao,
      occupied: false,
      flight: null,
    });
    
    setShowAddModal(false);
    setNewGate({ code: '', type: 'gate', terminal: 'A', label: '' });
    setValidationError(null);
  };
  
  const handleRemoveGate = (gate) => {
    deleteGateMutation.mutate(gate.id);
  };
  
  const handleToggleOccupancy = (gate) => {
    updateGateMutation.mutate({
      id: gate.id,
      data: {
        occupied: !gate.occupied,
        flight: !gate.occupied ? 'FLT1234' : null,
      },
    });
  };
  
  const handleSyncFlightAware = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('syncFlightAwareGates', { station: stationIcao });
      queryClient.invalidateQueries(['station-gates', stationIcao]);
    } catch (error) {
      console.error('Sync error:', error);
    }
    setSyncing(false);
  };
  
  const filteredGates = useMemo(() => {
    return gates
      .filter(g => {
        if (filterType !== 'all' && g.type !== filterType) return false;
        if (searchQuery && !g.code.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !g.label?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'alphabetical') {
          return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
        }
        if (sortBy === 'type') {
          const typeOrder = { gate: 0, concourse: 1, remote: 2, hardstand: 3 };
          if (typeOrder[a.type] !== typeOrder[b.type]) {
            return typeOrder[a.type] - typeOrder[b.type];
          }
          return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
        }
        return 0;
      });
  }, [gates, filterType, searchQuery, sortBy]);
  
  const totalGates = gates.length;
  const occupiedCount = gates.filter(g => g.occupied).length;
  const availableCount = totalGates - occupiedCount;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
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
          
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Gate
          </button>
          <button onClick={handleSyncFlightAware} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50">
            <RefreshCw className={cn('w-4 h-4', syncing && 'animate-spin')} /> Sync
          </button>
        </div>
      </div>
      
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
      
      {isLoading ? (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">Loading gates...</p>
        </div>
      ) : filteredGates.length === 0 ? (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No gates found. Add your first gate to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortBy === 'type' ? (
            Object.entries(filteredGates.reduce((acc, gate) => {
              if (!acc[gate.type]) acc[gate.type] = [];
              acc[gate.type].push(gate);
              return acc;
            }, {})).map(([type, typeGates]) => {
              const typeCfg = GATE_TYPES.find(t => t.id === type);
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-2 h-2 rounded-full', typeCfg?.color.replace('text-', 'bg-'))} />
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
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Gate Code</label>
                <input
                  type="text"
                  placeholder={newGate.type === 'remote' ? 'R1, R2, R3...' : newGate.type === 'hardstand' ? 'H1, H2...' : 'A1, B12, C5...'}
                  value={newGate.code}
                  onChange={(e) => {
                    setNewGate(p => ({ ...p, code: e.target.value.toUpperCase() }));
                    setValidationError(null);
                  }}
                  className={cn('w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary',
                    validationError && 'border-red-500/50 focus:border-red-500')}
                />
                {validationError && (
                  <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                    <X className="w-3 h-3" /> {validationError}
                  </p>
                )}
              </div>
              
              {(newGate.type === 'gate' || newGate.type === 'concourse') && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Terminal</label>
                  <select
                    value={newGate.terminal}
                    onChange={(e) => setNewGate(p => ({ ...p, terminal: e.target.value }))}
                    className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
                  >
                    {TERMINALS.map(t => (
                      <option key={t} value={t}>Terminal {t}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., International, Domestic, Cargo, Wide-body"
                  value={newGate.label}
                  onChange={(e) => setNewGate(p => ({ ...p, label: e.target.value }))}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10 bg-[#1a2035]/50">
              <button onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleAddGate}
                disabled={!newGate.code || addGateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {addGateMutation.isPending ? 'Adding...' : 'Add Gate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}