import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Plane, Activity, Shield, BarChart3, TrendingDown, DollarSign, Clock,
  AlertTriangle, CheckCircle, ArrowDown, ArrowUp, Zap, Users, GraduationCap,
  BookOpen, Wrench, Award, ChevronRight, Star, Building2, FlaskConical
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Home() {
  const [activeTab, setActiveTab] = useState('operations');

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md px-6 py-3 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-black text-foreground tracking-wider">Aerodyne Fleet</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#platform" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Platform</a>
            <a href="#academy" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">Academy</a>
            <a href="#roi" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">ROI</a>
            <Link to="/OpsHub" className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 transition-all">
              Enter Dashboard
            </Link>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary uppercase tracking-widest">
              <Plane className="w-3 h-3" /> Aviation Fleet OS — Industry + Education
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Aerodyne Fleet OS —<br />
              <span className="text-primary">The Digital Standard</span> for Modern Aviation
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A software-native operating system built for airline maintenance operations — and the aviation schools training the next generation of technicians. One platform. Real workflows. Industry-grade tools.
            </p>
          </motion.div>

          {/* Tab Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl border border-border w-fit mx-auto lg:mx-0 mb-5">
              {[
                { id: 'operations', label: '✈️ Airlines & MROs', icon: Plane },
                { id: 'schools', label: '🎓 Aviation Schools', icon: GraduationCap },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'operations' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Activity, title: 'Electronic Workflows', desc: 'Digital logbooks, real-time dashboards, instant notifications — replacing every paper process.' },
                  { icon: Shield, title: 'Regulatory Automation', desc: 'Continuous compliance checks, digital signatures, and auto-generated audit trails.' },
                  { icon: BarChart3, title: 'Predictive Intelligence', desc: 'AI forecasts maintenance windows, predicts failures, and prevents AOG events.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <motion.div key={title} whileHover={{ translateY: -4 }} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <Icon className="w-6 h-6 text-primary mx-auto lg:mx-0" />
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'schools' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: BookOpen, title: 'Part 147 Curriculum', desc: 'Built-in Academy module aligns with FAA Part 147 AMT school standards. Structured lessons, quizzes, and certification.' },
                  { icon: FlaskConical, title: 'Discrepancy Lab', desc: 'Hands-on MEL/CDL/NEF practice scenarios. Students log entries in a real E-Logbook environment.' },
                  { icon: Users, title: 'Instructor Dashboard', desc: 'Grade submissions, track student progress, issue certificates, and run leaderboard rankings.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <motion.div key={title} whileHover={{ translateY: -4 }} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <Icon className="w-6 h-6 text-violet-400 mx-auto lg:mx-0" />
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>
            )}
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
              I built Aerodyne Fleet because I have lived the challenges it solves — the delays, the decisions under pressure, the gap between what our tools offered and what our operation demanded. This platform is built for both the operator in the field and the student learning the craft.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Luis Melendez · Founder, Aerodyne Fleet</p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
          >
            <Link to="/OpsHub" className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl">
              Enter Operations Dashboard
            </Link>
            <Link to="/Academy" className="px-8 py-3 rounded-xl border border-violet-500/50 text-violet-300 text-sm font-bold hover:bg-violet-500/10 transition-all">
              Explore Academy →
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ── ACADEMY FOR SCHOOLS SECTION ── */}
      <section id="academy" className="px-5 py-24 bg-gradient-to-b from-[#0d1117] to-[#111827] border-t border-white/8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] font-black text-violet-400 uppercase tracking-widest mb-5">
              <GraduationCap className="w-3.5 h-3.5" /> For Aviation Maintenance Schools
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              Train Students on the <span className="text-violet-400">Tools They'll Actually Use</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Aerodyne Fleet OS serves as a complete academic foundation for Part 147 AMT schools. Students learn real-world maintenance workflows, regulatory compliance, and digital operations — not simulations.
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25',
                title: 'Structured Part 147 Curriculum',
                desc: 'Pre-built course modules mapped to FAA Part 147 General, Airframe, and Powerplant knowledge areas. Lessons, quizzes, and progress tracking built in.',
                badge: '9 Course Modules',
              },
              {
                icon: FlaskConical, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25',
                title: 'Mock Discrepancy Lab',
                desc: 'Students practice logging MEL, NEF, and CDL discrepancies in a real E-Logbook environment. Instructors grade submissions and provide feedback.',
                badge: 'Hands-On Practice',
              },
              {
                icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/25',
                title: 'Instructor Dashboard',
                desc: 'Full student progress visibility, submission grading tools, performance analytics, and class-wide leaderboard rankings by quiz score and lab speed.',
                badge: 'Instructor Tools',
              },
              {
                icon: Award, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/25',
                title: 'Digital Certifications',
                desc: 'Auto-generate printable Certificates of Completion for students who finish all course modules. Gold-seal, print-ready PDF format.',
                badge: 'Certificates',
              },
              {
                icon: Zap, color: 'text-primary', bg: 'bg-primary/10 border-primary/25',
                title: 'AI Aviation Tutor',
                desc: 'Built-in AI assistant trained on FAA Part 147 topics, MEL/CDL/NEF procedures, ATA chapters, and ETOPS regulations. Available 24/7.',
                badge: 'AI-Powered',
              },
              {
                icon: Wrench, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25',
                title: 'Live Fleet Exposure',
                desc: 'Students interact with actual fleet dashboards, logbook workflows, MEL management, and maintenance control — the same tools used by working AMTs.',
                badge: 'Industry-Grade',
              },
            ].map(({ icon: Icon, color, bg, title, desc, badge }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                whileHover={{ translateY: -4 }}
                className={`rounded-2xl border p-6 space-y-4 ${bg}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${bg} ${color}`}>{badge}</span>
                </div>
                <p className="font-black text-white text-sm">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Curriculum Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#0f1623] border border-white/10 rounded-3xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-start gap-10">
              <div className="flex-1">
                <p className="text-[11px] font-black text-violet-400 uppercase tracking-widest mb-3">Academy Curriculum</p>
                <h3 className="text-2xl font-black text-white mb-4">9 Modules · Part 147 Aligned</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Every module is structured with lesson content, knowledge checks, and a scored quiz. Students progress sequentially, building from foundational platform orientation to advanced systems knowledge.
                </p>
                <div className="space-y-2.5">
                  {[
                    { num: '01', title: 'Platform Orientation & Fleet OS Overview', tag: 'General' },
                    { num: '02', title: 'E-Logbook & 14 CFR Part 43 Compliance', tag: 'Regulatory' },
                    { num: '03', title: 'MEL, NEF & CDL — Deferral Procedures', tag: 'MEL' },
                    { num: '04', title: 'ETOPS & Extended Operations', tag: 'Advanced' },
                    { num: '05', title: 'Engines, FADEC & Power Generation', tag: 'Powerplant' },
                    { num: '06', title: 'Hydraulic Systems — ATA 29', tag: 'Airframe' },
                    { num: '07', title: 'Pneumatic & Bleed Air Systems — ATA 36', tag: 'Airframe' },
                    { num: '08', title: 'Fire Detection & Protection — ATA 26', tag: 'Safety' },
                    { num: '09', title: 'LRU Knowledge & Avionics', tag: 'Avionics' },
                  ].map(({ num, title, tag }) => (
                    <div key={num} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                      <span className="text-[10px] font-black text-violet-500 w-6 flex-shrink-0">{num}</span>
                      <span className="text-xs text-gray-300 flex-1">{title}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/8 text-gray-500 flex-shrink-0">{tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:w-72 space-y-4 flex-shrink-0">
                <div className="bg-violet-900/20 border border-violet-500/20 rounded-2xl p-6 space-y-4">
                  <GraduationCap className="w-8 h-8 text-violet-400" />
                  <p className="text-base font-black text-white">Built for Schools</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Aerodyne Academy is designed to be embedded in your school's curriculum as both a learning environment and a live career-readiness tool.
                  </p>
                  <div className="space-y-2 pt-2 border-t border-white/8">
                    {[
                      'FAA Part 147 module alignment',
                      'Instructor grading & feedback tools',
                      'Student progress tracking',
                      'Certificate of Completion',
                      'AI Tutor — always available',
                      'Discrepancy Lab scenarios',
                      'Toolkit: FAA handbooks & regs',
                    ].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-gray-300">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <Link
                  to="/Academy"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-extrabold transition-colors"
                >
                  <GraduationCap className="w-4 h-4" /> Open Academy Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PLATFORM SECTION ── */}
      <section id="platform" className="px-5 py-20 bg-secondary/40 border-t border-border">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-foreground mb-2">Why Electronic Systems Beat Paper</h2>
            <p className="text-muted-foreground">The operational truth behind moving to software-based aviation systems</p>
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

      {/* Features */}
      <section className="px-5 py-20 bg-secondary/30 border-t border-border">
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

      {/* ── ROI SECTION ── */}
      <section id="roi" className="px-5 py-20 bg-gradient-to-b from-background to-secondary/40 border-t border-border">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
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

          {/* Module ROI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[
              { icon: '⚙️', title: 'Predictive Maintenance', saving: 'Up to $420K/yr saved', color: 'border-primary/30 bg-primary/5', badge: 'text-primary bg-primary/10 border-primary/20', points: ['AI detects fault patterns before AOG occurs', 'Reduces unscheduled maintenance by up to 40%', 'Extends component life with early intervention'] },
              { icon: '📋', title: 'Digital MEL Management', saving: 'Avoid $45K–$120K in fines', color: 'border-amber-500/30 bg-amber-500/5', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', points: ['Automatic expiry alerts prevent regulatory violations', 'CAT A/B/C/D tracking ensures correct deferral timelines', 'Eliminates manual tracking errors and missed renewals'] },
              { icon: '📦', title: 'Smart Parts Ordering', saving: '$200K–$350K in parts cost', color: 'border-green-500/30 bg-green-500/5', badge: 'text-green-400 bg-green-500/10 border-green-500/20', points: ['Predictive ordering eliminates AOG wait times', 'Inventory visibility prevents over-ordering', 'Integrates with supplier systems for real-time pricing'] },
              { icon: '👷', title: 'Labor Optimization', saving: '15–22% labor cost reduction', color: 'border-cyan-500/30 bg-cyan-500/5', badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', points: ['Digital workflows eliminate paper-chase time', 'Work assignment optimization reduces overtime', 'Shift handover in minutes, not an hour'] },
              { icon: '🛫', title: 'Dispatch Reliability', saving: '$180K per avoided AOG event', color: 'border-violet-500/30 bg-violet-500/5', badge: 'text-violet-400 bg-violet-500/10 border-violet-500/20', points: ['Real-time aircraft status visible across all departments', 'Automated alerts on release readiness', 'Integrated crew legality reduces last-minute cancellations'] },
              { icon: '🔐', title: 'Compliance Automation', saving: 'Eliminate $5K–$25K per audit', color: 'border-rose-500/30 bg-rose-500/5', badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20', points: ['Auto-generated audit trails for every action', 'Digital signatures are FAA-compliant and tamper-proof', 'AD/SB tracking prevents non-compliance fines'] },
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
                <div className={`text-[11px] font-black px-3 py-1.5 rounded-lg border inline-block ${badge}`}>💰 {saving}</div>
                <ul className="space-y-2">
                  {points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />{pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Size CTA */}
      <section className="px-5 py-20 border-t border-border bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-black text-white mb-3">What's Your Fleet Worth to Protect?</h2>
            <p className="text-muted-foreground">A single prevented AOG event typically covers 2–3 months of platform cost.</p>
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
              <Link to="/OpsHub" className="px-8 py-4 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl shadow-primary/20">
                See It Live — Enter Dashboard
              </Link>
              <Link to="/Academy" className="px-8 py-4 rounded-xl border border-violet-500/40 text-violet-300 text-sm font-bold hover:bg-violet-500/10 transition-all">
                Explore Academy →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 px-5 py-6 text-center text-xs text-muted-foreground">
        <p className="font-bold text-foreground mb-1">Aerodyne Fleet LLC</p>
        <p>Aircraft Maintenance Management System · Aviation Academy Platform · Part 147 Aligned</p>
      </footer>
    </div>
  );
}