/**
 * context/AuthContext
 * Canonical re-export of AuthProvider and useAuth hook.
 * Import from here for all new code — actual implementation lives in lib/AuthContext.jsx.
 *
 *   import { AuthProvider, useAuth } from '@/context/AuthContext';
 */
export { AuthProvider, useAuth } from '@/lib/AuthContext';