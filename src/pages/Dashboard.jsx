import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plane, RefreshCw } from 'lucide-react';
import OpsStatBar from '@/components/flightops/OpsStatBar';
import FlightStatusBoard from '@/components/flightops/FlightStatusBoard';
import CrewBoard from '@/components/flightops/CrewBoard';
import DispatchBoard from '@/components/flightops/DispatchBoard';
import WeatherPanel from '@/components/flightops/WeatherPanel';
import DispatchPanel from '@/components/dispatch/DispatchPanel';

const TODAY = new Date().toISOString().split('T')[0];

const TABS = [
  { key: 'flights',  label: 'Flight Board' },
  { key: 'crew',     label: 'Crew Legality' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'weather',  label: 'WX / METAR' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('flights');

  const { data: flights = [], isLoading: loadingFlights, refetch: refetchFlights } = useQuery({
    queryKey: ['flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: crew = [], isLoading: loadingCrew, refetch: refetchCrew } = useQuery({
    queryKey: ['crew', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const { data: releases = [], isLoading: loadingReleases, refetch: refetchReleases } = useQuery({
    queryKey: ['releases', TODAY],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: TODAY }),
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    refetchFlights();
    refetchCrew();
    refetchReleases();
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide leading-tight">
                AERODYNE FLEET LLC
              </h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Flight Operations</p>
            </div>
          </div>
          <div className="flex items-end gap-3 flex-col text-right">
            <p className="text-2xl font-mono font-bold text-foreground">{timeStr}</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh data
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stat bar */}
        <OpsStatBar flights={flights} crew={crew} releases={releases} />

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'flights' && (
          <FlightStatusBoard flights={flights} isLoading={loadingFlights} />
        )}
        {activeTab === 'crew' && (
          <CrewBoard crew={crew} isLoading={loadingCrew} />
        )}
        {activeTab === 'dispatch' && (
          <DispatchBoard releases={releases} isLoading={loadingReleases} />
        )}
        {activeTab === 'weather' && (
          <WeatherPanel flights={flights} />
        )}
      </div>
    </div>
  );
}