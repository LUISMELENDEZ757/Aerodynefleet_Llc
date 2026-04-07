import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Determine the serverUrl: use appBaseUrl if available, otherwise use Base44 API
const serverUrl = appBaseUrl ? `${appBaseUrl}/api` : 'https://api.base44.com';

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl: appBaseUrl || undefined
});