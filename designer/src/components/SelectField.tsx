import { For } from "solid-js";
import type { SelectOption } from "../template/settings";

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  // Renders a leading empty-value option, e.g. "None".
  placeholder?: string;
  onValueChange?: (value: T) => void;
};

export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  return (
    <label class="field">
      <span>{props.label}</span>
      <select
        onChange={(event) => {
          props.onValueChange?.(event.currentTarget.value as T);
        }}
      >
        {props.placeholder !== undefined && (
          <option value="" selected={props.value === ""}>
            {props.placeholder}
          </option>
        )}
        <For each={props.options}>
          {(option) => (
            <option value={option.value} selected={option.value === props.value}>
              {option.label}
            </option>
          )}
        </For>
      </select>
    </label>
  );
}
