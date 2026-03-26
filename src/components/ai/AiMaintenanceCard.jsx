import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, AlertTriangle, TrendingUp, CheckCircle, Wrench, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_COLORS = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white'
};

const CONFIDENCE_COLORS = {
  high: 'text-green-400',
  medium: 'text-amber-400',
  low: 'text-gray-400'
};

export default function AiMaintenanceCard({ aircraftTail }) {
  const [expanded, setExpanded] = useState(false);

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['ai-maintenance', aircraftTail],
    queryFn: async () => {
      const [logEntries, faultMessages, oosEntries] = await Promise.all([
        base44.entities.LogbookEntry.filter({ aircraft_tail: aircraftTail }),
        base44.entities.FaultMessage.filter({ aircraft_tail: aircraftTail, status: 'active' }),
        base44.entities.OOSEntry.filter({ tail_number: aircraftTail })
      ]);

      const result = await base44.functions.invoke('aiMaintenanceInsights', {
        aircraftTail,
        logEntries,
        faultMessages,
        oosEntries
      });
      return result.data;
    },
    enabled: !!aircraftTail && expanded,
    staleTime: 5 * 60 * 1000,
  });

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full glass rounded-2xl border border-primary/30 p-4 flex items-center gap-3 glass-hover hover:border-primary/50 transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-extrabold text-white">AI Maintenance Insights</p>
          <p className="text-xs text-gray-400">Predictive analysis for {aircraftTail}</p>
        </div>
        <span className="text-xs font-bold text-primary">View Analysis →</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-primary/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
          <p className="text-sm font-extrabold text-white">AI analyzing maintenance data...</p>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded animate-pulse" />
          <div className="h-2 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-2 bg-white/10 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="glass rounded-2xl border border-red-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm font-extrabold text-red-400">AI analysis unavailable</p>
        </div>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-white">
          Close
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-primary/30 p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">AI Maintenance Insights</p>
            <p className="text-xs text-gray-400">{aircraftTail}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-white">
          Close
        </button>
      </div>

      {/* Health Score */}
      <div className="bg-[#0d1117] rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Overall Health Score</span>
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-end gap-3">
          <span className={cn('text-5xl font-black',
            analysis.overall_health_score >= 80 ? 'text-green-400' :
            analysis.overall_health_score >= 60 ? 'text-amber-400' : 'text-red-400'
          )}>
            {analysis.overall_health_score}
          </span>
          <span className="text-sm text-gray-500 mb-1">/ 100</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 mt-3">
          <div
            className={cn('h-full rounded-full transition-all',
              analysis.overall_health_score >= 80 ? 'bg-green-500' :
              analysis.overall_health_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
            )}
            style={{ width: `${analysis.overall_health_score}%` }}
          />
        </div>
      </div>

      {/* Priority Concerns */}
      {analysis.priority_concerns?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-extrabold text-white">Priority Concerns</p>
          </div>
          <div className="space-y-2">
            {analysis.priority_concerns.map((concern, i) => (
              <div key={i} className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{concern.issue}</p>
                    {concern.ata_chapter && (
                      <p className="text-xs text-gray-500 mt-0.5">ATA {concern.ata_chapter}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{concern.recommendation}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0', SEVERITY_COLORS[concern.severity])}>
                    {concern.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predictive Maintenance */}
      {analysis.predictive_maintenance?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-extrabold text-white">Predictive Maintenance</p>
          </div>
          <div className="space-y-2">
            {analysis.predictive_maintenance.map((item, i) => (
              <div key={i} className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{item.component}</p>
                    <p className="text-xs text-amber-400 mt-0.5">{item.predicted_failure_window}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.preventive_action}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold', CONFIDENCE_COLORS[item.confidence])}>
                    {item.confidence.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {analysis.recommended_actions?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <p className="text-sm font-extrabold text-white">Recommended Actions</p>
          </div>
          <div className="space-y-1.5">
            {analysis.recommended_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 bg-green-900/20 border border-green-500/30 rounded-xl p-2.5">
                <Wrench className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}