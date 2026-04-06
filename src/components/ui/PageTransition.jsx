/**
 * PageTransition
 * Direction-aware slide transition — mimics iOS navigation stack.
 *
 * On mobile: slides left/right based on navigation direction.
 * On desktop: subtle fade only (no lateral movement).
 * 
 * Integrates with NavigationStack for precise route depth mapping.
 */
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getRouteDepth, getNavigationDirection } from '@/lib/NavigationStack';

// Mobile: directional slide with subtle scale. Desktop: fade with scale.
function makeVariants(direction) {
  const x = direction >= 0 ? 48 : -48;
  return {
    initial:  { opacity: 0, x, scale: 0.98 },
    animate:  { opacity: 1, x: 0, scale: 1 },
    exit:     { opacity: 0, x: -x, scale: 0.98 },
  };
}

const DESKTOP_VARIANTS = {
  initial:  { opacity: 0, scale: 0.98 },
  animate:  { opacity: 1, scale: 1 },
  exit:     { opacity: 0, scale: 0.98 },
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const prevDepthRef = useRef(getRouteDepth(location.pathname));
  const currentDepth = getRouteDepth(location.pathname);

  // direction > 0 means pushing deeper (slide from right)
  // direction < 0 means popping (slide from left)
  const direction = getNavigationDirection(currentDepth, prevDepthRef.current);
  prevDepthRef.current = currentDepth;

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
        transition={{ 
          duration: 0.35, 
          ease: [0.32, 0.72, 0.36, 1],
          opacity: { duration: 0.3 },
          scale: { duration: 0.35 },
          x: { type: 'spring', stiffness: 300, damping: 30, mass: 1 }
        }}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}