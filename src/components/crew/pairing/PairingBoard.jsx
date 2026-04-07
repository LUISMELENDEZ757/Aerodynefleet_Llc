import { useState } from 'react';
import { Plane, Users, AlertTriangle, CheckCircle, Clock, ChevronRight, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Mock pairing data ---
const PAIRINGS = [
  {
    id: 'PA-0401', status: 'complete', type: 'flight_crew', base: 'EWR',
    legs: [
      { flight: 'ADY102', date: '04/07', dep: 'EWR', arr: 'LHR', std: '23:45', sta: '11:20+1', block: '7:35' },
      { flight: 'ADY103', date: '04/09', dep: 'LHR', arr: 'EWR', std: '13:00', sta: '15:45',   block: '7:45' },
    ],
    crew: [
      { name: 'Capt. J. Harrison', role: 'CA', cert: 'ATP-2847', legal: 'ok' },
      { name: 'F/O M. Chen',       role: 'FO', cert: 'ATP-5531', legal: 'warn' },
    ],
    totalBlock: '15:20', totalDuty: '18:40', layover: 'LHR — 25h', daysOff: 2, legal: 'warn',
  },
  {
    id: 'PA-0402', status: 'complete', type: 'cabin_crew', base: 'EWR',
    legs: [
      { flight: 'ADY102', date: '04/07', dep: 'EWR', arr: 'LHR', std: '23:45', sta: '11:20+1', block: '7:35' },
      { flight: 'ADY103', date: '04/09', dep: 'LHR', arr: 'EWR', std: '13:00', sta: '15:45',   block: '7:45' },
    ],
    crew: [
      { name: 'Purser K. Williams', role: 'PS', cert: 'FA-1122', legal: 'ok' },
      { name: 'FA B. Thompson',     role: 'FA', cert: 'FA-2241', legal: 'ok' },
      { name: 'FA S. Patel',        role: 'FA', cert: 'FA-3302', legal: 'ok' },
      { name: 'FA L. Brooks',       role: 'FA', cert: 'FA-4413', legal: 'ok' },
    ],
    totalBlock: '15:20', totalDuty: '18:40', layover: 'LHR — 25h', daysOff: 2, legal: 'ok',
  },
  {
    id: 'PA-0403', status: 'open', type: 'flight_crew', base: 'EWR',
    legs: [
      { flight: 'ADY204', date: '04/07', dep: 'EWR', arr: 'CDG', std: '00:05', sta: '13:35+1', block: '7:30' },
      { flight: 'ADY205', date: '04/09', dep: 'CDG', arr: 'EWR', std: '10:30', sta: '12:55',   block: '8:25' },
    ],
    crew: [
      { name: 'OPEN',         role: 'CA', cert: '—', legal: 'open' },
      { name: 'F/O R. Davis', role: 'FO', cert: 'ATP-7714', legal: 'ok' },
    ],
    totalBlock: '15:55', totalDuty: '19:10', layover: 'CDG — 21h', daysOff: 2, legal: 'open',
  },
  {
    id: 'PA-0404', status: 'complete', type: 'flight_crew', base: 'EWR',
    legs: [
      { flight: 'ADY306', date: '04/07', dep: 'EWR', arr: 'SFO', std: '23:30', sta: '03:10+1', block: '5:40' },
      { flight: 'ADY307', date: '04/08', dep: 'SFO', arr: 'EWR', std: '07:00', sta: '15:20',   block: '5:20' },
    ],
    crew: [
      { name: 'Capt. A. Nguyen', role: 'CA', cert: 'ATP-9981', legal: 'ok' },
      { name: 'F/O T. Park',     role: 'FO', cert: 'ATP-6623', legal: 'ok' },
    ],
    totalBlock: '11:00', totalDuty: '13:45', layover: 'SFO — 4h', daysOff: 1, legal: 'ok',
  },
  {
    id: 'PA-0405', status: 'deadhead', type: 'flight_crew', base: 'ORD',
    legs: [
      { flight: 'ADY910', date: '04/07', dep: 'EWR', arr: 'ORD', std: '06:00', sta: '07:45', block: '2:45', dh: true },
      { flight: 'ADY410', date: '04/07', dep: 'ORD', arr: 'LAX', std: '09:30', sta: '11:50', block: '4:20' },
    ],
    crew: [
      { name: 'Capt. C. Davis',  role: 'CA', cert: 'ATP-3345', legal: 'ok' },
      { name: 'F/O J. Martinez', role: 'FO', cert: 'ATP-8821', legal: 'ok' },
    ],
    totalBlock: '7:05', totalDuty: '9:30', layover: 'LAX — overnight', daysOff: 1, legal: 'ok',
  },
];

const STATUS_CFG = {
  complete: { label: 'COVERED',   color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-700/40' },
  open:     { label: 'OPEN',      color: 'text-rose-400',    bg: 'bg-rose-900/30',    border: 'border-rose-700/40' },
  deadhead: { label: 'DEADHEAD',  color: 'text-sky-400',     bg: 'bg-sky-900/30',     border: 'border-sky-700/40' },
};

const LEGAL_CFG = {
  ok:   { icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />, label: 'Legal' },
  warn: { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />, label: 'Near limit' },
  open: { icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,  label: 'Unfilled' },
};

function LegRow({ leg }) {
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs', leg.dh ? 'bg-sky-950/30 border border-sky-800/30' : 'bg-slate-950 border border-slate-800')}>
      {leg.dh && <span className="text-[9px] font-extrabold text-sky-400 bg-sky-900/40 px-1.5 py-0.5 rounded">DH</span>}
      <span className="font-mono font-extrabold text-primary w-16">{leg.flight}</span>
      <span className="text-muted-foreground">{leg.date}</span>
      <span className="font-mono text-foreground">{leg.dep}</span>
      <span className="text-muted-foreground">→</span>
      <span className="font-mono text-foreground">{leg.arr}</span>
      <span className="text-muted-foreground ml-auto">{leg.std}Z</span>
      <span className="text-muted-foreground">–</span>
      <span className="text-muted-foreground">{leg.sta}Z</span>
      <span className="font-mono text-sky-300 ml-2">{leg.block}</span>
    </div>
  );
}

function CrewBadge({ member }) {
  const cfg = LEGAL_CFG[member.legal] || LEGAL_CFG.ok;
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
      {cfg.icon}
      <span className="text-[10px] font-bold text-slate-300">{member.role}</span>
      <span className="text-[10px] text-slate-400">{member.name}</span>
    </div>
  );
}

