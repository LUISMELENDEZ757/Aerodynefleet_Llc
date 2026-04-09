import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, AlertTriangle, Plane, MapPin, Fuel, Users, CloudRain, FileText, CheckCircle, Zap, Clock, Wind, Thermometer } from 'lucide-react';
import { useMultiStationWeather } from '@/hooks/useOpenMeteo';
import { cn } from '@/lib/utils';

const DIVERSION_AIRPORTS = [
  { icao: 'KJFK', name: 'New York JFK', fuel: true, mx: true, hotel: true, dist: 45 },
  { icao: 'KEWR', name: 'Newark Liberty', fuel: true, mx: true, hotel: true, dist: 12 },
  { icao: 'KBOS', name: 'Boston Logan', fuel: true, mx: false, hotel: true, dist: 210 },
  { icao: 'KPHL', name: 'Philadelphia', fuel: true, mx: true, hotel: true, dist: 95 },
  { icao: 'KBWI', name: 'Baltimore/Washington', fuel: true, mx: false, hotel: false, dist: 220 },
  { icao: 'KDCA', name: 'Reagan National', fuel: false, mx: false, hotel: true, dist: 228 },
];

const DIVERSION_REASONS = ['Weather at Destination', 'Medical Emergency', 'Mechanical Issue', 'Fuel Emergency', 'Security Threat', 'Crew Incapacitation', 'Passenger Disturbance', 'ATC Direction'];

const CHECKLIST_ITEMS = [
  { id: 'assess', label: 'Assess fuel state vs. alternate options', category: 'Fuel' },
  { id: 'wx_alt', label: 'Check weather at diversion airport', category: 'Weather' },
  { id: 'notam_alt', label: 'Review NOTAMs at diversion airport', category: 'NOTAM' },
  { id: 'crew_legality', label: 'Verify crew legality for extended duty', category: 'Crew' },
  { id: 'dispatch_amend', label: 'Issue dispatch release amendment', category: 'Dispatch' },
  { id: 'notify_crew', label: 'Notify captain of diversion decision', category: 'Comms' },
  { id: 'notify_ops', label: 'Notify Station Operations at alternate', category: 'Comms' },
  { id: 'pax_plan', label: 'Initiate passenger reaccom plan', category: 'Passenger' },
  { id: 'hotel_block', label: 'Block hotel rooms if overnight required', category: 'Logistics' },
  { id: 'mx_notify', label: 'Notify MX if mechanical issue involved', category: 'Maintenance' },
  { id: 'fuel_order', label: 'Order fuel at diversion airport', category: 'Fuel' },
  { id: 'log_entry', label: 'Create diversion log entry in dispatch logbook', category: 'Documentation' },
];

const CATEGORY_COLORS = {
  Fuel: 'bg-amber-500/15 text-amber-400',
  Weather: 'bg-blue-500/15 text-blue-400',
  NOTAM: 'bg-purple-500/15 text-purple-400',
  Crew: 'bg-green-500/15 text-green-400',
  Dispatch: 'bg-primary/15 text-primary',
  Comms: 'bg-cyan-500/15 text-cyan-400',
  Passenger: 'bg-pink-500/15 text-pink-400',
  Logistics: 'bg-orange-500/15 text-orange-400',
  Maintenance: 'bg-red-500/15 text-red-400',
  Documentation: 'bg-gray-500/15 text-gray-400',
};

