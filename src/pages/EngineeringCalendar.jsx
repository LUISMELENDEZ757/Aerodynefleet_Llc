import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Download } from 'lucide-react';
import EngineeringCalendarView from '@/components/calendar/EngineeringCalendarView';
import LiveClock from '@/components/ui/LiveClock';

export default function EngineeringCalendar() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const MOCK_EVENTS = [
    { id: 'mock-mx-1',  type: 'heavy_mx',  date: '2026-04-22', title: 'N455GJ — Engine Overhaul',       detail: 'CFM56-7B shop visit — EGT margin exceeded limits', meta: 'ATA 72 • 22,400/22,000h' },
    { id: 'mock-mx-2',  type: 'heavy_mx',  date: '2026-04-25', title: 'N801EB — C-Check',                detail: '6,000 FH check due — hangar slot confirmed at MIA MRO', meta: 'ATA 05 • 6,020/6,000h' },
    { id: 'mock-mx-3',  type: 'heavy_mx',  date: '2026-05-03', title: 'N337AX — Landing Gear Overhaul', detail: 'MLG/NLG 6-year overhaul due', meta: 'ATA 32 • 5,980/6,000 cycles' },
    { id: 'mock-mx-4',  type: 'heavy_mx',  date: '2026-05-12', title: 'N220UA — APU Shop Visit',         detail: 'Honeywell 131-9B compressor section overhaul', meta: 'ATA 49 • 8,100/8,000h' },
    { id: 'mock-mx-5',  type: 'heavy_mx',  date: '2026-05-18', title: 'N644AA — D-Check',                detail: 'Scheduled heavy structural inspection — ORD hangar', meta: 'ATA 05 • 24,000h check' },
    { id: 'mock-mel-1', type: 'mel_expiry', date: '2026-04-23', title: 'N455GJ MEL expires',             detail: 'R Thrust Reverser Isolation — CAT C deferral expires', meta: 'MEL • ATA 78' },
    { id: 'mock-mel-2', type: 'mel_expiry', date: '2026-04-28', title: 'N801EB MEL expires',             detail: 'Pack 2 partially inoperative — 10-day CAT B deferral', meta: 'MEL • ATA 21' },
    { id: 'mock-mel-3', type: 'mel_expiry', date: '2026-05-07', title: 'N337AX MEL expires',             detail: 'IRS 3 inoperative — CAT C deferral expires', meta: 'MEL • ATA 34' },
    { id: 'mock-mel-4', type: 'mel_expiry', date: '2026-05-14', title: 'N220UA MEL expires',             detail: 'Cabin pressure controller 2 inop', meta: 'MEL • ATA 21' },
    { id: 'mock-oos-1', type: 'grounding',  date: '2026-04-24', title: 'N644AA return to service',       detail: 'Grounded: Bird strike — nose radome damage', meta: 'Days OOS: 3' },
    { id: 'mock-oos-2', type: 'grounding',  date: '2026-04-29', title: 'N903DL return to service',       detail: 'Grounded: Hydraulic leak — left main gear', meta: 'Days OOS: 5' },
    { id: 'mock-oos-3', type: 'grounding',  date: '2026-05-09', title: 'N112SW return to service',       detail: 'Grounded: Engine 2 borescope inspection', meta: 'Days OOS: 4' },
    { id: 'mock-oos-4', type: 'grounding',  date: '2026-05-20', title: 'N455GJ return to service',       detail: 'Grounded: Engine overhaul shop visit', meta: 'Days OOS: 28' },
  ];

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['engineering-calendar-events'],
    queryFn: async () => {
      const [forecasts, melItems, oosEntries] = await Promise.all([
        base44.entities.MaintenanceForecast.list('-suggested_window_start', 500),
        base44.entities.MELItem.filter({ status: 'open' }, '-expires_at', 500),
        base44.entities.OOSEntry.list('-created_date', 100),
      ]);

      const calendarEvents = [...MOCK_EVENTS];

      // Heavy Maintenance Events
      forecasts.forEach(fc => {
        if (fc.suggested_window_start) {
          calendarEvents.push({
            id: `mx-${fc.id}`,
            type: 'heavy_mx',
            date: fc.suggested_window_start,
            title: `${fc.aircraft_tail} ${fc.component}`,
            detail: `Overhaul due in ${Math.max(0, fc.overhaul_interval_hours - fc.total_flight_hours)}h`,
            meta: `ATA ${fc.component} • ${Math.round(fc.total_flight_hours)}/${fc.overhaul_interval_hours}h`,
            data: fc,
          });
        }
      });

      // MEL Expiry Events
      melItems.forEach(mel => {
        if (mel.expires_at) {
          calendarEvents.push({
            id: `mel-${mel.id}`,
            type: 'mel_expiry',
            date: mel.expires_at,
            title: `${mel.aircraft_tail} MEL expires`,
            detail: mel.description || 'MEL deadline',
            meta: `MEL • ATA ${mel.ata_chapter}`,
            data: mel,
          });
        }
      });

      // Aircraft Groundings
      oosEntries.forEach(oos => {
        if (oos.estimated_return_date) {
          calendarEvents.push({
            id: `oos-${oos.id}`,
            type: 'grounding',
            date: oos.estimated_return_date,
            title: `${oos.aircraft_tail} return to service`,
            detail: `Grounded: ${oos.reason || 'Maintenance'}`,
            meta: `Days OOS: ${oos.days_out_of_service || '—'}`,
            data: oos,
          });
        }
      });

      return calendarEvents;
    },
    refetchInterval: 300000,
  });

  const handleExportCalendar = () => {
    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Aerodyne Fleet//Engineering Calendar//EN
CALSCALE:GREGORIAN
${events.map(evt => `BEGIN:VEVENT
UID:${evt.id}@aerodyne.local
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z
DTSTART:${evt.date.replace(/-/g, '')}
SUMMARY:${evt.title}
DESCRIPTION:${evt.detail}
CATEGORIES:${evt.type}
END:VEVENT`).join('\n')}
END:VCALENDAR`;

    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engineering-calendar-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <span>📅</span> Engineering Calendar
              </h1>
              <p className="text-xs text-primary tracking-widest uppercase">Fleet-wide MX & Groundings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LiveClock />
            <button onClick={() => refetch()}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={`w-4 h-4 text-foreground transition-transform ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleExportCalendar}
              className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export ICS
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-6xl mx-auto">
        <EngineeringCalendarView events={events} onEventClick={setSelectedEvent} onRefetch={refetch} isLoading={isLoading} />

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                {selectedEvent.type === 'heavy_mx' && <span className="text-2xl">🔧</span>}
                {selectedEvent.type === 'grounding' && <span className="text-2xl">⚠️</span>}
                {selectedEvent.type === 'mel_expiry' && <span className="text-2xl">📋</span>}
                <div>
                  <h2 className="font-bold text-foreground">{selectedEvent.title}</h2>
                  <p className="text-xs text-muted-foreground">{selectedEvent.meta}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selectedEvent.detail}</p>
              <button onClick={() => setSelectedEvent(null)}
                className="w-full py-2 rounded-lg bg-secondary text-foreground text-sm font-bold hover:bg-secondary/80">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}