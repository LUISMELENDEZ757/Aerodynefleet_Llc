import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plane, Radio, BookOpen, CalendarDays, Zap, Globe, Shield, Cloud } from 'lucide-react';
import SplashScreen from '@/components/SplashScreen';

const MODULES = [
  {
    icon: Plane,
    iconBg: 'bg-primary',
    iconColor: 'text-primary-foreground',
    title: 'FLIGHT OPS',
    subtitle: 'Operations Center',
    borderColor: 'border-primary/30',
    path: '/Dashboard',
  },
  {
    icon: BookOpen,
    iconBg: 'bg-yellow-500',
    iconColor: 'text-white',
    title: 'EFB',
    subtitle: 'Electronic Flight Bag',
    borderColor: 'border-yellow-500/30',
    path: '/EFB',
  },
  {
    icon: Radio,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    title: 'FLIGHT CREW',
    subtitle: 'Cockpit Operations',
    borderColor: 'border-blue-500/30',
    path: '/FlightCrew',
  },
  {
    icon: Users,
    iconBg: 'bg-purple-500',
    iconColor: 'text-white',
    title: 'CABIN CREW',
    subtitle: 'FA Dashboard',
    borderColor: 'border-purple-500/30',
    path: '/FlightAttendant',
  },
  {
    icon: Zap,
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    title: 'CREW CONTROL',
    subtitle: 'FAR 117 · AI Assist',
    borderColor: 'border-red-500/30',
    path: '/CrewControl',
  },
  {
    icon: CalendarDays,
    iconBg: 'bg-sky-500',
    iconColor: 'text-white',
    title: 'SCHEDULING',
    subtitle: 'Pairings · Bidlines',
    borderColor: 'border-sky-500/30',
    path: '/Scheduling',
  },
  {
    icon: CalendarDays,
    iconBg: 'bg-indigo-500',
    iconColor: 'text-white',
    title: 'CREW CALENDAR',
    subtitle: 'Assignments · Duty',
    borderColor: 'border-indigo-500/30',
    path: '/CrewCalendar',
  },
  {
    icon: Globe,
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
    title: 'WORLD CLOCK',
    subtitle: 'Aviation Hubs · UTC',
    borderColor: 'border-teal-500/30',
    path: '/WorldClock',
  },
  {
    icon: Shield,
    iconBg: 'bg-orange-500',
    iconColor: 'text-white',
    title: 'SAFETY & QA',
    subtitle: 'ASAP · Incidents',
    borderColor: 'border-orange-500/30',
    path: '/SafetyQA',
  },
  {
    icon: Cloud,
    iconBg: 'bg-cyan-500',
    iconColor: 'text-white',
    title: 'WEATHER',
    subtitle: 'METAR · TAF · SIGMET',
    borderColor: 'border-cyan-500/30',
    path: '/Weather',
  },
  {
    icon: BookOpen,
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
    title: 'LEARNING CENTER',
    subtitle: 'App Guide · Tutorials',
    borderColor: 'border-emerald-500/30',
    path: '/Learning',
  },

];

export default function Home() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show once per session
    if (sessionStorage.getItem('splashSeen')) return false;
    sessionStorage.setItem('splashSeen', '1');
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 pt-6 pb-24 flex flex-col items-center">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {/* Header */}
      <div className="mb-6 text-center w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs font-mono font-bold text-primary tracking-widest uppercase">Aerodyne Fleet LLC</p>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Operations Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Airline-grade flight operations platform</p>
      </div>

      {/* Module grid — 2 cols on mobile, up to 3 on larger screens */}
      <div className="w-full max-w-lg grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MODULES.map(({ icon: Icon, iconBg, iconColor, title, subtitle, borderColor, path }) => (
          <Link
            key={title}
            to={path}
            className={`relative rounded-2xl border ${borderColor} bg-[#161b27] p-4 flex flex-col items-center text-center active:scale-[0.96] transition-all duration-150 hover:bg-[#1e2436] hover:shadow-lg hover:shadow-black/40`}
          >
            <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-md mb-3 flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <p className="text-xs font-extrabold text-white tracking-widest leading-tight mb-1">{title}</p>
            <p className="text-[11px] text-gray-400 leading-snug">{subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-600 font-mono">AERODYNE FLEET LLC · OPS v2.0</p>
    </div>
  );
}