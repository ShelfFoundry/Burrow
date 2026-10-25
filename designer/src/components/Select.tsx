import { createEffect, createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Check, ChevronsUpDown } from "lucide-solid";
import type { SelectOption } from "../template/settings";
import { fieldBox, menuItem, menuPanel, onDismiss } from "./ui";

// Keep in sync with menuItem (h-7) and menuPanel (p-1 + border).
const OPTION_HEIGHT = 28;
const LIST_CHROME = 10;
const MAX_LIST_HEIGHT = 256;
const LIST_GAP = 4;
const VIEWPORT_MARGIN = 8;
const PAGE_STEP = 10;
const TYPEAHEAD_RESET_MS = 500;

type SelectProps<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  // Renders a leading empty-value option, e.g. "None".
  placeholder?: string;
  id?: string;
  ariaLabelledBy?: string;
  onValueChange?: (value: T) => void;
};

type ListPosition = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
};

// A select-only combobox (WAI-ARIA APG pattern). The list renders in a portal
// so scrolling panels can't clip it, and it never uses the OS popup.
export function Select<T extends string>(props: SelectProps<T>) {
  const id = props.id ?? createUniqueId();
  const listId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const [open, setOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [position, setPosition] = createSignal<ListPosition>();
  let triggerRef: HTMLDivElement | undefined;
  let listRef: HTMLUListElement | undefined;

  const items = (): SelectOption<T>[] =>
    props.placeholder !== undefined
      ? [{ value: "" as T, label: props.placeholder }, ...props.options]
      : props.options;

  const selectedIndex = () => items().findIndex((option) => option.value === props.value);
  const lastIndex = () => items().length - 1;

  function openList(index = Math.max(selectedIndex(), 0)) {
    updatePosition();
    setActiveIndex(index);
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function commit(index: number) {
    const option = items()[index];
    if (option && option.value !== props.value) props.onValueChange?.(option.value);
    close();
  }

  function moveActive(delta: number) {
    setActiveIndex((index) => Math.min(Math.max(index + delta, 0), lastIndex()));
  }

  // Below the trigger, or above it when there's more room there.
  function updatePosition() {
    if (!triggerRef) return;

    const rect = triggerRef.getBoundingClientRect();
    const listHeight = Math.min(items().length * OPTION_HEIGHT + LIST_CHROME, MAX_LIST_HEIGHT);
    const spaceBelow = window.innerHeight - rect.bottom - LIST_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - LIST_GAP - VIEWPORT_MARGIN;
    const above = spaceBelow < listHeight && spaceAbove > spaceBelow;

    setPosition({
      left: rect.left,
      width: rect.width,
      top: above ? undefined : rect.bottom + LIST_GAP,
      bottom: above ? window.innerHeight - rect.top + LIST_GAP : undefined,
      maxHeight: Math.min(MAX_LIST_HEIGHT, above ? spaceAbove : spaceBelow),
    });
  }

  // Typing jumps to the next option starting with the typed text. Repeating
  // one letter cycles through options with that initial.
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  function findTypeaheadMatch(char: string): number {
    clearTimeout(typeaheadTimer);
    typeahead += char.toLowerCase();
    typeaheadTimer = setTimeout(() => (typeahead = ""), TYPEAHEAD_RESET_MS);

    const options = items();
    const repeated = [...typeahead].every((c) => c === typeahead[0]);
    const search = repeated ? typeahead[0] : typeahead;
    const current = open() ? activeIndex() : selectedIndex();
    const start = Math.max(search.length === 1 ? current + 1 : current, 0);

    for (let offset = 0; offset < options.length; offset++) {
      const index = (start + offset) % options.length;
      if (options[index].label.toLowerCase().startsWith(search)) return index;
    }
    return -1;
  }

  function onKeyDown(event: KeyboardEvent) {
    const isTypeahead =
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      (event.key !== " " || typeahead !== "");

    if (isTypeahead) {
      event.preventDefault();
      const match = findTypeaheadMatch(event.key);
      if (match < 0) return;
      if (open()) setActiveIndex(match);
      else openList(match);
      return;
    }

    if (!open()) {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "Enter":
        case " ":
          event.preventDefault();
          openList();
          return;
        case "Home":
          event.preventDefault();
          openList(0);
          return;
        case "End":
          event.preventDefault();
          openList(lastIndex());
          return;
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        return;
      case "PageDown":
        event.preventDefault();
        moveActive(PAGE_STEP);
        return;
      case "PageUp":
        event.preventDefault();
        moveActive(-PAGE_STEP);
        return;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        return;
      case "End":
        event.preventDefault();
        setActiveIndex(lastIndex());
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex());
        return;
      case "Escape":
        event.preventDefault();
        close();
        return;
      case "Tab":
        commit(activeIndex());
        return;
    }
  }

  onDismiss(() => [triggerRef, listRef], close);

  onMount(() => {
    const closeOnOutsideScroll = (event: Event) => {
      if (open() && !listRef?.contains(event.target as Node)) close();
    };

    window.addEventListener("scroll", closeOnOutsideScroll, true);
    window.addEventListener("resize", close);
    onCleanup(() => {
      clearTimeout(typeaheadTimer);
      window.removeEventListener("scroll", closeOnOutsideScroll, true);
      window.removeEventListener("resize", close);
    });
  });

  createEffect(() => {
    if (!open()) return;
    document.getElementById(optionId(activeIndex()))?.scrollIntoView({ block: "nearest" });
  });

  return (
    <>
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        tabindex={0}
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={listId}
        aria-labelledby={props.ariaLabelledBy}
        aria-activedescendant={open() ? optionId(activeIndex()) : undefined}
        class={`${fieldBox} cursor-default justify-between pr-1.5 outline-none select-none focus:ring-1 focus:ring-primary`}
        onClick={() => (open() ? close() : openList())}
        onKeyDown={onKeyDown}
      >
        <span class={`truncate ${props.value === "" ? "text-fg-muted" : ""}`}>
          {items()[selectedIndex()]?.label ?? ""}
        </span>
        <ChevronsUpDown size={12} class="shrink-0 text-fg-muted" />
      </div>

      <Show when={open() && position()}>
        {(pos) => (
          <Portal>
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={props.ariaLabelledBy}
              tabindex={-1}
              class={`${menuPanel} fixed z-50 overflow-y-auto`}
              style={{
                left: `${pos().left}px`,
                top: pos().top !== undefined ? `${pos().top}px` : undefined,
                bottom: pos().bottom !== undefined ? `${pos().bottom}px` : undefined,
                "min-width": `${pos().width}px`,
                "max-height": `${pos().maxHeight}px`,
              }}
              // Keep focus on the trigger so keyboard handling stays in one place.
              onMouseDown={(event) => event.preventDefault()}
            >
              <For each={items()}>
                {(option, index) => (
                  <li
                    id={optionId(index())}
                    role="option"
                    aria-selected={option.value === props.value}
                    class={`${menuItem} shrink-0 cursor-default justify-between ${
                      index() === activeIndex() ? "bg-hover text-fg-strong" : "text-fg"
                    }`}
                    onMouseMove={() => setActiveIndex(index())}
                    onClick={() => commit(index())}
                  >
                    <span class="truncate">{option.label}</span>
                    <Show when={option.value === props.value}>
                      <Check size={12} class="shrink-0 text-primary" />
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </Portal>
        )}
      </Show>
    </>
  );
}
