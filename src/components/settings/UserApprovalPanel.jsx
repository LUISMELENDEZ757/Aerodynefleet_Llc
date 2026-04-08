import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserCheck, UserX, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserApprovalPanel({ currentUser }) {
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['all-users-approval'],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'admin',
  });

  const pendingUsers = allUsers.filter(u => !u.approval_status || u.approval_status === 'pending');
  const processedUsers = allUsers.filter(u => u.approval_status === 'approved' || u.approval_status === 'rejected');

  const approveMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.User.update(id, { approval_status: 'approved', approval_note: '' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users-approval'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => base44.entities.User.update(id, { approval_status: 'rejected', approval_note: note || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-approval'] });
      setShowNoteFor(null);
      setRejectNote({});
    },
  });

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="space-y-3">
      {/* Pending */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-amber-500/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-extrabold text-amber-400 uppercase tracking-widest">Pending Approvals</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['all-users-approval'] })}
              className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading users…</div>
        ) : pendingUsers.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">No pending access requests</div>
        ) : (
          <div className="divide-y divide-border">
            {pendingUsers.map(u => (
              <div key={u.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Registered: {new Date(u.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveMutation.mutate({ id: u.id })}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-500/40 text-green-400 text-xs font-bold hover:bg-green-600/30 transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setShowNoteFor(showNoteFor === u.id ? null : u.id)}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-600/30 transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
                {showNoteFor === u.id && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rejectNote[u.id] || ''}
                      onChange={e => setRejectNote(p => ({ ...p, [u.id]: e.target.value }))}
                      placeholder="Reason for rejection (optional)…"
                      className="flex-1 h-8 bg-secondary border border-border rounded-lg px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-destructive"
                    />
                    <button
                      onClick={() => rejectMutation.mutate({ id: u.id, note: rejectNote[u.id] || '' })}
                      disabled={rejectMutation.isPending}
                      className="px-3 h-8 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently processed */}
      {processedUsers.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Processed Users</p>
          </div>
          <div className="divide-y divide-border max-h-48 overflow-y-auto">
            {processedUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                {u.approval_status === 'approved'
                  ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{u.full_name || u.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                  u.approval_status === 'approved'
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                )}>
                  {u.approval_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}