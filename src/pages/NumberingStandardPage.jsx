import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, Send, ShieldCheck, Database, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import LiveClock from '@/components/ui/LiveClock';
import NumberingReference from '@/components/numbering/NumberingReference';
import NumberIssueForm from '@/components/numbering/NumberIssueForm';
import NumberValidator from '@/components/numbering/NumberValidator';
import CountersManager from '@/components/numbering/CountersManager';

const TABS = [
  { id: 'reference', label: 'Reference', icon: BookOpen },
  { id: 'issue', label: 'Issue Number', icon: Send },
  { id: 'validate', label: 'Validate', icon: ShieldCheck },
  { id: 'counters', label: 'Counters', icon: Database },
];

export default function NumberingStandardPage() {
  const [tab, setTab] = useState('reference');

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 z-20 bg-[#0d1117]">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Hash className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-wide leading-none">M&E Numbering Standard</p>
            <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase mt-0.5">ATA-Driven · Traceable · FAA/EASA Compliant</p>
          </div>
        </div>
        <LiveClock />
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all',
              tab === id ? 'bg-amber-500 text-black' : 'bg-[#1a1f2e] text-gray-400 hover:text-white border border-white/8')}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Master format banner */}
      <div className="px-5 pt-4">
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Master Format</p>
            <p className="text-lg font-black font-mono text-amber-400 tracking-wider">[ATA]-[Sub]-[Class]-[Seq]</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Class Codes</p>
            <p className="text-xs font-mono text-white">9·7·5·3·1</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-4 max-w-5xl mx-auto">
        {tab === 'reference' && <NumberingReference />}
        {tab === 'issue' && <NumberIssueForm />}
        {tab === 'validate' && <NumberValidator />}
        {tab === 'counters' && <CountersManager />}
      </div>
    </div>
  );
}