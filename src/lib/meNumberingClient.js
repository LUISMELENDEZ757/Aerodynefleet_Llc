import { base44 } from '@/api/base44Client';

/**
 * Issue a new M&E number via the meIssueNumber backend function.
 * Returns { number, seq, counter_key, number_type, issued_by, issued_at }.
 * See base44/shared/meNumbering.ts for the master spec.
 */
export async function issueMeNumber(req) {
  const res = await base44.functions.invoke('meIssueNumber', req);
  // SDK returns an axios-style response; data is the function's JSON body.
  return res?.data ?? res;
}

/** Convenience presets for entity ↔ scheme mapping. */
export const ME_SCHEMES = {
  tool:            { number_type: 'tooling',      field: 'tool_number' },
  inventory:       { number_type: 'me_part',      field: 'me_number' },
  engine_part:     { number_type: 'me_part',      field: 'me_number' },
  tracked_comp:     { number_type: 'me_part',      field: 'me_number' },
  comp_lifecycle:   { number_type: 'me_part',      field: 'me_number' },
  work_package:    { number_type: 'work_order',   field: 'work_order_number' },
  document:        { number_type: 'document',     field: 'document_number' },
  mel_library:     { number_type: 'document',     field: 'mel_number', doc_type: 'MEL' },
  ad:              { number_type: 'document',     field: 'ad_number', doc_type: 'AD' },
};