import React, { useMemo, useState } from 'react';
import {
  CLASS_CODES, ATA_CHAPTERS, SUB_GROUPS_BY_ATA, DOC_TYPES,
  TRACE_CATEGORIES, TRACE_TYPES, HISTORY_EVENTS, SCRAP_REASONS,
} from '../../../base44/shared/meNumbering';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

const CATEGORY_EXAMPLES = [
  { title: 'Engines (ATA 72)', items: ['72-000-9-0001 → Engine assembly', '72-110-9-0002 → Fan module', '72-510-9-0003 → HPT rotor', '72-600-5-0007 → Gearbox (repairable)', '72-520-3-0044 → Fuel nozzle (expendable)'] },
  { title: 'Landing Gear (ATA 32)', items: ['32-000-9-0001 → Landing gear assembly', '32-310-9-0022 → Brake unit', '32-210-7-0011 → Main gear actuator', '32-110-3-0044 → Nose gear shimmy damper seal'] },
  { title: 'Flight Controls (ATA 27)', items: ['27-000-9-0001 → PCU assembly', '27-510-7-0002 → Elevator servo', '27-310-3-0044 → Flap track roller'] },
  { title: 'APU (ATA 49)', items: ['49-000-9-0001 → APU assembly', '49-210-5-0007 → Starter motor (repairable)', '49-310-3-0021 → Oil filter'] },
];

export default function NumberingReference() {
  const [ata, setAta] = useState('72');
  const subGroups = SUB_GROUPS_BY_ATA[ata] || [];
  const classList = useMemo(() => Object.entries(CLASS_CODES), []);

  return (
    <div className="space-y-6">
      {/* Master format */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Master Format</p>
        <p className="text-2xl font-black font-mono text-white tracking-wider">[ATA]-[Sub]-[Class]-[Seq]</p>
        <p className="text-sm text-gray-400 mt-2 font-mono">e.g. <span className="text-primary font-bold">72-000-9-0001</span></p>
      </div>

      {/* Class codes */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3">Class Codes (Block 3)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {classList.map(([code, name]) => (
            <div key={code} className="flex items-center justify-between bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2">
              <span className={cn('text-lg font-black font-mono', code === '9' ? 'text-emerald-400' : code === '7' ? 'text-blue-400' : code === '5' ? 'text-amber-400' : code === '3' ? 'text-orange-400' : 'text-gray-400')}>{code}</span>
              <div className="text-right">
                <p className="text-xs font-bold text-white">{name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ATA chapters + sub-groups */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">ATA Chapters (Block 1)</p>
          <select value={ata} onChange={e => setAta(e.target.value)} className="bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none">
            {ATA_CHAPTERS.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
          </select>
        </div>
        {subGroups.length > 0 ? (
          <div className="mb-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Sub-Groups (Block 2) · ATA {ata}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {subGroups.map(s => (
                <div key={s.code} className="bg-[#1a1f2e] border border-white/8 rounded-lg px-3 py-2">
                  <p className="text-sm font-black font-mono text-primary">{s.code}</p>
                  <p className="text-[10px] text-gray-400 truncate">{s.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-600">No sub-groups defined for this ATA chapter in the master spec.</p>
        )}
      </div>

      {/* Description lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3">Document Types</p>
          <div className="grid grid-cols-2 gap-2">
            {DOC_TYPES.map(d => (
              <div key={d.code} className="bg-[#1a1f2e] border border-white/8 rounded-lg px-3 py-2">
                <p className="text-sm font-black font-mono text-cyan-400">{d.code}</p>
                <p className="text-[10px] text-gray-400 truncate">{d.name}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-3">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">Parallel Schemes</p>
            <ul className="text-xs text-gray-300 font-mono space-y-1">
              <li>TL-[ATA]-[Class]-[Seq] <span className="text-gray-600">Tooling</span></li>
              <li>[DocType]-[ATA]-[Seq]-Rev N <span className="text-gray-600">Documents</span></li>
              <li>DOC-[CAT]-[ATA]-[Seq]-[Type]-Rev N <span className="text-gray-600">Traceability</span></li>
              <li>WO-[Tail]-[Date]-[ATA]-[Seq] <span className="text-gray-600">Work Orders</span></li>
              <li>HIS-[ATA]-[Class]-[Seq]-[Event] <span className="text-gray-600">History</span></li>
              <li>SCR-[ATA]-[Class]-[Seq]-[Reason] <span className="text-gray-600">Scrap</span></li>
              <li>POOL-[ATA]-[Class]-[Seq]-[Loc] <span className="text-gray-600">Pool</span></li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge label="Trace Cats" values={TRACE_CATEGORIES.map(c => c.code)} />
            <Badge label="Trace Types" values={TRACE_TYPES} />
            <Badge label="History Events" values={HISTORY_EVENTS} />
            <Badge label="Scrap Reasons" values={SCRAP_REASONS} />
          </div>
        </div>
      </div>

      {/* Examples by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CATEGORY_EXAMPLES.map(cat => (
          <div key={cat.title} className="bg-[#141922] border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-extrabold text-white uppercase tracking-widest mb-3">{cat.title}</p>
            <ul className="space-y-1.5">
              {cat.items.map(ex => (
                <li key={ex} className="text-xs font-mono text-gray-300 flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ label, values }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#1a1f2e] border border-white/8 rounded-lg px-2 py-1">
      <span className="text-[9px] font-bold text-gray-500 uppercase">{label}</span>
      {values.map(v => <span key={v} className="text-[10px] font-mono font-bold text-white">{v}</span>)}
    </div>
  );
}