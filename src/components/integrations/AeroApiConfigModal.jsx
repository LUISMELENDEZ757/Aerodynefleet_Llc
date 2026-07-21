import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { KeyRound, RefreshCw, CheckCircle, XCircle, Zap, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AeroApiConfigModal({ onClose }) {
  const [keyInput, setKeyInput] = useState('');
  const [testResult, setTestResult] = useState(null);
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['aeroapi-status'],
    queryFn: async () => (await base44.functions.invoke('aeroApiIntegration', { action: 'status' })).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => (await base44.functions.invoke('aeroApiIntegration', { action: 'save_key', api_key: keyInput })).data,
    onSuccess: (data) => {
      setTestResult({ ok: true, latency_ms: data.latency_ms, msg: 'Key validated & saved' });
      setKeyInput('');
      qc.invalidateQueries({ queryKey: ['aeroapi-status'] });
    },
    onError: (err) => setTestResult({ ok: false, msg: err?.response?.data?.error || err.message }),
  });

  const testMutation = useMutation({
    mutationFn: async () => (await base44.functions.invoke('aeroApiIntegration', { action: 'test' })).data,
    onSuccess: (data) => {
      setTestResult({ ok: true, latency_ms: data.latency_ms, msg: `Connected — ${data.sample?.name || 'AeroAPI reachable'}` });
      qc.invalidateQueries({ queryKey: ['aeroapi-status'] });
    },
    onError: (err) => {
      setTestResult({ ok: false, msg: err?.response?.data?.error || err.message });
      qc.invalidateQueries({ queryKey: ['aeroapi-status'] });
    },
  });

  const busy = saveMutation.isPending || testMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="font-extrabold text-foreground">AeroAPI (FlightAware)</p>
              <p className="text-xs text-muted-foreground">REST/JSON · live flight tracking data</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 text-muted-foreground">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Live status */}
          <div className="rounded-lg bg-secondary/40 border border-border px-4 py-3">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Checking configuration…</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  {status?.configured
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    : <XCircle className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="font-bold text-foreground">
                    {status?.configured ? 'API key configured' : 'No API key configured'}
                  </span>
                  {status?.source && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {status.source === 'saved' ? 'SAVED IN APP' : 'ENV SECRET'}
                    </span>
                  )}
                </div>
                {status?.masked_key && <p className="font-mono text-muted-foreground">{status.masked_key}</p>}
                {status?.last_tested_at && (
                  <p className="text-muted-foreground">
                    Last test: {new Date(status.last_tested_at).toLocaleString()}
                    {status.last_status === 'ok' && status.last_latency_ms != null && <span className="text-green-400"> · {status.last_latency_ms}ms OK</span>}
                    {status.last_status === 'error' && <span className="text-red-400"> · FAILED</span>}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Add / update key */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> {status?.configured ? 'Update API Key' : 'Add API Key'}
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your AeroAPI key…"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground">
              Get a key at flightaware.com → AeroAPI. The key is validated against AeroAPI before saving. Admin only.
            </p>
          </div>

          {/* Result banner */}
          {testResult && (
            <div className={cn('rounded-lg border px-4 py-2.5 text-xs font-bold flex items-center gap-2',
              testResult.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400')}>
              {testResult.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{testResult.msg}{testResult.ok && testResult.latency_ms != null ? ` · ${testResult.latency_ms}ms` : ''}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setTestResult(null); saveMutation.mutate(); }}
              disabled={busy || !keyInput.trim()}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className={cn('w-3.5 h-3.5', saveMutation.isPending && 'animate-pulse')} />
              {saveMutation.isPending ? 'Validating…' : 'Save & Validate Key'}
            </button>
            <button
              onClick={() => { setTestResult(null); testMutation.mutate(); }}
              disabled={busy || !status?.configured}
              className="flex-1 py-2.5 rounded-lg bg-secondary border border-border text-sm font-bold text-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', testMutation.isPending && 'animate-spin')} />
              {testMutation.isPending ? 'Testing…' : 'Test Connection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}