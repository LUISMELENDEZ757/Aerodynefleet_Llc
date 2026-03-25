import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Shield, UserPlus, RefreshCw, Search, Crown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'text-primary bg-primary/15', icon: Crown },
  user:  { label: 'User',  color: 'text-blue-400 bg-blue-500/15', icon: User },
};

function InviteModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState(null);

  const handleInvite = async () => {
    setStatus('loading');
    await base44.users.inviteUser(email, role);
    setStatus('success');
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

function UserCard({ user, onRoleChange }) {
  const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
  const Icon = roleInfo.icon;

  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{user.full_name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1', roleInfo.color)}>
          <Icon className="w-3 h-3" />{roleInfo.label}
        </span>
        <select
          value={user.role || 'user'}
          onChange={e => onRoleChange(user.id, e.target.value)}
          className="h-8 bg-background border border-border rounded px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const qc = useQueryClient();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => base44.entities.User.list(),
    refetchInterval: 60000,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-all'] }),
  });

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const admins = users.filter(u => u.role === 'admin').length;

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
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Roles · Invitations · Access Control</p>
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
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-xl bg-card border border-primary/30 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{admins}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
          <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-blue-400">{users.length - admins}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-card border border-border rounded-xl pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">No users found</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <UserCard key={u.id} user={u} onRoleChange={(id, role) => updateRole.mutate({ id, role })} />
            ))}
          </div>
        )}

        <div className="rounded-xl bg-secondary/30 border border-border px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Admin Privileges</p>
          Admins can access all modules, manage users, configure retention policies, and view all audit logs. Users have standard operational access.
        </div>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}