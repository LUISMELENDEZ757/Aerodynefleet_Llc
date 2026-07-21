import { Link } from 'react-router-dom';
import { Plane, LayoutDashboard, Info } from 'lucide-react';
import SystemsHeroCarousel from '@/components/home/SystemsHeroCarousel';
import SystemNewsFeed from '@/components/home/SystemNewsFeed';
import AboutAerodyneSection from '@/components/home/AboutAerodyneSection';
import LiveClock from '@/components/ui/LiveClock';

export default function AerodyneHome() {
  return (
    <div className="min-h-screen bg-[#0a0e14] text-white pb-16">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1117] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-black tracking-wider leading-none">Aerodyne Fleet OS</p>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5">Technical Operations Home</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#about"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/15 text-gray-300 text-xs font-bold hover:bg-white/5 transition-colors"
          >
            <Info className="w-3.5 h-3.5" /> About Aerodyne
          </a>
          <Link
            to="/OpsHub"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Enter Ops Hub
          </Link>
          <LiveClock />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-5 pt-6 space-y-8">
        <SystemsHeroCarousel />
        <SystemNewsFeed />
        <AboutAerodyneSection />
      </div>
    </div>
  );
}