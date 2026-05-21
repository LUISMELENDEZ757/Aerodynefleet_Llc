/**
 * VirtualizedFleetGrid
 *
 * Renders the aircraft card grid using react-window FixedSizeList so only
 * visible rows are mounted — keeps scroll buttery-smooth for 1000+ aircraft.
 *
 * Props:
 *   items        – filtered & sorted aircraft array
 *   renderCard   – (aircraft) => ReactNode
 *   columnCount  – cards per row
 *   cardHeight   – estimated card height px (default 160)
 *   listHeight   – max visible list height px (default 720)
 */
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { FixedSizeList } from 'react-window';

const DEFAULT_CARD_HEIGHT = 160;
const ROW_GAP = 12;

export default function VirtualizedFleetGrid({
  items,
  renderCard,
  columnCount = 4,
  cardHeight = DEFAULT_CARD_HEIGHT,
  listHeight = 720,
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  // Measure container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    // Initial measurement
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Split flat items array into row chunks
  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < items.length; i += columnCount) {
      out.push(items.slice(i, i + columnCount));
    }
    return out;
  }, [items, columnCount]);

  const rowHeight = cardHeight + ROW_GAP;
  const totalRows = rows.length;
  const visibleHeight = Math.min(totalRows * rowHeight, listHeight);

  const Row = useCallback(({ index, style }) => {
    const row = rows[index];
    if (!row) return null;
    const colWidth = width
      ? `${(width - ROW_GAP * (columnCount - 1)) / columnCount}px`
      : `${100 / columnCount}%`;

    return (
      <div style={{ ...style, display: 'flex', gap: ROW_GAP, paddingBottom: 0 }}>
        {row.map((ac) => (
          <div key={ac.id} style={{ width: colWidth, flexShrink: 0 }}>
            {renderCard(ac)}
          </div>
        ))}
        {/* Spacer slots to keep alignment on last row */}
        {Array.from({ length: columnCount - row.length }).map((_, i) => (
          <div key={`sp-${i}`} style={{ width: colWidth, flexShrink: 0 }} />
        ))}
      </div>
    );
  }, [rows, columnCount, renderCard, width]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {width > 0 && totalRows > 0 && (
        <FixedSizeList
          height={visibleHeight}
          width={width}
          itemCount={totalRows}
          itemSize={rowHeight}
          overscanCount={4}
        >
          {Row}
        </FixedSizeList>
      )}
    </div>
  );
}