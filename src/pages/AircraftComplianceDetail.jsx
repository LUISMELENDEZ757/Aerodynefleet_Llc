import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Globe, Shield, Radio, Zap, AlertTriangle, CheckCircle,
  Plane, MapPin, Clock, Wrench, Fuel, Wind, ChevronDown, ChevronUp,
  X, FileText, Package, Cpu, BookOpen, Settings, User, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AircraftHeader from '@/components/aircraft-detail/AircraftHeader';
import RestrictedMELPanel from '@/components/aircraft-detail/RestrictedMELPanel';
import AircraftStatusBlock from '@/components/aircraft-detail/AircraftStatusBlock';
import OpenMELTable from '@/components/aircraft-detail/OpenMELTable';
import UpcomingMaintenance from '@/components/aircraft-detail/UpcomingMaintenance';
import FlightHistoryTimeline from '@/components/aircraft-detail/FlightHistoryTimeline';
import PartsComponents from '@/components/aircraft-detail/PartsComponents';
import EngineeringNotes from '@/components/aircraft-detail/EngineeringNotes';
import DocumentsSection from '@/components/aircraft-detail/DocumentsSection';

const SECTIONS = [
  { id: 'restrictions', label: 'Restrictions', icon: AlertTriangle },
  { id: 'status', label: 'Status', icon: Plane },
  { id: 'mels', label: 'Open MELs', icon: Zap },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'parts', label: 'Parts', icon: Package },
  { id: 'engineering', label: 'Engineering', icon: Cpu },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export default function AircraftComplianceDetail() {
  const [activeSection, setActiveSection] = useState('restrictions');

  // Get tail from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tailNumber = urlParams.get('tail') || '';

  const { data: aircraft, isLoading: loadingAircraft } = useQuery({
    queryKey: ['aircraft-detail', tailNumber],
    queryFn: () => base44.entities.Aircraft.filter({ tail_number: tailNumber }),
    enabled: !!tailNumber,
    select: (data) => data[0],
  });

  const { data: melItems = [] } = useQuery({
    queryKey: ['mel-items-tail', tailNumber],
    queryFn: () => base44.entities.MELItem.filter({ aircraft_tail: tailNumber }),
    enabled: !!tailNumber,
  });

  const { data: complianceStatus } = useQuery({
    queryKey: ['mel-compliance-tail', tailNumber],
    queryFn: () => base44.entities.MELComplianceStatus.filter({ tail_number: tailNumber }),
    enabled: !!tailNumber,
    select: (data) => data[0],
  });

  const { data: deferrals = [] } = useQuery({
    queryKey: ['mel-deferrals-tail', tailNumber],
    queryFn: () => base44.entities.MELDeferral.filter({ tail_number: tailNumber }),
    enabled: !!tailNumber,
  });

  const { data: logEntries = [] } = useQuery({
    queryKey: ['logbook-tail', tailNumber],
    queryFn: () => base44.entities.LogbookEntry.filter({ aircraft_tail: tailNumber }),
    enabled: !!tailNumber,
  });

  const { data: workPackages = [] } = useQuery({
    queryKey: ['work-packages-tail', tailNumber],
    queryFn: () => base44.entities.WorkPackage.filter({ aircraft_tail: tailNumber }),
    enabled: !!tailNumber,
  });

  const { data: engineParts = [] } = useQuery({
    queryKey: ['engine-parts-tail', tailNumber],
    queryFn: () => base44.entities.EnginePartInventory.filter({ aircraft_tail: tailNumber }),
    enabled: !!tailNumber,
  });

  if (!tailNumber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Plane className="w-16 h-16 text-muted-foreground mx-auto" />
          <p className="text-lg font-bold text-foreground">No aircraft selected</p>
          <p className="text-sm text-muted-foreground">Add ?tail=N123AB to the URL</p>
          <Link to="/FleetDashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            <ChevronLeft className="w-4 h-4" /> Back to Fleet
          </Link>
        </div>
      </div>
    );
  }

  if (loadingAircraft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const openMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Aircraft Header */}
      <AircraftHeader
        aircraft={aircraft}
        tailNumber={tailNumber}
        complianceStatus={complianceStatus}
        openMelCount={openMels.length}
      />

      {/* Section Nav */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 py-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeSection === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Content */}
      <div className="px-4 pt-5 space-y-5">
        {activeSection === 'restrictions' && (
          <RestrictedMELPanel
            melItems={openMels}
            complianceStatus={complianceStatus}
            deferrals={deferrals}
          />
        )}
        {activeSection === 'status' && (
          <AircraftStatusBlock aircraft={aircraft} melItems={openMels} />
        )}
        {activeSection === 'mels' && (
          <OpenMELTable melItems={openMels} deferrals={deferrals} />
        )}
        {activeSection === 'maintenance' && (
          <UpcomingMaintenance workPackages={workPackages} melItems={openMels} />
        )}
        {activeSection === 'history' && (
          <FlightHistoryTimeline logEntries={logEntries} tailNumber={tailNumber} />
        )}
        {activeSection === 'parts' && (
          <PartsComponents engineParts={engineParts} tailNumber={tailNumber} />
        )}
        {activeSection === 'engineering' && (
          <EngineeringNotes logEntries={logEntries} tailNumber={tailNumber} />
        )}
        {activeSection === 'documents' && (
          <DocumentsSection tailNumber={tailNumber} logEntries={logEntries} />
        )}
      </div>
    </div>
  );
}