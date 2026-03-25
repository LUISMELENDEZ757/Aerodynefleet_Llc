import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hook to bridge OpsAlertsPanel with CommCenter and Starlink systems
 * Manages alert broadcasting to ACARS, broadcast channels, and future Starlink integration
 */
export function useCommSystemBridge() {
  const [commStatus, setCommStatus] = useState(null);

  // Monitor Starlink terminal status for future integration
  const { data: starlinkTerminals = [] } = useQuery({
    queryKey: ['starlink-terminals'],
    queryFn: () => base44.entities.StarlinkTerminal.list(),
    refetchInterval: 30000,
    staleTime: 20000,
  });

  // Monitor active ACARS channels
  const { data: commMessages = [] } = useQuery({
    queryKey: ['comm-channels-status'],
    queryFn: () => base44.entities.CommMessage.filter({ message_type: 'acars' }),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // Update comm status based on available channels
  useEffect(() => {
    const activeTerminals = starlinkTerminals.filter(t => t.activation_status === 'active');
    const commChannels = commMessages.length > 0;

    setCommStatus({
      connected: activeTerminals.length > 0 || commChannels,
      type: activeTerminals.length > 0 ? 'starlink' : 'acars',
      channels: {
        acars: commChannels,
        starlink: activeTerminals.length,
      },
    });
  }, [starlinkTerminals, commMessages]);

  // Send alert through comm system (debounced to prevent rate limiting)
  const sendAlert = useCallback(
    async (alert) => {
      try {
        // Broadcast to ACARS if available
        if (alert.channels?.includes('acars')) {
          await base44.entities.CommMessage.create({
            channel: 'dispatch',
            sender_name: 'SYSTEM',
            sender_email: 'system@aerodyne.local',
            sender_role: 'dispatcher',
            content: `[ALERT] ${alert.title}: ${alert.message}`,
            flight_number: alert.flight_number,
            message_type: 'acars',
            priority: alert.severity === 'critical' ? 'urgent' : 'normal',
            target_roles: alert.target_roles || ['all'],
          });
        }

        // Broadcast to all crew if broadcast channel specified
        if (alert.channels?.includes('broadcast')) {
          await base44.entities.CommMessage.create({
            channel: 'ops-general',
            sender_name: 'SYSTEM',
            sender_email: 'system@aerodyne.local',
            sender_role: 'dispatcher',
            content: `[BROADCAST] ${alert.title}: ${alert.message}`,
            flight_number: alert.flight_number,
            message_type: 'broadcast',
            priority: alert.severity === 'critical' ? 'emergency' : 'normal',
            target_roles: alert.target_roles || ['all'],
          });
        }

        // Future: Starlink integration point
        if (
          alert.channels?.includes('starlink') &&
          starlinkTerminals.some(t => t.activation_status === 'active')
        ) {
          console.debug('[Starlink Integration] Ready to route alert:', alert);
        }

        return { success: true };
      } catch (error) {
        // Silently handle rate limit errors to prevent console spam
        if (error?.status === 429) {
          return { success: false, rateLimited: true };
        }
        console.error('Failed to send alert through comm system:', error);
        return { success: false, error };
      }
    },
    [starlinkTerminals]
  );

  return {
    commStatus,
    sendAlert,
    availableChannels: commStatus?.channels || { acars: false, starlink: false },
  };
}