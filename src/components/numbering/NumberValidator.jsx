import React, { useMemo, useState } from 'react';
import { validateNumber, parsePartNumber, ATA_CHAPTERS, CLASS_CODES } from '../../../base44/shared/meNumbering';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Search } from 'lucide-react';

export default function NumberValidator() {
  const [input, setInput] = useState('');
  const result = useMemo(() => validateNumber(input), [input]);
  const parts = useMemo(() => parsePartNumber(input), [input]);

  const ataName = ATA_CHAPTERS.find(a => a.code === parts.ata)?.name;
  const clsName = CLASS_CODES[parts.cls];

  return (
    <div className="space-y-4">
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-4">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Enter any M&E number to validate</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="e.g. 72-000-9-0001  ·  TL-32-7-0002  ·  EO-72-0045-Rev 2  ·  WO-N12345-20260716-72-0012"
            className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-primary" />
        </div>
      </div>

      {input.trim() && (
        <div className={cn('rounded-2xl border p-4',
          result.valid ? 'bg-emerald-900/20 border-emerald-500/40' : 'bg-red-900/20 border-red-500/40')}>
          <div className="flex items-center gap-2">
            {result.valid ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
            <div>
              <p className={cn('text-sm font-extrabold uppercase tracking-widest', result.valid ? 'text-emerald-400' : 'text-red-400')}>
                {result.valid ? 'Valid' : 'Invalid'}
              </p>
              <p className={cn('text-xs font-mono', result.valid ? 'text-gray-400' : 'text-red-300/70')}>{result.label}</p>
            </div>
          </div>

          {result.valid && result.scheme === 'me_part' && parts.valid && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <Block label="ATA Chapter" value={`${parts.ata}${ataName ? ' — ' + ataName : ''}`} />
              <Block label="Sub-Group" value={parts.sub} />
              <Block label="Class Code" value={`${parts.cls}${clsName ? ' — ' + clsName : ''}`} />
              <Block label="Sequence" value={parts.seq} />
            </div>
          )}
          {result.valid && result.scheme !== 'me_part' && (
            <p className="text-xs text-gray-400 mt-3 font-mono">Scheme: {result.scheme}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Block({ label, value }) {
  return (
    <div className="bg-[#0d1117] border border-white/8 rounded-lg px-3 py-2">
      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-mono font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}