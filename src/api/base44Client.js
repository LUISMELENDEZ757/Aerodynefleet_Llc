import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Priority: appBaseUrl (Base44 preview) > empty string (uses current host) > /api (Vercel)
const serverUrl = appBaseUrl 
  ? `${appBaseUrl}/api` 
  : typeof window !== 'undefined' && window.location.hostname.includes('base44.app')
  ? '' // Use current host for Base44 preview
  : typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
  ? '/api'
  : 'https://api.base44.com';

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl,
  requiresAuth: false,
  appBaseUrl: appBaseUrl || undefined
});