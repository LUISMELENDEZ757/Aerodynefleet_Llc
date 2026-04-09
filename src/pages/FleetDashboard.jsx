import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Plane, Activity, AlertTriangle, Wrench, RefreshCw, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function KpiCard({ icon: IconComponent, label, value, color }) {
  return (
    <div className={cn('rounded-xl border p-4 space-y-2', color)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest opacity-75">{label}</p>
        {IconComponent && <IconComponent className="w-4 h-4 opacity-60" />}
      </div>
      <p className="text-3xl font-extrabold font-mono">{value}</p>
    </div>
  );
}

function AircraftCard({ aircraft, onSelect }) {
  const statusColor = {
    active: 'border-green-500/40 bg-green-900/10',
    oos: 'border-red-500/40 bg-red-900/10',
    maintenance: 'border-orange-500/40 bg-orange-900/10',
    retired: 'border-gray-500/40 bg-gray-900/10',
  }[aircraft.status] || 'border-border';

  const statusLabel = {
    active: '✓ Active',
    oos: '✕ OOS',
    maintenance: '⚙ Maintenance',
    retired: '⊘ Retired',
  }[aircraft.status];

  const statusTextColor = {
    active: 'text-green-400',
    oos: 'text-red-400',
    maintenance: 'text-orange-400',
    retired: 'text-gray-400',
  }[aircraft.status];

  return (
    <button
      onClick={() => onSelect(aircraft)}
      className={cn('bg-card border rounded-2xl p-5 text-left transition-all hover:shadow-lg w-full', statusColor)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-lg font-extrabold font-mono text-primary">{aircraft.tail_number}</p>
          <p className="text-xs text-muted-foreground">{aircraft.aircraft_type}</p>
        </div>
        <span className={cn('text-xs font-bold px-2 py-1 rounded-full flex-shrink-0', statusTextColor)}>
          {statusLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-muted-foreground">Base Station</p>
          <p className="font-bold">{aircraft.base_station || '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Engine</p>
          <p className="font-bold text-xs">{aircraft.engine_type || '—'}</p>
        </div>
      </div>
    </button>
  );
}

function DetailPanel({ aircraft, onClose }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-extrabold font-mono text-primary">{aircraft.tail_number}</p>
          <p className="text-sm text-muted-foreground">{aircraft.aircraft_type}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Status', value: aircraft.status?.toUpperCase() || '—' },
          { label: 'MSN', value: aircraft.msn || '—' },
          { label: 'Base Station', value: aircraft.base_station || '—' },
          { label: 'Operator', value: aircraft.airline || '—' },
          { label: 'ETOPS Approval', value: aircraft.etops_approval ? `${aircraft.etops_approval} min` : '—' },
          { label: 'CAT Approval', value: aircraft.cat_approval || '—' },
          { label: 'RNP Capability', value: aircraft.rnp_capability || '—' },
          { label: 'RVSM Approved', value: aircraft.rvsm_approved ? 'Yes' : 'No' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {aircraft.notes && (
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm text-foreground">{aircraft.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function FleetDashboard() {
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const qc = useQueryClient();

  const { data: aircraft = [], refetch, isLoading } = useQuery({
    queryKey: ['fleet-dashboard-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 1000),
    refetchInterval: 60000,
  });

  const activeCount = aircraft.filter(a => a.status === 'active').length;
  const oosCount = aircraft.filter(a => a.status === 'oos').length;
  const maintenanceCount = aircraft.filter(a => a.status === 'maintenance').length;
  const etopsReady = aircraft.filter(a => a.etops_approval && a.etops_approval >= 120).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">FLEET DASHBOARD</h1>
            <p className="text-xs font-mono text-muted-foreground">Aircraft Registry & Status</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-5">
        <KpiCard icon={Plane} label="Total Aircraft" value={aircraft.length} color="bg-card border-border" />
        <KpiCard icon={Activity} label="Active" value={activeCount} color="bg-card border-border" />
        <KpiCard icon={AlertTriangle} label="OOS" value={oosCount} color="bg-card border-border" />
        <KpiCard icon={Wrench} label="In Maintenance" value={maintenanceCount} color="bg-card border-border" />
      </div>

      {/* Main Content */}
      <div className="px-5 pt-6 space-y-6">
        {selectedAircraft && (
          <DetailPanel aircraft={selectedAircraft} onClose={() => setSelectedAircraft(null)} />
        )}

        {/* Aircraft Grid */}
        <div>
          <p className="text-sm font-extrabold mb-3 text-foreground">Aircraft List</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aircraft.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No aircraft found</p>
              </div>
            ) : (
              aircraft.map(ac => (
                <AircraftCard key={ac.id} aircraft={ac} onSelect={setSelectedAircraft} />
              ))
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-extrabold mb-4">Status Summary</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Active', value: activeCount, color: 'text-green-400' },
              { label: 'OOS', value: oosCount, color: 'text-red-400' },
              { label: 'Maintenance', value: maintenanceCount, color: 'text-orange-400' },
              { label: 'ETOPS Ready', value: etopsReady, color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}