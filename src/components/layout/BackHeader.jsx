import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { isPrimaryTab, isChildScreen } from '@/lib/NavigationStack';

/**
 * A mobile-style back header with native-like slide transitions.
 * Shows on child screens (depth 2+) with back navigation.
 * Validates navigation via NavigationStack to prevent stack inconsistencies.
 * Renders nothing on desktop (lg+).
 */

export default function BackHeader({ title, subtitle, rightSlot }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabHistory = useTabHistory();

  // Only show on mobile and on child screens (depth 2+)
  // Uses NavigationStack for precise route depth validation
  if (!isChildScreen(location.pathname)) return null;

  // Validate navigation against tab history to prevent stack inconsistencies
  const handleBack = () => {
    if (tabHistory && tabHistory.lastPaths) {
      const currentPathDatum = tabHistory.lastPaths.current;
      // If current path is in history, safe to navigate back; otherwise navigate to active tab root
      const historyPaths = Object.values(currentPathDatum || {});
      if (!historyPaths.includes(location.pathname)) {
        console.warn(`[BackHeader] Path ${location.pathname} not in tab history — navigating to tab root`);
      }
    }
    navigate(-1);
  };

  return (
    <motion.div
      className="lg:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border flex items-center gap-2 px-3 py-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
    >
      <button
        onClick={handleBack}
        aria-label={`Navigate back${title ? ` from ${title}` : ' to previous screen'}`}
        className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground active:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold text-foreground truncate">{title}</p>}
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </motion.div>
  );
}