export default function DiversionWorkflow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    flight: '', aircraft: '', reason: '', alternate: '', fuelOnBoard: 8000, paxCount: 150,
  });
  const [checklist, setChecklist] = useState({});
  const [generated, setGenerated] = useState(false);

  const { data: flights = [] } = useQuery({
    queryKey: ['div-flights'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 100),
  });

  const altIcaos = DIVERSION_AIRPORTS.map(a => a.icao).filter(Boolean);
  const { data: altWeather = [] } = useMultiStationWeather(altIcaos);
  const wxByIcao = altWeather.reduce((acc, w) => { acc[w.icao] = w; return acc; }, {});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleCheck = (id) => setChecklist(p => ({ ...p, [id]: !p[id] }));
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const selectedAlt = DIVERSION_AIRPORTS.find(a => a.icao === form.alternate);

  // Estimate fuel to alternate
  const fuelToAlt = selectedAlt ? Math.round((selectedAlt.dist / 400) * 6000) : 0; // rough lbs
  const fuelAfterAlt = form.fuelOnBoard - fuelToAlt;
  const fuelOk = fuelAfterAlt > 3000;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-foreground">ONE-CLICK DIVERSION</h1>
          <p className="text-xs font-mono text-red-400 tracking-widest">Emergency Diversion Workflow · Dispatcher Tool</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-red-400 font-bold animate-pulse">
          <Zap className="w-4 h-4" /> EMERGENCY MODE
        </div>
      </div>

      {/* Step Indicator */}
      <div className="border-b border-border bg-card/50 px-5 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          {['Flight Info', 'Select Alternate', 'Fuel Check', 'Action Checklist', 'Finalize'].map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => setStep(i + 1)}
                className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all',
                  step === i + 1 ? 'bg-primary text-primary-foreground' : step > i + 1 ? 'bg-green-900/40 text-green-400' : 'text-muted-foreground')}>
                {step > i + 1 ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < 4 && <div className="flex-1 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">

        {/* Step 1: Flight Info */}
        {step === 1 && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <p className="text-sm font-extrabold text-foreground">Flight Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Flight Number</label>
                <select value={form.flight} onChange={e => set('flight', e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                  <option value="">Select flight…</option>
                  {flights.map(f => <option key={f.id} value={f.flight_number}>{f.flight_number} — {f.origin} → {f.destination}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Aircraft Tail</label>
                <input value={form.aircraft} onChange={e => set('aircraft', e.target.value)} placeholder="e.g. N455GJ"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Diversion Reason</label>
                <select value={form.reason} onChange={e => set('reason', e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                  <option value="">Select reason…</option>
                  {DIVERSION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">Fuel on Board (lbs): {form.fuelOnBoard.toLocaleString()}</label>
                <input type="range" min={2000} max={50000} step={500} value={form.fuelOnBoard} onChange={e => set('fuelOnBoard', Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">PAX Count: {form.paxCount}</label>
                <input type="range" min={0} max={300} value={form.paxCount} onChange={e => set('paxCount', Number(e.target.value))}
                  className="w-full accent-primary" />
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!form.flight || !form.reason}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        )}

        {/* Step 2: Select Alternate */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-extrabold text-foreground">Select Diversion Airport</p>
            {DIVERSION_AIRPORTS.map(apt => (
              <button key={apt.icao} onClick={() => set('alternate', apt.icao)}
                className={cn('w-full bg-card border rounded-2xl p-4 text-left transition-all', form.alternate === apt.icao ? 'border-primary bg-primary/10' : 'border-border hover:border-white/30')}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <MapPin className={cn('w-4 h-4', form.alternate === apt.icao ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{apt.icao} — {apt.name}</p>
                      <p className="text-xs text-muted-foreground">{apt.dist} nm away</p>
                    </div>
                  </div>
                  {form.alternate === apt.icao && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', apt.fuel ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
                    {apt.fuel ? '✓ Fuel' : '✗ Fuel'}
                  </span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', apt.mx ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-500/15 text-gray-400')}>
                    {apt.mx ? '✓ MX' : '✗ MX'}
                  </span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', apt.hotel ? 'bg-purple-500/15 text-purple-400' : 'bg-gray-500/15 text-gray-400')}>
                    {apt.hotel ? '✓ Hotel' : '✗ Hotel'}
                  </span>
                  {wxByIcao[apt.icao] && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 flex items-center gap-1">
                      {wxByIcao[apt.icao].condition.icon} {wxByIcao[apt.icao].temp_c}°C · {wxByIcao[apt.icao].windspeed_kt}kt
                    </span>
                  )}
                </div>
              </button>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl border border-border text-muted-foreground font-bold text-sm hover:text-foreground">← Back</button>
              <button onClick={() => setStep(3)} disabled={!form.alternate} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}

        {/* Step 3: Fuel Check */}
        {step === 3 && (
          <div className="space-y-4">
            <div className={cn('bg-card border rounded-2xl p-6 space-y-4', fuelOk ? 'border-green-500/40' : 'border-red-500/40')}>
              <p className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" /> Fuel Analysis — {form.alternate}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Fuel on Board', value: `${form.fuelOnBoard.toLocaleString()} lbs`, color: 'text-white' },
                  { label: `Est. to ${form.alternate}`, value: `${fuelToAlt.toLocaleString()} lbs`, color: 'text-amber-400' },
                  { label: 'Fuel After Arrival', value: `${fuelAfterAlt.toLocaleString()} lbs`, color: fuelOk ? 'text-green-400' : 'text-red-400' },
                  { label: 'Min Reserve', value: '3,000 lbs', color: 'text-blue-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn('text-lg font-black mt-0.5', color)}>{value}</p>
                  </div>
                ))}
              </div>
              <div className={cn('rounded-xl p-3 flex items-center gap-3', fuelOk ? 'bg-green-900/30 border border-green-500/40' : 'bg-red-900/30 border border-red-500/40')}>
                {fuelOk
                  ? <><CheckCircle className="w-5 h-5 text-green-400" /><p className="text-sm font-bold text-green-400">FUEL SUFFICIENT — Safe to divert to {form.alternate}</p></>
                  : <><AlertTriangle className="w-5 h-5 text-red-400" /><p className="text-sm font-bold text-red-400">FUEL CRITICAL — Consider closer alternate or emergency declaration</p></>
                }
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl border border-border text-muted-foreground font-bold text-sm hover:text-foreground">← Back</button>
              <button onClick={() => setStep(4)} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 4: Action Checklist */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-foreground">Diversion Checklist</p>
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', completedCount === CHECKLIST_ITEMS.length ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400')}>
                {completedCount}/{CHECKLIST_ITEMS.length} complete
              </span>
            </div>
            {CHECKLIST_ITEMS.map(item => (
              <button key={item.id} onClick={() => toggleCheck(item.id)}
                className={cn('w-full bg-card border rounded-xl p-3.5 flex items-center gap-3 text-left transition-all', checklist[item.id] ? 'border-green-500/40 bg-green-900/10' : 'border-border hover:border-white/20')}>
                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', checklist[item.id] ? 'bg-green-500 border-green-500' : 'border-border')}>
                  {checklist[item.id] && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <p className={cn('text-sm flex-1', checklist[item.id] ? 'text-muted-foreground line-through' : 'text-foreground')}>{item.label}</p>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0', CATEGORY_COLORS[item.category])}>{item.category}</span>
              </button>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 h-11 rounded-xl border border-border text-muted-foreground font-bold text-sm hover:text-foreground">← Back</button>
              <button onClick={() => setStep(5)} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90">Finalize →</button>
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-card border border-green-500/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-base font-extrabold text-green-400">DIVERSION PACKAGE COMPLETE</p>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleString('en-US', { timeZone: 'UTC', timeZoneName: 'short' })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Flight', form.flight],
                  ['Aircraft', form.aircraft],
                  ['Reason', form.reason],
                  ['Alternate', form.alternate],
                  ['Fuel Check', fuelOk ? '✓ PASS' : '⚠ MARGINAL'],
                  ['Checklist', `${completedCount}/${CHECKLIST_ITEMS.length} items`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-muted-foreground">{k}</p>
                    <p className="font-bold text-foreground mt-0.5">{v || '—'}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { setStep(1); setForm({ flight: '', aircraft: '', reason: '', alternate: '', fuelOnBoard: 8000, paxCount: 150 }); setChecklist({}); }}
                className="w-full h-11 rounded-xl bg-secondary border border-border text-foreground font-bold text-sm hover:bg-secondary/80">
                Start New Diversion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}