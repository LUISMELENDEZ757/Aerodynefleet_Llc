import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Design palette: monospace, dark, colored status accents
const STATUS_CFG = {
  active:      { label: 'IN SERVICE',  bar: 'bg-[#2ecc71]',  text: 'text-[#2ecc71]',  badgeBorder: 'border-[#2ecc71]/50', glow: 'shadow-[0_0_10px_rgba(46,204,113,0.25)]' },
  oos:         { label: 'OUT OF SVC',   bar: 'bg-[#e74c3c]',  text: 'text-[#e74c3c]',  badgeBorder: 'border-[#e74c3c]/50', glow: 'shadow-[0_0_10px_rgba(231,76,60,0.25)]' },
  maintenance: { label: 'IN MX',       bar: 'bg-[#3498db]',  text: 'text-[#3498db]',  badgeBorder: 'border-[#3498db]/50', glow: 'shadow-[0_0_10px_rgba(52,152,219,0.25)]' },
  retired:     { label: 'RETIRED',     bar: 'bg-[#7f8c8d]',  text: 'text-[#7f8c8d]',  badgeBorder: 'border-[#7f8c8d]/50', glow: '' },
};

export default function FleetCommandCard({ aircraft, onSelect, melItems = [], activeLocks = [], discrepancies = [] }) {
  const qc = useQueryClient();
  const cfg = STATUS_CFG[aircraft.status] || STATUS_CFG.active;

  const activeMels = (melItems || []).filter(m => m.status !== 'cleared' && m.status !== 'voided');
  const openDiscs = (discrepancies || []).filter(d => d.discrepancy_status !== 'CLOSED');
  const acLock = activeLocks.find(l => l.aircraft_tail === aircraft.tail_number);

  const toggleMutation = useMutation({
    mutationFn: (data) => base44.entities.Aircraft.update(aircraft.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fleet-aircraft'] }),
  });

  const stop = (e) => e.stopPropagation();
  const openDetail = (e) => { e.stopPropagation(); onSelect(aircraft); };

  const toggleWatch = (e) => {
    stop(e);
    toggleMutation.mutate({ mcc_watch: !aircraft.mcc_watch });
  };
  const toggleFerry = (e) => {
    stop(e);
    toggleMutation.mutate({ ferry_flight: !aircraft.ferry_flight });
  };

  // Middle status line
  const statusLine = acLock
    ? { text: `LOCKED · ${acLock.placed_by || ''}`, color: 'text-[#e74c3c]' }
    : openDiscs.length > 0
    ? { text: `${openDiscs.length} OPEN WRITE-UP${openDiscs.length > 1 ? 'S' : ''}`, color: 'text-amber-400' }
    : activeMels.length > 0
    ? { text: `MEL ${activeMels.length} ACTIVE`, color: 'text-amber-400' }
    : { text: 'UNASSIGNED', color: 'text-[#7f8c8d]' };

  const actionBtn = 'px-2.5 py-1 rounded text-[10px] font-bold font-mono border border-white/15 text-[#7f8c8d] hover:text-white hover:border-white/30 transition-colors';

  return (
    <div
      onClick={() => onSelect(aircraft)}
      className="bg-[#1e262e] rounded-xl flex overflow-hidden cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all border border-white/5 h-full"
    >
      {/* Left vertical status bar */}
      <div className={cn('w-1.5 flex-shrink-0', cfg.bar, cfg.glow)} />

      <div className="flex-1 p-3 min-w-0 flex flex-col">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('text-lg font-black font-mono tracking-tight leading-none', cfg.text)}>
              {aircraft.tail_number}
            </p>
            <p className="text-[11px] text-[#7f8c8d] font-mono mt-1 truncate">
              {aircraft.aircraft_type} · {aircraft.base_station || '—'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/TechOpsLogbook?tail=${aircraft.tail_number}`}
              onClick={stop}
              className="w-7 h-7 rounded-lg bg-[#f1c40f]/10 border border-[#f1c40f]/30 flex items-center justify-center hover:bg-[#f1c40f]/20 transition-colors"
              title="E-Logbook"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#f1c40f]" />
            </Link>
            <span className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold font-mono border', cfg.badgeBorder, cfg.text)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.bar)} /> {cfg.label}
            </span>
          </div>
        </div>

        {/* ── MIDDLE STATUS LINE ── */}
        <div className="mt-3 mb-2">
          <p className={cn('text-[11px] font-bold font-mono', statusLine.color)}>{statusLine.text}</p>
        </div>

        {/* ── CAPABILITY BADGES ── */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {aircraft.status === 'oos' && (
            <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono bg-[#e74c3c] text-white">AOG</span>
          )}
          {activeMels.length > 0 && (
            <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono border border-[#7f8c8d]/40 text-[#7f8c8d]">
              {aircraft.status === 'oos' ? `MEL ${activeMels.length}` : 'MEL CLR'}
            </span>
          )}
          {aircraft.etops_approval && (
            <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono border border-cyan-500/30 text-cyan-400">
              ETOPS-{aircraft.etops_approval}
            </span>
          )}
          {aircraft.cat_approval && aircraft.cat_approval !== 'CAT I' && (
            <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono border border-indigo-500/30 text-indigo-300">
              {aircraft.cat_approval}
            </span>
          )}
        </div>

        {/* ── ACTION BAR ── */}
        <div className="flex flex-wrap gap-1.5 mt-auto mb-2">
          <button onClick={openDetail} className={actionBtn}>TAKE OWNERSHIP</button>
          <button onClick={openDetail} className={actionBtn}>LOCK</button>
          <button
            onClick={toggleWatch}
            className={cn('px-2.5 py-1 rounded text-[10px] font-bold font-mono border transition-colors',
              aircraft.mcc_watch
                ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                : actionBtn)}
          >
            WATCH
          </button>
          <button onClick={openDetail} className={actionBtn}>SET ETR</button>
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-[#7f8c8d] font-mono truncate">
            {aircraft.base_station || '—'}{aircraft.location_label ? ` · ${aircraft.location_label}` : ''}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleFerry}
              className={cn('px-2.5 py-1 rounded text-[10px] font-bold font-mono border transition-colors',
                aircraft.ferry_flight
                  ? 'border-sky-500/50 text-sky-400 bg-sky-500/10'
                  : actionBtn)}
            >
              FERRY FLT
            </button>
            {aircraft.status === 'oos' ? (
              <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono bg-[#e74c3c]/15 border border-[#e74c3c]/40 text-[#e74c3c]">
                AOG
              </span>
            ) : (
              <button onClick={openDetail} className="px-2.5 py-1 rounded text-[10px] font-bold font-mono border border-[#e74c3c]/40 text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-colors">
                OTS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}