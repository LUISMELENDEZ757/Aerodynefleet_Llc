import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, LogOut, Trash2, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const handleDelete = () => {
    setOpen(false);
    setShowDeleteModal(true);
  };

  const items = [
    { label: 'Profile', icon: User, action: null, danger: false },
    { label: 'Sign Out', icon: LogOut, action: handleLogout, danger: false },
    { label: 'Delete Account', icon: Trash2, action: handleDelete, danger: true },
  ];

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          items[focusedIndex].action?.();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  // Focus focused item
  useEffect(() => {
    if (open && focusedIndex >= 0 && itemsRef.current[focusedIndex]) {
      itemsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 h-10 px-3 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`User menu: ${user.full_name || user.email}`}
      >
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{user.full_name || user.email}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[220px]"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            role="menu"
          >
            {/* User info header */}
            <div className="px-4 py-3 bg-secondary/40 border-b border-border/50">
              <p className="text-xs font-semibold text-foreground">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    ref={(el) => { itemsRef.current[idx] = el; }}
                    onClick={() => {
                      item.action?.();
                      if (!item.action) setOpen(false);
                    }}
                    onKeyDown={handleKeyDown}
                    role="menuitem"
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary',
                      item.danger
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'text-foreground hover:bg-secondary/50',
                      focusedIndex === idx && 'bg-secondary/60'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal - rendered from Settings component */}
      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}

// Simple deletion modal (same as in Settings)
function DeleteAccountModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRequestDeletion = async () => {
    if (confirmText !== 'DELETE' || !agreed) return;
    setLoading(true);
    await base44.auth.logout('/');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={step < 4 ? onClose : undefined} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {step === 1 && (
          <>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Step 1 of 3</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-foreground">
                Requesting account deletion will permanently remove the following data:
              </p>
              <div className="space-y-2">
                {[
                  'Profile & personal information',
                  'Flight & crew records',
                  'Safety reports',
                  'Preferences & settings',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-foreground">
                    <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl bg-destructive/15 text-sm font-bold text-destructive hover:bg-destructive/25">
                I Understand →
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
              <button onClick={() => setStep(1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                ← Back
              </button>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-foreground">Important Consequences</p>
                <p className="text-xs text-muted-foreground">Step 2 of 3</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
               <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                 <p className="text-xs font-bold text-amber-400">Required Data Retention Notice</p>
                 <p className="text-xs text-foreground leading-snug">
                   Your airline is legally required to retain operational records (flight logs, crew duty records, safety reports) under FAA and DOT regulations. Deletion of your account does <span className="font-bold">not</span> remove these records from the system.
                 </p>
               </div>

               <button
                 onClick={() => setAgreed(v => !v)}
                 className="w-full flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 text-left hover:bg-secondary/70"
               >
                 <div className={cn(
                   'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                   agreed ? 'bg-destructive border-destructive' : 'border-border'
                 )}>
                   {agreed && '✓'}
                 </div>
                 <p className="text-xs text-foreground font-medium">
                   I understand the consequences and data retention requirements
                 </p>
               </button>
             </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground">
                Back
              </button>
              <button
                onClick={() => agreed && setStep(3)}
                disabled={!agreed}
                className="flex-1 h-11 rounded-xl bg-destructive/15 text-sm font-bold text-destructive hover:bg-destructive/25 disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
              <button onClick={() => setStep(2)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                ← Back
              </button>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-foreground">Final Confirmation</p>
                <p className="text-xs text-muted-foreground">Step 3 of 3</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground mb-2">
                Type <span className="font-mono font-bold text-destructive px-1 py-0.5 bg-destructive/10 rounded">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                autoCapitalize="characters"
                className="w-full h-12 bg-secondary border-2 border-border rounded-xl px-4 text-sm font-mono text-foreground focus:outline-none focus:border-destructive"
              />
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={confirmText !== 'DELETE' || loading}
                className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold disabled:opacity-40 hover:bg-destructive/90"
              >
                {loading ? 'Processing…' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}