import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plane, Activity, Shield, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Aerodyne Fleet OS — The Digital Evolution of Aircraft Operations
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Aerodyne Fleet is a software-native operating system that replaces paper-based maintenance workflows with real-time digital intelligence. By moving entirely to electronic logbooks, automated compliance tracking, live aircraft health monitoring, and AI-driven predictive maintenance, we eliminate delays, reduce human error, and maximize dispatch reliability.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Every technician, engineer, dispatcher, and crew member operates from a single source of truth — live fleet data, instant notifications, digital signatures, and integrated regulatory compliance. No more hunting for documents. No more manual data entry. No more surprises at the gate.
            </p>
          </motion.div>

          {/* Core Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-4"
          >
            <p className="text-sm font-bold text-primary uppercase tracking-widest">How We Boost Efficiency</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Activity, title: 'Electronic Workflows', desc: 'Digital logbooks replace paper. Instant notifications replace memos. Real-time dashboards replace status meetings.' },
                { icon: Shield, title: 'Regulatory Automation', desc: 'Compliance checks run continuously. Digital signatures are legally binding. Audit trails auto-generate instantly.' },
                { icon: BarChart3, title: 'Predictive Intelligence', desc: 'AI forecasts maintenance windows. Component health predicts failures. Delays prevented before they happen.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <Icon className="w-6 h-6 text-primary mx-auto lg:mx-0" />
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
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

      {/* Why Electronic Systems Matter */}
      <section className="px-5 py-16 bg-secondary/40 border-t border-border">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-foreground mb-2">Why Electronics > Paper</h2>
            <p className="text-muted-foreground">The operational truth behind moving to software-based systems</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { emoji: '⚡', title: 'Speed', desc: 'Instant data access across the entire operation. No searching for logbooks or files.' },
              { emoji: '🎯', title: 'Accuracy', desc: 'Automated compliance checks prevent human error. Calculations are instant and verified.' },
              { emoji: '🔒', title: 'Security', desc: 'Digital signatures are legally binding and tamper-proof. Complete audit trails for every action.' },
              { emoji: '📊', title: 'Intelligence', desc: 'Real-time analytics predict maintenance needs before they become AOG events.' },
              { emoji: '🌐', title: 'Integration', desc: 'Every system connects to every other system. No data silos, no manual transfer.' },
              { emoji: '💰', title: 'Cost Savings', desc: 'Fewer delays, shorter maintenance windows, optimized parts ordering, reduced crew fatigue.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <p className="font-bold text-foreground">{title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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