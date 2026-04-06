import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ChevronLeft, Activity, Wrench, Droplets, TrendingUp,
  BarChart3, AlertTriangle, CheckCircle, Clock, Zap, CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EngineTrendAnalysis from '@/components/engineering/EngineTrendAnalysis';
import OilServiceTrends from '@/components/engineering/OilServiceTrends';
import ApuTrendDashboard from '@/components/engineering/ApuTrendDashboard';
import MaintenanceForecastModule from '@/components/engineering/MaintenanceForecastModule';

const TABS = [
  { id: 'trends',   label: 'Engine Trend Analysis', icon: TrendingUp },
  { id: 'oil',      label: 'Oil Servicing Trends',   icon: Droplets },
  { id: 'apu',      label: 'APU Trends',             icon: Zap },
  { id: 'forecast', label: 'Maintenance Forecast',   icon: CalendarDays },
];

export default function EngineeringDashboard() {
  const [activeTab, setActiveTab] = useState('trends');
  const [selectedTail, setSelectedTail] = useState('');

  const { data: aircraft = [] } = useQuery({
    queryKey: ['eng-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 200),
  });

  const { data: logbookEntries = [] } = useQuery({
    queryKey: ['eng-logbook', selectedTail],
    queryFn: () =>
      selectedTail
        ? base44.entities.LogbookEntry.filter({ aircraft_tail: selectedTail })
        : base44.entities.LogbookEntry.list('-created_date', 500),
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['eng-faults', selectedTail],
    queryFn: () =>
      selectedTail
        ? base44.entities.FaultMessage.filter({ aircraft_tail: selectedTail })
        : base44.entities.FaultMessage.list('-created_date', 500),
  });

  // Summary stats
  const oilEntries = logbookEntries.filter(e =>
    e.ata_chapter === '79' || (e.description || '').includes('[OIL SERVICE]')
  );
  const engineFaults = faults.filter(f => f.system === 'engine');
  const activeFaults  = faults.filter(f => f.status === 'active');
  const apuFaults     = faults.filter(f => f.system === 'apu');

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">Engineering Dashboard</p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Trend Analysis · Engine Health</p>
          </div>
        </div>

        {/* Aircraft selector */}
        <select
          value={selectedTail}
          onChange={e => setSelectedTail(e.target.value)}
          className="bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="">All Aircraft</option>
          {aircraft.map(a => (
            <option key={a.id} value={a.tail_number}>{a.tail_number} — {a.aircraft_type}</option>
          ))}
        </select>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pt-5">
        {[
          { label: 'Oil Service Events',  value: oilEntries.length,   icon: Droplets,      color: 'text-cyan-400',   bg: 'bg-cyan-600/20' },
          { label: 'Engine Faults',       value: engineFaults.length, icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-600/20' },
          { label: 'Active Faults',       value: activeFaults.length, icon: Wrench,        color: 'text-amber-400',  bg: 'bg-amber-600/20' },
          { label: 'APU Faults',          value: apuFaults.length,    icon: BarChart3,     color: 'text-purple-400', bg: 'bg-purple-600/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-5 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === id
                ? 'bg-emerald-600 text-white'
                : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 mt-5">
        {activeTab === 'trends' && (
          <EngineTrendAnalysis
            faults={faults}
            logbookEntries={logbookEntries}
            aircraft={aircraft}
            selectedTail={selectedTail}
          />
        )}
        {activeTab === 'oil' && (
          <OilServiceTrends
            logbookEntries={logbookEntries}
            aircraft={aircraft}
            selectedTail={selectedTail}
          />
        )}
        {activeTab === 'apu' && (
          <ApuTrendDashboard
            faults={faults}
            aircraft={aircraft}
            selectedTail={selectedTail}
          />
        )}
        {activeTab === 'forecast' && (
          <MaintenanceForecastModule aircraft={aircraft} />
        )}
      </div>
    </div>
  );
}