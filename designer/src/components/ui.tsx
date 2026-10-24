import { For, onCleanup, onMount, type JSX } from "solid-js";
import type { SelectOption } from "../template/settings";

// Shared building blocks for the side panels.

export const fieldBox =
  "flex h-7 min-w-0 items-center gap-2 rounded-md bg-field px-2 text-xs text-fg-strong focus-within:ring-1 focus-within:ring-primary";

export const fieldInput =
  "h-full w-full min-w-0 bg-transparent outline-none";

type PanelSectionProps = {
  title?: string;
  action?: JSX.Element;
  children: JSX.Element;
};

export function PanelSection(props: PanelSectionProps) {
  return (
    <section class="flex flex-col gap-2 border-b border-border px-3 py-2.5 last:border-b-0">
      {props.title !== undefined && (
        <div class="-mb-0.5 flex h-5 items-center justify-between">
          <h3 class="text-[11px] text-fg">{props.title}</h3>
          {props.action}
        </div>
      )}
      {props.children}
    </section>
  );
}

export function FieldLabel(props: { children: JSX.Element }) {
  return <span class="text-[11px] text-fg">{props.children}</span>;
}

// A short glyph or icon at the start of an input, e.g. "X" or a link icon.
export function InputPrefix(props: { children: JSX.Element }) {
  return (
    <span class="flex w-3 shrink-0 justify-center font-mono text-[11px] text-fg-muted">
      {props.children}
    </span>
  );
}

type PendingInputProps = {
  prefix?: JSX.Element;
  placeholder: string;
  class?: string;
};

// Stand-in for a property the engine doesn't expose yet. Shows the design's
// example value as placeholder text and can't be edited.
export function PendingInput(props: PendingInputProps) {
  return (
    <div class={`${fieldBox} ${props.class ?? ""}`} title="Needs engine support">
      {props.prefix && <InputPrefix>{props.prefix}</InputPrefix>}
      <input
        class={`${fieldInput} cursor-default`}
        readOnly
        tabindex={-1}
        placeholder={props.placeholder}
      />
    </div>
  );
}

type IconButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  class?: string;
  onClick?: (event: MouseEvent) => void;
  children: JSX.Element;
};

export function IconButton(props: IconButtonProps) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.active}
      disabled={props.disabled}
      class={`grid size-7 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-40 ${
        props.active && !props.disabled
          ? "bg-field text-primary"
          : "text-fg hover:bg-hover hover:text-fg-strong"
      } ${props.class ?? ""}`}
      onClick={(event) => props.onClick?.(event)}
    >
      {props.children}
    </button>
  );
}

type SegmentedProps<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
};

export function Segmented<T extends string>(props: SegmentedProps<T>) {
  return (
    <div class="flex h-7 gap-0.5 rounded-md bg-field p-0.5">
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            class={`flex-1 rounded text-xs transition-colors ${
              option.value === props.value
                ? "bg-selected text-fg-strong"
                : "text-fg-muted hover:text-fg"
            }`}
            onClick={() => props.onValueChange(option.value)}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}

// A filled square used beside hex values and in palette rows.
export function Swatch(props: { color?: string; class?: string; title?: string }) {
  return (
    <span
      class={`size-3 shrink-0 rounded-sm border border-border ${props.class ?? ""}`}
      style={{ background: props.color ?? "transparent" }}
      title={props.title}
    />
  );
}

export const menuPanel =
  "flex flex-col rounded-md border border-border bg-surface p-1 shadow-xl shadow-black/20";

export const menuItem =
  "flex h-7 items-center gap-2 rounded px-2 text-left text-xs transition-colors";

type DismissTarget = HTMLElement | undefined;

// Calls dismiss when the user presses Escape or points outside the element(s).
export function onDismiss(
  elements: () => DismissTarget | DismissTarget[],
  dismiss: () => void,
) {
  onMount(() => {
    const onPointerDown = (event: PointerEvent) => {
      const targets = [elements()].flat().filter((el) => el !== undefined);
      if (targets.length === 0) return;
      if (!targets.some((el) => el.contains(event.target as Node))) dismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    });
  });
}
