import { CheckCircle, AlertTriangle, XCircle, Clock, User } from 'lucide-react';

const BAR_MAX = 16; // max duty hours for visual

function DutyBar({ used, limit, label }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 100 ? 'bg-rose-500' : pct >= 85 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        <span className={pct >= 100 ? 'text-rose-400 font-bold' : pct >= 85 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{used}h / {limit}h</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CrewMemberCard({ name, role, cert, restHours, dutyUsed, dutyLimit, flightTimeUsed, flightTimeLimit, status }) {
  const icon = status === 'legal' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
               status === 'near_limit' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
               <XCircle className="w-4 h-4 text-rose-400" />;
  const border = status === 'legal' ? 'border-emerald-800/50' : status === 'near_limit' ? 'border-amber-800/50' : 'border-rose-800/50';

  return (
    <div className={`rounded-xl border ${border} bg-slate-950 p-3 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100">{name}</p>
            <p className="text-[10px] text-slate-500">{role} · Cert {cert}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-[10px] font-bold uppercase ${status === 'legal' ? 'text-emerald-400' : status === 'near_limit' ? 'text-amber-400' : 'text-rose-400'}`}>
            {status === 'legal' ? 'Legal' : status === 'near_limit' ? 'Near Limit' : 'ILLEGAL'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <DutyBar used={dutyUsed} limit={dutyLimit} label="Flight Duty Period (FAR 117)" />
        <DutyBar used={flightTimeUsed} limit={flightTimeLimit} label="Flight Time (28-day)" />
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Rest Before Departure</span>
          <span className={restHours < 10 ? 'text-rose-400 font-bold' : restHours < 12 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
            {restHours}h (min 10h req)
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CrewLegalityRelease({ flight }) {
  const crew = [
    { name: flight.crew?.captain || 'Capt. J. Harrison', role: 'Captain', cert: 'ATP-2847', restHours: 11.5, dutyUsed: 4.2, dutyLimit: 13, flightTimeUsed: 62, flightTimeLimit: 100, status: 'legal' },
    { name: flight.crew?.fo || 'F/O M. Chen', role: 'First Officer', cert: 'ATP-5531', restHours: 10.8, dutyUsed: 4.2, dutyLimit: 13, flightTimeUsed: 78, flightTimeLimit: 100, status: 'near_limit' },
  ];

  const allLegal = crew.every(c => c.status !== 'illegal');
  const hasWarning = crew.some(c => c.status === 'near_limit');

  return (
    <div className="space-y-4 mt-3">
      {/* Summary banner */}
      <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${!allLegal ? 'border-rose-700/60 bg-rose-950/30' : hasWarning ? 'border-amber-700/60 bg-amber-950/30' : 'border-emerald-700/60 bg-emerald-950/30'}`}>
        <div className="flex items-center gap-3">
          <Clock className={`w-5 h-5 ${!allLegal ? 'text-rose-400' : hasWarning ? 'text-amber-400' : 'text-emerald-400'}`} />
          <div>
            <p className="text-sm font-bold text-slate-100">FAR 117 Crew Legality</p>
            <p className="text-[11px] text-slate-400">Flight & Duty Time Compliance · {flight.flightNumber}</p>
          </div>
        </div>
        <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${!allLegal ? 'bg-rose-900/50 text-rose-300' : hasWarning ? 'bg-amber-900/50 text-amber-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
          {!allLegal ? 'CREW ILLEGAL — HOLD' : hasWarning ? 'ADVISORY' : 'ALL LEGAL'}
        </span>
      </div>

      {/* Crew cards */}
      <div className="space-y-3">
        {crew.map((c, i) => <CrewMemberCard key={i} {...c} />)}
      </div>

      {/* FDP extension notice */}
      {hasWarning && (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 px-3 py-2.5 space-y-1">
          <p className="text-[11px] font-bold text-amber-300">FAR 117 Extension Advisory</p>
          <p className="text-[10px] text-amber-400/80">F/O approaching 28-day limit. Extension available per 117.19(b) with crew concurrence. Document in ASAP system if utilized.</p>
        </div>
      )}

      {/* Augmented crew check */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Augmented Crew / Relief</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Augmented crew required?</span>
          <span className="text-emerald-400 font-bold">No — Flight time {'<'} 10h</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1.5">
          <span className="text-slate-400">Rest facility available?</span>
          <span className="text-slate-300">N/A</span>
        </div>
      </div>

      {/* Dispatcher certification */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300">
            Dispatcher certifies crew duty/rest requirements have been verified per 14 CFR Part 117 and internal company scheduling standards prior to release issuance.
          </p>
        </div>
      </div>
    </div>
  );
}