import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const RELEASE_STATUS = {
  pending:   { label: 'Pending',   color: 'text-muted-foreground', bg: 'bg-muted' },
  released:  { label: 'Released',  color: 'text-green-400',        bg: 'bg-green-500/15' },
  amended:   { label: 'Amended',   color: 'text-primary',          bg: 'bg-primary/15' },
  cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
};

/**
 * Dispatch Board with optimistic UI mutations
 * Updates release status and fuel data locally before server confirmation
 */
export default function DispatchBoardOptimistic({ flightDate }) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['dispatch-board', flightDate],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: flightDate }),
  });

  // Optimistic mutation for release status updates
  const updateReleaseMutation = useMutation({
    mutationFn: ({ id, status }) => 
      base44.entities.DispatchRelease.update(id, { release_status: status }),
    
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['dispatch-board', flightDate] });
      const previous = queryClient.getQueryData(['dispatch-board', flightDate]);

      queryClient.setQueryData(['dispatch-board', flightDate], (old = []) =>
        old.map(r => r.id === id ? { ...r, release_status: status } : r)
      );

      return { previous };
    },

    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(['dispatch-board', flightDate], ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-board', flightDate] });
    },
  });

  // Optimistic mutation for fuel updates
  const updateFuelMutation = useMutation({
    mutationFn: ({ id, fuelOnBoard }) => 
      base44.entities.DispatchRelease.update(id, { fuel_on_board: fuelOnBoard }),
    
    onMutate: async ({ id, fuelOnBoard }) => {
      await queryClient.cancelQueries({ queryKey: ['dispatch-board', flightDate] });
      const previous = queryClient.getQueryData(['dispatch-board', flightDate]);

      queryClient.setQueryData(['dispatch-board', flightDate], (old = []) =>
        old.map(r => r.id === id ? { ...r, fuel_on_board: fuelOnBoard } : r)
      );

      return { previous };
    },

    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(['dispatch-board', flightDate], ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-board', flightDate] });
    },
  });

  const releasedCount = useMemo(() => 
    releases.filter(r => r.release_status === 'released').length, [releases]
  );

  const pendingCount = useMemo(() => 
    releases.filter(r => r.release_status === 'pending').length, [releases]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading dispatch releases...
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No dispatch releases for this date
      </div>
    );
  }

  return (
    <div className="space-y-2" role="region" aria-label="Dispatch release board">
      {/* Summary stats */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/15 text-green-400">
          {releasedCount} Released
        </span>
        {pendingCount > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground">
            {pendingCount} Pending
          </span>
        )}
      </div>

      {/* Release list */}
      {releases.map(release => {
        const isExpanded = expandedId === release.id;
        const statusCfg = RELEASE_STATUS[release.release_status] || RELEASE_STATUS.pending;
        const isUpdating = updateReleaseMutation.isPending || updateFuelMutation.isPending;

        return (
          <div key={release.id} className="rounded-xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : release.id)}
              aria-expanded={isExpanded}
              aria-label={`${release.flight_number}: ${release.origin} to ${release.destination} - ${statusCfg.label}`}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-mono font-bold text-foreground">{release.flight_number}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {release.origin} → {release.destination}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', statusCfg.bg, statusCfg.color)}>
                  {statusCfg.label}
                </span>
                {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border/50 px-4 py-3 bg-secondary/10 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {release.fuel_on_board != null && (
                    <div className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground">Fuel On Board</p>
                      <p className="text-sm font-mono font-bold text-foreground">
                        {release.fuel_on_board.toLocaleString()} lbs
                      </p>
                    </div>
                  )}
                  {release.min_fuel_required != null && (
                    <div className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground">Min Required</p>
                      <p className="text-sm font-mono font-bold text-foreground">
                        {release.min_fuel_required.toLocaleString()} lbs
                      </p>
                    </div>
                  )}
                  {release.alternate && (
                    <div className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground">Alternate</p>
                      <p className="text-sm font-mono font-bold text-foreground">{release.alternate}</p>
                    </div>
                  )}
                  {release.dispatcher_name && (
                    <div className="bg-background/40 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground">Dispatcher</p>
                      <p className="text-sm font-semibold text-foreground">{release.dispatcher_name}</p>
                    </div>
                  )}
                </div>

                {release.remarks && (
                  <p className="text-xs text-foreground bg-background/40 rounded-lg px-3 py-2">{release.remarks}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}