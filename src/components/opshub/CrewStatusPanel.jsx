import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, AlertTriangle, Clock, ArrowRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewStatusPanel({ crew }) {
  const today = new Date().toISOString().split('T')[0];
  const todayCrew = useMemo(() => crew.filter(c => c.flight_date === today), [crew, today]);

  const legal     = todayCrew.filter(c => !c.legal_status || c.legal_status === 'legal').length;
  const nearLimit = todayCrew.filter(c => c.legal_status === 'near_limit').length;
  const illegal   = todayCrew.filter(c => c.legal_status === 'illegal').length;

  // Fatigue risk proxy — crew near rest limits or with very short rest prior
  const fatigue = todayCrew.filter(c => (c.rest_hours_prior != null && c.rest_hours_prior < 10) || c.legal_status === 'near_limit').length;

  // Pairing disruptions — crew assigned to delayed/cancelled flights
  const disrupted = todayCrew.filter(c => c.notes?.toLowerCase().includes('disrupted') || c.notes?.toLowerCase().includes('irops')).length;

  const violations = todayCrew.filter(c => c.legal_status === 'illegal');

  const legalPct = todayCrew.length > 0
    ? Math.round((legal / todayCrew.length) * 100)
    : 100;

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <p className="text-sm font-extrabold text-white tracking-wide">CREW STATUS</p>
        </div>
        <Link to="/CrewControl" className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">
          Control <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {/* Legality bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">FAR 117 Legality</p>
            <span className={cn('text-xs font-extrabold', illegal > 0 ? 'text-red-400' : nearLimit > 0 ? 'text-amber-400' : 'text-green-400')}>
              {legalPct}% compliant
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/8 rounded-full overflow-hidden flex">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${todayCrew.length > 0 ? (legal / todayCrew.length) * 100 : 100}%` }} />
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${todayCrew.length > 0 ? (nearLimit / todayCrew.length) * 100 : 0}%` }} />
            <div className="h-full bg-red-500 transition-all" style={{ width: `${todayCrew.length > 0 ? (illegal / todayCrew.length) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-3 mt-1.5 text-[10px]">
            <span className="text-green-400">{legal} Legal</span>
            {nearLimit > 0 && <span className="text-amber-400">{nearLimit} Near Limit</span>}
            {illegal > 0 && <span className="text-red-400 font-bold">{illegal} VIOLATION</span>}
          </div>
        </div>

        {/* Fatigue + Disruptions */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0d1117] rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1 mb-1">
              <Brain className="w-3 h-3 text-purple-400" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fatigue Risk</p>
            </div>
            <p className={cn('text-lg font-extrabold', fatigue > 0 ? 'text-orange-400' : 'text-green-400')}>{fatigue}</p>
            <p className="text-[10px] text-gray-600">crew at risk</p>
          </div>
          <div className="bg-[#0d1117] rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Disruptions</p>
            </div>
            <p className={cn('text-lg font-extrabold', disrupted > 0 ? 'text-amber-400' : 'text-gray-500')}>{disrupted}</p>
            <p className="text-[10px] text-gray-600">pairing impact</p>
          </div>
        </div>

        {/* Violations */}
        {violations.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3 h-3" /> FAR 117 Violations
            </p>
            {violations.slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-red-900/15 border border-red-500/20 rounded-lg px-3 py-1.5">
                <span className="text-xs font-bold text-red-400">{c.crew_name}</span>
                <span className="text-[10px] text-gray-500 capitalize">{c.role}</span>
                {c.flight_number && <span className="text-[10px] font-mono text-gray-600 ml-auto">{c.flight_number}</span>}
              </div>
            ))}
          </div>
        )}

        {todayCrew.length === 0 && (
          <p className="text-center text-gray-600 text-xs py-2">No crew assignments today</p>
        )}
      </div>
    </div>
  );
}