import { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'technician_offline_queue';

export function useOfflineTechnician() {
  const [queue, setQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Load queue from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load offline queue:', e);
      }
    }
  }, []);

  // Listen for connection changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when connection restored
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      syncQueue();
    }
  }, [isOnline]);

  // Queue an operation for later sync
  const queueOperation = useCallback((operation, entity, id, data) => {
    const update = {
      id: `${Date.now()}-${Math.random()}`,
      operation,
      entity,
      id,
      data,
      timestamp: new Date().toISOString(),
    };

    setQueue(prev => {
      const updated = [...prev, update];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return update.id;
  }, []);

  // Sync all queued operations
  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await base44.functions.invoke('syncOfflineUpdates', { updates: queue });

      if (res.data?.errors?.length > 0) {
        setSyncError(`${res.data.failed} operations failed to sync`);
      }

      // Remove successfully synced items
      const synced = new Set(
        res.data?.results
          ?.filter(r => r.status === 'synced')
          .map(r => r.id)
      );

      setQueue(prev => {
        const remaining = prev.filter(item => !synced.has(item.id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        return remaining;
      });

      return res.data;
    } catch (err) {
      setSyncError(err.message);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [queue, isSyncing]);

  // Clear queue manually
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    queue,
    isOnline,
    isSyncing,
    syncError,
    queueOperation,
    syncQueue,
    clearQueue,
    pendingCount: queue.length,
  };
}