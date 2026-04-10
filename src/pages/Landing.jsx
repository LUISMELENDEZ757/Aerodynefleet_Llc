import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Activity, Shield, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md px-5 h-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Plane className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-extrabold text-foreground tracking-widest uppercase">Aerodyne</span>
          </div>
          <Link to="/Home" className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center px-5 py-20 text-center"
      >
        <div className="max-w-3xl space-y-6">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="space-y-3"
          >
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
              Aircraft Maintenance at the Speed of Flight
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Aerodyne Fleet is a real-time maintenance management system built for modern aviation operations. 
              From TechOps to Dispatch, we streamline every phase of aircraft maintenance with live data, regulatory compliance, and predictive insights.
            </p>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8"
          >
            {[
              { icon: Activity, title: 'Real-Time Ops', desc: 'Live fleet status, MEL tracking, and maintenance workflows' },
              { icon: Shield, title: 'Regulatory Ready', desc: 'FAA compliance, digital signatures, and audit trails' },
              { icon: BarChart3, title: 'Predictive Insights', desc: 'AI-powered maintenance forecasting and delay prediction' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <Icon className="w-6 h-6 text-primary mx-auto" />
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
            className="bg-secondary/50 border border-border rounded-2xl p-6 space-y-3 my-8"
          >
            <p className="text-xs font-extrabold text-primary uppercase tracking-widest">Founder Message</p>
            <p className="text-sm text-foreground leading-relaxed">
              "Aerodyne Fleet was built to solve a critical problem in aviation: the disconnect between maintenance teams, dispatch, 
              and regulatory oversight. We've combined 30+ years of aviation expertise with modern technology to create a system 
              that makes maintenance data actionable, compliance automatic, and operations predictable. Every feature is designed 
              by people who've worked the line, dispatched aircraft, and faced FAA audits."
            </p>
            <p className="text-xs text-muted-foreground">— The Aerodyne Team</p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/Home"
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
            >
              Enter Dashboard
            </Link>
            <a
              href="#features"
              className="px-8 py-3 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-secondary/50 transition-colors"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 px-5 py-4 text-center text-xs text-muted-foreground">
        <p>Aerodyne Fleet LLC — Aircraft Maintenance Management System</p>
      </footer>
    </div>
  );
}