function PairingCard({ pairing, onClick }) {
  const scfg = STATUS_CFG[pairing.status];
  return (
    <div onClick={() => onClick(pairing)}
      className={cn('rounded-2xl border p-4 cursor-pointer hover:brightness-110 transition-all space-y-3', scfg.bg, scfg.border)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-extrabold text-foreground">{pairing.id}</span>
          <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', scfg.color, 'bg-black/30')}>{scfg.label}</span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', pairing.type === 'flight_crew' ? 'bg-primary/10 text-primary' : 'bg-purple-900/40 text-purple-300')}>
            {pairing.type === 'flight_crew' ? '✈ Flight Crew' : '👥 Cabin Crew'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{pairing.totalBlock} block</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pairing.totalDuty} duty</span>
          <span>{pairing.layover}</span>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-1">
        {pairing.legs.map((leg, i) => <LegRow key={i} leg={leg} />)}
      </div>

      {/* Crew */}
      <div className="flex flex-wrap gap-1.5">
        {pairing.crew.map((c, i) => <CrewBadge key={i} member={c} />)}
      </div>
    </div>
  );
}

function PairingDetail({ pairing, onClose }) {
  if (!pairing) return null;
  const scfg = STATUS_CFG[pairing.status];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-24 px-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-foreground">{pairing.id}</span>
            <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', scfg.color, 'bg-black/30')}>{scfg.label}</span>
          </div>
          <button onClick={onClose} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">Close</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[['Total Block', pairing.totalBlock], ['Total Duty', pairing.totalDuty], ['Layover', pairing.layover], ['Days Off', pairing.daysOff + ' days'], ['Base', pairing.base], ['Crew Type', pairing.type === 'flight_crew' ? 'Flight Crew' : 'Cabin Crew']].map(([l,v]) => (
              <div key={l} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{l}</p>
                <p className="text-sm font-bold text-foreground">{v}</p>
              </div>
            ))}
          </div>

          {/* Legs */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Flight Legs</p>
            <div className="space-y-1.5">
              {pairing.legs.map((leg, i) => <LegRow key={i} leg={leg} />)}
            </div>
          </div>

          {/* Crew assignments */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Crew Assignments</p>
            <div className="space-y-2">
              {pairing.crew.map((c, i) => {
                const lc = LEGAL_CFG[c.legal];
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">{c.role}</div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.cert}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {lc.icon}
                      <span className="text-[10px] font-bold text-slate-400">{lc.label}</span>
                    </div>
                    {c.name === 'OPEN' && (
                      <button className="text-[10px] font-bold px-3 py-1 rounded-lg bg-rose-700 text-white hover:bg-rose-600">Assign Crew</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button className="flex-1 rounded-lg bg-sky-700 text-white py-2 text-xs font-bold hover:bg-sky-600">Edit Pairing</button>
            <button className="flex-1 rounded-lg bg-amber-700 text-white py-2 text-xs font-bold hover:bg-amber-600">Reassign Crew</button>
            <button className="flex-1 rounded-lg bg-slate-700 text-slate-200 py-2 text-xs font-bold hover:bg-slate-600">Publish</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PairingBoard({ bidPeriod }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = PAIRINGS.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground font-semibold">Status:</span>
        {['all','complete','open','deadhead'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all', filter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground')}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-xs text-muted-foreground font-semibold ml-4">Type:</span>
        {['all','flight_crew','cabin_crew'].map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all', typeFilter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground')}>
            {f === 'all' ? 'All' : f === 'flight_crew' ? '✈ Flight Crew' : '👥 Cabin Crew'}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} pairings · {bidPeriod}</span>
      </div>

      {/* Pairing cards */}
      <div className="space-y-3">
        {filtered.map(p => <PairingCard key={p.id} pairing={p} onClick={setSelected} />)}
      </div>

      <PairingDetail pairing={selected} onClose={() => setSelected(null)} />
    </div>
  );
}