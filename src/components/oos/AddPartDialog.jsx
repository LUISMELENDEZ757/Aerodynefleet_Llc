import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ActionSheet from '@/components/ui/ActionSheet';

const PART_STATUSES = [
  { value: 'ordered', label: 'Ordered' },
  { value: 'aog_ordered', label: 'AOG Ordered' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'received', label: 'Received' },
  { value: 'installed', label: 'Installed' },
];

export default function AddPartDialog({ open, onOpenChange, onSave }) {
  const [form, setForm] = useState({
    part_number: '',
    part_name: '',
    quantity: 1,
    status: 'ordered',
    eta: '',
    source: '',
    notes: '',
  });

  const handleSave = () => {
    if (!form.part_name) return;
    onSave(form);
    setForm({ part_number: '', part_name: '', quantity: 1, status: 'ordered', eta: '', source: '', notes: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Part</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Part Name</Label>
            <Input
              value={form.part_name}
              onChange={(e) => setForm({ ...form, part_name: e.target.value })}
              placeholder="e.g. Fuel Control Unit"
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Part Number</Label>
              <Input
                value={form.part_number}
                onChange={(e) => setForm({ ...form, part_number: e.target.value })}
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <ActionSheet
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              placeholder="Select status"
              options={PART_STATUSES}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">ETA</Label>
              <Input
                value={form.eta}
                onChange={(e) => setForm({ ...form, eta: e.target.value })}
                placeholder="e.g. 2200"
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Source</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g. MOC"
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground h-11">Add Part</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}