import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { createClient } from 'npm:@supabase/supabase-js@2.103.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get Supabase credentials from env
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all aircraft from Base44
    const aircraft = await base44.entities.Aircraft.list('tail_number', 1000);

    if (aircraft.length === 0) {
      return Response.json({ message: 'No aircraft to sync', count: 0 });
    }

    // Prepare data for Supabase (remove Base44-specific fields)
    const supabaseData = aircraft.map(a => ({
      tail_number: a.tail_number,
      fleet_id: a.fleet_id,
      airline: a.airline,
      aircraft_type: a.aircraft_type,
      aircraft_type_id: a.aircraft_type_id,
      msn: a.msn,
      line_number: a.line_number,
      operator_number: a.operator_number,
      base_station: a.base_station,
      status: a.status,
      delivery_date: a.delivery_date,
      retirement_date: a.retirement_date,
      engine_type: a.engine_type,
      engine_variant: a.engine_variant,
      mtow_variant: a.mtow_variant,
      etops_approval: a.etops_approval,
      cat_approval: a.cat_approval,
      rvsm_approved: a.rvsm_approved,
      rnp_capability: a.rnp_capability,
      polar_approved: a.polar_approved,
      cabin_config_ref: a.cabin_config_ref,
      performance_profile: a.performance_profile,
      notes: a.notes,
    }));

    // Upsert into Supabase (using tail_number as unique identifier)
    const { data, error } = await supabase
      .from('Aircraft')
      .upsert(supabaseData, { onConflict: 'tail_number' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      status: 'success',
      message: `Synced ${aircraft.length} aircraft to Supabase`,
      count: aircraft.length,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});