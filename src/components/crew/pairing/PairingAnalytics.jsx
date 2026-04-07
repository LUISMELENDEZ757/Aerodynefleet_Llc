import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const BLOCK_DATA = [
  { name: 'Mon', flightCrew: 32, cabinCrew: 30 },
  { name: 'Tue', flightCrew: 28, cabinCrew: 27 },
  { name: 'Wed', flightCrew: 35, cabinCrew: 34 },
  { name: 'Thu', flightCrew: 40, cabinCrew: 38 },
  { name: 'Fri', flightCrew: 45, cabinCrew: 43 },
  { name: 'Sat', flightCrew: 38, cabinCrew: 36 },
  { name: 'Sun', flightCrew: 30, cabinCrew: 29 },
];

const COVERAGE = [
  { name: 'Covered',   value: 94, color: '#10b981' },
  { name: 'Open',      value: 3,  color: '#f43f5e' },
  { name: 'Reserve',   value: 3,  color: '#38bdf8' },
];

const DUTY_TREND = [
  { day: 'W1', avg: 7.2 }, { day: 'W2', avg: 8.1 }, { day: 'W3', avg: 7.8 },
  { day: 'W4', avg: 9.0 }, { day: 'W5', avg: 8.4 }, { day: 'W6', avg: 7.5 },
  { day: 'W7', avg: 8.9 },
];

const UTILIZATION = [
  { name: 'Capt. Harrison', util: 88 },
  { name: 'F/O Chen',       util: 92 },
  { name: 'Capt. Nguyen',   util: 65 },
  { name: 'F/O Park',       util: 71 },
  { name: 'F/O Davis',      util: 55 },
  { name: 'Purser Williams',util: 79 },
  { name: 'FA Thompson',    util: 84 },
  { name: 'FA Patel',       util: 70 },
];

const tooltipStyle = { backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius:8, fontSize:11 };

const StatCard = ({ label, value, sub, color = 'text-primary' }) => (
  <div className="rounded-2xl border border-border bg-card px-4 py-3">
    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">{label}</p>
    <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

export default function PairingAnalytics() {
  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Coverage Rate" value="94%" sub="3 open pairings" color="text-emerald-400" />
        <StatCard label="Avg Block / Pairing" value="12.4h" sub="This bid period" />
        <StatCard label="Deadhead Trips" value="4" sub="↓ 2 vs last month" color="text-sky-400" />
        <StatCard label="Reserve Activations" value="6" sub="This week" color="text-purple-400" />
      </div>

      {/* Row 1: Block hours + coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-extrabold text-foreground uppercase tracking-widest mb-4">Block Hours by Day (This Week)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BLOCK_DATA}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="flightCrew" fill="#f59e0b" radius={[4,4,0,0]} name="Flight Crew" />
              <Bar dataKey="cabinCrew"  fill="#8b5cf6" radius={[4,4,0,0]} name="Cabin Crew" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-extrabold text-foreground uppercase tracking-widest mb-4">Pairing Coverage</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={COVERAGE} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {COVERAGE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {COVERAGE.map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span className="text-[10px] text-muted-foreground">{c.name} {c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Avg duty trend + utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-extrabold text-foreground uppercase tracking-widest mb-4">Avg FDP Trend (hours)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={DUTY_TREND}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[6, 10]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Avg FDP" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-1">FAR 117 limit: 13h · Threshold alert at 11h</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-extrabold text-foreground uppercase tracking-widest mb-4">Crew Utilization %</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={UTILIZATION} layout="vertical">
              <XAxis type="number" domain={[0,100]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => v + '%'} />
              <Bar dataKey="util" radius={[0,4,4,0]} name="Utilization"
                fill="#f59e0b"
                label={{ position: 'right', fontSize: 9, fill: '#94a3b8', formatter: v => v + '%' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost summary */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-extrabold text-foreground uppercase tracking-widest mb-3">Cost Efficiency Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Cost Per Block Hour', '$842', 'text-foreground'],
            ['Deadhead Cost', '$12,400', 'text-amber-400'],
            ['Overtime Hours', '28h', 'text-rose-400'],
            ['Reserve Utilization', '71%', 'text-sky-400'],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{l}</p>
              <p className={`text-xl font-black mt-1 ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}