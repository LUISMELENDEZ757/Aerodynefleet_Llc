import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, AlertTriangle, User, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const RISK_COLORS = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  moderate: 'bg-amber-500 text-white',
  low: 'bg-green-600 text-white'
};

export default function AiCrewFatigueCard() {
  const [expanded, setExpanded] = useState(false);

  const { data: fatigue, isLoading, error } = useQuery({
    queryKey: ['ai-crew-fatigue'],
    queryFn: async () => {
      const [crewAssignments, flightHistory] = await Promise.all([
        base44.entities.CrewAssignment.list('-created_date', 50),
        base44.entities.Flight.list('-flight_date', 100)
      ]);

      const result = await base44.functions.invoke('aiCrewFatigue', {
        crewAssignments,
        flightHistory,
        timeZones: {}
      });
      return result.data;
    },
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full glass rounded-2xl border border-purple-500/30 p-4 flex items-center gap-3 glass-hover hover:border-purple-500/50 transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-extrabold text-white">AI Crew Fatigue Predictor</p>
          <p className="text-xs text-gray-400">FAR 117 · Circadian Analysis</p>
        </div>
        <span className="text-xs font-bold text-purple-400">View Analysis →</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-purple-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
          <p className="text-sm font-extrabold text-white">AI analyzing crew fatigue...</p>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded animate-pulse" />
          <div className="h-2 bg-white/10 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !fatigue) {
    return (
      <div className="glass rounded-2xl border border-red-500/30 p-6">
        <p className="text-sm font-extrabold text-red-400 mb-2">Fatigue analysis unavailable</p>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
      </div>
    );
  }

  const highRiskCount = fatigue.crew_fatigue_assessment?.filter(
    c => c.fatigue_risk === 'critical' || c.fatigue_risk === 'high'
  ).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-purple-500/30 p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">AI Crew Fatigue Analysis</p>
            <p className="text-xs text-gray-400">Predictive Risk Assessment</p>
          </div>
        </div>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d1117] rounded-xl p-3 border border-white/10 text-center">
          <p className="text-3xl font-black text-red-400">{highRiskCount}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">High Risk Crew</p>
        </div>
        <div className="bg-[#0d1117] rounded-xl p-3 border border-white/10 text-center">
          <p className="text-3xl font-black text-amber-400">{fatigue.crew_fatigue_assessment?.filter(c => c.fatigue_risk === 'moderate').length || 0}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Moderate Risk</p>
        </div>
        <div className="bg-[#0d1117] rounded-xl p-3 border border-white/10 text-center">
          <p className="text-3xl font-black text-green-400">{fatigue.crew_fatigue_assessment?.filter(c => c.fatigue_risk === 'low').length || 0}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Low Risk</p>
        </div>
      </div>

      {/* Operational Impact */}
      {fatigue.operational_impact && (
        <div className={cn('rounded-xl p-3 border',
          fatigue.operational_impact === 'severe' ? 'bg-red-900/20 border-red-500/30' :
          fatigue.operational_impact === 'moderate' ? 'bg-amber-900/20 border-amber-500/30' :
          'bg-blue-900/20 border-blue-500/30'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={cn('w-4 h-4',
              fatigue.operational_impact === 'severe' ? 'text-red-400' :
              fatigue.operational_impact === 'moderate' ? 'text-amber-400' : 'text-blue-400'
            )} />
            <p className="text-sm font-extrabold text-white">Operational Impact: {fatigue.operational_impact.toUpperCase()}</p>
          </div>
        </div>
      )}

      {/* Crew Assessments */}
      {fatigue.crew_fatigue_assessment?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-extrabold text-white">Individual Assessments</p>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {fatigue.crew_fatigue_assessment.map((crew, i) => (
              <div key={i} className={cn('rounded-xl p-3 border',
                crew.fatigue_risk === 'critical' || crew.fatigue_risk === 'high' ? 'bg-red-900/20 border-red-500/30' :
                crew.fatigue_risk === 'moderate' ? 'bg-amber-900/20 border-amber-500/30' :
                'bg-green-900/20 border-green-500/30'
              )}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-white">{crew.crew_name}</p>
                    <p className="text-xs text-gray-400">{crew.role}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', RISK_COLORS[crew.fatigue_risk])}>
                      {crew.fatigue_risk.toUpperCase()}
                    </span>
                    {crew.rest_required_hours > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1">Rest: {crew.rest_required_hours}h</p>
                    )}
                  </div>
                </div>
                
                {crew.risk_factors?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {crew.risk_factors.map((factor, j) => (
                      <span key={j} className="text-[9px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                        {factor}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className={cn('font-bold',
                    crew.far117_status === 'legal' ? 'text-green-400' :
                    crew.far117_status === 'near_limit' ? 'text-amber-400' : 'text-red-400'
                  )}>
                    FAR 117: {crew.far117_status.toUpperCase()}
                  </span>
                </div>

                {crew.recommended_action && (
                  <p className="text-xs text-gray-400 mt-2">{crew.recommended_action}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {fatigue.recommendations?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-extrabold text-white">AI Recommendations</p>
          </div>
          <div className="space-y-1.5">
            {fatigue.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 bg-blue-900/20 border border-blue-500/30 rounded-xl p-2.5">
                <span className="text-blue-400 font-bold">•</span>
                <p className="text-xs text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}