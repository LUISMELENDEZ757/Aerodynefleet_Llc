import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Plus, AlertTriangle, CheckCircle, Mail, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

function SupervisorHandoverForm({ onSubmit, onCancel, isPending }) {
  const [form, setForm] = useState({
    shift_date: new Date().toISOString().split('T')[0],
    shift_period: 'afternoon',
    submitted_by: '',
    submitted_by_cert: '',
    progress_summary: '',
    pending_issues: [],
    safety_critical_notes: '',
    notes: '',
  });

  const [newIssue, setNewIssue] = useState({ description: '', priority: 'medium', assigned_to: '' });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addIssue = () => {
    if (newIssue.description.trim()) {
      set('pending_issues', [...form.pending_issues, newIssue]);
      setNewIssue({ description: '', priority: 'medium', assigned_to: '' });
    }
  };

  const removeIssue = (idx) => {
    set('pending_issues', form.pending_issues.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!form.submitted_by || !form.progress_summary) return;
    onSubmit({
      ...form,
      shift_end_time: new Date().toISOString(),
      status: 'submitted',
    });
  };

  const criticalCount = form.pending_issues.filter(i => i.priority === 'critical').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 flex justify-center items-start overflow-y-auto pt-8">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-10 bg-card">
          <p className="text-base font-bold text-foreground">Supervisor Shift Turn Over</p>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Shift Date</label>
              <input type="date" value={form.shift_date} onChange={e => set('shift_date', e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Shift Period</label>
              <select value={form.shift_period} onChange={e => set('shift_period', e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Supervisor Name</label>
              <input type="text" value={form.submitted_by} onChange={e => set('submitted_by', e.target.value)} placeholder="Full name" className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Cert/License #</label>
            <input type="text" value={form.submitted_by_cert} onChange={e => set('submitted_by_cert', e.target.value)} placeholder="e.g. A&P-12345" className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Shift Summary *</label>
            <textarea rows={3} value={form.progress_summary} onChange={e => set('progress_summary', e.target.value)} placeholder="Summarize shift activities, completions, and key events..." className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">⚠️ Safety Critical Notes</label>
            <textarea rows={2} value={form.safety_critical_notes} onChange={e => set('safety_critical_notes', e.target.value)} placeholder="Hazards, hazmat conditions, or critical safety issues..." className="w-full bg-red-950/20 border border-red-500/30 rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-red-400 resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Critical Issues</label>
            <div className="space-y-2 mb-3">
              {form.pending_issues.map((issue, idx) => (
                <div key={idx} className="bg-secondary rounded-xl p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                        issue.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        issue.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        issue.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      )}>{issue.priority}</span>
                    </div>
                    <p className="text-sm text-foreground">{issue.description}</p>
                    {issue.assigned_to && <p className="text-xs text-muted-foreground mt-1">→ {issue.assigned_to}</p>}
                  </div>
                  <button onClick={() => removeIssue(idx)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-secondary rounded-xl p-3 space-y-2">
              <input type="text" value={newIssue.description} onChange={e => setNewIssue(p => ({ ...p, description: e.target.value }))} placeholder="Issue description" className="w-full bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-2">
                <select value={newIssue.priority} onChange={e => setNewIssue(p => ({ ...p, priority: e.target.value }))} className="bg-background border border-border rounded-lg px-2 py-2 text-xs text-foreground outline-none focus:border-primary">
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <input type="text" value={newIssue.assigned_to} onChange={e => setNewIssue(p => ({ ...p, assigned_to: e.target.value }))} placeholder="Assign to..." className="bg-background border border-border rounded-lg px-2 py-2 text-xs text-foreground outline-none focus:border-primary" />
              </div>
              <button onClick={addIssue} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> Add Issue
              </button>
            </div>
          </div>



          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">Additional Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Team observations, recommendations..." className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-bold hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isPending || !form.submitted_by || !form.progress_summary} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupervisorHandoverCard({ handover }) {
  const criticalIssues = handover.pending_issues?.filter(i => i.priority === 'critical') || [];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-bold text-foreground">{handover.submitted_by}</p>
            <span className="text-xs text-muted-foreground font-mono">{handover.submitted_by_cert}</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded',
              handover.status === 'submitted' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
            )}>
              {handover.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(handover.shift_end_time).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-foreground">{handover.shift_period}</p>
          <p className="text-xs text-muted-foreground">{handover.shift_date}</p>
        </div>
      </div>

      <p className="text-sm text-foreground line-clamp-2">{handover.progress_summary}</p>

      {handover.safety_critical_notes && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 font-bold">{handover.safety_critical_notes}</p>
        </div>
      )}

      {criticalIssues.length > 0 && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          <p className="text-xs font-bold text-orange-400">{criticalIssues.length} critical</p>
        </div>
      )}
    </div>
  );
}

export default function SupervisorHandoverModule() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: handovers = [], isLoading } = useQuery({
    queryKey: ['supervisor-handovers'],
    queryFn: () => base44.entities.ShiftHandover.list('-created_date', 10),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftHandover.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisor-handovers'] });
      setShowForm(false);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Supervisor Shift Turn Over</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> New Shift Turnover
        </button>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground text-center py-6">Loading handovers…</div>
      ) : handovers.length === 0 ? (
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No supervisor handovers yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {handovers.map(h => <SupervisorHandoverCard key={h.id} handover={h} />)}
        </div>
      )}

      {showForm && (
        <SupervisorHandoverForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}
    </div>
  );
}