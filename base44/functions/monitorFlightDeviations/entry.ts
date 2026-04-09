import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Fetch active/enroute flights
    const flights = await base44.asServiceRole.entities.Flight.filter({
      status: { $in: ['airborne', 'delayed', 'on_time'] }
    });

    // Fetch dispatch monitoring data for ETA tracking
    const monitoring = await base44.asServiceRole.entities.DispatchMonitoring.list('-created_date', 500);

    // Fetch existing alerts to avoid duplicates
    const existingAlerts = await base44.asServiceRole.entities.OpsAlert.filter({
      is_dismissed: false,
      created_date: { $gte: new Date(now.getTime() - 3600000).toISOString() }
    });

    const alertsToCreate = [];

    // Monitor ETA deviations
    for (const flight of flights) {
      const mon = monitoring.find(m => m.flight_number === flight.flight_number && m.flight_date === today);
      
      if (mon && mon.estimated_arrival && flight.scheduled_arrival) {
        const scheduledTime = new Date(flight.scheduled_arrival);
        const estimatedTime = new Date(mon.estimated_arrival);
        const deviationMinutes = (estimatedTime - scheduledTime) / 60000;

        // Alert if deviation > 15 minutes
        if (Math.abs(deviationMinutes) > 15) {
          const isDuplicate = existingAlerts.some(a => 
            a.flight_number === flight.flight_number && 
            a.alert_type === 'flight_status'
          );

          if (!isDuplicate) {
            alertsToCreate.push({
              alert_type: 'flight_status',
              severity: Math.abs(deviationMinutes) > 30 ? 'critical' : 'warning',
              title: `${flight.flight_number} ETA Change`,
              message: deviationMinutes > 0 
                ? `Estimated ${Math.round(deviationMinutes)}m LATE (ETA: ${estimatedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}Z)`
                : `Estimated ${Math.round(Math.abs(deviationMinutes))}m EARLY (ETA: ${estimatedTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}Z)`,
              flight_number: flight.flight_number,
              aircraft_tail: flight.aircraft_tail,
              action_required: Math.abs(deviationMinutes) > 30,
              action_url: `/DispatchWorkstation?flight=${flight.flight_number}`,
            });
          }
        }
      }
    }

    // Monitor IROPS recovery status changes
    const iropsEvents = await base44.asServiceRole.entities.IROPSEvent.filter({
      status: { $ne: 'resolved' }
    });

    for (const event of iropsEvents) {
      const isDuplicate = existingAlerts.some(a => 
        a.flight_number === event.flight_number && 
        a.alert_type === 'irops'
      );

      if (!isDuplicate) {
        alertsToCreate.push({
          alert_type: 'irops',
          severity: event.impact_level === 'critical' ? 'critical' : 'warning',
          title: `IROPS: ${event.event_type.toUpperCase()}`,
          message: `${event.flight_number} · ${event.description || event.event_type} · Status: ${event.status}`,
          flight_number: event.flight_number,
          aircraft_tail: event.aircraft_tail,
          action_required: true,
          action_url: `/IROPS?event=${event.id}`,
        });
      }
    }

    // Batch create alerts
    if (alertsToCreate.length > 0) {
      await base44.asServiceRole.entities.OpsAlert.bulkCreate(alertsToCreate);
    }

    return Response.json({
      success: true,
      monitored_flights: flights.length,
      alerts_created: alertsToCreate.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Monitor flight deviations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});