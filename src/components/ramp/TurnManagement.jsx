import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Clock, AlertTriangle, Zap, Package, User,
  Droplet, UtensilsCrossed, Trash2, Wind, ChevronDown, Play, Pause
} from 'lucide-react';
import { format } from 'date-fns';

const GROUND_TASKS = [
  {
    id: 'fuel',
    label: 'Refueling',
    icon: Droplet,
    duration: 20,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    dependsOn: [],
  },
  {
    id: 'catering',
    label: 'Catering',
    icon: UtensilsCrossed,
    duration: 15,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    dependsOn: [],
  },
  {
    id: 'baggage',
    label: 'Baggage Loading',
    icon: Package,
    duration: 25,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    dependsOn: [],
  },
  {
    id: 'cleaning',
    label: 'Cabin Cleaning',
    icon: Wind,
    duration: 18,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    dependsOn: ['baggage'],
  },
];

function TaskCard({ task, status, onStart, onComplete }) {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isPending = status === 'pending';
  const Icon = task.icon;

  return (
    <div className={cn(
      'border rounded-lg p-3 transition-all',
      isCompleted ? 'border-green-500/40 bg-green-500/10' :
      isInProgress ? 'border-yellow-500/40 bg-yellow-500/10' :
      'border-slate-600/40 bg-slate-800/30'
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', task.color)} />
          <span className="text-xs font-bold text-foreground">{task.label}</span>
        </div>
        {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
        {isInProgress && <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 animate-pulse" />}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isCompleted ? 'w-full bg-green-500' :
              isInProgress ? 'w-2/3 bg-yellow-500 animate-pulse' :
              'w-0 bg-slate-600'
            )}
          />
        </div>
      </div>

      {/* Task Info */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">~{task.duration}min</span>
        <div className="flex items-center gap-2">
          {isPending && (
            <button
              onClick={() => onStart(task.id)}
              className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-[9px] transition-colors"
            >
              Start
            </button>
          )}
          {isInProgress && (
            <button
              onClick={() => onComplete(task.id)}
              className="px-2 py-0.5 rounded bg-green-600 hover:bg-green-500 text-white font-bold text-[9px] transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FlightTurnCard({ flight, taskStatuses, onTaskStart, onTaskComplete }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate turn time (time until next departure)
  const scheduledDeparture = new Date(flight.scheduled_departure);
  const now = new Date();
  const turnTimeMinutes = Math.floor((scheduledDeparture - now) / 60000);
  const allTasksComplete = Object.values(taskStatuses[flight.id] || {}).every(s => s === 'completed');

  return (
    <div className="border border-slate-600/40 rounded-xl bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div>
            <p className="text-sm font-mono font-bold text-cyan-400">{flight.flight_number}</p>
            <p className="text-xs text-muted-foreground">{flight.aircraft_type}</p>
          </div>
          <div className="hidden sm:block text-xs text-muted-foreground">
            {flight.destination}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Turn Time */}
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold',
            turnTimeMinutes < 30 ? 'bg-red-500/20 text-red-400' :
            turnTimeMinutes < 60 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          )}>
            <Clock className="w-3.5 h-3.5" />
            {turnTimeMinutes}m
          </div>

          {/* All Tasks Complete Indicator */}
          {allTasksComplete && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready
            </div>
          )}

          {/* Expand */}
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-700/50 px-4 py-4 bg-slate-800/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GROUND_TASKS.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={taskStatuses[flight.id]?.[task.id] || 'pending'}
                onStart={() => onTaskStart(flight.id, task.id)}
                onComplete={() => onTaskComplete(flight.id, task.id)}
              />
            ))}
          </div>

          {/* Critical Path */}
          <div className="border-t border-slate-700/50 pt-3 text-xs space-y-2">
            <p className="font-bold text-foreground flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Critical Path
            </p>
            <div className="text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                Fuel + Catering can run in parallel
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                Baggage must complete before cleaning
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                Est. total turn time: ~50 minutes
              </div>
            </div>
          </div>

          {/* Crew Assignments */}
          <div className="border-t border-slate-700/50 pt-3 text-xs space-y-2">
            <p className="font-bold text-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-400" /> Assigned Personnel
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Fueling crew: 3
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Catering: 2
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Baggage: 4
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Cleaning: 2
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TurnManagement({ flights = [], station = 'KEWR' }) {
  const [taskStatuses, setTaskStatuses] = useState({});

  // Initialize task statuses
  const initTaskStatuses = (flightId) => {
    if (!taskStatuses[flightId]) {
      const newStatuses = { ...taskStatuses };
      newStatuses[flightId] = {};
      GROUND_TASKS.forEach(task => {
        newStatuses[flightId][task.id] = 'pending';
      });
      return newStatuses;
    }
    return taskStatuses;
  };

  const handleTaskStart = (flightId, taskId) => {
    const updated = initTaskStatuses(flightId);
    updated[flightId][taskId] = 'in_progress';
    setTaskStatuses(updated);
  };

  const handleTaskComplete = (flightId, taskId) => {
    const updated = initTaskStatuses(flightId);
    updated[flightId][taskId] = 'completed';
    setTaskStatuses(updated);
  };

  // Filter departures (flights that need turn management)
  const departures = flights.filter(f => f.direction === 'departure');

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-cyan-400">{departures.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Flights</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-yellow-400">
            {departures.filter(f => Object.values(taskStatuses[f.id] || {}).some(s => s === 'in_progress')).length}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">In Progress</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-green-400">
            {departures.filter(f => Object.values(taskStatuses[f.id] || {}).every(s => s === 'completed')).length}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Ready</p>
        </div>
      </div>

      {/* Flight Turn Cards */}
      <div className="space-y-3">
        {departures.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No departures scheduled
          </div>
        ) : (
          departures.map(flight => (
            <FlightTurnCard
              key={flight.id}
              flight={flight}
              taskStatuses={taskStatuses}
              onTaskStart={handleTaskStart}
              onTaskComplete={handleTaskComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}