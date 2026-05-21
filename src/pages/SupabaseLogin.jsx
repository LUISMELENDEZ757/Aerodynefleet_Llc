import { useState } from 'react';
import { getSupabaseAuthClient } from '@/lib/supabaseAuth';
import { Plane, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function SupabaseLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const client = await getSupabaseAuthClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-foreground tracking-wide">Aerodyne Fleet OS</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-8 space-y-5 shadow-xl">

          {error && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@aerodyne.com"
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors tracking-wide"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Aerodyne Fleet LLC · Maintenance Control System
        </p>
      </div>
    </div>
  );
}