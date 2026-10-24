import { FieldLabel, fieldBox, fieldInput } from "./ui";

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  monospace?: boolean;
  onValueChange?: (value: string) => void;
};

export function TextField(props: TextFieldProps) {
  return (
    <label class="flex flex-col gap-1">
      <FieldLabel>{props.label}</FieldLabel>
      <div class={fieldBox}>
        <input
          type="text"
          class={`${fieldInput} ${props.monospace ? "font-mono" : ""}`}
          spellcheck={false}
          value={props.value}
          placeholder={props.placeholder}
          onInput={(event) => {
            props.onValueChange?.(event.currentTarget.value);
          }}
        />
      </div>
    </label>
  );
}
