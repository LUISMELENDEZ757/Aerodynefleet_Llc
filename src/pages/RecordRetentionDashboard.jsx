import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import RetentionComplianceDashboard from '@/components/records/RetentionComplianceDashboard';

export default function RecordRetentionDashboard() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-5 py-4 sticky top-0 z-20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-9 h-9 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">Records Retention Dashboard</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">FAA Compliance · 14 CFR Standards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-6 max-w-7xl mx-auto">
        <RetentionComplianceDashboard />
      </div>
    </div>
  );
}