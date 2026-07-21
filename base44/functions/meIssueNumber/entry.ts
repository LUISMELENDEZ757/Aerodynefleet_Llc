import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import {
  buildCounterKey,
  buildNumber,
  describeCounter,
  normalizeAta,
  normalizeSub,
  normalizeClass,
  isValidAta,
} from '../../shared/meNumbering.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const number_type = String(body?.number_type || 'me_part');
    const valid = ['me_part', 'tooling', 'document', 'work_order', 'history', 'scrap', 'pool', 'traceability'];
    if (!valid.includes(number_type)) {
      return Response.json({ error: `Invalid number_type: ${number_type}` }, { status: 400 });
    }

    const req2 = {
      number_type: number_type as any,
      ata: body?.ata,
      sub: body?.sub,
      class_code: body?.class_code,
      doc_type: body?.doc_type,
      category: body?.category,
      trace_type: body?.trace_type,
      tail: body?.tail,
      work_date: body?.work_date,
      reason: body?.reason,
      event: body?.event,
      location: body?.location,
      rev: body?.rev,
    };

    // Basic validation for schemes that use part-format blocks
    if (['me_part', 'tooling', 'history', 'scrap', 'pool'].includes(number_type)) {
      if (!isValidAta(req2.ata)) {
        return Response.json({ error: `Invalid ATA chapter: ${req2.ata}` }, { status: 400 });
      }
      if (!normalizeClass(req2.class_code)) {
        return Response.json({ error: `Invalid class code: ${req2.class_code}` }, { status: 400 });
      }
    }
    if (number_type === 'me_part' && !normalizeSub(req2.sub)) {
      return Response.json({ error: 'Sub-group required for me_part' }, { status: 400 });
    }
    if (number_type === 'document' && !req2.doc_type) {
      return Response.json({ error: 'doc_type required for document' }, { status: 400 });
    }
    if (number_type === 'work_order' && (!req2.tail || !req2.work_date)) {
      return Response.json({ error: 'tail and work_date required for work_order' }, { status: 400 });
    }

    const counter_key = buildCounterKey(req2);
    const description = describeCounter(req2);

    // Ensure counter exists, then optimistically allocate the next sequence.
    let issuedSeq = 0;
    let lastErr: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      // user-scoped read is fine — RLS allows engineering/admin reads
      const found = await base44.entities.NumberingStandard.filter({ counter_key });
      let counter = (found || [])[0];

      if (!counter) {
        counter = await base44.asServiceRole.entities.NumberingStandard.create({
          counter_key,
          number_type: number_type,
          ata_chapter: normalizeAta(req2.ata),
          sub_group: ['me_part'].includes(number_type) ? normalizeSub(req2.sub) : '',
          class_code: normalizeClass(req2.class_code) || '',
          doc_type: req2.doc_type || '',
          category: req2.category || '',
          event: req2.event || '',
          reason: req2.reason || '',
          location: req2.location || '',
          tail_number: req2.tail || '',
          work_date: req2.work_date || '',
          next_seq: 1,
          description,
          is_active: true,
        });
      }

      const targetSeq = Number(counter.next_seq || 1);
      const formatted = buildNumber(req2, targetSeq);

      // Conditional increment: only increment if next_seq still equals targetSeq
      // (optimistic concurrency — prevents double-issuing under a race).
      await base44.asServiceRole.entities.NumberingStandard.updateMany(
        { counter_key, next_seq: targetSeq },
        {
          $inc: { next_seq: 1 },
          $set: {
            last_issued_value: formatted,
            last_issued_at: new Date().toISOString(),
            last_issued_by: user.email || user.full_name || 'system',
          },
        }
      );

      // Re-read to confirm our increment won (next_seq advanced by exactly 1
      // and last_issued_value matches our formatted number).
      const after = await base44.entities.NumberingStandard.filter({ counter_key });
      const afterRec = (after || [])[0];
      if (afterRec && Number(afterRec.next_seq) === targetSeq + 1 && afterRec.last_issued_value === formatted) {
        issuedSeq = targetSeq;
        lastErr = null;
        break;
      }
      // Lost the race — retry.
      lastErr = new Error('sequence race, retrying');
    }

    if (!issuedSeq) {
      return Response.json({ error: 'Failed to allocate sequence after retries: ' + (lastErr?.message || 'unknown') }, { status: 409 });
    }

    const number = buildNumber(req2, issuedSeq);

    return Response.json({
      number,
      seq: issuedSeq,
      counter_key,
      number_type,
      issued_by: user.email || user.full_name || 'system',
      issued_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});