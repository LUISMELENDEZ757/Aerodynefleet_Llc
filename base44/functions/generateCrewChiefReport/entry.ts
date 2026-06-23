import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { stationFilter } = await req.json().catch(() => ({}));
    
    const TODAY = new Date().toISOString().split('T')[0];
    
    // Fetch all supply requisitions (tasks)
    const requisitions = await base44.entities.SupplyRequisition.list('-created_date', 500);
    
    // Fetch logbook entries for additional context
    const logEntries = await base44.entities.LogbookEntry.list('-created_date', 500);
    
    // Filter tasks for current shift (today)
    const todayTasks = requisitions.filter(r => {
      const createdDate = r.created_date?.split('T')[0];
      return createdDate === TODAY;
    });
    
    // Filter by station if provided
    const filteredTasks = stationFilter 
      ? todayTasks.filter(r => r.station?.toUpperCase() === stationFilter.toUpperCase())
      : todayTasks;
    
    // Categorize by status
    const pendingTasks = filteredTasks.filter(r => 
      ['pending_approval', 'approved', 'ordered', 'in_transit', 'received', 
       'pending_mcc', 'mcc_approved', 'pending_qc_inspection', 'technician_assigned'].includes(r.status)
    );
    
    const completedTasks = filteredTasks.filter(r => 
      ['installation_complete', 'closed', 'qc_approved', 'received'].includes(r.status)
    );
    
    // Group by station
    const tasksByStation = {};
    filteredTasks.forEach(task => {
      const station = task.station || 'UNKNOWN';
      if (!tasksByStation[station]) {
        tasksByStation[station] = { pending: [], completed: [] };
      }
      if (pendingTasks.includes(task)) {
        tasksByStation[station].pending.push(task);
      }
      if (completedTasks.includes(task)) {
        tasksByStation[station].completed.push(task);
      }
    });
    
    // Calculate summary statistics
    const summary = {
      totalTasks: filteredTasks.length,
      pendingCount: pendingTasks.length,
      completedCount: completedTasks.length,
      completionRate: filteredTasks.length > 0 
        ? Math.round((completedTasks.length / filteredTasks.length) * 100) 
        : 0,
      byPriority: {
        aog: filteredTasks.filter(t => t.priority === 'aog').length,
        critical: filteredTasks.filter(t => t.priority === 'critical').length,
        routine: filteredTasks.filter(t => t.priority === 'routine').length,
      },
      byStatus: {},
    };
    
    // Count by status
    filteredTasks.forEach(task => {
      summary.byStatus[task.status] = (summary.byStatus[task.status] || 0) + 1;
    });
    
    // Get station list
    const stations = [...new Set(filteredTasks.map(t => t.station || 'UNKNOWN'))].sort();
    
    return Response.json({
      reportDate: TODAY,
      generatedAt: new Date().toISOString(),
      generatedBy: user.full_name || user.email,
      stationFilter: stationFilter || 'All Stations',
      summary,
      stations,
      tasksByStation,
      pendingTasks,
      completedTasks,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});