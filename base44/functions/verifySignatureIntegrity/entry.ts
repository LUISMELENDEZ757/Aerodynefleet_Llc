/**
 * verifySignatureIntegrity — Tamper Detection
 * Re-computes the SHA-256 hash of an entry's canonical fields
 * and compares against every stored signature's content_hash.
 * Returns a detailed integrity report per signature.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const HASH_FIELDS = [
  'aircraft_tail', 'log_page', 'entry_type', 'discrepancy_status',
  'ata_chapter', 'description', 'corrective_action', 'corrected_by',
  'corrected_by_id', 'rii_required', 'rii_inspector_name', 'rii_inspector_id',
  'rii_signed_at', 'parts_used', 'station', 'flight_number',
];

async function sha256hex(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { entry_id } = body;

  if (!entry_id) return Response.json({ error: 'entry_id required' }, { status: 400 });

  const entries = await base44.entities.LogbookEntry.filter({ id: entry_id });
  const entry = entries?.[0];
  if (!entry) return Response.json({ error: 'Entry not found' }, { status: 404 });

  // Recompute current hash
  const canonicalFields = {};
  for (const field of HASH_FIELDS) {
    canonicalFields[field] = entry[field] ?? null;
  }
  canonicalFields._id = entry.id;
  canonicalFields._created = entry.created_date;

  const canonicalString = JSON.stringify(canonicalFields, Object.keys(canonicalFields).sort());
  const currentHash = await sha256hex(canonicalString);

  const signatures = Array.isArray(entry.digital_signatures) ? entry.digital_signatures : [];

  const signatureResults = signatures.map(sig => {
    const match = sig.content_hash === currentHash;
    return {
      signed_at: sig.signed_at,
      signer_name: sig.signer_name,
      signer_email: sig.signer_email,
      signer_role: sig.signer_role,
      signer_cert: sig.signer_cert,
      signature_type: sig.signature_type,
      stored_hash: sig.content_hash,
      current_hash: currentHash,
      integrity: match ? 'VALID' : 'TAMPERED',
      hash_match: match,
    };
  });

  const allValid = signatureResults.every(s => s.hash_match);
  const anyTampered = signatureResults.some(s => !s.hash_match);

  return Response.json({
    success: true,
    entry_id: entry.id,
    aircraft_tail: entry.aircraft_tail,
    log_page: entry.log_page,
    is_signed: entry.is_signed,
    current_hash: currentHash,
    overall_integrity: signatures.length === 0 ? 'UNSIGNED' : allValid ? 'VALID' : 'TAMPERED',
    tamper_detected: anyTampered,
    signature_count: signatures.length,
    signatures: signatureResults,
    checked_at: new Date().toISOString(),
    fields_hashed: HASH_FIELDS,
  });
});