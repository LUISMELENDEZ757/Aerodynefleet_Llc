import { Lightbulb, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AITroubleshootingAssistant() {
  const recommendations = [
    { type: 'similar', label: 'Similar Issues on Fleet', count: 5, color: 'orange' },
    { type: 'corrective', label: 'Past Corrective Actions', count: 12, color: 'blue' },
    { type: 'preventive', label: 'Preemce Successful Actions', count: 8, color: 'green' },
    { type: 'probable', label: 'Probable Causes', count: 3, color: 'red' },
  ];

  const nextSteps = [
    'Check Pack Valve & Temp Sensor',
    'Inspect Air Duct for Blockage',
    'Verify Pneumatic Line Pressure',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-foreground">AI Troubleshooting Assistant</h3>
      </div>

      {/* Recommendation Categories */}
      <div className="space-y-2">
        {recommendations.map((rec, i) => {
          const colors = {
            orange: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
            blue: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
            green: 'border-green-500/40 bg-green-500/10 text-green-400',
            red: 'border-red-500/40 bg-red-500/10 text-red-400',
          };
          return (
            <button key={i}
              className={cn('w-full border rounded-lg px-3 py-2.5 text-left text-xs flex items-center justify-between hover:opacity-80 transition-opacity', colors[rec.color])}>
              <span className="font-bold">{rec.label}</span>
              <span className={cn('text-sm font-black px-2 py-0.5 rounded-full',
                rec.color === 'orange' ? 'bg-orange-500/30' :
                rec.color === 'blue' ? 'bg-blue-500/30' :
                rec.color === 'green' ? 'bg-green-500/30' :
                'bg-red-500/30'
              )}>
                {rec.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-500/10 border border-blue-500/40 rounded-lg px-3 py-3 space-y-2">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Next Steps:</p>
        <div className="space-y-1.5">
          {nextSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-blue-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button className="px-3 py-2 rounded-lg bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors">
          View Recommendations
        </button>
        <button className="px-3 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-bold hover:bg-secondary/80 transition-colors">
          Create Work Package
        </button>
      </div>
    </div>
  );
}