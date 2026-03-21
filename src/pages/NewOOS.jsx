import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import BackHeader from '@/components/layout/BackHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ActionSheet from '@/components/ui/ActionSheet';
import BackHeader from '@/components/layout/BackHeader';

export default function NewOOS() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['oos-entries'] });
      const previous = queryClient.getQueryData(['oos-entries']);
      queryClient.setQueryData(['oos-entries'], (old = []) => [
        ...old,
        { ...data, id: `temp-${Date.now()}`, created_date: new Date().toISOString() },
      ]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(['oos-entries'], ctx.previous);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['oos-entries'] });
      navigate(`/OOSDetail?id=${result.id}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['oos-entries'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tail_number || !form.work_description) return;
    createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackHeader title="New OOS Entry" subtitle="Create maintenance entry" />

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
            <ActionSheet
              value={form.aircraft_type}
              onChange={(v) => setForm({ ...form, aircraft_type: v })}
              placeholder="Select aircraft"
              options={[
                { value: 'CRJ-550', label: 'CRJ-550' },
                { value: 'CRJ-700', label: 'CRJ-700' },
                { value: 'CRJ-900', label: 'CRJ-900' },
                { value: 'ERJ-145', label: 'ERJ-145' },
                { value: 'ERJ-175', label: 'ERJ-175' },
                { value: 'E175', label: 'E175' },
                { value: 'B737', label: 'B737' },
                { value: 'A320', label: 'A320' },
                { value: 'Other', label: 'Other' },
              ]}
            />
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
          <ActionSheet
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            placeholder="Select status"
            options={[
              { value: 'in_work', label: 'In Work' },
              { value: 'waiting_on_parts', label: 'Waiting on Parts' },
              { value: 'deferred', label: 'Deferred' },
            ]}
          />
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