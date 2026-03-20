import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertTriangle, ClipboardList } from 'lucide-react';
import useCabinConfig from '@/hooks/useCabinConfig';

export default function CabinChecklistWidget({ aircraftType, checklistType = 'preflight_cabin', title = 'Cabin Checklist' }) {
  const [checked, setChecked] = useState({});
  const { cabinConfig, checklists, isLoading } = useCabinConfig(aircraftType, checklistType);

  const toggle = (itemId) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setChecked(prev => (prev[itemId] ? { ...prev, [itemId]: null } : { ...prev, [itemId]: ts }));
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Loading cabin configuration…
      </div>
    );
  }

  const checklist = checklists?.[0];
  if (!checklist) {
    return (
      <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No checklist available for {aircraftType}
      </div>
    );
  }

  const items = checklist.items || [];
  const total = items.length;
  const done = Object.values(checked).filter(Boolean).length;
  const allDone = done === total && total > 0;
  const criticalCount = items.filter(i => i.critical).length;
  const criticalDone = items.filter(i => i.critical && checked[i.item_id]).length;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <span className={cn('text-xs font-bold', allDone ? 'text-green-400' : 'text-muted-foreground')}>
            {done}/{total}
          </span>
        </div>
      </div>

      {/* Checklist items */}
      <div className="p-3 space-y-1.5">
        {items.map((item) => {
          const ts = checked[item.item_id];
          const isCritical = item.critical;
          return (
            <button
              key={item.item_id}
              onClick={() => toggle(item.item_id)}
              className={cn(
                'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                ts ? 'bg-green-500/10' : isCritical ? 'bg-orange-500/5 hover:bg-orange-500/10' : 'hover:bg-secondary/50'
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5',
                ts ? 'border-green-500 bg-green-500' : isCritical ? 'border-orange-500' : 'border-border'
              )}>
                {ts && <CheckCircle className="w-3 h-3 text-white" />}
              </div>

              {/* Item content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <p className={cn(
                    'text-sm transition-colors flex-1',
                    ts ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}>
                    {item.check}
                  </p>
                  {isCritical && !ts && (
                    <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.expected_state}
                  {item.zone && ` · ${item.zone}`}
                  {item.assigned_role && ` · ${item.assigned_role}`}
                </p>
              </div>

              {/* Timestamp */}
              {ts && (
                <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{ts}Z</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status banner */}
      <div className="px-4 pb-3">
        {allDone ? (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-green-400">All items complete — cabin ready</p>
          </div>
        ) : criticalDone < criticalCount ? (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-orange-400">
              {criticalCount - criticalDone} critical item{criticalCount - criticalDone !== 1 ? 's' : ''} pending
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2.5">
            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-blue-400">{total - done} item{total - done !== 1 ? 's' : ''} remaining</p>
          </div>
        )}
      </div>

      {/* Aircraft note */}
      {cabinConfig?.notes && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground bg-background/40 rounded-lg px-3 py-2">
            <span className="font-semibold">Note:</span> {cabinConfig.notes}
          </p>
        </div>
      )}
    </div>
  );
}