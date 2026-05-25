import { createEffect, createSignal } from "solid-js";

type NumberFieldProps = {
  label: string;
  value: number;
  onValueChange?: (value: number) => void;
};

export function NumberField(props: NumberFieldProps) {
  const [text, setText] = createSignal(formatNumber(props.value));

  createEffect(() => {
    setText(formatNumber(props.value));
  });

  return (
    <label class="number-field">
      <span>{props.label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={text()}
        onInput={(event) => {
          const nextText = event.currentTarget.value;
          setText(nextText);

          const parsed = Number(nextText);

          if (nextText.trim() !== "" && Number.isFinite(parsed)) {
            props.onValueChange?.(parsed);
          }
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
