import { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShiftHandoverForm({ initialData = {}, onSubmit, isPending }) {
  const [form, setForm] = useState({
    shift_date: initialData.shift_date || new Date().toISOString().split('T')[0],
    shift_period: initialData.shift_period || 'morning',
    submitted_by: initialData.submitted_by || '',
    submitted_by_cert: initialData.submitted_by_cert || '',
    progress_summary: initialData.progress_summary || '',
    aircraft_worked_on: initialData.aircraft_worked_on || [],
    pending_issues: initialData.pending_issues || [],
    safety_critical_notes: initialData.safety_critical_notes || '',
    parts_consumed: initialData.parts_consumed || '',
    tools_in_use: initialData.tools_in_use || '',
    notes: initialData.notes || '',
  });

  const [newAircraft, setNewAircraft] = useState('');
  const [newIssue, setNewIssue] = useState({ description: '', aircraft_tail: '', priority: 'medium', assigned_to: '' });

  const addAircraft = () => {
    if (newAircraft.trim()) {
      setForm(p => ({
        ...p,
        aircraft_worked_on: [...p.aircraft_worked_on, newAircraft.trim()],
      }));
      setNewAircraft('');
    }
  };

  const removeAircraft = (idx) => {
    setForm(p => ({
      ...p,
      aircraft_worked_on: p.aircraft_worked_on.filter((_, i) => i !== idx),
    }));
  };

  const addIssue = () => {
    if (newIssue.description.trim()) {
      setForm(p => ({
        ...p,
        pending_issues: [...p.pending_issues, { ...newIssue }],
      }));
      setNewIssue({ description: '', aircraft_tail: '', priority: 'medium', assigned_to: '' });
    }
  };

  const removeIssue = (idx) => {
    setForm(p => ({
      ...p,
      pending_issues: p.pending_issues.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.submitted_by.trim() || !form.progress_summary.trim()) {
      alert('Please fill in required fields');
      return;
    }
    onSubmit(form);
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inputCls = 'w-full bg-[#0a0d11] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-primary/40';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Header Section */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-white">Shift Information</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Shift Date</label>
            <input type="date" value={form.shift_date} onChange={e => set('shift_date', e.target.value)}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Shift Period</label>
            <select value={form.shift_period} onChange={e => set('shift_period', e.target.value)} className={inputCls}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="night">Night</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Technician Name *</label>
            <input value={form.submitted_by} onChange={e => set('submitted_by', e.target.value)}
              placeholder="Name" className={inputCls} required />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Cert / License #</label>
          <input value={form.submitted_by_cert} onChange={e => set('submitted_by_cert', e.target.value)}
            placeholder="AMT-XXXXX" className={inputCls} />
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Work Completed Summary *</label>
        <textarea value={form.progress_summary} onChange={e => set('progress_summary', e.target.value)}
          placeholder="Summarize all work completed during this shift..." rows={4}
          className={inputCls + ' resize-none'} required />
      </div>

      {/* Aircraft Worked On */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-white">Aircraft Worked On</h3>
        <div className="flex gap-2">
          <input value={newAircraft} onChange={e => setNewAircraft(e.target.value)}
            placeholder="e.g. N455GJ" className={inputCls}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAircraft())} />
          <button type="button" onClick={addAircraft}
            className="px-4 py-2 rounded-lg bg-primary/20 text-primary font-bold text-sm hover:bg-primary/30">
            Add
          </button>
        </div>
        {form.aircraft_worked_on.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.aircraft_worked_on.map((tail, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <span className="text-sm font-bold text-white">{tail}</span>
                <button type="button" onClick={() => removeAircraft(idx)}
                  className="text-gray-500 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Issues */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-white">Pending Issues & Handover Items</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Issue Description</label>
            <input value={newIssue.description} onChange={e => setNewIssue(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe the issue..." className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft Tail</label>
            <input value={newIssue.aircraft_tail} onChange={e => setNewIssue(p => ({ ...p, aircraft_tail: e.target.value }))}
              placeholder="e.g. N455GJ" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Priority</label>
            <select value={newIssue.priority} onChange={e => setNewIssue(p => ({ ...p, priority: e.target.value }))}
              className={inputCls}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Assigned To (Next Shift)</label>
            <input value={newIssue.assigned_to} onChange={e => setNewIssue(p => ({ ...p, assigned_to: e.target.value }))}
              placeholder="Technician name" className={inputCls} />
          </div>
        </div>

        <button type="button" onClick={addIssue}
          className="px-4 py-2 rounded-lg bg-orange-600/20 text-orange-400 font-bold text-sm hover:bg-orange-600/30 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Pending Issue
        </button>

        {form.pending_issues.length > 0 && (
          <div className="space-y-2">
            {form.pending_issues.map((issue, idx) => (
              <div key={idx} className={cn('bg-white/5 rounded-lg px-4 py-3 border flex items-start justify-between gap-3',
                issue.priority === 'critical' ? 'border-red-500/40' :
                issue.priority === 'high' ? 'border-orange-500/40' :
                'border-white/10'
              )}>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{issue.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {issue.aircraft_tail && <span>✈ {issue.aircraft_tail}</span>}
                    <span className={cn('font-bold',
                      issue.priority === 'critical' ? 'text-red-400' :
                      issue.priority === 'high' ? 'text-orange-400' :
                      'text-gray-400'
                    )}>{issue.priority.toUpperCase()}</span>
                    {issue.assigned_to && <span>→ {issue.assigned_to}</span>}
                  </div>
                </div>
                <button type="button" onClick={() => removeIssue(idx)} className="text-gray-500 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Parts Consumed / Pulled</label>
          <textarea value={form.parts_consumed} onChange={e => set('parts_consumed', e.target.value)}
            placeholder="e.g. 2x CFM oil filter, 1x brake pads..." rows={3}
            className={inputCls + ' resize-none'} />
        </div>

        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Tools in Use / Checked Out</label>
          <textarea value={form.tools_in_use} onChange={e => set('tools_in_use', e.target.value)}
            placeholder="e.g. TRQ-2450, power drill, digital torque meter..." rows={3}
            className={inputCls + ' resize-none'} />
        </div>
      </div>

      {/* Safety & Notes */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <label className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">Safety Critical Notes</label>
            <textarea value={form.safety_critical_notes} onChange={e => set('safety_critical_notes', e.target.value)}
              placeholder="Any safety hazards, AOG risks, or critical alerts for next shift..." rows={3}
              className={inputCls + ' resize-none'} />
          </div>
        </div>
      </div>

      {/* General Notes */}
      <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-5 space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Additional Notes</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any other information for the next shift..." rows={3}
          className={inputCls + ' resize-none'} />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button type="submit" disabled={isPending}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 disabled:opacity-50">
          {isPending ? 'Saving...' : 'Continue to Sign-Off'}
        </button>
      </div>
    </form>
  );
}