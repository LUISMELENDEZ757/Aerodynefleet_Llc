import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Roving Tabindex Hook for Grid Navigation
 * 
 * Allows single Tab key to enter a grid, then arrow keys to navigate within it.
 * Only one element in the grid is in the tab order (tabindex="0") at a time.
 * 
 * Usage:
 *   const { focusedIndex, handleKeyDown, setFocusedIndex } = useRovingTabindex(
 *     itemCount,
 *     { columns: 4, direction: 'horizontal' }
 *   )
 *   
 *   // In grid: <div onKeyDown={handleKeyDown}>
 *   //   {items.map((item, i) => (
 *   //     <button
 *   //       tabIndex={focusedIndex === i ? 0 : -1}
 *   //       onClick={() => setFocusedIndex(i)}
 *   //       ref={focusedIndex === i ? ref : null}
 *   //     >
 */
export function useRovingTabindex(itemCount, options = {}) {
  const {
    columns = 1,
    direction = 'vertical', // 'vertical', 'horizontal', 'grid'
    initialIndex = 0,
    wrap = true,
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const itemRefs = useRef([]);
  const containerRef = useRef(null);

  // Update focus when focusedIndex changes
  useEffect(() => {
    if (itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const getNextIndex = useCallback(
    (currentIndex, key) => {
      let nextIndex = currentIndex;

      if (direction === 'vertical') {
        if (key === 'ArrowDown') {
          nextIndex = currentIndex + 1;
        } else if (key === 'ArrowUp') {
          nextIndex = currentIndex - 1;
        }
      } else if (direction === 'horizontal') {
        if (key === 'ArrowRight') {
          nextIndex = currentIndex + 1;
        } else if (key === 'ArrowLeft') {
          nextIndex = currentIndex - 1;
        }
      } else if (direction === 'grid') {
        if (key === 'ArrowDown') {
          nextIndex = currentIndex + columns;
        } else if (key === 'ArrowUp') {
          nextIndex = currentIndex - columns;
        } else if (key === 'ArrowRight') {
          nextIndex = currentIndex + 1;
        } else if (key === 'ArrowLeft') {
          nextIndex = currentIndex - 1;
        }
      }

      // Wrap around if enabled
      if (wrap) {
        nextIndex = ((nextIndex % itemCount) + itemCount) % itemCount;
      } else {
        nextIndex = Math.max(0, Math.min(itemCount - 1, nextIndex));
      }

      return nextIndex;
    },
    [itemCount, columns, direction, wrap]
  );

  const handleKeyDown = useCallback(
    (e) => {
      const { key } = e;

      if (
        !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)
      ) {
        return;
      }

      e.preventDefault();

      let nextIndex = focusedIndex;

      if (key === 'Home') {
        nextIndex = 0;
      } else if (key === 'End') {
        nextIndex = itemCount - 1;
      } else {
        nextIndex = getNextIndex(focusedIndex, key);
      }

      setFocusedIndex(nextIndex);
    },
    [focusedIndex, getNextIndex, itemCount]
  );

  const registerRef = useCallback((index, ref) => {
    if (ref) {
      itemRefs.current[index] = ref;
    }
  }, []);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    registerRef,
    getTabIndex: (index) => (focusedIndex === index ? 0 : -1),
  };
}

/**
 * Hook for grid-based components
 * Automatically handles row/column calculations
 */
export function useGridRovingTabindex(rowCount, columnCount, initialIndex = 0) {
  const itemCount = rowCount * columnCount;
  
  return useRovingTabindex(itemCount, {
    columns: columnCount,
    direction: 'grid',
    initialIndex,
    wrap: false, // Don't wrap in grid context
  });
}