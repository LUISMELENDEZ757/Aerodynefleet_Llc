import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * resolveOilProfile
 * Given an aircraft_tail, resolves the full oil servicing profile:
 * Tail -> AircraftPowerplantConfig -> PowerplantType -> OilServicingProfile -> apply overrides
 * Returns { engine, apu } with limits, capacity, thresholds.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { aircraft_tail } = await req.json();
    if (!aircraft_tail) return Response.json({ error: 'aircraft_tail required' }, { status: 400 });

    // 1. Find tail config
    const configs = await base44.entities.AircraftPowerplantConfig.filter({ aircraft_tail });
    const config = configs[0] || null;

    // 2. Fetch all profiles
    const allProfiles = await base44.entities.OilServicingProfile.list();

    let engine = null;
    let apu = null;

    if (config) {
      // Resolve engine profile
      if (config.engine_type_id) {
        const engineProfile = allProfiles.find(
          p => p.powerplant_type_id === config.engine_type_id && p.component_type === 'ENGINE'
        );
        if (engineProfile) {
          engine = {
            model: config.engine_type_name,
            capacity: engineProfile.capacity_value,
            unit: engineProfile.capacity_unit,
            min: config.override_engine_min ?? engineProfile.min_service_level,
            max: config.override_engine_max ?? engineProfile.max_service_level,
            max_single_addition: engineProfile.max_single_addition,
            max_consumption_rate: config.override_max_consumption ?? engineProfile.max_consumption_rate_value,
            consumption_unit: engineProfile.max_consumption_rate_unit,
            amm_reference: engineProfile.amm_reference,
            engine_count: config.engine_count || 2,
            overrides_applied: !!(config.override_engine_min || config.override_engine_max),
          };
        }
      }

      // Resolve APU profile
      if (config.apu_type_id) {
        const apuProfile = allProfiles.find(
          p => p.powerplant_type_id === config.apu_type_id && p.component_type === 'APU'
        );
        if (apuProfile) {
          apu = {
            model: config.apu_type_name,
            capacity: apuProfile.capacity_value,
            unit: apuProfile.capacity_unit,
            min: config.override_apu_min ?? apuProfile.min_service_level,
            max: config.override_apu_max ?? apuProfile.max_service_level,
            max_single_addition: apuProfile.max_single_addition,
            max_consumption_rate: apuProfile.max_consumption_rate_value,
            consumption_unit: apuProfile.max_consumption_rate_unit,
            amm_reference: apuProfile.amm_reference,
            overrides_applied: !!(config.override_apu_min || config.override_apu_max),
          };
        }
      }
    }

    return Response.json({
      aircraft_tail,
      config_found: !!config,
      engine,
      apu,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});