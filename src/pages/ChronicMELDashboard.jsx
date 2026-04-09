import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import MELKpiBar from '@/components/mel/MELKpiBar';
import ChronicItemsWatchlist from '@/components/mel/ChronicItemsWatchlist';
import MELControlBoard from '@/components/mel/MELControlBoard';
import ReliabilityTrends from '@/components/mel/ReliabilityTrends';
import EngineeringActionQueue from '@/components/mel/EngineeringActionQueue';
import AITroubleshootingAssistant from '@/components/mel/AITroubleshootingAssistant';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'chronic', label: 'Chronic Items' },
  { id: 'mel', label: 'MEL Oversight' },
  { id: 'reliability', label: 'Reliability Trends' },
  { id: 'engineering', label: 'Engineering Queue' },
  { id: 'aircraft', label: 'Aircraft History' },
  { id: 'ai', label: 'AI Recommendations' },
];

export default function ChronicMELDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { isLoading, refetch } = useQuery({
    queryKey: ['chronic-mel-data'],
    queryFn: async () => {
      const [mels, melItems, logbookEntries] = await Promise.all([
        base44.entities.MELItem.list('-deferred_date', 100),
        base44.entities.MELItem.filter({ status: 'open' }),
        base44.entities.LogbookEntry.list('-created_date', 100),
      ]);
      return { mels, melItems, logbookEntries };
    },
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <span>🔧</span> Chronic Item & MEL Control
              </h1>
              <p className="text-xs text-primary tracking-widest uppercase">TechOps Engineering Center</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide pb-2">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
        {activeTab === 'overview' && (
          <>
            <MELKpiBar stats={{
              openMels: 42,
              chronicItems: 18,
              repeatWriteUps: 27,
              melsExpiring: { urgent: 6, warning: 4, watch: 3 },
              highDefectAircraft: 5,
            }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ChronicItemsWatchlist />
                <MELControlBoard />
              </div>

              <div className="bg-card border border-border rounded-2xl p-4">
                <AITroubleshootingAssistant />
              </div>
            </div>

            <ReliabilityTrends />
            <EngineeringActionQueue />
          </>
        )}

        {activeTab === 'chronic' && (
          <div className="space-y-6">
            <MELKpiBar stats={{ chronicItems: 18 }} />
            <ChronicItemsWatchlist />
          </div>
        )}

        {activeTab === 'mel' && (
          <div className="space-y-6">
            <MELKpiBar stats={{ openMels: 42, melsExpiring: { urgent: 6, warning: 4, watch: 3 } }} />
            <MELControlBoard />
          </div>
        )}

        {activeTab === 'reliability' && (
          <div className="space-y-6">
            <ReliabilityTrends />
          </div>
        )}

        {activeTab === 'engineering' && (
          <div className="space-y-6">
            <EngineeringActionQueue />
          </div>
        )}

        {['aircraft', 'ai'].includes(activeTab) && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{TABS.find(t => t.id === activeTab)?.label} module coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}