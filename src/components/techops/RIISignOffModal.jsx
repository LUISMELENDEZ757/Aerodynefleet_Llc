import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RIISignOffModal({ entry, inspector, onClose, onSign, isPending }) {
  const [certNumber, setCertNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);

  const handleSign = () => {
    setError(null);
    
    if (!inspector?.full_name) {
      setError('Inspector not authenticated');
      return;
    }
    
    if (!certNumber.trim()) {
      setError('Certificate number required');
      return;
    }
    
    if (!agreed) {
      setError('Must agree to FAR compliance statement');
      return;
    }

    onSign({
      inspector_name: inspector.full_name,
      inspector_email: inspector.email,
      inspector_cert: certNumber.trim(),
      signature_type: 'rii_signoff',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-card border border-amber-500/30 rounded-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 px-6 py-4 border-b border-amber-500/20 flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-extrabold text-white text-lg tracking-wide">RII Sign-Off Required</h3>
            <p className="text-xs text-amber-200 mt-0.5">FAA 14 CFR Part 43 Compliance</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Entry info */}
          <div className="bg-background/50 rounded-xl p-4 space-y-2 border border-border">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Log Entry</p>
            <p className="text-sm font-bold text-white">{entry?.description}</p>
            {entry?.ata_chapter && <p className="text-xs text-gray-500">ATA {entry.ata_chapter}</p>}
            <p className="text-xs text-gray-600 mt-2">Tail: <span className="font-mono text-gray-400">{entry?.aircraft_tail}</span></p>
          </div>

          {/* Inspector info */}
          <div className="bg-background/50 rounded-xl p-4 space-y-2 border border-border">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Inspector</p>
            <p className="text-sm font-bold text-white">{inspector?.full_name || 'Unknown'}</p>
            <p className="text-xs text-gray-600">{inspector?.email}</p>
          </div>

          {/* Certificate number */}
          <div>
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2">A&P / IA Certificate #</label>
            <input
              type="text"
              value={certNumber}
              onChange={e => setCertNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 12A34567"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-primary/50"
              disabled={isPending}
            />
          </div>

          {/* FAR compliance checkbox */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-200">
                <p className="font-bold mb-1">FAA Required Inspection Item (RII)</p>
                <p>By signing, I certify that I have inspected this work and that it is complete and airworthy per 14 CFR 43.11. This signature is legally binding.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-gray-600"
              />
              <span className="text-xs text-blue-300">I agree and certify per FAR requirements</span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2 flex items-start gap-2">
              <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border px-6 py-3 flex gap-2 bg-background/50">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={isPending || !agreed || !certNumber.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-extrabold text-sm hover:bg-amber-500 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Sign RII
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}