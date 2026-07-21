/**
 * logbookOsSync — wires eLogbook actions into the rest of the Fleet OS.
 *
 * - allocateLogPage:      fresh per-tail LP# allocation at save time (no stale collisions)
 * - computeMelExpiry:     MEL category → expiry date (A=1d, B=3d, C=10d, D=120d)
 * - syncAfterEntryCreate: AOG entry → aircraft OOS · deferral → MELItem + mel_ops status
 * - syncAfterEntryClose:  clears wired fault · last discrepancy closed → rts_pending
 * - syncAfterMelClear:    last MEL cleared → mel_ops back to active
 */
import { base44 } from '@/api/base44Client';

export const MEL_INTERVAL_DAYS = { A: 1, B: 3, C: 10, D: 120 };

export function computeMelExpiry(category, fromDate) {
  const days = MEL_INTERVAL_DAYS[category];
  if (!days) return undefined;
  const d = fromDate ? new Date(fromDate) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Allocate the next LP# for a tail from a fresh read (max existing + 1). */
export async function allocateLogPage(aircraftTail) {
  const entries = await base44.entities.LogbookEntry.filter({ aircraft_tail: aircraftTail });
  const max = (entries || []).reduce((m, e) => {
    const n = parseInt(String(e.log_page || '').replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `LP#${String(max + 1).padStart(4, '0')}`;
}

async function getAircraft(tail) {
  const [ac] = await base44.entities.Aircraft.filter({ tail_number: tail });
  return ac || null;
}

/** After creating a logbook entry: drive aircraft state + MEL system. */
export async function syncAfterEntryCreate(entry) {
  const ac = await getAircraft(entry.aircraft_tail);

  // Deferral → create MELItem so MEL dashboard / CAT / ETOPS / dispatch see it
  if (entry.is_deferred && entry.mel_category) {
    await base44.entities.MELItem.create({
      aircraft_tail: entry.aircraft_tail,
      ata_chapter: entry.ata_chapter || '',
      item_number: entry.mel_reference || '',
      description: entry.description,
      category: entry.mel_category,
      deferred_date: new Date().toISOString().split('T')[0],
      expiry_date: entry.mel_expiry_date || computeMelExpiry(entry.mel_category),
      status: 'open',
      logpage_number: entry.log_page || '',
      notes: `Created from eLogbook entry ${entry.log_page || ''}`,
    });
    if (ac && ac.status === 'active') {
      await base44.entities.Aircraft.update(ac.id, { status: 'mel_ops' });
    }
  }

  // AOG severity → place aircraft OOS
  if (entry.severity === 'aog' && ac && !['oos', 'maintenance', 'retired'].includes(ac.status)) {
    await base44.entities.Aircraft.update(ac.id, {
      status: 'oos',
      oos_reason: `[LOGBOOK] ${entry.log_page || ''} — ${String(entry.description || '').slice(0, 140)}`,
      oos_since: new Date().toISOString(),
    });
  }
}

/** After closing a discrepancy: clear wired fault + promote OOS → RTS pending. */
export async function syncAfterEntryClose(entry) {
  // Clear the originating fault (structured field first, legacy note fallback)
  let faultId = entry.source_fault_id;
  if (!faultId) {
    const m = /Auto-wired from FaultMessage ID: ([A-Za-z0-9]+)/.exec(entry.notes || '');
    faultId = m?.[1];
  }
  if (faultId) {
    await base44.entities.FaultMessage.update(faultId, {
      status: 'cleared',
      cleared_at: new Date().toISOString(),
      cleared_by: entry.corrected_by || entry.rii_inspector_name || 'eLogbook closure',
    });
  }

  // No open discrepancies left → move OOS/maintenance aircraft to rts_pending
  const all = await base44.entities.LogbookEntry.filter({
    aircraft_tail: entry.aircraft_tail,
    entry_type: 'discrepancy',
  });
  const stillOpen = (all || []).filter(
    (e) => e.id !== entry.id && e.discrepancy_status !== 'CLOSED' && !e.is_cleared
  );
  if (stillOpen.length === 0) {
    const ac = await getAircraft(entry.aircraft_tail);
    if (ac && ['oos', 'maintenance'].includes(ac.status)) {
      await base44.entities.Aircraft.update(ac.id, {
        status: 'rts_pending',
        rts_checklist: { ...(ac.rts_checklist || {}), work_complete: true },
      });
    }
  }
}

/** After clearing a MEL item: restore mel_ops → active when no open MELs remain. */
export async function syncAfterMelClear(aircraftTail) {
  const mels = await base44.entities.MELItem.filter({ aircraft_tail: aircraftTail });
  const openMels = (mels || []).filter((m) => m.status !== 'cleared');
  if (openMels.length === 0) {
    const ac = await getAircraft(aircraftTail);
    if (ac && ac.status === 'mel_ops') {
      await base44.entities.Aircraft.update(ac.id, { status: 'active' });
    }
  }
}