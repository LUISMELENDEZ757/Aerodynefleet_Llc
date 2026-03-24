import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Send, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALERT_TYPES = [
  { id: 'flight_status', label: 'Flight Status' },
  { id: 'crew_legality', label: 'Crew Legality' },
  { id: 'weather', label: 'Weather' },
  { id: 'mx', label: 'Maintenance' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'irops', label: 'IROPS' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'system', label: 'System' },
];

const ROLES = ['dispatcher', 'captain', 'first_officer', 'flight_attendant', 'all'];

export default function OpsAlertCreationModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    alert_type: 'flight_status',
    severity: 'warning',
    title: '',
    message: '',
    flight_number: '',
    aircraft_tail: '',
    target_roles: ['dispatcher'],
    action_required: false,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OpsAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-alerts'] });
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setForm({
      alert_type: 'flight_status',
      severity: 'warning',
      title: '',
      message: '',
      flight_number: '',
      aircraft_tail: '',
      target_roles: ['dispatcher'],
      action_required: false,
    });
  };

  const handleSubmit = () => {
    if (!form.title || !form.message) {
      alert('Title and message required');
      return;
    }
    createMutation.mutate(form);
  };

  const toggleRole = (role) => {
    if (form.target_roles.includes(role)) {
      setForm(prev => ({ ...prev, target_roles: prev.target_roles.filter(r => r !== role) }));
    } else {
      setForm(prev => ({ ...prev, target_roles: [...prev.target_roles, role] }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/60">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <p className="text-sm font-extrabold text-foreground">Create Ops Alert</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Alert type & severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Alert Type</label>
              <select value={form.alert_type} onChange={e => setForm({...form, alert_type: e.target.value})}
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {ALERT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Severity</label>
              <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Title and message */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Title</label>
            <input type="text" placeholder="Alert title" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm font-semibold text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Message</label>
            <textarea placeholder="Alert details" value={form.message} onChange={e => setForm({...form, message: e.target.value})}
              className="w-full h-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>

          {/* Flight/Aircraft optional */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Flight # (Optional)</label>
              <input type="text" placeholder="e.g. AER101" value={form.flight_number} onChange={e => setForm({...form, flight_number: e.target.value})}
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm font-semibold text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Aircraft Tail (Optional)</label>
              <input type="text" placeholder="e.g. N455GJ" value={form.aircraft_tail} onChange={e => setForm({...form, aircraft_tail: e.target.value})}
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm font-semibold text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Target roles */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Notify Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    form.target_roles.includes(role)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Action required checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.action_required} onChange={e => setForm({...form, action_required: e.target.checked})}
              className="w-4 h-4 rounded border-border bg-secondary cursor-pointer" />
            <span className="text-sm text-foreground">Action required</span>
          </label>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 px-5 py-4 border-t border-border bg-secondary/30">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={createMutation.isPending}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {createMutation.isPending ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}