import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A mobile-style back header. Shows on child screens (non-primary-tab paths).
 * Renders nothing on desktop (lg+).
 */

const PRIMARY_PATHS = [
  '/Home', '/Dashboard', '/EFB', '/CrewControl',
  '/FlightAttendant', '/FlightCrew', '/CrewCalendar',
  '/WorldClock', '/SafetyQA', '/Scheduling', '/Weather',
  '/Training', '/Settings',
];

export default function BackHeader({ title, subtitle, rightSlot }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on mobile and on non-primary screens
  const isPrimary = PRIMARY_PATHS.includes(location.pathname);
  if (isPrimary) return null;

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border flex items-center gap-2 px-3 py-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold text-foreground truncate">{title}</p>}
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
  );
}