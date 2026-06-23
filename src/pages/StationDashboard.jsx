import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, Plane, Wrench, Users, Building2, Clock,
  CheckCircle, AlertTriangle, Circle, RefreshCw, Activity,
  MapPin, Fuel, Droplets, Trash2, ShoppingBag, Package,
  Zap, Shield, Gauge, Calendar, TrendingUp, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CatCapabilityBadge from '@/components/techops/CatCapabilityBadge';
import EtopsCapabilityBadge from '@/components/techops/EtopsCapabilityBadge';
import { selectPrimaryMel } from '@/lib/MelSeverityEngine';
import GateManagement from '@/components/station/GateManagement';
import TurnPerformanceCard from '@/components/station/TurnPerformanceCard';

const SERVICING_STATES = {
  not_started: { label: 'Not Started', color: 'text-gray-400', bg: 'bg-gray-500/15', border: 'border-gray-500/30' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  verified: { label: 'Verified', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' },
  late: { label: 'Late', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
};

const SERVICE_ICONS = {
  fuel: Fuel,
  lav: Droplets,
  water: Droplets,
  catering: ShoppingBag,
  cleaning: Trash2,
  bags: Package,
  cargo: Package,
};

function ServiceBadge({ service, state }) {
  const Icon = SERVICE_ICONS[service] || Circle;
  const cfg = SERVICING_STATES[state] || SERVICING_STATES.not_started;
  
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold', cfg.bg, cfg.border)}>
      <Icon className={cn('w-3 h-3', cfg.color)} />
      <span className={cfg.color}>{service.toUpperCase()}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon: Icon, alert }) {
  return (
    <div className={cn('bg-[#141922] border rounded-2xl px-4 py-3 flex items-center gap-3', 
      alert ? 'border-red-500/30 bg-red-500/10' : 'border-white/10')}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', 
        alert ? 'bg-red-500/20' : 'bg-white/5')}>
        <Icon className={cn('w-5 h-5', alert ? 'text-red-400' : color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-2xl font-black', alert ? 'text-red-400' : color)}>{value}</p>
        <p className="text-xs text-gray-500 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
      </div>
    </div>
  );
}

function AircraftTile({ aircraft, melItems, logEntries, flights }) {
  const [expanded, setExpanded] = useState(false);
  
  const acMels = melItems.filter(m => m.aircraft_tail === aircraft.tail_number && m.status !== 'cleared');
  const primaryMel = selectPrimaryMel(acMels);
  const openDiscreps = logEntries.filter(e => 
    e.aircraft_tail === aircraft.tail_number && 
    e.discrepancy_status !== 'CLOSED' && 
    !e.is_cleared
  );
  
  const nextFlight = flights
    .filter(f => f.aircraft_tail === aircraft.tail_number && f.origin && f.status !== 'departed')
    .sort((a, b) => new Date(a.scheduled_departure || '') - new Date(b.scheduled_departure || ''))[0];
  
  const servicing = {
    fuel: aircraft.fuel_status || 'completed',
    lav: 'in_progress',
    water: 'completed',
    catering: 'not_started',
    cleaning: 'in_progress',
    bags: 'in_progress',
    cargo: 'completed',
  };
  
  const statusCfg = {
    active: { label: 'IN SERVICE', color: 'text-green-400', bg: 'bg-green-500/15' },
    oos: { label: 'AOG', color: 'text-red-400', bg: 'bg-red-500/15' },
    maintenance: { label: 'MAINTENANCE', color: 'text-orange-400', bg: 'bg-orange-500/15' },
    retired: { label: 'RETIRED', color: 'text-gray-400', bg: 'bg-gray-500/15' },
  }[aircraft.status] || { label: 'UNKNOWN', color: 'text-gray-400', bg: 'bg-gray-500/15' };
  
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div onClick={() => setExpanded(!expanded)} className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', statusCfg.bg)}>
              <Plane className={cn('w-5 h-5', statusCfg.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-base font-black text-white">{aircraft.tail_number}</p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusCfg.bg, statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{aircraft.aircraft_type}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {nextFlight ? (
              <>
                <p className="text-sm font-mono font-bold text-primary">{nextFlight.flight_number}</p>
                <p className="text-[10px] text-gray-500">{nextFlight.destination} · {nextFlight.scheduled_departure || '—'}Z</p>
              </>
            ) : (
              <p className="text-[10px] text-gray-600">No departures</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {acMels.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
              {acMels.length} MEL{acMels.length > 1 ? 's' : ''}
            </span>
          )}
          {openDiscreps.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400">
              {openDiscreps.length} Open
            </span>
          )}
          {primaryMel?.etops_impact && primaryMel.etops_impact !== 'OK' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400">
              {primaryMel.etops_impact === 'NO_ETOPS' ? 'NO ETOPS' : 'ETOPS LIMITED'}
            </span>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <CatCapabilityBadge aircraft={aircraft} melItems={acMels} compact />
            <EtopsCapabilityBadge aircraft={aircraft} melItems={acMels} compact />
          </div>
          
          {primaryMel && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase mb-1">Primary Restriction</p>
              <p className="text-xs text-amber-100 font-semibold">{primaryMel.description}</p>
              {primaryMel.flight_restrictions && (
                <p className="text-[10px] text-amber-300 mt-1">⚠ {primaryMel.flight_restrictions}</p>
              )}
            </div>
          )}
          
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Servicing Status</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(servicing).map(([svc, state]) => (
                <ServiceBadge key={svc} service={svc} state={state} />
              ))}
            </div>
          </div>
          
          {openDiscreps.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Open Discrepancies</p>
              <div className="space-y-1.5">
                {openDiscreps.slice(0, 3).map(e => (
                  <div key={e.id} className="text-xs text-gray-400 bg-[#0d1117] rounded-lg px-2 py-1.5 border border-white/5">
                    <span className="text-primary font-mono">{e.log_page || '—'}</span> · ATA {e.ata_chapter || '—'}
                    <p className="text-[10px] mt-0.5 line-clamp-1">{e.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Link to={`/AircraftDetail?tail=${aircraft.tail_number}`}
              className="flex-1 text-center py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/25 transition-colors">
              Full Details
            </Link>
            <Link to={`/TechOpsLogbook?tail=${aircraft.tail_number}`}
              className="flex-1 text-center py-2 rounded-xl bg-[#1a2035] border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors">
              Logbook
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MaintenanceWorkloadCard({ entry }) {
  const statusCfg = {
    open: { label: 'OPEN', color: 'text-red-400', bg: 'bg-red-500/15' },
    in_progress: { label: 'IN WORK', color: 'text-blue-400', bg: 'bg-blue-500/15' },
    pending_parts: { label: 'WAITING PARTS', color: 'text-orange-400', bg: 'bg-orange-500/15' },
    completed: { label: 'DONE', color: 'text-green-400', bg: 'bg-green-500/15' },
  }[entry.discrepancy_status?.toLowerCase()] || { label: 'OPEN', color: 'text-red-400', bg: 'bg-red-500/15' };
  
  return (
    <div className="bg-[#141922] border border-white/10 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-gray-500" />
          <p className="text-xs font-bold text-white">{entry.aircraft_tail}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', statusCfg.bg, statusCfg.color)}>
          {statusCfg.label}
        </span>
      </div>
      <p className="text-[10px] text-gray-400 line-clamp-2">{entry.description}</p>
      <div className="flex items-center gap-2 text-[10px] text-gray-600">
        <span>ATA {entry.ata_chapter || '—'}</span>
        <span>·</span>
        <span>{entry.technician_name || 'Unassigned'}</span>
      </div>
    </div>
  );
}

export default function StationDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const icaoParam = searchParams.get('icao')?.toUpperCase();
  const [selectedIcao, setSelectedIcao] = useState(icaoParam || '');
  
  const { data: stations = [] } = useQuery({
    queryKey: ['global-stations'],
    queryFn: () => base44.entities.Station.list('icao_code', 500),
  });
  
  const icao = selectedIcao || (stations.length > 0 ? stations[0].icao_code : '');
  const station = stations.find(s => s.icao_code === icao);
  
  useEffect(() => {
    if (icao && icao !== icaoParam) {
      setSearchParams({ icao });
    }
  }, [icao, icaoParam, setSearchParams]);
  
  const { data: allFlights = [], isLoading: loadingFlights, refetch: refetchFlights } = useQuery({
    queryKey: ['station-flights', icao],
    queryFn: () => base44.entities.Flight.list('-scheduled_departure', 500),
    enabled: !!icao,
    refetchInterval: 30000,
  });
  
  const { data: allAircraft = [] } = useQuery({
    queryKey: ['station-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
  });
  
  const { data: melItems = [] } = useQuery({
    queryKey: ['station-mel'],
    queryFn: () => base44.entities.MELItem.list('-deferred_date', 500),
    refetchInterval: 60000,
  });
  
  const { data: logEntries = [] } = useQuery({
    queryKey: ['station-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });
  
  const { data: gates = [] } = useQuery({
    queryKey: ['station-gates', icao],
    queryFn: async () => {
      const gates = await base44.entities.Gate.filter({ station_icao: icao }, 'code', 500);
      // Auto-seed KEWR gates if none exist
      if (icao === 'KEWR' && gates.length === 0) {
        await base44.functions.invoke('seedKewrGates', {});
        return await base44.entities.Gate.filter({ station_icao: icao }, 'code', 500);
      }
      return gates;
    },
    enabled: !!icao,
  });
  
  const flights = allFlights.filter(f => f.origin === icao || f.destination === icao);
  const departures = flights.filter(f => f.origin === icao);
  const arrivals = flights.filter(f => f.destination === icao);
  const airborne = flights.filter(f => f.status === 'airborne').length;
  const delayed = flights.filter(f => (f.delay_minutes || 0) > 0).length;
  
  const aircraftAtStation = allAircraft.filter(a => a.base_station === icao);
  const aogCount = aircraftAtStation.filter(a => a.status === 'oos').length;
  const activeCount = aircraftAtStation.filter(a => a.status === 'active').length;
  
  const mxWorkload = logEntries.filter(e => e.station === icao && e.discrepancy_status !== 'CLOSED');
  const inProgress = mxWorkload.filter(e => e.discrepancy_status === 'IN_PROGRESS').length;
  const waitingParts = mxWorkload.filter(e => e.notes?.includes('WAITING PARTS')).length;
  
  const restrictiveMels = melItems.filter(m => 
    m.status !== 'cleared' && 
    (m.etops_impact === 'NO_ETOPS' || m.etops_impact === 'ETOPS_WITH_LIMITS' || m.flight_restrictions)
  );
  
  const handleFlightUpdate = (flightId, newFlightNumber) => {
    refetchFlights();
  };

  if (stations.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0d11] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-400 font-bold">No stations configured in the system.</p>
          <Link to="/GlobalStations" className="text-primary hover:underline text-sm">← Add a Station</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0a0d11] pb-24">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/GlobalStations" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              <span className="font-mono text-primary mr-2">{icao}</span>
              {station ? station.station_name : 'Station Dashboard'}
            </h1>
            {station && (
              <p className="text-xs text-gray-500">
                {station.region} · {station.timezone}
                {station.is_active ? <span className="ml-2 text-green-400 font-bold">● Operational</span> : <span className="ml-2 text-red-400 font-bold">● Inactive</span>}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={icao} 
            onChange={(e) => setSelectedIcao(e.target.value)}
            className="bg-[#1a2035] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
          >
            {stations.map(s => (
              <option key={s.id} value={s.icao_code}>{s.icao_code} - {s.station_name}</option>
            ))}
          </select>
          <button onClick={() => refetchFlights()} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <RefreshCw className={cn('w-4 h-4 text-gray-400', loadingFlights && 'animate-spin')} />
          </button>
        </div>
      </div>
      
      <div className="px-6 py-5 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <KpiCard label="Aircraft on Ground" value={aircraftAtStation.length} sub={`${activeCount} active · ${aogCount} AOG`} color="text-white" icon={Plane} />
          <KpiCard label="Total Movements" value={flights.length} sub={`${departures.length} DEP · ${arrivals.length} ARR`} color="text-cyan-400" icon={Activity} />
          <KpiCard label="Airborne" value={airborne} color="text-green-400" icon={Plane} />
          <KpiCard label="Delayed" value={delayed} alert={delayed > 0} color="text-orange-400" icon={Clock} />
          <KpiCard label="MX Workload" value={mxWorkload.length} sub={`${inProgress} in work`} color="text-purple-400" icon={Wrench} />
          <KpiCard label="Restrictive MELs" value={restrictiveMels.length} alert={restrictiveMels.length > 0} color="text-red-400" icon={AlertTriangle} />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary" /> Aircraft at Station
            </p>
            <p className="text-[10px] text-gray-600">{aircraftAtStation.length} total</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aircraftAtStation.slice(0, 6).map(ac => (
              <AircraftTile key={ac.id} aircraft={ac} melItems={melItems} logEntries={logEntries} flights={flights} />
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Turn Performance
            </p>
            <p className="text-[10px] text-gray-600">Live tracking</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departures.filter(f => f.status !== 'departed').slice(0, 3).map(f => (
              <TurnPerformanceCard key={f.id} flight={f} onUpdate={handleFlightUpdate} />
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <p className="font-extrabold text-white text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" /> Maintenance Workload
              </p>
              <div className="flex gap-2 text-[10px]">
                <span className="text-blue-400 font-bold">{inProgress} IN WORK</span>
                <span className="text-orange-400 font-bold">{waitingParts} WAITING PARTS</span>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {mxWorkload.length === 0 ? (
                <p className="text-center text-gray-600 text-sm py-8">No open maintenance tasks</p>
              ) : (
                mxWorkload.slice(0, 5).map(entry => (
                  <MaintenanceWorkloadCard key={entry.id} entry={entry} />
                ))
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-white text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" /> Gate Management
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Manage terminal gates, remote ramps, and hardstand positions</p>
                </div>
                {icao === 'KEWR' && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                    {gates.length} Gates (Terminals A, B & C)
                  </span>
                )}
              </div>
              <GateManagement stationIcao={icao} />
            </div>
          </div>
        </div>
        
        {restrictiveMels.length > 0 && (
          <div className="bg-red-950/40 border border-red-500/60 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm font-extrabold text-red-400 uppercase tracking-widest">
                {restrictiveMels.length} Restrictive MEL{restrictiveMels.length > 1 ? 's' : ''} at Station
              </p>
            </div>
            {restrictiveMels.slice(0, 3).map(m => (
              <div key={m.id} className="flex items-start gap-3 bg-red-900/30 rounded-xl px-4 py-3 border border-red-700/40">
                <Zap className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-800 text-red-300 uppercase">
                      {m.aircraft_tail} · {m.ata_chapter || 'MEL'}
                    </span>
                    {m.etops_impact === 'NO_ETOPS' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-900 text-orange-300 border border-orange-700/50">NO ETOPS</span>
                    )}
                  </div>
                  <p className="text-xs text-red-200 font-semibold">{m.description}</p>
                  {m.flight_restrictions && (
                    <p className="text-[10px] text-red-400 mt-0.5">⚠ {m.flight_restrictions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <p className="font-extrabold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> Station Health Metrics
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
            {[
              { label: 'On-Time Performance', value: '87%', trend: '+2.3%', color: 'text-green-400' },
              { label: 'Avg Turn Time', value: '42m', trend: '-3m', color: 'text-cyan-400' },
              { label: 'MX Delays (24h)', value: '2', trend: '-1', color: 'text-amber-400' },
              { label: 'AOG Time (avg)', value: '4.2h', trend: '-0.8h', color: 'text-green-400' },
            ].map(metric => (
              <div key={metric.label} className="text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{metric.label}</p>
                <p className={cn('text-3xl font-black', metric.color)}>{metric.value}</p>
                <p className="text-[10px] text-green-400 font-bold mt-0.5">{metric.trend} vs avg</p>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}