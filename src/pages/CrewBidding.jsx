import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarCheck, RefreshCw, Plus, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BID_MONTH = new Date().toISOString().slice(0, 7);

const PAIRINGS = [
  { id: 'P001', desc: 'KEWR-KORD-KEWR 3-day | Mon/Thu/Sat', days: 3, credit: 18.5 },
  { id: 'P002', desc: 'KJFK-KLAX-KJFK 4-day | Tue/Fri', days: 4, credit: 22.0 },
  { id: 'P003', desc: 'KEWR-KORD-KDFW-KEWR 3-day | Wed/Sat', days: 3, credit: 16.0 },
  { id: 'P004', desc: 'KEWR-KSEA-KEWR 2-day | Daily', days: 2, credit: 14.5 },
  { id: 'P005', desc: 'KJFK-KMIA-KJFK 1-day | Daily', days: 1, credit: 8.0 },
  { id: 'P006', desc: 'KEWR-KATL-KEWR 2-day | Mon/Wed/Fri', days: 2, credit: 12.5 },
];

const STATUS_CFG = {
  draft:     { label: 'Draft',     color: 'text-muted-foreground', bg: 'bg-muted' },
  submitted: { label: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  awarded:   { label: 'Awarded',   color: 'text-green-400', bg: 'bg-green-500/15' },
  modified:  { label: 'Modified',  color: 'text-orange-400', bg: 'bg-orange-500/15' },
};

function BidForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    crew_name: '', employee_id: '', role: 'captain', seniority_number: '',
    bid_preferences: [], bid_month: BID_MONTH,
  });
  const [prefs, setPrefs] = useState([]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const togglePairing = (pairing) => {
    if (prefs.find(p => p.pairing_id === pairing.id)) {
      setPrefs(prev => prev.filter(p => p.pairing_id !== pairing.id));
    } else if (prefs.length < 5) {
      setPrefs(prev => [...prev, { rank: prev.length + 1, pairing_id: pairing.id, pairing_description: pairing.desc }]);
    }
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const newPrefs = [...prefs];
    [newPrefs[idx - 1], newPrefs[idx]] = [newPrefs[idx], newPrefs[idx - 1]];
    setPrefs(newPrefs.map((p, i) => ({ ...p, rank: i + 1 })));
  };

  const handleSubmit = () => {
    onSave({ ...form, bid_preferences: prefs, bid_status: 'submitted' });
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-4">
      <p className="text-sm font-bold text-foreground">Submit Monthly Bid — {BID_MONTH}</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'crew_name', label: 'Full Name' },
          { key: 'employee_id', label: 'Employee ID' },
          { key: 'seniority_number', label: 'Seniority #' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground">{label}</label>
            <input value={form[key] || ''} onChange={e => set(key, e.target.value)}
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
          </select>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Pairings (up to 5, in preference order)</p>
        <div className="space-y-2">
          {PAIRINGS.map(p => {
            const prefIdx = prefs.findIndex(pr => pr.pairing_id === p.id);
            const selected = prefIdx !== -1;
            return (
              <div key={p.id}
                className={cn('flex items-center justify-between rounded-lg px-3 py-2.5 border cursor-pointer transition-all',
                  selected ? 'bg-primary/15 border-primary/40' : 'bg-secondary/40 border-border hover:border-primary/30')}
                onClick={() => togglePairing(p)}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    {selected ? prefIdx + 1 : '·'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{p.id}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-primary">{p.credit}h</p>
                  <p className="text-xs text-muted-foreground">{p.days}-day</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {prefs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Bid Order</p>
          <div className="space-y-1">
            {prefs.map((p, i) => (
              <div key={p.pairing_id} className="flex items-center gap-3 bg-secondary/40 rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-primary w-4">{i + 1}</span>
                <span className="text-xs text-foreground flex-1">{p.pairing_description}</span>
                {i > 0 && (
                  <button onClick={() => moveUp(i)} className="text-xs text-muted-foreground hover:text-primary transition-colors">↑</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={!form.crew_name || prefs.length === 0}
          className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">
          Submit Bid
        </button>
        <button onClick={onCancel} className="flex-1 h-10 border border-border text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function CrewBidding() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: bids = [], refetch } = useQuery({
    queryKey: ['crew-bids', BID_MONTH],
    queryFn: () => base44.entities.CrewBid.filter({ bid_month: BID_MONTH }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CrewBid.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crew-bids'] }); setShowForm(false); },
  });

  const awardMutation = useMutation({
    mutationFn: ({ id, pairing }) => base44.entities.CrewBid.update(id, { bid_status: 'awarded', awarded_pairing: pairing }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crew-bids'] }),
  });

  const stats = {
    total: bids.length,
    submitted: bids.filter(b => b.bid_status === 'submitted' || b.bid_status === 'awarded').length,
    awarded: bids.filter(b => b.bid_status === 'awarded').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">CREW BIDDING</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Monthly Pairings · Bid Awards · {BID_MONTH}</p>
            </div>
          </div>
          <button onClick={refetch} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Bids</p>
            <p className="text-2xl font-extrabold font-mono text-primary">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Submitted</p>
            <p className="text-2xl font-extrabold font-mono text-blue-400">{stats.submitted}</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Awarded</p>
            <p className="text-2xl font-extrabold font-mono text-green-400">{stats.awarded}</p>
          </div>
        </div>

        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary/15 text-primary border border-primary/30 rounded-xl text-sm font-bold hover:bg-primary/25 transition-colors">
          <Plus className="w-4 h-4" /> Submit Bid
        </button>

        {showForm && <BidForm onSave={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}

        <div className="space-y-2">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Bids — {BID_MONTH}</p>
          {bids.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No bids submitted for {BID_MONTH} yet
            </div>
          ) : (
            bids.map(bid => {
              const cfg = STATUS_CFG[bid.bid_status] || STATUS_CFG.draft;
              return (
                <div key={bid.id} className="rounded-xl bg-card border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{bid.crew_name}</p>
                      <p className="text-xs text-muted-foreground">{bid.role} · Sen #{bid.seniority_number || '—'} · {bid.employee_id}</p>
                    </div>
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
                  </div>
                  {bid.bid_preferences?.length > 0 && (
                    <div className="space-y-1">
                      {bid.bid_preferences.map(p => (
                        <div key={p.pairing_id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-bold text-primary w-4">{p.rank}.</span>
                          <span>{p.pairing_id} — {p.pairing_description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {bid.awarded_pairing && (
                    <div className="mt-2 flex items-center gap-2 bg-green-500/10 rounded-lg px-3 py-1.5">
                      <Award className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs font-bold text-green-400">Awarded: {bid.awarded_pairing}</span>
                    </div>
                  )}
                  {bid.bid_status === 'submitted' && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {bid.bid_preferences?.map(p => (
                        <button key={p.pairing_id}
                          onClick={() => awardMutation.mutate({ id: bid.id, pairing: p.pairing_id })}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">
                          Award {p.pairing_id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}