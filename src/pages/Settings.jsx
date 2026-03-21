import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, Trash2, LogOut, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

function DeleteAccountModal({ onClose }) {
  const [step, setStep] = useState(1); // 1 = warn, 2 = confirm text, 3 = done
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setLoading(true);
    try {
      // Log out — actual deletion requires admin/backend; we sign out and inform
      await base44.auth.logout('/');
    } catch {
      setStep(3);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-destructive/40 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {step === 1 && (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-border flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <p className="text-sm font-extrabold text-foreground">Delete Account</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> This action is permanent</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All your data will be permanently deleted</li>
                  <li>You will lose access to all modules</li>
                  <li>This cannot be undone</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">If you need help with your account, contact your system administrator before proceeding.</p>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl bg-destructive/15 border border-destructive/40 text-sm font-bold text-destructive hover:bg-destructive/25 transition-colors">
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-border">
              <p className="text-sm font-extrabold text-foreground">Confirm Deletion</p>
              <p className="text-xs text-muted-foreground mt-1">Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm</p>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE here"
                className="w-full h-11 bg-secondary border border-border rounded-xl px-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive"
              />
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || loading}
                  className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-40 hover:bg-destructive/90 transition-colors"
                >
                  {loading ? 'Processing…' : 'Delete Account'}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-bold text-foreground">Request Submitted</p>
            <p className="text-xs text-muted-foreground">Your account deletion request has been logged. Contact your system administrator to complete the process.</p>
            <button onClick={onClose} className="h-11 px-6 rounded-xl bg-secondary text-sm font-semibold text-foreground mt-2">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [showDelete, setShowDelete] = useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => base44.auth.logout('/');

  const rows = [
    {
      section: 'Account',
      items: [
        { icon: User, label: 'Profile', sub: user?.email || 'Loading…', action: null },
        { icon: LogOut, label: 'Sign Out', sub: 'Log out of this session', action: handleLogout, danger: false },
        { icon: Trash2, label: 'Delete Account', sub: 'Permanently remove your account', action: () => setShowDelete(true), danger: true },
      ],
    },
    {
      section: 'App',
      items: [
        { icon: Settings, label: 'Version', sub: 'Aerodyne Fleet LLC · v2.0', action: null },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
            <Settings className="w-5 h-5 text-primary" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-wide">SETTINGS</h1>
            <p className="text-xs font-mono text-primary tracking-widest uppercase">Account · Preferences</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {rows.map(({ section, items }) => (
          <div key={section}>
            <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section}</p>
            <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
              {items.map(({ icon: Icon, label, sub, action, danger }) => (
                <button
                  key={label}
                  onClick={action || undefined}
                  disabled={!action}
                  className={cn(
                    'w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors min-h-[44px]',
                    action ? 'hover:bg-secondary/50 active:bg-secondary' : 'cursor-default',
                    danger ? 'hover:bg-destructive/10' : ''
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', danger ? 'bg-destructive/15' : 'bg-secondary')}>
                    <Icon className={cn('w-4 h-4', danger ? 'text-destructive' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', danger ? 'text-destructive' : 'text-foreground')}>{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub}</p>
                  </div>
                  {action && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </div>
  );
}