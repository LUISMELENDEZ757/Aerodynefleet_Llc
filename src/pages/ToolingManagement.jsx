import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, QrCode, Radio, Wifi, Plus, Package, CheckCircle, Users, Calendar, AlertTriangle, DollarSign, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToolInventory from '@/components/tooling/ToolInventory';
import ToolTransactions from '@/components/tooling/ToolTransactions';
import ToolCalibration from '@/components/tooling/ToolCalibration';
import ToolAnalytics from '@/components/tooling/ToolAnalytics';
import AddToolModal from '@/components/tooling/AddToolModal';
import QRScanModal from '@/components/tooling/QRScanModal.jsx';
import ToolQRSetup from '@/components/tooling/ToolQRSetup';

const TABS = [
  { id: 'inventory',     label: 'Inventory',     icon: Package },
  { id: 'transactions',  label: 'Transactions',   icon: Activity },
  { id: 'calibration',   label: 'Calibration',    icon: Calendar },
  { id: 'analytics',     label: 'Analytics',      icon: BarChart3 },
];

function StatCard({ icon: Icon, iconBg, value, label, badge, badgeColor }) {
  return (
    <div className="bg-[#141922] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && (
          <span className={cn('text-xs font-bold px-2 py-1 rounded-lg', badgeColor)}>{badge}</span>
        )}
      </div>
      <div>
        <p className="text-3xl font-extrabold text-white">{value}</p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function ToolingManagement() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [showAddTool, setShowAddTool] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [scanMode, setScanMode] = useState('qr');
  const [newTool, setNewTool] = useState(null);
  const queryClient = useQueryClient();
  // Force rebuild

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => base44.entities.Tool.list(),
    refetchInterval: 30000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['tool-transactions'],
    queryFn: () => base44.entities.ToolTransaction.list('-created_date', 50),
    refetchInterval: 30000,
  });

  // Stats
  const total = tools.length;
  const available = tools.filter(t => t.status === 'available').length;
  const checkedOut = tools.filter(t => t.status === 'checked_out').length;
  const calDue = tools.filter(t => t.status === 'calibration_due').length;
  const damaged = tools.filter(t => t.status === 'damaged').length;
  const totalValue = tools.reduce((sum, t) => sum + (t.value || 0), 0);
  const availPct = total > 0 ? Math.round((available / total) * 100) : 0;

  const recentTxCount = transactions.filter(tx => {
    const d = new Date(tx.created_date);
    const now = new Date();
    return (now - d) < 24 * 60 * 60 * 1000;
  }).length;

  const handleScan = (mode) => {
    setScanMode(mode);
    setShowQR(true);
  };

  const tabCounts = {
    inventory: total,
    transactions: recentTxCount,
    calibration: calDue,
    analytics: null,
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-orange-400 leading-tight">Tooling</h1>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Management</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="text-green-400">●</span> RFID &amp; QR Code Integrated &nbsp;•&nbsp; FAA Compliant
              </p>
            </div>
          </div>


        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          <StatCard icon={Package}      iconBg="bg-blue-600"   value={total}     label="Total Tools" />
          <StatCard icon={CheckCircle}  iconBg="bg-green-600"  value={available} label="Available"   badge={`${availPct}%`} badgeColor="bg-green-500/20 text-green-400" />
          <StatCard icon={Users}        iconBg="bg-indigo-600" value={checkedOut} label="Checked Out" badge="↗" badgeColor="text-blue-400" />
          <StatCard icon={Calendar}     iconBg="bg-orange-500" value={calDue}    label="Cal Due"     badge="⏱" badgeColor="text-orange-400" />
          <StatCard icon={AlertTriangle}iconBg="bg-red-600"    value={damaged}   label="Damaged"     badge="⚡" badgeColor="text-red-400" />
          <StatCard
            icon={DollarSign}
            iconBg="bg-violet-600"
            value={totalValue >= 1000 ? `$${(totalValue / 1000).toFixed(0)}K` : `$${totalValue}`}
            label="Total Value"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = tabCounts[id];
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0',
                activeTab === id
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#141922] border border-white/10 text-gray-400 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count != null && count > 0 && (
                <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  activeTab === id ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
                )}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="px-5">
        {activeTab === 'inventory'    && <ToolInventory tools={tools} transactions={transactions} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['tools', 'tool-transactions'] })} onScan={handleScan} onAddTool={() => setShowAddTool(true)} />}
        {activeTab === 'transactions' && <ToolTransactions transactions={transactions} />}
        {activeTab === 'calibration'  && <ToolCalibration tools={tools} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['tools'] })} />}
        {activeTab === 'analytics'    && <ToolAnalytics tools={tools} transactions={transactions} />}
      </div>

      {showAddTool && <AddToolModal onClose={() => setShowAddTool(false)} onSuccess={(tool) => { queryClient.invalidateQueries({ queryKey: ['tools'] }); setShowAddTool(false); setNewTool(tool); }} />}
      {newTool && <ToolQRSetup tool={newTool} onClose={() => setNewTool(null)} />}
      {showQR      && <QRScanModal mode={scanMode} onClose={() => setShowQR(false)} onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['tools', 'tool-transactions'] }); setShowQR(false); }} />}
    </div>
  );
}