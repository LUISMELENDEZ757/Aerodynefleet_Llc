import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function Test() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await base44.entities.Aircraft.list();
        setData(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-4">Base44 Entity Test</h1>
        
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-red-400">Error: {error}</p>}
        
        {data && (
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-3">Aircraft entities loaded: {data.length}</p>
            <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground overflow-auto max-h-96">
              {JSON.stringify(data.slice(0, 5), null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">Showing first 5 of {data.length} records</p>
          </div>
        )}
      </div>
    </div>
  );
}