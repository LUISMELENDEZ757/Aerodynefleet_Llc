# Routing & Navigation System Refactor

**Status:** ✓ Complete  
**Date:** 2026-03-21

## Overview

Complete refactor of the routing and navigation system to enforce strict navigation stack synchronization with tab history, implement precise route depth mapping for animations, and standardize roving tabindex across all list/grid components.

---

## 1. NavigationStack - Strict Stack Enforcement

### File: `lib/NavigationStack.js`

Provides centralized, validated route depth management and navigation validation.

#### Route Depth Mapping

```javascript
ROUTE_DEPTH = {
  '/Home': 0,           // Root
  '/Dashboard': 1,      // Primary tab
  '/OOSDetail': 2,      // Child screen
  '/NewOOS': 2,         // Child screen
  // ... etc
}
```

**Depth Levels:**
- **0**: Root/home screens (entry points)
- **1**: Primary tab navigation screens
- **2+**: Child screens requiring BackHeader

#### Key Functions

**`getRouteDepth(pathname)`**
- Returns numeric depth for any pathname
- Handles query parameters (strips `?...` before lookup)
- Fallback: returns 1 for unknown routes

**`getNavigationDirection(currentDepth, previousDepth)`**
- Returns: `>0` = push (deeper), `<0` = pop (back), `0` = same

**`isValidNavigation(currentPath, previousPath, tabHistory)`**
- Validates navigation before allowing stack recording
- Rule 1: Cannot jump more than 1 depth level (except to root)
- Rule 2: Cannot bypass root navigation
- Returns: boolean

**`getTabForRoute(pathname)`**
- Maps route to tab group: `'home'`, `'ops'`, `'efb'`, `'crew'`, `'more'`
- Used by TabHistoryProvider for stack tracking

**`isPrimaryTab(pathname)`**
- Returns true if depth ≤ 1 (primary tab screens)
- Used by layout to show/hide elements

**`isChildScreen(pathname)`**
- Returns true if depth ≥ 2 (requires BackHeader)
- Used by BackHeader for conditional rendering

---

## 2. PageTransition - Precise Animation Direction

### File: `components/ui/PageTransition.jsx`

Integrated with NavigationStack for accurate route depth mapping.

#### Changes

- Removed hardcoded `ROUTE_DEPTH` object
- Now imports `getRouteDepth` and `getNavigationDirection` from NavigationStack
- Animations based on depth change direction:
  - **Push (depth increases)**: Slide in from right
  - **Pop (depth decreases)**: Slide out to left
  - **Same depth**: No directional movement, fade only

#### Animation Variants

```javascript
// Mobile: directional slide
makeVariants(direction) {
  const x = direction >= 0 ? 40 : -40;
  return {
    initial:  { opacity: 0, x },
    animate:  { opacity: 1, x: 0 },
    exit:     { opacity: 0, x: -x },
  };
}

// Desktop: fade only
DESKTOP_VARIANTS = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1 },
  exit:     { opacity: 0 },
}
```

---

## 3. Roving Tabindex Standardization

### Files:
- `hooks/useListRovingTabindex.js` - List convenience hook
- `hooks/useRovingTabindex.js` - Core implementation (unchanged)
- `lib/RovingTabindexProvider.jsx` - Standardized patterns & validation
- `components/accessibility/RovingTabindexList.jsx` - Reusable list wrapper
- `components/accessibility/RovingTabindexGrid.jsx` - Reusable grid wrapper

### Core Hook: `useRovingTabindex`

Provides:
- Single Tab key enters the container
- Arrow keys navigate within
- Only one element at `tabindex="0"` at a time
- Home/End keys jump to start/end
- Wrap option for circular navigation

### Convenience Hooks

**`useListRovingTabindex(itemCount, initialIndex = 0)`**
- Pre-configured for vertical list navigation
- Wraps with: `direction: 'vertical'`, `wrap: true`
- Simple usage for list components

**`useGridRovingTabindex(rowCount, columnCount, initialIndex = 0)`**
- Pre-configured for grid navigation
- Wraps with: `direction: 'grid'`, `wrap: false`
- Calculates `itemCount = rowCount * columnCount`

### Standardized Wrapper Components

**`RovingTabindexList`**
```jsx
<RovingTabindexList
  items={items}
  ariaLabel="List of items"
  renderItem={(item, index, props) => (
    <button
      ref={(el) => props.registerRef(index, el)}
      tabIndex={props.getTabIndex(index)}
      onKeyDown={props.handleKeyDown}
    >
      {item.name}
    </button>
  )}
/>
```

**`RovingTabindexGrid`**
```jsx
<RovingTabindexGrid
  items={items}
  columns={3}
  ariaLabel="Grid of modules"
  renderItem={(item, index, props) => (
    <button
      ref={(el) => props.registerRef(index, el)}
      tabIndex={props.getTabIndex(index)}
      onKeyDown={props.handleKeyDown}
    >
      {item.title}
    </button>
  )}
/>
```

