type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  monospace?: boolean;
  onValueChange?: (value: string) => void;
};

export function TextField(props: TextFieldProps) {
  return (
    <label class="field">
      <span>{props.label}</span>
      <input
        type="text"
        classList={{ mono: props.monospace }}
        spellcheck={false}
        value={props.value}
        placeholder={props.placeholder}
        onInput={(event) => {
          props.onValueChange?.(event.currentTarget.value);
        }}
      />
    </label>
  );
}
