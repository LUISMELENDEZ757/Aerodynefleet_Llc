import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// On Vercel: use relative /api path (proxies to Base44)
// In dev: use appBaseUrl if available, otherwise fall back to /api
const serverUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '/api'
  : appBaseUrl ? `${appBaseUrl}/api` : '/api';

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl: appBaseUrl || undefined
});