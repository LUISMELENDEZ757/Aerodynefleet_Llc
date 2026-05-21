import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function Test() {
  const [tail, setTail] = useState('N12345');
  const [status, setStatus] = useState('AOG');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleWrite = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('testSupabaseWrite', { tail, status });
      setResult({ success: true, data: res.data });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Supabase Write Test</h1>
        <p className="text-sm text-muted-foreground">Inserts a row into <code className="bg-secondary px-1 py-0.5 rounded text-xs">test_status</code> via backend function.</p>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Tail Number</label>
            <input
              value={tail}
              onChange={e => setTail(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Status</label>
            <input
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleWrite}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Writing…' : 'Write to Supabase'}
          </button>
        </div>

        {result && (
          <div className={`rounded-xl border p-4 ${result.success ? 'border-green-500/40 bg-green-900/10' : 'border-red-500/40 bg-red-900/10'}`}>
            <p className={`text-sm font-bold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? '✅ Write Success' : '❌ Write Failed'}
            </p>
            <pre className="text-xs text-foreground overflow-auto">
              {JSON.stringify(result.success ? result.data : result.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}