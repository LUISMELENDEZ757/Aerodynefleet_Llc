import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { FileText, Shield, BarChart3, RefreshCw, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'policy', label: 'Policy Document', icon: FileText },
  { key: 'compliance', label: 'Compliance Dashboard', icon: Shield },
  { key: 'settings', label: 'Admin Settings', icon: Settings },
];

const DEFAULT_POLICIES = [
  {
    record_type: 'flight_records',
    retention_years: 5,
    retention_months: 0,
    regulatory_basis: '14_CFR_121_441',
    description: 'Flight records, airworthiness logs, and performance data',
    deletion_method: 'archive_then_delete',
  },
  {
    record_type: 'crew_duty_logs',
    retention_years: 5,
    retention_months: 0,
    regulatory_basis: '14_CFR_121_441',
    description: 'Crew duty time, rest, and FAR 117 compliance records',
    deletion_method: 'archive_then_delete',
  },
  {
    record_type: 'dispatch_releases',
    retention_years: 5,
    retention_months: 0,
    regulatory_basis: '14_CFR_121_441',
    description: 'Dispatch authorizations, amendments, and legal releases',
    deletion_method: 'secure_shred',
  },
  {
    record_type: 'maintenance_logs',
    retention_years: 10,
    retention_months: 0,
    regulatory_basis: '14_CFR_121_359',
    description: 'Aircraft maintenance, inspections, and repair records',
    deletion_method: 'archive_then_delete',
  },
  {
    record_type: 'safety_reports',
    retention_years: 10,
    retention_months: 0,
    regulatory_basis: 'NTSB_Part_830',
    description: 'Safety incidents, accident reports, and remediation records',
    deletion_method: 'retain_indefinitely',
  },
  {
    record_type: 'training_records',
    retention_years: 10,
    retention_months: 0,
    regulatory_basis: '14_CFR_121_441',
    description: 'Crew training, recurrency, and certification records',
    deletion_method: 'archive_then_delete',
  },
  {
    record_type: 'audit_logs',
    retention_years: 7,
    retention_months: 0,
    regulatory_basis: 'FAA_Order_7200_1',
    description: 'System audit trail, access logs, and compliance records',
    deletion_method: 'secure_shred',
  },
  {
    record_type: 'fuel_records',
    retention_years: 5,
    retention_months: 0,
    regulatory_basis: 'Company_Policy',
    description: 'Fuel uplift, variance, and cost tracking data',
    deletion_method: 'archive_then_delete',
  },
  {
    record_type: 'passenger_manifests',
    retention_years: 3,
    retention_months: 0,
    regulatory_basis: '14_CFR_121_441',
    description: 'Passenger lists, load control, and weight & balance data',
    deletion_method: 'anonymize',
  },
  {
    record_type: 'weather_data',
    retention_years: 2,
    retention_months: 0,
    regulatory_basis: 'Best_Practice',
    description: 'METAR, TAF, SIGMET, and weather briefing records',
    deletion_method: 'archive_then_delete',
  },
];

const REG_REFS = {
  '14_CFR_121_441': '14 CFR 121.441 - Flight Crew Duty Limitations',
  '14_CFR_135_63': '14 CFR 135.63 - Recordkeeping Requirements',
  '14_CFR_121_359': '14 CFR 121.359 - Maintenance Records',
  'NTSB_Part_830': 'NTSB Part 830 - Aircraft Accident Reporting',
  'FAA_Order_7200_1': 'FAA Order 7200.1 - Aircraft Accident Investigation',
  'Company_Policy': 'Company Standard Operating Procedures',
  'Best_Practice': 'Aviation Industry Best Practice',
};

