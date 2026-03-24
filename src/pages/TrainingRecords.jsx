import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, RefreshCw, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

const TODAY = new Date().toISOString().split('T')[0];

const TRAINING_TYPES = ['initial','recurrent','upgrade','special','sim_check','line_check','emergency','security'];
const STATUS_CFG = {
  current:       { label: 'Current',       color: 'text-green-400',   bg: 'bg-green-500/15' },
  expiring_soon: { label: 'Expiring Soon', color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  expired:       { label: 'EXPIRED',       color: 'text-destructive', bg: 'bg-destructive/15' },
  in_progress:   { label: 'In Progress',   color: 'text-blue-400',    bg: 'bg-blue-500/15' },
};

function computeStatus(r) {
  if (!r.expiry_date) return r.status || 'current';
  const days = differenceInDays(parseISO(r.expiry_date), new Date());
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'current';
}

function NewTrainingModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    crew_name: '', employee_id: '', role: 'captain', aircraft_type: 'B737-800',
    training_type: 'recurrent', training_name: '', completed_date: TODAY,
    expiry_date: '', instructor: '', sim_device: '', grade: 'satisfactory', notes: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <p className="text-sm font-bold text-foreground">Log Training Record</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'crew_name', label: 'Crew Name' },
            { key: 'employee_id', label: 'Employee ID' },
            { key: 'training_name', label: 'Training Name' },
            { key: 'instructor', label: 'Instructor' },
            { key: 'sim_device', label: 'Sim Device' },
            { key: 'completed_date', label: 'Completed', type: 'date' },
            { key: 'expiry_date', label: 'Expires', type: 'date' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type={type || 'text'} value={form[key] || ''} onChange={e => set(key, e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              <option value="captain">Captain</option>
              <option value="first_officer">First Officer</option>
              <option value="flight_attendant">Flight Attendant</option>
              <option value="dispatcher">Dispatcher</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Training Type</label>
            <select value={form.training_type} onChange={e => set('training_type', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              {TRAINING_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Grade</label>
            <select value={form.grade} onChange={e => set('grade', e.target.value)}
              className="w-full h-9 bg-secondary border border-border rounded-lg px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1">
              <option value="satisfactory">Satisfactory</option>
              <option value="outstanding">Outstanding</option>
              <option value="needs_improvement">Needs Improvement</option>
              <option value="unsatisfactory">Unsatisfactory</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1 resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave({ ...form, status: computeStatus(form) })} disabled={!form.crew_name || !form.training_name}
            className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">
            Save Record
          </button>
          <button onClick={onClose} className="flex-1 h-10 border border-border text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrainingRecords() {
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const qc = useQueryClient();

  const { data: records = [], refetch } = useQuery({
    queryKey: ['training-records'],
    queryFn: () => base44.entities.TrainingRecord.list('-completed_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingRecord.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-records'] }); setShowNew(false); },
  });

  const enriched = records.map(r => ({ ...r, computedStatus: computeStatus(r) }));
  const expired = enriched.filter(r => r.computedStatus === 'expired').length;
  const expiring = enriched.filter(r => r.computedStatus === 'expiring_soon').length;

  const filtered = enriched.filter(r => {
    const matchRole = roleFilter === 'all' || r.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.crew_name?.toLowerCase().includes(q) || r.training_name?.toLowerCase().includes(q) || r.employee_id?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <GraduationCap className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">TRAINING RECORDS</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Recurrency · Sim Checks · Currency Expiry</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={refetch} className="text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Log
            </button>
          </div>
        </div>
        {(expired > 0 || expiring > 0) && (
          <div className={cn('mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
            expired > 0 ? 'bg-destructive/15 text-destructive border border-destructive/30' : 'bg-orange-500/15 text-orange-400 border border-orange-500/30')}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {expired > 0 ? `${expired} training item${expired > 1 ? 's' : ''} EXPIRED — crew may not be legal to fly` : `${expiring} item${expiring > 1 ? 's' : ''} expiring within 30 days`}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Records', value: records.length, color: 'text-primary' },
            { label: 'Current', value: enriched.filter(r => r.computedStatus === 'current').length, color: 'text-green-400' },
            { label: 'Expiring', value: expiring, color: expiring > 0 ? 'text-orange-400' : 'text-muted-foreground' },
            { label: 'Expired', value: expired, color: expired > 0 ? 'text-destructive' : 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-card border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crew, training..."
              className="w-full h-10 bg-card border border-border rounded-xl pl-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="h-10 bg-card border border-border rounded-xl px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="all">All Roles</option>
            <option value="captain">Captain</option>
            <option value="first_officer">F/O</option>
            <option value="flight_attendant">F/A</option>
            <option value="dispatcher">Dispatcher</option>
          </select>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No training records found. Click "Log" to add one.
            </div>
          ) : (
            filtered.map(r => {
              const st = STATUS_CFG[r.computedStatus] || STATUS_CFG.current;
              const days = r.expiry_date ? differenceInDays(parseISO(r.expiry_date), new Date()) : null;
              return (
                <div key={r.id} className={cn('rounded-xl bg-card border overflow-hidden',
                  r.computedStatus === 'expired' ? 'border-destructive/40' :
                  r.computedStatus === 'expiring_soon' ? 'border-orange-500/40' : 'border-border')}>
                  <div className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', st.bg, st.color)}>{st.label}</span>
                        <span className="text-xs text-muted-foreground capitalize">{r.training_type?.replace('_', ' ')}</span>
                        {r.grade && <span className={cn('text-xs font-semibold',
                          r.grade === 'satisfactory' || r.grade === 'outstanding' ? 'text-green-400' : 'text-orange-400')}>
                          {r.grade.replace('_', ' ')}
                        </span>}
                      </div>
                      <p className="text-sm font-bold text-foreground">{r.crew_name}</p>
                      <p className="text-xs text-muted-foreground">{r.training_name} {r.aircraft_type ? `· ${r.aircraft_type}` : ''} {r.role ? `· ${r.role}` : ''}</p>
                      {r.instructor && <p className="text-xs text-muted-foreground">Instructor: {r.instructor}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {days !== null && (
                        <p className={cn('text-sm font-extrabold font-mono',
                          days < 0 ? 'text-destructive' : days <= 30 ? 'text-orange-400' : 'text-green-400')}>
                          {days < 0 ? `${Math.abs(days)}d over` : `${days}d left`}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">{r.completed_date}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showNew && <NewTrainingModal onSave={(d) => createMutation.mutate(d)} onClose={() => setShowNew(false)} />}
    </div>
  );
}