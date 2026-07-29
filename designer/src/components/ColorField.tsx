import "../styles/color-field.css";
import { createEffect, createSignal } from "solid-js";

type ColorFieldProps = {
  label?: string;
  value: string;
  onValueChange?: (value: string) => void;
};

export function ColorField(props: ColorFieldProps) {
  const [color, setColor] = createSignal(props.value);

  createEffect(() => {
    setColor(props.value);
  });

  function renderLabel() {
    if (props?.label?.length) {
      return <span>{props.label}</span>;
    }
  }

  return (
    <label class="color-field">
      {renderLabel()}
      <div>
        <i style={{ "background-color": color() }}></i>
        <span>{formatColor(color())}</span>
        <input
          type="color"
          value={color()}
          onInput={(event) => {
            const nextText = event.currentTarget.value;
            setColor(nextText);

            if (nextText.trim() !== "") {
              props.onValueChange?.(nextText);
            }
          }}
        />
      </div>
    </label>
  );
}

function formatColor(value: string): string {
  return value.replace("#", "").toUpperCase();
}
