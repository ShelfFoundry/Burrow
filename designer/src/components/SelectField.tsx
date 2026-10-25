import { createUniqueId } from "solid-js";
import type { SelectOption } from "../template/settings";
import { Select } from "./Select";

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  // Renders a leading empty-value option, e.g. "None".
  placeholder?: string;
  onValueChange?: (value: T) => void;
};

export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  const id = createUniqueId();
  const labelId = `${id}-label`;

  return (
    <div class="flex flex-col gap-1">
      {/* The trigger is a div (combobox), so focus it by hand on label click. */}
      <span
        id={labelId}
        class="text-[11px] text-fg"
        onClick={() => document.getElementById(id)?.focus()}
      >
        {props.label}
      </span>
      <Select
        id={id}
        ariaLabelledBy={labelId}
        value={props.value}
        options={props.options}
        placeholder={props.placeholder}
        onValueChange={props.onValueChange}
      />
    </div>
  );
}