### ARIA Attributes Checklist

**Container:**
```jsx
role="list|grid|menu"
aria-label="Descriptive label"
onKeyDown={handleKeyDown}
```

**Items:**
```jsx
role="listitem|option|menuitem"
tabIndex={focusedIndex === i ? 0 : -1}
aria-label="Item description"
onClick={() => setFocusedIndex(i)}
ref={(el) => registerRef(i, el)}
```

### Validation Helper

**`validateRovingTabindex(containerRef, itemRefs, focusedIndex)`**

Development-time validation:
- Ensures exactly 1 item has `tabindex="0"`
- Verifies focused item is correct
- Checks all other items have `tabindex="-1"`

---

## 4. TabHistoryContext - Strict Navigation Validation

### File: `lib/TabHistoryContext.jsx`

Updated to use NavigationStack for validation.

#### Key Changes

- Now imports `getTabForRoute`, `getPrimaryTabRoutes`, `isValidNavigation` from NavigationStack
- `recordPath()` validates navigation via `isValidNavigation()` before recording
- Prevents orphaned routes that violate depth rules
- Synchronized with strict navigation stack

---

## 5. BackHeader - Precise Route Detection

### File: `components/layout/BackHeader.jsx`

Updated to use NavigationStack route depth mapping.

#### Key Changes

- Removed hardcoded `PRIMARY_PATHS` array
- Now uses `isChildScreen(pathname)` from NavigationStack
- Only renders for depth ≥ 2 (ensures accurate child screen detection)
- Validates all navigation via TabHistoryContext

---

## Implementation Guide

### For List Components

```jsx
import { useListRovingTabindex } from '@/hooks/useListRovingTabindex';

export default function MyList({ items }) {
  const { focusedIndex, handleKeyDown, getTabIndex, registerRef } = 
    useListRovingTabindex(items.length);

  return (
    <div
      role="list"
      aria-label="My list of items"
      onKeyDown={handleKeyDown}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          ref={(el) => registerRef(i, el)}
          tabIndex={getTabIndex(i)}
          onClick={() => selectItem(item)}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
```

### For Grid Components

```jsx
import { useGridRovingTabindex } from '@/hooks/useRovingTabindex';

export default function MyGrid({ items, columns = 3 }) {
  const rowCount = Math.ceil(items.length / columns);
  const { focusedIndex, handleKeyDown, getTabIndex, registerRef } = 
    useGridRovingTabindex(rowCount, columns);

  return (
    <div
      role="grid"
      aria-label="My grid of items"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-3 gap-4"
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          ref={(el) => registerRef(i, el)}
          tabIndex={getTabIndex(i)}
          onClick={() => selectItem(item)}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}
```

### For Wrapper Components

```jsx
import RovingTabindexList from '@/components/accessibility/RovingTabindexList';

export default function MyList({ items }) {
  return (
    <RovingTabindexList
      items={items}
      ariaLabel="List of items"
      renderItem={(item, index, props) => (
        <button
          key={item.id}
          ref={(el) => props.registerRef(index, el)}
          tabIndex={props.getTabIndex(index)}
          onKeyDown={props.handleKeyDown}
        >
          {item.name}
        </button>
      )}
    />
  );
}
```

---

## Benefits

✓ **Strict Navigation Stack**
- Prevents orphaned routes
- Validates all depth changes
- Synchronized with tab history

✓ **Precise Animation Direction**
- Push: slide from right
- Pop: slide from left
- Based on actual depth delta

✓ **Standardized Keyboard Navigation**
- Consistent across all lists/grids
- Single point of customization
- Full accessibility compliance

✓ **Centralized Route Management**
- Single source of truth (`NavigationStack`)
- Easy to maintain and extend
- Automatic validation

---

## Migration Checklist

When migrating existing list/grid components:

- [ ] Replace custom roving tabindex hooks with `useListRovingTabindex` or `useGridRovingTabindex`
- [ ] Ensure proper `role` attributes (`list`, `grid`, etc.)
- [ ] Add `aria-label` to container
- [ ] Update item markup to use provided props
- [ ] Test keyboard navigation (arrow keys, Home/End)
- [ ] Verify focus ring visibility

---

## Testing

**Keyboard Navigation:**
- Tab key: enters container, focuses first item
- Arrow keys: navigate within container
- Home: jump to first item
- End: jump to last item
- Click: focus and select item

**Animations:**
- Navigate from root to child: push animation (slide right)
- Navigate back to root: pop animation (slide left)
- Navigate between same-depth routes: fade only

**Stack Validation:**
- Cannot jump depth > 1 (blocked with console warning)
- Cannot bypass root (blocked with console warning)
- All navigation recorded in TabHistoryProvider