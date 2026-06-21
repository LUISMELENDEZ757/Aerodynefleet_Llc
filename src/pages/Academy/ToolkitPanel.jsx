import { useState } from 'react';
import { X, FileText, ExternalLink, Download, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Add your PDF links here ────────────────────────────────────────────────
// Each category has a label, icon, and array of { title, description, url }
const TOOLKIT_RESOURCES = [
  {
    category: 'FAA Regulations',
    icon: '⚖️',
    color: '#3b82f6',
    resources: [
      {
        title: '14 CFR Part 43 — Maintenance, Preventive Maintenance & Alterations',
        description: 'Full text of Part 43 including maintenance entry requirements.',
        url: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-C/part-43',
      },
      {
        title: '14 CFR Part 65 — Certification: Airmen Other Than Flight Crewmembers',
        description: 'A&P and IA certification requirements.',
        url: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-65',
      },
      {
        title: '14 CFR Part 147 — Aviation Maintenance Technician Schools',
        description: 'Part 147 school curriculum and certification standards.',
        url: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-H/part-147',
      },
    ],
  },
  {
    category: 'MEL / NEF / CDL Reference',
    icon: '📋',
    color: '#f59e0b',
    resources: [
      {
        title: 'AC 120-36 — Minimum Equipment List (MEL) Guidance',
        description: 'FAA Advisory Circular on MEL development and use.',
        url: 'https://rgl.faa.gov/Regulatory_and_Guidance_Library/rgAdvisoryCircular.nsf/0/ff2c73e4a71e41a886256bb0006bcabe/$FILE/AC120-36B.pdf',
      },
      {
        title: 'MMEL Policy Letter Index',
        description: 'FAA index of Master MEL policy letters by aircraft type.',
        url: 'https://www.faa.gov/aircraft/air_cert/design_approvals/air_software/mmel',
      },
    ],
  },
  {
    category: 'Powerplant & Engines',
    icon: '🔩',
    color: '#f43f5e',
    resources: [
      {
        title: 'FAA-H-8083-32 — Aviation Maintenance Technician Handbook — Powerplant',
        description: 'Complete FAA powerplant handbook covering reciprocating engines, turbines, propellers, and inspection.',
        url: 'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/amt_powerplant_handbook.pdf',
      },
    ],
  },
  {
    category: 'Airframe Systems',
    icon: '✈️',
    color: '#22c55e',
    resources: [
      {
        title: 'FAA-H-8083-31B — Aviation Maintenance Technician Handbook — Airframe',
        description: 'Complete airframe handbook covering structures, hydraulics, pneumatics, fuel, electrical, and avionics systems.',
        url: 'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/FAA-H-8083-31B_Aviation_Maintenance_Technician_Handbook.pdf',
      },
    ],
  },
  {
    category: 'General Knowledge',
    icon: '📚',
    color: '#8b5cf6',
    resources: [
      {
        title: 'FAA-H-8083-30 — Aviation Maintenance Technician Handbook — General',
        description: 'Mathematics, science, electrical fundamentals, and tools.',
        url: 'https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/amtg_handbook.pdf',
      },
      {
        title: 'AC 43.13-1B — Acceptable Methods, Techniques, and Practices',
        description: 'Standard maintenance methods and acceptable practices.',
        url: 'https://rgl.faa.gov/Regulatory_and_Guidance_Library/rgAdvisoryCircular.nsf/0/99c cas/$FILE/AC43.13-1B.pdf',
      },
    ],
  },
  {
    category: 'Study Guides & Practice Tests',
    icon: '🎯',
    color: '#06b6d4',
    resources: [
      {
        title: 'FAA Knowledge Test — AMT General ACS',
        description: 'Airman Certification Standards for the AMT General knowledge test.',
        url: 'https://www.faa.gov/training_testing/testing/acs',
      },
      {
        title: 'FAA AMT Question Bank Overview',
        description: 'Overview of the A&P written test topics and question distribution.',
        url: 'https://www.faa.gov/training_testing/testing/test_questions',
      },
    ],
  },
];

export default function ToolkitPanel({ onClose }) {
  const [openCat, setOpenCat] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0f1623] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Student Toolkit</p>
              <p className="text-[10px] text-gray-500">Reference PDFs · FAA Handbooks · Regulations</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Info bar */}
        <div className="px-5 py-3 bg-emerald-900/10 border-b border-emerald-500/15 flex-shrink-0">
          <p className="text-[11px] text-emerald-300/80 leading-relaxed">
            External reference materials for study. Links open in a new tab. All documents are publicly available FAA publications.
          </p>
        </div>

        {/* Resource list */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-2">
          {TOOLKIT_RESOURCES.map((cat, ci) => (
            <div key={ci} className="rounded-xl border border-white/8 overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => setOpenCat(openCat === ci ? -1 : ci)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{cat.icon}</span>
                  <p className="text-sm font-extrabold text-white">{cat.category}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/8 text-gray-400">
                    {cat.resources.length}
                  </span>
                </div>
                {openCat === ci
                  ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
              </button>

              {/* Resources */}
              {openCat === ci && (
                <div className="border-t border-white/8 divide-y divide-white/5">
                  {cat.resources.map((res, ri) => (
                    <a
                      key={ri}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${cat.color}20` }}>
                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                          {res.title}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{res.description}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 flex-shrink-0 mt-1 transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex-shrink-0">
          <p className="text-[10px] text-gray-600 text-center">
            To add more resources, edit <span className="font-mono text-gray-500">pages/Academy/ToolkitPanel</span> → TOOLKIT_RESOURCES array
          </p>
        </div>
      </div>
    </div>
  );
}