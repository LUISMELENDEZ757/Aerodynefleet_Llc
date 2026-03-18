import React from 'react';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'All Open' },
  { key: 'waiting_on_parts', label: 'Waiting on Parts' },
  { key: 'in_work', label: 'In Work' },
  { key: 'released', label: 'Released Today' },
];

export default function StatusFilterBar({ activeFilter, onFilterChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-4 py-3 no-scrollbar">
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
            activeFilter === filter.key
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}