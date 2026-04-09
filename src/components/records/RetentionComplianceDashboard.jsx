import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle, Clock, Archive, Shield, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addYears, differenceInDays } from 'date-fns';

const FAA_REGULATIONS = {
  flight_records: '14 CFR 121.441',
  crew_duty_logs: '14 CFR 135.63',
  dispatch_releases: '14 CFR 121.359',
  maintenance_logs: '14 CFR 121.380',
  safety_reports: 'NTSB Part 830',
  training_records: '14 CFR 121.436',
  audit_logs: 'FAA Order 7200.1',
  fuel_records: '14 CFR 121.587',
  passenger_manifests: '14 CFR 121.488',
};

function ComplianceBar({ daysOld, retentionDays, label }) {
  const percentage = (daysOld / retentionDays) * 100;
  const isExpired = daysOld > retentionDays;
  const isWarning = daysOld > (retentionDays * 0.8);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500">{label}</p>
        <p className={cn('text-xs font-bold',
          isExpired ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
        )}>
          {daysOld} / {retentionDays} days
        </p>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all',
            isExpired ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function PolicyCard({ policy, recordCount, isExpiring }) {
  const retentionDays = policy.retention_years * 365 + (policy.retention_months || 0) * 30;
  const regulation = FAA_REGULATIONS[policy.record_type] || 'Company Policy';

  return (
    <div className={cn('bg-[#0f1419] border rounded-2xl p-4 space-y-3',
      isExpiring ? 'border-red-500/40' : 'border-white/10'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-white">{policy.record_type.replace(/_/g, ' ').toUpperCase()}</p>
          <p className="text-xs text-gray-600 font-mono">{regulation}</p>
        </div>
        {isExpiring && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-900/50 text-red-400 flex-shrink-0">
            ACTION NEEDED
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-lg p-2.5">
        <div>
          <p className="text-[10px] text-gray-600">Retention</p>
          <p className="text-sm font-black text-white">{policy.retention_years}y</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-600">Records</p>
          <p className="text-sm font-black text-cyan-400">{recordCount}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-600">Status</p>
          <p className="text-sm font-black text-green-400">✓</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-2.5">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Method</p>
        <p className="text-xs text-gray-400">{policy.deletion_method.replace(/_/g, ' ')}</p>
      </div>

      {policy.description && (
        <p className="text-xs text-gray-500 italic">{policy.description}</p>
      )}
    </div>
  );
}

function ExpirationAlert({ record, daysUntilExpiration }) {
  const isCritical = daysUntilExpiration < 0;
  const isUrgent = daysUntilExpiration < 7;

  return (
    <div className={cn('rounded-xl border p-3 flex items-start gap-2',
      isCritical ? 'bg-red-900/20 border-red-500/40' : isUrgent ? 'bg-amber-900/20 border-amber-500/40' : 'bg-blue-900/20 border-blue-500/40'
    )}>
      {isCritical ? (
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      ) : isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      ) : (
        <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn('font-bold text-sm',
          isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-blue-400'
        )}>
          {record.record_type.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isCritical
            ? `EXPIRED ${Math.abs(daysUntilExpiration)} days ago`
            : `${daysUntilExpiration} days until archival`}
        </p>
      </div>
    </div>
  );
}

export default function RetentionComplianceDashboard() {
  const { data: policies = [] } = useQuery({
    queryKey: ['retention-policies'],
    queryFn: () => base44.entities.RetentionPolicy.list('record_type', 100),
    refetchInterval: 600000,
  });

  const { data: flightRecords = [] } = useQuery({
    queryKey: ['retention-flight-records'],
    queryFn: () => base44.entities.Flight.list('-flight_date', 1000),
    refetchInterval: 600000,
  });

  const { data: maintenanceLogs = [] } = useQuery({
    queryKey: ['retention-maintenance-logs'],
    queryFn: () => base44.entities.LogbookEntry.list('-created_date', 1000),
    refetchInterval: 600000,
  });

  // Calculate record counts and expiration dates
  const recordMetrics = useMemo(() => {
    const metrics = {};

    policies.forEach(policy => {
      let recordCount = 0;
      let oldestDate = null;
      const retentionDays = policy.retention_years * 365 + (policy.retention_months || 0) * 30;

      if (policy.record_type === 'flight_records') {
        recordCount = flightRecords.length;
        if (flightRecords.length > 0) {
          oldestDate = new Date(Math.min(...flightRecords.map(r => new Date(r.flight_date))));
        }
      } else if (policy.record_type === 'maintenance_logs') {
        recordCount = maintenanceLogs.length;
        if (maintenanceLogs.length > 0) {
          oldestDate = new Date(Math.min(...maintenanceLogs.map(r => new Date(r.created_date))));
        }
      }

      const daysOld = oldestDate ? differenceInDays(new Date(), oldestDate) : 0;
      const daysUntilExpiration = retentionDays - daysOld;

      metrics[policy.record_type] = {
        count: recordCount,
        oldestDate,
        daysOld,
        daysUntilExpiration,
        isExpiring: daysUntilExpiration < 30,
        isExpired: daysUntilExpiration < 0,
      };
    });

    return metrics;
  }, [policies, flightRecords, maintenanceLogs]);

  // Compliance status summary
  const complianceSummary = useMemo(() => {
    const expiringCount = policies.filter(p => recordMetrics[p.record_type]?.isExpiring).length;
    const compliantCount = policies.filter(p => !recordMetrics[p.record_type]?.isExpiring).length;

    return {
      total: policies.length,
      compliant: compliantCount,
      warning: expiringCount,
      critical: policies.filter(p => recordMetrics[p.record_type]?.isExpired).length,
    };
  }, [policies, recordMetrics]);

  // Upcoming archival schedule
  const upcomingArchival = useMemo(() => {
    return policies
      .map(p => ({
        ...p,
        ...recordMetrics[p.record_type],
      }))
      .filter(p => p.daysUntilExpiration > 0 && p.daysUntilExpiration <= 60)
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
      .slice(0, 5);
  }, [policies, recordMetrics]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔐</span>
          <h2 className="text-2xl font-black text-primary">RECORDS RETENTION & COMPLIANCE</h2>
        </div>
        <p className="text-sm text-gray-400">FAA compliance tracking for aircraft maintenance records</p>
      </div>

      {/* Compliance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f1419] border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Total Policies</p>
          <p className="text-3xl font-black text-white">{complianceSummary.total}</p>
        </div>

        <div className="bg-[#0f1419] border border-green-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Compliant</p>
          <p className="text-3xl font-black text-green-400">{complianceSummary.compliant}</p>
        </div>

        <div className="bg-[#0f1419] border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Warning</p>
          <p className="text-3xl font-black text-yellow-400">{complianceSummary.warning}</p>
        </div>

        <div className="bg-[#0f1419] border border-red-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Critical</p>
          <p className="text-3xl font-black text-red-400">{complianceSummary.critical}</p>
        </div>
      </div>

      {/* Upcoming Archival Schedule */}
      {upcomingArchival.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            Upcoming Archival (Next 60 Days)
          </h3>
          <div className="space-y-2">
            {upcomingArchival.map((item, idx) => (
              <ExpirationAlert
                key={idx}
                record={item}
                daysUntilExpiration={item.daysUntilExpiration}
              />
            ))}
          </div>
        </div>
      )}

      {/* Retention Policies */}
      <div className="space-y-3">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          FAA Retention Policies
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {policies.map(policy => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              recordCount={recordMetrics[policy.record_type]?.count || 0}
              isExpiring={recordMetrics[policy.record_type]?.isExpiring || false}
            />
          ))}
        </div>
      </div>

      {/* Compliance Guidelines */}
      <div className="bg-blue-900/10 border border-blue-500/30 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-blue-300 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          FAA Compliance Framework
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold flex-shrink-0">•</span>
            <span>Maintain flight records per 14 CFR 121.441 (minimum 12 months)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold flex-shrink-0">•</span>
            <span>Preserve maintenance logs per 14 CFR 121.380 (minimum 24 months)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold flex-shrink-0">•</span>
            <span>Archive training records per 14 CFR 121.436 (minimum 24 months)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold flex-shrink-0">•</span>
            <span>Safety reports per NTSB Part 830 (minimum 5 years)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold flex-shrink-0">•</span>
            <span>Implement secure deletion/archival methods upon expiration</span>
          </li>
        </ul>
      </div>
    </div>
  );
}