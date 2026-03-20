import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Radio, Plane, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import useDispatchPolicy from '@/hooks/useDispatchPolicy';
import DispatchLogicEngine from './DispatchLogicEngine';

const TODAY = new Date().toISOString().split('T')[0];

export default function DispatchPanel({ flights = [] }) {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [expandedPolicy, setExpandedPolicy] = useState(false);

  // Fetch aircraft for selected flight
  const { data: aircraft } = useQuery({
    queryKey: ['dispatch-aircraft', selectedFlight?.aircraft_tail],
    queryFn: () => base44.entities.Aircraft.filter({ tail_number: selectedFlight?.aircraft_tail }),
    enabled: !!selectedFlight?.aircraft_tail,
    select: (data) => data[0] || null,
  });

  // Fetch dispatch policy for aircraft type
  const { policy, isLoading: policyLoading } = useDispatchPolicy(aircraft?.aircraft_type);

  // Fetch performance profile
  const { data: performanceProfile } = useQuery({
    queryKey: ['dispatch-perf', aircraft?.aircraft_type],
    queryFn: () => base44.entities.PerformanceProfile.filter({ aircraft_type: aircraft?.aircraft_type }),
    enabled: !!aircraft?.aircraft_type,
    select: (data) => data[0] || null,
  });

  if (flights.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No flights available for dispatch review
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Flight selector */}
      <div>
        <label className="text-xs text-muted-foreground block mb-2 font-semibold">Select Flight for Dispatch</label>
        <div className="space-y-1">
          {flights.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFlight(f)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left border transition-all',
                selectedFlight?.id === f.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-secondary'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Plane className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-mono font-bold">{f.flight_number}</p>
                  <p className="text-xs opacity-80">{f.origin} → {f.destination} · {f.aircraft_tail}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Policy info */}
      {selectedFlight && policy && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <button
            onClick={() => setExpandedPolicy(!expandedPolicy)}
            className="w-full px-4 py-3 hover:bg-secondary/40 transition-colors flex items-start justify-between border-b border-border/50"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  {aircraft?.aircraft_type} Dispatch Policy
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ETOPS {policy.max_etops_minutes}min · {policy.category}
                </p>
              </div>
            </div>
            {expandedPolicy ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {expandedPolicy && (
            <div className="p-4 space-y-4">
              {/* Fuel policy */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fuel Policy</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Trip Fuel Margin', value: `${policy.min_fuel_policy?.trip_fuel || 5}%` },
                    { label: 'Contingency', value: `${policy.min_fuel_policy?.contingency || 5}%` },
                    { label: 'Alternate', value: `${policy.min_fuel_policy?.alternate || 10}%` },
                    { label: 'Final Reserve', value: `${(policy.min_fuel_policy?.final_reserve || 3200).toLocaleString()} lbs` },
                    { label: 'Extra Margin', value: `${(policy.min_fuel_policy?.extra_margin || 1000).toLocaleString()} lbs` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternate rules */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alternate Selection</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Min Runway Length', value: `${(policy.alternate_selection?.min_runway_length || 5000).toLocaleString()} ft` },
                    { label: 'Min RVR', value: `${(policy.alternate_selection?.min_weather_minima_rvr || 2400).toLocaleString()} ft` },
                    { label: 'Preferred Distance', value: `${policy.alternate_selection?.preferred_distance_nm || 200} NM` },
                    { label: 'Max Distance', value: `${policy.alternate_selection?.max_distance_nm || 400} NM` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* MEL rules */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">MEL / CDL</p>
                <div className="space-y-1.5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Inoperable systems (grounds flight)</p>
                    <p className="text-xs font-mono text-foreground">{(policy.mel_rules?.inoperable_systems || []).join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Deferrable systems</p>
                    <p className="text-xs font-mono text-foreground">{(policy.mel_rules?.deferrable_systems || []).join(', ') || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Max concurrent deferrals</p>
                    <p className="text-xs font-bold text-foreground">{policy.mel_rules?.max_deferred_items || 2}</p>
                  </div>
                </div>
              </div>

              {/* Dispatch workflow */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dispatch Workflow</p>
                <div className="space-y-1">
                  {(policy.dispatch_workflow || []).map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center font-bold flex items-center justify-center text-xs">{idx + 1}</span>
                      <span className="text-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {policy.notes && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-400 font-semibold mb-1">Policy Notes</p>
                  <p className="text-xs text-blue-300">{policy.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dispatch logic engine */}
      {selectedFlight && policyLoading ? (
        <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Loading policy…
        </div>
      ) : selectedFlight && policy ? (
        <DispatchLogicEngine flight={selectedFlight} policy={policy} performanceProfile={performanceProfile} />
      ) : null}
    </div>
  );
}