import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, Activity, Plus, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import MccKpiBar from '@/components/mcc/MccKpiBar';
import MccFleetStatus from '@/components/mcc/MccFleetStatus';
import MccOosBoard from '@/components/mcc/MccOosBoard';
import MccMelBoard from '@/components/mcc/MccMelBoard';
import MccFaultBoard from '@/components/mcc/MccFaultBoard';
import MccPartsBoard from '@/components/mcc/MccPartsBoard';
import MccToolingBoard from '@/components/mcc/MccToolingBoard';
import AddAircraftWizard from '@/components/fleet/AddAircraftWizard';

const TABS = [
  { id: 'fleet',    label: 'Fleet Status' },
  { id: 'oos',      label: 'OOS / MX' },
  { id: 'mel',      label: 'MEL' },
  { id: 'faults',   label: 'Faults' },
  { id: 'parts',    label: 'Parts' },
  { id: 'tooling',  label: 'Tooling' },
];

export default function MaintenanceControl() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const queryClient = useQueryClient();

  const handleRemoveClick = () => {
    if (selectedForDelete) {
      base44.entities.Aircraft.delete(selectedForDelete).then(() => {
        setSelectedForDelete(null);
        setRemoveMode(false);
        queryClient.invalidateQueries({ queryKey: ['mcc-aircraft'] });
      });
    } else {
      setRemoveMode(v => !v);
    }
  };

  const { data: aircraft = [] } = useQuery({
    queryKey: ['mcc-aircraft'],
    queryFn: () => base44.entities.Aircraft.list('tail_number', 1000),
    refetchInterval: 60000,
  });

  const { data: oosEntries = [] } = useQuery({
    queryKey: ['mcc-oos'],
    queryFn: () => base44.entities.OOSEntry.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['mcc-mel'],
    queryFn: () => base44.entities.MELItem.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['mcc-faults'],
    queryFn: () => base44.entities.FaultMessage.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['mcc-parts'],
    queryFn: () => base44.entities.Part.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['mcc-tools'],
    queryFn: () => base44.entities.Tool.list('-created_date', 500),
    refetchInterval: 60000,
  });

  const { data: logbookEntries = [] } = useQuery({
    queryKey: ['mcc-logbook'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 1000),
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0d1117] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">Maintenance Control</p>
            <p className="text-[10px] text-orange-400 tracking-widest uppercase font-bold">MCC · Fleet Oversight · TechOps Command</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* KPI Bar */}
      <MccKpiBar
        aircraft={aircraft}
        oosEntries={oosEntries}
        melItems={melItems}
        faults={faults}
        parts={parts}
        tools={tools}
      />

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-4 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0',
              activeTab === id
                ? 'bg-orange-600 text-white'
                : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {showAddWizard && (
        <AddAircraftWizard
          onClose={() => setShowAddWizard(false)}
          onSuccess={() => { setShowAddWizard(false); queryClient.invalidateQueries({ queryKey: ['mcc-aircraft'] }); }}
        />
      )}

      {/* Tab Content */}
      <div className="px-5 mt-5">
        {activeTab === 'fleet' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowAddWizard(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-extrabold hover:bg-orange-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Aircraft
              </button>
              <button
                onClick={handleRemoveClick}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-colors',
                  removeMode
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-red-900/40 border border-red-600/50 text-red-400 hover:bg-red-900/60'
                )}
              >
                <X className="w-3.5 h-3.5" />
                {removeMode ? (selectedForDelete ? 'Confirm Remove' : 'Cancel') : 'Remove Aircraft'}
              </button>
            </div>
            {removeMode && (
              <div className="mb-3 px-4 py-2.5 rounded-xl bg-red-900/30 border border-red-600/40 text-xs text-red-300 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Click an aircraft card to select it, then click "Confirm Remove"
              </div>
            )}
            <MccFleetStatus
              aircraft={aircraft}
              oosEntries={oosEntries}
              logbookEntries={logbookEntries}
              removeMode={removeMode}
              selectedForDelete={selectedForDelete}
              onSelectForDelete={(id) => setSelectedForDelete(prev => prev === id ? null : id)}
            />
          </>
        )}
        {activeTab === 'oos'     && <MccOosBoard oosEntries={oosEntries} aircraft={aircraft} />}
        {activeTab === 'mel'     && <MccMelBoard melItems={melItems} aircraft={aircraft} />}
        {activeTab === 'faults'  && <MccFaultBoard faults={faults} aircraft={aircraft} />}
        {activeTab === 'parts'   && <MccPartsBoard parts={parts} oosEntries={oosEntries} />}
        {activeTab === 'tooling' && <MccToolingBoard tools={tools} />}
      </div>
    </div>
  );
}