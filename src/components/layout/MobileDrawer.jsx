import { useEffect, useId, useRef } from "react";
import { Button } from "../ui/Button.jsx";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusable(container) {
  if (!container) {
    return [];
  }
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (node) => node instanceof HTMLElement && !node.hasAttribute("disabled")
  );
}

function lockBodyScroll() {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const { body } = document;
  const previous = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
  };

  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";

  return () => {
    body.style.overflow = previous.overflow;
    body.style.position = previous.position;
    body.style.top = previous.top;
    body.style.left = previous.left;
    body.style.right = previous.right;
    body.style.width = previous.width;
    if (typeof window.scrollTo === "function") {
      try {
        window.scrollTo(0, scrollY);
      } catch {
        // jsdom may not implement scrollTo
      }
    }
  };
}

export function MobileDrawer({ open, onClose, title = "Inputs", children }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previouslyFocused.current = document.activeElement;
    const unlockBody = lockBodyScroll();

    // Initial focus once per open — never re-run on parent re-renders / onClose identity.
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const body = panel.querySelector("[data-drawer-body]");
      const preferred =
        body?.querySelector(
          'input:not([disabled]):not([type="hidden"]):not([type="range"])'
        ) ?? getFocusable(body)[0];
      const fallback = getFocusable(panel)[0];
      const target = preferred instanceof HTMLElement ? preferred : fallback;
      target?.focus();
    }, 0);

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const panel = panelRef.current;
      const nodes = getFocusable(panel);
      if (nodes.length === 0) {
        return;
      }

      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      unlockBody();
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        aria-label="Close inputs panel"
        className="drawer-backdrop absolute inset-0 border-0 bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-gold)]"
        onClick={() => onCloseRef.current()}
        type="button"
      />
      <div
        ref={panelRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="drawer-panel absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-border bg-surface-alt shadow-[-12px_0_40px_rgba(0,0,0,0.45)]"
        id="inputs-drawer"
        role="dialog"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div
            className="display-font text-[15px] font-bold tracking-[0.04em] text-gold-soft"
            id={titleId}
          >
            {title}
          </div>
          <Button
            className="min-h-9 px-3 py-1.5 text-[11px] uppercase tracking-[0.1em]"
            onClick={() => onCloseRef.current()}
            selected
            variant="tenure"
          >
            Done
          </Button>
        </div>
        <div
          className="drawer-scroll flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          data-drawer-body
        >
          {children}
        </div>
      </div>
    </div>
  );
}
