import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Plus } from 'lucide-react';
import DailyAssignmentsPanel from '@/components/workassignments/DailyAssignmentsPanel';
import ForecastedWorkPanel from '@/components/workassignments/ForecastedWorkPanel';

export default function WorkAssignmentDashboard() {
  const qc = useQueryClient();
  const [showNewModal, setShowNewModal] = useState(false);

  // Fetch daily assignments (BOW items)
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

  // Fetch forecasted maintenance
  const { data: forecasts = [], isLoading: forecastLoading } = useQuery({
    queryKey: ['maintenance-forecast-workload'],
    queryFn: () => base44.entities.MaintenanceForecast.list('-suggested_window_start', 200),
    refetchInterval: 300000,
  });

  // Update assignment status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.SupplyRequisition.update(id, {
        status: status === 'in_progress' ? 'ordered' :
                status === 'complete' ? 'received' : 'approved',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bow-daily-assignments'] }),
  });

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, newStatus });
  };

  const isLoading = bowLoading || forecastLoading;

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
              <p className="text-xs text-primary tracking-widest uppercase">BOW Integration • Daily & Forecasted Tasks</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetchBow()}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowNewModal(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Assignment
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total Tasks', value: bowItems.length, color: 'text-blue-400' },
            { label: 'Scheduled', value: bowItems.filter(a => a.status === 'scheduled').length, color: 'text-blue-400' },
            { label: 'In Progress', value: bowItems.filter(a => a.status === 'in_progress').length, color: 'text-yellow-400' },
            { label: 'Complete', value: bowItems.filter(a => a.status === 'complete').length, color: 'text-green-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-secondary/50 rounded-xl px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Assignments (2 cols) */}
          <div className="lg:col-span-2">
            <DailyAssignmentsPanel assignments={bowItems} onStatusChange={handleStatusChange} />
          </div>

          {/* Forecasted Workload (1 col) */}
          <div>
            <ForecastedWorkPanel forecasts={forecasts} />
          </div>
        </div>
      </div>

      {/* New Assignment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-foreground">New Work Assignment</h2>
            <p className="text-xs text-muted-foreground">Coming soon — link BOW items and assign to daily queue</p>
            <button onClick={() => setShowNewModal(false)}
              className="w-full py-2.5 rounded-lg bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}