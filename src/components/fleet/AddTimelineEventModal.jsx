import { useState } from 'react';
import { X, Clock, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_GROUPS = [
  {
    group: '🔧 Routine Line Maintenance',
    events: [
      { value: 'service_check', label: 'Service Check Performed' },
      { value: 'transit_check', label: 'Transit Check Completed' },
      { value: 'daily_check', label: 'Daily Check Completed' },
      { value: '48hr_check', label: '48-Hour Check Completed' },
      { value: 'pdc', label: 'Pre-Departure Check (PDC) Completed' },
      { value: 'etops_pdc', label: 'ETOPS Pre-Departure Service Check Completed' },
      { value: 'oil_service', label: 'Oil Serviced' },
      { value: 'hydraulic_service', label: 'Hydraulic Serviced' },
      { value: 'oxygen_service', label: 'Oxygen Serviced' },
      { value: 'lav_service', label: 'Lavatory Serviced' },
      { value: 'water_service', label: 'Potable Water Serviced' },
      { value: 'tire_check', label: 'Tire Pressure Check Completed' },
      { value: 'brake_check', label: 'Brake Wear Check Completed' },
    ],
  },
  {
    group: '🛠️ Corrective Maintenance',
    events: [
      { value: 'discrepancy_entered', label: 'Discrepancy Entered (Pilot Write-Up)' },
      { value: 'discrepancy_cleared', label: 'Discrepancy Cleared' },
      { value: 'troubleshooting', label: 'Troubleshooting Performed' },
      { value: 'component_removed', label: 'Component Removed' },
      { value: 'component_installed', label: 'Component Installed' },
      { value: 'functional_check', label: 'Functional Check Performed' },
      { value: 'operational_check', label: 'Operational Check Performed' },
      { value: 'rii_completed', label: 'RII Inspection Completed' },
      { value: 'deferred_item_created', label: 'Deferred Item Created (MEL/CDL)' },
      { value: 'deferred_item_cleared', label: 'Deferred Item Cleared' },
    ],
  },
  {
    group: '⚙️ Major Maintenance / Out of Service',
    events: [
      { value: 'aircraft_oos', label: 'Aircraft Placed Out of Service' },
      { value: 'return_to_service', label: 'Aircraft Returned to Service (RTS)' },
      { value: 'engine_removal', label: 'Engine Removal Initiated' },
      { value: 'engine_install', label: 'Engine Installation Completed' },
      { value: 'apu_removal_install', label: 'APU Removal / Installation' },
      { value: 'landing_gear_change', label: 'Landing Gear Change' },
      { value: 'structural_repair', label: 'Structural Repair Performed' },
      { value: 'heavy_check_required', label: 'Heavy Check Required' },
      { value: 'heavy_check_completed', label: 'Heavy Check Completed' },
    ],
  },
  {
    group: '📡 Avionics / Systems',
    events: [
      { value: 'software_load', label: 'Software Load Performed' },
      { value: 'nav_db_update', label: 'Navigation Database Updated' },
      { value: 'fms_update', label: 'FMS Updated' },
      { value: 'cfds_fault', label: 'CFDS Fault Retrieved' },
      { value: 'acars_maintenance', label: 'ACARS / VHF / SATCOM Maintenance' },
      { value: 'transponder_check', label: 'Transponder / ADS-B Check Completed' },
      { value: 'rvsm_check', label: 'RVSM Check Completed' },
    ],
  },
  {
    group: '🧯 Safety & Emergency Equipment',
    events: [
      { value: 'emergency_equip_insp', label: 'Emergency Equipment Inspection Completed' },
      { value: 'fire_bottle_replaced', label: 'Fire Bottle Replaced' },
      { value: 'pbe_oxy_replaced', label: 'PBE / Oxygen Bottle Replaced' },
      { value: 'slide_raft_insp', label: 'Slide / Raft Inspection Completed' },
      { value: 'medical_kit_service', label: 'First Aid / Medical Kit Serviced' },
    ],
  },
  {
    group: '🛫 Dispatch-Critical',
    events: [
      { value: 'mel_applied', label: 'MEL Applied' },
      { value: 'mel_cleared', label: 'MEL Cleared' },
      { value: 'cdl_applied', label: 'CDL Applied' },
      { value: 'cdl_cleared', label: 'CDL Cleared' },
      { value: 'cat_changed', label: 'CAT Capability Changed' },
      { value: 'etops_changed', label: 'ETOPS Capability Changed' },
      { value: 'rvsm_changed', label: 'RVSM Capability Changed' },
      { value: 'perf_limit_added', label: 'Performance-Limiting Condition Added' },
      { value: 'perf_limit_cleared', label: 'Performance-Limiting Condition Cleared' },
    ],
  },
  {
    group: '🧵 Cabin & Interior',
    events: [
      { value: 'cabin_defect_entered', label: 'Cabin Defect Entered' },
      { value: 'cabin_defect_cleared', label: 'Cabin Defect Cleared' },
      { value: 'seat_repair', label: 'Seat Repair Completed' },
      { value: 'galley_service', label: 'Galley Equipment Serviced' },
      { value: 'ife_reset', label: 'IFE System Reset / Repair' },
      { value: 'deep_clean', label: 'Interior Deep Clean Completed' },
    ],
  },
  {
    group: '🛢️ Fuel & Power',
    events: [
      { value: 'fueling_completed', label: 'Fueling Completed' },
      { value: 'defuel', label: 'Defuel Performed' },
      { value: 'fuel_system_check', label: 'Fuel System Check Completed' },
      { value: 'apu_run', label: 'APU Run Performed' },
      { value: 'engine_run', label: 'Engine Run Performed' },
    ],
  },
  {
    group: '📋 General',
    events: [
      { value: 'inspection', label: 'Inspection & Testing' },
      { value: 'parts_ordering', label: 'Parts Ordering / Requisition' },
      { value: 'repair', label: 'Repair & Maintenance' },
      { value: 'documentation', label: 'Documentation & Paperwork' },
      { value: 'other', label: 'Other' },
    ],
  },
];

// Flat list for label lookup
const EVENT_TYPES_FLAT = EVENT_GROUPS.flatMap(g => g.events);

export default function AddTimelineEventModal({ aircraftTail, onClose, onSubmit, isPending, activeLock }) {
  const [form, setForm] = useState({
    event_type: 'service_check',
    event_title: '',
    description: '',
    start_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    end_time: '',
    code_reference: '',
    paperwork: '',
    etr: '',
    flight_eta: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const isRtsBlocked = form.event_type === 'return_to_service' && !!activeLock;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.event_title.trim()) return;
    if (isRtsBlocked) return;
    const noteParts = [];
    if (form.description) noteParts.push(`Description: ${form.description}`);
    if (form.etr) noteParts.push(`ETR: ${form.etr}`);
    if (form.flight_eta) noteParts.push(`Flight ETA: ${form.flight_eta}`);
    onSubmit({
      aircraft_tail: aircraftTail,
      entry_type: 'info',
      description: `[${EVENT_TYPES_FLAT.find(t => t.value === form.event_type)?.label}] ${form.event_title}`,
      notes: noteParts.join(' | '),
      ata_chapter: form.code_reference ? form.code_reference : '',
      _rts: form.event_type === 'return_to_service',
    });
    setForm({
      event_type: 'service_check',
      event_title: '',
      description: '',
      start_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      end_time: '',
      code_reference: '',
      paperwork: '',
      etr: '',
      flight_eta: '',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 p-4 flex justify-center" style={{ paddingTop: '96px' }}>
      <div className="w-full max-w-lg bg-[#1a1f2e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[calc(100vh-120px)] overflow-y-auto">
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
              className="w-full bg-[#141922] border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {EVENT_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.events.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1.5 italic">"Return to Service" is only available when the aircraft is Out of Service / In-Work.</p>
          </div>

          {/* MCC Lock Warning */}
          {isRtsBlocked && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-500/50 rounded-xl px-4 py-3">
              <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-red-400">MCC LOCK — Return to Service Blocked</p>
                <p className="text-xs text-red-300 mt-1">
                  This aircraft has an active Maintenance Control lock placed by <span className="font-bold">{activeLock.placed_by}</span>.
                </p>
                <p className="text-xs text-red-300/80 mt-0.5 italic">"{activeLock.reason}"</p>
                <p className="text-xs text-red-400 font-bold mt-2">The lock must be removed by Maintenance Control before this aircraft can be returned to service.</p>
              </div>
            </div>
          )}

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

          {/* ETR & Flight ETA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                ETR — Est. Time to Return
              </label>
              <div className="flex items-center gap-2 bg-[#141922] border border-white/15 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <input
                  type="time"
                  value={form.etr}
                  onChange={(e) => set('etr', e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                  placeholder="--:--"
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Zulu time when aircraft expected back in service</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Flight ETA
              </label>
              <div className="flex items-center gap-2 bg-[#141922] border border-white/15 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                <input
                  type="time"
                  value={form.flight_eta}
                  onChange={(e) => set('flight_eta', e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                  placeholder="--:--"
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Scheduled flight departure / arrival ETA</p>
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
              disabled={isPending || !form.event_title.trim() || isRtsBlocked}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50",
                isRtsBlocked
                  ? 'bg-red-900/40 border border-red-500/40 text-red-400 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {isPending ? 'Adding...' : isRtsBlocked ? 'Blocked — MCC Lock Active' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}