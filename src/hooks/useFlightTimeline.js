import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Fetches timeline events for a specific flight's OOS entries.
 * Returns a merged, chronologically sorted timeline.
 */
export function useFlightTimeline(flightNumber, enabled = true) {
  const { data: oos = [], isLoading: oosLoading } = useQuery({
    queryKey: ['timeline-oos', flightNumber],
    queryFn: () => base44.entities.OOSEntry.filter({ flight_number: flightNumber }),
    enabled: !!flightNumber && enabled,
  });

  const oosIds = oos.map(o => o.id);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['timeline-events', flightNumber, oosIds.join(',')],
    queryFn: async () => {
      if (oosIds.length === 0) return [];
      const all = await Promise.all(
        oosIds.map(id => base44.entities.TimelineEvent.filter({ oos_entry_id: id }))
      );
      return all.flat().sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));
    },
    enabled: !!flightNumber && enabled && oosIds.length > 0,
  });

  // Build a unified flight timeline from flight status changes + MX events
  const flightTimeline = [
    ...events.map(e => ({
      id: e.id,
      time: e.event_time,
      title: e.title,
      description: e.description,
      type: e.event_type,
      is_aog: e.is_aog,
      progress: e.progress_percent,
      source: 'mx',
    })),
  ].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return {
    timeline: flightTimeline,
    oosEntries: oos,
    isLoading: oosLoading || eventsLoading,
  };
}