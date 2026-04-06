import { useState } from 'react';
import { AlertCircle, CheckCircle, Shield, AlertTriangle, Users, Wrench, Plane, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKFLOW_STAGES = [
  {
    id: 'event_origin',
    title: 'Event Origin',
    subtitle: 'Pilot Report • Log Page • System Flag',
    icon: AlertCircle,
    count: 3,
    color: 'orange',
    path: 'top',
  },
  {
    id: 'qc_routing',
    title: 'QC or QA Routing',
    subtitle: 'Categorized into QC or QA domain',
    icon: AlertCircle,
    count: 1,
    color: 'blue',
    path: 'routing',
  },
  // QC Path
  {
    id: 'mechanic_corrective',
    title: 'Mechanic Corrective',
    subtitle: 'Action • CAT • Parts',
    icon: Wrench,
    count: 3,
    color: 'cyan',
    path: 'qc',
    side: 'left',
  },
  {
    id: 'qc_inspector_review',
    title: 'QC Inspector Review',
    subtitle: 'Review • Approve • Reject',
    icon: CheckCircle,
    count: 2,
    color: 'cyan',
    path: 'qc',
    side: 'left',
  },
  {
    id: 'rii_signoff',
    title: 'RII Sign-Off',
    subtitle: 'Inspector Sign-Off',
    icon: Users,
    count: 2,
    color: 'cyan',
    path: 'qc',
    side: 'left',
  },
  // QA Path
  {
    id: 'qa_categorization',
    title: 'QA Categorization',
    subtitle: 'Route to QA Tab',
    icon: Shield,
    count: 2,
    color: 'purple',
    path: 'qa',
    side: 'right',
  },
  {
    id: 'qa_review_analysis',
    title: 'QA Review & Analysis',
    subtitle: 'Audits • Non-Conformances',
    icon: CheckCircle,
    count: 2,
    color: 'purple',
    path: 'qa',
    side: 'right',
  },
  {
    id: 'qa_followup',
    title: 'QA Follow-Up',
    subtitle: 'CAR • Metrics • Trends',
    icon: CheckCircle,
    count: 1,
    color: 'purple',
    path: 'qa',
    side: 'right',
  },
  // Convergence
  {
    id: 'release_security',
    title: 'Release Security Validation',
    subtitle: 'All QC/QA/RII Complete • No Blockers',
    icon: Lock,
    count: 2,
    color: 'amber',
    path: 'convergence',
  },
  {
    id: 'mcc_review',
    title: 'MCC / Supervisor Review',
    subtitle: 'MCC Validation • Supervisor Approval',
    icon: Users,
    count: 1,
    color: 'purple',
    path: 'convergence',
  },
  {
    id: 'aircraft_released',
    title: 'Aircraft Released',
    subtitle: 'IN-SERVICE • Audit Trail Updated',
    icon: Plane,
    count: 0,
    color: 'green',
    path: 'convergence',
  },
];

const COLOR_MAP = {
  orange: 'bg-orange-600 border-orange-500',
  blue: 'bg-blue-600 border-blue-500',
  cyan: 'border-cyan-500 bg-cyan-950/30',
  purple: 'border-purple-600 bg-purple-950/30',
  amber: 'border-amber-600 bg-amber-950/30',
  green: 'border-green-600 bg-green-950/30',
};

const BADGE_COLOR_MAP = {
  orange: 'bg-orange-600 text-white',
  blue: 'bg-red-600 text-white',
  cyan: 'bg-orange-600 text-white',
  purple: 'bg-orange-600 text-white',
  amber: 'bg-orange-600 text-white',
  green: 'bg-orange-600 text-white',
};

function StageCard({ stage, isSelected, onSelect }) {
  const Icon = stage.icon;
  return (
    <button
      onClick={() => onSelect(stage.id)}
      className={cn(
        'relative border-2 rounded-2xl px-6 py-4 transition-all cursor-pointer group',
        COLOR_MAP[stage.color],
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:border-opacity-70'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-1 flex-shrink-0 text-white" />
        <div className="text-left">
          <p className="text-sm font-bold text-white">{stage.title}</p>
          <p className="text-xs text-gray-300 mt-0.5">{stage.subtitle}</p>
        </div>
      </div>
      {stage.count > 0 && (
        <div className={cn('absolute -top-3 -right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', BADGE_COLOR_MAP[stage.color])}>
          {stage.count}
        </div>
      )}
    </button>
  );
}

export default function WorkflowPipeline() {
  const [selectedStage, setSelectedStage] = useState('event_origin');
  const selected = WORKFLOW_STAGES.find(s => s.id === selectedStage);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 py-6 border-b border-border">
        <h1 className="text-3xl font-extrabold text-foreground tracking-wide mb-2">QC/QA WORKFLOW PIPELINE</h1>
        <p className="text-sm text-muted-foreground">Click any stage to view active items • Badges show item counts</p>
      </div>

      {/* Pipeline Visualization */}
      <div className="px-5 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Event Origin */}
          <div className="flex justify-center">
            <StageCard stage={WORKFLOW_STAGES[0]} isSelected={selectedStage === WORKFLOW_STAGES[0].id} onSelect={setSelectedStage} />
          </div>

          {/* Divider */}
          <div className="flex justify-center">
            <div className="w-1 h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
          </div>

          {/* QC or QA Routing */}
          <div className="flex justify-center">
            <StageCard stage={WORKFLOW_STAGES[1]} isSelected={selectedStage === WORKFLOW_STAGES[1].id} onSelect={setSelectedStage} />
          </div>

          {/* Divider */}
          <div className="flex justify-center">
            <div className="w-1 h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
          </div>

          {/* Horizontal Split */}
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-muted-foreground/30 -translate-x-1/2" />
            <div className="grid grid-cols-2 gap-8">
              {/* QC Path (Left) */}
              <div className="space-y-6 pr-4">
                <div className="flex items-center justify-end gap-2 mb-4">
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-500 bg-cyan-950/30" />
                  <span className="text-xs font-bold text-cyan-400">QC Path (Technical)</span>
                </div>
                {WORKFLOW_STAGES.filter(s => s.path === 'qc').map(stage => (
                  <div key={stage.id} className="space-y-3">
                    <StageCard stage={stage} isSelected={selectedStage === stage.id} onSelect={setSelectedStage} />
                    {stage !== WORKFLOW_STAGES.filter(s => s.path === 'qc')[WORKFLOW_STAGES.filter(s => s.path === 'qc').length - 1] && (
                      <div className="flex justify-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-transparent" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* QA Path (Right) */}
              <div className="space-y-6 pl-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold text-purple-400">QA Path (Compliance)</span>
                  <div className="w-4 h-4 rounded-full border-2 border-purple-600 bg-purple-950/30" />
                </div>
                {WORKFLOW_STAGES.filter(s => s.path === 'qa').map(stage => (
                  <div key={stage.id} className="space-y-3">
                    <StageCard stage={stage} isSelected={selectedStage === stage.id} onSelect={setSelectedStage} />
                    {stage !== WORKFLOW_STAGES.filter(s => s.path === 'qa')[WORKFLOW_STAGES.filter(s => s.path === 'qa').length - 1] && (
                      <div className="flex justify-center">
                        <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-transparent" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider to Convergence */}
          <div className="flex justify-center">
            <div className="w-1 h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
          </div>

          {/* Convergence Stages */}
          <div className="space-y-6">
            {WORKFLOW_STAGES.filter(s => s.path === 'convergence').map((stage, idx) => (
              <div key={stage.id}>
                <div className="flex justify-center">
                  <StageCard stage={stage} isSelected={selectedStage === stage.id} onSelect={setSelectedStage} />
                </div>
                {idx < WORKFLOW_STAGES.filter(s => s.path === 'convergence').length - 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 px-5 py-8 border-t border-border">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 border-2 border-cyan-500 rounded" />
          <span className="text-muted-foreground">QC (Technical Resolution)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 border-2 border-purple-600 rounded" />
          <span className="text-muted-foreground">QA (Oversight & Compliance)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 border-2 border-amber-600 rounded" />
          <span className="text-muted-foreground">Release Security</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 border-2 border-green-600 rounded" />
          <span className="text-muted-foreground">Aircraft Released</span>
        </div>
      </div>

      {/* Stage Details */}
      {selected && (
        <div className="px-5 py-8 max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-extrabold text-foreground mb-2">{selected.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{selected.subtitle}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-muted-foreground">Active Items:</span>
                <span className="text-2xl font-extrabold text-primary">{selected.count}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}