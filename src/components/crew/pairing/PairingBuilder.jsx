import { useState } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle, Zap, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

const CREW_POOL = [
  { id: 'c1', name: 'Capt. J. Harrison', role: 'CA', base: 'EWR', type: 'flight', restHours: 11.5, dutyUsed: 2.1, available: true },
  { id: 'c2', name: 'F/O M. Chen',       role: 'FO', base: 'EWR', type: 'flight', restHours: 10.8, dutyUsed: 4.2, available: true },
  { id: 'c3', name: 'Capt. A. Nguyen',   role: 'CA', base: 'EWR', type: 'flight', restHours: 14.0, dutyUsed: 0,   available: true },
  { id: 'c4', name: 'F/O T. Park',       role: 'FO', base: 'ORD', type: 'flight', restHours: 12.2, dutyUsed: 1.5, available: true },
  { id: 'c5', name: 'Purser K. Williams',role: 'PS', base: 'EWR', type: 'cabin',  restHours: 13.0, dutyUsed: 0,   available: true },
  { id: 'c6', name: 'FA B. Thompson',    role: 'FA', base: 'EWR', type: 'cabin',  restHours: 11.0, dutyUsed: 2.5, available: true },
  { id: 'c7', name: 'FA S. Patel',       role: 'FA', base: 'EWR', type: 'cabin',  restHours: 12.5, dutyUsed: 1.0, available: true },
  { id: 'c8', name: 'FA L. Brooks',      role: 'FA', base: 'JFK', type: 'cabin',  restHours: 9.5,  dutyUsed: 5.2, available: false },
];

const FLIGHT_POOL = [
  { id: 'f1', number: 'ADY102', date: '04/07', dep: 'EWR', arr: 'LHR', std: '23:45', block: '7:35', crewReq: { CA:1, FO:1, PS:1, FA:3 } },
  { id: 'f2', number: 'ADY204', date: '04/07', dep: 'EWR', arr: 'CDG', std: '00:05', block: '7:30', crewReq: { CA:1, FO:1, PS:1, FA:3 } },
  { id: 'f3', number: 'ADY306', date: '04/07', dep: 'EWR', arr: 'SFO', std: '23:30', block: '5:40', crewReq: { CA:1, FO:1, PS:1, FA:2 } },
  { id: 'f4', number: 'ADY103', date: '04/09', dep: 'LHR', arr: 'EWR', std: '13:00', block: '7:45', crewReq: { CA:1, FO:1, PS:1, FA:3 } },
];

function legalCheck(crew, legs) {
  const issues = [];
  crew.forEach(c => {
    const totalDuty = c.dutyUsed + legs.reduce((s, l) => s + parseFloat(l.block || 0), 0);
    if (c.restHours < 10) issues.push(`${c.name}: Insufficient rest (${c.restHours}h < 10h min)`);
    if (totalDuty > 13)   issues.push(`${c.name}: Projected duty ${totalDuty.toFixed(1)}h exceeds 13h FDP limit`);
    if (!c.available)     issues.push(`${c.name}: Not available`);
  });
  return issues;
}

