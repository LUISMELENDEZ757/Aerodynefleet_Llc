import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Shield, Globe, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FleetHealthPanel({ aircraft, melItems }) {
  const oos         = aircraft.filter(a => a.status === 'oos');
  const maintenance = aircraft.filter(a => a.status === 'maintenance');
  const active      = aircraft.filter(a => a.status === 'active');

  const openMel     = melItems.filter(m => m.status !== 'cleared');
  const expiredMel  = melItems.filter(m => m.status === 'expired');
  const expiringSoon= melItems.filter(m => m.status === 'expiring_soon');

  // Group ETOPS/CAT summaries from aircraft
  const etopsActive   = aircraft.filter(a => (a.etops_approval || 0) >= 120).length;
  const catIIIb       = aircraft.filter(a => ['CAT IIIb','CAT IIIc'].includes(a.cat_approval)).length;
  const catIIIa       = aircraft.filter(a => a.cat_approval === 'CAT IIIa').length;

  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-extrabold text-white tracking-wide">FLEET HEALTH</p>
        </div>
        <Link to="/FleetDashboard" className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">
          Fleet <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {/* Aircraft status */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Active',      value: active.length,      color: 'text-green-400',  bg: 'bg-green-500/10'  },
            { label: 'Maintenance', value: maintenance.length, color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
            { label: 'OOS',         value: oos.length,         color: oos.length > 0 ? 'text-red-400' : 'text-gray-500', bg: oos.length > 0 ? 'bg-red-500/10' : 'bg-gray-500/5' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn('rounded-xl px-3 py-2 text-center', bg)}>
              <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
              <p className="text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* MEL/CDL */}
        <div className="bg-[#0d1117] rounded-xl px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">MEL / CDL</p>
            <Link to="/MEL" className="text-[10px] text-primary">Manage</Link>
          </div>
          <div className="flex gap-3">
            <span className={cn('text-sm font-extrabold', openMel.length > 0 ? 'text-amber-400' : 'text-green-400')}>
              {openMel.length} Open
            </span>
            {expiredMel.length > 0 && (
              <span className="text-sm font-extrabold text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {expiredMel.length} Expired
              </span>
            )}
            {expiringSoon.length > 0 && (
              <span className="text-sm font-extrabold text-orange-400">{expiringSoon.length} Expiring</span>
            )}
          </div>
        </div>

        {/* ETOPS + CAT */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0d1117] rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3 text-cyan-400" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ETOPS</p>
            </div>
            <p className="text-lg font-extrabold text-cyan-400">{etopsActive}</p>
            <p className="text-[10px] text-gray-600">≥ETOPS-120 certified</p>
          </div>
          <div className="bg-[#0d1117] rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1 mb-1">
              <Shield className="w-3 h-3 text-blue-400" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">CAT III</p>
            </div>
            <p className="text-lg font-extrabold text-blue-400">{catIIIb + catIIIa}</p>
            <p className="text-[10px] text-gray-600">{catIIIb} IIIb · {catIIIa} IIIa</p>
          </div>
        </div>

        {/* OOS tail list */}
        {oos.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">AOG / OOS Aircraft</p>
            {oos.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-red-900/15 border border-red-500/20 rounded-lg px-3 py-1.5">
                <span className="text-xs font-mono font-bold text-red-400">{a.tail_number}</span>
                <span className="text-xs text-gray-500">{a.aircraft_type}</span>
                {a.base_station && <span className="text-xs text-gray-600 ml-auto">{a.base_station}</span>}
              </div>
            ))}
            {oos.length > 3 && <p className="text-[10px] text-gray-600">+{oos.length - 3} more OOS</p>}
          </div>
        )}
      </div>
    </div>
  );
}