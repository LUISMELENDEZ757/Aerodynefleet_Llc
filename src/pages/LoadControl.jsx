import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Weight, Plus, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ManifestEditor from '@/components/loadcontrol/ManifestEditor';
import GroundOpsBoard from '@/components/loadcontrol/GroundOpsBoard';

const TODAY = new Date().toISOString().split('T')[0];

const TABS = [
  { key: 'manifest', label: 'Manifest / Load' },
  { key: 'ground', label: 'Ground Ops' },
];

function StatTile({ label, value, color = 'text-foreground', sub }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function LoadControl() {
  const [activeTab, setActiveTab] = useState('manifest');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const qc = useQueryClient();

  const { data: flights = [], isLoading: loadingFlights, refetch } = useQuery({
    queryKey: ['lc-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: manifests = [] } = useQuery({
    queryKey: ['manifests', TODAY],
    queryFn: () => base44.entities.PassengerManifest.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const totalPax = manifests.reduce((s, m) => s + (m.pax_total || 0), 0);
  const totalPayload = manifests.reduce((s, m) => s + (m.total_payload_lbs || 0), 0);
  const finalized = manifests.filter(m => m.load_status === 'finalized').length;
  const openFlights = flights.length - finalized;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Users className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">LOAD CONTROL</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">PAX Manifest · W&B · Ground Ops</p>
            </div>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Today Flights" value={flights.length} color="text-primary" />
          <StatTile label="Total PAX" value={totalPax.toLocaleString()} color="text-blue-400" />
          <StatTile label="Payload (lbs)" value={totalPayload > 0 ? `${(totalPayload/1000).toFixed(0)}K` : '—'} color="text-foreground" />
          <StatTile label="Finalized" value={`${finalized}/${flights.length}`} color={openFlights > 0 ? 'text-orange-400' : 'text-green-400'} />
        </div>

        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('flex-1 text-xs font-semibold py-2 rounded-lg transition-all',
                activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'manifest' && (
          <ManifestEditor flights={flights} manifests={manifests} isLoading={loadingFlights} />
        )}
        {activeTab === 'ground' && (
          <GroundOpsBoard flights={flights} />
        )}
      </div>
    </div>
  );
}