import { useState, useEffect, useRef } from 'react';
import { X, QrCode, Radio, Wifi, Search, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const MODE_CFG = {
  qr:   { label: 'QR Code Scanner', icon: QrCode, color: 'bg-blue-600',   ringColor: 'border-blue-400',   inputLabel: 'QR Code / Tool Number' },
  rfid: { label: 'RFID Reader',      icon: Radio,  color: 'bg-purple-600', ringColor: 'border-purple-400', inputLabel: 'RFID Tag ID' },
  nfc:  { label: 'NFC Scanner',      icon: Wifi,   color: 'bg-teal-600',   ringColor: 'border-teal-400',   inputLabel: 'NFC Tag / Tool Number' },
};

export default function QRScanModal({ mode, onClose, onSuccess }) {
  const cfg = MODE_CFG[mode] || MODE_CFG.qr;
  const Icon = cfg.icon;

  const [manualCode, setManualCode] = useState('');
  const [foundTool, setFoundTool] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [techName, setTechName] = useState('');

  const rfidBufferRef = useRef('');
  const rfidTimerRef = useRef(null);
  const rfidInputRef = useRef(null);
  const [rfidFlash, setRfidFlash] = useState(false);

  const queryClient = useQueryClient();

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => base44.entities.Tool.list(),
  });

  useEffect(() => {
    if (mode !== 'rfid') return;

    const handleKeyDown = (e) => {
      if (e.key.length > 1 && e.key !== 'Enter') return;

      if (e.key === 'Enter') {
        const tag = rfidBufferRef.current.trim();
        rfidBufferRef.current = '';
        clearTimeout(rfidTimerRef.current);
        if (tag.length >= 3) {
          setRfidFlash(true);
          setTimeout(() => setRfidFlash(false), 600);
          setManualCode(tag);
          doSearch(tag);
        }
        return;
      }

      rfidBufferRef.current += e.key;
      clearTimeout(rfidTimerRef.current);
      rfidTimerRef.current = setTimeout(() => {
        rfidBufferRef.current = '';
      }, 80);
    };

    window.addEventListener('keydown', handleKeyDown);
    if (rfidInputRef.current) rfidInputRef.current.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(rfidTimerRef.current);
    };
  }, [mode, tools]);

  const doSearch = (code) => {
    if (!code.trim()) return;
    setSearching(true);
    setNotFound(false);
    setFoundTool(null);
    setTimeout(() => {
      const q = code.toLowerCase();
      const tool = tools.find(t =>
        t.tool_number?.toLowerCase() === q ||
        t.rfid_tag?.toLowerCase() === q ||
        t.qr_code?.toLowerCase() === q
      );
      setFoundTool(tool || null);
      setNotFound(!tool);
      setSearching(false);
    }, 300);
  };

  const handleSearch = () => doSearch(manualCode);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'tool-transactions'] });
      onSuccess();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141922] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={cn('flex items-center justify-between px-5 py-4', cfg.color)}>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" />
            <p className="font-extrabold text-white">{cfg.label}</p>
            {mode === 'rfid' && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" /> LIVE
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Scan area */}
          {mode === 'rfid' ? (
            <div className={cn(
              'relative rounded-2xl overflow-hidden h-48 flex flex-col items-center justify-center gap-3 transition-all duration-300',
              rfidFlash ? 'bg-purple-900/60 border-2 border-purple-400' : 'bg-[#0d1117]'
            )}>
              <input ref={rfidInputRef} className="absolute opacity-0 w-0 h-0 pointer-events-none" readOnly tabIndex={-1} aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-28 h-28 rounded-full border-2 border-purple-500/20 animate-ping absolute" />
                <div className={cn('w-20 h-20 rounded-full border-2 animate-pulse', rfidFlash ? 'border-purple-300' : 'border-purple-500/40')} />
              </div>
              <Radio className={cn('w-12 h-12 z-10 transition-colors', rfidFlash ? 'text-purple-200' : 'text-purple-400')} />
              {rfidFlash ? (
                <p className="text-sm font-bold text-purple-200 z-10 animate-pulse">Tag Detected!</p>
              ) : (
                <>
                  <p className="text-xs text-gray-300 font-semibold z-10">Hold RFID reader near tool tag</p>
                  <div className="flex items-center gap-1.5 z-10">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Listening for tag…</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative bg-[#0d1117] rounded-2xl overflow-hidden h-48 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn('w-32 h-32 rounded-2xl border-4 opacity-30 animate-pulse', cfg.ringColor)} />
              </div>
              <div className="flex flex-col items-center gap-3 z-10">
                <Icon className={cn('w-12 h-12', mode === 'qr' ? 'text-blue-400' : 'text-teal-400')} />
                <p className="text-xs text-gray-400 text-center">
                  {mode === 'qr' ? 'Point camera at QR code on tool' : 'Tap NFC-enabled device to tool tag'}
                </p>
                <p className="text-[10px] text-gray-600 text-center">— or enter manually below —</p>
              </div>
            </div>
          )}

          {/* Manual entry */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{cfg.inputLabel}</label>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={mode === 'rfid' ? 'Auto-filled on tag read · or type manually' : 'e.g. TRQ-2450'}
                className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500"
              />
              <button onClick={handleSearch} className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {searching && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Looking up tag…
            </div>
          )}

          {notFound && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400 text-center">
              No tool found with that {mode === 'rfid' ? 'RFID tag' : 'code'}.
            </div>
          )}

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
                <input value={techName} onChange={e => setTechName(e.target.value)} placeholder="Your name" autoFocus className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500" />
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