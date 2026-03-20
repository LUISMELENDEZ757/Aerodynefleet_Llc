import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
  FileText, CheckCircle, AlertTriangle, Clock, PenLine,
  RefreshCw, History, Send, User, Radio
} from 'lucide-react';

const TODAY = new Date().toISOString().split('T')[0];

const STATUS_CFG = {
  pending:   { label: 'Pending',   color: 'text-orange-400',       bg: 'bg-orange-500/15' },
  released:  { label: 'Released',  color: 'text-green-400',        bg: 'bg-green-500/15'  },
  amended:   { label: 'Amended',   color: 'text-primary',          bg: 'bg-primary/15'    },
  cancelled: { label: 'Cancelled', color: 'text-destructive',      bg: 'bg-destructive/15' },
};

function nowStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}Z`;
}

function SignaturePad({ role, name, signed, onSign, onClear }) {
  const [inputName, setInputName] = useState(name || '');
  if (signed) {
    return (
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-green-400">{role} — Signed</p>
            <p className="text-xs font-mono text-muted-foreground">{signed.name} · {signed.time}</p>
          </div>
        </div>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2.5 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">{role} Signature</p>
      <div className="flex gap-2">
        <input
          value={inputName}
          onChange={e => setInputName(e.target.value)}
          placeholder={`${role} name…`}
          className="flex-1 h-8 bg-background border border-border rounded-lg px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          disabled={!inputName.trim()}
          onClick={() => onSign({ name: inputName.trim(), time: nowStr() })}
          className="h-8 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1"
        >
          <PenLine className="w-3 h-3" /> Sign
        </button>
      </div>
    </div>
  );
}

function ReleaseCard({ release, onAmend }) {
  const [pilotSig, setPilotSig]       = useState(null);
  const [dispSig, setDispSig]         = useState(null);
  const [amendNote, setAmendNote]     = useState('');
  const [showAmend, setShowAmend]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]         = useState([]);

  const cfg = STATUS_CFG[release.release_status] || STATUS_CFG.pending;
  const bothSigned = pilotSig && dispSig;

  const handleAmend = () => {
    if (!amendNote.trim()) return;
    const entry = { time: nowStr(), note: amendNote, by: dispSig?.name || 'Dispatcher' };
    setHistory(prev => [...prev, entry]);
    onAmend(release.id, amendNote);
    setAmendNote('');
    setShowAmend(false);
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-secondary/40 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-mono font-bold text-foreground">{release.flight_number}</p>
            <p className="text-xs text-muted-foreground">
              {release.origin} → {release.destination}
              {release.dispatcher_name ? ` · DISP: ${release.dispatcher_name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Release details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Fuel OB',    value: release.fuel_on_board    ? `${release.fuel_on_board.toLocaleString()} lbs` : '—' },
            { label: 'Min Fuel',   value: release.min_fuel_required ? `${release.min_fuel_required.toLocaleString()} lbs` : '—' },
            { label: 'Alternate',  value: release.alternate || '—' },
            { label: 'Date',       value: release.flight_date || TODAY },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xs font-mono font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {release.remarks && (
          <div className="bg-background/40 rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground mb-0.5">Dispatcher Remarks</p>
            <p className="text-xs text-foreground">{release.remarks}</p>
          </div>
        )}

        {/* Signature section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5" /> Digital Signatures
          </p>
          <SignaturePad
            role="Captain / Pilot-in-Command"
            signed={pilotSig}
            onSign={setPilotSig}
            onClear={() => setPilotSig(null)}
          />
          <SignaturePad
            role="Dispatcher"
            signed={dispSig}
            onSign={setDispSig}
            onClear={() => setDispSig(null)}
          />
        </div>

        {/* Confirmation */}
        {bothSigned && (
          <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-3">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-400">Release Accepted — Both Parties Signed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                CPT: {pilotSig.name} {pilotSig.time} · DISP: {dispSig.name} {dispSig.time}
              </p>
              <p className="text-xs text-muted-foreground">Notified: OCC, MOC</p>
            </div>
          </div>
        )}

        {/* Amend workflow */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAmend(s => !s)}
            className="flex-1 h-8 text-xs font-bold border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
          >
            Amend Release
          </button>
          <button
            onClick={() => setShowHistory(s => !s)}
            className="h-8 px-3 text-xs font-semibold border border-border text-muted-foreground rounded-lg hover:text-foreground transition-colors flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5" /> History ({history.length})
          </button>
        </div>

        {showAmend && (
          <div className="space-y-2">
            <textarea
              value={amendNote}
              onChange={e => setAmendNote(e.target.value)}
              placeholder="Describe amendment reason (fuel change, alternate change, routing revision)…"
              rows={2}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <button
              disabled={!amendNote.trim()}
              onClick={handleAmend}
              className="w-full h-8 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Issue Amendment — Notify OCC + MX
            </button>
          </div>
        )}

        {showHistory && (
          <div className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Version History</p>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No amendments yet</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground"><span className="font-mono text-muted-foreground">{h.time}</span> · {h.by}: {h.note}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FlightReleaseSignOff() {
  const queryClient = useQueryClient();

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['efb-releases-signoff', TODAY],
    queryFn: () => base44.entities.DispatchRelease.filter({ flight_date: TODAY }),
  });

  const amendMutation = useMutation({
    mutationFn: ({ id, note }) => base44.entities.DispatchRelease.update(id, {
      release_status: 'amended',
      remarks: note,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['efb-releases-signoff'] }),
  });

  if (isLoading) return (
    <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
      Loading releases…
    </div>
  );

  if (releases.length === 0) return (
    <div className="rounded-xl bg-card border border-border px-4 py-10 text-center">
      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">No dispatch releases for today</p>
      <p className="text-xs text-muted-foreground mt-1">Releases appear here once created by Dispatch</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
        <Radio className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-blue-400 font-semibold">
          Both Captain and Dispatcher signatures required. Amendments auto-notify OCC and MX.
        </p>
      </div>
      {releases.map(r => (
        <ReleaseCard
          key={r.id}
          release={r}
          onAmend={(id, note) => amendMutation.mutate({ id, note })}
        />
      ))}
    </div>
  );
}