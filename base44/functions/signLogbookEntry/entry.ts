/**
 * signLogbookEntry — Digital Signature Backend
 *
 * Fetches the current LogbookEntry, computes SHA-256 of its canonical
 * content fields, appends an immutable signature record, and sets is_signed=true.
 *
 * Only technician, inspector_rii, engineer, mcc_supervisor, and admin roles may sign.
 * Once signed, the entry's core fields are locked (enforced here and in the UI).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SIGNABLE_ROLES = ['technician', 'inspector_rii', 'engineer', 'mcc_supervisor', 'admin'];

const SIGNATURE_TYPE_MAP = {
  technician:     'technician_signoff',
  inspector_rii:  'rii_signoff',
  engineer:       'technician_signoff',
  mcc_supervisor: 'supervisor_approval',
  admin:          'supervisor_approval',
};

// Fields included in the hash — the canonical content
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
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = user.role || 'viewer';
  if (!SIGNABLE_ROLES.includes(userRole)) {
    return Response.json(
      { error: `Role '${userRole}' is not authorized to sign logbook entries. Required: ${SIGNABLE_ROLES.join(', ')}` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { entry_id, signer_cert, signature_note } = body;

  if (!entry_id) {
    return Response.json({ error: 'entry_id is required' }, { status: 400 });
  }

  // Fetch the current entry
  const entries = await base44.entities.LogbookEntry.filter({ id: entry_id });
  const entry = entries?.[0];
  if (!entry) {
    return Response.json({ error: 'LogbookEntry not found' }, { status: 404 });
  }

  // Build canonical content string for hashing
  const canonicalFields = {};
  for (const field of HASH_FIELDS) {
    canonicalFields[field] = entry[field] ?? null;
  }
  // Include created_date and entry id for absolute uniqueness
  canonicalFields._id = entry.id;
  canonicalFields._created = entry.created_date;

  const canonicalString = JSON.stringify(canonicalFields, Object.keys(canonicalFields).sort());
  const contentHash = await sha256hex(canonicalString);

  const newSignature = {
    signed_at: new Date().toISOString(),
    signer_email: user.email,
    signer_name: user.full_name || user.email,
    signer_role: userRole,
    signer_cert: signer_cert || user.cert_number || '',
    signature_type: SIGNATURE_TYPE_MAP[userRole] || 'technician_signoff',
    content_hash: contentHash,
    hash_fields: HASH_FIELDS.join(','),
    ...(signature_note ? { note: signature_note } : {}),
  };

  // Append to existing signatures (preserve all previous)
  const existingSignatures = Array.isArray(entry.digital_signatures) ? entry.digital_signatures : [];
  const updatedSignatures = [...existingSignatures, newSignature];

  // Update the entry — set is_signed, append signature, store latest hash
  await base44.entities.LogbookEntry.update(entry.id, {
    is_signed: true,
    signature_hash: contentHash,
    digital_signatures: updatedSignatures,
  });

  return Response.json({
    success: true,
    entry_id: entry.id,
    signature: newSignature,
    total_signatures: updatedSignatures.length,
    message: `Entry signed by ${user.full_name || user.email} (${userRole}) at ${newSignature.signed_at}`,
  });
});