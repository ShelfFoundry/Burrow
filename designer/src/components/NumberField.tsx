import '../styles/number-field.css';
import { createEffect, createSignal } from "solid-js";

type NumberFieldProps = {
  label?: string;
  value: number;
  icon?: string;
  onValueChange?: (value: number) => void;
};

export function NumberField(props: NumberFieldProps) {
  const [text, setText] = createSignal(formatNumber(props.value));

  createEffect(() => {
    setText(formatNumber(props.value));
  });

  function renderLabel() {
    if (props?.label?.length) {
      return (
          <span>{props.label}</span>
      )
    }
  }

  function renderIcon() {
    if (props?.icon?.length) {
      return (
        <i innerHTML={props.icon}></i>
      )
    }
  }

  return (
    <label class="number-field">
      {renderLabel()}
      {renderIcon()}
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
