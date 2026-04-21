import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Plus, Upload, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = [
  'lead_ap', 'ap', 'avionics_tech', 'powerplant_tech', 'hydraulics_tech',
  'structures_tech', 'electrical_tech', 'inspector_rii', 'supervisor', 'quality_inspector', 'specialty_tech'
];

const RECOVERY_TYPES = ['engine_replacement', 'airframe_repair', 'hydraulic_system', 'avionics', 'landing_gear', 'other'];

const roleColors = {
  supervisor: 'bg-red-500/20 text-red-400',
  inspector_rii: 'bg-orange-500/20 text-orange-400',
  quality_inspector: 'bg-yellow-500/20 text-yellow-400',
  lead_ap: 'bg-blue-500/20 text-blue-400',
  specialty_tech: 'bg-green-500/20 text-green-400',
};

export default function FieldTripModal({ trip, onClose, station }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(trip || {
    station,
    aircraft_tail: '',
    recovery_type: 'engine_replacement',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    technicians_assigned: [],
    flight_number: '',
    return_flight_number: '',
    hotel_name: '',
    hotel_confirmation: '',
    daily_expense_budget: 0,
    total_expenses: 0,
    notes: '',
    documents: [],
    pictures: [],
  });
  const [newTech, setNewTech] = useState({ name: '', employee_id: '', role: 'ap', certification: '', specialty: '', company_id: '', phone: '', passport_number: '', notes: '' });
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addTech = () => {
    if (newTech.name && newTech.employee_id) {
      set('technicians_assigned', [...form.technicians_assigned, newTech]);
      setNewTech({ name: '', employee_id: '', role: 'ap', certification: '', specialty: '', company_id: '', phone: '', passport_number: '', notes: '' });
    }
  };

  const removeTech = (idx) => {
    set('technicians_assigned', form.technicians_assigned.filter((_, i) => i !== idx));
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingFiles(true);
    try {
      const urls = await Promise.all(
        files.map(file =>
          base44.integrations.Core.UploadFile({ file }).then(res => ({
            name: file.name,
            url: res.file_url,
            type: file.type
          }))
        )
      );
      set(type, [...(form[type] || []), ...urls]);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (idx, type) => {
    set(type, form[type].filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: (data) =>
      trip?.id
        ? base44.entities.FieldTrip.update(trip.id, data)
        : base44.entities.FieldTrip.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mcc-fieldtrips'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 flex justify-center items-start overflow-y-auto pt-8">
      <div className="w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-10 bg-[#0d1117]">
          <p className="text-base font-bold text-white">{trip?.id ? 'Edit' : 'New'} Field Trip Recovery</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Aircraft Tail *</label>
              <input value={form.aircraft_tail} onChange={e => set('aircraft_tail', e.target.value.toUpperCase())} placeholder="N455GJ" className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Recovery Type *</label>
              <select value={form.recovery_type} onChange={e => set('recovery_type', e.target.value)} className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary">
                {RECOVERY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>

          {/* Technicians */}
          <div className="bg-[#141922] border border-white/10 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">👷 Team Members</p>
            <div className="space-y-2">
              {form.technicians_assigned.map((tech, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0d1117] p-3 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-white">{tech.name}</p>
                      <span className={cn('text-[10px] px-2 py-0.5 rounded font-bold', roleColors[tech.role] || 'bg-purple-500/20 text-purple-400')}>{tech.role.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs text-gray-500">{tech.employee_id} • {tech.company_id}</p>
                  </div>
                  <button onClick={() => removeTech(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="bg-[#0d1117] rounded-lg p-3 space-y-2 border border-white/5">
              <input value={newTech.name} onChange={e => setNewTech(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newTech.employee_id} onChange={e => setNewTech(p => ({ ...p, employee_id: e.target.value }))} placeholder="Employee ID" className="bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary" />
                <select value={newTech.role} onChange={e => setNewTech(p => ({ ...p, role: e.target.value }))} className="bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary">
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={newTech.company_id} onChange={e => setNewTech(p => ({ ...p, company_id: e.target.value }))} placeholder="Company ID" className="bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary" />
                <input value={newTech.certification} onChange={e => setNewTech(p => ({ ...p, certification: e.target.value }))} placeholder="Cert (A&P, IA, RII)" className="bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={newTech.phone} onChange={e => setNewTech(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary" />
                <input value={newTech.passport_number} onChange={e => setNewTech(p => ({ ...p, passport_number: e.target.value }))} placeholder="Passport #" className="bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary" />
              </div>
              <input value={newTech.specialty} onChange={e => setNewTech(p => ({ ...p, specialty: e.target.value }))} placeholder="Specialty (e.g. Turbine Engines)" className="w-full bg-[#1a1f2e] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-primary" />
              <button onClick={addTech} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1">
                <Plus className="w-3 h-3" /> Add Technician
              </button>
            </div>
          </div>

          {/* Flights & Hotel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Outbound Flight</label>
              <input value={form.flight_number} onChange={e => set('flight_number', e.target.value)} placeholder="UA1455" className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Return Flight</label>
              <input value={form.return_flight_number} onChange={e => set('return_flight_number', e.target.value)} placeholder="UA1456" className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Hotel Name</label>
              <input value={form.hotel_name} onChange={e => set('hotel_name', e.target.value)} placeholder="Hilton Newark" className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Confirmation #</label>
              <input value={form.hotel_confirmation} onChange={e => set('hotel_confirmation', e.target.value)} placeholder="HLT-9876543" className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Daily Expense Budget ($)</label>
              <input type="number" value={form.daily_expense_budget} onChange={e => set('daily_expense_budget', Number(e.target.value))} placeholder="250" className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Total Expenses ($)</label>
              <input type="number" value={form.total_expenses} onChange={e => set('total_expenses', Number(e.target.value))} placeholder="3750" className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Recovery Details/Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="CFM56-7B engine replacement — EGT margin exceeded..." className="w-full bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary resize-none" />
          </div>

          {/* Documents */}
          <div className="bg-[#141922] border border-white/10 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">📄 Documents</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {form.documents?.map((doc, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0d1117] p-2 rounded text-xs text-gray-300">
                  <span className="truncate">{doc.name}</span>
                  <button onClick={() => removeFile(i, 'documents')} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0d1117] border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Upload Documents</span>
              <input type="file" multiple onChange={e => handleFileUpload(e, 'documents')} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled={uploadingFiles} />
            </label>
          </div>

          {/* Pictures */}
          <div className="bg-[#141922] border border-white/10 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">📸 Pictures</p>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {form.pictures?.map((pic, i) => (
                <div key={i} className="relative group">
                  <img src={pic.url} alt={pic.name} className="w-full h-20 object-cover rounded-lg" />
                  <button onClick={() => removeFile(i, 'pictures')} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0d1117] border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Upload Photos</span>
              <input type="file" multiple onChange={e => handleFileUpload(e, 'pictures')} className="hidden" accept="image/*" disabled={uploadingFiles} />
            </label>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm font-bold text-white hover:bg-white/5">Cancel</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.aircraft_tail}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : trip?.id ? 'Update Trip' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}