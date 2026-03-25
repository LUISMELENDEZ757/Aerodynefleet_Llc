import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Sofa, ChevronRight, Plus, Camera, Image, Upload, Send, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CABIN_CATEGORIES = [
  { key: 'Seating',         label: 'Seating' },
  { key: 'Lavatory',        label: 'Lavatory' },
  { key: 'Galley',          label: 'Galley' },
  { key: 'Cabin Lighting',  label: 'Cabin Lighting' },
  { key: 'IFE / Wi-Fi / PA',label: 'IFE / Wi-Fi / PA' },
  { key: 'Safety Equipment',label: 'Safety Equipment' },
];

const SEVERITY_LEVELS = [
  { key: 'minor',    label: 'MINOR',    sub: 'Comfort',          color: 'bg-blue-500 text-white' },
  { key: 'moderate', label: 'MODERATE', sub: 'Passenger Impact', color: 'bg-gray-600 text-white' },
  { key: 'safety',   label: 'SAFETY',   sub: 'Critical',         color: 'bg-gray-600 text-white' },
];

const STATIONS = ['KEWR', 'KJFK', 'KORD', 'KMCO', 'KLAX', 'KSFO', 'KDFW', 'KATL', 'KBOS', 'KDCA', 'KSEA', 'KDEN'];

