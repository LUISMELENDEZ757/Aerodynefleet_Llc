import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Sample aircraft
    const aircraft = ['N737CC', 'N757DD', 'N767EE'];
    const now = new Date();

    // EVENT LAYER — Discrepancies
    const eventEntries = [
      {
        aircraft_tail: 'N737CC',
        entry_type: 'discrepancy',
        ata_chapter: '24-10',
        station: 'KSTL',
        description: '[PILOT REPORT] Electrical system voltage fluctuation on takeoff rollout — ENG1 alternator output below 27V. Flight completed uneventfully.',
        technician_name: 'John Thompson',
        technician_id: 'JT-445',
        captain_accepted: true
      },
      {
        aircraft_tail: 'N757DD',
        entry_type: 'discrepancy',
        ata_chapter: '32-11',
        station: 'KDFW',
        description: '[PILOT REPORT] Landing gear warning light intermittent during approach — gear confirmed down and locked. No repeat noted.',
        technician_name: 'Maria Rodriguez',
        technician_id: 'MR-332',
        captain_accepted: true
      },
      {
        aircraft_tail: 'N767EE',
        entry_type: 'discrepancy',
        ata_chapter: '29-11',
        station: 'KJFK',
        description: '[MAINTENANCE FOUND] Left hydraulic system pressure slightly low (2850 psi vs 3000 nominal). Suspect small internal leak.',
        technician_name: 'David Chen',
        technician_id: 'DC-228'
      }
    ];

    // QC LAYER — Corrective Actions
    const qcEntries = eventEntries.map((e, i) => ({
      aircraft_tail: e.aircraft_tail,
      entry_type: 'corrective_action',
      ata_chapter: e.ata_chapter,
      station: e.station,
      description: [
        'Alternator connector cleaned and reseated — output now stable 28.2V. Ground tested 5 cycles.',
        'Landing gear actuator visual inspection — no leaks. Electrical connector secured. Cycled 3x OK.',
        'Hydraulic system flushed and recharged to 3000 psi. Leak source identified as bypass valve seal.'
      ][i],
      corrective_action: [
        'Replace alternator if voltage still fluctuates after next flight.',
        'Schedule landing gear actuator replacement IAW SB 32-11-00123.',
        'Schedule hydraulic pump overhaul within 50 flight hours.'
      ][i],
      technician_name: ['Michael Torres', 'Sandra Lee', 'James Kim'][i],
      technician_id: ['MT-441', 'SL-220', 'JK-339'][i],
      is_cleared: false,
      captain_signature: ['MT-441-SIG', 'SL-220-SIG', 'JK-339-SIG'][i]
    }));

    // RII LAYER — Deferred Items (MEL)
    const riiEntries = [
      {
        aircraft_tail: 'N737CC',
        entry_type: 'deferred',
        ata_chapter: '24-10',
        description: 'ENG1 Alternator output variance — monitor during next 3 flights. Replace if exceeds ±1.5V.',
        is_deferred: true,
        mel_reference: 'A-24-10-117',
        mel_category: 'A',
        is_cleared: false
      },
      {
        aircraft_tail: 'N757DD',
        entry_type: 'deferred',
        ata_chapter: '32-11',
        description: 'Landing gear indicator intermittent — functional checks passed. MEL permits continued ops for 3 calendar days.',
        is_deferred: true,
        mel_reference: 'B-32-11-089',
        mel_category: 'B',
        is_cleared: false
      }
    ];

    // QA LAYER — Safety Reports
    const safetyReports = [
      {
        incident_type: 'maintenance_finding',
        aircraft_tail: 'N737CC',
        description: 'Discrepancy in ENG1 electrical generation — root cause analysis assigned to Engineering.',
        severity: 'medium',
        status: 'open'
      },
      {
        incident_type: 'system_failure',
        aircraft_tail: 'N767EE',
        description: 'Hydraulic system pressure variance detected. Maintenance corrected. Follow-up inspection scheduled.',
        severity: 'high',
        status: 'investigating'
      }
    ];

    // RELEASE LAYER — Dispatch Releases
    const releases = [
      {
        flight_number: 'AAL4474',
        flight_date: now.toISOString().split('T')[0],
        aircraft_tail: 'N737CC',
        origin: 'KSTL',
        destination: 'KJFK',
        alternate: 'KEWR',
        release_status: 'released',
        mel_cdl_section: {
          open_mel_items: 1,
          approved_for_dispatch: true,
          restrictions: ['Monitor ENG1 alternator output — replace if variance exceeds ±1.5V']
        }
      },
      {
        flight_number: 'AAL1847',
        flight_date: now.toISOString().split('T')[0],
        aircraft_tail: 'N757DD',
        origin: 'KDFW',
        destination: 'LAX',
        alternate: 'KLAS',
        release_status: 'released',
        mel_cdl_section: {
          open_mel_items: 1,
          approved_for_dispatch: true,
          restrictions: ['Landing gear indicator MEL A-32-11-089 — 3 day approval']
        }
      }
    ];

    // OVERSIGHT LAYER — OPS Alerts
    const alerts = [
      {
        alert_type: 'mx',
        severity: 'warning',
        title: 'ENG1 Alternator Variance Alert',
        message: 'N737CC — Monitor ENG1 alternator output. Replace if variance exceeds ±1.5V.',
        aircraft_tail: 'N737CC',
        target_roles: ['dispatcher', 'mcc'],
        action_required: true,
        is_read: false,
        is_dismissed: false
      },
      {
        alert_type: 'mx',
        severity: 'critical',
        title: 'Hydraulic System Maintenance Required',
        message: 'N767EE — Hydraulic pressure correction completed. Monitor for next 10 flight hours.',
        aircraft_tail: 'N767EE',
        target_roles: ['mcc', 'engineering'],
        action_required: false,
        is_read: false,
        is_dismissed: false
      }
    ];

    // RECORDS LAYER — Cleared/Archived Entries
    const recordEntries = [
      {
        aircraft_tail: 'N737CC',
        entry_type: 'info',
        ata_chapter: '79-10',
        station: 'KSTL',
        description: '[OIL SERVICE] Engine oil servicing completed per manufacturer schedule. 20W-50 synthetic, 8.5 quarts added.',
        technician_name: 'Robert Martinez',
        is_cleared: true,
        cleared_by: 'Mike Johnson',
        cleared_date: new Date(now.getTime() - 86400000 * 3).toISOString().split('T')[0]
      },
      {
        aircraft_tail: 'N757DD',
        entry_type: 'info',
        ata_chapter: '05-00',
        station: 'KDFW',
        description: '[PERIODIC INSPECTION] 100-hour inspection completed — all checks passed.',
        technician_name: 'Linda Foster',
        is_cleared: true,
        cleared_by: 'David Wong',
        cleared_date: new Date(now.getTime() - 86400000 * 7).toISOString().split('T')[0]
      }
    ];

    // Insert all data
    const results = {
      eventEntries: await Promise.allSettled(
        eventEntries.map(e => base44.entities.LogbookEntry.create(e))
      ),
      qcEntries: await Promise.allSettled(
        qcEntries.map(e => base44.entities.LogbookEntry.create(e))
      ),
      riiEntries: await Promise.allSettled(
        riiEntries.map(e => base44.entities.LogbookEntry.create(e))
      ),
      safetyReports: await Promise.allSettled(
        safetyReports.map(s => base44.entities.SafetyReport?.create?.(s) || Promise.resolve(null))
      ),
      releases: await Promise.allSettled(
        releases.map(r => base44.entities.DispatchRelease?.create?.(r) || Promise.resolve(null))
      ),
      alerts: await Promise.allSettled(
        alerts.map(a => base44.entities.OpsAlert.create(a))
      ),
      recordEntries: await Promise.allSettled(
        recordEntries.map(e => base44.entities.LogbookEntry.create(e))
      )
    };

    return Response.json({
      success: true,
      message: 'QA Workflow mock data seeded',
      summary: {
        eventEntries: eventEntries.length,
        qcEntries: qcEntries.length,
        riiEntries: riiEntries.length,
        safetyReports: safetyReports.length,
        releases: releases.length,
        alerts: alerts.length,
        recordEntries: recordEntries.length,
        total: eventEntries.length + qcEntries.length + riiEntries.length + safetyReports.length + releases.length + alerts.length + recordEntries.length
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});