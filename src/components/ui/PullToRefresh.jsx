import React, { useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

/**
 * Wrap any scrollable page content with this to get pull-to-refresh on mobile.
 * Usage:
 *   <PullToRefresh onRefresh={refetch}>
 *     <div>...content...</div>
 *   </PullToRefresh>
 */
export default function PullToRefresh({ onRefresh, children, className }) {
  const containerRef = useRef(null);
  const { pullDistance, refreshing } = usePullToRefresh({ onRefresh, containerRef });

  const indicatorVisible = pullDistance > 8 || refreshing;

  return (
    <div ref={containerRef} className={cn('relative overflow-auto', className)}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none transition-all duration-150"
        style={{ height: refreshing ? 48 : pullDistance, opacity: indicatorVisible ? 1 : 0 }}
      >
        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-lg">
          <RefreshCw
            className={cn('w-4 h-4 text-primary transition-transform', refreshing && 'animate-spin')}
            style={{ transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)` }}
          />
        </div>
      </div>

      <div style={{ transform: refreshing ? 'translateY(48px)' : pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined, transition: refreshing ? 'transform 0.2s ease' : undefined }}>
        {children}
      </div>
    </div>
  );
}