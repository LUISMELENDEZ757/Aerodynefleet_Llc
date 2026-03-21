import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane, BookOpen, Users, Radio, Zap, Globe, Shield, Cloud,
  ChevronRight, Play, Award, TrendingUp, Clock, Zap as ZapIcon,
  FileText, BarChart3, AlertTriangle, CheckCircle, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BackHeader from '@/components/layout/BackHeader';
import { useGridRovingTabindex } from '@/hooks/useRovingTabindex';

const MODULES = [
  {
    icon: Plane,
    title: 'Flight Operations',
    path: '/Dashboard',
    description: 'Real-time flight monitoring, dispatch management, and operational control center',
    benefits: [
      'Monitor all flights in real-time',
      'Manage dispatch releases and fuel planning',
      'Track crew legality and assignments',
      'Coordinate with all departments'
    ],
    color: 'from-primary to-primary/80'
  },
  {
    icon: BookOpen,
    title: 'Electronic Flight Bag',
    path: '/EFB',
    description: 'Digital flight documentation, performance calculations, and pre-flight briefings',
    benefits: [
      'Weight & balance calculations',
      'Runway performance analysis',
      'Live weather integration (METAR/TAF)',
      'Flight release sign-off'
    ],
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    icon: Radio,
    title: 'Flight Crew Dashboard',
    path: '/FlightCrew',
    description: 'Crew-centric operational data, checklists, and flight preparation tools',
    benefits: [
      'Daily flight schedule overview',
      'Pre-flight checklists',
      'Dispatch release information',
      'Real-time status updates'
    ],
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Users,
    title: 'Cabin Crew Dashboard',
    path: '/FlightAttendant',
    description: 'Cabin operations, safety procedures, and crew management for flight attendants',
    benefits: [
      'Flight assignments and status',
      'Safety checklist procedures',
      'Pilot briefing information',
      'Cabin configuration details'
    ],
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Zap,
    title: 'Crew Control',
    path: '/CrewControl',
    description: 'FAR 117 compliance monitoring and crew scheduling intelligence',
    benefits: [
      'Monitor crew duty time limits',
      'Identify illegal pairings',
      'Fatigue prediction analytics',
      'Scheduling optimization'
    ],
    color: 'from-red-500 to-red-600'
  },
  {
    icon: Cloud,
    title: 'Aviation Weather',
    path: '/Weather',
    description: 'Live METAR, TAF, and SIGMET data for informed decision-making',
    benefits: [
      'Real-time flight category (VFR/MVFR/IFR)',
      'Meteorological forecasts',
      'Significant weather alerts',
      'Aviation Weather Center data'
    ],
    color: 'from-cyan-500 to-cyan-600'
  }
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Operational Efficiency',
    description: 'Streamline flight operations with integrated dashboards and real-time data synchronization across all departments.'
  },
  {
    icon: AlertTriangle,
    title: 'Safety & Compliance',
    description: 'Ensure regulatory compliance (FAR 117, MEL/CDL rules) with automated monitoring and alerts for potential violations.'
  },
  {
    icon: Clock,
    title: 'Time Savings',
    description: 'Reduce manual data entry and coordination time with automated workflows and centralized information.'
  },
  {
    icon: Award,
    title: 'Decision Support',
    description: 'Make better operational decisions with integrated performance calculations, weather data, and predictive analytics.'
  },
  {
    icon: CheckCircle,
    title: 'Quality Assurance',
    description: 'Track safety incidents, maintenance issues, and operational metrics for continuous improvement.'
  },
  {
    icon: ZapIcon,
    title: 'Scalability',
    description: 'Enterprise-grade platform designed to support multiple aircraft types, crews, and operational complexity.'
  }
];

