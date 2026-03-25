import { Link } from 'react-router-dom';
import { Plus, CheckCircle, List, BookOpen, Droplets, Wind, Search, RotateCcw } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';

const ACTIONS = [
  {
    icon: Plus,
    label: 'New Logbook Entry',
    path: '/TechOpsLogbook',
    bg: 'bg-amber-500',
    text: 'text-white',
    span: false,
  },
  {
    icon: CheckCircle,
    label: 'Close Task',
    path: '/TechOpsLogbook',
    bg: 'bg-teal-600',
    text: 'text-white',
    span: false,
  },
  {
    icon: List,
    label: 'Open Discrepancies',
    path: '/TechOpsLogbook',
    bg: 'bg-[#1a1f2e]',
    text: 'text-white',
    span: false,
    border: true,
  },
  {
    icon: BookOpen,
    label: 'Manuals',
    path: '/Documents',
    bg: 'bg-[#1a1f2e]',
    text: 'text-white',
    span: false,
    border: true,
  },
  {
    icon: Droplets,
    label: 'Oil Service',
    path: '/TechOpsLogbook',
    bg: 'bg-violet-600',
    text: 'text-white',
    span: false,
  },
  {
    icon: Wind,
    label: 'Oxygen Service',
    path: '/TechOpsLogbook',
    bg: 'bg-cyan-600',
    text: 'text-white',
    span: false,
  },
  {
    icon: Search,
    label: 'MEL Lookup',
    path: '/MEL',
    bg: 'bg-[#1a1f2e]',
    text: 'text-white',
    span: false,
    border: true,
  },
  {
    icon: RotateCcw,
    label: 'RTS Aircraft',
    path: '/FleetDashboard',
    bg: 'bg-blue-600',
    text: 'text-white',
    span: false,
  },
];

export default function OOSDashboard() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10">
        <Link
          to="/Home"
          className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-xl font-extrabold tracking-wide flex-1 text-center">Technician Mode</h1>
        {/* Spacer to center the title */}
        <div className="w-9" />
      </div>

      {/* Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
          {ACTIONS.map(({ icon: Icon, label, path, bg, text, border }) => (
            <Link
              key={label}
              to={path}
              className={`
                flex flex-col items-center justify-center gap-2.5 py-8 px-4 rounded-2xl
                ${bg} ${text}
                ${border ? 'border border-white/15' : ''}
                active:scale-95 transition-all hover:brightness-110
              `}
            >
              <Icon className="w-6 h-6" strokeWidth={1.8} />
              <span className="text-sm font-bold text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}