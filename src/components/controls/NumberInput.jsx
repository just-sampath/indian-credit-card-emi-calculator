import { useId, useRef, useState } from "react";
import { cn } from "../../lib/cn.js";

function sanitize(raw, integer) {
  const cleaned = raw.replace(integer ? /[^\d]/g : /[^\d.]/g, "");
  if (integer) {
    return cleaned;
  }
  const [whole, ...fraction] = cleaned.split(".");
  return fraction.length > 0 ? `${whole}.${fraction.join("")}` : whole;
}

function parse(draft) {
  if (draft.trim() === "" || draft === ".") {
    return null;
  }
  const number = Number(draft);
  return Number.isFinite(number) ? number : null;
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function integerDigits(number) {
  return String(Math.trunc(Math.abs(number))).length;
}

function isTouchDevice() {
  return Boolean(window.matchMedia?.("(pointer: coarse)").matches);
}

/**
 * Numeric text field that keeps the user's draft while they type.
 *
 * Only in-range values are pushed to the parent, so clearing the field or
 * typing through an intermediate value ("2" on the way to "24") never snaps
 * the draft to a fallback. On blur / Enter the draft is clamped and committed.
 * `format` controls how the committed value reads while the field is idle.
 */
export function NumberInput({
  className,
  decimals = 2,
  describedBy,
  disabled = false,
  format,
  formatBound = String,
  id,
  integer = false,
  max,
  min,
  onValueChange,
  prefix,
  step = 1,
  suffix,
  value,
  ...inputProps
}) {
  const messageId = useId();
  const inputRef = useRef(null);
  const [draft, setDraft] = useState(String(value));
  const [previousValue, setPreviousValue] = useState(value);
  const [focused, setFocused] = useState(false);

  // Follow outside changes (slider, chips, reset) without clobbering a draft
  // that already represents the same number, e.g. "17." while typing "17.5".
  if (value !== previousValue) {
    setPreviousValue(value);
    if (parse(draft) !== value) {
      setDraft(String(value));
    }
  }

  const normalize = (number) => {
    const clamped = clamp(number, min, max);
    if (integer) {
      return Math.round(clamped);
    }
    const factor = 10 ** decimals;
    return Math.round(clamped * factor) / factor;
  };

  const parsed = parse(draft);
  let error = null;
  let hint = null;
  if (parsed !== null && parsed > max) {
    error = `Maximum is ${formatBound(max)}`;
  } else if (parsed !== null && parsed < min) {
    if (integerDigits(parsed) >= integerDigits(min)) {
      // More digits can't fix e.g. "0" for a 1-to-60 month field.
      error = `Minimum is ${formatBound(min)}`;
    } else if (focused) {
      // Still typing ("500" on the way to "5000"): say what will happen.
      hint = `Minimum is ${formatBound(min)}. Keep typing, or it will be set to ${formatBound(min)}.`;
    }
  }

  const push = (next) => {
    if (next !== value) {
      onValueChange(next);
    }
  };

  const commit = () => {
    const number = parse(draft);
    if (number === null) {
      setDraft(String(value));
      return;
    }
    const next = normalize(number);
    setDraft(String(next));
    push(next);
  };

  const handleChange = (event) => {
    const next = sanitize(event.target.value, integer);
    setDraft(next);
    const number = parse(next);
    if (number !== null && number >= min && number <= max) {
      push(number);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    // Keep the field above the on-screen keyboard once it has slid up.
    if (isTouchDevice()) {
      window.setTimeout(() => {
        const input = inputRef.current;
        const viewport = window.visualViewport;
        if (!input || !viewport || document.activeElement !== input) {
          return;
        }
        const { bottom } = input.getBoundingClientRect();
        if (bottom > viewport.height - 16) {
          input.scrollIntoView?.({ block: "center", behavior: "smooth" });
        }
      }, 350);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    commit();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      // Blurring commits the value and dismisses the on-screen keyboard.
      if (document.activeElement === event.currentTarget) {
        event.currentTarget.blur();
      } else {
        commit();
      }
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const base = parse(draft) ?? value;
      const next = normalize(base + (event.key === "ArrowUp" ? step : -step));
      setDraft(String(next));
      push(next);
    }
  };

  const message = error ?? hint;
  const ariaDescribedBy =
    [describedBy, message ? messageId : null].filter(Boolean).join(" ") ||
    undefined;
  const shown = !focused && format && parsed === value ? format(value) : draft;

  return (
    <div className={cn("min-w-0", className)}>
      {/* Taps on the prefix, suffix or padding focus the field too; the
          input itself stays the keyboard-focusable control. */}
      <div
        className="input-shell cursor-text"
        data-disabled={disabled}
        data-invalid={Boolean(error)}
        onClick={(event) => {
          if (event.target !== inputRef.current && !disabled) {
            inputRef.current?.focus();
          }
        }}
      >
        {prefix ? (
          <span aria-hidden="true" className="input-affix">
            {prefix}
          </span>
        ) : null}
        <input
          ref={inputRef}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          className="input-bare"
          disabled={disabled}
          enterKeyHint="done"
          id={id}
          inputMode={integer ? "numeric" : "decimal"}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          type="text"
          value={shown}
          {...inputProps}
        />
        {suffix ? (
          <span aria-hidden="true" className="input-affix">
            {suffix}
          </span>
        ) : null}
      </div>
      {message ? (
        <p
          aria-live="polite"
          className={error ? "field-error" : "field-hint"}
          id={messageId}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
