import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_LABELS = { captain: 'CPT', first_officer: 'F/O', dispatcher: 'DISP', flight_attendant: 'F/A' };

const LEGAL_CONFIG = {
  legal:      { label: 'Legal',      color: 'text-green-400',   bg: 'bg-green-500/15' },
  near_limit: { label: 'Near Limit', color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  illegal:    { label: 'ILLEGAL',    color: 'text-destructive', bg: 'bg-destructive/15' },
};

/**
 * Crew Board with optimistic UI mutations
 * Updates crew legality status locally before server confirmation
 */
export default function CrewBoardOptimistic({ flightDate }) {
  const queryClient = useQueryClient();

  const { data: crew = [], isLoading } = useQuery({
    queryKey: ['crew-board', flightDate],
    queryFn: () => base44.entities.CrewAssignment.filter({ flight_date: flightDate }),
  });

  // Optimistic mutation for crew legality updates
  const updateLegalityMutation = useMutation({
    mutationFn: ({ id, legalStatus }) => 
      base44.entities.CrewAssignment.update(id, { legal_status: legalStatus }),
    
    onMutate: async ({ id, legalStatus }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['crew-board', flightDate] });

      // Snapshot current data
      const previous = queryClient.getQueryData(['crew-board', flightDate]);

      // Optimistically update cache
      queryClient.setQueryData(['crew-board', flightDate], (old = []) =>
        old.map(c => c.id === id ? { ...c, legal_status: legalStatus } : c)
      );

      return { previous };
    },

    onError: (_err, _data, ctx) => {
      // Revert on error
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(['crew-board', flightDate], ctx.previous);
      }
    },

    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['crew-board', flightDate] });
    },
  });

  const illegalCount = useMemo(() => 
    crew.filter(c => c.legal_status === 'illegal').length, [crew]
  );

  const nearLimitCount = useMemo(() => 
    crew.filter(c => c.legal_status === 'near_limit').length, [crew]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading crew assignments...
      </div>
    );
  }

  if (crew.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No crew assignments for this date
      </div>
    );
  }

  return (
    <div className="space-y-3" role="region" aria-label="Crew legality board">
      {/* Alert if violations */}
      {illegalCount > 0 && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3" role="alert" aria-live="polite">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-bold text-destructive">
            {illegalCount} FAR 117 violation{illegalCount > 1 ? 's' : ''} — Immediate action required
          </p>
        </div>
      )}

      {/* Crew list */}
      {crew.map(c => {
        const legal = LEGAL_CONFIG[c.legal_status] || LEGAL_CONFIG.legal;
        const isLoading = updateLegalityMutation.isPending;

        return (
          <div key={c.id} className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.crew_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[c.role] || c.role}
                    {c.duty_start && <span className="ml-1.5">{c.duty_start}–{c.duty_end}</span>}
                  </p>
                </div>
              </div>

              {/* Status dropdown with optimistic update */}
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', legal.bg, legal.color)}>
                  {legal.label}
                </span>
                {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
              </div>
            </div>

            {/* Crew details */}
            {(c.rest_hours_prior != null || c.total_flight_time_today != null) && (
              <div className="border-t border-border/50 px-4 py-2 grid grid-cols-2 gap-2 text-xs">
                {c.rest_hours_prior != null && (
                  <div className={cn(
                    'rounded-lg px-3 py-1.5',
                    c.rest_hours_prior < 10 ? 'bg-destructive/10' : 'bg-background/40'
                  )}>
                    <p className="text-muted-foreground">Rest</p>
                    <p className={cn(
                      'font-mono font-bold',
                      c.rest_hours_prior < 10 ? 'text-destructive' : 'text-foreground'
                    )}>
                      {c.rest_hours_prior}h
                    </p>
                  </div>
                )}
                {c.total_flight_time_today != null && (
                  <div className={cn(
                    'rounded-lg px-3 py-1.5',
                    c.total_flight_time_today > 8 ? 'bg-destructive/10' : 'bg-background/40'
                  )}>
                    <p className="text-muted-foreground">Flt Time</p>
                    <p className={cn(
                      'font-mono font-bold',
                      c.total_flight_time_today > 8 ? 'text-destructive' : 'text-foreground'
                    )}>
                      {c.total_flight_time_today}h
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}