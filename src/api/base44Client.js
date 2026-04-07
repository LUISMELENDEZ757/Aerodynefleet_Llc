import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Priority: appBaseUrl (Base44 preview) > /api (Vercel) > default
const serverUrl = appBaseUrl 
  ? `${appBaseUrl}/api` 
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