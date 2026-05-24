import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Plus, Globe, Shield, CheckCircle, AlertTriangle,
  X, Edit2, Trash2, Activity, Plane, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RATINGS = [75, 90, 120, 138, 180, 207, 240, 330, 370];
const AUTHORITIES = ['FAA', 'EASA', 'ANAC', 'TCCA', 'CASA', 'DGCA', 'CAAC', 'OTHER'];
const PROGRAM_STATUSES = ['active', 'suspended', 'intro_phase', 'not_enrolled'];

const RATING_CFG = {
  370: { color: 'text-cyan-300',   bg: 'bg-cyan-500/15',   border: 'border-cyan-500/40' },
  330: { color: 'text-blue-300',   bg: 'bg-blue-500/15',   border: 'border-blue-500/40' },
  240: { color: 'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-500/40' },
  207: { color: 'text-indigo-300', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40' },
  180: { color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/40' },
  138: { color: 'text-green-300',  bg: 'bg-green-500/15',  border: 'border-green-500/40' },
  120: { color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40' },
  90:  { color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40' },
  75:  { color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40' },
};

const PROG_CFG = {
  active:      { color: 'text-green-400',  bg: 'bg-green-500/15',  label: 'ACTIVE' },
  suspended:   { color: 'text-red-400',    bg: 'bg-red-500/15',    label: 'SUSPENDED' },
  intro_phase: { color: 'text-amber-400',  bg: 'bg-amber-500/15',  label: 'INTRO PHASE' },
  not_enrolled:{ color: 'text-gray-400',   bg: 'bg-gray-500/15',   label: 'NOT ENROLLED' },
};

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profiles', label: '📋 ETOPS Profiles' },
  { id: 'tails',    label: '✈️ Tail Programs' },
  { id: 'routes',   label: '🗺️ Routes' },
  { id: 'dispatch', label: '⚡ Dispatch Check' },
];

// ── Profile Form Modal ────────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, onSave, isPending }) {
  const [form, setForm] = useState(profile || {
    profile_name: '',
    etops_rating: 180,
    authority: 'FAA',
    applicable_aircraft_types: [],
    fire_suppression_time_limit_min: null,
    min_alternates_required: 1,
    fuel_policy: '',
    special_notes: '',
    status: 'active',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [typeInput, setTypeInput] = useState('');

  const addType = () => {
    if (!typeInput.trim()) return;
    set('applicable_aircraft_types', [...(form.applicable_aircraft_types || []), typeInput.trim()]);
    setTypeInput('');
  };

  const removeType = (t) => set('applicable_aircraft_types', (form.applicable_aircraft_types || []).filter(x => x !== t));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <p className="text-sm font-extrabold text-foreground">{profile ? 'Edit ETOPS Profile' : 'New ETOPS Profile'}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Profile Name *</label>
              <input value={form.profile_name} onChange={e => set('profile_name', e.target.value)}
                placeholder="e.g. A320_ETOPS_180" required
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">ETOPS Rating (min) *</label>
              <select value={form.etops_rating} onChange={e => set('etops_rating', Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                {RATINGS.map(r => <option key={r} value={r}>{r} min</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Authority *</label>
              <select value={form.authority} onChange={e => set('authority', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                {AUTHORITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Applicable Aircraft Types</label>
            <div className="flex gap-2">
              <input value={typeInput} onChange={e => setTypeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addType()}
                placeholder="e.g. A320, B737 MAX 8" 
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
              <button onClick={addType} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">Add</button>
            </div>
            {(form.applicable_aircraft_types || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(form.applicable_aircraft_types || []).map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-bold text-foreground">
                    {t}
                    <button onClick={() => removeType(t)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Fire Suppression Limit (min)</label>
              <input type="number" value={form.fire_suppression_time_limit_min || ''}
                onChange={e => set('fire_suppression_time_limit_min', Number(e.target.value) || null)}
                placeholder="e.g. 180"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Min Alternates Required</label>
              <input type="number" min="1" value={form.min_alternates_required || 1}
                onChange={e => set('min_alternates_required', Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Fuel Policy</label>
            <textarea rows={2} value={form.fuel_policy || ''} onChange={e => set('fuel_policy', e.target.value)}
              placeholder="OEI + depressurization scenario, tankering rules..."
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Special Notes / Requirements</label>
            <textarea rows={2} value={form.special_notes || ''} onChange={e => set('special_notes', e.target.value)}
              placeholder="e.g. APU must be operative; No ETOPS with cargo fire loop inop"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} disabled={!form.profile_name || isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:bg-primary/90">
              {isPending ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tail Program Modal ────────────────────────────────────────────────────────
function TailProgramModal({ program, profiles, onClose, onSave, isPending }) {
  const [form, setForm] = useState(program || {
    aircraft_tail: '',
    aircraft_type: '',
    etops_profile_id: '',
    etops_profile_name: '',
    etops_rating: 0,
    program_status: 'active',
    cumulative_etops_hours: 0,
    ifsd_count: 0,
    diversion_count: 0,
    turnback_count: 0,
    crew_qualified: true,
    dispatcher_qualified: true,
    maintenance_trained: true,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleProfileSelect = (profileId) => {
    const p = profiles.find(x => x.id === profileId);
    if (p) {
      set('etops_profile_id', p.id);
      set('etops_profile_name', p.profile_name);
      set('etops_rating', p.etops_rating);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-extrabold text-foreground">{program ? 'Edit Tail Program' : 'Enroll Tail in ETOPS'}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Tail Number *</label>
              <input value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value)}
                placeholder="e.g. N737AB"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Aircraft Type</label>
              <input value={form.aircraft_type} onChange={e => set('aircraft_type', e.target.value)}
                placeholder="e.g. A320neo"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">ETOPS Profile *</label>
            <select value={form.etops_profile_id} onChange={e => handleProfileSelect(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
              <option value="">Select profile…</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.profile_name} — ETOPS-{p.etops_rating} ({p.authority})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Program Status</label>
            <select value={form.program_status} onChange={e => set('program_status', e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
              {PROGRAM_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">ETOPS Hours</label>
              <input type="number" value={form.cumulative_etops_hours || 0} onChange={e => set('cumulative_etops_hours', Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">IFSDs (12mo)</label>
              <input type="number" value={form.ifsd_count || 0} onChange={e => set('ifsd_count', Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Diversions</label>
              <input type="number" value={form.diversion_count || 0} onChange={e => set('diversion_count', Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Qualifications</p>
            {[
              { key: 'crew_qualified', label: 'Crew ETOPS-Qualified' },
              { key: 'dispatcher_qualified', label: 'Dispatcher ETOPS-Qualified' },
              { key: 'maintenance_trained', label: 'Maintenance ETOPS-Trained' },
            ].map(({ key, label }) => (
              <button key={key} type="button" onClick={() => set(key, !form[key])}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all',
                  form[key] ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-secondary border-border text-muted-foreground')}>
                <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                  form[key] ? 'bg-green-500 border-green-500' : 'border-gray-600')}>
                  {form[key] && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} disabled={!form.aircraft_tail || !form.etops_profile_id || isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Route Modal ───────────────────────────────────────────────────────────────
function RouteModal({ route, onClose, onSave, isPending }) {
  const [form, setForm] = useState(route || {
    route_name: '', origin_icao: '', destination_icao: '',
    required_etops_rating: 180, authority: 'FAA', region: 'NAT',
    approved_alternates: [], status: 'active', notes: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [altInput, setAltInput] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-extrabold text-foreground">{route ? 'Edit Route' : 'New ETOPS Route'}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Route Name *</label>
            <input value={form.route_name} onChange={e => set('route_name', e.target.value)} placeholder="e.g. JFK-LHR"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Origin ICAO</label>
              <input value={form.origin_icao} onChange={e => set('origin_icao', e.target.value.toUpperCase())} placeholder="KJFK"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Destination ICAO</label>
              <input value={form.destination_icao} onChange={e => set('destination_icao', e.target.value.toUpperCase())} placeholder="EGLL"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Required ETOPS Rating *</label>
              <select value={form.required_etops_rating} onChange={e => set('required_etops_rating', Number(e.target.value))}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                {RATINGS.map(r => <option key={r} value={r}>{r} min</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Authority</label>
              <select value={form.authority} onChange={e => set('authority', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
                {AUTHORITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Approved Alternates (ICAO)</label>
            <div className="flex gap-2">
              <input value={altInput} onChange={e => setAltInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter' && altInput.trim()) { set('approved_alternates', [...(form.approved_alternates||[]), altInput.trim()]); setAltInput(''); }}}
                placeholder="e.g. BIKF"
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
              <button onClick={() => { if (altInput.trim()) { set('approved_alternates', [...(form.approved_alternates||[]), altInput.trim()]); setAltInput(''); }}}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">Add</button>
            </div>
            {(form.approved_alternates || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(form.approved_alternates || []).map(a => (
                  <span key={a} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-bold text-foreground">
                    {a}
                    <button onClick={() => set('approved_alternates', form.approved_alternates.filter(x => x !== a))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Notes</label>
            <textarea rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} disabled={!form.route_name || isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
              {isPending ? 'Saving…' : 'Save Route'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dispatch Check ────────────────────────────────────────────────────────────
function DispatchCheck({ profiles, tailPrograms, routes, melItems }) {
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedTail, setSelectedTail] = useState('');

  const route = routes.find(r => r.id === selectedRoute);
  const tailProg = tailPrograms.find(t => t.aircraft_tail === selectedTail || t.id === selectedTail);

  const etopsMels = melItems.filter(m =>
    m.aircraft_tail === tailProg?.aircraft_tail &&
    m.etops_critical === true &&
    m.status !== 'cleared'
  );

  const check = (() => {
    if (!route || !tailProg) return null;
    const issues = [];
    const warnings = [];

    // Program status check
    if (tailProg.program_status === 'suspended') {
      issues.push('ETOPS program is SUSPENDED for this tail');
    }
    if (tailProg.program_status === 'not_enrolled') {
      issues.push('Tail is NOT enrolled in any ETOPS program');
    }

    // Rating check
    if (tailProg.etops_rating < route.required_etops_rating) {
      issues.push(`Profile rating ETOPS-${tailProg.etops_rating} is below route requirement ETOPS-${route.required_etops_rating}`);
    }

    // Qualification checks
    if (!tailProg.crew_qualified) issues.push('Crew are NOT ETOPS-qualified');
    if (!tailProg.dispatcher_qualified) issues.push('Dispatcher is NOT ETOPS-qualified');
    if (!tailProg.maintenance_trained) warnings.push('Maintenance team ETOPS training status not confirmed');

    // MEL checks
    etopsMels.forEach(m => {
      if (m.etops_impact === 'NO_ETOPS') {
        issues.push(`MEL: "${m.description}" — BLOCKS all ETOPS${m.etops_notes ? ` (${m.etops_notes})` : ''}`);
      } else if (m.etops_impact === 'ETOPS_WITH_LIMITS') {
        if (m.etops_limit_rating && m.etops_limit_rating < route.required_etops_rating) {
          issues.push(`MEL: "${m.description}" — limits ETOPS to ${m.etops_limit_rating} min, route requires ${route.required_etops_rating} min`);
        } else {
          warnings.push(`MEL: "${m.description}" — ETOPS with limits${m.etops_notes ? ` (${m.etops_notes})` : ''}`);
        }
      }
    });

    return { pass: issues.length === 0, issues, warnings };
  })();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 px-4 py-3">
        <p className="text-sm font-extrabold text-blue-300">ETOPS Dispatch Executability Check</p>
        <p className="text-xs text-blue-300/70 mt-0.5">
          Type-agnostic: select a route and a tail — the engine checks profile rating, program status, qualifications, and ETOPS-critical MELs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Route</label>
          <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
            <option value="">Select route…</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.route_name} — requires ETOPS-{r.required_etops_rating}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Tail</label>
          <select value={selectedTail} onChange={e => setSelectedTail(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary">
            <option value="">Select tail…</option>
            {tailPrograms.map(t => (
              <option key={t.id} value={t.aircraft_tail}>
                {t.aircraft_tail} — {t.etops_profile_name} (ETOPS-{t.etops_rating}) [{t.program_status}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {check && (
        <div className={cn('rounded-2xl border p-5 space-y-3',
          check.pass ? 'border-green-500/40 bg-green-900/10' : 'border-red-500/50 bg-red-900/10')}>
          <div className="flex items-center gap-3">
            {check.pass
              ? <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
              : <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
            }
            <div>
              <p className={cn('text-lg font-black', check.pass ? 'text-green-400' : 'text-red-400')}>
                {check.pass ? '✅ ETOPS DISPATCH AUTHORIZED' : '🚫 ETOPS DISPATCH BLOCKED'}
              </p>
              <p className="text-xs text-muted-foreground">
                {tailProg?.aircraft_tail} · {tailProg?.etops_profile_name} · Route: {route?.route_name} (requires ETOPS-{route?.required_etops_rating})
              </p>
            </div>
          </div>

          {check.issues.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Blocking Issues</p>
              {check.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-300 bg-red-900/20 border border-red-500/25 rounded-lg px-3 py-2">
                  <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-400" />
                  {issue}
                </div>
              ))}
            </div>
          )}

          {check.warnings.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Warnings</p>
              {check.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-500/25 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!check && (selectedRoute || selectedTail) && (
        <p className="text-center text-sm text-muted-foreground py-6">Select both a route and a tail to run the check.</p>
      )}

      {!selectedRoute && !selectedTail && (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Select a route and tail to check dispatch authorization</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ETOPSProgramAdmin() {
  const [activeTab, setActiveTab] = useState('profiles');
  const [profileModal, setProfileModal] = useState(null);
  const [tailModal, setTailModal] = useState(null);
  const [routeModal, setRouteModal] = useState(null);
  const qc = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ['etops-profiles'],
    queryFn: () => base44.entities.ETOPSProfile.list('-created_date', 200),
  });

  const { data: tailPrograms = [] } = useQuery({
    queryKey: ['etops-tail-programs'],
    queryFn: () => base44.entities.ETOPSTailProgram.list('-created_date', 500),
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['etops-routes'],
    queryFn: () => base44.entities.ETOPSRoute.list('-created_date', 200),
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['fleet-all-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 2000),
    refetchInterval: 120000,
  });

  const saveProfMut = useMutation({
    mutationFn: (data) => data.id ? base44.entities.ETOPSProfile.update(data.id, data) : base44.entities.ETOPSProfile.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['etops-profiles'] }); setProfileModal(null); },
  });

  const delProfMut = useMutation({
    mutationFn: (id) => base44.entities.ETOPSProfile.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['etops-profiles'] }),
  });

  const saveTailMut = useMutation({
    mutationFn: (data) => data.id ? base44.entities.ETOPSTailProgram.update(data.id, data) : base44.entities.ETOPSTailProgram.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['etops-tail-programs'] }); setTailModal(null); },
  });

  const delTailMut = useMutation({
    mutationFn: (id) => base44.entities.ETOPSTailProgram.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['etops-tail-programs'] }),
  });

  const saveRouteMut = useMutation({
    mutationFn: (data) => data.id ? base44.entities.ETOPSRoute.update(data.id, data) : base44.entities.ETOPSRoute.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['etops-routes'] }); setRouteModal(null); },
  });

  const delRouteMut = useMutation({
    mutationFn: (id) => base44.entities.ETOPSRoute.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['etops-routes'] }),
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link to="/ETOPSMonitor" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">ETOPS PROGRAM ADMIN</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Profiles · Tail Programs · Routes · Dispatch Engine</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'profiles' && (
              <button onClick={() => setProfileModal({})} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> New Profile
              </button>
            )}
            {activeTab === 'tails' && (
              <button onClick={() => setTailModal({})} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> Enroll Tail
              </button>
            )}
            {activeTab === 'routes' && (
              <button onClick={() => setRouteModal({})} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> New Route
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn('px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">

        {/* ── Profiles Tab ── */}
        {activeTab === 'profiles' && (
          profiles.length === 0
            ? <div className="text-center py-16 text-muted-foreground"><Globe className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No profiles yet. Create one above.</p></div>
            : profiles.map(p => {
                const cfg = RATING_CFG[p.etops_rating] || RATING_CFG[120];
                return (
                  <div key={p.id} className={cn('rounded-2xl border bg-card p-4 space-y-3', cfg.border)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-foreground">{p.profile_name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.authority} · {(p.applicable_aircraft_types || []).join(', ') || 'All types'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                          ETOPS-{p.etops_rating}
                        </span>
                        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full',
                          p.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
                          {p.status?.toUpperCase()}
                        </span>
                        <button onClick={() => setProfileModal(p)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => delProfMut.mutate(p.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/20">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
                        <p className="text-muted-foreground">Fire Suppression</p>
                        <p className="font-bold text-foreground">{p.fire_suppression_time_limit_min ? `${p.fire_suppression_time_limit_min} min` : '—'}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg px-2 py-1.5">
                        <p className="text-muted-foreground">Min Alternates</p>
                        <p className="font-bold text-foreground">{p.min_alternates_required || 1}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg px-2 py-1.5 col-span-2">
                        <p className="text-muted-foreground">Fuel Policy</p>
                        <p className="font-bold text-foreground truncate">{p.fuel_policy || '—'}</p>
                      </div>
                    </div>
                    {p.special_notes && (
                      <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-300">{p.special_notes}</p>
                      </div>
                    )}
                  </div>
                );
              })
        )}

        {/* ── Tail Programs Tab ── */}
        {activeTab === 'tails' && (
          tailPrograms.length === 0
            ? <div className="text-center py-16 text-muted-foreground"><Plane className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No tails enrolled. Click "Enroll Tail" above.</p></div>
            : tailPrograms.map(t => {
                const progCfg = PROG_CFG[t.program_status] || PROG_CFG.not_enrolled;
                const ratingCfg = RATING_CFG[t.etops_rating] || RATING_CFG[120];
                const tailMels = melItems.filter(m => m.aircraft_tail === t.aircraft_tail && m.etops_critical && m.status !== 'cleared');
                return (
                  <div key={t.id} className={cn('rounded-2xl border bg-card p-4 space-y-3',
                    t.program_status === 'suspended' ? 'border-red-500/50' :
                    t.program_status === 'intro_phase' ? 'border-amber-500/40' :
                    'border-border')}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-primary font-mono">{t.aircraft_tail}</p>
                        <p className="text-[10px] text-muted-foreground">{t.aircraft_type || '—'} · {t.etops_profile_name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', ratingCfg.bg, ratingCfg.color, ratingCfg.border)}>
                          ETOPS-{t.etops_rating}
                        </span>
                        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', progCfg.bg, progCfg.color)}>
                          {progCfg.label}
                        </span>
                        <button onClick={() => setTailModal(t)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => delTailMut.mutate(t.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/20">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="bg-secondary/40 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-muted-foreground">ETOPS Hours</p>
                        <p className="font-black text-foreground text-base">{(t.cumulative_etops_hours || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-muted-foreground">IFSDs (12mo)</p>
                        <p className={cn('font-black text-base', t.ifsd_count > 0 ? 'text-red-400' : 'text-foreground')}>{t.ifsd_count || 0}</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-muted-foreground">Diversions</p>
                        <p className={cn('font-black text-base', t.diversion_count > 0 ? 'text-amber-400' : 'text-foreground')}>{t.diversion_count || 0}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { ok: t.crew_qualified, label: 'Crew' },
                        { ok: t.dispatcher_qualified, label: 'Dispatcher' },
                        { ok: t.maintenance_trained, label: 'MX' },
                      ].map(({ ok, label }) => (
                        <span key={label} className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border',
                          ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400')}>
                          {ok ? '✓' : '✗'} {label}
                        </span>
                      ))}
                      {tailMels.length > 0 && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-400">
                          ⚠ {tailMels.length} ETOPS MEL{tailMels.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
        )}

        {/* ── Routes Tab ── */}
        {activeTab === 'routes' && (
          routes.length === 0
            ? <div className="text-center py-16 text-muted-foreground"><Globe className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No routes defined. Click "New Route" above.</p></div>
            : routes.map(r => {
                const cfg = RATING_CFG[r.required_etops_rating] || RATING_CFG[120];
                return (
                  <div key={r.id} className={cn('rounded-2xl border bg-card p-4 space-y-2', cfg.border)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-extrabold text-foreground">{r.route_name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.origin_icao || '—'} → {r.destination_icao || '—'} · {r.authority} · {r.region || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>
                          Req. ETOPS-{r.required_etops_rating}
                        </span>
                        <button onClick={() => setRouteModal(r)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => delRouteMut.mutate(r.id)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-destructive/20">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    {(r.approved_alternates || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] text-muted-foreground">Alternates:</span>
                        {r.approved_alternates.map(a => (
                          <span key={a} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-foreground">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
        )}

        {/* ── Dispatch Check Tab ── */}
        {activeTab === 'dispatch' && (
          <DispatchCheck profiles={profiles} tailPrograms={tailPrograms} routes={routes} melItems={melItems} />
        )}
      </div>

      {profileModal !== null && (
        <ProfileModal
          profile={profileModal?.id ? profileModal : null}
          onClose={() => setProfileModal(null)}
          onSave={saveProfMut.mutate}
          isPending={saveProfMut.isPending}
        />
      )}
      {tailModal !== null && (
        <TailProgramModal
          program={tailModal?.id ? tailModal : null}
          profiles={profiles}
          onClose={() => setTailModal(null)}
          onSave={saveTailMut.mutate}
          isPending={saveTailMut.isPending}
        />
      )}
      {routeModal !== null && (
        <RouteModal
          route={routeModal?.id ? routeModal : null}
          onClose={() => setRouteModal(null)}
          onSave={saveRouteMut.mutate}
          isPending={saveRouteMut.isPending}
        />
      )}
    </div>
  );
}