export default function PairingBuilder() {
  const [legs, setLegs] = useState([]);
  const [assignedCrew, setAssignedCrew] = useState([]);
  const [pairingId, setPairingId] = useState('PA-' + String(Math.floor(Math.random() * 9000 + 1000)));
  const [saved, setSaved] = useState(false);

  const addLeg = (flight) => {
    if (legs.find(l => l.id === flight.id)) return;
    setLegs(prev => [...prev, flight]);
  };

  const removeLeg = (id) => setLegs(prev => prev.filter(l => l.id !== id));

  const assignCrew = (crew) => {
    if (assignedCrew.find(c => c.id === crew.id)) return;
    setAssignedCrew(prev => [...prev, crew]);
  };

  const removeCrew = (id) => setAssignedCrew(prev => prev.filter(c => c.id !== id));

  const issues = legalCheck(assignedCrew, legs);
  const totalBlock = legs.reduce((s, l) => {
    const [h, m] = l.block.split(':').map(Number);
    return s + h + m / 60;
  }, 0);
  const totalBlockFmt = `${Math.floor(totalBlock)}:${String(Math.round((totalBlock % 1) * 60)).padStart(2,'0')}`;

  const handleSave = () => {
    if (legs.length === 0) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left: Available flights */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2"><Plane className="w-4 h-4 text-primary" /> Available Flights</p>
          {FLIGHT_POOL.map(f => (
            <div key={f.id} className={cn('rounded-xl border px-3 py-2.5 space-y-1', legs.find(l=>l.id===f.id) ? 'border-primary/40 bg-primary/5 opacity-60' : 'border-border bg-card/50 hover:bg-card cursor-pointer')}
              onClick={() => addLeg(f)}>
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-primary">{f.number}</span>
                <span className="text-[10px] text-muted-foreground">{f.date}</span>
              </div>
              <div className="text-xs text-muted-foreground">{f.dep} → {f.arr} · {f.std}Z · {f.block} block</div>
              <div className="flex gap-1 flex-wrap">
                {Object.entries(f.crewReq).map(([role, cnt]) => (
                  <span key={role} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{cnt}×{role}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Available crew */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-extrabold text-foreground uppercase tracking-widest">Available Crew</p>
          {CREW_POOL.map(c => (
            <div key={c.id} onClick={() => c.available && assignCrew(c)}
              className={cn('rounded-xl border px-3 py-2 flex items-center justify-between',
                !c.available ? 'border-rose-800/40 bg-rose-950/20 opacity-50 cursor-not-allowed' :
                assignedCrew.find(a=>a.id===c.id) ? 'border-primary/40 bg-primary/5 opacity-60' :
                'border-border bg-card/50 hover:bg-card cursor-pointer')}>
              <div>
                <p className="text-xs font-bold text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.role} · {c.base} · Rest: {c.restHours}h</p>
              </div>
              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', c.type === 'flight' ? 'bg-primary/10 text-primary' : 'bg-purple-900/40 text-purple-300')}>
                {c.type === 'flight' ? '✈' : '👥'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Pairing under construction */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input value={pairingId} onChange={e => setPairingId(e.target.value)}
                className="font-mono font-extrabold text-lg bg-transparent border-b border-border text-foreground outline-none w-32" />
              <span className="text-xs text-muted-foreground">New Pairing</span>
            </div>
            <div className="flex items-center gap-2">
              {issues.length > 0
                ? <span className="flex items-center gap-1 text-[10px] text-amber-400"><AlertTriangle className="w-3.5 h-3.5" />{issues.length} issues</span>
                : legs.length > 0 ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle className="w-3.5 h-3.5" />Legal</span> : null}
            </div>
          </div>

          {/* Legs */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Flight Legs ({legs.length})</p>
            {legs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Click flights on the left to add legs</div>
            ) : (
              <div className="space-y-1.5">
                {legs.map(l => (
                  <div key={l.id} className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
                    <span className="font-mono font-extrabold text-primary w-16">{l.number}</span>
                    <span className="text-xs text-muted-foreground">{l.date}</span>
                    <span className="text-xs font-mono">{l.dep} → {l.arr}</span>
                    <span className="text-xs text-muted-foreground">{l.std}Z</span>
                    <span className="text-xs text-sky-300 ml-auto">{l.block}</span>
                    <button onClick={() => removeLeg(l.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <span className="text-xs font-mono text-sky-300 font-bold">Total: {totalBlockFmt} block</span>
                </div>
              </div>
            )}
          </div>

          {/* Crew */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Assigned Crew ({assignedCrew.length})</p>
            {assignedCrew.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Click crew on the left to assign</div>
            ) : (
              <div className="space-y-1.5">
                {assignedCrew.map(c => (
                  <div key={c.id} className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2">
                    <span className="text-[10px] font-extrabold text-muted-foreground w-8">{c.role}</span>
                    <span className="text-xs font-bold text-foreground flex-1">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{c.base}</span>
                    <span className={cn('text-[10px] font-bold', c.restHours < 10 ? 'text-rose-400' : 'text-emerald-400')}>
                      {c.restHours}h rest
                    </span>
                    <button onClick={() => removeCrew(c.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal issues */}
          {issues.length > 0 && (
            <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">FAR 117 Legality Issues</p>
              {issues.map((iss, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                  {iss}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button onClick={handleSave} disabled={legs.length === 0 || issues.length > 0}
              className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-bold hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Zap className="w-4 h-4" /> Save Pairing</>}
            </button>
            <button onClick={() => { setLegs([]); setAssignedCrew([]); }}
              className="px-4 rounded-xl bg-slate-800 text-slate-300 py-2.5 text-sm font-bold hover:bg-slate-700 transition-all">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}