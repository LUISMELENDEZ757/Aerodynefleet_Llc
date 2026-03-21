import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { FileText, CheckCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';
import ActionSheet from '@/components/ui/ActionSheet';

const DELAY_CODES = [
  '00 - No delay', '01 - Aircraft damage', '02 - Maintenance', '06 - Late crew',
  '09 - Late fuel', '14 - Passenger late', '19 - Weather', '22 - ATC delay',
  '24 - Airport facilities', '41 - Through flight delay', '93 - Air traffic',
];

const DISCREPANCY_CATEGORIES = ['Avionics', 'Engines', 'Flight Controls', 'Landing Gear', 'Hydraulics', 'Cabin', 'Fuel System', 'Other'];

export default function PostflightReport() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('discrepancy');
  const [submitted, setSubmitted] = useState(false);

  const [discrepancy, setDiscrepancy] = useState({
    flight_number: '', tail_number: '', category: 'Avionics',
    write_up: '', ata_chapter: '', mel_applicable: false, captain_name: '',
  });

  const [delay, setDelay] = useState({
    flight_number: '', delay_minutes: 0, delay_code: '00 - No delay', narrative: '',
  });

  const [safety, setSafety] = useState({
    flight_number: '', event_type: 'near_miss', description: '', action_taken: '', anonymous: false,
  });

  const [fuel, setFuel] = useState({
    flight_number: '', planned_fuel: '', actual_fuel: '', variance: '',
    reason: '', over_under: 'over',
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Simulate submission
      return new Promise(resolve => setTimeout(() => resolve(data), 300));
    },
    onMutate: () => setSubmitted(true),
    onError: () => setSubmitted(false),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['postflight-reports'] }),
  });

  const handleSubmit = () => submitMutation.mutate({ tab, discrepancy, delay, safety, fuel });

  if (submitted) {
    return (
      <div className="rounded-xl bg-card border border-green-500/30 px-6 py-10 text-center space-y-3">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Report Submitted</h3>
        <p className="text-sm text-muted-foreground">Your postflight report has been routed to the appropriate departments.</p>
        <button onClick={() => setSubmitted(false)}
          className="mt-3 px-4 py-2 bg-secondary rounded-lg text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors">
          Submit Another
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'discrepancy', label: 'Discrepancy' },
    { key: 'delay',       label: 'Delay Code' },
    { key: 'safety',      label: 'Safety' },
    { key: 'fuel',        label: 'Fuel Dev.' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex-1 text-xs font-semibold py-2 rounded-lg transition-all',
              tab === t.key ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            )}>{t.label}</button>
        ))}
      </div>

      {/* Discrepancy */}
      {tab === 'discrepancy' && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Flight Discrepancy Report</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Flight Number', key: 'flight_number', ph: 'AAL4474' },
                { label: 'Tail Number', key: 'tail_number', ph: 'N455GJ' },
                { label: 'ATA Chapter', key: 'ata_chapter', ph: '27-00' },
                { label: 'Captain Name', key: 'captain_name', ph: 'Smith, J.' },
              ].map(({ label, key, ph }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input value={discrepancy[key]} onChange={e => setDiscrepancy(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              ))}
            </div>
            <div>
              <ActionSheet
                label="Category"
                value={discrepancy.category}
                onChange={(v) => setDiscrepancy(prev => ({ ...prev, category: v }))}
                options={DISCREPANCY_CATEGORIES.map(c => ({ value: c, label: c }))}
                triggerClassName="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Discrepancy Write-Up *</label>
              <textarea value={discrepancy.write_up} onChange={e => setDiscrepancy(prev => ({ ...prev, write_up: e.target.value }))}
                placeholder="Describe the discrepancy in detail…"
                className="w-full h-28 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={discrepancy.mel_applicable}
                onChange={e => setDiscrepancy(prev => ({ ...prev, mel_applicable: e.target.checked }))}
                className="rounded" />
              <span className="text-xs text-foreground">MEL/CDL Applicable</span>
            </label>
          </div>
        </div>
      )}

      {/* Delay */}
      {tab === 'delay' && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Delay Code Report</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Flight Number</label>
                <input value={delay.flight_number} onChange={e => setDelay(prev => ({ ...prev, flight_number: e.target.value }))}
                  placeholder="AAL4474"
                  className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Delay (minutes)</label>
                <input type="number" value={delay.delay_minutes} onChange={e => setDelay(prev => ({ ...prev, delay_minutes: Number(e.target.value) }))}
                  className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <ActionSheet
                label="Delay Code"
                value={delay.delay_code}
                onChange={(v) => setDelay(prev => ({ ...prev, delay_code: v }))}
                options={DELAY_CODES.map(c => ({ value: c, label: c }))}
                triggerClassName="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Narrative</label>
              <textarea value={delay.narrative} onChange={e => setDelay(prev => ({ ...prev, narrative: e.target.value }))}
                placeholder="Describe the delay circumstances…"
                className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Safety */}
      {tab === 'safety' && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Safety Report (ASR)</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Flight Number</label>
                <input value={safety.flight_number} onChange={e => setSafety(prev => ({ ...prev, flight_number: e.target.value }))}
                  className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <ActionSheet
                  label="Event Type"
                  value={safety.event_type}
                  onChange={(v) => setSafety(prev => ({ ...prev, event_type: v }))}
                  options={[
                    { value: 'near_miss', label: 'Near Miss / NMAC' },
                    { value: 'unstable_apch', label: 'Unstable Approach' },
                    { value: 'tcas_ra', label: 'TCAS RA' },
                    { value: 'go_around', label: 'Go-Around' },
                    { value: 'turbulence', label: 'Turbulence Injury' },
                    { value: 'ground_event', label: 'Ground Event' },
                    { value: 'other', label: 'Other' },
                  ]}
                  triggerClassName="w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Event Description *</label>
              <textarea value={safety.description} onChange={e => setSafety(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the safety event in detail…"
                className="w-full h-28 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Action Taken</label>
              <textarea value={safety.action_taken} onChange={e => setSafety(prev => ({ ...prev, action_taken: e.target.value }))}
                placeholder="What actions were taken?"
                className="w-full h-16 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={safety.anonymous} onChange={e => setSafety(prev => ({ ...prev, anonymous: e.target.checked }))} className="rounded" />
              <span className="text-xs text-foreground">Submit anonymously (ASAP/ASRS protected)</span>
            </label>
          </div>
        </div>
      )}

      {/* Fuel deviation */}
      {tab === 'fuel' && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/60">
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Fuel Deviation Report</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Flight Number', key: 'flight_number', state: fuel, setter: setFuel, ph: 'AAL4474' },
                { label: 'Planned Fuel (lbs)', key: 'planned_fuel', state: fuel, setter: setFuel, ph: '12000' },
                { label: 'Actual Fuel (lbs)', key: 'actual_fuel', state: fuel, setter: setFuel, ph: '11800' },
                { label: 'Variance (lbs)', key: 'variance', state: fuel, setter: setFuel, ph: '200' },
              ].map(({ label, key, ph }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input value={fuel[key]} onChange={e => setFuel(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Over/Under</label>
              <div className="flex gap-2">
                {['over', 'under'].map(v => (
                  <button key={v} onClick={() => setFuel(prev => ({ ...prev, over_under: v }))}
                    className={cn('flex-1 py-2 rounded-lg text-xs font-bold capitalize border transition-all',
                      fuel.over_under === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                    )}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Reason</label>
              <textarea value={fuel.reason} onChange={e => setFuel(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Explain the fuel deviation…"
                className="w-full h-20 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
        </div>
      )}

      <button onClick={handleSubmit}
        className="w-full h-11 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
        <Send className="w-4 h-4" />
        Submit Report
      </button>
    </div>
  );
}