import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Settings, Users, Shield, FileText, BarChart3, AlertCircle,
  ChevronRight, Plus, Server, Bell, LogOut, ChevronLeft, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UserApprovalPanel from '@/components/settings/UserApprovalPanel';

// ─── Admin Dashboard Stats ──────────────────────────────────────────────────────
function AdminStats({ users, fleets, auditLogs }) {
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Users</p>
        <p className="text-3xl font-black text-foreground mt-1">{totalUsers}</p>
        <p className="text-xs text-muted-foreground mt-1">{adminCount} admins</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fleets</p>
        <p className="text-3xl font-black text-foreground mt-1">{fleets.length}</p>
        <p className="text-xs text-muted-foreground mt-1\">Active operators</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Audits</p>
        <p className="text-3xl font-black text-foreground mt-1\">{auditLogs.length}</p>
        <p className="text-xs text-muted-foreground mt-1">Log entries</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-sm font-bold text-green-400">Operational</p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Card Component ────────────────────────────────────────────────────────
function AdminCard({ icon: Icon, title, description, children, action, actionLabel }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {action && (
          <Link to={action} className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80">
            {actionLabel || 'Manage'} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}

// ─── Main Administration Dashboard ──────────────────────────────────────────────
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showLogout, setShowLogout] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('email', 200),
  });

  const { data: fleets = [] } = useQuery({
    queryKey: ['admin-fleets'],
    queryFn: () => base44.entities.Fleet.list('name', 100),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      try {
        return await base44.entities.AuditLog.list('-created_date', 50);
      } catch {
        return [];
      }
    },
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground">Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">System settings, user management, and operations oversight</p>
        </div>
        <button
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-bold text-foreground"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Quick Stats */}
      <AdminStats users={users} fleets={fleets} auditLogs={auditLogs} />

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <AdminCard
          icon={Users}
          title="User Management"
          description="Invite, approve, and manage user accounts"
          action="/UserManagement"
          actionLabel="Manage Users"
        >
          <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            {users.length} total users · {users.filter(u => u.role === 'admin').length} admins
          </div>
        </AdminCard>

        {/* Fleet Registry */}
        <AdminCard
          icon={Shield}
          title="Fleet Registry"
          description="Manage airlines, aircraft types, and operators"
          action="/FleetRegistry"
          actionLabel="View Registry"
        >
          <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            {fleets.length} active fleets configured
          </div>
        </AdminCard>

        {/* System Settings */}
        <AdminCard
          icon={Server}
          title="System Configuration"
          description="API keys, integrations, and data retention"
          action="/RecordRetentionPolicy"
          actionLabel="Configure"
        >
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• FlightAware Integration: Connected</p>
            <p>• Data Retention: FAA 14 CFR §121</p>
          </div>
        </AdminCard>

        {/* Audit Logs */}
        <AdminCard
          icon={FileText}
          title="Audit Logs"
          description="System activity and compliance tracking"
          action="/AuditLog"
          actionLabel="View Logs"
        >
          <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            {auditLogs.length} recent entries logged
          </div>
        </AdminCard>
      </div>

      {/* Pending User Approvals */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Pending Approvals</p>
        <UserApprovalPanel />
      </div>

      {/* Logout Confirmation Modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm space-y-4">
            <p className="text-base font-bold text-foreground">Sign out?</p>
            <p className="text-sm text-muted-foreground">You'll be logged out of the administration dashboard.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}