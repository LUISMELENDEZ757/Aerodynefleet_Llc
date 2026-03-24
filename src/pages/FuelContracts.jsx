import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Fuel, RefreshCw, Plus, TrendingDown, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

const STATUS_CFG = {
  active:        { label: 'Active',         color: 'text-green-400',   bg: 'bg-green-500/15' },
  expiring_soon: { label: 'Expiring Soon',  color: 'text-orange-400',  bg: 'bg-orange-500/15' },
  expired:       { label: 'Expired',        color: 'text-destructive', bg: 'bg-destructive/15' },
  suspended:     { label: 'Suspended',      color: 'text-muted-foreground', bg: 'bg-muted' },
};

function computeStatus(c) {
  if (!c.expiry_date) return c.status || 'active';
  const days = differenceInDays(parseISO(c.expiry_date), new Date());
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return c.status || 'active';
}

function NewContractModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    supplier: '', station: '', contract_number: '', effective_date: '', expiry_date: '',
    contracted_price_per_gallon: '', current_market_price: '', discount_percent: '',
    min_uplift_gallons: '', annual_volume_gallons: '', notes: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const parsed = {};
    ['contracted_price_per_gallon','current_market_price','discount_percent','min_uplift_gallons','annual_volume_gallons'].forEach(k => {
      parsed[k] = parseFloat(form[k]) || 0;
    });
    onSave({ ...form, ...parsed, status: 'active', ytd_volume_gallons: 0, ytd_spend_usd: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 space-y-3 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}>
        <p className="text-sm font-bold text-foreground">New Fuel Contract</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'supplier', label: 'Supplier' },
            { key: 'station', label: 'Station (ICAO)' },
            { key: 'contract_number', label: 'Contract #' },
            { key: 'effective_date', label: 'Effective', type: 'date' },
            { key: 'expiry_date', label: 'Expires', type: 'date' },
            { key: 'contracted_price_per_gallon', label: 'Contract $/gal', type: 'number' },
            { key: 'current_market_price', label: 'Market $/gal', type: 'number' },
            { key: 'discount_percent', label: 'Discount %', type: 'number' },
            { key: 'min_uplift_gallons', label: 'Min Uplift (gal)', type: 'number' },
            { key: 'annual_volume_gallons', label: 'Annual Volume (gal)', type: 'number' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input type={type || 'text'} value={form[key] || ''} onChange={e => set(key, e.target.value)}
                className="w-full h-9 bg-secondary border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1 resize-none" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={!form.supplier || !form.station}
            className="flex-1 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40">
            Add Contract
          </button>
          <button onClick={onClose} className="flex-1 h-10 border border-border text-sm font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractCard({ contract }) {
  const [expanded, setExpanded] = useState(false);
  const status = computeStatus(contract);
  const cfg = STATUS_CFG[status] || STATUS_CFG.active;
  const savings = contract.current_market_price && contract.contracted_price_per_gallon
    ? (contract.current_market_price - contract.contracted_price_per_gallon).toFixed(3)
    : null;

  return (
    <div className={cn('rounded-xl bg-card border overflow-hidden', status === 'expired' ? 'border-destructive/40' : status === 'expiring_soon' ? 'border-orange-500/40' : 'border-border')}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start justify-between px-4 py-3 hover:bg-secondary/40 transition-colors text-left">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
            <span className="text-xs font-mono text-muted-foreground">{contract.station}</span>
          </div>
          <p className="text-sm font-bold text-foreground">{contract.supplier}</p>
          <p className="text-xs text-muted-foreground">{contract.contract_number || 'No contract #'}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold font-mono text-primary">${contract.contracted_price_per_gallon?.toFixed(3) || '—'}/gal</p>
          {savings && <p className={cn('text-xs font-semibold', parseFloat(savings) > 0 ? 'text-green-400' : 'text-muted-foreground')}>
            {parseFloat(savings) > 0 ? `Save $${savings}/gal` : 'At market'}
          </p>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-3 bg-secondary/10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Market Price', value: contract.current_market_price ? `$${contract.current_market_price.toFixed(3)}` : '—' },
              { label: 'Discount', value: contract.discount_percent ? `${contract.discount_percent}%` : '—' },
              { label: 'Effective', value: contract.effective_date || '—' },
              { label: 'Expires', value: contract.expiry_date || '—' },
              { label: 'Min Uplift', value: contract.min_uplift_gallons ? `${contract.min_uplift_gallons.toLocaleString()} gal` : '—' },
              { label: 'Annual Vol', value: contract.annual_volume_gallons ? `${(contract.annual_volume_gallons/1000).toFixed(0)}K gal` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-background/40 rounded-lg px-3 py-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-mono font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">YTD Volume</p>
              <p className="text-sm font-mono font-bold text-foreground">{(contract.ytd_volume_gallons || 0).toLocaleString()} gal</p>
              {contract.annual_volume_gallons > 0 && (
                <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((contract.ytd_volume_gallons || 0) / contract.annual_volume_gallons) * 100)}%` }} />
                </div>
              )}
            </div>
            <div className="bg-background/40 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">YTD Spend</p>
              <p className="text-sm font-mono font-bold text-foreground">${(contract.ytd_spend_usd || 0).toLocaleString()}</p>
            </div>
          </div>

          {contract.invoices?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invoices</p>
              <div className="space-y-1">
                {contract.invoices.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between bg-background/40 rounded-lg px-3 py-2 text-xs">
                    <span className="font-mono text-foreground">{inv.invoice_number} · {inv.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{inv.gallons?.toLocaleString()} gal</span>
                      <span className="font-bold">${inv.amount_usd?.toLocaleString()}</span>
                      <span className={cn('px-1.5 py-0.5 rounded-full font-semibold',
                        inv.status === 'paid' ? 'bg-green-500/15 text-green-400' :
                        inv.status === 'disputed' ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground')}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FuelContracts() {
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: contracts = [], refetch } = useQuery({
    queryKey: ['fuel-contracts'],
    queryFn: () => base44.entities.FuelContract.list('-effective_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FuelContract.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fuel-contracts'] }); setShowNew(false); },
  });

  const enriched = contracts.map(c => ({ ...c, computedStatus: computeStatus(c) }));
  const totalSavings = enriched.reduce((s, c) => {
    if (!c.current_market_price || !c.contracted_price_per_gallon) return s;
    return s + ((c.current_market_price - c.contracted_price_per_gallon) * (c.ytd_volume_gallons || 0));
  }, 0);
  const totalSpend = enriched.reduce((s, c) => s + (c.ytd_spend_usd || 0), 0);
  const expiring = enriched.filter(c => c.computedStatus === 'expiring_soon' || c.computedStatus === 'expired').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/Home" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 hover:bg-primary/30 transition-colors">
              <Fuel className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground tracking-wide">FUEL CONTRACTS</h1>
              <p className="text-xs font-mono text-primary tracking-widest uppercase">Pricing · Suppliers · Invoices · YTD</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={refetch} className="text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Contracts', value: contracts.length, color: 'text-primary' },
            { label: 'YTD Spend', value: `$${(totalSpend/1000).toFixed(0)}K`, color: 'text-foreground' },
            { label: 'YTD Savings', value: `$${(totalSavings/1000).toFixed(0)}K`, color: totalSavings > 0 ? 'text-green-400' : 'text-muted-foreground' },
            { label: 'Expiring', value: expiring, color: expiring > 0 ? 'text-orange-400' : 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-card border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={cn('text-2xl font-extrabold font-mono', color)}>{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {contracts.length === 0 ? (
            <div className="rounded-xl bg-card border border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No fuel contracts. Click "Add" to create your first contract.
            </div>
          ) : (
            enriched.map(c => <ContractCard key={c.id} contract={c} />)
          )}
        </div>
      </div>

      {showNew && <NewContractModal onSave={(d) => createMutation.mutate(d)} onClose={() => setShowNew(false)} />}
    </div>
  );
}