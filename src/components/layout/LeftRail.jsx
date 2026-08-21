import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/lib/navGroups';
import { useSimulation } from '@/lib/SimulationContext';

// ── Nav link glow styling driven by the System Simulation ───────────────────
// When the simulation is running, the currently operated dashboard's link
// glows; previously-tested links show a small status dot (ok/repair).

function simLinkClasses(path, sim) {
  const isActive = sim.isRunning && sim.currentPath === path;
  if (!isActive) return '';
  return 'ring-2 ring-primary shadow-[0_0_12px_2px_rgba(245,158,11,0.55)] animate-pulse';
}

function SimDot({ path, sim }) {
  if (sim.isRunning && sim.currentPath === path) {
    return <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-ping flex-shrink-0" />;
  }
  const s = sim.statuses[path];
  if (!s) return null;
  const color = s.status === 'ok' ? 'bg-green-400' : s.status === 'repair' ? 'bg-amber-400' : 'bg-white/30';
  return <span className={cn('ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0', color)} />;
}

function NavGroup({ group, location, isExpanded, onToggle }) {
  const sim = useSimulation();
  const hasActive = group.items.some((i) => i.path === location.pathname);

  if (!group.title) {
    return (
      <div className="px-1.5 pb-1">
        {group.items.map(({ label, icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-2 h-8 px-2.5 rounded-lg transition-all text-[11px] font-semibold tracking-wide whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10',
                simLinkClasses(path, sim)
              )}
            >
              <span className="text-[11px] leading-none w-4 text-center">{icon}</span>
              <span>{label}</span>
              <SimDot path={path} sim={sim} />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="px-1.5">
      {/* Group header toggle */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all group',
          hasActive ? 'text-primary' : 'text-white/40 hover:text-white/70'
        )}
      >
        <span className="text-[9px] font-black uppercase tracking-[0.18em]">{group.title}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-200 flex-shrink-0', isExpanded ? 'rotate-0' : '-rotate-90')} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-1 space-y-0.5">
              {group.items.map(({ label, icon, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={`${group.id}-${path}`}
                    to={path}
                    className={cn(
                      'flex items-center gap-2 h-7 px-2.5 rounded-lg transition-all text-[11px] font-medium whitespace-nowrap',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-white/55 hover:text-white hover:bg-white/8',
                      simLinkClasses(path, sim)
                    )}
                  >
                    <span className="text-[10px] leading-none w-4 text-center flex-shrink-0">{icon}</span>
                    <span className="truncate">{label}</span>
                    <SimDot path={path} sim={sim} />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const BrandHeader = ({ collapsed, onToggle }) => (
  <div className="flex items-center justify-between px-3 py-3.5 border-b border-white/8 flex-shrink-0">
    {!collapsed && (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-md">
          <Plane className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[13px] font-black text-white tracking-wide leading-none">AERODYNE</p>
          <p className="text-[9px] text-white/40 tracking-widest uppercase mt-0.5">Fleet OS</p>
        </div>
      </div>
    )}
    <button
      onClick={onToggle}
      className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-all flex-shrink-0 ml-auto"
    >
      {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-white/50" /> : <ChevronLeft className="w-3.5 h-3.5 text-white/50" />}
    </button>
  </div>
);

export default function LeftRail({ onCollapsedChange }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);

  // Default: expand group if it contains the active route
  const getDefaultExpanded = () => {
    const expanded = {};
    NAV_GROUPS.forEach((g) => {
      if (g.title) {
        expanded[g.id] = g.items.some((i) => i.path === location.pathname);
      }
    });
    return expanded;
  };

  const [expandedGroups, setExpandedGroups] = useState(getDefaultExpanded);

  const toggle = (val) => {
    setCollapsed(val);
    onCollapsedChange?.(val);
  };

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (collapsed) {
    return (
      <aside className="fixed left-0 top-0 h-full w-12 bg-sidebar border-r border-border flex flex-col z-50">
        <BrandHeader collapsed onToggle={() => toggle(false)} />
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-52 bg-sidebar border-r border-border flex flex-col z-50">
      <BrandHeader collapsed={false} onToggle={() => toggle(true)} />
      <nav className="flex-1 w-full overflow-y-auto scrollbar-hide py-2">
        {NAV_GROUPS.map((group, idx) => (
          <React.Fragment key={group.id}>
            <NavGroup
              group={group}
              location={location}
              isExpanded={!group.title || expandedGroups[group.id]}
              onToggle={() => toggleGroup(group.id)}
            />
            {idx < NAV_GROUPS.length - 1 && group.title && (
              <div className="mx-3 my-1.5 border-t border-white/6" />
            )}
          </React.Fragment>
        ))}
        <div className="h-6" />
      </nav>
    </aside>
  );
}