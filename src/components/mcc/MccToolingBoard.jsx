import { Link } from 'react-router-dom';
import { Wrench, CheckCircle, AlertTriangle, User, Calendar, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG = {
  available:       { label: 'AVAILABLE',   color: 'text-green-400',  bg: 'bg-green-500/20' },
  checked_out:     { label: 'CHECKED OUT', color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  calibration_due: { label: 'CAL DUE',     color: 'text-orange-400', bg: 'bg-orange-500/20' },
  damaged:         { label: 'DAMAGED',     color: 'text-red-400',    bg: 'bg-red-500/20' },
  retired:         { label: 'RETIRED',     color: 'text-gray-400',   bg: 'bg-gray-500/20' },
};

export default function MccToolingBoard({ tools }) {
  const checkedOut = tools.filter(t => t.status === 'checked_out');
  const calDue     = tools.filter(t => t.status === 'calibration_due');
  const damaged    = tools.filter(t => t.status === 'damaged');
  const available  = tools.filter(t => t.status === 'available').length;
  const total      = tools.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-white">Tooling Status</p>
        <Link to="/ToolingManagement" className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300">
          Tooling Management <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tools',  value: total,          color: 'text-white' },
          { label: 'Available',    value: available,      color: 'text-green-400' },
          { label: 'Checked Out',  value: checkedOut.length, color: 'text-blue-400' },
          { label: 'Cal Due',      value: calDue.length,  color: calDue.length > 0 ? 'text-orange-400' : 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#141922] border border-white/10 rounded-2xl p-4 text-center">
            <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Calibration due */}
      {calDue.length > 0 && (
        <div>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Calibration Due ({calDue.length})
          </p>
          <div className="space-y-2">
            {calDue.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-orange-900/20 border border-orange-500/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  <span className="text-xs font-mono text-gray-400">{t.tool_number}</span>
                </div>
                {t.calibration_due && (
                  <span className="text-xs text-orange-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{t.calibration_due}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checked out */}
      {checkedOut.length > 0 && (
        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Checked Out ({checkedOut.length})</p>
          <div className="space-y-2">
            {checkedOut.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-[#141922] border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  <span className="text-xs font-mono text-gray-400">{t.tool_number}</span>
                </div>
                {t.assigned_to && (
                  <span className="text-xs text-blue-300 flex items-center gap-1">
                    <User className="w-3 h-3" />{t.assigned_to}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Damaged */}
      {damaged.length > 0 && (
        <div>
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Damaged ({damaged.length})
          </p>
          <div className="space-y-2">
            {damaged.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  <span className="text-xs font-mono text-gray-400">{t.tool_number}</span>
                </div>
                <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-2 py-1 rounded-lg">DAMAGED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tools.length === 0 && (
        <p className="text-center text-gray-600 text-sm py-12">No tools in inventory</p>
      )}
    </div>
  );
}