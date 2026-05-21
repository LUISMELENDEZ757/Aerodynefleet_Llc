import { useState } from 'react';
import { X, Shield, Wrench, Clock, AlertCircle, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const SHIFTS = ['Day', 'Night', 'Swing', 'On-Call'];
const ROLES = ['Supervisor', 'Lead Technician', 'Technician', 'Inspector', 'Quality Assurance'];

export default function TakingOwnershipModal({ aircraft, onClose, onSubmit, isPending }) {
  const [priority, setPriority] = useState('routine');
  const [form, setForm] = useState({
    technician_name: '',
    cert_number: '',
    shift: 'Day',
    role: 'Technician',
    work_order: '',
    scope_of_work: '',
    special_instructions: '',
    point_of_contact: '',
    contact_phone: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.technician_name.trim() || !form.scope_of_work.trim()) return;
    onSubmit({
      aircraft_tail: aircraft.tail_number,
      entry_type: 'info',
      description: `[TAKING OWNERSHIP - ${priority.toUpperCase()}] ${form.technician_name} - ${form.scope_of_work}`,
      technician_name: form.technician_name,
      technician_id: form.cert_number,
      notes: `Shift: ${form.shift} | Role: ${form.role} | Work Order: ${form.work_order || 'N/A'} | Location: ${form.location || 'N/A'} | POC: ${form.point_of_contact || 'N/A'} | POC Phone: ${form.contact_phone || 'N/A'} | Safety Notes: ${form.special_instructions || 'None'}`,
    });
    setForm({
      technician_name: '',
      cert_number: '',
      shift: 'Day',
      role: 'Technician',
      work_order: '',
      scope_of_work: '',
      special_instructions: '',
      point_of_contact: '',
      contact_phone: '',
      location: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });
    setPriority('routine');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 p-4 flex justify-center" style={{ paddingTop: '96px' }}>
      <div className="w-full max-w-lg bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[calc(100vh-120px)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-[#141922]">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white tracking-wide">TAKING OWNERSHIP</p>
            <p className="text-xs text-gray-500 font-mono">
              {aircraft.tail_number} · {aircraft.aircraft_type} · {aircraft.base_station} · FAA Audit Trail Entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Aircraft Info */}
          <div className="rounded-xl border border-white/10 bg-[#141922] px-4 py-3 flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-primary">{aircraft.tail_number}</p>
              <p className="text-xs text-gray-500">{aircraft.aircraft_type} · {aircraft.base_station}</p>
            </div>
          </div>

          {/* Assignment Priority */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">
              Assignment Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'routine', label: 'ROUTINE', icon: '→' },
                { value: 'priority', label: 'PRIORITY', icon: '⚡' },
                { value: 'aog', label: 'AOG', icon: '⚠' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all',
                    priority === opt.value
                      ? opt.value === 'routine'
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : opt.value === 'priority'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-white/15 bg-[#141922] text-gray-500 hover:border-white/30'
                  )}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Technician Identity */}
          <div className="rounded-xl border border-white/10 bg-[#141922] p-4 space-y-4">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <Shield className="w-4 h-4" /> TECHNICIAN IDENTITY
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Technician Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.technician_name}
                  onChange={(e) => set('technician_name', e.target.value)}
                  placeholder="LUIS MELENDEZ"
                  className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  A&P / IA Cert # / Emp # *
                </label>
                <input
                  type="text"
                  required
                  value={form.cert_number}
                  onChange={(e) => set('cert_number', e.target.value)}
                  placeholder="AMT-XXXXX or QC-XXXXX"
                  className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Shift
                </label>
                <select
                  value={form.shift}
                  onChange={(e) => set('shift', e.target.value)}
                  className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors"
                >
                  {SHIFTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Work Assignment */}
          <div className="rounded-xl border border-white/10 bg-[#141922] p-4 space-y-4">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <Wrench className="w-4 h-4" /> WORK ASSIGNMENT
            </p>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Work Order / Reference # (Optional)
              </label>
              <input
                type="text"
                value={form.work_order}
                onChange={(e) => set('work_order', e.target.value)}
                placeholder="WO-XXXXXXXX or N/A"
                className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Scope of Work *
              </label>
              <textarea
                required
                value={form.scope_of_work}
                onChange={(e) => set('scope_of_work', e.target.value)}
                placeholder="Describe the maintenance task(s) you are taking ownership of — AMM task, discrepancy, MEL item, etc."
                rows={4}
                className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Special Instructions / Safety Notes (Optional)
              </label>
              <textarea
                value={form.special_instructions}
                onChange={(e) => set('special_instructions', e.target.value)}
                placeholder="Safety concerns, tooling requirements, coordination needed, etc."
                rows={3}
                className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>

          {/* Location & Point of Contact */}
          <div className="rounded-xl border border-white/10 bg-[#141922] p-4 space-y-4">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4" /> LOCATION & CONTACT
            </p>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Gate A2, Hangar 1, Ramp Zone C, etc."
                className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Point of Contact (Optional)
                </label>
                <input
                  type="text"
                  value={form.point_of_contact}
                  onChange={(e) => set('point_of_contact', e.target.value)}
                  placeholder="Name or dept."
                  className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => set('contact_phone', e.target.value)}
                  placeholder="+1 (555) 0000"
                  className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Time (Local)
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                className="w-full bg-[#0d1117] border border-white/15 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-400 mb-1">14 CFR §43.9 — Permanent Record:</p>
              <p className="text-xs text-blue-300 leading-snug">
                This entry will be permanently recorded in the aircraft maintenance timeline audit trail and cannot be deleted. Ensure all information is accurate before submitting.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/15 text-white text-sm font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !form.technician_name.trim() || !form.cert_number.trim() || !form.scope_of_work.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" /> {isPending ? 'Taking...' : 'TAKE OWNERSHIP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}