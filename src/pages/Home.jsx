import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Plane, Radio, BookOpen, CalendarDays, Zap } from 'lucide-react';

const MODULES = [
  {
    icon: Users,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    title: 'FLIGHT OPS',
    subtitle: 'Pilots & Crew',
    items: ['Pilot Roster', 'Crew Scheduling', 'Training Records'],
    itemColor: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    path: '/Dashboard',
  },
  {
    icon: Plane,
    iconBg: 'bg-yellow-400',
    iconColor: 'text-gray-900',
    title: 'PILOT FLIGHT KIT',
    subtitle: 'Electronic Flight Bag (EFB Lite) — Aerodyne Operation',
    items: ['Flight Releases', 'Weather & NOTAMs', 'Postflight Reporting'],
    itemColor: 'text-yellow-400',
    borderColor: 'border-yellow-400/40',
    path: '/EFB',
  },
  {
    icon: Radio,
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    title: 'DISPATCH',
    subtitle: 'Flight Dispatch & Release Control',
    items: ['Dispatch Releases', 'Fuel Planning', 'Flight Following'],
    itemColor: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    path: '/Dashboard',
  },

  {
    icon: Users,
    iconBg: 'bg-purple-500',
    iconColor: 'text-white',
    title: 'CABIN CREW',
    subtitle: 'Flight Attendant Operations',
    items: ['Cabin Checklist', 'Flight Status', 'Crew Assignments'],
    itemColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    path: '/FlightAttendant',
  },
  {
    icon: Zap,
    iconBg: 'bg-red-500',
    iconColor: 'text-white',
    title: 'CREW CONTROL',
    subtitle: 'Real-Time · FAR 117 · AI Dispatcher',
    items: ['Live Duty Timers', 'Fatigue Predictor', 'AI Recovery Assist'],
    itemColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    path: '/CrewControl',
  },
  {
    icon: CalendarDays,
    iconBg: 'bg-sky-500',
    iconColor: 'text-white',
    title: 'CREW CALENDAR',
    subtitle: 'Assignments · Duty Times · FAR 117',
    items: ['Flight Assignments', 'Duty Start / End', 'FAR 117 Compliance'],
    itemColor: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    path: '/CrewCalendar',
  },
  {
    icon: BookOpen,
    iconBg: 'bg-green-500',
    iconColor: 'text-white',
    title: 'FLIGHT CREW',
    subtitle: 'Cockpit Operations',
    items: ['Preflight Checklist', 'Dispatch Release', 'Crew Legality'],
    itemColor: 'text-green-400',
    borderColor: 'border-green-500/40',
    path: '/FlightCrew',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f1117] px-4 py-8 flex flex-col items-center">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-xs font-mono font-bold text-primary tracking-widest uppercase mb-1">Aerodyne Fleet LLC</p>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">Operations Hub</h1>
      </div>

      {/* Module cards */}
      <div className="w-full max-w-sm space-y-4">
        {MODULES.map(({ icon: Icon, iconBg, iconColor, title, subtitle, items, itemColor, borderColor, path }) => (
          <Link
            key={title}
            to={path}
            className={`block rounded-2xl border ${borderColor} bg-[#161b27] p-6 text-center hover:bg-[#1e2436] hover:border-opacity-80 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/40 transition-all duration-200 active:scale-[0.98]`}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg`}>
                <Icon className={`w-8 h-8 ${iconColor}`} />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg font-extrabold text-white tracking-widest mb-1">{title}</h2>

            {/* Subtitle */}
            <p className="text-sm text-gray-400 mb-3">{subtitle}</p>

            {/* Items */}
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item} className={`text-sm ${itemColor}`}>
                  • {item}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}