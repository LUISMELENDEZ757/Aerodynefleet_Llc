/**
 * RovingTabindexGrid
 * 
 * Standardized wrapper component for grids with roving tabindex keyboard navigation.
 * Provides consistent accessibility pattern for grid-based components.
 * 
 * Usage:
 *   <RovingTabindexGrid
 *     items={items}
 *     columns={3}
 *     ariaLabel="Flight modules grid"
 *     renderItem={(item, index, { focusedIndex, handleKeyDown, getTabIndex, registerRef }) => (
 *       <button
 *         key={item.id}
 *         ref={(el) => registerRef(index, el)}
 *         tabIndex={getTabIndex(index)}
 *         onClick={() => handleItemClick(item)}
 *         onKeyDown={handleKeyDown}
 *       >
 *         {item.title}
 *       </button>
 *     )}
 *   />
 */
import React from 'react';
import { useGridRovingTabindex } from '@/hooks/useRovingTabindex';

export default function RovingTabindexGrid({
  items = [],
  columns = 3,
  ariaLabel,
  renderItem,
  className = '',
  role = 'grid',
  onFocusChange = null,
}) {
  const rowCount = Math.ceil(items.length / columns);
  const {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex,
    registerRef,
  } = useGridRovingTabindex(rowCount, columns, 0);

  // Notify parent of focus changes if handler provided
  React.useEffect(() => {
    onFocusChange?.(focusedIndex);
  }, [focusedIndex, onFocusChange]);

  const rovingTabindexProps = {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex,
    registerRef,
  };

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {items.map((item, index) => renderItem(item, index, rovingTabindexProps))}
    </div>
  );
}