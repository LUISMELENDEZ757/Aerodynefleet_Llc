import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, AlertTriangle, Plane, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const RISK_COLORS = {
  high: 'bg-red-600 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-green-600 text-white'
};

export default function AiDelayPredictor() {
  const [expanded, setExpanded] = useState(false);

  const { data: prediction, isLoading, error } = useQuery({
    queryKey: ['ai-delay-prediction'],
    queryFn: async () => {
      const [flights, melItems, crewAssignments] = await Promise.all([
        base44.entities.Flight.list('-flight_date', 50),
        base44.entities.MELItem.filter({ status: 'open' }),
        base44.entities.CrewAssignment.list('-created_date', 50)
      ]);

      const result = await base44.functions.invoke('aiDelayPrediction', {
        flights,
        weather: {},
        melItems,
        crewAssignments
      });
      return result.data;
    },
    enabled: expanded,
    staleTime: 3 * 60 * 1000,
  });

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full glass rounded-2xl border border-amber-500/30 p-4 flex items-center gap-3 glass-hover hover:border-amber-500/50 transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-extrabold text-white">AI Delay Predictor</p>
          <p className="text-xs text-gray-400">Predict delays before they happen</p>
        </div>
        <span className="text-xs font-bold text-amber-400">View Prediction →</span>
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-2xl border border-amber-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-amber-400 animate-pulse" />
          <p className="text-sm font-extrabold text-white">AI analyzing operations...</p>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded animate-pulse" />
          <div className="h-2 bg-white/10 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="glass rounded-2xl border border-red-500/30 p-6">
        <p className="text-sm font-extrabold text-red-400 mb-2">Prediction unavailable</p>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-amber-500/30 p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">AI Delay Predictor</p>
            <p className="text-xs text-gray-400">Today's Operations</p>
          </div>
        </div>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
      </div>

      {/* DOT Prediction */}
      <div className="bg-[#0d1117] rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Predicted On-Time Performance</span>
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-end gap-3">
          <span className={cn('text-5xl font-black',
            prediction.overall_dot_prediction >= 80 ? 'text-green-400' :
            prediction.overall_dot_prediction >= 65 ? 'text-amber-400' : 'text-red-400'
          )}>
            {prediction.overall_dot_prediction}%
          </span>
        </div>
      </div>

      {/* At-Risk Flights */}
      {prediction.delay_risk_flights?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-extrabold text-white">Flights at Risk</p>
          </div>
          <div className="space-y-2">
            {prediction.delay_risk_flights.map((flight, i) => (
              <div key={i} className={cn('rounded-xl p-3 border',
                flight.risk_level === 'high' ? 'bg-red-900/20 border-red-500/30' :
                flight.risk_level === 'medium' ? 'bg-amber-900/20 border-amber-500/30' :
                'bg-blue-900/20 border-blue-500/30'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-extrabold text-white font-mono">{flight.flight_number}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', RISK_COLORS[flight.risk_level])}>
                    {flight.risk_level.toUpperCase()} RISK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Predicted Delay: </span>
                    <span className="font-bold text-white">{flight.predicted_delay_minutes} min</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence: </span>
                    <span className="font-bold text-white">{flight.confidence_percent}%</span>
                  </div>
                </div>
                {flight.primary_cause && (
                  <p className="text-xs text-gray-400 mt-2">{flight.primary_cause}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mitigation Strategies */}
      {prediction.mitigation_strategies?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-green-400" />
            <p className="text-sm font-extrabold text-white">AI Recommendations</p>
          </div>
          <div className="space-y-1.5">
            {prediction.mitigation_strategies.map((strategy, i) => (
              <div key={i} className="flex items-start gap-2 bg-green-900/20 border border-green-500/30 rounded-xl p-2.5">
                <span className="text-green-400 font-bold">•</span>
                <p className="text-xs text-gray-300">{strategy}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}