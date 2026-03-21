import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Check, Lock, Star } from 'lucide-react';

const CREW = [
  { id: 'C001', name: 'Capt. Hayes',   role: 'captain',        seniority: 1 },
  { id: 'C002', name: 'F/O Ramirez',  role: 'first_officer',  seniority: 5 },
  { id: 'C003', name: 'Capt. Torres', role: 'captain',        seniority: 2 },
  { id: 'C004', name: 'F/O Park',     role: 'first_officer',  seniority: 8 },
  { id: 'C005', name: 'Capt. Williams',role:'captain',        seniority: 3 },
  { id: 'C006', name: 'F/O Chen',     role: 'first_officer',  seniority: 4 },
];

const BIDLINES = [
  { id: 'BL-A', label: 'Line A', days_off: 12, block_hrs: 78, destinations: ['KORD','KLAX','KDEN'], desirability: 5 },
  { id: 'BL-B', label: 'Line B', days_off: 10, block_hrs: 85, destinations: ['KJFK','KMIA','KBOS'], desirability: 4 },
  { id: 'BL-C', label: 'Line C', days_off: 8,  block_hrs: 91, destinations: ['KORD','KDFW','KLAS'], desirability: 3 },
  { id: 'BL-D', label: 'Line D', days_off: 11, block_hrs: 74, destinations: ['KLAX','KSFO','KPDX'], desirability: 5 },
  { id: 'BL-E', label: 'Line E', days_off: 9,  block_hrs: 88, destinations: ['KATL','KBNA','KMEM'], desirability: 2 },
  { id: 'BL-F', label: 'Line F', days_off: 7,  block_hrs: 95, destinations: ['KJFK','KLGA','KEWR'], desirability: 1 },
];

export default function Bidlines() {
  const [assignments, setAssignments] = useState({});
  const [biddingOpen, setBiddingOpen] = useState(true);

  const availableForCrew = (crewId) => {
    const assigned = Object.entries(assignments).filter(([bl, cid]) => cid === crewId).map(([bl]) => bl);
    const takenLines = Object.keys(assignments);
    return BIDLINES.filter(bl => !takenLines.includes(bl.id) || assignments[bl.id] === crewId);
  };

  const assignBidline = (crewId, lineId) => {
    if (!biddingOpen) return;
    setAssignments(prev => {
      const next = { ...prev };
      // Remove any previous assignment for this crew
      Object.keys(next).forEach(k => { if (next[k] === crewId) delete next[k]; });
      if (lineId) next[lineId] = crewId;
      return next;
    });
  };

  const getAssignedCrew = (lineId) => CREW.find(c => c.id === assignments[lineId]);
  const getAssignedLine = (crewId) => BIDLINES.find(bl => assignments[bl.id] === crewId);

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="rounded-xl bg-card border border-border p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-foreground">Monthly Bidlines</p>
          <p className="text-xs text-muted-foreground">Seniority-based — {Object.keys(assignments).length}/{CREW.length} assigned</p>
        </div>
        <button
          onClick={() => setBiddingOpen(o => !o)}
          className={cn(
            'text-xs font-bold px-3 py-1.5 rounded-lg border transition-all',
            biddingOpen
              ? 'bg-green-500/15 text-green-400 border-green-500/30'
              : 'bg-muted text-muted-foreground border-border'
          )}
        >
          {biddingOpen ? '🔓 Bidding Open' : '🔒 Bidding Closed'}
        </button>
      </div>

      {/* Bidline cards */}
      <div className="space-y-2">
        {BIDLINES.map(bl => {
          const assignedCrew = getAssignedCrew(bl.id);
          return (
            <div key={bl.id} className={cn(
              'rounded-xl bg-card border border-border overflow-hidden',
              assignedCrew && 'border-green-500/30'
            )}>
              <div className="px-4 py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{bl.label}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-3 h-3', i < bl.desirability ? 'text-primary fill-primary' : 'text-border')} />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{bl.block_hrs}h block</span>
                      <span className="text-xs text-muted-foreground">{bl.days_off} days off</span>
                      <span className="text-xs font-mono text-muted-foreground">{bl.destinations.join(' · ')}</span>
                    </div>
                  </div>
                </div>
                {/* Assignment dropdown */}
                <select
                  value={assignments[bl.id] || ''}
                  onChange={e => assignBidline(e.target.value || null, e.target.value ? bl.id : null)}
                  disabled={!biddingOpen}
                  className="h-8 bg-secondary border border-border rounded-lg px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 flex-shrink-0"
                >
                  <option value="">Unassigned</option>
                  {CREW.sort((a, b) => a.seniority - b.seniority).map(c => (
                    <option key={c.id} value={c.id} disabled={!!getAssignedLine(c.id) && assignments[bl.id] !== c.id}>
                      #{c.seniority} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {assignedCrew && (
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                    <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-400 font-semibold">Assigned to {assignedCrew.name} (Seniority #{assignedCrew.seniority})</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}