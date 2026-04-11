import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Plane, Activity, Shield, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoMode = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('seedDemoData', {});
      console.log('Demo data seeded:', res.data);
      localStorage.setItem('demoMode', 'true');
      navigate('/OpsHub');
    } catch (error) {
      console.error('Failed to seed demo data:', error);
      alert(`Error seeding demo: ${error.message}`);
      setLoading(false);
    }
  };

  const handleRealEnvironment = () => {
    localStorage.removeItem('demoMode');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md px-5 h-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-extrabold text-foreground tracking-widest uppercase">Aerodyne Fleet</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col lg:flex-row items-center justify-center px-5 py-16 gap-12 max-w-7xl mx-auto w-full"
      >
        {/* Left: Marketing Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="flex-shrink-0 w-full max-w-xs lg:max-w-sm xl:max-w-md"
        >
          <img
            src="https://media.base44.com/images/public/69bac7d10515c7cd49590072/e594107ab_image.png"
            alt="Aerodyne Fleet LLC"
            className="w-full rounded-2xl shadow-2xl"
          />
        </motion.div>

        {/* Right: Content */}
        <div className="flex-1 max-w-2xl space-y-6 text-center lg:text-left">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="space-y-3"
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Aircraft Maintenance at the Speed of Flight
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Aerodyne Fleet is a real-time maintenance management system built for modern aviation operations.
              From TechOps to Dispatch, we streamline every phase of aircraft maintenance with live data, regulatory compliance, and predictive insights.
            </p>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { icon: Activity, title: 'Real-Time Ops', desc: 'Live fleet status, MEL tracking, and maintenance workflows' },
              { icon: Shield, title: 'Regulatory Ready', desc: 'FAA compliance, digital signatures, and audit trails' },
              { icon: BarChart3, title: 'Predictive Insights', desc: 'AI-powered maintenance forecasting and delay prediction' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <Icon className="w-6 h-6 text-primary mx-auto lg:mx-0" />
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Founder Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-secondary/50 border border-border rounded-2xl p-6 space-y-3"
          >
            <p className="text-xs font-extrabold text-primary uppercase tracking-widest">Founder Message</p>
            <p className="text-sm text-foreground leading-relaxed">
              I built Aerodyne Fleet because I have lived the challenges it solves. I have been the person in the room when a delay becomes a disruption, when a maintenance issue becomes a decision point, when a crew needs clarity, and when the operation needs answers fast.
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Aviation deserves tools that match the stakes. Aerodyne Fleet is my commitment to that idea — a platform shaped by real operational experience, engineered with modern technology, and designed to give teams the confidence and situational awareness they need.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Luis Melendez<br />Founder, Aerodyne Fleet</p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
          >
            <Link
              to="/OpsHub"
              onClick={handleRealEnvironment}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
            >
              Enter Dashboard
            </Link>
            <button
              onClick={handleDemoMode}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-secondary text-foreground text-sm font-extrabold hover:bg-secondary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading Demo...' : 'Enter Demo Mode'}
            </button>
            <a
              href="#features"
              className="px-8 py-3 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-secondary/50 transition-colors"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <section id="features" className="px-5 py-20 bg-secondary/30 border-t border-border">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-black text-foreground mb-3">Built for Modern Aviation</h2>
            <p className="text-muted-foreground">Comprehensive tools for every role in your operation</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Real-Time Ops', items: ['Live fleet tracking', 'MEL management', 'Maintenance workflows', 'Predictive alerts'] },
              { title: 'Regulatory Ready', items: ['FAA compliance', 'Digital signatures', 'Audit trails', 'CRS documentation'] },
              { title: 'Integrated Data', items: ['Component traceability', 'AD compliance tracking', 'Engine health analytics', 'Cost per flight'] },
            ].map(({ title, items }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 px-5 py-4 text-center text-xs text-muted-foreground">
        <p>Aerodyne Fleet LLC — Aircraft Maintenance Management System</p>
      </footer>
    </div>
  );
}