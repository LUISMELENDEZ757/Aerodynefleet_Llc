import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Scale, Plane, Calculator, ChevronLeft, AlertTriangle,
  CheckCircle, TrendingUp, TrendingDown, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Constants per aircraft type (example values) ───────────────────────────────
const AIRCRAFT_WEIGHTS = {
  'B737-800': {
    bow: 91500, // Basic Operating Weight lbs
    mtow: 174200, // Max Takeoff Weight lbs
    mlw: 146300, // Max Landing Weight lbs
    mzw: 138300, // Max Zero Fuel Weight lbs
    fuelCapacity: 6870, // gallons
    fuelDensity: 6.7, // lbs/gallon
  },
  'B737-700': {
    bow: 84700,
    mtow: 154500,
    mlw: 133500,
    mzw: 128000,
    fuelCapacity: 6870,
    fuelDensity: 6.7,
  },
  'A320': {
    bow: 93900,
    mtow: 172000,
    mlw: 142000,
    mzw: 138000,
    fuelCapacity: 6400,
    fuelDensity: 6.7,
  },
};

// ── Input Field Component ───────────────────────────────────────────────────────
function InputField({ label, value, onChange, unit, placeholder, min = 0, step = 1, warning }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          min={min}
          step={step}
          className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-primary transition-colors font-mono"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">
            {unit}
          </span>
        )}
      </div>
      {warning && <p className="text-[10px] text-amber-400 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{warning}</p>}
    </div>
  );
}

