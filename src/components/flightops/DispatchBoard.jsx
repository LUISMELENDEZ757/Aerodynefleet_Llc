import React, { useState } from 'react';
import { FileText, Cloud, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const RELEASE_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-muted-foreground', bg: 'bg-muted' },
  released:  { label: 'Released',  color: 'text-green-400',        bg: 'bg-green-500/15' },
  amended:   { label: 'Amended',   color: 'text-primary',          bg: 'bg-primary/15' },
  cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
};

function ReleaseRow({ release }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RELEASE_CONFIG[release.release_status] || RELEASE_CONFIG.pending;

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="text-sm font-mono font-bold text-foreground">{release.flight_number}</p>
            <p className="text-xs text-muted-foreground">
              {release.origin} → {release.destination}
              {release.alternate ? ` · ALT: ${release.alternate}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {release.dispatcher_name && (
            <span className="text-xs text-muted-foreground hidden sm:block">{release.dispatcher_name}</span>
          )}
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-secondary/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {release.fuel_on_board != null && (
              <div>
                <p className="text-xs text-muted-foreground">Fuel On Board</p>
                <p className="text-sm font-mono font-semibold text-foreground">{release.fuel_on_board.toLocaleString()} lbs</p>
              </div>
            )}
            {release.min_fuel_required != null && (
              <div>
                <p className="text-xs text-muted-foreground">Min Required</p>
                <p className="text-sm font-mono font-semibold text-foreground">{release.min_fuel_required.toLocaleString()} lbs</p>
              </div>
            )}
          </div>

          {(release.origin_wx || release.destination_wx || release.alternate_wx) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Cloud className="w-3.5 h-3.5" /> Weather
              </div>
              {release.origin_wx && (
                <div className="text-xs font-mono bg-background/50 rounded-lg px-3 py-2">
                  <span className="text-primary font-bold">{release.origin}</span> {release.origin_wx}
                </div>
              )}
              {release.destination_wx && (
                <div className="text-xs font-mono bg-background/50 rounded-lg px-3 py-2">
                  <span className="text-primary font-bold">{release.destination}</span> {release.destination_wx}
                </div>
              )}
              {release.alternate_wx && (
                <div className="text-xs font-mono bg-background/50 rounded-lg px-3 py-2">
                  <span className="text-muted-foreground font-bold">ALT {release.alternate}</span> {release.alternate_wx}
                </div>
              )}
            </div>
          )}

          {release.notams && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">NOTAMs</p>
              <p className="text-xs font-mono text-foreground bg-background/50 rounded-lg px-3 py-2 whitespace-pre-wrap">{release.notams}</p>
            </div>
          )}

          {release.remarks && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
              <p className="text-xs text-foreground">{release.remarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DispatchBoard({ releases, isLoading }) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/60">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Dispatch Releases</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground text-sm">Loading releases…</div>
      ) : releases.length === 0 ? (
        <div className="flex justify-center py-8 text-muted-foreground text-sm">No dispatch releases today</div>
      ) : (
        releases.map(r => <ReleaseRow key={r.id} release={r} />)
      )}
    </div>
  );
}