import { useState } from 'react';
import { CheckCircle, AlertTriangle, FileText, Pen, Clock, Shield } from 'lucide-react';

const Field = ({ label, value, highlight }) => (
  <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-slate-950 border border-slate-800'}`}>
    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
    <span className="text-xs font-mono font-bold text-slate-100">{value || '—'}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-1">{title}</p>
    {children}
  </div>
);

export default function DispatchReleaseDocument({ flight, releaseNumber, onDispatcherSign, onComplete }) {
  const [dispName, setDispName] = useState('');
  const [picName, setPicName] = useState('');
  const [dispSigned, setDispSigned] = useState(false);
  const [picSigned, setPicSigned] = useState(false);
  const [amendReason, setAmendReason] = useState('');
  const [showAmend, setShowAmend] = useState(false);
  const [amendments, setAmendments] = useState([]);

  const releaseNum = releaseNumber || `DR-${flight.flightNumber.replace(/\s/g,'')}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-001`;
  const now = new Date().toISOString().replace('T',' ').slice(0,16) + 'Z';

  const handleDispSign = () => {
    if (!dispName.trim()) return;
    setDispSigned(true);
    onDispatcherSign?.({ name: dispName, timestamp: now, release_number: releaseNum });
  };

  const handlePicSign = () => {
    if (!picName.trim()) return;
    setPicSigned(true);
  };

  const handleAmend = () => {
    if (!amendReason.trim()) return;
    setAmendments(prev => [...prev, { reason: amendReason, timestamp: now, by: dispName }]);
    setAmendReason('');
    setShowAmend(false);
  };

  const bothSigned = dispSigned && picSigned;

  return (
    <div className="space-y-4 mt-3">

      {/* Release Header Banner */}
      <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between ${bothSigned ? 'border-emerald-700/60 bg-emerald-950/30' : 'border-amber-700/50 bg-amber-950/20'}`}>
        <div className="flex items-center gap-3">
          <FileText className={`w-5 h-5 ${bothSigned ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div>
            <p className="text-sm font-extrabold text-slate-100">FAR 121.663 Dispatch Release</p>
            <p className="text-[10px] text-slate-400">Release № {releaseNum} · {amendments.length > 0 ? `Amendment ${amendments.length}` : 'Original'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xs font-bold ${bothSigned ? 'text-emerald-400' : 'text-amber-400'}`}>
            {bothSigned ? 'RELEASED' : dispSigned ? 'AWAITING PIC' : 'DRAFT'}
          </p>
          <p className="text-[10px] text-slate-500">{now}</p>
        </div>
      </div>

      {/* OpSpecs References */}
      <div className="flex flex-wrap gap-2">
        {['B036 — ETOPS', 'C055 — Approaches', 'D085 — Routes', 'A001 — OpSpecs'].map(spec => (
          <span key={spec} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-900/40 border border-sky-700/40 text-sky-300">{spec}</span>
        ))}
      </div>

      {/* Flight Identity */}
      <Section title="Flight Identity">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Flight #" value={flight.flightNumber} highlight />
          <Field label="Aircraft Tail" value={flight.tail} />
          <Field label="Flight Date" value={new Date().toISOString().slice(0,10)} />
          <Field label="Origin" value={flight.origin} />
          <Field label="Destination" value={flight.destination} />
          <Field label="Alternate" value={flight.alternate} />
          <Field label="ETD (Zulu)" value={flight.depTime + 'Z'} />
          <Field label="ETOPS" value={flight.etops ? `ETOPS-${flight.etops}` : 'N/A'} />
          <Field label="Aircraft Type" value="B787-9" />
        </div>
      </Section>

      {/* Route */}
      <Section title="Filed Route">
        <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 leading-relaxed">
          {flight.route || 'No route filed'}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <Field label="Cruise Alt" value="FL350" />
          <Field label="Cruise Speed" value="M.84" />
          <Field label="Est. Block Time" value="7+45" />
        </div>
      </Section>

      {/* Fuel */}
      <Section title="Fuel Authorization (lbs)">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(flight.fuelBreakdown || {}).map(([k, v]) => (
            <Field key={k} label={k} value={v + ' klbs'} />
          ))}
          <Field label="FOB (Total)" value={flight.fuelPlan + ' klbs'} highlight />
          <Field label="Extra Fuel" value={flight.fuelExtra + ' klbs'} />
          <Field label="Min Required" value={(parseFloat(flight.fuelPlan) - 3).toFixed(1) + ' klbs'} />
        </div>
      </Section>

      {/* Weather Synopsis */}
      <Section title="Weather Briefing">
        <div className="grid grid-cols-1 gap-2">
          {[['DEP — ' + flight.origin, flight.wx?.dep], ['ARR — ' + flight.destination, flight.wx?.arr], ['ALT — ' + flight.alternate, flight.wx?.alt]].map(([label, val]) => (
            <div key={label} className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
              <p className="text-xs font-mono text-slate-300">{val || 'No METAR available'}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* MEL/CDL */}
      <Section title="MEL / CDL — Dispatch Impact">
        <div className="space-y-1.5">
          {(flight.mel || ['No active MEL items']).map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
              {item.toLowerCase().includes('inop') || item.toLowerCase().includes('restr')
                ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                : <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />}
              <p className="text-xs text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* NOTAMs */}
      <Section title="NOTAMs — Operationally Significant">
        <div className="space-y-1.5">
          {(flight.notams || []).map((n, i) => (
            <div key={i} className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300">{n}</div>
          ))}
        </div>
      </Section>

      {/* Amendments */}
      {amendments.length > 0 && (
        <Section title="Amendments">
          {amendments.map((a, i) => (
            <div key={i} className="rounded-lg bg-amber-950/30 border border-amber-700/40 px-3 py-2">
              <p className="text-[10px] text-amber-400 font-bold">Amendment {i + 1} · {a.timestamp} · {a.by}</p>
              <p className="text-xs text-slate-300 mt-0.5">{a.reason}</p>
            </div>
          ))}
        </Section>
      )}

      {/* Dual Signature Block */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dual Authorization — FAR 121.663</p>
        <p className="text-[11px] text-slate-500">
          By signing, both the Dispatcher and PIC certify they have reviewed this release and are in mutual agreement that the flight can be conducted safely and in compliance with all applicable FARs.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Dispatcher */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Dispatcher</p>
            {dispSigned ? (
              <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-3 py-2.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">{dispName}</p>
                  <p className="text-[10px] text-emerald-600">{now}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input value={dispName} onChange={e => setDispName(e.target.value)} placeholder="Dispatcher name / cert #"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-primary" />
                <button onClick={handleDispSign} disabled={!dispName.trim()}
                  className="w-full rounded-lg bg-sky-700 text-white py-1.5 text-xs font-bold hover:bg-sky-600 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                  <Pen className="w-3 h-3" /> Sign as Dispatcher
                </button>
              </div>
            )}
          </div>

          {/* PIC */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Pilot in Command</p>
            {picSigned ? (
              <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-3 py-2.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">{picName}</p>
                  <p className="text-[10px] text-emerald-600">{now}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input value={picName} onChange={e => setPicName(e.target.value)} placeholder="PIC name / employee #"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-primary" />
                <button onClick={handlePicSign} disabled={!picName.trim() || !dispSigned}
                  className="w-full rounded-lg bg-emerald-700 text-white py-1.5 text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                  <Pen className="w-3 h-3" /> Sign as PIC
                </button>
                {!dispSigned && <p className="text-[9px] text-amber-400">Dispatcher must sign first</p>}
              </div>
            )}
          </div>
        </div>

        {bothSigned && (
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowAmend(true)}
              className="flex-1 rounded-lg bg-amber-700 text-white py-2 text-xs font-bold hover:bg-amber-600 transition-all">
              Issue Amendment
            </button>
            <button className="flex-1 rounded-lg bg-slate-700 text-slate-200 py-2 text-xs font-bold hover:bg-slate-600 transition-all">
              Print / Export PDF
            </button>
          </div>
        )}

        {showAmend && (
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <p className="text-[10px] font-bold text-amber-400 uppercase">Amendment Reason</p>
            <textarea value={amendReason} onChange={e => setAmendReason(e.target.value)} rows={2}
              placeholder="Describe the reason for amendment..."
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-amber-500 resize-none" />
            <div className="flex gap-2">
              <button onClick={handleAmend} className="flex-1 rounded-lg bg-amber-700 text-white py-1.5 text-xs font-bold hover:bg-amber-600">Confirm Amendment</button>
              <button onClick={() => setShowAmend(false)} className="flex-1 rounded-lg bg-slate-800 text-slate-300 py-1.5 text-xs font-bold hover:bg-slate-700">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}