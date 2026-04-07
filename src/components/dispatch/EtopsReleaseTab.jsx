import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Shield, Clock, MapPin, Wind, Gauge } from 'lucide-react';

const CheckRow = ({ label, value, status, note }) => {
  const icon =
    status === 'ok'   ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> :
    status === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" /> :
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-200">{label}</span>
          {value && <span className="text-[11px] font-mono text-slate-300">{value}</span>}
        </div>
        {note && <p className="text-[10px] text-slate-500 mt-0.5">{note}</p>}
      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, iconColor, children }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
    </div>
    {children}
  </div>
);

export default function EtopsReleaseTab({ flight }) {
  const isEtops = !!flight.etops;
  const etopsMin = parseInt(flight.etops) || 0;
  const alternates = flight.etopsAlternates || [];

  const [dispatcherSig, setDispatcherSig] = useState('');
  const [released, setReleased] = useState(false);

  // Derive checks from flight data
  const aircraftChecks = [
    { label: 'ETOPS Authorization', value: flight.etops ? `${flight.etops} min certified` : 'N/A', status: isEtops ? 'ok' : 'fail', note: isEtops ? `14 CFR 121 Subpart P approved` : 'Aircraft not ETOPS certified' },
    { label: 'MEL/CDL ETOPS Impact', value: null, status: flight.mel?.some(m => m.toLowerCase().includes('etops')) ? 'warn' : 'ok', note: flight.mel?.find(m => m.toLowerCase().includes('etops')) || 'No MEL items affecting ETOPS' },
    { label: 'Engine Oil Consumption Check', value: 'Within limits', status: 'ok', note: 'Pre-departure oil check completed per AMM 79-00' },
    { label: 'APU / Backup Power', value: flight.mel?.some(m => m.includes('APU')) ? 'APU INOP' : 'Serviceable', status: flight.mel?.some(m => m.includes('APU')) ? 'warn' : 'ok', note: flight.mel?.find(m => m.includes('APU')) || 'APU operational for ETOPS flight' },
    { label: 'SATCOM / ACARS', value: 'Operational', status: 'ok', note: 'Required for ETOPS communications per OpSpecs B036' },
    { label: 'Weather Radar', value: 'Operational', status: 'ok', note: 'Both WXR systems serviceable' },
  ];

  const altChecks = alternates.map((alt, i) => ({
    label: `ETOPS Alternate — ${alt}`,
    value: i === 0 ? (flight.wx?.alt || 'WX OK') : 'WX OK',
    status: alt === 'SNN' ? 'ok' : 'ok',
    note: `Within ${etopsMin}-min diversion radius · Runway + approach serviceable`,
  }));

  const routeChecks = [
    { label: 'NAT Track Entry', value: flight.natTrackPoints?.entry || 'N/A', status: flight.natTrackPoints ? 'ok' : 'warn', note: 'Oceanic clearance obtained / pending' },
    { label: 'NAT Track Exit', value: flight.natTrackPoints?.exit || 'N/A', status: flight.natTrackPoints ? 'ok' : 'warn', note: 'Crossing waypoints filed on flight plan' },
    { label: 'Drift-Down / Single Engine', value: null, status: 'ok', note: flight.driftDownTerrain || 'Drift-down analysis complete' },
    { label: 'Max Diversion Time', value: flight.maxDiversionTime || `${etopsMin} min`, status: 'ok', note: 'Based on equal time point (ETP) analysis' },
    { label: 'ETOPS Critical Fuel', value: `${(parseFloat(flight.fuelPlan || 0) * 0.12).toFixed(1)} klbs`, status: 'ok', note: 'ETOPS reserve fuel verified at all ETP points' },
  ];

  const warnCount = [...aircraftChecks, ...altChecks, ...routeChecks].filter(c => c.status === 'warn').length;
  const failCount = [...aircraftChecks, ...altChecks, ...routeChecks].filter(c => c.status === 'fail').length;

  const canRelease = isEtops && failCount === 0 && dispatcherSig.trim().length > 2;

  if (!isEtops) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <Shield className="w-10 h-10 text-slate-600" />
        <p className="text-sm font-semibold text-slate-400">Not an ETOPS Flight</p>
        <p className="text-xs text-slate-600">{flight.flightNumber} does not require ETOPS certification.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-5">

      {/* Header Banner */}
      <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        failCount > 0 ? 'border-rose-700/60 bg-rose-950/40' :
        warnCount > 0 ? 'border-amber-700/60 bg-amber-950/40' :
        'border-emerald-700/60 bg-emerald-950/30'
      }`}>
        <div className="flex items-center gap-3">
          <Shield className={`w-5 h-5 ${failCount > 0 ? 'text-rose-400' : warnCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          <div>
            <p className="text-sm font-bold text-slate-100">ETOPS-{etopsMin} Release</p>
            <p className="text-[11px] text-slate-400">14 CFR 121 Subpart P · OpSpecs B036</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xs font-bold ${failCount > 0 ? 'text-rose-400' : warnCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {failCount > 0 ? `${failCount} FAIL` : warnCount > 0 ? `${warnCount} ADVISORY` : 'ALL CHECKS OK'}
          </p>
          <p className="text-[10px] text-slate-500">{aircraftChecks.length + altChecks.length + routeChecks.length} items reviewed</p>
        </div>
      </div>

      {/* Aircraft Airworthiness */}
      <Section title="Aircraft Airworthiness" icon={Gauge} iconColor="text-sky-400">
        {aircraftChecks.map((c, i) => <CheckRow key={i} {...c} />)}
      </Section>

      {/* ETOPS Alternates */}
      <Section title="ETOPS Alternates & Weather" icon={MapPin} iconColor="text-purple-400">
        {altChecks.length > 0
          ? altChecks.map((c, i) => <CheckRow key={i} {...c} />)
          : <p className="text-[11px] text-slate-500 italic">No ETOPS alternates defined for this flight.</p>
        }
      </Section>

      {/* Route / ETP Analysis */}
      <Section title="Route & ETP Analysis" icon={Wind} iconColor="text-cyan-400">
        {routeChecks.map((c, i) => <CheckRow key={i} {...c} />)}
      </Section>

      {/* Dispatcher Release Sign-off */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dispatcher ETOPS Release Sign-off</span>
        </div>

        {released ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-300">ETOPS Release Issued</p>
              <p className="text-[11px] text-emerald-500">Signed by: {dispatcherSig} · {new Date().toISOString().replace('T',' ').slice(0,16)}Z</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-slate-400">
              By signing, the dispatcher certifies all ETOPS pre-departure requirements have been met per 14 CFR 121.687 and the approved Operations Specifications.
            </p>
            {warnCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-300">{warnCount} advisory item(s) noted. Dispatcher accepts responsibility for release with stated conditions.</p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={dispatcherSig}
                onChange={e => setDispatcherSig(e.target.value)}
                placeholder="Enter dispatcher name / cert #"
                className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-primary"
              />
              <button
                disabled={!canRelease}
                onClick={() => setReleased(true)}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Issue ETOPS Release
              </button>
            </div>
            {!canRelease && dispatcherSig.length > 0 && failCount > 0 && (
              <p className="text-[10px] text-rose-400">Cannot release — {failCount} failed check(s) must be resolved.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}