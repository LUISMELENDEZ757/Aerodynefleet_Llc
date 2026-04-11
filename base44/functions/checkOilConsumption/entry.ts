import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * checkOilConsumption
 * Scans recent oil service logbook entries per aircraft, computes current oil levels
 * and consumption rates, then fires OpsAlerts when approaching or below min_service_level.
 *
 * Severity tiers:
 *   CRITICAL  — oil level AT or BELOW min_service_level
 *   WARNING   — oil level within 20% buffer above min_service_level
 *   CAUTION   — consumption rate exceeds max_consumption_rate_value
 */

// Parse oil quarts from logbook description strings
// Looks for patterns like "E1 Before: 10.5 Added: 1.5 After: 12.0"
function parseOilReadings(description) {
  if (!description) return null;
  const readings = {};

  // Engine 1
  const e1After = description.match(/[Ee]ngine\s*1[\s\S]*?[Aa]fter[:\s]+([0-9.]+)/);
  const e1Before = description.match(/[Ee]ngine\s*1[\s\S]*?[Bb]efore[:\s]+([0-9.]+)/);
  const e1Added = description.match(/[Ee]ngine\s*1[\s\S]*?[Aa]dded[:\s]+([0-9.]+)/);

  // Engine 2
  const e2After = description.match(/[Ee]ngine\s*2[\s\S]*?[Aa]fter[:\s]+([0-9.]+)/);
  const e2Before = description.match(/[Ee]ngine\s*2[\s\S]*?[Bb]efore[:\s]+([0-9.]+)/);
  const e2Added = description.match(/[Ee]ngine\s*2[\s\S]*?[Aa]dded[:\s]+([0-9.]+)/);

  // APU
  const apuAfter = description.match(/[Aa][Pp][Uu][\s\S]*?[Aa]fter[:\s]+([0-9.]+)/);
  const apuBefore = description.match(/[Aa][Pp][Uu][\s\S]*?[Bb]efore[:\s]+([0-9.]+)/);

  if (e1After) readings.e1_after = parseFloat(e1After[1]);
  if (e1Before) readings.e1_before = parseFloat(e1Before[1]);
  if (e1Added) readings.e1_added = parseFloat(e1Added[1]);
  if (e2After) readings.e2_after = parseFloat(e2After[1]);
  if (e2Before) readings.e2_before = parseFloat(e2Before[1]);
  if (e2Added) readings.e2_added = parseFloat(e2Added[1]);
  if (apuAfter) readings.apu_after = parseFloat(apuAfter[1]);
  if (apuBefore) readings.apu_before = parseFloat(apuBefore[1]);

  return Object.keys(readings).length > 0 ? readings : null;
}

