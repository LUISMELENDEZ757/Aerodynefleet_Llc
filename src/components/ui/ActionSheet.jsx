/**
 * ActionSheet — mobile-native bottom-sheet replacement for <select>
 *
 * Usage:
 *   <ActionSheet
 *     value={currentValue}
 *     onChange={setValue}
 *     options={[{ value: 'a', label: 'Option A' }, ...]}
 *     placeholder="Choose..."
 *     label="Filter"           // optional label shown above trigger
 *     triggerClassName="..."   // extra classes on trigger button
 *   />
 *
 * On mobile  → bottom sheet with native-feel option list
 * On desktop → falls back to a styled dropdown popover
 */
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function ActionSheet({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  label,
  triggerClassName,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const isMobile = () => window.innerWidth < 1024;
  const triggerRef = useRef(null);
  const sheetRef = useRef(null);
  const optionsRef = useRef([]);

  const selected = options.find(o => o.value === value);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

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
        setFocusedIndex(prev => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) handleSelect(options[focusedIndex]);
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

  // Close on outside click (desktop popover) + focus option
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        sheetRef.current && !sheetRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus focused option on mobile
  useEffect(() => {
    if (open && focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, open]);

  // Lock body scroll on mobile sheet open
  useEffect(() => {
    if (open && isMobile()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="relative">
      {label && (
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-between gap-2 h-9 min-w-[120px] bg-secondary border border-border rounded-lg px-3 text-xs font-semibold text-foreground transition-all',
          'hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary',
          disabled && 'opacity-40 cursor-not-allowed',
          open && 'border-primary/60 ring-1 ring-primary/30',
          triggerClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground font-normal')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 flex-shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* ── MOBILE: bottom sheet ── */}
            <motion.div
              className="lg:hidden fixed inset-0 z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />

              {/* sheet */}
              <motion.div
                ref={sheetRef}
                className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border overflow-hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
                  <p className="text-sm font-bold text-foreground">{label || placeholder}</p>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Options */}
                <div className="overflow-y-auto max-h-[55vh] py-2" role="listbox">
                  {options.map((opt, idx) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        ref={(el) => { optionsRef.current[idx] = el; }}
                        onClick={() => handleSelect(opt)}
                        onKeyDown={handleKeyDown}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          'w-full flex items-center justify-between px-5 py-3.5 text-sm transition-colors min-h-[52px]',
                          isSelected
                            ? 'bg-primary/15 text-primary font-semibold'
                            : 'text-foreground hover:bg-secondary/60',
                          focusedIndex === idx && 'outline-none ring-1 ring-inset ring-primary bg-secondary/40'
                        )}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>

            {/* ── DESKTOP: popover dropdown ── */}
            <motion.div
              ref={sheetRef}
              className="hidden lg:block absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[180px]"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              role="listbox"
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    ref={(el) => { optionsRef.current[idx] = el; }}
                    onClick={() => handleSelect(opt)}
                    onKeyDown={handleKeyDown}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary',
                      isSelected
                        ? 'bg-primary/15 text-primary'
                        : 'text-foreground hover:bg-secondary',
                      focusedIndex === idx && 'bg-secondary/60'
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}