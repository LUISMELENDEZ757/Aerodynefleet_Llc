/**
 * context/TabHistoryProvider
 * Canonical re-export of the TabHistoryProvider and useTabHistory hook.
 * Import from here for all new code — actual implementation lives in lib/TabHistoryContext.jsx.
 *
 *   import { TabHistoryProvider, useTabHistory } from '@/context/TabHistoryProvider';
 */
export {
  TabHistoryProvider,
  useTabHistory,
  TAB_ROOTS,
  getTabForPath,
} from '@/lib/TabHistoryContext';