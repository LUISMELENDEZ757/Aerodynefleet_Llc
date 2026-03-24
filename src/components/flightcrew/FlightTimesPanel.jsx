import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, LogOut, LogIn, Plane, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

// Parse "HH:MM" into total minutes
function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

// Minutes → "HH:MM"
function fromMinutes(total) {
  if (total == null || total < 0) return '—';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Block time = IN - OUT (handles midnight crossing)
function calcBlockMinutes(out, inn) {
  const o = toMinutes(out);
  const i = toMinutes(inn);
  if (o == null || i == null) return null;
  let diff = i - o;
  if (diff < 0) diff += 24 * 60; // midnight crossing
  return diff;
}

const DELAY_CODES = [
  { code: '00', label: 'No delay' },
  { code: '06', label: 'Late crew' },
  { code: '13', label: 'Late baggage' },
  { code: '21', label: 'Weather' },
  { code: '41', label: 'ATC restriction' },
  { code: '61', label: 'Aircraft maintenance' },
  { code: '93', label: 'Engineering / technical' },
  { code: '99', label: 'Other' },
];

export default function FlightTimesPanel({ flight, compact = false }) {
  const queryClient = useQueryClient();

  const [outTime, setOutTime]   = useState(flight.actual_departure || '');
  const [inTime, setInTime]     = useState(flight.actual_arrival   || '');
  const [delayCode, setDelayCode] = useState('');
  const [saved, setSaved]       = useState(false);

  const blockMin = calcBlockMinutes(outTime, inTime);
  const scheduledBlock = calcBlockMinutes(flight.scheduled_departure, flight.scheduled_arrival);

  // Derive delay from OUT vs STD
  const stdMin = toMinutes(flight.scheduled_departure);
  const outMin = toMinutes(outTime);
  const derivedDelayMin = (stdMin != null && outMin != null && outMin > stdMin)
    ? outMin - stdMin
    : 0;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Flight.update(flight.id, data),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      queryClient.invalidateQueries({ queryKey: ['fc-flights'] });
      queryClient.invalidateQueries({ queryKey: ['efb-flights'] });
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      queryClient.invalidateQueries({ queryKey: ['cc-flights'] });
    },
  });

  const save = () => {
    const updates = {};
    if (outTime) updates.actual_departure = outTime;
    if (inTime)  updates.actual_arrival   = inTime;

    // Auto-set status based on times
    if (inTime) {
      updates.status = 'arrived';
    } else if (outTime) {
      updates.status = 'airborne';
    }

    // Auto-propagate delay
    if (derivedDelayMin > 0) {
      updates.delay_minutes = derivedDelayMin;
      if (delayCode && delayCode !== '00') {
        const dc = DELAY_CODES.find(d => d.code === delayCode);
        if (dc) updates.delay_reason = `[${dc.code}] ${dc.label}`;
      }
    } else {
      updates.delay_minutes = 0;
    }

    updateMutation.mutate(updates);
  };

  if (compact) {
    // Compact inline version for EFB overview
    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-secondary/50 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            {flight.flight_number} · OUT / IN Times
          </p>
          {blockMin != null && (
            <span className="ml-auto text-xs font-mono font-bold text-primary">
              BLK {fromMinutes(blockMin)}
            </span>
          )}
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1 mb-1">
              <LogOut className="w-3 h-3" /> OUT (Actual)
            </label>
            <input type="time" value={outTime} onChange={e => setOutTime(e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-[10px] text-muted-foreground mt-0.5">STD {flight.scheduled_departure || '--:--'}</p>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1 mb-1">
              <LogIn className="w-3 h-3" /> IN (Actual)
            </label>
            <input type="time" value={inTime} onChange={e => setInTime(e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <p className="text-[10px] text-muted-foreground mt-0.5">STA {flight.scheduled_arrival || '--:--'}</p>
          </div>
        </div>
        <div className="px-3 pb-3">
          <button onClick={save} disabled={updateMutation.isPending}
            className="w-full h-8 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</> : updateMutation.isPending ? 'Saving…' : 'Save Times'}
          </button>
        </div>
      </div>
    );
  }

  // Full version for FlightCrewDashboard → Timeline tab
  return (
    <div className="space-y-4">
      {/* OUT / IN inputs */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/50 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            Actual OUT / IN Times
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* OUT time */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <LogOut className="w-3.5 h-3.5 text-orange-400" /> OUT Time
              </label>
              <input type="time" value={outTime} onChange={e => setOutTime(e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-xl px-3 text-base font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">STD: {flight.scheduled_departure || '--:--'} Z</span>
                {derivedDelayMin > 0 && (
                  <span className="text-[10px] font-bold text-orange-400">+{derivedDelayMin} min delay</span>
                )}
              </div>
            </div>

            {/* IN time */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <LogIn className="w-3.5 h-3.5 text-green-400" /> IN Time
              </label>
              <input type="time" value={inTime} onChange={e => setInTime(e.target.value)}
                className="w-full h-11 bg-secondary border border-border rounded-xl px-3 text-base font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">STA: {flight.scheduled_arrival || '--:--'} Z</span>
              </div>
            </div>
          </div>

          {/* Block time summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-background/40 rounded-lg px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Block Time</p>
              <p className={cn('text-lg font-extrabold font-mono', blockMin != null ? 'text-primary' : 'text-muted-foreground')}>
                {blockMin != null ? fromMinutes(blockMin) : '--:--'}
              </p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Sched Block</p>
              <p className="text-lg font-extrabold font-mono text-muted-foreground">
                {scheduledBlock != null ? fromMinutes(scheduledBlock) : '--:--'}
              </p>
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Delay</p>
              <p className={cn('text-lg font-extrabold font-mono', derivedDelayMin > 0 ? 'text-orange-400' : 'text-green-400')}>
                {derivedDelayMin > 0 ? `+${derivedDelayMin}m` : 'None'}
              </p>
            </div>
          </div>

          {/* Delay code — only show if delay detected */}
          {derivedDelayMin > 0 && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> Delay Code
              </label>
              <select value={delayCode} onChange={e => setDelayCode(e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select delay code…</option>
                {DELAY_CODES.filter(d => d.code !== '00').map(d => (
                  <option key={d.code} value={d.code}>[{d.code}] {d.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status preview */}
          {(outTime || inTime) && (
            <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2">
              <Plane className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">
                Status will update to{' '}
                <span className={cn('font-bold', inTime ? 'text-green-400' : 'text-blue-400')}>
                  {inTime ? 'ARRIVED' : 'AIRBORNE'}
                </span>
                {' '}on save
              </p>
            </div>
          )}

          <button onClick={save} disabled={updateMutation.isPending || (!outTime && !inTime)}
            className="w-full h-10 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {saved
              ? <><CheckCircle className="w-4 h-4" /> Times Saved — Propagating to OpsCenter & Logbook</>
              : updateMutation.isPending
              ? 'Saving…'
              : <><Timer className="w-4 h-4" /> Save OUT / IN Times</>
            }
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            Times auto-propagate to OpsCenter, Crew Control, and TechOps Logbook
          </p>
        </div>
      </div>
    </div>
  );
}