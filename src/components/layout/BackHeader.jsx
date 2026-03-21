import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * A mobile-style back header with native-like slide transitions.
 * Shows on child screens (non-primary-tab paths) with back navigation.
 * Renders nothing on desktop (lg+).
 */

const PRIMARY_PATHS = [
  '/Home', '/Dashboard', '/EFB', '/CrewControl',
  '/FlightAttendant', '/FlightCrew', '/CrewCalendar',
  '/WorldClock', '/SafetyQA', '/Scheduling', '/Weather',
  '/Learning', '/Settings',
];

export default function BackHeader({ title, subtitle, rightSlot }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on mobile and on non-primary screens
  const isPrimary = PRIMARY_PATHS.includes(location.pathname);
  if (isPrimary) return null;

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
        onClick={() => navigate(-1)}
        aria-label="Navigate back to previous screen"
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