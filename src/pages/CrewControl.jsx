import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, AlertTriangle, Brain, RefreshCw, Zap, GitMerge, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDynamicPolling } from '@/hooks/useDynamicPolling';
import CrewStatusBoard from '@/components/crew/CrewStatusBoard';
import RovingTabindexList from '@/components/accessibility/RovingTabindexList';
import FatiguePredictor from '@/components/crew/FatiguePredictor';
import OpsPipeline from '@/components/crew/OpsPipeline';

const TODAY = new Date().toISOString().split('T')[0];

const TABS = [
  { key: 'pipeline', label: 'Ops Pipeline',       icon: GitMerge },
  { key: 'board',    label: 'Crew Board',          icon: Users },
  { key: 'fatigue',  label: 'Fatigue Predictor',   icon: Brain },
];

export default function CrewControl() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const pollingInterval = useDynamicPolling(30000, 300000); // 30s active, 5min hidden

  const { data: crew = [], isLoading, refetch: refetchCrew } = useQuery({
    queryKey: ['crew-control', TODAY],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: flights = [], refetch: refetchFlights } = useQuery({
    queryKey: ['cc-flights', TODAY],
    queryFn: () => base44.entities.Flight.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: releases = [], refetch: refetchReleases } = useQuery({
    queryKey: ['cc-releases', TODAY],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: TODAY }),
    refetchInterval: pollingInterval,
  });

  const { data: oosEntries = [], refetch: refetchOOS } = useQuery({
    queryKey: ['cc-oos'],
    queryFn: () => base44.entities.OOSEntry.list(),
    refetchInterval: pollingInterval,
  });

  const refetch = () => { refetchCrew(); refetchFlights(); refetchReleases(); refetchOOS(); };

  const illegal  = crew.filter(c => c.legal_status === 'illegal').length;
  const near     = crew.filter(c => c.legal_status === 'near_limit').length;
  const legal    = crew.filter(c => c.legal_status === 'legal' || !c.legal_status).length;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" aria-label="Go to Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Users className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">CREW CONTROL</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Real-Time · FAR 117 · AI Assist</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-lg font-mono font-bold text-foreground">{timeStr} Z</p>
            <button 
              onClick={refetch}
              aria-label="Sync all crew control data from server"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded px-2 py-1"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" /> Sync
            </button>
          </div>
        </div>

        {/* Alert banner if violations */}
        {(illegal > 0 || near > 0) && (
          <div className={cn(
           'mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
           illegal > 0 ? 'bg-destructive/15 text-destructive border border-destructive/30' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
          )} role="alert" aria-live="assertive">
           <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
           {illegal > 0
             ? `⚠ ${illegal} crew member${illegal > 1 ? 's' : ''} in VIOLATION — immediate action required`
             : `${near} crew member${near > 1 ? 's' : ''} approaching FAR 117 limits`}
          </div>
          )}

        {/* Stat pills */}
        <div className="flex gap-2 mt-3">
          {[
            { label: 'Legal', value: legal,   color: 'text-green-400 bg-green-500/15' },
            { label: 'Near',  value: near,    color: 'text-orange-400 bg-orange-500/15' },
            { label: 'Illegal', value: illegal, color: 'text-destructive bg-destructive/15' },
          ].map(({ label, value, color }) => (
            <span key={label} className={cn('text-xs font-bold px-3 py-1 rounded-full', color)}>
              {value} {label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <RovingTabindexList
          items={TABS}
          ariaLabel="Crew Control operations navigation with keyboard support"
          role="tablist"
          className="flex gap-0.5 px-4 py-2 overflow-x-auto scrollbar-hide"
          renderItem={({ key, label, icon: Icon }, index, { focusedIndex, handleKeyDown, getTabIndex, registerRef }) => (
            <button 
              key={key}
              ref={(el) => registerRef(index, el)}
              tabIndex={getTabIndex(index)}
              onClick={() => setActiveTab(key)}
              onKeyDown={handleKeyDown}
              role="tab"
              aria-selected={activeTab === key}
              aria-label={`${label}${activeTab === key ? ' - currently selected' : ''}`}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                focusedIndex === index && 'ring-2 ring-primary ring-offset-2'
              )}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />{label}
            </button>
          )}
        />
      </div>

      <div className="p-4" role="main" aria-label="Crew Control operations content">
        {activeTab === 'pipeline' && <OpsPipeline crew={crew} flights={flights} releases={releases} oosEntries={oosEntries} />}
        {activeTab === 'board'    && <CrewStatusBoard crew={crew} flights={flights} isLoading={isLoading} />}
        {activeTab === 'fatigue'  && <FatiguePredictor crew={crew} flights={flights} />}
      </div>
    </div>
  );
}