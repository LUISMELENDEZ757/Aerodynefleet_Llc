import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all aircraft and maintenance forecasts
    const [aircraft, forecasts] = await Promise.all([
      base44.entities.Aircraft.list('tail_number', 500),
      base44.entities.MaintenanceForecast.list('-updated_date', 500),
    ]);

    const alerts = [];
    const now = new Date();

    forecasts.forEach(forecast => {
      const tail = aircraft.find(a => a.id === forecast.aircraft_tail)?.tail_number || forecast.aircraft_tail;
      
      // Check if overdue
      if (forecast.status === 'overdue') {
        alerts.push({
          alert_type: 'mx',
          severity: 'critical',
          title: `[OVERDUE] ${tail} - ${forecast.component} Overhaul`,
          message: `${tail} has exceeded ${forecast.component} overhaul interval. Immediate maintenance required.`,
          aircraft_tail: tail,
          target_roles: ['admin', 'maintenance_lead', 'engineering'],
          action_required: true,
          action_url: `/MaintenanceControl?tab=forecasts&tail=${tail}`,
        });
      }
      // Check if due soon (within 10 flight hours or 2 weeks)
      else if (forecast.status === 'due_soon') {
        const hoursRemaining = forecast.overhaul_interval_hours - forecast.total_flight_hours;
        const daysToExpiry = forecast.suggested_window_end 
          ? Math.ceil((new Date(forecast.suggested_window_end) - now) / (1000 * 60 * 60 * 24))
          : null;

        alerts.push({
          alert_type: 'mx',
          severity: 'warning',
          title: `[SCHEDULED] ${tail} - ${forecast.component} Overhaul Due`,
          message: `${tail} ${forecast.component} due in ${hoursRemaining}h / ${daysToExpiry} days. Recommend maintenance window: ${forecast.suggested_window_start || 'TBD'}`,
          aircraft_tail: tail,
          target_roles: ['admin', 'maintenance_lead', 'engineering'],
          action_required: true,
          action_url: `/MaintenanceControl?tab=forecasts&tail=${tail}`,
        });
      }
      // Check if in watch (within 50 flight hours)
      else if (forecast.status === 'watch') {
        const hoursRemaining = forecast.overhaul_interval_hours - forecast.total_flight_hours;
        alerts.push({
          alert_type: 'mx',
          severity: 'warning',
          title: `[WATCH] ${tail} - ${forecast.component} Approaching Interval`,
          message: `${tail} ${forecast.component}: ${hoursRemaining}h remaining until scheduled maintenance.`,
          aircraft_tail: tail,
          target_roles: ['engineering'],
          action_required: false,
          action_url: `/MaintenanceControl?tab=forecasts&tail=${tail}`,
        });
      }
    });

    // Create alerts in the system
    const created = [];
    for (const alert of alerts) {
      try {
        const result = await base44.entities.OpsAlert.create(alert);
        created.push(result);
      } catch (e) {
        // Log error but continue
        console.error(`Failed to create alert for ${alert.aircraft_tail}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      alerts_checked: forecasts.length,
      alerts_created: created.length,
      alerts: created,
    });
  } catch (error) {
    console.error('Maintenance alert check failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});