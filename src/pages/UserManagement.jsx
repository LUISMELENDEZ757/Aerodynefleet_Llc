import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/supabaseAuth';
import { Link } from 'react-router-dom';
import { Shield, UserPlus, RefreshCw, Search, Crown, User, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'text-primary bg-primary/15', icon: Crown },
  user:  { label: 'User',  color: 'text-blue-400 bg-blue-500/15', icon: User },
};

function InviteModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const qc = useQueryClient();

  const handleInvite = async () => {
    setStatus('loading');
    setError(null);
    const token = getSession()?.access_token;
    const res = await base44.functions.invoke('getSupabaseUsers', { action: 'invite', email, role, token });
    if (res.data?.error) {
      setError(res.data.error);
      setStatus(null);
      return;
    }
    setStatus('success');
    qc.invalidateQueries({ queryKey: ['supabase-users'] });
    setTimeout(() => { setStatus(null); setEmail(''); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm space-y-3">
        <h3 className="font-bold text-foreground">Invite User</h3>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full h-9 bg-background border border-border rounded px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-2">
          <button onClick={() => setRole('user')} className={cn('flex-1 h-9 text-sm font-semibold rounded-lg border transition-all', role === 'user' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-secondary text-muted-foreground border-border')}>
            User
          </button>
          <button onClick={() => setRole('admin')} className={cn('flex-1 h-9 text-sm font-semibold rounded-lg border transition-all', role === 'admin' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-secondary text-muted-foreground border-border')}>
            Admin
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {status === 'success' && <p className="text-xs text-green-400 text-center">Invitation sent!</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg bg-secondary text-muted-foreground text-sm font-semibold hover:bg-secondary/80">Cancel</button>
          <button onClick={handleInvite} disabled={!email || status === 'loading'}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
            {status === 'loading' ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onRoleChange, onDelete }) {
  const role = user.user_metadata?.role || user.app_metadata?.role || 'user';
  const roleInfo = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const Icon = roleInfo.icon;
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const confirmed = !!user.email_confirmed_at;

  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          {!confirmed && <p className="text-[10px] text-amber-400 mt-0.5">Invite pending</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1', roleInfo.color)}>
          <Icon className="w-3 h-3" />{roleInfo.label}
        </span>
        <select
          value={role}
          onChange={e => onRoleChange(user.id, e.target.value)}
          className="h-8 bg-background border border-border rounded px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => onDelete(user.id, user.email)}
          className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, email }
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['supabase-users'],
    queryFn: async () => {
      const token = getSession()?.access_token;
      const res = await base44.functions.invoke('getSupabaseUsers', { action: 'list', token });
      return res.data?.users || [];
    },
    refetchInterval: 60000,
  });

  const users = data || [];

  const updateRole = useMutation({
    mutationFn: ({ userId, role }) => base44.functions.invoke('getSupabaseUsers', { action: 'updateRole', userId, role, token: getSession()?.access_token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supabase-users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: (userId) => base44.functions.invoke('getSupabaseUsers', { action: 'deleteUser', userId, token: getSession()?.access_token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supabase-users'] });
      setDeleteConfirm(null);
    },
  });

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.user_metadata?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const confirmed = users.filter(u => !!u.email_confirmed_at);
  const pending = users.filter(u => !u.email_confirmed_at);
  const admins = users.filter(u => (u.user_metadata?.role || u.app_metadata?.role) === 'admin').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Shield className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">USER MANAGEMENT</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Supabase Auth · Roles · Invitations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={refetch} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90">
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl bg-card border border-primary/30 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{admins}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-blue-400">{confirmed.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="rounded-xl bg-card border border-amber-500/30 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-amber-400">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">Loading users from Supabase…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">No users found</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <UserCard
                key={u.id}
                user={u}
                onRoleChange={(userId, role) => updateRole.mutate({ userId, role })}
                onDelete={(id, email) => setDeleteConfirm({ id, email })}
              />
            ))}
          </div>
        )}

        <div className="rounded-xl bg-secondary/30 border border-border px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Supabase Auth Connected</p>
          Users listed here are from your Supabase Auth system. Invites send a magic link email. Role changes update Supabase user metadata immediately.
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm space-y-3">
            <h3 className="font-bold text-foreground">Delete User?</h3>
            <p className="text-sm text-muted-foreground">This will permanently remove <span className="text-foreground font-semibold">{deleteConfirm.email}</span> from Supabase Auth. They will no longer be able to log in.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-9 rounded-lg bg-secondary text-muted-foreground text-sm font-semibold hover:bg-secondary/80">Cancel</button>
              <button onClick={() => deleteUser.mutate(deleteConfirm.id)} disabled={deleteUser.isPending}
                className="flex-1 h-9 rounded-lg bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/90 disabled:opacity-50">
                {deleteUser.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}