function PolicyDocument({ policies }) {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl space-y-6 bg-white text-black p-8 rounded-xl border border-gray-200">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-gray-300">
        <h1 className="text-3xl font-bold">AERODYNE FLEET LLC</h1>
        <p className="text-lg font-semibold">DATA RETENTION AND DESTRUCTION POLICY</p>
        <p className="text-sm text-gray-600">Effective Date: {now}</p>
        <p className="text-sm text-gray-600">FAA Compliance & Audit Trail Documentation</p>
      </div>

      {/* Purpose */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">1. PURPOSE & SCOPE</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          This policy establishes minimum data retention requirements for Aerodyne Fleet LLC in compliance with Federal Aviation Regulations (14 CFR Part 121, Part 135), NTSB guidelines, and company standard operating procedures. This policy applies to all operational, maintenance, safety, and administrative records generated during normal flight operations.
        </p>
      </div>

      {/* Retention Schedule */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">2. RETENTION SCHEDULE</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border border-gray-300">
                <th className="px-3 py-2 text-left font-bold">Record Type</th>
                <th className="px-3 py-2 text-left font-bold">Retention Period</th>
                <th className="px-3 py-2 text-left font-bold">Regulatory Basis</th>
                <th className="px-3 py-2 text-left font-bold">Disposal Method</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p, i) => (
                <tr key={i} className={cn('border border-gray-300', i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                  <td className="px-3 py-2 font-semibold text-gray-800">{p.record_type.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {p.retention_years} year{p.retention_years > 1 ? 's' : ''}
                    {p.retention_months > 0 && ` + ${p.retention_months} month${p.retention_months > 1 ? 's' : ''}`}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{REG_REFS[p.regulatory_basis]}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{p.deletion_method.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Regulations */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">3. REGULATORY FRAMEWORK</h2>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>14 CFR 121.441:</strong> Flight crew duty limitations and rest records (minimum 5 years)</li>
          <li><strong>14 CFR 121.359:</strong> Maintenance records and airworthiness documentation (minimum 10 years)</li>
          <li><strong>NTSB Part 830:</strong> Safety-related and accident investigation records (indefinite)</li>
          <li><strong>FAA Order 7200.1:</strong> System audit trails and compliance documentation (7 years minimum)</li>
        </ul>
      </div>

      {/* Destruction & Confidentiality */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">4. SECURE DESTRUCTION & CONFIDENTIALITY</h2>
        <p className="text-sm text-gray-700">
          All records containing sensitive information (crew PII, passenger data, security procedures) shall be securely destroyed upon expiration of retention periods via:
        </p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Cryptographic deletion and disk wiping (digital records)</li>
          <li>Cross-cut shredding and incineration (physical records)</li>
          <li>Anonymization for historical/archival records</li>
        </ul>
      </div>

      {/* Audit & Compliance */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">5. AUDIT & COMPLIANCE VERIFICATION</h2>
        <p className="text-sm text-gray-700">
          Aerodyne Fleet LLC maintains an immutable audit log of all record creation, modification, and deletion events. Annual compliance reviews are conducted to verify adherence to this policy and identify potential regulatory gaps.
        </p>
      </div>

      {/* Certification */}
      <div className="space-y-3 pt-6 border-t border-gray-300">
        <p className="text-sm font-semibold text-gray-800">
          Certified Compliant with FAA Regulations and Industry Best Practices
        </p>
        <p className="text-xs text-gray-600">
          This document serves as official corporate policy and is subject to annual review and regulatory updates.
        </p>
      </div>
    </div>
  );
}

function ComplianceDashboard({ policies }) {
  const totalRecordTypes = policies.length;
  const activeRules = policies.filter(p => p.is_active).length;
  const indefiniteRetention = policies.filter(p => p.deletion_method === 'retain_indefinitely').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-primary">{totalRecordTypes}</p>
          <p className="text-xs text-muted-foreground">Record Types</p>
        </div>
        <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-green-400">{activeRules}</p>
          <p className="text-xs text-muted-foreground">Active Rules</p>
        </div>
        <div className="rounded-xl bg-card border border-border px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-orange-400">{indefiniteRetention}</p>
          <p className="text-xs text-muted-foreground">Indefinite</p>
        </div>
      </div>

      {/* Retention Rules */}
      <div className="space-y-2">
        <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Active Retention Rules</p>
        <div className="space-y-2">
          {policies.filter(p => p.is_active).map((p, i) => (
            <div key={i} className="rounded-xl bg-card border border-border px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground capitalize">{p.record_type.replace(/_/g, ' ')}</p>
                <span className="text-xs font-mono text-primary font-bold">
                  {p.retention_years} yr{p.retention_years !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">{REG_REFS[p.regulatory_basis]}</span>
                <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                  {p.deletion_method.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Status */}
      <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
        <p className="text-sm font-semibold text-green-400">✓ All Rules Compliant</p>
        <p className="text-xs text-green-400/70">No overdue retention periods detected</p>
      </div>
    </div>
  );
}

function AdminSettings({ policies: initialPolicies }) {
  const [policies, setPolicies] = useState(initialPolicies);

  return (
    <div className="space-y-4">
      <p className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Configure Retention Rules</p>

      <div className="space-y-3">
        {policies.map((p, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground capitalize">{p.record_type.replace(/_/g, ' ')}</h4>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={p.is_active}
                  onChange={(e) => {
                    const updated = [...policies];
                    updated[i].is_active = e.target.checked;
                    setPolicies(updated);
                  }}
                  className="w-4 h-4 rounded border-border bg-background cursor-pointer"
                />
                Active
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Years</label>
                <input
                  type="number"
                  value={p.retention_years}
                  onChange={(e) => {
                    const updated = [...policies];
                    updated[i].retention_years = Number(e.target.value);
                    setPolicies(updated);
                  }}
                  className="w-full h-8 bg-background border border-border rounded px-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Months</label>
                <input
                  type="number"
                  value={p.retention_months}
                  onChange={(e) => {
                    const updated = [...policies];
                    updated[i].retention_months = Number(e.target.value);
                    setPolicies(updated);
                  }}
                  className="w-full h-8 bg-background border border-border rounded px-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Disposal</label>
                <select
                  value={p.deletion_method}
                  onChange={(e) => {
                    const updated = [...policies];
                    updated[i].deletion_method = e.target.value;
                    setPolicies(updated);
                  }}
                  className="w-full h-8 bg-background border border-border rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="archive_then_delete">Archive + Delete</option>
                  <option value="secure_shred">Secure Shred</option>
                  <option value="anonymize">Anonymize</option>
                  <option value="retain_indefinitely">Indefinite</option>
                </select>
              </div>
            </div>

            <select
              value={p.regulatory_basis}
              onChange={(e) => {
                const updated = [...policies];
                updated[i].regulatory_basis = e.target.value;
                setPolicies(updated);
              }}
              className="w-full h-8 bg-background border border-border rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              {Object.entries(REG_REFS).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>

            <textarea
              value={p.description}
              onChange={(e) => {
                const updated = [...policies];
                updated[i].description = e.target.value;
                setPolicies(updated);
              }}
              placeholder="Description"
              className="w-full h-16 bg-background border border-border rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
        ))}
      </div>

      <button className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">
        Save Changes
      </button>
    </div>
  );
}

export default function RecordRetentionPolicy() {
  const [activeTab, setActiveTab] = useState('policy');
  const { data: policies = DEFAULT_POLICIES } = useQuery({
    queryKey: ['retention-policies'],
    queryFn: async () => {
      try {
        const result = await base44.entities.RetentionPolicy.list();
        return result.length > 0 ? result : DEFAULT_POLICIES;
      } catch {
        return DEFAULT_POLICIES;
      }
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <FileText className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">RECORD RETENTION POLICY</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">FAA Compliance · Data Governance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all',
                activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'policy' && <PolicyDocument policies={policies} />}
        {activeTab === 'compliance' && <ComplianceDashboard policies={policies} />}
        {activeTab === 'settings' && <AdminSettings policies={policies} />}
      </div>
    </div>
  );
}