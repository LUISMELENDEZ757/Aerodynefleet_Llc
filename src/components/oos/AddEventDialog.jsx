import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const EVENT_TYPES = [
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'repair', label: 'Repair' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'parts_order', label: 'Parts Order' },
  { value: 'moc_contact', label: 'MOC Contact' },
  { value: 'log_page', label: 'Log Page' },
  { value: 'release', label: 'Release' },
  { value: 'other', label: 'Other' },
];

export default function AddEventDialog({ open, onOpenChange, onSave }) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    event_time: timeStr,
    end_time: '',
    event_type: 'other',
    title: '',
    description: '',
    reference_number: '',
    is_aog: false,
    technician: '',
  });

  const handleSave = () => {
    if (!form.title) return;
    const duration = form.end_time && form.event_time
      ? calculateDuration(form.event_time, form.end_time)
      : '';
    onSave({ ...form, duration });
    setForm({ event_time: timeStr, end_time: '', event_type: 'other', title: '', description: '', reference_number: '', is_aog: false, technician: '' });
    onOpenChange(false);
  };

  const calculateDuration = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Start Time</Label>
              <Input
                type="time"
                value={form.event_time}
                onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Time</Label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="bg-secondary border-border font-mono"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Event Type</Label>
            <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Troubleshooting BL9.560"
              className="bg-secondary border-border"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details..."
              className="bg-secondary border-border h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Reference #</Label>
              <Input
                value={form.reference_number}
                onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Technician</Label>
              <Input
                value={form.technician}
                onChange={(e) => setForm({ ...form, technician: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.is_aog}
              onCheckedChange={(v) => setForm({ ...form, is_aog: v })}
            />
            <Label className="text-sm text-foreground">AOG Item</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">Add Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}