import { useState } from 'react';
import { X, QrCode, Radio, Wifi, Search, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const MODE_CFG = {
  qr:   { label: 'QR Code Scanner', icon: QrCode, color: 'bg-blue-600',   desc: 'Point camera at QR code on tool' },
  rfid: { label: 'RFID Reader',      icon: Radio,  color: 'bg-purple-600', desc: 'Hold RFID reader near tool tag' },
  nfc:  { label: 'NFC Scanner',      icon: Wifi,   color: 'bg-teal-600',   desc: 'Tap NFC-enabled device to tool tag' },
};

export default function QRScanModal({ mode, onClose, onSuccess }) {
  const cfg = MODE_CFG[mode] || MODE_CFG.qr;
  const Icon = cfg.icon;
  const [manualCode, setManualCode] = useState('');
  const [foundTool, setFoundTool] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [techName, setTechName] = useState('');
  const queryClient = useQueryClient();

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => base44.entities.Tool.list(),
  });

  const handleSearch = () => {
    if (!manualCode.trim()) return;
    setSearching(true);
    setNotFound(false);
    setFoundTool(null);
    setTimeout(() => {
      const tool = tools.find(t =>
        t.tool_number?.toLowerCase() === manualCode.toLowerCase() ||
        t.rfid_tag?.toLowerCase() === manualCode.toLowerCase() ||
        t.qr_code?.toLowerCase() === manualCode.toLowerCase()
      );
      setFoundTool(tool || null);
      setNotFound(!tool);
      setSearching(false);
    }, 600);
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const isCheckout = foundTool.status === 'available';
      await base44.entities.Tool.update(foundTool.id, {
        status: isCheckout ? 'checked_out' : 'available',
        assigned_to: isCheckout ? techName : '',
        usage_count: isCheckout ? (foundTool.usage_count || 0) + 1 : foundTool.usage_count,
      });
      await base44.entities.ToolTransaction.create({
        tool_number: foundTool.tool_number,
        tool_name: foundTool.name,
        transaction_type: isCheckout ? 'checkout' : 'checkin',
        technician_name: techName,
        timestamp: new Date().toISOString(),
        scan_method: mode,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tools', 'tool-transactions'] }); onSuccess(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141922] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={cn('flex items-center justify-between px-5 py-4', cfg.color)}>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" />
            <p className="font-extrabold text-white">{cfg.label}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Scan animation area */}
          <div className="relative bg-[#0d1117] rounded-2xl overflow-hidden h-48 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn('w-32 h-32 rounded-2xl border-4 opacity-30 animate-pulse', `border-${mode === 'qr' ? 'blue' : mode === 'rfid' ? 'purple' : 'teal'}-400`)} />
            </div>
            <div className="flex flex-col items-center gap-3 z-10">
              <Icon className={cn('w-12 h-12', mode === 'qr' ? 'text-blue-400' : mode === 'rfid' ? 'text-purple-400' : 'text-teal-400')} />
              <p className="text-xs text-gray-400 text-center">{cfg.desc}</p>
              <p className="text-[10px] text-gray-600 text-center">— or enter manually below —</p>
            </div>
          </div>

          {/* Manual entry */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
              Tool Number / {mode === 'rfid' ? 'RFID Tag' : 'QR Code'}
            </label>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. TRQ-2450"
                className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500"
              />
              <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Searching */}
          {searching && <p className="text-sm text-gray-400 text-center">Searching…</p>}

          {/* Not found */}
          {notFound && <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400 text-center">No tool found with that code.</div>}

          {/* Found tool */}
          {foundTool && (
            <div className="space-y-3">
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-green-400">Tool Found!</p>
                  <p className="text-sm font-bold text-white">{foundTool.name}</p>
                  <p className="text-xs text-gray-400">{foundTool.tool_number} · {foundTool.status}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Technician Name *</label>
                <input value={techName} onChange={e => setTechName(e.target.value)} placeholder="Your name" className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500" />
              </div>

              <button
                disabled={!techName || checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate()}
                className={cn('w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-colors',
                  foundTool.status === 'available' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'
                )}
              >
                {checkoutMutation.isPending ? 'Processing…' : foundTool.status === 'available' ? 'Check Out Tool' : 'Check In Tool'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}