import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { offlineStore } from '@/lib/offline-store';

/**
 * Hook to detect online/offline status and sync mutations when reconnected
 */
export default function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' && navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const queryClient = useQueryClient();

  // Monitor online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Trigger sync after brief delay to ensure connection is stable
      setTimeout(() => syncOfflineQueue(), 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync queued mutations when online
  const syncOfflineQueue = async () => {
    if (!isOnline || syncInProgress) return;

    setSyncInProgress(true);
    try {
      const queue = offlineStore.getQueue();
      if (queue.length === 0) {
        setSyncInProgress(false);
        return;
      }

      for (const { id, mutation } of queue) {
        try {
          // Retry the mutation
          const { entity, method, args } = mutation;
          const entity_obj = base44.entities[entity];

          if (entity_obj && entity_obj[method]) {
            await entity_obj[method](...args);
            offlineStore.dequeueMutation(id);
          }
        } catch (err) {
          console.warn(`Failed to sync mutation ${id}:`, err);
          // Leave in queue for next attempt
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (err) {
      console.error('Offline sync error:', err);
    } finally {
      setSyncInProgress(false);
    }
  };

  return { isOnline, syncInProgress };
}