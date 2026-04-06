import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AlertCircle, Wrench, CheckCircle, Shield, Lock, Users,
  Archive, TrendingUp, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LAYERS = [
  {
    id: 'event',
    title: 'Event Origin',
    subtitle: 'Pilot Reports • Faults • Defects',
    icon: AlertCircle,
    color: 'orange',
    entity: 'logbookEntry',
    domain: 'Event'
  },
  {
    id: 'qc',
    title: 'QC Layer',
    subtitle: 'Corrective Action Validation',
    icon: Wrench,
    color: 'cyan',
    entity: 'logbookEntry',
    domain: 'QC',
    filter: { entry_type: 'corrective_action' }
  },
  {
    id: 'rii',
    title: 'RII Layer',
    subtitle: 'Required Inspection Items',
    icon: CheckCircle,
    color: 'cyan',
    entity: 'logbookEntry',
    domain: 'QC',
    filter: { is_deferred: true }
  },
  {
    id: 'qa',
    title: 'QA Layer',
    subtitle: 'Audit & Compliance',
    icon: Shield,
    color: 'purple',
    entity: 'safetyReport',
    domain: 'QA'
  },
  {
    id: 'release',
    title: 'Release Layer',
    subtitle: 'Airworthiness & Return-to-Service',
    icon: Lock,
    color: 'amber',
    entity: 'dispatchRelease',
    domain: 'Release'
  },
  {
    id: 'oversight',
    title: 'Oversight Layer',
    subtitle: 'MCC / Engineering / Supervisors',
    icon: Users,
    color: 'purple',
    entity: 'oopsAlert',
    domain: 'Oversight'
  },
  {
    id: 'records',
    title: 'Records Layer',
    subtitle: 'Archival & Traceability',
    icon: Archive,
    color: 'gray',
    entity: 'auditLog',
    domain: 'Records'
  },
  {
    id: 'feedback',
    title: 'Feedback Layer',
    subtitle: 'Safety, Reliability, Analytics',
    icon: TrendingUp,
    color: 'green',
    entity: 'analyticsEvent',
    domain: 'Feedback'
  }
];

const COLOR_MAP = {
  orange: 'border-orange-500 bg-orange-950/30',
  cyan: 'border-cyan-500 bg-cyan-950/30',
  purple: 'border-purple-600 bg-purple-950/30',
  amber: 'border-amber-600 bg-amber-950/30',
  gray: 'border-gray-600 bg-gray-950/30',
  green: 'border-green-600 bg-green-950/30'
};

const BADGE_COLOR_MAP = {
  orange: 'bg-orange-600 text-white',
  cyan: 'bg-cyan-600 text-white',
  purple: 'bg-purple-600 text-white',
  amber: 'bg-amber-600 text-white',
  gray: 'bg-gray-600 text-white',
  green: 'bg-green-600 text-white'
};

function EventCard({ item, layer }) {
  const tailOrCode = item.aircraft_tail || item.flight_number || item.id?.substring(0, 8);
  const description = item.description || item.title || item.message || '—';
  const timeInStage = item.created_date
    ? `${Math.floor((Date.now() - new Date(item.created_date).getTime()) / 3600000)}h ago`
    : '—';

  const priorityColor =
    item.priority === 'high' || item.severity === 'critical' ? 'border-red-500/50 bg-red-900/5' :
    item.priority === 'medium' ? 'border-orange-500/40 bg-orange-900/5' :
    'border-blue-500/30 bg-blue-900/5';

  return (
    <div className={cn('rounded-2xl bg-card border overflow-hidden transition-all px-4 py-3', priorityColor)}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-bold text-foreground font-mono">{tailOrCode}</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', BADGE_COLOR_MAP[layer.color])}>
              {layer.domain}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">{timeInStage}</span>
      </div>
    </div>
  );
}

function LayerCard({ layer, items, isExpanded, onToggle }) {
  const Icon = layer.icon;
  const itemCount = items.length;

  return (
    <div className="space-y-2">
      {/* Stage Header */}
      <button
        onClick={() => onToggle(layer.id)}
        className={cn(
          'w-full rounded-2xl border-2 p-4 transition-all cursor-pointer hover:border-opacity-70',
          COLOR_MAP[layer.color]
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Icon className="w-5 h-5 mt-1 flex-shrink-0 text-white" />
            <div className="text-left">
              <p className="text-sm font-bold text-white">{layer.title}</p>
              <p className="text-xs text-gray-300 mt-0.5">{layer.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white', BADGE_COLOR_MAP[layer.color])}>
              {itemCount}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="ml-2 pl-4 border-l-2 border-gray-600 space-y-2">
          {itemCount === 0 ? (
            <p className="text-xs text-muted-foreground py-3 italic">No items at this layer</p>
          ) : (
            items.map((item, idx) => (
              <EventCard key={idx} item={item} layer={layer} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function FullWorkflowPipeline() {
  const [expandedLayers, setExpandedLayers] = useState(new Set(['event']));

  const toggleLayer = (layerId) => {
    const newSet = new Set(expandedLayers);
    if (newSet.has(layerId)) {
      newSet.delete(layerId);
    } else {
      newSet.add(layerId);
    }
    setExpandedLayers(newSet);
  };

  // Fetch all data
  const { data: logbookEntries = [] } = useQuery({
    queryKey: ['workflow-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 200),
    refetchInterval: 60000
  });

  const { data: safetyReports = [] } = useQuery({
    queryKey: ['workflow-safety'],
    queryFn: () => base44.entities.SafetyReport?.list?.('-created_date', 100) || Promise.resolve([]),
    refetchInterval: 60000
  });

  const { data: dispatchReleases = [] } = useQuery({
    queryKey: ['workflow-dispatch'],
    queryFn: () => base44.entities.DispatchRelease?.list?.('-flight_date', 100) || Promise.resolve([]),
    refetchInterval: 60000
  });

  const { data: opsAlerts = [] } = useQuery({
    queryKey: ['workflow-alerts'],
    queryFn: () => base44.entities.OpsAlert?.filter?.({ is_dismissed: false }) || Promise.resolve([]),
    refetchInterval: 60000
  });

  // Map layers to data
  const layerData = {
    event: logbookEntries.filter(e => e.entry_type === 'discrepancy'),
    qc: logbookEntries.filter(e => e.entry_type === 'corrective_action'),
    rii: logbookEntries.filter(e => e.is_deferred && !e.is_cleared),
    qa: safetyReports.slice(0, 20),
    release: dispatchReleases.slice(0, 20),
    oversight: opsAlerts.slice(0, 20),
    records: logbookEntries.filter(e => e.is_cleared).slice(0, 20),
    feedback: logbookEntries.slice(0, 20)
  };

  const totalItems = Object.values(layerData).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 py-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-foreground tracking-wide mb-2">QC/QA WORKFLOW PIPELINE</h1>
        <p className="text-sm text-muted-foreground">8-Layer Airline Quality Ecosystem • {totalItems} total items across all stages</p>
      </div>

      {/* Pipeline */}
      <div className="px-5 py-8 max-w-2xl mx-auto space-y-3">
        {LAYERS.map((layer) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            items={layerData[layer.id]}
            isExpanded={expandedLayers.has(layer.id)}
            onToggle={toggleLayer}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 px-5 py-8 border-t border-border flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-orange-600" />
          <span className="text-muted-foreground">Event Origin</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-cyan-600" />
          <span className="text-muted-foreground">QC / RII</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-purple-600" />
          <span className="text-muted-foreground">QA / Oversight</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-600" />
          <span className="text-muted-foreground">Release</span>
        </div>
      </div>
    </div>
  );
}