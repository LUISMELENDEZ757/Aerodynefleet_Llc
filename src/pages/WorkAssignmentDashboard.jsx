import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import DailyAssignmentsPanel from '@/components/workassignments/DailyAssignmentsPanel';
import ForecastedWorkPanel from '@/components/workassignments/ForecastedWorkPanel';
import ThroughFlightWorkPanel from '@/components/workassignments/ThroughFlightWorkPanel';
import TechSupportPanel from '@/components/workassignments/TechSupportPanel';
import CreateTaskPanel from '@/components/workassignments/CreateTaskPanel';

const TABS = [
  { id: 'daily', label: '📋 Daily Assignments' },
  { id: 'create', label: '➕ Create Task' },
  { id: 'through_flight', label: '✈️ Through-Flight' },
  { id: 'tech_support', label: '🔧 Tech Support' },
  { id: 'forecast', label: '📈 Forecast' },
];

export default function WorkAssignmentDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('daily');

  // Aircraft list (shared by child panels)
  const { data: aircraft = [] } = useQuery({
    queryKey: ['wad-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 300000,
  });

  // BOW / daily assignments from SupplyRequisition
  const { data: bowItems = [], isLoading: bowLoading, refetch: refetchBow } = useQuery({
    queryKey: ['bow-daily-assignments'],
    queryFn: () => base44.entities.SupplyRequisition.list('-created_date', 200),
    select: (data) => data.map(item => ({
      id: item.id,
      aircraft_tail: item.aircraft_tail || 'N/A',
      work_scope: item.part_name,
      station: item.station,
      estimated_hours: 2,
      priority: item.priority || 'routine',
      technician: item.requested_by,
      status: item.status === 'approved' ? 'scheduled' :
              item.status === 'ordered' ? 'in_progress' :
              item.status === 'received' ? 'complete' : 'scheduled',
    })),
    refetchInterval: 60000,
  });

  // Forecasted maintenance
  const { data: forecasts = [], isLoading: forecastLoading } = useQuery({
    queryKey: ['maintenance-forecast-workload'],
    queryFn: () => base44.entities.MaintenanceForecast.list('-suggested_window_start', 200),
    refetchInterval: 300000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }) =>
      base44.entities.SupplyRequisition.update(id, {
        status: newStatus === 'in_progress' ? 'ordered' :
                newStatus === 'complete' ? 'received' : 'approved',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bow-daily-assignments'] }),
  });

  const isLoading = bowLoading || forecastLoading;

  // KPI stats across all task types
  const stats = [
    { label: 'BOW Tasks', value: bowItems.length, color: 'text-blue-400' },
    { label: 'Scheduled', value: bowItems.filter(a => a.status === 'scheduled').length, color: 'text-blue-400' },
    { label: 'In Progress', value: bowItems.filter(a => a.status === 'in_progress').length, color: 'text-yellow-400' },
    { label: 'Complete', value: bowItems.filter(a => a.status === 'complete').length, color: 'text-green-400' },
  ];

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
              <h1 className="text-lg font-extrabold text-foreground">Work Assignment Dashboard</h1>
              <p className="text-xs text-primary tracking-widest uppercase">BOW · Through-Flight · Tech Support · Forecast</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LiveClock />
            <button onClick={() => refetchBow()}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-secondary/50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className={cn('text-2xl font-black mt-1', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors',
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-6xl mx-auto">
        {activeTab === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DailyAssignmentsPanel
                assignments={bowItems}
                onStatusChange={(id, newStatus) => statusMutation.mutate({ id, newStatus })}
              />
            </div>
            <div>
              <ForecastedWorkPanel forecasts={forecasts} />
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <CreateTaskPanel aircraft={aircraft} />
        )}

        {activeTab === 'through_flight' && (
          <ThroughFlightWorkPanel aircraft={aircraft} />
        )}

        {activeTab === 'tech_support' && (
          <TechSupportPanel aircraft={aircraft} />
        )}

        {activeTab === 'forecast' && (
          <div className="max-w-2xl">
            <ForecastedWorkPanel forecasts={forecasts} />
          </div>
        )}
      </div>
    </div>
  );
}