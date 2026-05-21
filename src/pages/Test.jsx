import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function Test() {
  const [tail, setTail] = useState('N12345');
  const [status, setStatus] = useState('AOG');
  const [readResult, setReadResult] = useState(null);
  const [writeResult, setWriteResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setError(null);
    setLoading(true);

    try {
      // Write test
      const writeRes = await base44.functions.invoke('testSupabaseWrite', { tail, status });
      setWriteResult(writeRes.data);

      // Read test
      const readRes = await base44.functions.invoke('testSupabaseRead', {});
      setReadResult(readRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Supabase Connectivity Test</h1>
        <p className="text-sm text-muted-foreground">Write and read from <code className="bg-secondary px-1 py-0.5 rounded text-xs">test_status</code> via backend functions.</p>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/10 p-4">
            <p className="text-sm font-bold text-red-400">❌ Error: {error}</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <button
            onClick={runTests}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Running Tests…' : 'Run Tests'}
          </button>
        </div>

        {writeResult && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">✅ Write Test Result</h2>
            <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-auto">
              {JSON.stringify(writeResult, null, 2)}
            </pre>
          </div>
        )}

        {readResult && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">✅ Read Test Result</h2>
            <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-auto max-h-80">
              {JSON.stringify(readResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}