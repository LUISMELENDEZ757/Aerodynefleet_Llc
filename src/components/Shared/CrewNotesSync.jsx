import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Save, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CrewNotesSync
 * Inline notes editor that persists to a CrewAssignment or Flight entity field.
 *
 * Props:
 *   entityName  - 'CrewAssignment' | 'Flight' | any base44 entity
 *   recordId    - entity record id
 *   initialNote - current notes value
 *   field       - field name to update (default: 'notes')
 *   placeholder
 *   className
 */
export default function CrewNotesSync({
  entityName = 'CrewAssignment',
  recordId,
  initialNote = '',
  field = 'notes',
  placeholder = 'Add notes…',
  className = '',
}) {
  const [value, setValue]   = useState(initialNote);
  const [saved,  setSaved]  = useState(false);
  const queryClient         = useQueryClient();

  const mutation = useMutation({
    mutationFn: (text) =>
      base44.entities[entityName].update(recordId, { [field]: text }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries();
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = useCallback(() => {
    if (!recordId) return;
    mutation.mutate(value);
  }, [recordId, value, mutation]);

  return (
    <div className={cn('rounded-xl bg-card border border-border overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">Notes</p>
        <button
          onClick={handleSave}
          disabled={mutation.isPending || !recordId}
          aria-label="Save notes"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-40 transition-colors"
        >
          {mutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <><Check className="w-3.5 h-3.5 text-green-400" /> Saved</>
          ) : (
            <><Save className="w-3.5 h-3.5" /> Save</>
          )}
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
      />
    </div>
  );
}