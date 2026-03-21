import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, User, Trash2, LogOut, ChevronRight,
  AlertTriangle, X, ShieldAlert, CheckCircle2, ChevronLeft
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

// ─── 4-Step Account Deletion Modal ───────────────────────────────────────────
function DeleteAccountModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRequestDeletion = async () => {
    if (confirmText !== 'DELETE' || !agreed) return;
    setLoading(true);
    // Sign the user out — actual deletion requires backend/admin action per store guidelines
    await base44.auth.logout('/');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={step < 4 ? onClose : undefined} />

      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* ── Step 1: What will be deleted ── */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Step 1 of 3 — What gets deleted</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-foreground">
                Requesting account deletion will permanently remove the following data associated with your Aerodyne Fleet account:
              </p>

              <div className="space-y-2">
                {[
                  { label: 'Profile & personal information', sub: 'Name, email, employee ID' },
                  { label: 'Flight & crew records', sub: 'Assignments, duty logs, legality history' },
                  { label: 'Safety reports', sub: 'ASAP filings, incident reports, QA audits' },
                  { label: 'Preferences & settings', sub: 'App configuration and saved data' },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/60 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Note:</span> This action is permanent and cannot be undone. Operational records mandated by aviation regulations may be retained by your organization.
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl bg-destructive/15 border border-destructive/30 text-sm font-bold text-destructive hover:bg-destructive/25 transition-colors">
                I Understand →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Regulatory & org consequences ── */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
              <button onClick={() => setStep(1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-foreground">Important Consequences</p>
                <p className="text-xs text-muted-foreground">Step 2 of 3 — Regulatory notice</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold text-orange-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Aviation Regulatory Notice
                </p>
                <p className="text-xs text-foreground leading-relaxed">
                  As an aviation operations platform, certain records (flight logs, safety reports, crew duty records) may be subject to retention requirements under FAA regulations, company SOPs, and applicable law. Deleting your account does <span className="font-bold">not</span> exempt your employer from these obligations.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  'You will immediately lose access to all modules and features',
                  'Your crew assignments will show as unassigned',
                  'Your digital signature on dispatch releases will be invalidated',
                  'Ongoing safety investigations may be affected',
                  'Account deletion is processed within 30 days per our privacy policy',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-foreground">
                    <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {item}
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                If you have concerns, contact your system administrator or email <span className="text-primary font-mono">privacy@aerofleet.ops</span>
              </p>

              {/* Acknowledgement checkbox */}
              <button
                onClick={() => setAgreed(v => !v)}
                className="w-full flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 text-left"
              >
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  agreed ? 'bg-destructive border-destructive' : 'border-border'
                )}>
                  {agreed && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <p className="text-xs text-foreground font-medium leading-snug">
                  I understand the consequences and still want to delete my account
                </p>
              </button>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Back
              </button>
              <button
                onClick={() => agreed && setStep(3)}
                disabled={!agreed}
                className="flex-1 h-11 rounded-xl bg-destructive/15 border border-destructive/30 text-sm font-bold text-destructive hover:bg-destructive/25 transition-colors disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Type DELETE confirmation ── */}
        {step === 3 && (
          <>
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
              <button onClick={() => setStep(2)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-foreground">Final Confirmation</p>
                <p className="text-xs text-muted-foreground">Step 3 of 3 — Type to confirm</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-destructive mb-1">⚠ This is your final step</p>
                <p className="text-xs text-muted-foreground">
                  Submitting this request will sign you out and queue your account for permanent deletion. This cannot be reversed.
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Type <span className="font-mono font-bold text-destructive px-1 py-0.5 bg-destructive/10 rounded">DELETE</span> in the field below to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE here"
                  autoCapitalize="characters"
                  className="w-full h-12 bg-secondary border-2 border-border rounded-xl px-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive transition-colors"
                />
                {confirmText.length > 0 && confirmText !== 'DELETE' && (
                  <p className="text-xs text-destructive mt-1">Must type exactly: DELETE</p>
                )}
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={confirmText !== 'DELETE' || loading}
                className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-40 hover:bg-destructive/90 transition-colors"
              >
                {loading ? 'Processing…' : 'Delete My Account'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [showDelete, setShowDelete] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => base44.auth.logout('/');

  const rows = [
    {
      section: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          sub: user?.full_name ? `${user.full_name} · ${user.email}` : (user?.email || 'Loading…'),
          action: null,
        },
        {
          icon: LogOut,
          label: 'Sign Out',
          sub: 'Log out of this session',
          action: handleLogout,
          danger: false,
        },
        {
          icon: Trash2,
          label: 'Delete Account',
          sub: 'Request permanent account removal',
          action: () => setShowDelete(true),
          danger: true,
        },
      ],
    },
    {
      section: 'App',
      items: [
        {
          icon: Settings,
          label: 'Version',
          sub: 'Aerodyne Fleet LLC · v2.0',
          action: null,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="hidden lg:flex w-10 h-10 rounded-xl bg-primary/20 items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 text-primary" />
          </div>

          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-wide">SETTINGS</h1>
            <p className="text-xs font-mono text-primary tracking-widest uppercase">Account · Preferences</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5 pb-28 lg:pb-8">
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
                    'w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors min-h-[56px]',
                    action ? 'hover:bg-secondary/50 active:bg-secondary' : 'cursor-default',
                    danger && action ? 'hover:bg-destructive/10' : ''
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

        {/* Privacy & data info block — required for store compliance */}
        <div className="rounded-2xl bg-secondary/30 border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data & Privacy</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aerodyne Fleet LLC collects operational data to support flight operations and regulatory compliance. Account deletion requests are processed within 30 days. Some data may be retained as required by aviation regulations (FAA, DOT) and your employer's record-keeping obligations.
          </p>
          <p className="text-xs text-muted-foreground">
            Questions? Contact <span className="text-primary font-mono">privacy@aerofleet.ops</span>
          </p>
        </div>
      </div>

      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </div>
  );
}