export default function LearningCenter() {
  const [expandedModule, setExpandedModule] = useState(null);
  const rowCount = Math.ceil(MODULES.length / 3);
  const { focusedIndex, setFocusedIndex, handleKeyDown, getTabIndex, registerRef } = 
    useGridRovingTabindex(rowCount, 3, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <BackHeader title="Learning Center" subtitle="App Guide & Tutorials" />
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-6 pb-5">
      <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link to="/Home" aria-label="Go to Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
        </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">LEARNING CENTER</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">App Guide · Module Tutorials · Operations Benefits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Welcome Section */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Welcome to Aerodyne Ops</h2>
          <p className="text-sm sm:text-base text-foreground/80 mb-4">
            A comprehensive airline operations platform designed to streamline flight operations, crew management, and safety compliance across your entire organization.
          </p>
          <p className="text-xs sm:text-sm text-foreground/60">
            This learning center guides you through each operational module and explains how they work together to improve your airline's efficiency and safety.
          </p>
        </div>

        {/* Module Grid */}
        <div>
          <h2 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" aria-hidden="true" />
            Operational Modules
          </h2>
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            onKeyDown={handleKeyDown}
            role="grid"
            aria-label="Operational modules with arrow key navigation"
          >
            {MODULES.map(({ icon: Icon, title, path, description, benefits, color }, idx) => (
              <button
                key={idx}
                ref={(el) => registerRef(idx, el)}
                tabIndex={getTabIndex(idx)}
                onClick={() => setExpandedModule(expandedModule === idx ? null : idx)}
                aria-expanded={expandedModule === idx}
                aria-label={`${title}: ${description}${expandedModule === idx ? ' - expanded' : ''}`}
                className={cn(
                  'rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  focusedIndex === idx && 'ring-2 ring-primary ring-offset-2',
                  expandedModule === idx && 'border-primary/60 bg-card/80'
                )}
              >
                {/* Header */}
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-r', color)} aria-hidden="true">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>

                {/* Expanded indicator */}
                <div className="absolute top-4 right-4">
                  {expandedModule === idx ? (
                    <ChevronDown className="w-4 h-4 text-primary" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>

                {/* Expanded Content */}
                {expandedModule === idx && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Benefits:</p>
                    <ul className="space-y-1.5" aria-label="Key benefits">
                       {benefits.map((benefit, i) => (
                         <li key={i} className="text-xs text-foreground flex items-start gap-2">
                           <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                           {benefit}
                         </li>
                       ))}
                    </ul>
                    <Link
                        to={path}
                        aria-label={`Open ${title} module`}
                        className="inline-block mt-3 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
                      >
                        Open Module <ChevronRight className="w-3 h-3" aria-hidden="true" />
                      </Link>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div>
          <h2 className="text-xl font-extrabold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" aria-hidden="true" />
            Operational Benefits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="region" aria-label="Platform benefits overview">
            {BENEFITS.map(({ icon: Icon, title, description }, idx) => (
              <div 
                key={idx} 
                className="rounded-xl bg-card border border-border p-5"
                role="article"
                aria-label={`${title}: ${description}`}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3" aria-hidden="true">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Concepts */}
        <div className="rounded-xl bg-secondary/30 border border-border p-6" role="region" aria-label="Key aviation concepts">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
            Key Concepts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <article>
              <h3 className="font-semibold text-foreground mb-1">Flight Categories</h3>
              <p className="text-xs text-muted-foreground">VFR (Visual Flight Rules), MVFR (Marginal VFR), IFR (Instrument Flight Rules), LIFR (Low IFR)</p>
            </article>
            <article>
              <h3 className="font-semibold text-foreground mb-1">FAR 117 Compliance</h3>
              <p className="text-xs text-muted-foreground">Federal Aviation Regulation Part 117 governs flight crew duty time and rest requirements.</p>
            </article>
            <article>
              <h3 className="font-semibold text-foreground mb-1">MEL/CDL Logic</h3>
              <p className="text-xs text-muted-foreground">Minimum Equipment List (MEL) and Configuration Deviation List (CDL) determine dispatch rules.</p>
            </article>
            <article>
              <h3 className="font-semibold text-foreground mb-1">METAR/TAF</h3>
              <p className="text-xs text-muted-foreground">METAR = current weather. TAF = forecast. Critical for flight planning and dispatch decisions.</p>
            </article>
          </div>
        </div>

        {/* Getting Started */}
        <div className="rounded-xl bg-primary/10 border border-primary/30 p-6" role="region" aria-label="Getting started guide">
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
            Getting Started
          </h2>
          <ol className="space-y-2 text-sm text-foreground/80">
            <li><span className="font-bold text-primary" aria-hidden="true">1.</span> <span>Browse the modules in the grid above to understand each operational area.</span></li>
            <li><span className="font-bold text-primary" aria-hidden="true">2.</span> <span>Click "Open Module" to access the actual dashboard and see live data.</span></li>
            <li><span className="font-bold text-primary" aria-hidden="true">3.</span> <span>Explore the features, data, and tools available in each module.</span></li>
            <li><span className="font-bold text-primary" aria-hidden="true">4.</span> <span>Reference this learning center anytime you need guidance on platform usage.</span></li>
          </ol>
        </div>
      </div>
    </div>
  );
}