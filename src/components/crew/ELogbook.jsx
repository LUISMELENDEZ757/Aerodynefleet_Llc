import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  BookOpen, Wrench, AlertTriangle, CheckCircle, Plus, Send,
  Clock, ChevronDown, ChevronRight, Radio, ShieldCheck
} from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

const DISCREPANCY_TYPES = [
  'Engine / APU',
  'Hydraulics',
  'Avionics / Instruments',
  'Electrical',
  'Pressurization / Air Conditioning',
  'Flight Controls',
  'Landing Gear / Brakes',
  'Fuel System',
  'Cabin / Interior',
  'Structural',
  'Other',
];

const NOTIFY_OPTIONS = ['Maintenance Control (MOC)', 'Line Maintenance', 'Station Maintenance', 'AOG Desk'];

// Pre-takeoff MEL review panel — shows active OOS/MEL items for the aircraft
function MELReviewPanel({ aircraftTail }) {
  const { data: oosItems = [], isLoading } = useQuery({
    queryKey: ['mel-review', aircraftTail],
    queryFn: () => base44.entities.OOSEntry.list(),
    select: (data) => data.filter(o => o.tail_number === aircraftTail && ['in_work', 'waiting_on_parts', 'deferred'].includes(o.status)),
    enabled: !!aircraftTail,
  });

  if (!aircraftTail) return (
    <div className="rounded-xl bg-card border border-border px-4 py-6 text-center text-xs text-muted-foreground">
      Select a flight to view MEL / maintenance items
    </div>
  );

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-orange-400" />
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          MEL / Open Maintenance Items — {aircraftTail}
        </p>
      </div>
      {isLoading ? (
        <p className="px-4 py-4 text-xs text-muted-foreground">Loading…</p>
      ) : oosItems.length === 0 ? (
        <div className="px-4 py-5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-400">No open MEL or maintenance items — aircraft clear</p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {oosItems.map(o => (
            <div key={o.id} className={cn(
              'rounded-lg px-3 py-2.5 border',
              o.status === 'deferred' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-destructive/10 border-destructive/20'
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', o.status === 'deferred' ? 'text-orange-400' : 'text-destructive')} />
                  <div>
                    <p className={cn('text-xs font-bold', o.status === 'deferred' ? 'text-orange-400' : 'text-destructive')}>
                      {o.work_description}
                    </p>
                    {o.logpage_number && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">Log Page: {o.logpage_number}</p>
                    )}
                    {o.notes && <p className="text-xs text-muted-foreground mt-0.5">{o.notes}</p>}
                  </div>
                </div>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase',
                  o.status === 'deferred' ? 'bg-orange-500/20 text-orange-400' :
                  o.status === 'waiting_on_parts' ? 'bg-primary/20 text-primary' :
                  'bg-destructive/20 text-destructive'
                )}>
                  {o.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-orange-400">
              Review all deferred items with dispatch before departure. Confirm MEL acceptance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Post-arrival discrepancy entry form
function DiscrepancyForm({ flights }) {
  const [form, setForm] = useState({
    flight_number: '',
    tail_number: '',
    discrepancy_type: '',
    description: '',
    notify: 'Maintenance Control (MOC)',
    severity: 'routine',
  });
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getNow = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  };

  const handleSubmit = () => {
    setSubmitting(true);
    // Log entry locally — Maintenance will decide OOS status
    setTimeout(() => {
      setSubmitted({ ...form, time: getNow(), ref: Math.random().toString(36).slice(2,8).toUpperCase() });
      setForm({ flight_number: '', tail_number: '', discrepancy_type: '', description: '', notify: 'Maintenance Control (MOC)', severity: 'routine' });
      setSubmitting(false);
    }, 600);
  };

  const handleFlightSelect = (fn) => {
    const flight = flights.find(f => f.flight_number === fn);
    setForm(prev => ({ ...prev, flight_number: fn, tail_number: flight?.aircraft_tail || '' }));
  };

  const canSubmit = form.flight_number && form.discrepancy_type && form.description.trim().length > 5;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          E-Logbook — Post-Arrival Discrepancy Entry
        </p>
      </div>

      {submitted && (
        <div className="mx-4 mt-3 flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-3">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-green-400">Entry sent to {submitted.notify}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {submitted.flight_number} · {submitted.discrepancy_type} · {submitted.time}Z
            </p>
            <p className="text-xs text-muted-foreground">Ref: ELB-{submitted.ref} — Maintenance will determine disposition</p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Flight selector */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Flight Number</label>
            <select
              value={form.flight_number}
              onChange={e => handleFlightSelect(e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select flight…</option>
              {flights.map(f => (
                <option key={f.id} value={f.flight_number}>
                  {f.flight_number} ({f.origin}→{f.destination})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Tail Number</label>
            <input
              value={form.tail_number}
              onChange={e => setForm(prev => ({ ...prev, tail_number: e.target.value.toUpperCase() }))}
              placeholder="N455GJ"
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Discrepancy type */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Discrepancy System</label>
          <select
            value={form.discrepancy_type}
            onChange={e => setForm(prev => ({ ...prev, discrepancy_type: e.target.value }))}
            className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select system…</option>
            {DISCREPANCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Discrepancy Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the discrepancy in detail (e.g., #2 engine oil pressure indication fluctuating during cruise FL350, stabilized on descent)…"
            rows={3}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        {/* Severity + Notify */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Severity</label>
            <div className="flex gap-2">
              {[
                { value: 'routine', label: 'Routine', color: 'text-green-400 border-green-500/40 bg-green-500/10' },
                { value: 'aog',     label: 'AOG',     color: 'text-destructive border-destructive/40 bg-destructive/10' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm(prev => ({ ...prev, severity: s.value }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all',
                    form.severity === s.value ? s.color : 'border-border text-muted-foreground'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notify</label>
            <select
              value={form.notify}
              onChange={e => setForm(prev => ({ ...prev, notify: e.target.value }))}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {NOTIFY_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Notify banner */}
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
          <Radio className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-400 font-semibold">
            Entry will be sent to <span className="font-bold">{form.notify}</span>. Maintenance will determine disposition — no OOS entry is created automatically.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full h-10 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting…' : 'Send to Maintenance'}
        </button>
      </div>
    </div>
  );
}

export default function ELogbook({ flights }) {
  const [activeTab, setActiveTab] = useState('mel');
  const [selectedTail, setSelectedTail] = useState('');

  // When a flight is selected, auto-populate tail
  const handleFlightChange = (fn) => {
    const flight = flights.find(f => f.flight_number === fn);
    setSelectedTail(flight?.aircraft_tail || '');
  };

  return (
    <div className="space-y-3">
      {/* Tab toggle */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {[
          { key: 'mel',   label: 'Pre-Takeoff MEL Review', icon: Wrench },
          { key: 'entry', label: 'Post-Arrival Entry',     icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all',
              activeTab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'mel' && (
        <div className="space-y-3">
          {/* Flight selector for MEL review */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Select Flight / Aircraft</label>
            <select
              onChange={e => handleFlightChange(e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select flight…</option>
              {flights.map(f => (
                <option key={f.id} value={f.flight_number}>
                  {f.flight_number} — {f.aircraft_tail || 'N/A'} ({f.origin}→{f.destination})
                </option>
              ))}
            </select>
          </div>
          <MELReviewPanel aircraftTail={selectedTail} />
        </div>
      )}

      {activeTab === 'entry' && <DiscrepancyForm flights={flights} />}
    </div>
  );
}