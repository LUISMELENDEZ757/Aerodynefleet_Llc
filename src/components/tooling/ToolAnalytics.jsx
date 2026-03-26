import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#6b7280'];
const STATUS_LABELS = { available: 'Available', checked_out: 'Checked Out', calibration_due: 'Cal Due', damaged: 'Damaged', retired: 'Retired' };

export default function ToolAnalytics({ tools, transactions }) {
  // Status distribution
  const statusData = Object.entries(
    tools.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {})
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count }));

  // Category distribution
  const catData = Object.entries(
    tools.reduce((acc, t) => { acc[t.category || 'other'] = (acc[t.category || 'other'] || 0) + 1; return acc; }, {})
  ).map(([cat, count]) => ({ name: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '), count }));

  // Top used tools
  const topUsed = [...tools].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 5);

  // Value by category
  const valueData = Object.entries(
    tools.reduce((acc, t) => { acc[t.category || 'other'] = (acc[t.category || 'other'] || 0) + (t.value || 0); return acc; }, {})
  ).map(([cat, val]) => ({ name: cat.replace('_', ' '), value: val }));

  const totalValue = tools.reduce((s, t) => s + (t.value || 0), 0);
  const avgUsage = tools.length > 0 ? Math.round(tools.reduce((s, t) => s + (t.usage_count || 0), 0) / tools.length) : 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tools',    value: tools.length },
          { label: 'Total Value',    value: `$${(totalValue / 1000).toFixed(1)}K` },
          { label: 'Avg Usage',      value: `${avgUsage}x` },
          { label: 'Transactions',   value: transactions.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status pie */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-bold text-white mb-4">Status Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category bar */}
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-bold text-white mb-4">Tools by Category</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top used tools */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-bold text-white mb-4">Top Used Tools</p>
        {topUsed.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No usage data yet</p>
        ) : (
          <div className="space-y-3">
            {topUsed.map((t, i) => (
              <div key={t.id} className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-600 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.tool_number}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/10 rounded-full h-2">
                    <div className="bg-orange-500 rounded-full h-2" style={{ width: `${Math.min(100, ((t.usage_count || 0) / (topUsed[0]?.usage_count || 1)) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-orange-400 w-10 text-right">{t.usage_count || 0}x</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Value by category */}
      <div className="bg-[#141922] border border-white/10 rounded-2xl p-5">
        <p className="text-sm font-bold text-white mb-4">Asset Value by Category</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={valueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={v => `$${v.toLocaleString()}`} contentStyle={{ background: '#141922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
            <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}