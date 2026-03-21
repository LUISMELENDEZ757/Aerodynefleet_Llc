/**
 * useListRovingTabindex - Standardized roving tabindex for lists
 * 
 * Wraps useRovingTabindex with sensible defaults for vertical list navigation.
 * Simplifies implementation across all list components.
 */
import { useRovingTabindex } from './useRovingTabindex';

/**
 * Hook for list-based components (vertical navigation)
 * 
 * Usage:
 *   const { focusedIndex, handleKeyDown, getTabIndex, registerRef } = 
 *     useListRovingTabindex(items.length);
 *   
 *   <div onKeyDown={handleKeyDown} role="list">
 *     {items.map((item, i) => (
 *       <button
 *         key={i}
 *         ref={(el) => registerRef(i, el)}
 *         tabIndex={getTabIndex(i)}
 *         onClick={() => setFocusedIndex(i)}
 *         role="listitem"
 *       >
 *         {item}
 *       </button>
 *     ))}
 *   </div>
 */
export function useListRovingTabindex(itemCount, initialIndex = 0) {
  return useRovingTabindex(itemCount, {
    columns: 1,
    direction: 'vertical',
    initialIndex,
    wrap: true, // Wrap in lists for circular navigation
  });
}