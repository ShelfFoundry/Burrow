import { createEffect, createSignal, type JSX } from "solid-js";
import { fieldBox, fieldInput, InputPrefix } from "./ui";

type NumberFieldProps = {
  // Short glyph shown inside the input, e.g. "X".
  prefix: JSX.Element;
  label: string;
  value: number;
  readOnly?: boolean;
  // Fired on blur or Enter, only when the text differs from the current value.
  // Each commit is one undoable edit in the engine, so never fire per keystroke.
  onCommit?: (value: number) => void;
};

export function NumberField(props: NumberFieldProps) {
  const [text, setText] = createSignal(formatNumber(props.value));
  let inputRef: HTMLInputElement | undefined;

  // Don't overwrite what the user is typing. Resync once focus leaves.
  createEffect(() => {
    const next = formatNumber(props.value);
    if (document.activeElement !== inputRef) {
      setText(next);
    }
  });

  function commit() {
    const current = text();
    // Compare against the formatted value, not the raw one: the field shows 4
    // decimals, so an untouched 163.30123 reads "163.3012" and must not commit.
    if (current === formatNumber(props.value)) return;

    const parsed = Number(current);
    if (current.trim() !== "" && Number.isFinite(parsed)) {
      props.onCommit?.(parsed);
    }

    // Show what the engine kept (it may clamp, or refuse the edit).
    setText(formatNumber(props.value));
  }

  function revert() {
    setText(formatNumber(props.value));
  }

  return (
    <label class={fieldBox} title={props.label}>
      <InputPrefix>{props.prefix}</InputPrefix>
      <input
        ref={inputRef}
        class={fieldInput}
        type="text"
        inputMode="decimal"
        aria-label={props.label}
        readOnly={props.readOnly}
        value={text()}
        onInput={(event) => setText(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            event.currentTarget.select();
          } else if (event.key === "Escape") {
            event.preventDefault();
            // Keep the app-level Escape (cancel / switch tool) from also firing.
            event.stopPropagation();
            revert();
            event.currentTarget.blur();
          }
        }}
        onBlur={commit}
      />
    </label>
  );
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return Number.parseFloat(value.toFixed(4)).toString();
}
