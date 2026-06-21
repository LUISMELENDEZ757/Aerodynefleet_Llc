import { useState } from 'react';
import { Award, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Download, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACADEMY_COURSES } from './academyData';

// ── Cert status logic ─────────────────────────────────────────────────────────
function certStatus(progress) {
  const done = Object.keys(progress).length;
  const total = ACADEMY_COURSES.length;
  if (done === 0) return { label: 'Not Started', color: 'text-gray-500', bg: 'bg-gray-800/40', border: 'border-gray-700/40', icon: null };
  if (done < total) {
    const avgSoFar = Math.round(Object.values(progress).reduce((a, b) => a + (b.pct || 0), 0) / done);
    return { label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-700/30', pct: avgSoFar, icon: Clock };
  }
  const avg = Math.round(Object.values(progress).reduce((a, b) => a + (b.pct || 0), 0) / total);
  if (avg >= 70) return { label: 'Certificate Eligible', color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-600/40', pct: avg, icon: Award };
  return { label: 'Below Threshold', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700/30', pct: avg, icon: XCircle };
}

function scoreColor(pct) {
  if (pct == null) return 'text-gray-600';
  if (pct >= 80) return 'text-green-400';
  if (pct >= 60) return 'text-amber-400';
  return 'text-red-400';
}

// ── Expandable student row ────────────────────────────────────────────────────
function StudentProgressRow({ user, rank }) {
  const [expanded, setExpanded] = useState(false);

  const progress = (() => {
    try { return JSON.parse(user.academy_progress || '{}'); } catch { return {}; }
  })();

  const completedCount = Object.keys(progress).length;
  const totalCourses = ACADEMY_COURSES.length;
  const avgScore = completedCount > 0
    ? Math.round(Object.values(progress).reduce((a, b) => a + (b.pct || 0), 0) / completedCount)
    : null;
  const cert = certStatus(progress);
  const CertIcon = cert.icon;

  return (
    <>
      {/* Main row */}
      <tr
        onClick={() => setExpanded(e => !e)}
        className="cursor-pointer hover:bg-white/4 transition-colors border-b border-white/6"
      >
        {/* Rank */}
        <td className="px-4 py-3.5 text-center">
          <span className="text-xs font-black text-gray-600">#{rank}</span>
        </td>

        {/* Student */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-primary">{(user.full_name || user.email || '?')[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-none">{user.full_name || '—'}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        </td>

        {/* Modules completed */}
        <td className="px-4 py-3.5 text-center">
          <div className="inline-flex flex-col items-center">
            <span className={cn('text-base font-black', completedCount === totalCourses ? 'text-green-400' : completedCount > 0 ? 'text-white' : 'text-gray-600')}>
              {completedCount}/{totalCourses}
            </span>
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${(completedCount / totalCourses) * 100}%` }} />
            </div>
          </div>
        </td>

        {/* Avg quiz score */}
        <td className="px-4 py-3.5 text-center">
          <span className={cn('text-base font-black', scoreColor(avgScore))}>
            {avgScore != null ? `${avgScore}%` : '—'}
          </span>
        </td>

        {/* Module dots (quick visual) */}
        <td className="px-4 py-3.5 hidden lg:table-cell">
          <div className="flex items-center gap-1.5">
            {ACADEMY_COURSES.map(c => {
              const done = progress[c.id];
              return (
                <div
                  key={c.id}
                  title={`${c.title}: ${done ? `${done.pct}%` : 'Not started'}`}
                  className={cn('w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black',
                    done
                      ? done.pct >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/5 text-gray-700 border border-white/8'
                  )}
                >
                  {done ? done.pct : c.icon}
                </div>
              );
            })}
          </div>
        </td>

        {/* Certificate status */}
        <td className="px-4 py-3.5">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold', cert.bg, cert.border, cert.color)}>
            {CertIcon && <CertIcon className="w-3 h-3" />}
            {cert.label}
          </span>
        </td>

        {/* Expand toggle */}
        <td className="px-4 py-3.5 text-center">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-500 mx-auto" />
            : <ChevronDown className="w-4 h-4 text-gray-500 mx-auto" />}
        </td>
      </tr>

      {/* Expanded per-module breakdown */}
      {expanded && (
        <tr className="bg-[#0d1117] border-b border-white/10">
          <td colSpan={7} className="px-6 py-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Per-Module Quiz Scores</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ACADEMY_COURSES.map((course, idx) => {
                const done = progress[course.id];
                const isLocked = idx > 0 && !progress[ACADEMY_COURSES[idx - 1].id];
                return (
                  <div key={course.id}
                    className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 border',
                      done
                        ? done.pct >= 70 ? 'bg-green-900/15 border-green-700/30' : 'bg-red-900/15 border-red-700/30'
                        : isLocked ? 'bg-white/3 border-white/5 opacity-40' : 'bg-[#141922] border-white/10'
                    )}
                  >
                    <span className="text-lg leading-none">{course.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-none">{course.title}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">{course.quiz.length} questions · {course.estimatedMinutes} min</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {done ? (
                        <>
                          <p className={cn('text-sm font-black', scoreColor(done.pct))}>{done.pct}%</p>
                          <p className="text-[9px] text-gray-600">{done.score}/{done.total} correct</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-600">{isLocked ? '🔒' : 'Not taken'}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cert eligibility summary */}
            <div className={cn('mt-4 rounded-xl px-4 py-3 border flex items-center gap-3', cert.bg, cert.border)}>
              {CertIcon && <CertIcon className={cn('w-5 h-5 flex-shrink-0', cert.color)} />}
              <div className="flex-1">
                <p className={cn('text-xs font-extrabold', cert.color)}>{cert.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {completedCount === totalCourses
                    ? cert.label === 'Certificate Eligible'
                      ? `All ${totalCourses} modules completed with ${cert.pct}% average — meets 70% threshold.`
                      : `All modules completed but average score ${cert.pct}% is below 70% threshold.`
                    : `${completedCount} of ${totalCourses} modules completed. Must finish all modules to earn certificate.`
                  }
                </p>
              </div>
              {cert.label === 'Certificate Eligible' && (
                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-black text-green-400 px-2.5 py-1.5 rounded-lg bg-green-900/30 border border-green-600/40">
                  <Download className="w-3 h-3" /> Ready to Issue
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function StudentProgressTable({ students }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('avg'); // avg | name | modules | cert
  const [sortDir, setSortDir] = useState('desc');

  const filtered = students
    .filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    .map(u => {
      const progress = (() => { try { return JSON.parse(u.academy_progress || '{}'); } catch { return {}; } })();
      const completedCount = Object.keys(progress).length;
      const avgScore = completedCount > 0
        ? Math.round(Object.values(progress).reduce((a, b) => a + (b.pct || 0), 0) / completedCount) : -1;
      return { ...u, _progress: progress, _completed: completedCount, _avg: avgScore };
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'avg') diff = a._avg - b._avg;
      else if (sortBy === 'modules') diff = a._completed - b._completed;
      else if (sortBy === 'name') diff = (a.full_name || '').localeCompare(b.full_name || '');
      else if (sortBy === 'cert') {
        const certOrder = { 'Certificate Eligible': 3, 'In Progress': 2, 'Below Threshold': 1, 'Not Started': 0 };
        diff = certOrder[certStatus(a._progress).label] - certOrder[certStatus(b._progress).label];
      }
      return sortDir === 'desc' ? -diff : diff;
    });

  const certEligible = filtered.filter(u => certStatus(u._progress).label === 'Certificate Eligible').length;
  const inProgress   = filtered.filter(u => certStatus(u._progress).label === 'In Progress').length;
  const notStarted   = filtered.filter(u => certStatus(u._progress).label === 'Not Started').length;

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />)
    : null;

  return (
    <div className="space-y-4">

      {/* Summary KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cert Eligible', value: certEligible, color: 'text-green-400', bg: 'bg-green-900/15 border-green-700/30' },
          { label: 'In Progress',   value: inProgress,   color: 'text-amber-400', bg: 'bg-amber-900/15 border-amber-700/30' },
          { label: 'Not Started',   value: notStarted,   color: 'text-gray-500',  bg: 'bg-[#141922] border-white/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-2xl border px-4 py-3.5 text-center', bg)}>
            <p className={cn('text-3xl font-black', color)}>{value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#141922] border border-white/10 rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search students…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-gray-600 bg-[#141922] rounded-2xl border border-white/10">
          <Award className="w-10 h-10 mx-auto mb-2 text-gray-700" />
          <p className="text-sm">No students found</p>
        </div>
      ) : (
        <div className="bg-[#141922] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0f1622]">
                  <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest w-10">#</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                    Student <SortIcon col="name" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:text-white" onClick={() => handleSort('modules')}>
                    Modules <SortIcon col="modules" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:text-white" onClick={() => handleSort('avg')}>
                    Quiz Avg <SortIcon col="avg" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hidden lg:table-cell">
                    Module Scores
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-white" onClick={() => handleSort('cert')}>
                    Certificate <SortIcon col="cert" />
                  </th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <StudentProgressRow key={u.id} user={u} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-white/6 text-[10px] text-gray-600">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''} · Click any row to expand module-level quiz scores
          </div>
        </div>
      )}
    </div>
  );
}