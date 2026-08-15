// app/admin/orders/TableScroller.tsx  — CLIENT (Project D v3)
//
// Horizontal-scroll wrapper that adds a second, always-visible scrollbar strip
// ABOVE the table, kept in sync with the real scroll container below it — so
// you can scroll the wide table sideways from the top of the page instead of
// only via the scrollbar at the container's bottom edge.
//
// Mechanics: the top strip is an empty overflow-x div whose inner spacer is
// kept at the table's scrollWidth (via ResizeObserver, so it tracks filter
// re-renders and window resizes). Scrolling either element copies scrollLeft
// to the other; the equality guard breaks the feedback loop. The strip hides
// itself entirely when the table fits (no dead 14px band on wide screens).
//
// The table itself is passed as children — it stays a server-rendered child
// of this client island.
'use client';

import { useEffect, useRef, useState } from 'react';

export default function TableScroller({ children }: { children: React.ReactNode }) {
  const topRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    const body = bodyRef.current;
    if (!content || !body) return;

    const measure = () => {
      setContentWidth(content.scrollWidth);
      setOverflowing(content.scrollWidth > body.clientWidth + 1);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(content);
    ro.observe(body);
    return () => ro.disconnect();
  }, []);

  const syncFrom = (
    source: React.RefObject<HTMLDivElement | null>,
    target: React.RefObject<HTMLDivElement | null>,
  ) => {
    const s = source.current;
    const t = target.current;
    if (s && t && t.scrollLeft !== s.scrollLeft) {
      t.scrollLeft = s.scrollLeft;
    }
  };

  return (
    <div>
      {overflowing && (
        <div
          ref={topRef}
          onScroll={() => syncFrom(topRef, bodyRef)}
          className="overflow-x-auto overflow-y-hidden border-b border-[#E7E5E0]"
          style={{ height: 14 }}
          aria-hidden="true"
        >
          <div style={{ width: contentWidth, height: 1 }} />
        </div>
      )}
      <div ref={bodyRef} onScroll={() => syncFrom(bodyRef, topRef)} className="overflow-x-auto">
        <div ref={contentRef} className="w-max min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
