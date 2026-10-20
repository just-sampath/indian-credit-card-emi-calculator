import { useEffect, useRef, useState } from "react";

/**
 * Horizontal scroller for wide tables that makes hidden columns obvious:
 * a fade on the clipped edge plus a short hint, and keyboard scrolling.
 */
export function ScrollableTable({ children, label }) {
  const scrollerRef = useRef(null);
  const [overflow, setOverflow] = useState({ clipped: false, atEnd: true });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const update = () => {
      const clipped = scroller.scrollWidth > scroller.clientWidth + 1;
      const atEnd =
        scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
      setOverflow((previous) =>
        previous.clipped === clipped && previous.atEnd === atEnd
          ? previous
          : { clipped, atEnd }
      );
    };

    // ResizeObserver reports the initial size, so no synchronous update here.
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    if (scroller.firstElementChild) {
      observer.observe(scroller.firstElementChild);
    }
    scroller.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollerRef}
          aria-label={overflow.clipped ? label : undefined}
          className="overflow-x-auto overscroll-x-contain rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
          role={overflow.clipped ? "region" : undefined}
          tabIndex={overflow.clipped ? 0 : undefined}
        >
          {children}
        </div>
        {overflow.clipped && !overflow.atEnd ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-px right-px w-12 rounded-r-lg bg-linear-to-l from-bg to-transparent"
          />
        ) : null}
      </div>
      {overflow.clipped && !overflow.atEnd ? (
        <p className="mt-1.5 text-right text-[12px] text-text-muted">
          Scroll sideways for more columns →
        </p>
      ) : null}
    </div>
  );
}
