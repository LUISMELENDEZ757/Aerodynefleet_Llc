/**
 * Offline Storage Manager
 * Persists query data to localStorage and manages offline mutation queue
 */

const OFFLINE_QUEUE_KEY = 'aerodyne_offline_queue';
const QUERY_CACHE_KEY = 'aerodyne_query_cache';

export const offlineStore = {
  // Persist query cache to localStorage
  persistCache: (cacheData) => {
    try {
      localStorage.setItem(QUERY_CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.warn('Failed to persist query cache:', err);
    }
  },

  // Restore query cache from localStorage
  restoreCache: () => {
    try {
      const cached = localStorage.getItem(QUERY_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (err) {
      console.warn('Failed to restore query cache:', err);
      return {};
    }
  },

  // Add mutation to offline queue
  queueMutation: (id, mutation) => {
    try {
      const queue = offlineStore.getQueue();
      queue.push({
        id,
        mutation,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.warn('Failed to queue mutation:', err);
    }
  },

  // Get offline mutation queue
  getQueue: () => {
    try {
      const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (err) {
      console.warn('Failed to get queue:', err);
      return [];
    }
  },

  // Clear mutation from queue
  dequeueMutation: (id) => {
    try {
      const queue = offlineStore.getQueue();
      const filtered = queue.filter(m => m.id !== id);
      if (filtered.length === 0) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
      }
    } catch (err) {
      console.warn('Failed to dequeue mutation:', err);
    }
  },

  // Clear entire queue
  clearQueue: () => {
    try {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (err) {
      console.warn('Failed to clear queue:', err);
    }
  },
};