/**
 * RovingTabindexProvider
 * 
 * Standardizes roving tabindex implementation patterns across all list/grid components.
 * Provides consistent interface and accessibility guarantees.
 */

/**
 * Create roving tabindex wrapper for any list/grid component
 * 
 * Usage:
 *   const {
 *     focusedIndex,
 *     handleKeyDown,
 *     getTabIndex,
 *     registerRef,
 *     setFocusedIndex
 *   } = createRovingTabindex({
 *     itemCount: 12,
 *     columns: 3,
 *     direction: 'grid'
 *   });
 * 
 * @param {object} config - Configuration object
 * @returns {object} Roving tabindex state and methods
 */
export function createRovingTabindex(config) {
  const {
    itemCount = 0,
    columns = 1,
    direction = 'vertical', // 'vertical', 'horizontal', 'grid'
    initialIndex = 0,
    wrap = true,
    onFocusChange = null,
  } = config;

  // This returns the same interface as useRovingTabindex
  // Can be implemented as a hook or class-based pattern
  return {
    focusedIndex: initialIndex,
    handleKeyDown: () => {},
    getTabIndex: (index) => index === initialIndex ? 0 : -1,
    registerRef: () => {},
    setFocusedIndex: () => {},
    config: { itemCount, columns, direction, initialIndex, wrap, onFocusChange },
  };
}

/**
 * Accessibility checklist for roving tabindex components
 * Ensure all list/grid components follow these rules:
 */
export const ROVING_TABINDEX_CHECKLIST = {
  // Structure
  CONTAINER_ROLE: 'Ensure container has role="list", "grid", or "group"',
  ITEM_ROLE: 'Ensure items have role="listitem", "option", or similar',

  // Tabindex Management
  SINGLE_TABINDEX_ZERO: 'Only one item should have tabindex="0"',
  INACTIVE_TABINDEX_NEG_ONE: 'All other items should have tabindex="-1"',

  // Keyboard Handling
  ARROW_KEYS: 'Use arrow keys to navigate within the container',
  HOME_END_KEYS: 'Support Home/End keys to jump to start/end',
  FOCUS_VISIBLE: 'Visual indicator should show which item has focus',

  // Focus Management
  FOCUS_TRAP: 'Focus should not escape the container during navigation',
  FOCUS_RESTORATION: 'Focus should return to last focused item when returning to container',

  // Dynamic Content
  DYNAMIC_UPDATES: 'If items are added/removed, update itemCount and reset focus if needed',

  // Labels
  ARIA_LABELS: 'All items should have aria-label or aria-labelledby',
  CONTAINER_LABEL: 'Container should have accessible name via aria-label or heading',
};

/**
 * Standard ARIA attributes for roving tabindex components
 * Apply these to the container and items
 */
export const ROVING_TABINDEX_ARIA_ATTRS = {
  // Container attributes
  container: {
    role: 'list', // or 'grid', 'menu', 'listbox', etc.
    'aria-label': 'descriptive label for the list', // required
    onKeyDown: 'handleKeyDown', // arrow key handling
  },

  // Item attributes
  item: {
    role: 'listitem', // or 'option', 'menuitem', etc.
    tabIndex: 'getTabIndex(index)', // 0 or -1
    onClick: '() => setFocusedIndex(index)', // clicking should focus
    'aria-label': 'descriptive label for the item', // or aria-labelledby
    ref: '(el) => registerRef(index, el)', // ref tracking
  },
};

/**
 * Validation helper: ensure component implements roving tabindex correctly
 * 
 * Usage in development/testing:
 *   validateRovingTabindex(containerRef, itemRefs, focusedIndex);
 */
export function validateRovingTabindex(containerRef, itemRefs, focusedIndex) {
  if (!containerRef) {
    console.warn('[RovingTabindex] Container ref not found');
    return false;
  }

  // Check tabindex values
  const tabindexZeroCount = itemRefs.filter(ref => ref?.tabIndex === 0).length;
  if (tabindexZeroCount !== 1) {
    console.warn(`[RovingTabindex] Expected exactly 1 item with tabindex="0", found ${tabindexZeroCount}`);
    return false;
  }

  // Check that focused item has tabindex="0"
  if (itemRefs[focusedIndex]?.tabIndex !== 0) {
    console.warn(`[RovingTabindex] Focused item (index ${focusedIndex}) does not have tabindex="0"`);
    return false;
  }

  // Check that other items have tabindex="-1"
  for (let i = 0; i < itemRefs.length; i++) {
    if (i !== focusedIndex && itemRefs[i]?.tabIndex !== -1) {
      console.warn(`[RovingTabindex] Item ${i} should have tabindex="-1", found ${itemRefs[i]?.tabIndex}`);
      return false;
    }
  }

  return true;
}