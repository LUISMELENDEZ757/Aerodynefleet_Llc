import { Link } from 'react-router-dom';
import {
  Plane, Activity, Shield, BarChart3, GraduationCap, BookOpen,
  FlaskConical, Users, CheckCircle, TrendingDown, DollarSign, Clock,
} from 'lucide-react';

const PLATFORM_CARDS = [
  { icon: Activity,  title: 'Electronic Workflows',   desc: 'Digital logbooks, real-time dashboards, instant notifications — replacing every paper process.' },
  { icon: Shield,    title: 'Regulatory Automation',  desc: 'Continuous compliance checks, digital signatures, and auto-generated audit trails.' },
  { icon: BarChart3, title: 'Predictive Intelligence', desc: 'AI forecasts maintenance windows, predicts failures, and prevents AOG events.' },
];

const ACADEMY_CARDS = [
  { icon: BookOpen,     title: 'Part 147 Curriculum',  desc: '9 course modules aligned with FAA Part 147 AMT school standards — lessons, quizzes, and certification.' },
  { icon: FlaskConical, title: 'Discrepancy Lab',      desc: 'Hands-on MEL/CDL/NEF practice scenarios logged in a real E-Logbook environment.' },
  { icon: Users,        title: 'Instructor Dashboard', desc: 'Grade submissions, track student progress, issue certificates, and run leaderboards.' },
];

const ROI_STATS = [
  { value: '34%',   label: 'Reduction in AOG Events',   color: 'text-green-400',  icon: TrendingDown },
  { value: '$180K', label: 'Avg. Saved Per AOG Event',  color: 'text-primary',    icon: DollarSign },
  { value: '2.4h',  label: 'Faster Average Turn Time',  color: 'text-cyan-400',   icon: Clock },
  { value: '91%',   label: 'On-Time Dispatch Rate',     color: 'text-amber-400',  icon: CheckCircle },
];

export default function AboutAerodyneSection() {
  return (
    <div id="about" className="space-y-10 pt-4">

      {/* Intro */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary uppercase tracking-widest">
          <Plane className="w-3 h-3" /> About Aerodyne Fleet OS
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
          <span className="text-primary">The Digital Standard</span> for Modern Aviation
        </h2>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
          A software-native operating system built for airline maintenance operations — and the aviation
          schools training the next generation of technicians. One platform. Real workflows. Industry-grade tools.
        </p>
      </div>

      {/* ROI stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROI_STATS.map(({ value, label, color, icon: Icon }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-5 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-xs font-bold text-white mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Airlines & MROs */}
      <div>
        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">✈️ For Airlines & MROs</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLATFORM_CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#141922] border border-white/10 rounded-2xl p-5 space-y-2.5">
              <Icon className="w-5 h-5 text-primary" />
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Aviation Schools */}
      <div>
        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">🎓 For Aviation Schools</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACADEMY_CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#141922] border border-violet-500/20 rounded-2xl p-5 space-y-2.5">
              <Icon className="w-5 h-5 text-violet-400" />
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <Link
          to="/Academy"
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold transition-colors"
        >
          <GraduationCap className="w-4 h-4" /> Open Academy Dashboard
        </Link>
      </div>

      {/* Founder message */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-6 space-y-3">
        <p className="text-xs font-extrabold text-primary uppercase tracking-widest">Founder Message</p>
        <p className="text-sm text-gray-300 leading-relaxed">
          I built Aerodyne Fleet because I've lived the challenges it solves. I've been in the room when a delay
          turns into a disruption, when a maintenance issue becomes a decision point, when a crew needs clarity,
          and when the operation needs answers fast.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          Aviation deserves tools that match the stakes. Aerodyne Fleet is my commitment to that standard — a
          platform shaped by real operational experience, engineered with modern technology, and designed to give
          teams the confidence and situational awareness they need to keep the operation moving.
        </p>
        <p className="text-xs text-gray-500">Luis Melendez · Founder, Aerodyne Fleet</p>
      </div>

      {/* CTA + footer */}
      <div className="text-center space-y-6 pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/OpsHub" className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-all shadow-lg">
            Enter Operations Dashboard
          </Link>
          <Link to="/Academy" className="px-8 py-3 rounded-xl border border-violet-500/50 text-violet-300 text-sm font-bold hover:bg-violet-500/10 transition-all">
            Explore Academy →
          </Link>
        </div>
        <div className="border-t border-white/10 pt-5 text-xs text-gray-500">
          <p className="font-bold text-gray-300 mb-1">Aerodyne Fleet LLC</p>
          <p>Aircraft Maintenance Management System · Aviation Academy Platform · Part 147 Aligned</p>
          <p className="mt-1">
            Support: <a href="mailto:luis@aerodynefleet.com" className="text-primary underline underline-offset-2">luis@aerodynefleet.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}