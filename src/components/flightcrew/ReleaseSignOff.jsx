import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FileText, PenLine, CheckCircle, AlertTriangle, Edit, X } from 'lucide-react';
import { useReleaseSignOff } from '@/hooks/useReleaseSignOff';

function SignaturePad({ role, sig, onSign, onClear }) {
  const [name, setName] = useState('');

  if (sig) {
    return (
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-green-400">{role} — Signed</p>
            <p className="text-xs text-muted-foreground font-mono">
              {sig.name} · {new Date(sig.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} Z
            </p>
          </div>
        </div>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-secondary/40 border border-border rounded-xl px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{role} Sign-Off</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
          className="flex-1 h-9 bg-card border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => { if (name.trim()) { onSign(name.trim()); setName(''); } }}
          disabled={!name.trim()}
          className="h-9 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          <PenLine className="w-3.5 h-3.5" /> Sign
        </button>
      </div>
    </div>
  );
}

export default function ReleaseSignOff({ flightNumber }) {
  const {
    release, isLoading,
    captainSig, foSig, bothSigned,
    signAsCaptain, signAsFO, clearSignatures,
    amendRelease, isAmending,
  } = useReleaseSignOff(flightNumber, true);

  const [showAmend, setShowAmend] = useState(false);
  const [amendRemarks, setAmendRemarks] = useState('');

  if (isLoading) return <p className="text-xs text-muted-foreground p-2">Loading release…</p>;

  if (!release) {
    return (
      <div className="rounded-xl bg-secondary/30 border border-border px-4 py-6 text-center">
        <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No dispatch release found for this flight</p>
      </div>
    );
  }

  const statusColor = {
    released:  'text-green-400 bg-green-500/15',
    pending:   'text-muted-foreground bg-muted',
    amended:   'text-primary bg-primary/15',
    cancelled: 'text-destructive bg-destructive/15',
  }[release.release_status] || 'text-muted-foreground bg-muted';

  return (
    <div className="space-y-3">
      {/* Release summary */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60 flex items-center justify-between">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Dispatch Release
          </p>
          <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full', statusColor)}>
            {release.release_status?.toUpperCase()}
          </span>
        </div>
        <div className="p-4 space-y-2">
          {[
            { label: 'Route',       value: `${release.origin} → ${release.destination}${release.alternate ? ` (ALT: ${release.alternate})` : ''}` },
            { label: 'Fuel OB',     value: release.fuel_on_board != null ? `${release.fuel_on_board.toLocaleString()} lbs` : null },
            { label: 'Min Req',     value: release.min_fuel_required != null ? `${release.min_fuel_required.toLocaleString()} lbs` : null },
            { label: 'Dispatcher',  value: release.dispatcher_name },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-mono font-bold text-foreground">{value}</span>
            </div>
          ))}

          {release.origin_wx && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Origin WX</p>
              <p className="text-xs font-mono text-foreground bg-background/40 rounded px-2 py-1">{release.origin_wx}</p>
            </div>
          )}
          {release.destination_wx && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Destination WX</p>
              <p className="text-xs font-mono text-foreground bg-background/40 rounded px-2 py-1">{release.destination_wx}</p>
            </div>
          )}
          {release.notams && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">NOTAMs</p>
              <p className="text-xs font-mono text-foreground bg-background/40 rounded px-2 py-1 whitespace-pre-wrap">{release.notams}</p>
            </div>
          )}
          {release.remarks && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Remarks</p>
              <p className="text-xs text-foreground">{release.remarks}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pilot sign-off */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/60">
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5" /> Crew Acceptance
          </p>
        </div>
        <div className="p-4 space-y-3">
          <SignaturePad
            role="Captain"
            sig={captainSig}
            onSign={signAsCaptain}
            onClear={clearSignatures}
          />
          <SignaturePad
            role="First Officer"
            sig={foSig}
            onSign={signAsFO}
            onClear={() => { /* only clear FO sig */ }}
          />

          {bothSigned && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-400">Release accepted by both crew members</p>
            </div>
          )}
        </div>
      </div>

      {/* Amend release */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <button
          onClick={() => setShowAmend(!showAmend)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition-colors"
        >
          <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Edit className="w-3.5 h-3.5" /> Request Amendment
          </p>
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
        </button>
        {showAmend && (
          <div className="px-4 pb-4 space-y-2 border-t border-border/50">
            <textarea
              value={amendRemarks}
              onChange={e => setAmendRemarks(e.target.value)}
              placeholder="Describe amendment reason…"
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none mt-3"
            />
            <button
              onClick={() => { if (amendRemarks.trim()) { amendRelease({ id: release.id, remarks: amendRemarks }); setShowAmend(false); setAmendRemarks(''); } }}
              disabled={!amendRemarks.trim() || isAmending}
              className="w-full h-9 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-500/90 disabled:opacity-40 transition-colors"
            >
              {isAmending ? 'Submitting…' : 'Submit Amendment Request'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}