// ── Result Card Component ───────────────────────────────────────────────────────
function ResultCard({ label, value, unit, sublabel, color = 'text-white', warning }) {
  return (
    <div className={cn('rounded-xl border p-3', warning ? 'border-amber-500/40 bg-amber-900/10' : 'border-white/10 bg-[#0d1117]')}>
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={cn('text-xl font-black font-mono', color)}>{value.toLocaleString()} <span className="text-xs font-bold">{unit}</span></p>
      {sublabel && <p className="text-[10px] text-gray-600 mt-1">{sublabel}</p>}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────────
export default function BORROBDashboard() {
  const [selectedAircraft, setSelectedAircraft] = useState('B737-800');
  const [bow, setBow] = useState(null);
  const [payload, setPayload] = useState(0);
  const [fuel, setFuel] = useState(0);
  const [cargo, setCargo] = useState(0);
  const [passengers, setPassengers] = useState(0);

  const { data: aircraft = [] } = useQuery({
    queryKey: ['bor-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 500),
    refetchInterval: 60000,
  });

  const acConfig = AIRCRAFT_WEIGHTS[selectedAircraft] || AIRCRAFT_WEIGHTS['B737-800'];
  const actualBow = bow || acConfig.bow;

  // Calculations
  const fuelWeight = fuel * acConfig.fuelDensity;
  const paxWeight = passengers * 185; // avg passenger + baggage
  const totalPayload = payload + cargo + paxWeight;
  const tzfw = actualBow + totalPayload; // Total Zero Fuel Weight
  const tow = tzfw + fuelWeight; // Takeoff Weight
  const lw = tow - (fuelWeight * 0.3); // Estimated landing weight (assume 70% fuel burn)

  const robMtow = acConfig.mtow - tow;
  const robMlw = acConfig.mlw - lw;
  const robMzw = acConfig.mzw - tzfw;

  const isOverMtow = tow > acConfig.mtow;
  const isOverMlw = lw > acConfig.mlw;
  const isOverMzw = tzfw > acConfig.mzw;

  const uniqueTypes = [...new Set(aircraft.map(a => a.aircraft_type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0e18] px-5 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-black text-primary tracking-widest uppercase">BOR/ROB Calculator</h1>
              <p className="text-xs text-gray-500">Basic Operating Weight · Remaining Operating Balance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Aircraft Selection */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" /> Select Aircraft Type
          </p>
          <select
            value={selectedAircraft}
            onChange={(e) => setSelectedAircraft(e.target.value)}
            className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary"
          >
            {uniqueTypes.length > 0 ? (
              uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))
            ) : (
              Object.keys(AIRCRAFT_WEIGHTS).map(type => (
                <option key={type} value={type}>{type}</option>
              ))
            )}
          </select>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
            <div className="bg-[#0d1117] rounded-lg px-3 py-2">
              <p className="text-gray-600">BOW (Default)</p>
              <p className="text-white font-bold font-mono">{acConfig.bow.toLocaleString()} lbs</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg px-3 py-2">
              <p className="text-gray-600">MTOW</p>
              <p className="text-white font-bold font-mono">{acConfig.mtow.toLocaleString()} lbs</p>
            </div>
          </div>
        </div>

        {/* BOW Override */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Weight Inputs
          </p>
          <InputField
            label="Actual BOW (optional override)"
            value={bow || ''}
            onChange={setBow}
            unit="lbs"
            placeholder={acConfig.bow.toString()}
          />
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Payload (Cargo + Mail)"
              value={payload}
              onChange={setPayload}
              unit="lbs"
              placeholder="0"
            />
            <InputField
              label="Bulk Cargo"
              value={cargo}
              onChange={setCargo}
              unit="lbs"
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Passengers"
              value={passengers}
              onChange={setPassengers}
              unit="pax"
              placeholder="0"
              step={1}
            />
            <InputField
              label="Fuel On Board"
              value={fuel}
              onChange={setFuel}
              unit="gal"
              placeholder="0"
              step={10}
              warning={fuel > acConfig.fuelCapacity ? `Exceeds capacity (${acConfig.fuelCapacity} gal)` : null}
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          <p className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Weight Summary
          </p>

          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Total ZFW" value={Math.round(tzfw)} unit="lbs" sublabel={`Max: ${acConfig.mzw.toLocaleString()}`} color={isOverMzw ? 'text-red-400' : 'text-white'} warning={isOverMzw} />
            <ResultCard label="Takeoff Weight" value={Math.round(tow)} unit="lbs" sublabel={`Max: ${acConfig.mtow.toLocaleString()}`} color={isOverMtow ? 'text-red-400' : 'text-white'} warning={isOverMtow} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Est. Landing Wt" value={Math.round(lw)} unit="lbs" sublabel={`Max: ${acConfig.mlw.toLocaleString()}`} color={isOverMlw ? 'text-red-400' : 'text-white'} warning={isOverMlw} />
            <ResultCard label="Fuel Weight" value={Math.round(fuelWeight)} unit="lbs" sublabel={`${fuel} gal × ${acConfig.fuelDensity} lbs/gal`} color="text-cyan-400" />
          </div>
        </div>

        {/* ROB */}
        <div className="space-y-3">
          <p className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-400" /> Remaining Operating Balance
          </p>

          <div className="grid grid-cols-3 gap-3">
            <ResultCard
              label="ROB MTOW"
              value={Math.round(robMtow)}
              unit="lbs"
              color={robMtow < 0 ? 'text-red-400' : robMtow < 2000 ? 'text-amber-400' : 'text-green-400'}
              warning={robMtow < 0 ? 'OVER LIMIT' : robMtow < 2000 ? 'LOW MARGIN' : null}
            />
            <ResultCard
              label="ROB MLW"
              value={Math.round(robMlw)}
              unit="lbs"
              color={robMlw < 0 ? 'text-red-400' : robMlw < 2000 ? 'text-amber-400' : 'text-green-400'}
              warning={robMlw < 0 ? 'OVER LIMIT' : robMlw < 2000 ? 'LOW MARGIN' : null}
            />
            <ResultCard
              label="ROB MZW"
              value={Math.round(robMzw)}
              unit="lbs"
              color={robMzw < 0 ? 'text-red-400' : robMzw < 2000 ? 'text-amber-400' : 'text-green-400'}
              warning={robMzw < 0 ? 'OVER LIMIT' : robMzw < 2000 ? 'LOW MARGIN' : null}
            />
          </div>
        </div>

        {/* Status Banner */}
        {(isOverMtow || isOverMlw || isOverMzw) ? (
          <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/40 rounded-2xl p-4">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-400 uppercase tracking-widest">⚠ Weight Limit Exceeded</p>
              <p className="text-xs text-red-300 mt-1">
                {isOverMtow && 'MTOW exceeded. '}
                {isOverMlw && 'MLW exceeded. '}
                {isOverMzw && 'MZFW exceeded. '}
                Reduce payload or fuel before dispatch.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/40 rounded-2xl p-4">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-400 uppercase tracking-widest">✓ Within Limits</p>
              <p className="text-xs text-green-300 mt-1">
                All weight parameters are within operational limits. Cleared for dispatch.
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">BOR/ROB Reference</p>
              <ul className="text-[10px] text-gray-500 space-y-0.5">
                <li><strong className="text-gray-300">BOR (Basic Operating Weight):</strong> Aircraft empty weight + crew + unusable fuel + oil</li>
                <li><strong className="text-gray-300">ROB (Remaining Operating Balance):</strong> Margin between actual weight and maximum limits</li>
                <li><strong className="text-gray-300">MTOW:</strong> Maximum Takeoff Weight</li>
                <li><strong className="text-gray-300">MLW:</strong> Maximum Landing Weight</li>
                <li><strong className="text-gray-300">MZFW:</strong> Maximum Zero Fuel Weight</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}