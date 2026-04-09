import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle, Package, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

function AlertBanner({ alert }) {
  const urgency = alert.impact === 'critical' ? 'Critical' : 'Warning';
  const isCritical = alert.impact === 'critical';

  return (
    <div className={cn(
      'rounded-xl border p-4 flex items-start gap-3',
      isCritical
        ? 'bg-red-900/20 border-red-500/40'
        : 'bg-amber-900/20 border-amber-500/40'
    )}>
      <AlertTriangle className={cn('w-5 h-5 flex-shrink-0 mt-0.5',
        isCritical ? 'text-red-400' : 'text-amber-400'
      )} />
      <div className="flex-1 min-w-0">
        <p className={cn('font-bold text-sm', isCritical ? 'text-red-300' : 'text-amber-300')}>
          {urgency}: {alert.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">{alert.detail}</p>
      </div>
    </div>
  );
}

function PartCard({ part, requiredByTasks }) {
  const inStock = part.quantity_on_hand > 0;
  const requiredQuantity = requiredByTasks.reduce((sum, t) => sum + (t.quantity_required || 1), 0);
  const isInsufficient = part.quantity_on_hand < requiredQuantity;

  return (
    <div className={cn('bg-[#0f1419] border rounded-2xl p-4 space-y-3',
      !inStock ? 'border-red-500/40' : isInsufficient ? 'border-yellow-500/40' : 'border-green-500/40'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-white text-sm">{part.part_name || part.description}</p>
          <p className="text-xs text-gray-600 font-mono">{part.part_number}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0',
          !inStock ? 'bg-red-900/50 text-red-400' : isInsufficient ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'
        )}>
          {!inStock ? 'OUT OF STOCK' : isInsufficient ? 'LOW STOCK' : 'IN STOCK'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-lg p-2.5">
        <div>
          <p className="text-[10px] text-gray-600">On Hand</p>
          <p className="text-sm font-black text-white">{part.quantity_on_hand || 0}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-600">Required</p>
          <p className={cn('text-sm font-black', isInsufficient ? 'text-yellow-400' : 'text-gray-400')}>
            {requiredQuantity}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-600">Min Level</p>
          <p className="text-sm font-black text-gray-400">{part.minimum_level || 2}</p>
        </div>
      </div>

      {requiredByTasks.length > 0 && (
        <div className="space-y-1.5 border-t border-white/10 pt-2.5">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Required by</p>
          {requiredByTasks.map((task, idx) => (
            <div key={idx} className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              {task.aircraft_tail} • {task.work_scope}
            </div>
          ))}
        </div>
      )}

      {part.supplier && (
        <p className="text-[10px] text-gray-600">
          Supplier: <span className="text-gray-400">{part.supplier}</span>
        </p>
      )}
    </div>
  );
}

export default function BOWInventoryTracker({ bows = [] }) {
  const { data: parts = [] } = useQuery({
    queryKey: ['bow-inventory-parts'],
    queryFn: () => base44.entities.Part.list('-quantity_on_hand', 500),
    refetchInterval: 300000,
  });

  // Example parts-to-BOW mapping (in production, this would come from BOW task requirements)
  const partTaskMapping = {
    'CFM56-7B27-OIL-5QT': [
      { ata_chapter: '07', work_scope: 'Routine Engine Oil Service', quantity_required: 2 },
    ],
    'ENG-SEAL-KIT-CFM': [
      { ata_chapter: '07', work_scope: 'Engine Overhaul', quantity_required: 1 },
    ],
    'HYD-FLUID-15QT': [
      { ata_chapter: '29', work_scope: 'C-Check', quantity_required: 3 },
    ],
  };

  // Map BOWs to required parts
  const bowPartsMap = useMemo(() => {
    const map = {};
    bows.forEach(bow => {
      // Simple mapping based on work scope keywords
      if (bow.work_scope.toLowerCase().includes('engine')) {
        map['ENG-SEAL-KIT-CFM'] = [
          ...( map['ENG-SEAL-KIT-CFM'] || []),
          { aircraft_tail: bow.tail_number, work_scope: bow.work_scope, quantity_required: 1 }
        ];
      }
      if (bow.work_scope.toLowerCase().includes('oil') || bow.work_scope.toLowerCase().includes('service')) {
        map['CFM56-7B27-OIL-5QT'] = [
          ...(map['CFM56-7B27-OIL-5QT'] || []),
          { aircraft_tail: bow.tail_number, work_scope: bow.work_scope, quantity_required: 2 }
        ];
      }
      if (bow.work_scope.toLowerCase().includes('c-check') || bow.work_scope.toLowerCase().includes('hydraulic')) {
        map['HYD-FLUID-15QT'] = [
          ...(map['HYD-FLUID-15QT'] || []),
          { aircraft_tail: bow.tail_number, work_scope: bow.work_scope, quantity_required: 3 }
        ];
      }
    });
    return map;
  }, [bows]);

  // Generate alerts for missing parts
  const alerts = useMemo(() => {
    const alertList = [];
    Object.entries(bowPartsMap).forEach(([partNum, tasks]) => {
      const part = parts.find(p => p.part_number === partNum);
      if (!part || part.quantity_on_hand === 0) {
        alertList.push({
          id: partNum,
          impact: 'critical',
          message: `Critical: Part ${partNum} not in stock`,
          detail: `Required for ${tasks.length} scheduled BOW task${tasks.length > 1 ? 's' : ''}`
        });
      } else if (part.quantity_on_hand < tasks.reduce((sum, t) => sum + (t.quantity_required || 1), 0)) {
        alertList.push({
          id: partNum,
          impact: 'warning',
          message: `Warning: Insufficient ${partNum}`,
          detail: `${tasks.reduce((sum, t) => sum + (t.quantity_required || 1), 0)} needed, ${part.quantity_on_hand} available`
        });
      }
    });
    return alertList;
  }, [bowPartsMap, parts]);

  const partsByStatus = useMemo(() => {
    const critical = [];
    const warning = [];
    const healthy = [];

    parts.forEach(part => {
      const requiredTasks = bowPartsMap[part.part_number] || [];
      if (requiredTasks.length === 0) return;

      const requiredQuantity = requiredTasks.reduce((sum, t) => sum + (t.quantity_required || 1), 0);

      if (part.quantity_on_hand === 0) {
        critical.push({ part, requiredTasks });
      } else if (part.quantity_on_hand < requiredQuantity) {
        warning.push({ part, requiredTasks });
      } else {
        healthy.push({ part, requiredTasks });
      }
    });

    return { critical, warning, healthy };
  }, [parts, bowPartsMap]);

  const totalAlerts = alerts.length;
  const criticalCount = partsByStatus.critical.length;
  const warningCount = partsByStatus.warning.length;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <h2 className="text-2xl font-black text-primary">BOW INVENTORY TRACKER</h2>
        </div>
        <p className="text-sm text-gray-400">Link spare parts to BOW tasks with stock alerts</p>
      </div>

      {/* Alerts */}
      {totalAlerts > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-white">{totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}</h3>
          </div>
          <div className="space-y-2">
            {alerts.map(alert => (
              <AlertBanner key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0f1419] border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-400">{criticalCount}</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Out of Stock</p>
        </div>
        <div className="bg-[#0f1419] border border-yellow-500/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-yellow-400">{warningCount}</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Low Stock</p>
        </div>
        <div className="bg-[#0f1419] border border-green-500/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-400">{partsByStatus.healthy.length}</p>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">In Stock</p>
        </div>
      </div>

      {/* Critical Parts */}
      {partsByStatus.critical.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Out of Stock — Blocks Work
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {partsByStatus.critical.map((item, idx) => (
              <PartCard key={idx} part={item.part} requiredByTasks={item.requiredTasks} />
            ))}
          </div>
        </div>
      )}

      {/* Warning Parts */}
      {partsByStatus.warning.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Low Stock — May Need Reorder
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {partsByStatus.warning.map((item, idx) => (
              <PartCard key={idx} part={item.part} requiredByTasks={item.requiredTasks} />
            ))}
          </div>
        </div>
      )}

      {/* Healthy Parts */}
      {partsByStatus.healthy.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Adequate Stock
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {partsByStatus.healthy.map((item, idx) => (
              <PartCard key={idx} part={item.part} requiredByTasks={item.requiredTasks} />
            ))}
          </div>
        </div>
      )}

      {partsByStatus.critical.length === 0 && partsByStatus.warning.length === 0 && partsByStatus.healthy.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <Package className="w-12 h-12 text-gray-700/50 mx-auto mb-3" />
          <p className="text-sm">No parts linked to active BOW tasks</p>
        </div>
      )}
    </div>
  );
}