// Check if an alert already exists and is recent (< 24h) to avoid spam
async function alertAlreadyExists(base44, tail, component) {
  const existing = await base44.asServiceRole.entities.OpsAlert.filter({
    aircraft_tail: tail,
    is_dismissed: false,
  });
  const now = Date.now();
  return existing.some(a =>
    a.title?.includes(component) &&
    (now - new Date(a.created_date).getTime()) < 24 * 60 * 60 * 1000
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all data in parallel
    const [configs, profiles, recentEntries] = await Promise.all([
      base44.asServiceRole.entities.AircraftPowerplantConfig.list(),
      base44.asServiceRole.entities.OilServicingProfile.list(),
      base44.asServiceRole.entities.LogbookEntry.list('-created_date', 500),
    ]);

    // Filter to oil-related entries only (ATA 79 or contains OIL SERVICE)
    const oilEntries = recentEntries.filter(e =>
      e.ata_chapter === '79' ||
      (e.description || '').toUpperCase().includes('[OIL SERVICE]') ||
      (e.description || '').toUpperCase().includes('OIL SERVICE')
    );

    // Group entries by aircraft tail, sorted newest first
    const byTail = {};
    for (const entry of oilEntries) {
      if (!byTail[entry.aircraft_tail]) byTail[entry.aircraft_tail] = [];
      byTail[entry.aircraft_tail].push(entry);
    }

    const alertsCreated = [];

    for (const config of configs) {
      const tail = config.aircraft_tail;
      const tailEntries = byTail[tail] || [];

      // Resolve engine oil profile
      const engineProfile = profiles.find(
        p => p.powerplant_type_id === config.engine_type_id && p.component_type === 'ENGINE'
      );
      const apuProfile = profiles.find(
        p => p.powerplant_type_id === config.apu_type_id && p.component_type === 'APU'
      );

      // Check each component
      const components = [];
      if (engineProfile) {
        components.push({
          label: 'Engine',
          profile: engineProfile,
          afterKey: ['e1_after', 'e2_after'],
          beforeKey: ['e1_before', 'e2_before'],
          min: config.override_engine_min ?? engineProfile.min_service_level,
          max: config.override_engine_max ?? engineProfile.max_service_level,
          maxConsumption: config.override_max_consumption ?? engineProfile.max_consumption_rate_value,
        });
      }
      if (apuProfile) {
        components.push({
          label: 'APU',
          profile: apuProfile,
          afterKey: ['apu_after'],
          beforeKey: ['apu_before'],
          min: config.override_apu_min ?? apuProfile.min_service_level,
          max: config.override_apu_max ?? apuProfile.max_service_level,
          maxConsumption: apuProfile.max_consumption_rate_value,
        });
      }

      for (const comp of components) {
        // Get the most recent oil level reading for this component
        let latestLevel = null;
        let consumption = null;

        for (const entry of tailEntries) {
          const readings = parseOilReadings(entry.description);
          if (!readings) continue;

          // Use "after" level as current, or "before" if no after
          const afterVal = comp.afterKey.map(k => readings[k]).find(v => v != null);
          const beforeVal = comp.beforeKey.map(k => readings[k]).find(v => v != null);
          const addedVal = comp.label === 'Engine'
            ? (readings.e1_added ?? readings.e2_added)
            : null;

          if (afterVal != null && latestLevel === null) {
            latestLevel = afterVal;
          } else if (beforeVal != null && latestLevel === null) {
            latestLevel = beforeVal;
          }

          // Compute consumption rate if we have before and added
          if (beforeVal != null && addedVal != null && afterVal != null) {
            // Consumption = oil that "disappeared" = before + added - after
            const consumed = beforeVal + addedVal - afterVal;
            if (consumed > 0 && consumption === null) {
              consumption = consumed; // quarts consumed per service interval
            }
          }

          if (latestLevel !== null) break; // found most recent, stop
        }

        if (latestLevel === null) continue; // no oil data for this tail/component

        const buffer = comp.min * 1.2; // 20% above min = warning threshold
        const unit = comp.profile.capacity_unit === 'LITERS' ? 'L' : 'qt';

        let severity = null;
        let title = null;
        let message = null;

        if (latestLevel <= comp.min) {
          severity = 'critical';
          title = `${tail} — ${comp.label} Oil BELOW Minimum`;
          message = `${comp.label} oil level is ${latestLevel} ${unit}, at or below the minimum service level of ${comp.min} ${unit}. Immediate servicing required before next flight. Aircraft: ${config.aircraft_type || tail}.`;
        } else if (latestLevel <= buffer) {
          severity = 'warning';
          title = `${tail} — ${comp.label} Oil Approaching Minimum`;
          message = `${comp.label} oil level is ${latestLevel} ${unit}, approaching the minimum service level of ${comp.min} ${unit} (threshold: ${buffer.toFixed(1)} ${unit}). Schedule servicing at next available opportunity.`;
        }

        // Also check consumption rate if available
        if (comp.maxConsumption && consumption != null && consumption > comp.maxConsumption) {
          const cSeverity = 'warning';
          const cTitle = `${tail} — ${comp.label} High Oil Consumption`;
          const cMessage = `${comp.label} oil consumption of ${consumption.toFixed(2)} ${unit}/interval exceeds the limit of ${comp.maxConsumption} ${unit}/hr. Investigate for possible leak or internal consumption issue.`;

          const alreadyFlagged = await alertAlreadyExists(base44, tail, `${comp.label} High Oil Consumption`);
          if (!alreadyFlagged) {
            await base44.asServiceRole.entities.OpsAlert.create({
              alert_type: 'mx',
              severity: cSeverity,
              title: cTitle,
              message: cMessage,
              aircraft_tail: tail,
              target_roles: ['all'],
              is_read: false,
              is_dismissed: false,
            });
            alertsCreated.push(cTitle);
          }
        }

        if (severity) {
          const alreadyFlagged = await alertAlreadyExists(base44, tail, title);
          if (!alreadyFlagged) {
            await base44.asServiceRole.entities.OpsAlert.create({
              alert_type: 'mx',
              severity,
              title,
              message,
              aircraft_tail: tail,
              target_roles: ['all'],
              is_read: false,
              is_dismissed: false,
            });
            alertsCreated.push(title);
          }
        }
      }
    }

    return Response.json({
      success: true,
      tails_checked: configs.length,
      oil_entries_scanned: oilEntries.length,
      alerts_created: alertsCreated.length,
      alerts: alertsCreated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});