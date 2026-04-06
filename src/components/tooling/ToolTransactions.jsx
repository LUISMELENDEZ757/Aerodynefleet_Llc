import { useState, useMemo } from 'react';
import {
  QrCode, Radio, Wifi, Hand, ArrowUpRight, ArrowDownLeft,
  Wrench, AlertTriangle, ArrowLeftRight, Search, User,
  Calendar, Clock, Filter, X, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TX_CFG = {
  checkout:      { label: 'Check Out',   icon: ArrowUpRight,   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' },
  checkin:       { label: 'Check In',    icon: ArrowDownLeft,  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25' },
  calibration:   { label: 'Calibration', icon: Wrench,         color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  damage_report: { label: 'Damage',      icon: AlertTriangle,  color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/25' },
  transfer:      { label: 'Transfer',    icon: ArrowLeftRight, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
};

const SCAN_ICONS = { qr: QrCode, rfid: Radio, nfc: Wifi, manual: Hand };

function fmt(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ToolTransactions({ transactions }) {
  const [techSearch, setTechSearch] = useState('');
  const [toolSearch, setToolSearch]  = useState('');
  const [typeFilter, setTypeFilter]  = useState('');
  const [dateFrom,   setDateFrom]    = useState('');
  const [dateTo,     setDateTo]      = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const q = techSearch.toLowerCase();
      const tq = toolSearch.toLowerCase();
      const matchTech = !techSearch ||
        tx.technician_name?.toLowerCase().includes(q) ||
        tx.technician_id?.toLowerCase().includes(q);
      const matchTool = !toolSearch ||
        tx.tool_name?.toLowerCase().includes(tq) ||
        tx.tool_number?.toLowerCase().includes(tq);
      const matchType = !typeFilter || tx.transaction_type === typeFilter;
      const ts = tx.timestamp || tx.created_date;
      const txDate = ts ? new Date(ts) : null;
      const matchFrom = !dateFrom || (txDate && txDate >= new Date(dateFrom));
      const matchTo   = !dateTo   || (txDate && txDate <= new Date(dateTo + 'T23:59:59'));
      return matchTech && matchTool && matchType && matchFrom && matchTo;
    });
  }, [transactions, techSearch, toolSearch, typeFilter, dateFrom, dateTo]);

  // Technician summary: unique techs with checkout/checkin counts
  const techSummary = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      const name = tx.technician_name || 'Unknown';
      if (!map[name]) map[name] = { name, checkouts: 0, checkins: 0, last: null };
      if (tx.transaction_type === 'checkout') map[name].checkouts++;
      if (tx.transaction_type === 'checkin')  map[name].checkins++;
      const ts = tx.timestamp || tx.created_date;
      if (ts && (!map[name].last || new Date(ts) > new Date(map[name].last))) {
        map[name].last = ts;
      }
    });
    return Object.values(map).sort((a, b) => (b.checkouts + b.checkins) - (a.checkouts + a.checkins));
  }, [transactions]);

  const hasFilters = techSearch || toolSearch || typeFilter || dateFrom || dateTo;
  const clearAll = () => { setTechSearch(''); setToolSearch(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); };

  // CSV export
  const exportCSV = () => {
    const headers = ['Date/Time','Type','Tool Number','Tool Name','Technician','Tech ID','From','To','Method'];
    const rows = filtered.map(tx => [
      fmt(tx.timestamp || tx.created_date),
      tx.transaction_type,
      tx.tool_number,
      tx.tool_name,
      tx.technician_name,
      tx.technician_id || '',
      tx.from_location || '',
      tx.to_location || '',
      tx.scan_method,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tool_transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* ── Search Row ── */}
      <div className="flex gap-2 flex-col sm:flex-row">
        {/* Technician search */}
        <div className="relative flex-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
          <input
            value={techSearch}
            onChange={e => setTechSearch(e.target.value)}
            placeholder="Search by technician name or ID…"
            className="w-full bg-[#141922] border border-blue-500/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
          {techSearch && (
            <button onClick={() => setTechSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Tool search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={toolSearch}
            onChange={e => setToolSearch(e.target.value)}
            placeholder="Search by tool name or number…"
            className="w-full bg-[#141922] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors flex-shrink-0',
            showFilters ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/10 bg-[#141922] text-gray-400 hover:text-white')}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-[#141922] text-gray-400 hover:text-white text-sm font-bold flex-shrink-0">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      {/* ── Advanced Filters ── */}
      {showFilters && (
        <div className="bg-[#141922] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Transaction Type</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500">
                <option value="">All Types</option>
                <option value="checkout">Check Out</option>
                <option value="checkin">Check In</option>
                <option value="calibration">Calibration</option>
                <option value="damage_report">Damage Report</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Date From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Date To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* ── Technician Summary Cards ── */}
      {!hasFilters && techSummary.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Technician Activity Summary</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {techSummary.slice(0, 8).map(t => (
              <button key={t.name}
                onClick={() => setTechSearch(t.name)}
                className="flex-shrink-0 bg-[#141922] border border-white/10 rounded-xl px-4 py-3 text-left hover:border-blue-500/40 hover:bg-blue-500/5 transition-all min-w-[160px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className="text-xs font-extrabold text-white truncate">{t.name}</p>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-blue-400 font-bold">↑{t.checkouts} out</span>
                  <span className="text-green-400 font-bold">↓{t.checkins} in</span>
                </div>
                {t.last && <p className="text-[10px] text-gray-600 mt-1 truncate">{new Date(t.last).toLocaleDateString()}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Result count + clear ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          <span className="text-white font-bold">{filtered.length}</span> of {transactions.length} transactions
          {techSearch && <span className="ml-1.5 text-blue-400 font-bold">· Tech: "{techSearch}"</span>}
        </p>
        {hasFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-bold">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Transaction List ── */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-[#141922] border border-white/10 rounded-2xl">
          <User className="w-8 h-8 mx-auto mb-2 text-gray-700" />
          <p>No transactions found</p>
          {hasFilters && <p className="text-xs mt-1">Try adjusting your search or filters</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => {
            const cfg = TX_CFG[tx.transaction_type] || TX_CFG.checkout;
            const TxIcon = cfg.icon;
            const ScanIcon = SCAN_ICONS[tx.scan_method] || SCAN_ICONS.manual;
            const ts = tx.timestamp || tx.created_date;
            return (
              <div key={tx.id} className={cn('flex items-start gap-4 rounded-xl border px-4 py-3', cfg.bg, cfg.border)}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-black/20')}>
                  <TxIcon className={cn('w-4 h-4', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={cn('text-xs font-extrabold uppercase tracking-widest', cfg.color)}>{cfg.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ScanIcon className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500 uppercase">{tx.scan_method}</span>
                    </div>
                  </div>
                  {/* Tool */}
                  <p className="text-sm font-bold text-white mt-0.5">{tx.tool_name || tx.tool_number}</p>
                  {tx.tool_name && tx.tool_number && tx.tool_name !== tx.tool_number && (
                    <p className="text-[10px] font-mono text-gray-500">{tx.tool_number}</p>
                  )}
                  {/* Technician — highlighted if searched */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <User className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className={cn('text-xs font-semibold', techSearch && tx.technician_name?.toLowerCase().includes(techSearch.toLowerCase()) ? 'text-blue-300' : 'text-gray-400')}>
                      {tx.technician_name || '—'}
                    </span>
                    {tx.technician_id && <span className="text-[10px] text-gray-600">#{tx.technician_id}</span>}
                  </div>
                  {/* Aircraft */}
                  {tx.aircraft_tail && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500/60 flex-shrink-0" />
                      <span className="text-[10px] font-mono text-cyan-400">Aircraft: {tx.aircraft_tail}</span>
                    </div>
                  )}
                  {/* Locations */}
                  {(tx.from_location || tx.to_location) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.from_location && `From: ${tx.from_location}`}
                      {tx.from_location && tx.to_location && ' → '}
                      {tx.to_location && `To: ${tx.to_location}`}
                    </p>
                  )}
                  {/* Date/Time — full timestamp */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="w-3 h-3 text-gray-600 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-gray-500">{fmt(ts)}</span>
                  </div>
                  {tx.notes && <p className="text-[10px] text-gray-600 mt-0.5 italic">{tx.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}