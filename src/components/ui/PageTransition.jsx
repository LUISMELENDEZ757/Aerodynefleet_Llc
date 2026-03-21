/**
 * PageTransition
 * Direction-aware slide transition — mimics iOS navigation stack.
 *
 * On mobile: slides left/right based on navigation direction.
 * On desktop: subtle fade only (no lateral movement).
 */
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Route depth map — higher = deeper in stack (child screen)
const ROUTE_DEPTH = {
  '/Home':             0,
  '/Dashboard':        1,
  '/OOSDetail':        2,
  '/NewOOS':           2,
  '/FlightAttendant':  1,
  '/FlightCrew':       1,
  '/EFB':              1,
  '/CrewCalendar':     1,
  '/CrewControl':      1,
  '/WorldClock':       1,
  '/SafetyQA':         1,
  '/Scheduling':       1,
  '/Weather':          1,
  '/Training':         1,
  '/Settings':         1,
};

function getDepth(pathname) {
  return ROUTE_DEPTH[pathname] ?? 1;
}

// Mobile: directional slide. Desktop: fade only.
function makeVariants(direction) {
  const x = direction >= 0 ? 40 : -40;
  return {
    initial:  { opacity: 0, x },
    animate:  { opacity: 1, x: 0 },
    exit:     { opacity: 0, x: -x },
  };
}

const DESKTOP_VARIANTS = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1 },
  exit:     { opacity: 0 },
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const prevDepth = useRef(getDepth(location.pathname));
  const currentDepth = getDepth(location.pathname);

  // direction > 0 means pushing deeper (slide from right)
  // direction < 0 means popping (slide from left)
  const direction = currentDepth - prevDepth.current;
  prevDepth.current = currentDepth;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const variants = isMobile ? makeVariants(direction) : DESKTOP_VARIANTS;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}