import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plane, Home, Users, Settings, Radio, BookOpen,
  CalendarDays, Zap, Globe, Shield, Cloud, BarChart3,
  AlertTriangle, Fuel, Weight, Navigation2, DollarSign,
  Wrench, GraduationCap, MessageSquare, Satellite,
  Truck, UserCheck, MonitorPlay, Gauge, ClipboardList,
  Package, FileText, Activity, Sofa, ClipboardCheck, Cog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRail } from '@/lib/RailContext';

const FLIGHT_OPS = [
  { icon: Home,          label: 'Home',           path: '/Home' },
  { icon: Plane,         label: 'Flight Ops',     path: '/Dashboard' },
  { icon: Radio,         label: 'Dispatch',       path: '/Dispatch' },
  { icon: Users,         label: 'Cabin Crew',     path: '/FlightAttendant' },
  { icon: Radio,         label: 'Flight Crew',    path: '/FlightCrew' },
  { icon: BookOpen,      label: 'EFB',            path: '/EFB' },
  { icon: CalendarDays,  label: 'Crew Calendar',  path: '/CrewCalendar' },
  { icon: Zap,           label: 'Crew Control',   path: '/CrewControl' },
  { icon: Globe,         label: 'World Clock',    path: '/WorldClock' },
  { icon: Cloud,         label: 'Weather',        path: '/Weather' },
  { icon: AlertTriangle, label: 'IROPS',          path: '/IROPS' },
  { icon: Fuel,          label: 'Fuel Mgmt',      path: '/Fuel' },
  { icon: Weight,        label: 'Load Control',   path: '/LoadControl' },
  { icon: Navigation2,   label: 'Flight Planner', path: '/FlightPlanner' },
  { icon: MonitorPlay,   label: 'Flight Board',   path: '/FlightBoard' },
  { icon: AlertTriangle, label: 'NOTAMs',         path: '/NOTAMs' },
  { icon: Shield,        label: 'Safety & QA',    path: '/SafetyQA' },
  { icon: UserCheck,     label: 'Crew Directory', path: '/CrewDirectory' },
  { icon: MessageSquare, label: 'Comms',          path: '/CommCenter' },
  { icon: Satellite,     label: 'Starlink',       path: '/Starlink' },
  { icon: Shield,        label: 'Supervisor',     path: '/Supervisor' },
  { icon: BarChart3,     label: 'Analytics',      path: '/Analytics' },
];

const TECH_OPS = [
  { icon: Home,          label: 'Home',              path: '/Home' },
  { icon: Activity,      label: 'Fleet Dashboard',   path: '/FleetDashboard' },
  { icon: BookOpen,      label: 'E-Logbook',         path: '/TechOpsLogbook' },
  { icon: Wrench,        label: 'Line Maintenance',  path: '/MEL' },
  { icon: Users,         label: 'Manpower & Staff',  path: '/CrewDirectory' },
  { icon: Sofa,          label: 'Cabin Mode (FA)',   path: '/FlightAttendant' },
  { icon: ClipboardCheck,label: 'Technician Mode',   path: '/OOSDashboard' },
  { icon: Cog,           label: 'Tooling Mgmt',      path: '/GroundOps' },
  { icon: Gauge,         label: 'OOS Dashboard',     path: '/OOSDashboard' },
  { icon: Truck,         label: 'Ground Ops',        path: '/GroundOps' },
  { icon: ClipboardList, label: 'Safety & QA',       path: '/SafetyQA' },
  { icon: Package,       label: 'Parts / OOS',       path: '/NewOOS' },
  { icon: GraduationCap, label: 'Training',          path: '/Training' },
  { icon: FileText,      label: 'Documents',         path: '/Documents' },
  { icon: DollarSign,    label: 'Cost Reporting',    path: '/CostReporting' },
  { icon: BarChart3,     label: 'Analytics',         path: '/Analytics' },
];

export default function LeftRail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { expanded, toggle, setExpanded, mode, switchMode } = useRail();

  const NAV_ITEMS = mode === 'flight' ? FLIGHT_OPS : TECH_OPS;

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/Home') {
      toggle();
    } else {
      navigate('/Home');
      setExpanded(true);
      try { localStorage.setItem('rail_expanded', 'true'); } catch {}
    }
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex fixed left-0 top-0 h-full bg-card border-r border-border flex-col items-start py-4 z-50 transition-all duration-300 overflow-hidden',
        expanded ? 'w-44' : 'w-16'
      )}
    >
      {/* Mode Toggle */}
      <div className={cn('flex mb-3 px-2 w-full', expanded ? 'gap-1' : 'flex-col gap-1')}>
        <button
          onClick={() => switchMode('flight')}
          title="Flight Ops"
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg transition-all text-xs font-bold',
            expanded ? 'flex-1 h-7 px-2' : 'w-full h-7',
            mode === 'flight'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          <Plane className="w-3.5 h-3.5 flex-shrink-0" />
          {expanded && <span>FltOps</span>}
        </button>
        <button
          onClick={() => switchMode('tech')}
          title="TechOps"
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg transition-all text-xs font-bold',
            expanded ? 'flex-1 h-7 px-2' : 'w-full h-7',
            mode === 'tech'
              ? 'bg-orange-500 text-white'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
          {expanded && <span>TechOps</span>}
        </button>
      </div>

      <div className="h-px bg-border mb-2 mx-3 w-[calc(100%-1.5rem)]" />

      <nav className="flex flex-col gap-1 flex-1 w-full px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          const isHome = path === '/Home';
          const sharedClass = cn(
            'relative flex items-center gap-3 px-2.5 h-10 rounded-xl transition-all flex-shrink-0 w-full',
            isActive
              ? mode === 'tech'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          );
          const inner = (
            <>
              {isActive && (
                <span className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full', mode === 'tech' ? 'bg-orange-500' : 'bg-primary')} />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              )}
            </>
          );
          return isHome ? (
            <button key={path + label} onClick={handleHomeClick} className={sharedClass}>
              {inner}
            </button>
          ) : (
            <Link key={path + label} to={path} className={sharedClass}>
              {inner}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col w-full px-2">
        <div className="h-px bg-border mb-3 mx-1.5" />
        <Link
          to="/Settings"
          className={cn(
            'flex items-center gap-3 px-2.5 rounded-xl transition-all w-full min-h-[44px]',
            location.pathname === '/Settings'
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {expanded && (
            <span className="text-sm font-medium whitespace-nowrap">Settings</span>
          )}
        </Link>
      </div>
    </aside>
  );
}