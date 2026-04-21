import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ClipboardCheck, CheckCircle, FileText, Printer, AlertTriangle,
  Clock, Eye, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import ShiftHandoverForm from '@/components/techops/ShiftHandoverForm';
import ShiftSignOff from '@/components/techops/ShiftSignOff';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STEPS = ['form', 'signoff', 'complete'];

function StatusBadge({ status }) {
  const cfg = {
    draft: 'bg-gray-900/50 text-gray-400',
    submitted: 'bg-blue-900/50 text-blue-400',
    acknowledged: 'bg-green-900/50 text-green-400',
  };
  return (
    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase', cfg[status] || 'bg-gray-900/50 text-gray-400')}>
      {status}
    </span>
  );
}

function HandoverCard({ record, onView, onGenerate, isGenerating }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-foreground">{record.submitted_by}</p>
          <p className="text-xs text-muted-foreground capitalize">{record.shift_period} shift · {format(new Date(record.shift_date), 'MMM d, yyyy')}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-secondary/50 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Aircraft</p>
          <p className="font-bold text-foreground">{record.aircraft_worked_on?.length || 0}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Issues</p>
          <p className="font-bold text-orange-400">{record.pending_issues?.length || 0}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg px-2 py-1.5">
          <p className="text-muted-foreground">Critical</p>
          <p className="font-bold text-red-400">{record.pending_issues?.filter(i => i.priority === 'critical').length || 0}</p>
        </div>
      </div>

      {record.safety_critical_notes && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 line-clamp-2">{record.safety_critical_notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => onView(record)}
          className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-bold hover:bg-secondary/80 flex items-center justify-center gap-1">
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        <button onClick={() => onGenerate(record.id)} disabled={isGenerating}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-1">
          <Printer className="w-3.5 h-3.5" /> Report
        </button>
      </div>
    </div>
  );
}

