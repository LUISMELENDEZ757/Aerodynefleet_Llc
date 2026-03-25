import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_TYPES = [
  { value: 'troubleshooting', label: 'Troubleshooting & Diagnostics' },
  { value: 'inspection', label: 'Inspection & Testing' },
  { value: 'parts_ordering', label: 'Parts Ordering / Requisition' },
  { value: 'repair', label: 'Repair & Maintenance' },
  { value: 'return_to_service', label: 'Return to Service' },
  { value: 'testing', label: 'Testing & Verification' },
  { value: 'documentation', label: 'Documentation & Paperwork' },
  { value: 'other', label: 'Other' },
];

export default function AddTimelineEventModal({ aircraftTail, onClose, onSubmit, isPending }) {
  const [form, setForm] = useState({
    event_type: 'troubleshooting',
    event_title: '',
    description: '',
    start_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    end_time: '',
    code_reference: '',
    paperwork: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.event_title.trim()) return;
    onSubmit({
      aircraft_tail: aircraftTail,
      entry_type: 'info',
      description: `[${EVENT_TYPES.find(t => t.value === form.event_type)?.label}] ${form.event_title}`,
      notes: form.description ? `Description: ${form.description}` : '',
      ata_chapter: form.code_reference ? form.code_reference : '',
    });
    setForm({
      event_type: 'troubleshooting',
      event_title: '',
      description: '',
      start_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      end_time: '',
      code_reference: '',
      paperwork: '',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141922]">
          <p className="text-lg font-extrabold text-primary tracking-wide">Add Timeline Event</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Event Type */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Event Type
            </label>
            <select
              value={form.event_type}
              onChange={(e) => set('event_type', e.target.value)}
              className="w-full bg-[#141922] border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1.5 italic">"Return to Service" is only available when the aircraft is Out of Service / In-Work.</p>
          </div>

          {/* Event Title */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={form.event_title}
              onChange={(e) => set('event_title', e.target.value)}
              placeholder="e.g., Engine inspection completed"
              className="w-full bg-[#141922] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Description (Optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Additional details..."
              rows={3}
              className="w-full bg-[#141922] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Time fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Start Time
              </label>
              <div className="flex items-center gap-2 bg-[#141922] border border-white/15 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="time"
                  value={form.start_time.replace(/\s(AM|PM)/, '')}
                  onChange={(e) => set('start_time', e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                End Time (Optional)
              </label>
              <div className="flex items-center gap-2 bg-[#141922] border border-white/15 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => set('end_time', e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
                  placeholder="--:-- --"
                />
              </div>
            </div>
          </div>

          {/* Code & Paperwork */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Code / Reference (Optional)
              </label>
              <input
                type="text"
                value={form.code_reference}
                onChange={(e) => set('code_reference', e.target.value)}
                placeholder="e.g., LETRC, 6GGJ"
                className="w-full bg-[#141922] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Paperwork (Optional)
              </label>
              <input
                type="text"
                value={form.paperwork}
                onChange={(e) => set('paperwork', e.target.value)}
                placeholder="e.g., Maintenance Log"
                className="w-full bg-[#141922] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none focus:border-primary transition-colors"
              />
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
              disabled={isPending || !form.event_title.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}