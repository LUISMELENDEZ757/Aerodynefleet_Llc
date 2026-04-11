import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ATA_CHAPTERS = [
  { ch: '05', name: 'Time Limits / Maintenance Checks', subs: [{ s: '10', n: 'Time Limits' }, { s: '20', n: 'Scheduled Maintenance Checks' }, { s: '50', n: 'Unscheduled Maintenance Checks' }] },
  { ch: '06', name: 'Dimensions & Areas', subs: [{ s: '00', n: 'General' }] },
  { ch: '07', name: 'Lifting & Shoring', subs: [{ s: '10', n: 'Jacking' }, { s: '20', n: 'Shoring' }] },
  { ch: '08', name: 'Leveling & Weighing', subs: [{ s: '10', n: 'Weighing & Balancing' }, { s: '20', n: 'Leveling' }] },
  { ch: '09', name: 'Towing & Taxiing', subs: [{ s: '10', n: 'Towing' }, { s: '20', n: 'Taxiing' }] },
  { ch: '10', name: 'Parking, Mooring, Storage & Return to Service', subs: [{ s: '10', n: 'Parking / Storage' }, { s: '20', n: 'Mooring' }, { s: '30', n: 'Return to Service' }] },
  { ch: '11', name: 'Placards & Markings', subs: [{ s: '10', n: 'Exterior Color Schemes' }, { s: '20', n: 'Exterior Placards' }, { s: '30', n: 'Interior Placards' }] },
  { ch: '12', name: 'Servicing', subs: [{ s: '10', n: 'Replenishing' }, { s: '20', n: 'Scheduled Servicing' }, { s: '30', n: 'Unscheduled Servicing' }] },
  { ch: '18', name: 'Vibration & Noise Analysis', subs: [{ s: '10', n: 'Vibration Analysis' }, { s: '20', n: 'Noise Analysis' }] },
  { ch: '20', name: 'Standard Practices — Airframe', subs: [{ s: '10', n: 'Fasteners' }, { s: '20', n: 'Electrical Bonding' }, { s: '30', n: 'Sealing' }] },
  { ch: '21', name: 'Air Conditioning', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Compression' }, { s: '20', n: 'Distribution' }, { s: '30', n: 'Pressurization Control' }, { s: '40', n: 'Heating' }, { s: '50', n: 'Cooling' }, { s: '60', n: 'Temperature Control' }, { s: '70', n: 'Moisture / Air Contaminant Control' }] },
  { ch: '22', name: 'Auto Flight', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Autopilot' }, { s: '20', n: 'Speed / Attitude Correction' }, { s: '30', n: 'Autothrottle' }, { s: '40', n: 'System Monitor' }, { s: '50', n: 'Aerodynamic Load Alleviating' }] },
  { ch: '23', name: 'Communications', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'HF Communications' }, { s: '20', n: 'VHF Communications' }, { s: '30', n: 'Passenger Address & Entertainment' }, { s: '40', n: 'Interphone' }, { s: '50', n: 'Audio Integrating' }, { s: '60', n: 'Static Discharging' }, { s: '70', n: 'Audio & Video Monitoring' }, { s: '80', n: 'Integrated Automatic Tuning' }] },
  { ch: '24', name: 'Electrical Power', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Generator Drive' }, { s: '20', n: 'AC Generation' }, { s: '30', n: 'DC Generation' }, { s: '40', n: 'External Power' }, { s: '50', n: 'AC Electrical Load Distribution' }, { s: '60', n: 'DC Electrical Load Distribution' }] },
  { ch: '25', name: 'Equipment / Furnishings', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Flight Compartment' }, { s: '20', n: 'Passenger Compartment' }, { s: '30', n: 'Buffet / Galley' }, { s: '40', n: 'Lavatories' }, { s: '50', n: 'Cargo Compartments' }, { s: '60', n: 'Emergency' }] },
  { ch: '26', name: 'Fire Protection', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Detection' }, { s: '20', n: 'Extinguishing' }, { s: '30', n: 'Explosion Suppression' }] },
  { ch: '27', name: 'Flight Controls', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Aileron & Tab' }, { s: '20', n: 'Rudder & Tab' }, { s: '30', n: 'Elevator & Tab' }, { s: '40', n: 'Horizontal Stabilizer' }, { s: '50', n: 'Flaps' }, { s: '60', n: 'Spoilers / Speedbrakes' }, { s: '70', n: 'Drag Control' }, { s: '80', n: 'Lift Augmenting' }, { s: '90', n: 'EFCS' }] },
  { ch: '28', name: 'Fuel', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Storage' }, { s: '20', n: 'Distribution' }, { s: '30', n: 'Dump' }, { s: '40', n: 'Indicating' }] },
  { ch: '29', name: 'Hydraulic Power', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'System A' }, { s: '20', n: 'System B' }, { s: '30', n: 'System Indicating' }] },
  { ch: '30', name: 'Ice & Rain Protection', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Airfoil' }, { s: '20', n: 'Air Intakes' }, { s: '30', n: 'Pitot / Static' }, { s: '40', n: 'Windows / Windshields' }, { s: '50', n: 'Antennas & Radomes' }, { s: '60', n: 'Propellers / Rotors' }, { s: '70', n: 'Water Lines' }, { s: '80', n: 'Detection' }] },
  { ch: '31', name: 'Indicating / Recording Systems', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Instrument & Control Panels' }, { s: '20', n: 'Independent Instruments' }, { s: '30', n: 'Recorders' }, { s: '40', n: 'Central Computers' }, { s: '50', n: 'Central Warning Systems' }, { s: '60', n: 'Central Display Systems' }, { s: '70', n: 'Automatic Data Reporting Systems' }] },
  { ch: '32', name: 'Landing Gear', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Main Gear & Doors' }, { s: '20', n: 'Nose Gear & Doors' }, { s: '30', n: 'Extension & Retraction' }, { s: '40', n: 'Wheels & Brakes' }, { s: '50', n: 'Steering' }, { s: '60', n: 'Position & Warning' }, { s: '70', n: 'Supplementary Gear' }, { s: '80', n: 'System Indicating' }] },
  { ch: '33', name: 'Lights', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Flight Compartment' }, { s: '20', n: 'Passenger Compartment' }, { s: '30', n: 'Cargo & Service Compartments' }, { s: '40', n: 'Exterior' }, { s: '50', n: 'Emergency Lighting' }] },
  { ch: '34', name: 'Navigation', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Flight Environment Data' }, { s: '20', n: 'Attitude & Direction' }, { s: '30', n: 'Landing & Taxiing Aids' }, { s: '40', n: 'Independent Position Determining' }, { s: '50', n: 'Dependent Position Determining' }, { s: '60', n: 'Flight Management Computing' }] },
  { ch: '35', name: 'Oxygen', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Crew' }, { s: '20', n: 'Passenger' }, { s: '30', n: 'Portable' }] },
  { ch: '36', name: 'Pneumatic', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Distribution' }, { s: '20', n: 'Indicating' }] },
  { ch: '37', name: 'Vacuum', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Distribution' }, { s: '20', n: 'Indicating' }] },
  { ch: '38', name: 'Water / Waste', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Potable' }, { s: '20', n: 'Wash' }, { s: '30', n: 'Waste Disposal' }, { s: '40', n: 'Air Supply' }] },
  { ch: '44', name: 'Cabin Systems', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Cabin Core System' }, { s: '20', n: 'Inflight Entertainment' }, { s: '30', n: 'External Communication' }, { s: '40', n: 'Cabin Mass Memory' }, { s: '50', n: 'Cabin Monitoring' }, { s: '60', n: 'Miscellaneous Cabin System' }] },
  { ch: '45', name: 'Central Maintenance System', subs: [{ s: '00', n: 'General' }, { s: '05', n: 'CMS / BITE' }, { s: '15', n: 'Information Systems' }, { s: '20', n: 'Airborne Data Communication' }] },
  { ch: '46', name: 'Information Systems', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Aircraft General Information Systems' }, { s: '20', n: 'Flight Deck Information Systems' }, { s: '30', n: 'Maintenance Information Systems' }, { s: '40', n: 'Passenger Cabin Information Systems' }] },
  { ch: '49', name: 'APU', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Power Plant' }, { s: '20', n: 'Engine' }, { s: '30', n: 'Engine Fuel & Control' }, { s: '40', n: 'Ignition / Starting' }, { s: '50', n: 'Air' }, { s: '60', n: 'Engine Controls' }, { s: '70', n: 'Indicating' }, { s: '80', n: 'Exhaust' }, { s: '90', n: 'Oil' }] },
  { ch: '51', name: 'Standard Practices — Structures', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Investigation / Cleanup' }, { s: '20', n: 'Processes' }, { s: '30', n: 'Materials' }, { s: '40', n: 'Fasteners' }] },
  { ch: '52', name: 'Doors', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Passenger / Crew' }, { s: '20', n: 'Emergency Exit' }, { s: '30', n: 'Cargo' }, { s: '40', n: 'Service' }, { s: '50', n: 'Fixed Interior' }, { s: '60', n: 'Entrance Stairs' }, { s: '70', n: 'Monitoring & Operation' }, { s: '80', n: 'Landing Gear' }] },
  { ch: '53', name: 'Fuselage', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Main Frame' }, { s: '20', n: 'Auxiliary Structure' }, { s: '30', n: 'Plates / Skin' }, { s: '40', n: 'Attach Fittings' }, { s: '50', n: 'Aerodynamic Fairings' }] },
  { ch: '54', name: 'Nacelles / Pylons', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Nacelle Section' }, { s: '20', n: 'Pylon' }] },
  { ch: '55', name: 'Stabilizers', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Horizontal Stabilizer' }, { s: '20', n: 'Elevator' }, { s: '30', n: 'Vertical Stabilizer' }, { s: '40', n: 'Rudder' }] },
  { ch: '56', name: 'Windows', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Flight Compartment' }, { s: '20', n: 'Passenger Compartment' }, { s: '30', n: 'Door' }, { s: '40', n: 'Inspection & Observation' }] },
  { ch: '57', name: 'Wings', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Center Wing' }, { s: '20', n: 'Outer Wing' }, { s: '30', n: 'Wing Tip' }, { s: '40', n: 'Leading Edge & Leading Edge Devices' }, { s: '50', n: 'Trailing Edge & Trailing Edge Devices' }, { s: '60', n: 'Ailerons & Elevons' }, { s: '70', n: 'Spoilers' }, { s: '80', n: 'Attach Fittings' }] },
  { ch: '71', name: 'Power Plant — General', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Cowling' }, { s: '20', n: 'Mounts' }, { s: '30', n: 'Fireseals' }, { s: '40', n: 'Attach Fittings' }, { s: '50', n: 'Electrical Harness' }, { s: '60', n: 'Air Intakes' }, { s: '70', n: 'Engine Drains' }] },
  { ch: '72', name: 'Engine — Turbine / Turboprop', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Reduction Gear / Shaft Section' }, { s: '20', n: 'Air Inlet Section' }, { s: '30', n: 'Compressor Section' }, { s: '40', n: 'Combustion Section' }, { s: '50', n: 'Turbine Section' }, { s: '60', n: 'Accessory Drives' }, { s: '70', n: 'Bypass Section' }, { s: '80', n: 'Propulsor Section' }] },
  { ch: '73', name: 'Engine Fuel & Control', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Distribution' }, { s: '20', n: 'Controlling' }, { s: '30', n: 'Indicating' }] },
  { ch: '74', name: 'Ignition', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Electrical Power Supply' }, { s: '20', n: 'Distribution' }, { s: '30', n: 'Indicating' }] },
  { ch: '75', name: 'Air — Engine', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Anti-Icing' }, { s: '20', n: 'Cooling' }, { s: '30', n: 'Compressor Control' }, { s: '40', n: 'Indicating' }] },
  { ch: '76', name: 'Engine Controls', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Power Control' }, { s: '20', n: 'Emergency Shutdown' }] },
  { ch: '77', name: 'Engine Indicating', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Power' }, { s: '20', n: 'Temperature' }, { s: '30', n: 'Analyzers' }, { s: '40', n: 'Integrated Engine Instrument Systems' }] },
  { ch: '78', name: 'Exhaust', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Collector / Tailpipe' }, { s: '20', n: 'Noise Suppressor' }, { s: '30', n: 'Thrust Reverser' }, { s: '40', n: 'Supplemental Air' }] },
  { ch: '79', name: 'Oil', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Storage' }, { s: '20', n: 'Distribution' }, { s: '30', n: 'Indicating' }] },
  { ch: '80', name: 'Starting', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Cranking' }] },
  { ch: '82', name: 'Water Injection', subs: [{ s: '00', n: 'General' }, { s: '10', n: 'Storage' }, { s: '20', n: 'Distribution' }, { s: '30', n: 'Dump & Purge' }, { s: '40', n: 'Indicating' }] },
  { ch: '91', name: 'Charts', subs: [{ s: '00', n: 'General' }] },
  { ch: '92', name: 'Electrical System Installation', subs: [{ s: '00', n: 'General' }] },
];

export default function ATAChapterSelector({ value, onChange, dark = true }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const ref = useRef(null);

  // Parse current value on mount
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      const ch = parts[0];
      const found = ATA_CHAPTERS.find(a => a.ch === ch);
      if (found) setSelectedChapter(found);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = ATA_CHAPTERS.filter(a =>
    !search ||
    a.ch.includes(search) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.subs.some(s => s.n.toLowerCase().includes(search.toLowerCase()))
  );

  const base = dark
    ? 'bg-[#1a1f2e] border-white/10 text-white placeholder-gray-600'
    : 'bg-secondary border-border text-foreground placeholder-muted-foreground';

  const selectSub = (chapter, sub) => {
    const val = `${chapter.ch}-${sub.s}`;
    onChange(val);
    setSelectedChapter(chapter);
    setOpen(false);
    setSearch('');
  };

  const clear = () => {
    onChange('');
    setSelectedChapter(null);
    setSearch('');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors',
          base
        )}
      >
        {value ? (
          <span className="font-mono font-bold text-primary">
            {value} {selectedChapter ? `— ${selectedChapter.name}` : ''}
          </span>
        ) : (
          <span className={dark ? 'text-gray-600' : 'text-muted-foreground'}>Select ATA chapter…</span>
        )}
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3 h-3 text-gray-400" />
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className={cn(
          'absolute z-50 mt-1 w-full rounded-xl border shadow-2xl overflow-hidden',
          dark ? 'bg-[#141922] border-white/10' : 'bg-card border-border'
        )}>
          {/* Search */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search ATA chapters…"
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedChapter(null); }}
                className={cn('w-full pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none', base)}
              />
            </div>
          </div>

          {/* Chapter list */}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No chapters found</p>
            ) : !selectedChapter || search ? (
              // Show chapters
              filtered.map(ch => (
                <button
                  key={ch.ch}
                  type="button"
                  onClick={() => { setSelectedChapter(ch); setSearch(''); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors',
                    dark ? 'text-white' : 'text-foreground'
                  )}
                >
                  <span className="text-xs font-mono font-bold text-primary w-6 flex-shrink-0">{ch.ch}</span>
                  <span className="text-xs">{ch.name}</span>
                  <span className="text-[10px] text-gray-500 ml-auto">{ch.subs.length} sub</span>
                </button>
              ))
            ) : (
              // Show sub-chapters
              <>
                <button
                  type="button"
                  onClick={() => setSelectedChapter(null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-white/5 border-b border-white/10"
                >
                  ← <span className="font-bold text-primary">{selectedChapter.ch}</span> {selectedChapter.name}
                </button>
                {selectedChapter.subs.map(sub => (
                  <button
                    key={sub.s}
                    type="button"
                    onClick={() => selectSub(selectedChapter, sub)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors',
                      dark ? 'text-white' : 'text-foreground'
                    )}
                  >
                    <span className="text-xs font-mono font-bold text-primary/70 w-10 flex-shrink-0">{selectedChapter.ch}-{sub.s}</span>
                    <span className="text-xs">{sub.n}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}