import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import BackHeader from '@/components/layout/BackHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewOOS() {
  const navigate = useNavigate();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    tail_number: '',
    aircraft_type: 'CRJ-550',
    flight_number: '',
    station: '',
    work_description: '',
    oos_date: dateStr,
    oos_time: timeStr,
    logpage_number: '',
    status: 'in_work',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OOSEntry.create(data),
    onSuccess: (result) => {
      navigate(`/OOSDetail?id=${result.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tail_number || !form.work_description) return;
    createMutation.mutate(form);
  };

  return (
    <div>
      <div className="bg-card border-b border-border p-4 flex items-center gap-3">
        <Link to="/Dashboard" className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <h1 className="text-base font-bold text-foreground">New OOS Entry</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Tail Number *</Label>
            <Input
              value={form.tail_number}
              onChange={(e) => setForm({ ...form, tail_number: e.target.value.toUpperCase() })}
              placeholder="N455GJ"
              className="bg-secondary border-border font-mono text-base font-bold"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Aircraft Type</Label>
            <Select value={form.aircraft_type} onValueChange={(v) => setForm({ ...form, aircraft_type: v })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CRJ-550">CRJ-550</SelectItem>
                <SelectItem value="CRJ-700">CRJ-700</SelectItem>
                <SelectItem value="CRJ-900">CRJ-900</SelectItem>
                <SelectItem value="ERJ-145">ERJ-145</SelectItem>
                <SelectItem value="ERJ-175">ERJ-175</SelectItem>
                <SelectItem value="E175">E175</SelectItem>
                <SelectItem value="B737">B737</SelectItem>
                <SelectItem value="A320">A320</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Flight Number</Label>
            <Input
              value={form.flight_number}
              onChange={(e) => setForm({ ...form, flight_number: e.target.value })}
              placeholder="FLT 4474"
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Station</Label>
            <Input
              value={form.station}
              onChange={(e) => setForm({ ...form, station: e.target.value.toUpperCase() })}
              placeholder="KEWR"
              className="bg-secondary border-border font-mono"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Work Description *</Label>
          <Textarea
            value={form.work_description}
            onChange={(e) => setForm({ ...form, work_description: e.target.value })}
            placeholder="#2 ENGINE HYD-OVHT"
            className="bg-secondary border-border h-20 text-base font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">OOS Date</Label>
            <Input
              type="date"
              value={form.oos_date}
              onChange={(e) => setForm({ ...form, oos_date: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">OOS Time</Label>
            <Input
              type="time"
              value={form.oos_time}
              onChange={(e) => setForm({ ...form, oos_time: e.target.value })}
              className="bg-secondary border-border font-mono"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Log Page Number</Label>
          <Input
            value={form.logpage_number}
            onChange={(e) => setForm({ ...form, logpage_number: e.target.value })}
            placeholder="LP 123456"
            className="bg-secondary border-border font-mono"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_work">In Work</SelectItem>
              <SelectItem value="waiting_on_parts">Waiting on Parts</SelectItem>
              <SelectItem value="deferred">Deferred</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
            className="bg-secondary border-border h-20"
          />
        </div>

        <Button
          type="submit"
          disabled={createMutation.isPending || !form.tail_number || !form.work_description}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 text-base"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Create OOS Entry
        </Button>
      </form>
    </div>
  );
}