export default function CabinDiscrepancy() {
  const queryClient = useQueryClient();

  const { data: aircraft = [] } = useQuery({
    queryKey: ['cabin-disc-aircraft'],
    queryFn: () => base44.entities.Aircraft.list(),
  });

  const [form, setForm] = useState({
    aircraft_tail: '',
    station: '',
    cabin_category: 'Seating',
    location_zone: '',
    seat_row: '',
    description: '',
    severity: 'minor',
    fa_name: '',
    fa_id: '',
    photos: [],
  });
  const [submitted, setSubmitted] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [tailSearch, setTailSearch] = useState('');
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LogbookEntry.create({
      aircraft_tail: data.aircraft_tail,
      entry_type: 'discrepancy',
      description: `[CABIN — ${data.cabin_category}] ${data.location_zone ? `Zone: ${data.location_zone}. ` : ''}${data.seat_row ? `Seat: ${data.seat_row}. ` : ''}${data.description}`,
      station: data.station,
      technician_name: data.fa_name,
      technician_id: data.fa_id,
      notes: `Severity: ${data.severity}. Reported by FA ${data.fa_name}${data.fa_id ? ` (${data.fa_id})` : ''}.`,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logbook-entries'] });
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.aircraft_tail || !form.station || !form.description || !form.fa_name) return;
    createMutation.mutate(form);
  };

  const handlePhotoInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (photoCount + files.length > 5) return;
    setPhotoCount(p => Math.min(5, p + files.length));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 rounded-full bg-pink-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-pink-400" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-extrabold text-white mb-2">Discrepancy Submitted</p>
          <p className="text-sm text-gray-400">Logged to E-Logbook for maintenance review</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setSubmitted(false); setForm({ aircraft_tail: '', station: '', cabin_category: 'Seating', location_zone: '', seat_row: '', description: '', severity: 'minor', fa_name: '', fa_id: '', photos: [] }); setPhotoCount(0); }}
            className="px-6 py-3 rounded-xl bg-[#1a1f2e] border border-white/10 text-sm font-bold text-white hover:bg-white/5 transition-colors"
          >
            New Report
          </button>
          <Link to="/TechOpsLogbook" className="px-6 py-3 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-500 transition-colors">
            View Logbook
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[#0d1117]">
        <Link to="/Home" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-pink-600 flex items-center justify-center">
          <Sofa className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold tracking-wide leading-none">CABIN MODE — CREATE DISCREPANCY</p>
          <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5">FA Cabin Discrepancy System</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* Form Card */}
        <div className="bg-[#16101f] border border-pink-900/40 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-pink-900/30 flex items-center gap-2">
            <Plus className="w-4 h-4 text-pink-400" />
            <p className="text-sm font-extrabold tracking-widest uppercase text-white">Create Cabin Discrepancy</p>
          </div>
          <p className="px-5 pt-3 text-xs text-gray-500">All fields marked with * are required</p>

          <div className="p-5 space-y-5">
            {/* Aircraft Tail + Station */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">AIRCRAFT TAIL *</label>
                <input
                  type="text"
                  placeholder="Search tail…"
                  value={tailSearch}
                  onChange={e => {
                    setTailSearch(e.target.value);
                    // Clear selection if user edits the search
                    if (form.aircraft_tail && !e.target.value.toUpperCase().startsWith(form.aircraft_tail)) {
                      set('aircraft_tail', '');
                    }
                  }}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-t-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-pink-500 font-mono"
                />
                {tailSearch && (
                  <div className="bg-[#1a1f2e] border border-t-0 border-white/10 rounded-b-xl overflow-hidden max-h-40 overflow-y-auto">
                    {aircraft
                      .filter(a => a.tail_number.toLowerCase().includes(tailSearch.toLowerCase()))
                      .map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => { set('aircraft_tail', a.tail_number); setTailSearch(a.tail_number); }}
                          className={cn(
                            'w-full text-left px-4 py-2.5 text-sm font-mono hover:bg-pink-500/20 transition-colors flex items-center justify-between',
                            form.aircraft_tail === a.tail_number ? 'bg-pink-500/20 text-pink-300' : 'text-white'
                          )}
                        >
                          <span>{a.tail_number}</span>
                          {a.aircraft_type && <span className="text-xs text-gray-500">{a.aircraft_type}</span>}
                        </button>
                      ))}
                    {aircraft.filter(a => a.tail_number.toLowerCase().includes(tailSearch.toLowerCase())).length === 0 && (
                      <p className="px-4 py-3 text-xs text-gray-500">No aircraft found</p>
                    )}
                  </div>
                )}
                {form.aircraft_tail && !tailSearch.includes(form.aircraft_tail) && (
                  <p className="text-xs text-pink-400 mt-1 font-mono">{form.aircraft_tail} selected</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">STATION *</label>
                <select
                  required
                  value={form.station}
                  onChange={e => set('station', e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-pink-500 appearance-none"
                >
                  <option value="">Select station…</option>
                  {STATIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cabin Category */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">CABIN CATEGORY *</label>
              <div className="grid grid-cols-2 gap-2">
                {CABIN_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => set('cabin_category', cat.key)}
                    className={cn(
                      'py-3 px-4 rounded-xl text-sm font-bold transition-all',
                      form.cabin_category === cat.key
                        ? 'bg-pink-500 text-white'
                        : 'bg-[#1a1f2e] text-gray-300 hover:bg-white/5 border border-white/10'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location / Zone + Seat Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">LOCATION / ZONE *</label>
                <input
                  required
                  value={form.location_zone}
                  onChange={e => set('location_zone', e.target.value)}
                  placeholder="e.g., Forward Cabin, Aft Galley"
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">SEAT ROW (IF APPLICABLE)</label>
                <input
                  value={form.seat_row}
                  onChange={e => set('seat_row', e.target.value)}
                  placeholder="e.g., 12A, 7C"
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Discrepancy Description */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">DISCREPANCY DESCRIPTION *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe the issue in detail..."
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-pink-500 resize-none"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">SEVERITY LEVEL *</label>
              <div className="grid grid-cols-3 gap-2">
                {SEVERITY_LEVELS.map(sev => (
                  <button
                    key={sev.key}
                    type="button"
                    onClick={() => set('severity', sev.key)}
                    className={cn(
                      'py-3 px-2 rounded-xl text-center transition-all',
                      form.severity === sev.key
                        ? sev.key === 'minor' ? 'bg-blue-500 text-white' : sev.key === 'moderate' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                        : 'bg-[#1a1f2e] text-gray-400 border border-white/10 hover:bg-white/5'
                    )}
                  >
                    <p className="text-sm font-extrabold">{sev.label}</p>
                    <p className="text-[10px] text-current opacity-70">{sev.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* FA Name + ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">FLIGHT ATTENDANT NAME *</label>
                <input
                  required
                  value={form.fa_name}
                  onChange={e => set('fa_name', e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">FA EMPLOYEE ID</label>
                <input
                  value={form.fa_id}
                  onChange={e => set('fa_id', e.target.value)}
                  placeholder="e.g., FA-1234"
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Photo Attachments */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">ATTACH PHOTOS (OPTIONAL)</label>
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[#1a1f2e] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">PHOTO / DOCUMENT ATTACHMENTS</p>
                  </div>
                  <span className="text-xs font-mono text-gray-500">{photoCount}/5</span>
                </div>

                <div className="p-4 border border-dashed border-white/10 m-3 rounded-xl space-y-3">
                  {/* Hidden inputs */}
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoInput} />
                  <input ref={photoInputRef}  type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoInput} />
                  <input ref={docInputRef}    type="file" accept=".pdf,.doc,.docx" multiple className="hidden" onChange={handlePhotoInput} />

                  <div className="grid grid-cols-3 gap-2">
                    {/* Take Photo */}
                    <button
                      type="button"
                      disabled={photoCount >= 5}
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-colors"
                    >
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-xs font-bold text-white text-center">Take Photo</span>
                    </button>

                    {/* Photo/Image */}
                    <button
                      type="button"
                      disabled={photoCount >= 5}
                      onClick={() => photoInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-[#1a1f2e] border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                      <Image className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-bold text-gray-300 text-center">Photo/Image</span>
                    </button>

                    {/* Document */}
                    <button
                      type="button"
                      disabled={photoCount >= 5}
                      onClick={() => docInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-[#1a1f2e] border border-white/10 hover:bg-white/5 disabled:opacity-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-bold text-gray-300 text-center">Document</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 text-center">Or drag & drop images / PDFs here</p>
                </div>

                <div className="px-4 pb-4 flex items-start gap-2 text-xs text-gray-500">
                  <Camera className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Attach photos of damage, work area, or supporting documents for FAA record keeping.{' '}
                    <span className="text-purple-400">Works with smartphone &amp; tablet camera.</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createMutation.isPending || !form.aircraft_tail || !form.station || !form.description || !form.fa_name}
              className="w-full py-4 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              {createMutation.isPending ? 'Submitting…' : 'Submit Cabin Discrepancy'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}