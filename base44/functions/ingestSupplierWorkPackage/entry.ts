import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { supplier_system, raw_data, aircraft_tail, check_type, scheduled_date } = payload;

    if (!supplier_system || !raw_data || !aircraft_tail || !check_type || !scheduled_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Parse supplier system data
    let tasks = [];
    let parts = [];
    let estimated_hours = 0;
    let estimated_cost = 0;

    if (supplier_system === 'TRAX') {
      // TRAX format: typically has "Work Items" array with task codes and labor hours
      const workItems = raw_data.work_items || [];
      tasks = workItems.map((item, idx) => ({
        task_id: item.task_code || `TRAX-${idx}`,
        description: item.description || item.task_name || '',
        ata_chapter: item.ata || item.ata_chapter || '',
        estimated_hours: parseFloat(item.labor_hours) || parseFloat(item.hours) || 0,
        status: 'pending',
      }));
      estimated_hours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);

      if (raw_data.parts && Array.isArray(raw_data.parts)) {
        parts = raw_data.parts.map(p => ({
          part_number: p.part_number || p.pn || '',
          part_name: p.description || p.part_name || '',
          quantity: parseFloat(p.quantity) || 1,
          lead_time_days: parseFloat(p.lead_time) || 14,
          unit_cost: parseFloat(p.cost) || 0,
        }));
      }
    } else if (supplier_system === 'AMOS') {
      // AMOS format: typically has "Tasks" with task_id, description, labor
      const amosTasks = raw_data.tasks || raw_data.TaskList || [];
      tasks = amosTasks.map(t => ({
        task_id: t.task_id || t.TaskID || `AMOS-${t.id}`,
        description: t.description || t.task_description || t.Title || '',
        ata_chapter: t.ata_chapter || t.ATA || '',
        estimated_hours: parseFloat(t.labor_hours) || parseFloat(t.Labor) || 0,
        status: 'pending',
      }));
      estimated_hours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);

      if (raw_data.materials || raw_data.parts) {
        parts = (raw_data.materials || raw_data.parts).map(p => ({
          part_number: p.part_number || p.PartNumber || '',
          part_name: p.description || p.Description || '',
          quantity: parseFloat(p.quantity || p.Quantity) || 1,
          lead_time_days: 21,
          unit_cost: parseFloat(p.cost || p.Cost) || 0,
        }));
      }
    } else if (supplier_system === 'SCEPTRE') {
      // SCEPTRE format: typically has "items" array with labor estimates
      const items = raw_data.items || raw_data.line_items || [];
      tasks = items.map((item, idx) => ({
        task_id: item.item_id || `SCEPTRE-${idx}`,
        description: item.description || item.item_description || '',
        ata_chapter: item.ata || '',
        estimated_hours: parseFloat(item.labor) || parseFloat(item.man_hours) || 0,
        status: 'pending',
      }));
      estimated_hours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);

      if (raw_data.consumables) {
        parts = raw_data.consumables.map(c => ({
          part_number: c.code || c.part_code || '',
          part_name: c.name || c.description || '',
          quantity: parseFloat(c.qty) || 1,
          lead_time_days: 14,
          unit_cost: parseFloat(c.unit_price) || 0,
        }));
      }
    } else if (supplier_system === 'AHEAD' || supplier_system === 'AHM') {
      // Embraer/Boeing formats: typically structured with "checks" and "actions"
      const actions = raw_data.actions || raw_data.maintenance_actions || [];
      tasks = actions.map((action, idx) => ({
        task_id: action.action_id || action.id || `${supplier_system}-${idx}`,
        description: action.description || action.action || '',
        ata_chapter: action.ata_code || action.ata || '',
        estimated_hours: parseFloat(action.estimated_labor) || 0,
        status: 'pending',
      }));
      estimated_hours = tasks.reduce((sum, t) => sum + t.estimated_hours, 0);

      if (raw_data.parts) {
        parts = raw_data.parts.map(p => ({
          part_number: p.part_number || '',
          part_name: p.description || '',
          quantity: parseFloat(p.quantity) || 1,
          lead_time_days: 21,
          unit_cost: parseFloat(p.unit_cost) || 0,
        }));
      }
    }

    // Calculate total cost
    estimated_cost = parts.reduce((sum, p) => sum + (p.unit_cost * p.quantity), 0);

    // Get aircraft info
    const aircraft = await base44.entities.Aircraft.filter({ tail_number: aircraft_tail });
    const aircraftData = aircraft[0] || { tail_number: aircraft_tail, aircraft_type: 'Unknown' };

    // Create work package
    const workPackage = {
      aircraft_tail,
      aircraft_type: aircraftData.aircraft_type || 'Unknown',
      check_type,
      scheduled_date,
      estimated_completion_date: new Date(new Date(scheduled_date).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'planned',
      station: aircraftData.base_station || '',
      estimated_man_hours: Math.round(estimated_hours * 10) / 10,
      estimated_cost: Math.round(estimated_cost),
      tasks,
      parts_required: parts,
      supplier_system,
      supplier_reference: raw_data.reference_id || raw_data.id || '',
      notes: `Ingested from ${supplier_system} on ${new Date().toISOString()}`,
    };

    const created = await base44.entities.WorkPackage.create(workPackage);

    return Response.json({
      success: true,
      work_package_id: created.id,
      summary: {
        tasks_count: tasks.length,
        parts_count: parts.length,
        estimated_hours: Math.round(estimated_hours * 10) / 10,
        estimated_cost: Math.round(estimated_cost),
      },
    });
  } catch (error) {
    console.error('Error ingesting work package:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});