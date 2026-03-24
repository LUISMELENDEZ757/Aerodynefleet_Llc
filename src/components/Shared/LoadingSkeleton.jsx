import { cn } from '@/lib/utils';

/**
 * LoadingSkeleton
 * Animated shimmer placeholder for loading states.
 *
 * Usage:
 *   <LoadingSkeleton lines={3} />
 *   <LoadingSkeleton variant="card" />
 *   <LoadingSkeleton variant="stat" count={4} />
 */

function Bone({ className }) {
  return (
    <div
      className={cn('bg-secondary rounded-lg animate-pulse', className)}
      aria-hidden="true"
    />
  );
}

function LinesSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2 p-4" role="status" aria-label="Loading…">
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3" role="status" aria-label="Loading…">
      <div className="flex items-center gap-3">
        <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-1/2" />
          <Bone className="h-3 w-3/4" />
        </div>
      </div>
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-5/6" />
    </div>
  );
}

function StatSkeleton({ count = 4 }) {
  return (
    <div className={cn('grid gap-3', `grid-cols-${Math.min(count, 4)}`)} role="status" aria-label="Loading…">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card border border-border px-4 py-4 space-y-2">
          <Bone className="h-3 w-1/2" />
          <Bone className="h-8 w-2/3" />
          <Bone className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function RowSkeleton({ rows = 4 }) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden" role="status" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
          <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3.5 w-1/3" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ variant = 'lines', lines, count, rows, className }) {
  const content = {
    lines: <LinesSkeleton lines={lines} />,
    card:  <CardSkeleton />,
    stat:  <StatSkeleton count={count} />,
    rows:  <RowSkeleton rows={rows} />,
  }[variant] || <LinesSkeleton lines={lines} />;

  return <div className={className}>{content}</div>;
}