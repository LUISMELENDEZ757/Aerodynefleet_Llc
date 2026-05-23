import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Plane, Activity, Shield, BarChart3, TrendingDown, DollarSign, Clock, AlertTriangle, CheckCircle, ArrowDown, ArrowUp, Zap, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md px-6 py-3 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-black text-foreground tracking-wider">Aerodyne Fleet</span>
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
            <p className="text-sm font-extrabold text-primary uppercase tracking-widest">How We Boost Efficiency</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
             {[
               { icon: Activity, title: 'Electronic Workflows', desc: 'Digital logbooks replace paper. Instant notifications replace memos. Real-time dashboards replace status meetings.' },
               { icon: Shield, title: 'Regulatory Automation', desc: 'Compliance checks run continuously. Digital signatures are legally binding. Audit trails auto-generate instantly.' },
               { icon: BarChart3, title: 'Predictive Intelligence', desc: 'AI forecasts maintenance windows. Component health predicts failures. Delays prevented before they happen.' },
             ].map(({ icon: Icon, title, desc }) => (
               <motion.div key={title} whileHover={{ translateY: -4 }} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                 <Icon className="w-7 h-7 text-primary mx-auto lg:mx-0" />
                 <p className="text-sm font-bold text-foreground">{title}</p>
                 <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
               </motion.div>
             ))}
            </div>
          </motion.div>

          {/* Founder Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-secondary/60 border border-border rounded-2xl p-6 space-y-3 shadow-sm"
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
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            >
              Enter Dashboard
            </Link>

            <a
              href="#features"
              className="px-8 py-3 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-secondary/70 transition-all"
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
            <h2 className="text-2xl font-black text-foreground mb-2">{"Why Electronics > Paper"}</h2>
            <p className="text-muted-foreground">The operational truth behind moving to software-based systems</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { emoji: '⚡', title: 'Speed', desc: 'Instant data access across the entire operation. No searching for logbooks or files.' },
              { emoji: '🎯', title: 'Accuracy', desc: 'Automated compliance checks prevent human error. Calculations are instant and verified.' },
              { emoji: '🔒', title: 'Security', desc: 'Digital signatures are legally binding and tamper-proof. Complete audit trails for every action.' },
              { emoji: '📊', title: 'Intelligence', desc: 'Real-time analytics predict maintenance needs before they become AOG events.' },
              { emoji: '🌐', title: 'Integration', desc: 'Every system connects to every other system. No data silos, no manual transfer.' },
              { emoji: '💰', title: 'Cost Savings', desc: 'Fewer delays, shorter maintenance windows, optimized parts ordering, reduced crew fatigue.' },
            ].map(({ emoji, title, desc }) => (
              <motion.div key={title} whileHover={{ translateY: -2 }} className="bg-card border border-border rounded-xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{emoji}</span>
                  <p className="font-bold text-foreground">{title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
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
              <motion.div key={title} whileHover={{ translateY: -4 }} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
                <ul className="text-sm text-muted-foreground space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI PITCH SECTION ───────────────────────────────────────────── */}

      {/* Section: Cost Savings Hero Banner */}
      <section className="px-5 py-20 bg-gradient-to-b from-background to-secondary/40 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <span className="inline-block text-[11px] font-black text-primary uppercase tracking-widest px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              The Business Case
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              Turn Every Dollar Spent on Maintenance<br />
              <span className="text-primary">Into 3× the Return</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Airlines and MROs using digital fleet management platforms save an average of <strong className="text-white">$2.1M–$4.8M per year</strong> — through fewer AOG events, faster turn times, and proactive parts management.
            </p>
          </motion.div>

          {/* Big 4 ROI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {[
              { value: '34%', label: 'Reduction in AOG Events', sub: 'vs. paper-based operations', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: TrendingDown },
              { value: '$180K', label: 'Avg. Saved Per AOG Event', sub: 'through faster recovery', color: 'text-primary', bg: 'bg-primary/10 border-primary/30', icon: DollarSign },
              { value: '2.4h', label: 'Faster Average Turn Time', sub: 'vs. manual logbook workflows', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', icon: Clock },
              { value: '91%', label: 'On-Time Dispatch Rate', sub: 'for Aerodyne-managed fleets', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: CheckCircle },
            ].map(({ value, label, sub, color, bg, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`rounded-2xl border p-6 text-center ${bg}`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-3 ${color}`} />
                <p className={`text-4xl font-black ${color}`}>{value}</p>
                <p className="text-sm font-bold text-white mt-1">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

            {/* Chart 1: AOG Cost Comparison */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Annual AOG Cost Impact</p>
              <p className="text-lg font-black text-white mb-1">Before vs. After Aerodyne Fleet</p>
              <p className="text-xs text-muted-foreground mb-5">Average fleet of 25 aircraft · estimated industry figures</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { month: 'Jan', before: 420, after: 280 },
                  { month: 'Feb', before: 380, after: 240 },
                  { month: 'Mar', before: 510, after: 310 },
                  { month: 'Apr', before: 460, after: 270 },
                  { month: 'May', before: 490, after: 290 },
                  { month: 'Jun', before: 530, after: 300 },
                ]} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}K`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2940', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [`$${val}K`, name === 'before' ? 'Before' : 'After Aerodyne']}
                  />
                  <Bar dataKey="before" fill="#ef4444" radius={[6,6,0,0]} name="before" />
                  <Bar dataKey="after" fill="hsl(45,95%,55%)" radius={[6,6,0,0]} name="after" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-4">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-xs text-muted-foreground">Before</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-primary" /><span className="text-xs text-muted-foreground">After Aerodyne</span></div>
                <div className="ml-auto flex items-center gap-1 text-green-400 text-xs font-black"><ArrowDown className="w-3.5 h-3.5" /> ~38% avg reduction</div>
              </div>
            </motion.div>

            {/* Chart 2: Cumulative Savings Over Time */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Cumulative Cost Savings</p>
              <p className="text-lg font-black text-white mb-1">ROI Grows With Every Month</p>
              <p className="text-xs text-muted-foreground mb-5">Projected savings vs. platform investment · 25-aircraft fleet</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={[
                  { month: 'M1',  savings: 120,  cost: 95 },
                  { month: 'M3',  savings: 380,  cost: 190 },
                  { month: 'M6',  savings: 820,  cost: 285 },
                  { month: 'M9',  savings: 1350, cost: 380 },
                  { month: 'M12', savings: 2100, cost: 475 },
                  { month: 'M18', savings: 3400, cost: 665 },
                  { month: 'M24', savings: 4800, cost: 855 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}K`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2940', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [`$${val}K`, name === 'savings' ? 'Total Savings' : 'Platform Cost']}
                  />
                  <Area type="monotone" dataKey="savings" stroke="hsl(45,95%,55%)" fill="hsl(45,95%,55%,0.15)" strokeWidth={2.5} name="savings" />
                  <Area type="monotone" dataKey="cost" stroke="#64748b" fill="rgba(100,116,139,0.1)" strokeWidth={2} strokeDasharray="5 3" name="cost" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-4">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-primary" /><span className="text-xs text-muted-foreground">Cumulative Savings</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-500" /><span className="text-xs text-muted-foreground">Platform Investment</span></div>
                <div className="ml-auto flex items-center gap-1 text-green-400 text-xs font-black"><ArrowUp className="w-3.5 h-3.5" /> Breakeven at ~M4</div>
              </div>
            </motion.div>
          </div>

          {/* Chart 3: Where the Money Goes (pie) + delay cost reduction (bar) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

            {/* Pie: Where savings come from */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Savings Breakdown</p>
              <p className="text-lg font-black text-white mb-5">Where Aerodyne Saves You Money</p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'AOG Reduction', value: 34 },
                        { name: 'Faster Turns', value: 22 },
                        { name: 'Parts Optimization', value: 18 },
                        { name: 'Labor Efficiency', value: 15 },
                        { name: 'Compliance / Penalties', value: 11 },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                    >
                      {['hsl(45,95%,55%)', '#22d3ee', '#22c55e', '#a78bfa', '#f87171'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e2940', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={v => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 flex-1">
                  {[
                    { label: 'AOG Cost Reduction', pct: '34%', color: 'bg-primary' },
                    { label: 'Faster Turn Times', pct: '22%', color: 'bg-cyan-400' },
                    { label: 'Parts Optimization', pct: '18%', color: 'bg-green-400' },
                    { label: 'Labor Efficiency', pct: '15%', color: 'bg-violet-400' },
                    { label: 'Penalty Avoidance', pct: '11%', color: 'bg-red-400' },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                      <span className="text-xs text-muted-foreground flex-1">{label}</span>
                      <span className="text-xs font-black text-white">{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Bar: Delay cost per event */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Delay Cost Per Event Type</p>
              <p className="text-lg font-black text-white mb-1">Industry Cost vs. Aerodyne Mitigation</p>
              <p className="text-xs text-muted-foreground mb-5">Estimated cost per event · FAA & IATA benchmark data</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  layout="vertical"
                  data={[
                    { name: 'AOG Event', industry: 180, aerodyne: 62 },
                    { name: 'MEL Expired', industry: 45,  aerodyne: 8 },
                    { name: 'Parts Stockout', industry: 90,  aerodyne: 30 },
                    { name: 'Crew Legality', industry: 38,  aerodyne: 12 },
                    { name: 'Compliance Fine', industry: 120, aerodyne: 5 },
                  ]}
                  margin={{ left: 90 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={88} />
                  <Tooltip
                    contentStyle={{ background: '#1e2940', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(val, name) => [`$${val}K`, name === 'industry' ? 'Industry Avg' : 'With Aerodyne']}
                  />
                  <Bar dataKey="industry" fill="#ef4444" radius={[0,4,4,0]} name="industry" />
                  <Bar dataKey="aerodyne" fill="hsl(45,95%,55%)" radius={[0,4,4,0]} name="aerodyne" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-4">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-xs text-muted-foreground">Industry Avg</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-primary" /><span className="text-xs text-muted-foreground">With Aerodyne</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Saves Money — feature breakdown ── */}
      <section className="px-5 py-20 bg-secondary/20 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block text-[11px] font-black text-cyan-400 uppercase tracking-widest px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              Where We Cut Costs
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Every Module Pays for Itself</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Aerodyne Fleet isn't just a tool — it's a financial multiplier across every department that touches your aircraft.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[
              {
                icon: '⚙️', title: 'Predictive Maintenance',
                saving: 'Up to $420K/yr saved',
                color: 'border-primary/30 bg-primary/5',
                badge: 'text-primary bg-primary/10 border-primary/20',
                points: [
                  'AI detects fault patterns before AOG occurs',
                  'Reduces unscheduled maintenance by up to 40%',
                  'Extends component life with early intervention',
                ],
              },
              {
                icon: '📋', title: 'Digital MEL Management',
                saving: 'Avoid $45K–$120K in fines',
                color: 'border-amber-500/30 bg-amber-500/5',
                badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                points: [
                  'Automatic expiry alerts prevent regulatory violations',
                  'CAT A/B/C/D tracking ensures correct deferral timelines',
                  'Eliminates manual tracking errors and missed renewals',
                ],
              },
              {
                icon: '📦', title: 'Smart Parts Ordering',
                saving: '$200K–$350K in parts cost',
                color: 'border-green-500/30 bg-green-500/5',
                badge: 'text-green-400 bg-green-500/10 border-green-500/20',
                points: [
                  'Predictive ordering eliminates AOG wait times',
                  'Inventory visibility prevents over-ordering',
                  'Integrates with supplier systems for real-time pricing',
                ],
              },
              {
                icon: '👷', title: 'Labor Optimization',
                saving: '15–22% labor cost reduction',
                color: 'border-cyan-500/30 bg-cyan-500/5',
                badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                points: [
                  'Digital workflows eliminate paper-chase time',
                  'Work assignment optimization reduces overtime',
                  'Shift handover in minutes, not an hour',
                ],
              },
              {
                icon: '🛫', title: 'Dispatch Reliability',
                saving: '$180K per avoided AOG event',
                color: 'border-violet-500/30 bg-violet-500/5',
                badge: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                points: [
                  'Real-time aircraft status visible across all departments',
                  'Automated alerts on release readiness',
                  'Integrated crew legality reduces last-minute cancellations',
                ],
              },
              {
                icon: '🔐', title: 'Compliance Automation',
                saving: 'Eliminate $5K–$25K per audit',
                color: 'border-rose-500/30 bg-rose-500/5',
                badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                points: [
                  'Auto-generated audit trails for every action',
                  'Digital signatures are FAA-compliant and tamper-proof',
                  'AD/SB tracking prevents non-compliance fines',
                ],
              },
            ].map(({ icon, title, saving, color, badge, points }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                whileHover={{ translateY: -4 }}
                className={`rounded-2xl border p-6 space-y-4 ${color}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <p className="font-black text-white text-sm">{title}</p>
                  </div>
                </div>
                <div className={`text-[11px] font-black px-3 py-1.5 rounded-lg border inline-block ${badge}`}>
                  💰 {saving}
                </div>
                <ul className="space-y-2">
                  {points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer ROI Calculator teaser ── */}
      <section className="px-5 py-20 border-t border-border bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-black text-white mb-3">What's Your Fleet Worth to Protect?</h2>
            <p className="text-muted-foreground">A single prevented AOG event typically covers 2–3 months of platform cost. Here's how the math works.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { size: 'Regional Fleet', aircraft: '10–25 aircraft', savings: '$800K–$1.4M', payback: '~3 months', color: 'border-border' },
              { size: 'Mid-Size Carrier', aircraft: '25–75 aircraft', savings: '$2.1M–$4.8M', payback: '~6 weeks', color: 'border-primary/50 bg-primary/5', featured: true },
              { size: 'Large Operator', aircraft: '75–200+ aircraft', savings: '$6M–$14M+', payback: '~4 weeks', color: 'border-border' },
            ].map(({ size, aircraft, savings, payback, color, featured }) => (
              <motion.div
                key={size}
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`rounded-2xl border p-7 text-center space-y-3 ${color} ${featured ? 'ring-1 ring-primary/40 shadow-lg shadow-primary/10' : ''}`}
              >
                {featured && <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Most Common</div>}
                <p className="text-base font-black text-white">{size}</p>
                <p className="text-xs text-muted-foreground">{aircraft}</p>
                <p className="text-3xl font-black text-primary">{savings}</p>
                <p className="text-xs text-muted-foreground">estimated annual savings</p>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-bold text-green-400">Payback period: {payback}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-5"
          >
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Every day without a modern fleet management platform is a day of avoidable costs, delays, and compliance risk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/OpsHub"
                className="px-8 py-4 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl shadow-primary/20"
              >
                See It Live — Enter Dashboard
              </Link>
              <Link
                to="/AIForecasting"
                className="px-8 py-4 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-secondary/70 transition-all"
              >
                Explore AI Forecasting →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 px-5 py-5 text-center text-xs text-muted-foreground shadow-sm">
        <p>Aerodyne Fleet LLC — Aircraft Maintenance Management System</p>
      </footer>
    </div>
  );
}