import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only inspectors (IA/RI) can sign RII
    if (user.role !== 'admin' && user.role !== 'inspector_rii') {
      return Response.json({ error: 'Inspector role required for RII sign-off' }, { status: 403 });
    }

    const { entry_id, inspector_cert } = await req.json();

    if (!entry_id || !inspector_cert) {
      return Response.json({ error: 'Missing entry_id or inspector_cert' }, { status: 400 });
    }

    // Fetch the logbook entry
    const entries = await base44.entities.LogbookEntry.filter({ id: entry_id });
    const entry = entries[0];

    if (!entry) {
      return Response.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Verify entry is in PENDING_RII state
    if (entry.discrepancy_status !== 'PENDING_RII') {
      return Response.json({ 
        error: `Entry must be PENDING_RII to sign. Current status: ${entry.discrepancy_status}` 
      }, { status: 400 });
    }

    // Create RII signature record
    const now = new Date().toISOString();
    const riisignature = {
      signed_at: now,
      signer_email: user.email,
      signer_name: user.full_name,
      signer_role: 'inspector_rii',
      signer_cert: inspector_cert.trim(),
      signature_type: 'rii_signoff',
      content_hash: createHash('sha256')
        .update(JSON.stringify({
          aircraft_tail: entry.aircraft_tail,
          description: entry.description,
          corrective_action: entry.corrective_action,
          ata_chapter: entry.ata_chapter,
          work_completed_at: entry.work_completed_at,
        }))
        .digest('hex'),
      hash_fields: 'aircraft_tail,description,corrective_action,ata_chapter,work_completed_at',
    };

    // Update entry: mark as CLOSED, add signature, set RII inspector info
    const updated = await base44.entities.LogbookEntry.update(entry_id, {
      discrepancy_status: 'CLOSED',
      rii_inspector_name: user.full_name,
      rii_inspector_id: user.email,
      rii_signed_at: now,
      rii_rejected: false,
      digital_signatures: [...(entry.digital_signatures || []), riisignature],
      is_signed: true,
      signature_hash: riisignature.content_hash,
    });

    return Response.json({
      status: 'success',
      entry_id: updated.id,
      signed_at: now,
      inspector: user.full_name,
      message: 'RII sign-off completed. Entry closed and aircraft status ready for transition to Airworthy.',
    });
  } catch (error) {
    console.error('RII sign-off error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});