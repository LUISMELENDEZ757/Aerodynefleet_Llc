import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Activity, Users, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import MccKpiBar from '@/components/mcc/MccKpiBar';
import MccFleetStatus from '@/components/mcc/MccFleetStatus';
import MROIntegrationHub from '@/components/mcc/MROIntegrationHub';
import MccOosBoard from '@/components/mcc/MccOosBoard';
import MccMelBoard from '@/components/mcc/MccMelBoard';
import MccFaultBoard from '@/components/mcc/MccFaultBoard';
import MccPartsBoard from '@/components/mcc/MccPartsBoard';
import MccToolingBoard from '@/components/mcc/MccToolingBoard';
import ShiftHandoverModule from '@/components/mcc/ShiftHandoverModule';
import SupervisorHandoverModule from '@/components/mcc/SupervisorHandoverModule';
import FieldTripModal from '@/components/mcc/FieldTripModal';
import { Plus } from 'lucide-react';

function ZuluClock() {
  const [t, setT] = useState(new Date());
  useState(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  });
  const zuluStr = t.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'UTC',
  });
  return (
    <div className="text-right flex-shrink-0">
      <p className="text-[9px] font-extrabold text-amber-400 tracking-widest uppercase">Zulu / UTC</p>
      <p className="text-lg font-black text-white font-mono tracking-wider leading-tight">{zuluStr}Z</p>
    </div>
  );
}

const TABS = [
  { id: 'fleet',    label: 'Fleet Status' },
  { id: 'oos',      label: 'OOS / MX' },
  { id: 'fieldtrip', label: 'Field Trip' },
  { id: 'mel',      label: 'MEL' },
  { id: 'faults',   label: 'Faults' },
  { id: 'parts',    label: 'Parts' },
  { id: 'tooling',  label: 'Tooling' },
  { id: 'technician', label: 'MC Tech' },
  { id: 'supervisor', label: 'MC Supervisor' },
  { id: 'mro',      label: '🔗 MRO Integrations' },
];

