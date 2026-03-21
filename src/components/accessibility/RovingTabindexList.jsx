/**
 * RovingTabindexList
 * 
 * Standardized wrapper component for lists with roving tabindex keyboard navigation.
 * Provides consistent accessibility pattern across all list components.
 * 
 * Usage:
 *   <RovingTabindexList
 *     items={items}
 *     itemCount={items.length}
 *     ariaLabel="List of flight assignments"
 *     renderItem={(item, index, { focusedIndex, handleKeyDown, getTabIndex, registerRef }) => (
 *       <button
 *         key={item.id}
 *         ref={(el) => registerRef(index, el)}
 *         tabIndex={getTabIndex(index)}
 *         onClick={() => handleItemClick(item)}
 *         onKeyDown={handleKeyDown}
 *       >
 *         {item.name}
 *       </button>
 *     )}
 *   />
 */
import React, { useEffect } from 'react';
import { useListRovingTabindex } from '@/hooks/useListRovingTabindex';

export default function RovingTabindexList({
  items = [],
  itemCount,
  ariaLabel,
  renderItem,
  className = '',
  role = 'list',
  onFocusChange = null,
}) {
  const count = itemCount ?? items.length;
  const {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex,
    registerRef,
  } = useListRovingTabindex(count);

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