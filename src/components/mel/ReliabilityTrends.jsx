import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function ReliabilityTrends() {
  const topAtas = [
    { name: 'Hydraulics', value: 8 },
    { name: 'Air Conditioning', value: 6 },
    { name: 'Electrical', value: 4 },
    { name: 'Flight Controls', value: 3 },
    { name: 'Fuel', value: 2 },
  ];

  const repeatDefects = [
    { name: 'BABBDT', value: 12 },
    { name: 'B737ER', value: 9 },
    { name: 'N123AB', value: 5 },
    { name: 'N123AB', value: 3 },
  ];

  const melsByType = [
    { name: 'A320', value: 420 },
    { name: 'B737', value: 8100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Top ATA Chapters */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Top ATA Chapters</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topAtas}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} />
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
            <Bar dataKey="value" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Repeat Defect Tails */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Repeat Defect Tails</h3>
        <div className="space-y-2">
          {repeatDefects.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${(item.value / 12) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MELs by Fleet Type */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">MELs by Fleet Type</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={melsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              <Cell fill="#f97316" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}