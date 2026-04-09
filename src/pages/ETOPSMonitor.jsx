import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Globe, AlertTriangle, CheckCircle, RefreshCw, Plus, ChevronLeft,
  Activity, Wrench, Clock, Shield, TrendingDown, Plane
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ETOPS_LEVELS = {
  '370': { label: 'ETOPS-370', desc: '370 min · Polar/Pacific', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/40' },
  '180': { label: 'ETOPS-180', desc: '180 min · Extended Ops', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/40' },
  '120': { label: 'ETOPS-120', desc: '120 min · Overwater Ops', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/40' },
  'non': { label: 'NON-ETOPS', desc: 'Domestic/Short-haul only', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/40' },
};

function ETOPSCard({ aircraft, melItems, onDowngrade, onUpgrade }) {
  const etopsLevel = aircraft.etops_approval || 120;
  const cfg = ETOPS_LEVELS[etopsLevel === 370 ? '370' : etopsLevel === 180 ? '180' : etopsLevel === 120 ? '120' : 'non'];
  const aircraftMel = melItems.filter(m => m.aircraft_tail === aircraft.tail_number && m.flight_restrictions?.includes('ETOPS'));
  const isDowngraded = aircraft.etops_approval && aircraft.etops_approval < (aircraft.aircraft_type?.includes('B777') || aircraft.aircraft_type?.includes('B787') ? 370 : aircraft.aircraft_type?.includes('B737 MAX') ? 180 : 120);

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3 bg-card', cfg.border)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-lg font-bold text-primary font-mono">{aircraft.tail_number}</p>
          <p className="text-xs text-muted-foreground">{aircraft.aircraft_type} · {aircraft.base_station || '—'}</p>
        </div>
        <span className={cn('text-xs font-bold px-3 py-1 rounded-full', cfg.bg, cfg.color)}>
          {cfg.label}
        </span>
      </div>

      {aircraftMel.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-orange-300">
            <p className="font-bold">{aircraftMel.length} ETOPS-affecting MEL item{aircraftMel.length > 1 ? 's' : ''}</p>
            <p className="text-[10px] mt-0.5">{aircraftMel[0].description?.substring(0, 50)}...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-secondary/50 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Status</p>
          <p className="font-bold text-foreground mt-0.5">{aircraft.status === 'active' ? 'Active' : aircraft.status === 'oos' ? 'OOS' : 'MX'}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Engine</p>
          <p className="font-bold text-foreground mt-0.5 text-[11px] truncate">{aircraft.engine_type || '—'}</p>
        </div>
      </div>

      {isDowngraded && (
        <button onClick={() => onUpgrade(aircraft)}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors">
          Restore ETOPS Approval
        </button>
      )}
      
      {!isDowngraded && aircraftMel.length > 0 && (
        <button onClick={() => onDowngrade(aircraft)}
          className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors">
          Downgrade ETOPS
        </button>
      )}
    </div>
  );
}

function DowngradeModal({ aircraft, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(aircraft.id, { etops_approval: 0, notes: `Downgraded: ${reason}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="font-bold text-foreground">Downgrade ETOPS</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Aircraft</p>
            <p className="font-bold text-foreground mt-1">{aircraft.tail_number}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Reason for Downgrade</label>
            <textarea
              autoFocus
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Open MEL item affects ETOPS certification"
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm font-bold hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold disabled:opacity-50">
              Downgrade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ETOPSMonitor() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [downgradeAircraft, setDowngradeAircraft] = useState(null);
  const qc = useQueryClient();

  const { data: aircraft = [] } = useQuery({
    queryKey: ['etops-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['etops-mel'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 300),
    refetchInterval: 60000,
  });

  const downgradeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Aircraft.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['etops-aircraft'] });
      setDowngradeAircraft(null);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Aircraft.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['etops-aircraft'] }),
  });

  const getMaxETOPS = (acType) => {
    if (['B777', 'B787', 'A350'].some(t => acType?.includes(t))) return 370;
    if (['B737 MAX', 'A320', 'A321', 'B767'].some(t => acType?.includes(t))) return 180;
    if (['B737-800', 'B737-900', 'B757'].some(t => acType?.includes(t))) return 120;
    return 0;
  };

  const filtered = aircraft.filter(a => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'downgraded') return a.etops_approval && a.etops_approval < getMaxETOPS(a.aircraft_type);
    if (filterStatus === 'non') return !a.etops_approval || a.etops_approval === 0;
    return a.etops_approval === parseInt(filterStatus);
  });

  const etopsActive = aircraft.filter(a => a.status === 'active' && a.etops_approval >= 120).length;
  const etopsDowngraded = aircraft.filter(a => a.etops_approval && a.etops_approval < getMaxETOPS(a.aircraft_type)).length;
  const etopsNon = aircraft.filter(a => !a.etops_approval || a.etops_approval === 0).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">ETOPS MONITOR</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Aircraft Certification · MEL Compliance · Downgrade Management</p>
            </div>
          </div>
          <button onClick={() => qc.invalidateQueries({ queryKey: ['etops-aircraft', 'etops-mel'] })}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl bg-secondary/50 px-3 py-2">
            <p className="text-2xl font-black text-green-400">{etopsActive}</p>
            <p className="text-xs text-muted-foreground">ETOPS Ready</p>
          </div>
          <div className="rounded-xl bg-secondary/50 px-3 py-2">
            <p className="text-2xl font-black text-amber-400">{etopsDowngraded}</p>
            <p className="text-xs text-muted-foreground">Downgraded</p>
          </div>
          <div className="rounded-xl bg-secondary/50 px-3 py-2">
            <p className="text-2xl font-black text-red-400">{etopsNon}</p>
            <p className="text-xs text-muted-foreground">Non-ETOPS</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[
            { key: 'all', label: 'All' },
            { key: '370', label: 'ETOPS-370' },
            { key: '180', label: 'ETOPS-180' },
            { key: '120', label: 'ETOPS-120' },
            { key: 'non', label: 'Non-ETOPS' },
            { key: 'downgraded', label: 'Downgraded' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={cn('px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                filterStatus === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No aircraft found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(a => (
              <ETOPSCard
                key={a.id}
                aircraft={a}
                melItems={melItems}
                onDowngrade={setDowngradeAircraft}
                onUpgrade={ac => upgradeMutation.mutate({ id: ac.id, data: { etops_approval: getMaxETOPS(ac.aircraft_type) } })}
              />
            ))}
          </div>
        )}
      </div>

      {downgradeAircraft && (
        <DowngradeModal
          aircraft={downgradeAircraft}
          onClose={() => setDowngradeAircraft(null)}
          onConfirm={(id, data) => downgradeMutation.mutate({ id, data })}
          isPending={downgradeMutation.isPending}
        />
      )}
    </div>
  );
}