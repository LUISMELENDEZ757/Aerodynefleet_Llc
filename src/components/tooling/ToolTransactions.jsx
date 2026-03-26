import { QrCode, Radio, Wifi, Hand, ArrowUpRight, ArrowDownLeft, Wrench, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TX_CFG = {
  checkout:      { label: 'Check Out',    icon: ArrowUpRight,    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  checkin:       { label: 'Check In',     icon: ArrowDownLeft,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  calibration:   { label: 'Calibration',  icon: Wrench,          color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  damage_report: { label: 'Damage',       icon: AlertTriangle,   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
  transfer:      { label: 'Transfer',     icon: ArrowLeftRight,  color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

const SCAN_ICONS = { qr: QrCode, rfid: Radio, nfc: Wifi, manual: Hand };

export default function ToolTransactions({ transactions }) {
  if (transactions.length === 0) {
    return <div className="text-center text-gray-500 py-16">No transactions yet</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Recent Activity</p>
      {transactions.map(tx => {
        const cfg = TX_CFG[tx.transaction_type] || TX_CFG.checkout;
        const TxIcon = cfg.icon;
        const ScanIcon = SCAN_ICONS[tx.scan_method] || SCAN_ICONS.manual;
        return (
          <div key={tx.id} className={cn('flex items-start gap-4 rounded-xl border px-4 py-3', cfg.bg)}>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.color, 'bg-current/10')}>
              <TxIcon className={cn('w-4 h-4', cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-xs font-bold uppercase tracking-widest', cfg.color)}>{cfg.label}</span>
                <div className="flex items-center gap-1 text-gray-500">
                  <ScanIcon className="w-3 h-3" />
                  <span className="text-[10px] uppercase">{tx.scan_method}</span>
                </div>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{tx.tool_name || tx.tool_number}</p>
              <p className="text-xs text-gray-400">By: {tx.technician_name}</p>
              {(tx.from_location || tx.to_location) && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {tx.from_location && `From: ${tx.from_location}`}
                  {tx.from_location && tx.to_location && ' → '}
                  {tx.to_location && `To: ${tx.to_location}`}
                </p>
              )}
              <p className="text-[10px] text-gray-600 mt-1">
                {tx.created_date ? new Date(tx.created_date).toLocaleString() : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}