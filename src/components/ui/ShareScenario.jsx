import { useState } from "react";
import { cn } from "../../lib/cn.js";
import { Button } from "./Button.jsx";

const MESSAGES = {
  copied: "Link copied",
  failed: "Copy the link from the address bar instead",
};

/** Shares the current URL, which carries every input, or copies it. */
export function ShareScenario() {
  const [status, setStatus] = useState(null);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[10px] border border-border bg-surface px-4 py-3">
      <p className="min-w-0 flex-1 basis-56 text-[14px] leading-snug text-text-dim dense:text-[12px]">
        This page's link keeps every input, so you can bookmark it or send it to
        someone.
      </p>
      <div className="flex items-center gap-3">
        <span
          aria-live="polite"
          className={cn(
            "text-[13px] dense:text-[12px]",
            status === "copied" ? "text-green" : "text-text-muted"
          )}
        >
          {status ? MESSAGES[status] : ""}
        </span>
        <Button onClick={share} variant="outline">
          Share link
        </Button>
      </div>
    </div>
  );
}
