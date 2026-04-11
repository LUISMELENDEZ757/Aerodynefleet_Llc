import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MigrationControl() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleMigrate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('migrateFleetToSupabase', {});
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="text-primary hover:text-primary/80">←</Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">Supabase Migration Control</h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Admin Only</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-5 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-foreground">Migrate Fleet to Supabase</h2>
          <p className="text-sm text-muted-foreground">
            This will transfer all aircraft, flights, maintenance logs, faults, MEL items, and related data to your Supabase instance.
            This is an admin-only operation.
          </p>

          <button
            onClick={handleMigrate}
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Migrating...
              </>
            ) : (
              'Start Migration'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400">Error</p>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="font-bold text-green-400">Migration Completed</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(result).map(([key, value]) => (
                key !== 'status' && (
                  <div key={key} className="bg-background/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}