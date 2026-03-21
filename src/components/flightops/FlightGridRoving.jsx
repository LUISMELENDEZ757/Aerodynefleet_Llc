import React from 'react';
import { useGridRovingTabindex } from '@/hooks/useRovingTabindex';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Flight Grid with Roving Tabindex for accessible keyboard navigation
 * Usage:
 *   <FlightGridRoving flights={flights} onFlightSelect={handleSelect} />
 */
export default function FlightGridRoving({ flights, onFlightSelect, columnCount = 1 }) {
  const rowCount = Math.ceil(flights.length / columnCount);
  const { focusedIndex, setFocusedIndex, handleKeyDown, getTabIndex, registerRef } = 
    useGridRovingTabindex(rowCount, columnCount, 0);

  const [expandedIndex, setExpandedIndex] = React.useState(null);

  const handleFlightClick = (index) => {
    setFocusedIndex(index);
    setExpandedIndex(expandedIndex === index ? null : index);
    if (onFlightSelect) {
      onFlightSelect(flights[index]);
    }
  };

  return (
    <div
      className="space-y-2 rounded-xl bg-card border border-border p-4"
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label="Flight list - use arrow keys to navigate, Enter to expand"
    >
      {flights.map((flight, index) => {
        const isExpanded = expandedIndex === index;
        const isFocused = focusedIndex === index;

        return (
          <button
            key={flight.id}
            ref={(el) => registerRef(index, el)}
            tabIndex={getTabIndex(index)}
            onClick={() => handleFlightClick(index)}
            aria-pressed={isExpanded}
            aria-label={`Flight ${flight.flight_number}: ${flight.origin} to ${flight.destination} - ${isExpanded ? 'expanded' : 'collapsed'}`}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              isFocused ? 'bg-primary/20 border-primary' : 'hover:bg-secondary/40 border-transparent',
              'border'
            )}
          >
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{flight.flight_number}</p>
              <p className="text-xs text-muted-foreground">
                {flight.origin} → {flight.destination}
              </p>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground mt-2">
        💡 Tip: Use arrow keys to navigate, Enter to expand
      </p>
    </div>
  );
}