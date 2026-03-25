import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plane, Search, LayoutGrid, List, Wrench, CheckCircle, Globe, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['All Status', 'active', 'oos', 'maintenance', 'retired'];

const STATUS_STYLES = {
  active:      { label: 'RELEASED',    bg: 'bg-green-600',  icon: CheckCircle },
  oos:         { label: 'OOS',         bg: 'bg-red-600',    icon: Wrench },
  maintenance: { label: 'MAINTENANCE', bg: 'bg-orange-500', icon: Wrench },
  retired:     { label: 'RETIRED',     bg: 'bg-gray-600',   icon: Plane },
};

function AircraftCard({ aircraft }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161b27] p-5 flex flex-col gap-3 hover:border-orange-500/40 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-extrabold text-primary tracking-wide">{aircraft.tail_number}</p>
          <p className="text-sm text-gray-400 mt-0.5">{aircraft.aircraft_type}</p>
        </div>
        <Plane className="w-5 h-5 text-gray-500 mt-1" />
      </div>

      {/* Location */}
      <p className="text-sm text-gray-400">
        Location: <span className="font-bold text-white">{aircraft.base_station || '—'}</span>
      </p>

      {/* Status badges row 1 */}
      <div className="flex flex-wrap gap-2">
        <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white', status.bg)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-gray-700 border border-gray-600">
          <Shield className="w-3 h-3" /> FOB
        </span>
      </div>

      {/* Status badges row 2 */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-green-400 border border-green-500/40 bg-green-500/10">
          <CheckCircle className="w-3 h-3" /> CAT II
        </span>
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-blue-300 border border-blue-400/30 bg-blue-400/10">
          <Globe className="w-3 h-3" /> NON-ETOPS
        </span>
      </div>

      {/* Extra info */}
      {aircraft.airline && (
        <p className="text-xs text-gray-500">{aircraft.airline}</p>
      )}
    </div>
  );
}

function AircraftRow({ aircraft }) {
  const status = STATUS_STYLES[aircraft.status] || STATUS_STYLES.active;
  const StatusIcon = status.icon;
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-[#161b27] hover:border-orange-500/30 transition-all">
      <div className="flex items-center gap-4">
        <p className="text-base font-extrabold text-primary w-28">{aircraft.tail_number}</p>
        <p className="text-sm text-gray-400 w-24">{aircraft.aircraft_type}</p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Loc:</span> <span className="text-white font-semibold">{aircraft.base_station || '—'}</span>
        </p>
      </div>
      <span className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white', status.bg)}>
        <StatusIcon className="w-3 h-3" />
        {status.label}
      </span>
    </div>
  );
}

export default function FleetDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [viewMode, setViewMode] = useState('grid');

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['fleet-aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
    refetchInterval: 60000,
  });

  const filtered = aircraft.filter(a => {
    const matchesSearch =
      !search ||
      a.tail_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.base_station?.toLowerCase().includes(search.toLowerCase()) ||
      a.aircraft_type?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-wide">Fleet Dashboard</h1>
          <p className="text-xs font-mono text-orange-400 tracking-widest uppercase">TechOps · Aircraft Status</p>
        </div>
      </div>

      {/* Search + Filter + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-[#161b27] border border-white/10 rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by tail number or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#161b27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-orange-500 capitalize"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s} className="capitalize">{s === 'All Status' ? s : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-[#161b27] text-gray-400 hover:text-white')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('px-3 py-2.5 flex items-center justify-center transition-all', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-[#161b27] text-gray-400 hover:text-white')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 mb-5 flex items-center gap-1.5">
        <span className="text-gray-400">↗</span>
        Showing {filtered.length} of {aircraft.length} aircraft
      </p>

      {/* Content */}
      {isLoading ? (
        <div className="text-center text-gray-500 py-16">Loading fleet data…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">No aircraft found</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(a => <AircraftCard key={a.id} aircraft={a} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(a => <AircraftRow key={a.id} aircraft={a} />)}
        </div>
      )}
    </div>
  );
}