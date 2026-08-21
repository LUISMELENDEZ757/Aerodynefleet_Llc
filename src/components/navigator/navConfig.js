import {
  Building2, BookOpen, ClipboardList, Wrench, Workflow,
  GraduationCap, Gavel, History, RefreshCw, Plane,
} from 'lucide-react';

export const CAT_CFG = {
  far:      { label: 'FAR',      color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  sop:      { label: 'SOP',      color: 'text-primary',      bg: 'bg-primary/15' },
  cba:      { label: 'CBA',      color: 'text-purple-400',  bg: 'bg-purple-500/15' },
  manual:   { label: 'Manual',  color: 'text-green-400',   bg: 'bg-green-500/15' },
  bulletin: { label: 'Bulletin',color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  policy:   { label: 'Policy',   color: 'text-muted-foreground', bg: 'bg-muted' },
  other:    { label: 'Other',    color: 'text-muted-foreground', bg: 'bg-muted' },
};

export const NAV_MODULES = [
  { id: 'operators',   label: 'Operators Manuals',        desc: 'Airline-specific procedures, SOPs, maintenance programs, ops specs & policies',  icon: Building2,      cats: ['sop', 'policy'] },
  { id: 'oem',          label: 'OEM Manuals',               desc: 'AMM · IPC · SRM · WDM · TSM · FIM · CMM · EMM & vendor manuals',                  icon: BookOpen,       cats: ['manual'] },
  { id: 'melcdl',      label: 'MEL / CDL Library',          desc: 'Integrated with aircraft status, deferrals & dispatch release logic',            icon: ClipboardList,  cats: ['far'] },
  { id: 'engineering', label: 'Engineering Orders',         desc: 'DER notes, RII guidance, engineering orders & disposition approvals',           icon: Wrench,         cats: ['other'] },
  { id: 'aerodyne',    label: 'Aerodyne Procedures',        desc: 'Custom workflows, disposition rules & internal engineering guidance',           icon: Workflow,       cats: ['sop'] },
  { id: 'training',    label: 'Training & Authorization',   desc: 'Task cards, qualification matrices & OJT tracking',                              icon: GraduationCap,  cats: ['other'] },
  { id: 'disposition', label: 'Disposition Engine',         desc: 'Rule hierarchy: Regulatory → Operator → OEM → Engineering',                      icon: Gavel,          special: true },
  { id: 'revision',    label: 'Revision Control',           desc: 'Track manual revisions & cross-source conflicts',                               icon: History,        special: true },
  { id: 'sync',        label: 'Manual Sync Status',         desc: 'Ingestion & cross-reference sync health',                                       icon: RefreshCw,      special: true, stat: true },
  { id: 'effectivity', label: 'Aircraft Effectivity',      desc: 'Tail-specific manual effectivity browser',                                      icon: Plane,          special: true },
];

export const VERDICTS = {
  approved: { label: 'APPROVED',        color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40',  dot: 'bg-green-400' },
  review:   { label: 'REQUIRES REVIEW', color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40', dot: 'bg-amber-400' },
  rii:      { label: 'REQUIRES RII',    color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/40', dot: 'bg-orange-400' },
  rejected: { label: 'REJECTED',        color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',    dot: 'bg-red-400' },
};