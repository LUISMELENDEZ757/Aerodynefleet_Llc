import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { CalendarDays, GitMerge, Plane, Users, ArrowLeftRight, Zap, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import PairingGenerator  from '@/components/scheduling/PairingGenerator';
import Bidlines          from '@/components/scheduling/Bidlines';
import ReserveAssignment from '@/components/scheduling/ReserveAssignment';
import AircraftRouting   from '@/components/scheduling/AircraftRouting';
import SwapsRecovery     from '@/components/scheduling/SwapsRecovery';

const TODAY = new Date().toISOString().split('T')[0];

const TABS = [
  { key: 'pairings',  label: 'Pairings',          icon: GitMerge },
  { key: 'bidlines',  label: 'Bidlines',           icon: CalendarDays },
  { key: 'reserve',   label: 'Reserve',            icon: Users },
  { key: 'routing',   label: 'Aircraft Routing',   icon: Plane },
  { key: 'swaps',     label: 'Swaps & Recovery',   icon: ArrowLeftRight },
];

export default function Scheduling() {
  const [activeTab, setActiveTab] = useState('pairings');

  const { data: flights = [], isLoading, refetch: refetchFlights } = useQuery({
    queryKey: ['sched-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: crew = [], refetch: refetchCrew } = useQuery({
    queryKey: ['sched-crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const refetch = () => { refetchFlights(); refetchCrew(); };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const airborne  = flights.filter(f => f.status === 'airborne').length;
  const delayed   = flights.filter(f => f.status === 'delayed' || f.delay_minutes > 0).length;
  const onGround  = flights.filter(f => ['scheduled', 'boarding'].includes(f.status)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <CalendarDays className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">SCHEDULING</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Crew & Aircraft Pairing · Bidlines · Recovery</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button onClick={refetch} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Sync
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {[
            { label: `${flights.length} Flights`, color: 'text-foreground bg-secondary' },
            { label: `${airborne} Airborne`, color: 'text-green-400 bg-green-500/15' },
            { label: `${delayed} Delayed`, color: delayed > 0 ? 'text-orange-400 bg-orange-500/15' : 'text-muted-foreground bg-muted' },
            { label: `${crew.length} Crew Assigned`, color: 'text-primary bg-primary/15' },
          ].map(({ label, color }) => (
            <span key={label} className={cn('text-xs font-bold px-3 py-1 rounded-full', color)}>{label}</span>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border bg-card">
        <div className="flex gap-0.5 px-4 py-2 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0',
                activeTab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'pairings' && <PairingGenerator flights={flights} crew={crew} />}
        {activeTab === 'bidlines' && <Bidlines />}
        {activeTab === 'reserve'  && <ReserveAssignment flights={flights} crew={crew} />}
        {activeTab === 'routing'  && <AircraftRouting flights={flights} />}
        {activeTab === 'swaps'    && <SwapsRecovery flights={flights} crew={crew} />}
      </div>
    </div>
  );
}