export default function ShiftHandoverPage() {
  const [step, setStep] = useState('list'); // 'list' | 'form' | 'signoff' | 'complete'
  const [pendingData, setPendingData] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [selectedStation, setSelectedStation] = useState('all');
  const qc = useQueryClient();

  const { data: stations = [] } = useQuery({
    queryKey: ['global-stations'],
    queryFn: () => base44.entities.Station.list('icao_code', 100),
    refetchInterval: 300000,
  });

  const { data: handovers = [], isLoading, refetch } = useQuery({
    queryKey: ['shift-handovers'],
    queryFn: () => base44.entities.ShiftHandover.list('-shift_date', 100),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftHandover.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shift-handovers'] });
      setStep('complete');
    },
  });

  const handleFormSubmit = (data) => {
    setPendingData(data);
    setStep('signoff');
  };

  const handleSignOff = (data) => {
    createMutation.mutate({ ...data, status: 'submitted' });
  };

  const handleGenerateReport = async (id) => {
    setGeneratingId(id);
    try {
      const res = await base44.functions.invoke('generateShiftReport', {
        handover_id: id,
        include_metrics: true,
      });

      if (res.data?.html) {
        const win = window.open('', '_blank');
        win.document.write(res.data.html);
        win.document.close();
        win.print();
      }
    } finally {
      setGeneratingId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredHandovers = selectedStation === 'all' 
    ? handovers 
    : handovers.filter(h => h.station === selectedStation);
  const todayHandovers = filteredHandovers.filter(h => h.shift_date === today);
  const criticalCount = filteredHandovers
    .filter(h => h.shift_date === today)
    .flatMap(h => h.pending_issues || [])
    .filter(i => i.priority === 'critical').length;

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('list')}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Shift Handover</h1>
              <p className="text-xs text-primary">Step 1 of 2 — Enter Details</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {['form', 'signoff'].map((s, i) => (
              <div key={s} className={cn('flex-1 h-1.5 rounded-full', step === s ? 'bg-primary' : i === 0 ? 'bg-primary' : 'bg-secondary')} />
            ))}
          </div>
        </div>
        <div className="px-5 pt-6">
          <ShiftHandoverForm onSubmit={handleFormSubmit} />
        </div>
      </div>
    );
  }

  if (step === 'signoff') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('form')}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Shift Sign-Off</h1>
              <p className="text-xs text-primary">Step 2 of 2 — Review & Sign</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {['form', 'signoff'].map((s, i) => (
              <div key={s} className={cn('flex-1 h-1.5 rounded-full', 'bg-primary')} />
            ))}
          </div>
        </div>
        <div className="px-5 pt-6">
          <ShiftSignOff
            handoverData={pendingData}
            onConfirm={handleSignOff}
            isPending={createMutation.isPending}
          />
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Shift Complete</h2>
            <p className="text-muted-foreground mt-2">Your handover has been signed off and recorded.</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => { setStep('list'); setPendingData(null); }}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90">
              View All Handovers
            </button>
            <Link to="/Home"
              className="block w-full py-3 rounded-xl border border-border text-muted-foreground font-bold hover:bg-secondary text-center">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // View record modal
  if (viewingRecord) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewingRecord(null)}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">{viewingRecord.submitted_by}</h1>
              <p className="text-xs text-primary capitalize">{viewingRecord.shift_period} shift · {format(new Date(viewingRecord.shift_date), 'MMM d')}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <StatusBadge status={viewingRecord.status} />
              <button onClick={() => handleGenerateReport(viewingRecord.id)} disabled={!!generatingId}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pt-6 space-y-6 max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-foreground">Progress Summary</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingRecord.progress_summary}</p>
          </div>

          {viewingRecord.pending_issues?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-foreground">Pending Issues</h3>
              {viewingRecord.pending_issues.map((issue, idx) => (
                <div key={idx} className={cn('border rounded-lg px-4 py-3',
                  issue.priority === 'critical' ? 'border-red-500/40 bg-red-900/10' :
                  issue.priority === 'high' ? 'border-orange-500/40 bg-orange-900/10' :
                  'border-border bg-secondary/50'
                )}>
                  <p className="font-bold text-foreground text-sm">{issue.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {issue.aircraft_tail && `${issue.aircraft_tail} · `}
                    <span className={cn('font-bold capitalize',
                      issue.priority === 'critical' ? 'text-red-400' :
                      issue.priority === 'high' ? 'text-orange-400' : 'text-muted-foreground'
                    )}>{issue.priority}</span>
                    {issue.assigned_to && ` → ${issue.assigned_to}`}
                  </p>
                </div>
              ))}
            </div>
          )}

          {viewingRecord.safety_critical_notes && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-2xl p-5">
              <h3 className="font-bold text-red-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Safety Critical Notes
              </h3>
              <p className="text-sm text-red-300 whitespace-pre-wrap">{viewingRecord.safety_critical_notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN LIST VIEW ──
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Shift Turn Over</h1>
              <p className="text-xs text-primary tracking-widest uppercase">Log Off · Sign Off · Daily Report</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()}
              className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80">
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
            </button>
            <button onClick={() => setStep('form')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90">
              <ClipboardCheck className="w-4 h-4" /> New Shift Turnover
            </button>
          </div>
        </div>

        {/* Station filter dropdown */}
        <div className="mt-4 w-64">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-full bg-secondary border-border text-foreground">
              <SelectValue placeholder="Filter by station..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stations</SelectItem>
              {stations.map(station => (
                <SelectItem key={station.icao_code} value={station.icao_code}>
                  {station.icao_code} — {station.station_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Today's summary */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-secondary/50 rounded-xl px-3 py-2">
            <p className="text-2xl font-black text-foreground">{todayHandovers.length}</p>
            <p className="text-xs text-muted-foreground">Handovers Today</p>
          </div>
          <div className="bg-secondary/50 rounded-xl px-3 py-2">
            <p className="text-2xl font-black text-orange-400">{todayHandovers.flatMap(h => h.pending_issues || []).length}</p>
            <p className="text-xs text-muted-foreground">Pending Issues</p>
          </div>
          <div className="bg-secondary/50 rounded-xl px-3 py-2">
            <p className="text-2xl font-black text-red-400">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : handovers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No handovers logged yet</p>
            <button onClick={() => setStep('form')}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">
              Log First Handover
            </button>
          </div>
        ) : (
          filteredHandovers.map(record => (
            <HandoverCard
              key={record.id}
              record={record}
              onView={setViewingRecord}
              onGenerate={handleGenerateReport}
              isGenerating={generatingId === record.id}
            />
          ))
        )}
      </div>
    </div>
  );
}