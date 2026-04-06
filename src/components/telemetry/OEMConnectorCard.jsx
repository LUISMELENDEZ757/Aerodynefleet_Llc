import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Clock, Settings, ExternalLink, Wifi, WifiOff } from 'lucide-react';

const STATUS_CFG = {
  active:              { label: 'CONNECTED',        color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  icon: CheckCircle },
  pending_credentials: { label: 'NEEDS CREDENTIALS',color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  icon: Settings },
  pending_contract:    { label: 'PENDING CONTRACT', color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   icon: Clock },
  inactive:            { label: 'INACTIVE',         color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   icon: WifiOff },
  error:               { label: 'ERROR',            color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/30',    icon: AlertTriangle },
};

const CATEGORY_COLOR = {
  airframe:  '#3b82f6',
  engine:    '#ef4444',
  avionics:  '#f59e0b',
  apu:       '#a855f7',
  systems:   '#10b981',
};

export default function OEMConnectorCard({ connector, stubInfo, onConfigure }) {
  const status = connector?.status || 'pending_contract';
  const stCfg  = STATUS_CFG[status] || STATUS_CFG.pending_contract;
  const StatusIcon = stCfg.icon;
  const catColor = CATEGORY_COLOR[connector?.category || 'systems'] || '#6b7280';
  const isConfigured = stubInfo?.isConfigured || false;
  const missingSecrets = stubInfo?.missingSecrets || [];

  return (
    <div className={cn('rounded-2xl border bg-[#141922] p-5 flex flex-col gap-4 transition-all hover:border-white/20', stCfg.border)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${catColor}20`, border: `1px solid ${catColor}30` }}>
            {isConfigured
              ? <Wifi className="w-5 h-5" style={{ color: catColor }} />
              : <WifiOff className="w-5 h-5 text-gray-500" />}
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">{connector.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: catColor }}>
              {connector.category}
            </p>
          </div>
        </div>
        <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0', stCfg.bg, stCfg.color)}>
          {stCfg.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed">{connector.description}</p>

      {/* Aircraft types */}
      {connector.applicable_aircraft_types?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {connector.applicable_aircraft_types.map(t => (
            <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-gray-400">{t}</span>
          ))}
        </div>
      )}

      {/* Data types */}
      {connector.data_types?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Available Data Streams</p>
          <div className="flex flex-wrap gap-1">
            {connector.data_types.map(d => (
              <span key={d} className="text-[10px] px-2 py-0.5 rounded-lg border border-white/10 text-gray-400">{d.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Missing secrets warning */}
      {missingSecrets.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl px-3 py-2.5">
          <p className="text-[10px] font-bold text-amber-400 mb-1">Required Secrets Not Set</p>
          <div className="flex flex-wrap gap-1">
            {missingSecrets.map(s => (
              <code key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300">{s}</code>
            ))}
          </div>
          <p className="text-[10px] text-amber-300/70 mt-1">Add in Dashboard → Settings → Secrets</p>
        </div>
      )}

      {/* Contract reference */}
      {connector.contract_reference && (
        <p className="text-[10px] text-gray-600">Contract: <span className="text-gray-400">{connector.contract_reference}</span></p>
      )}

      {/* Last sync */}
      {connector.last_sync && (
        <p className="text-[10px] text-gray-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-400" />
          Last sync: {new Date(connector.last_sync).toLocaleString()}
        </p>
      )}

      {/* Actions */}
      <button onClick={() => onConfigure(connector)}
        className="w-full py-2 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 hover:border-white/20 transition-colors flex items-center justify-center gap-2">
        <Settings className="w-3.5 h-3.5" /> Configure
      </button>
    </div>
  );
}