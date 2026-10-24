import { createEffect, createSignal, type JSX } from "solid-js";
import { fieldBox, fieldInput, InputPrefix } from "./ui";

type NumberFieldProps = {
  // Short glyph shown inside the input, e.g. "X".
  prefix: JSX.Element;
  label: string;
  value: number;
  readOnly?: boolean;
  onValueChange?: (value: number) => void;
};

export function NumberField(props: NumberFieldProps) {
  const [text, setText] = createSignal(formatNumber(props.value));
  let inputRef: HTMLInputElement | undefined;

  // Don't overwrite what the user is typing; the engine may clamp the value
  // mid-edit (e.g. min rect size). Resync on blur instead.
  createEffect(() => {
    const next = formatNumber(props.value);
    if (document.activeElement !== inputRef) {
      setText(next);
    }
  });

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
        onInput={(event) => {
          const nextText = event.currentTarget.value;
          setText(nextText);

          const parsed = Number(nextText);

          if (nextText.trim() !== "" && Number.isFinite(parsed)) {
            props.onValueChange?.(parsed);
          }
        }}
        onBlur={() => {
          setText(formatNumber(props.value));
        }}
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
