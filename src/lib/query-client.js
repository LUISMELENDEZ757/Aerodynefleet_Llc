import { QueryClient } from '@tanstack/react-query';
import { offlineStore } from '@/lib/offline-store';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 1000 * 60 * 5, // 5 min
			gcTime: 1000 * 60 * 30, // 30 min (was cacheTime)
		},
	},
});

// Persist cache changes to localStorage
queryClientInstance.getQueryCache().subscribe(event => {
	if (event.type === 'updated' && event.action.type === 'success') {
		const cache = {};
		queryClientInstance.getQueryCache().getAll().forEach(query => {
			cache[query.queryHash] = query.state;
		});
		offlineStore.persistCache(cache);
	}
});