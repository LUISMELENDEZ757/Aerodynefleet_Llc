import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Cog, ShieldCheck, Shield, Waves } from 'lucide-react';

const CAT_OPTIONS = ['CAT I', 'CAT II', 'CAT IIIa', 'CAT IIIb', 'CAT IIIc'];
const ETOPS_OPTIONS = [0, 75, 90, 120, 138, 180, 207, 240, 330];

export default function AircraftInfoSidebar({ aircraft }) {
  const qc = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Aircraft.update(aircraft.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mx-timeline-aircraft'] }),
  });

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-extrabold text-white leading-tight">Aircraft<br />Information</p>
        {aircraft?.etops_approval ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-600/80 text-white text-[11px] font-extrabold">
            <Waves className="w-3 h-3" /> ETOPS
          </span>
        ) : null}
      </div>

      <div className="bg-[#141922] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-600 italic">
        — &nbsp;Edit
      </div>

      {/* Location */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-yellow-400" /> Location
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-green-600 text-white not-italic">LIVE</span>
        </p>
        <p className="text-xl font-black text-white">{aircraft?.location_label || aircraft?.base_station || '—'}</p>
      </div>

      {/* Engines */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <Cog className="w-3 h-3 text-orange-400" /> Engines
        </p>
        <p className="text-lg font-bold text-white">{aircraft?.engine_type || '—'}</p>
      </div>

      {/* CAT status */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-green-400" /> CAT Status
        </p>
        <p className="text-lg font-black text-white">{aircraft?.cat_approval || '—'}</p>
      </div>

      {/* ILS / CAT card */}
      <div className="bg-green-950/30 border border-green-500/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> ILS / CAT Status
          </p>
          <select
            value={aircraft?.cat_approval || 'CAT I'}
            onChange={e => updateMutation.mutate({ cat_approval: e.target.value })}
            className="bg-[#0d1117] border border-white/15 rounded-xl px-2 py-1.5 text-xs font-black text-white outline-none focus:border-green-500 cursor-pointer"
          >
            {CAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-[11px] text-gray-400 leading-snug">
          Max certified: <span className="font-bold text-green-300">{aircraft?.cat_approval || 'CAT I'}</span> · DH &lt; 100ft · RVR ≥ 200m
        </p>
      </div>

      {/* ETOPS card */}
      <div className="bg-green-950/30 border border-green-500/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-extrabold text-green-400 uppercase tracking-widest flex items-center gap-1.5">
            <Waves className="w-3 h-3" /> ETOPS Status
          </p>
          <select
            value={aircraft?.etops_approval || 0}
            onChange={e => updateMutation.mutate({ etops_approval: Number(e.target.value) })}
            className="bg-[#0d1117] border border-white/15 rounded-xl px-2 py-1.5 text-xs font-black text-white outline-none focus:border-green-500 cursor-pointer"
          >
            {ETOPS_OPTIONS.map(v => <option key={v} value={v}>{v === 0 ? 'None' : `ETOPS-${v}`}</option>)}
          </select>
        </div>
        <p className="text-[11px] text-gray-400 leading-snug">
          Max certified: <span className="font-bold text-green-300">{aircraft?.etops_approval ? `ETOPS-${aircraft.etops_approval}` : 'None'}</span>
          {aircraft?.etops_approval ? ` · ${aircraft.etops_approval} min · Overwater ops` : ''}
        </p>
      </div>
    </div>
  );
}