// Aircraft Recovery by Location Modal
function AircraftRecoveryModal({ selectedLocation, onClose, oosEntries, aircraft, fieldTrips, onEditTrip }) {
  const locationAircraft = oosEntries
    .filter(e => e.station === selectedLocation)
    .map(e => ({
      ...e,
      aircraftType: aircraft.find(a => a.tail_number === e.aircraft_tail)?.aircraft_type || '—',
    }));

  const locationTrips = fieldTrips.filter(t => t.station === selectedLocation);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">{selectedLocation} — Field Trip Recovery</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-6">
          {/* Aircraft OOS */}
          <div>
            <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Aircraft Out of Service</h3>
            {locationAircraft.length === 0 ? (
              <p className="text-gray-600 text-sm">No OOS aircraft at this location</p>
            ) : (
              <div className="space-y-2">
                {locationAircraft.map(entry => (
                  <div key={entry.id} className="bg-[#141922] border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-extrabold text-orange-400 font-mono">{entry.aircraft_tail}</span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-bold">{entry.reason || 'Maintenance'}</span>
                    </div>
                    <p className="text-xs text-gray-400">{entry.aircraftType}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Field Trip Details */}
          <div className="border-t border-white/10 pt-4">
            {locationTrips.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-6">No field trip recovery data configured</p>
            ) : (
              locationTrips.map(trip => (
                <div key={trip.id} className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-black text-white">{trip.aircraft_tail}</p>
                      <p className="text-xs text-gray-400 mt-1">Recovery Type: <span className="text-blue-400 font-bold">{trip.recovery_type?.replace(/_/g, ' ').toUpperCase()}</span></p>
                    </div>
                    <button onClick={() => onEditTrip(trip)} className="px-3 py-1.5 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-bold transition-colors">
                      Edit
                    </button>
                  </div>

                  {/* Technicians */}
                  <div className="bg-[#141922] border border-white/10 rounded-lg p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">👷 Team Members ({trip.technicians_assigned?.length || 0})</p>
                    {trip.technicians_assigned?.length > 0 ? (
                      <div className="space-y-2">
                        {trip.technicians_assigned.map((tech, i) => {
                          const roleColors = {
                            supervisor: 'bg-red-500/20 text-red-400',
                            inspector_rii: 'bg-orange-500/20 text-orange-400',
                            quality_inspector: 'bg-yellow-500/20 text-yellow-400',
                            lead_ap: 'bg-blue-500/20 text-blue-400',
                            specialty_tech: 'bg-green-500/20 text-green-400',
                          };
                          const roleColor = roleColors[tech.role] || 'bg-purple-500/20 text-purple-400';
                          return (
                            <div key={i} className="bg-[#0d1117] p-3 rounded-lg border border-white/5">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-white">{tech.name}</p>
                                <span className={`text-[10px] ${roleColor} px-2 py-0.5 rounded font-bold`}>
                                  {tech.role?.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </div>
                              <div className="space-y-1 text-[10px] text-gray-400">
                                <p><span className="text-gray-500">Employee ID:</span> <span className="font-mono text-white">{tech.employee_id}</span></p>
                                <p><span className="text-gray-500">Company ID:</span> <span className="font-mono text-white">{tech.company_id}</span></p>
                                {tech.certification && <p><span className="text-gray-500">Cert:</span> <span className="font-bold text-cyan-400">{tech.certification}</span></p>}
                                {tech.specialty && <p><span className="text-gray-500">Specialty:</span> <span className="text-white">{tech.specialty}</span></p>}
                                {tech.phone && <p><span className="text-gray-500">Phone:</span> <span className="font-mono text-white">{tech.phone}</span></p>}
                                {tech.passport_number && <p><span className="text-gray-500">Passport:</span> <span className="font-mono text-white">{tech.passport_number}</span></p>}
                                {tech.notes && <p className="text-gray-500 italic mt-1">{tech.notes}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">No technicians assigned</p>
                    )}
                  </div>

                  {/* Flights */}
                  <div className="bg-[#141922] border border-white/10 rounded-lg p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">✈ Flights</p>
                    <div className="space-y-2">
                      {trip.flight_number && (
                        <div className="bg-[#0d1117] p-3 rounded-lg">
                          <p className="text-[10px] text-gray-500 mb-1">OUTBOUND</p>
                          <p className="text-lg font-mono font-bold text-cyan-400">{trip.flight_number}</p>
                        </div>
                      )}
                      {trip.return_flight_number && (
                        <div className="bg-[#0d1117] p-3 rounded-lg">
                          <p className="text-[10px] text-gray-500 mb-1">RETURN</p>
                          <p className="text-lg font-mono font-bold text-cyan-400">{trip.return_flight_number}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hotel & Expenses */}
                  <div className="grid grid-cols-2 gap-3">
                    {trip.hotel_name && (
                      <div className="bg-[#141922] border border-white/10 rounded-lg p-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">🏨 Hotel</p>
                        <p className="text-sm font-bold text-white">{trip.hotel_name}</p>
                        {trip.hotel_confirmation && (
                          <p className="text-[10px] text-gray-500 mt-2">Confirmation: <span className="font-mono text-gray-400">{trip.hotel_confirmation}</span></p>
                        )}
                      </div>
                    )}
                    {trip.daily_expense_budget && (
                      <div className="bg-[#141922] border border-white/10 rounded-lg p-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">💰 Expenses</p>
                        <p className="text-lg font-mono font-bold text-green-400">${trip.daily_expense_budget}<span className="text-xs text-gray-500">/day</span></p>
                        {trip.total_expenses && (
                          <p className="text-[10px] text-gray-500 mt-2">Total Trip: <span className="text-green-400 font-bold">${trip.total_expenses}</span></p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {trip.notes && (
                    <div className="bg-blue-950/30 border border-blue-500/40 rounded-lg p-4">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">📝 Recovery Details</p>
                      <p className="text-sm text-blue-300">{trip.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceControl() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);


  const { data: aircraft = [] } = useQuery({
    queryKey: ['mcc-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 1000),
    refetchInterval: 60000,
  });

  const { data: oosEntries = [] } = useQuery({
    queryKey: ['mcc-oos'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['mcc-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['mcc-faults'],
    queryFn: () => base44.entities.FaultMessage.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['mcc-parts'],
    queryFn: () => base44.entities.Part.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['mcc-tools'],
    queryFn: () => base44.entities.Tool.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: logbookEntries = [] } = useQuery({
    queryKey: ['mcc-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  const { data: fieldTrips = [] } = useQuery({
    queryKey: ['mcc-fieldtrips'],
    queryFn: () => base44.entities.FieldTrip.list('-start_date', 500),
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0d1117] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">Maintenance Control</p>
            <p className="text-[10px] text-orange-400 tracking-widest uppercase font-bold">MCC · Fleet Oversight · TechOps Command</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Zulu / UTC clock */}
          <ZuluClock />
          <LiveClock />
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* KPI Bar */}
      <MccKpiBar
        aircraft={aircraft}
        oosEntries={oosEntries}
        melItems={melItems}
        faults={faults}
        parts={parts}
        tools={tools}
      />

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-4 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === id
                ? 'bg-orange-600 text-white'
                : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 mt-5">
        {activeTab === 'fleet' && (
          <>
            <MccFleetStatus
              aircraft={aircraft}
              oosEntries={oosEntries}
              logbookEntries={logbookEntries}
            />
          </>
        )}
        {activeTab === 'oos'     && <MccOosBoard oosEntries={oosEntries} aircraft={aircraft} />}
        {activeTab === 'fieldtrip' && (
          <div className="space-y-4">
            <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-extrabold text-white">Field Trip Recovery</h2>
                </div>
                <button onClick={() => setEditingTrip({ station: '' })} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
                  <Plus className="w-4 h-4" /> New Trip
                </button>
              </div>
              <p className="text-xs text-gray-500">Select a station to view or create recovery operations by location.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {['KEWR', 'KJFK', 'KORD', 'KATL', 'KLAX', 'KSFO', 'KDEN', 'KMIA', 'KDFW', 'KSEA', 'KBOS', 'KDCA'].map(station => {
                  const stationAircraft = oosEntries.filter(e => e.station === station);
                  const count = stationAircraft.length;
                  return (
                    <button
                      key={station}
                      onClick={() => setSelectedLocation(station)}
                      disabled={count === 0}
                      className={cn(
                        'py-3 px-4 rounded-xl text-sm font-bold transition-all text-left',
                        count > 0
                          ? 'bg-orange-600 text-white hover:bg-orange-500'
                          : 'bg-[#0a0e18] text-gray-600 cursor-not-allowed'
                      )}
                    >
                      <p className="font-extrabold">{station}</p>
                      <p className="text-[10px] mt-1 font-mono">{stationAircraft.map(a => a.aircraft_tail).join(', ') || 'None'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'mel'     && <MccMelBoard melItems={melItems} aircraft={aircraft} />}
        {activeTab === 'faults'  && <MccFaultBoard faults={faults} aircraft={aircraft} />}
        {activeTab === 'parts'   && <MccPartsBoard parts={parts} oosEntries={oosEntries} />}
        {activeTab === 'tooling' && <MccToolingBoard tools={tools} />}
        {activeTab === 'technician' && (
          <div className="space-y-5">
            <ShiftHandoverModule />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">Active Technicians</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-primary">12</p>
                  <p className="text-xs text-muted-foreground mt-1">On shift today</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">Assigned Tasks</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-amber-400">8</p>
                  <p className="text-xs text-muted-foreground mt-1">In progress</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Technician Dashboard</p>
              <p className="text-sm text-muted-foreground">Maintenance Control Technician oversight and task management dashboard.</p>
            </div>
          </div>
        )}
        {activeTab === 'supervisor' && (
          <div className="space-y-5">
            <SupervisorHandoverModule />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">Teams</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-primary">3</p>
                  <p className="text-xs text-muted-foreground mt-1">MCC teams</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-bold text-foreground">Completion Rate</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-amber-400">94%</p>
                  <p className="text-xs text-muted-foreground mt-1">Tasks completed</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <p className="text-sm font-bold text-foreground">Critical Issues</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-orange-400">2</p>
                  <p className="text-xs text-muted-foreground mt-1">Escalated</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'mro' && (
          <MROIntegrationHub />
        )}
        </div>

        {/* Aircraft Recovery Modal */}
         {selectedLocation && (
           <AircraftRecoveryModal
             selectedLocation={selectedLocation}
             onClose={() => setSelectedLocation(null)}
             oosEntries={oosEntries}
             aircraft={aircraft}
             fieldTrips={fieldTrips}
             onEditTrip={setEditingTrip}
           />
         )}

         {/* Field Trip Edit Modal */}
         {editingTrip && (
           <FieldTripModal
             trip={editingTrip?.id ? editingTrip : null}
             station={editingTrip.station || selectedLocation}
             onClose={() => setEditingTrip(null)}
           />
         )}
        </div>
        );
        }