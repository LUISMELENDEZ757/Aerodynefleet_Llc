import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, AlertTriangle, Plane, Zap, Wrench, Clock, Package, Cpu, FileText, List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AircraftHeader from '@/components/aircraft-detail/AircraftHeader';
import CatCapabilityBadge from '@/components/techops/CatCapabilityBadge';
import EtopsCapabilityBadge from '@/components/techops/EtopsCapabilityBadge';
import RestrictedMELPanel from '@/components/aircraft-detail/RestrictedMELPanel';
import AircraftStatusBlock from '@/components/aircraft-detail/AircraftStatusBlock';
import OpenMELTable from '@/components/aircraft-detail/OpenMELTable';
import CDLItemsTable from '@/components/aircraft-detail/CDLItemsTable';
import UpcomingMaintenance from '@/components/aircraft-detail/UpcomingMaintenance';
import FlightHistoryTimeline from '@/components/aircraft-detail/FlightHistoryTimeline';
import PartsComponents from '@/components/aircraft-detail/PartsComponents';
import EngineeringNotes from '@/components/aircraft-detail/EngineeringNotes';
import DocumentsSection from '@/components/aircraft-detail/DocumentsSection';

const SECTIONS = [
  { id: 'restrictions', label: 'Restrictions', icon: AlertTriangle },
  { id: 'status',       label: 'Status',       icon: Plane },
  { id: 'mels',         label: 'Open MELs',    icon: Zap },
  { id: 'cdl',          label: 'CDL',          icon: List },
  { id: 'maintenance',  label: 'Maintenance',  icon: Wrench },
  { id: 'history',      label: 'History',      icon: Clock },
  { id: 'parts',        label: 'Parts',        icon: Package },
  { id: 'engineering',  label: 'Engineering',  icon: Cpu },
  { id: 'documents',    label: 'Documents',    icon: FileText },
];

export default function AircraftComplianceDetail() {
  const [searchParams] = useSearchParams();
  const tailParam = searchParams.get('tail') || '';

  const sectionRefs = useRef({});

  const scrollTo = (id) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // If no tail param, fetch first aircraft to display something useful
  const { data: firstAircraft } = useQuery({
    queryKey: ['aircraft-first'],
    queryFn: () => base44.entities.Aircraft.list('-created_date', 1),
    enabled: !tailParam,
    select: (data) => data[0],
  });

  const tailNumber = tailParam || firstAircraft?.tail_number || '';

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

  if (loadingAircraft || !tailNumber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const openMels = melItems.filter(m => m.status !== 'cleared' && m.status !== 'voided');

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Aircraft Header ── */}
      <AircraftHeader
        aircraft={aircraft}
        tailNumber={tailNumber}
        complianceStatus={complianceStatus}
        openMelCount={openMels.length}
      />

      {/* ── CAT + ETOPS Capability Badges ── */}
      <div className="px-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <CatCapabilityBadge aircraft={aircraft} melItems={openMels} />
        <EtopsCapabilityBadge aircraft={aircraft} melItems={openMels} />
      </div>

      {/* ── Sticky Section Jump Nav ── */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 py-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── All Sections — scrollable single page ── */}
      <div className="px-4 pt-6 space-y-10">

        <section ref={el => sectionRefs.current['restrictions'] = el}>
          <RestrictedMELPanel
            melItems={openMels}
            complianceStatus={complianceStatus}
            deferrals={deferrals}
          />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['status'] = el}>
          <AircraftStatusBlock aircraft={aircraft} melItems={openMels} />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['mels'] = el}>
          <OpenMELTable melItems={openMels} deferrals={deferrals} />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['cdl'] = el}>
          <CDLItemsTable melItems={openMels} />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['maintenance'] = el}>
          <UpcomingMaintenance workPackages={workPackages} melItems={openMels} />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['history'] = el}>
          <FlightHistoryTimeline logEntries={logEntries} tailNumber={tailNumber} />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['parts'] = el}>
          <PartsComponents engineParts={engineParts} tailNumber={tailNumber} />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['engineering'] = el}>
          <EngineeringNotes logEntries={logEntries} tailNumber={tailNumber} />
        </section>

        <div className="border-t border-border/40" />

        <section ref={el => sectionRefs.current['documents'] = el}>
          <DocumentsSection tailNumber={tailNumber} logEntries={logEntries} />
        </section>

      </div>
    </div>
  );
}