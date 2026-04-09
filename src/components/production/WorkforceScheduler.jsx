import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function CapacityBar({ used, capacity, label }) {
  const percentage = (used / capacity) * 100;
  const isWarning = percentage > 80;
  const isOverloaded = percentage > 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400">{label}</p>
        <p className={cn('text-xs font-bold',
          isOverloaded ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
        )}>
          {Math.round(used)}h / {capacity}h
        </p>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all',
            isOverloaded ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function TechnicianCard({ tech, assignments, totalCapacity, onAssign }) {
  const usedHours = assignments
    .filter(a => a.assigned_to === tech.name)
    .reduce((sum, a) => sum + (a.estimated_hours || 0), 0);

  const capacityPercent = (usedHours / totalCapacity) * 100;
  const isOverloaded = usedHours > totalCapacity;
  const isWarning = usedHours > (totalCapacity * 0.8);

  return (
    <div className={cn('bg-[#0f1419] border rounded-2xl p-4 space-y-3',
      isOverloaded ? 'border-red-500/40' : isWarning ? 'border-yellow-500/40' : 'border-white/10'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-white">{tech.name}</p>
          <p className="text-xs text-gray-500">{tech.certification || 'A&P Certified'}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full',
          isOverloaded ? 'bg-red-900/50 text-red-400' : isWarning ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'
        )}>
          {tech.status || 'Available'}
        </span>
      </div>

      <CapacityBar used={usedHours} capacity={totalCapacity} label="Weekly Hours" />

      <button
        onClick={() => onAssign(tech)}
        className="w-full py-2 rounded-lg bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-3.5 h-3.5" /> Assign Task
      </button>
    </div>
  );
}

function AssignmentModal({ tech, bows, onClose, onConfirm }) {
  const [selectedBow, setSelectedBow] = useState(null);

  const handleSubmit = () => {
    if (!selectedBow) return;
    onConfirm(tech, selectedBow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-[#0f1419] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <p className="text-sm font-extrabold text-white">Assign {tech.name}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Technician</p>
            <p className="text-sm font-bold text-white">{tech.name}</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Select BOW Task</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bows.length === 0 ? (
                <p className="text-xs text-gray-600">No BOWs available</p>
              ) : (
                bows.map(bow => (
                  <button
                    key={bow.id}
                    onClick={() => setSelectedBow(bow)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedBow?.id === bow.id
                        ? 'bg-primary/20 border-primary'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-white">{bow.tail_number}</p>
                        <p className="text-[10px] text-gray-500">{bow.work_scope}</p>
                      </div>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{bow.estimated_hours}h</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!selectedBow} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkforceScheduler({ bows = [] }) {
  const [assignments, setAssignments] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const WEEKLY_CAPACITY = 40;

  const technicians = [
    { id: 1, name: 'John Smith', certification: 'A&P Licensed', status: 'Available' },
    { id: 2, name: 'Maria Garcia', certification: 'A&P Licensed', status: 'Available' },
    { id: 3, name: 'Robert Chen', certification: 'Airframe Specialist', status: 'Available' },
    { id: 4, name: 'Sarah Wilson', certification: 'Powerplant Specialist', status: 'On Leave' },
    { id: 5, name: 'David Martinez', certification: 'A&P Licensed', status: 'Available' },
    { id: 6, name: 'Jennifer Lee', certification: 'Avionics Tech', status: 'Available' },
  ];

  const availableTechs = technicians.filter(t => t.status === 'Available');
  const totalAllocatedHours = assignments.reduce((sum, a) => sum + (a.estimated_hours || 0), 0);
  const totalCapacityHours = availableTechs.length * WEEKLY_CAPACITY;
  const utilizationPercent = (totalAllocatedHours / totalCapacityHours) * 100;

  const handleAssignBow = (tech, bow) => {
    const assignment = {
      id: assignments.length + 1,
      assigned_to: tech.name,
      task: bow.work_scope,
      bow_id: bow.id,
      aircraft_tail: bow.tail_number,
      estimated_hours: bow.estimated_hours,
      created_date: new Date().toISOString(),
    };
    setAssignments([...assignments, assignment]);
    setShowAssignModal(null);
  };

  const handleRemoveAssignment = (id) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <h2 className="text-2xl font-black text-primary">WORKFORCE SCHEDULER</h2>
        </div>
        <p className="text-sm text-gray-400">Assign technicians to BOW tasks with capacity tracking</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Fleet Capacity</p>
          <CapacityBar used={totalAllocatedHours} capacity={totalCapacityHours} label="Total Hours" />
          <p className="text-xs text-gray-600 mt-2">{availableTechs.length} techs available • {utilizationPercent.toFixed(0)}% utilized</p>
        </div>

        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Assignments</p>
          <p className="text-3xl font-black text-cyan-400 mb-1">{assignments.length}</p>
          <p className="text-xs text-gray-600">BOW tasks assigned</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Available Technicians</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {availableTechs.map(tech => (
            <TechnicianCard
              key={tech.id}
              tech={tech}
              assignments={assignments}
              totalCapacity={WEEKLY_CAPACITY}
              onAssign={() => setShowAssignModal(tech)}
            />
          ))}
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Active Assignments</h3>
          <div className="space-y-2">
            {assignments.map(assignment => (
              <div key={assignment.id} className="flex items-center justify-between bg-[#0f1419] border border-white/10 rounded-xl p-4">
                <div className="flex-1">
                  <p className="font-bold text-white">{assignment.assigned_to}</p>
                  <p className="text-xs text-gray-500">{assignment.aircraft_tail} • {assignment.task}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-cyan-400">{assignment.estimated_hours}h</span>
                  <button
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    className="w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600/40 flex items-center justify-center text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAssignModal && (
        <AssignmentModal
          tech={showAssignModal}
          bows={bows}
          onClose={() => setShowAssignModal(null)}
          onConfirm={handleAssignBow}
        />
      )}
    </div>
  );
}