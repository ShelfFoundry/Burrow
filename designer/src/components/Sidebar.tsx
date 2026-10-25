import { createSignal, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { ChevronDown, CopyPlus, Trash2 } from "lucide-solid";
import { MOCK_LAYERS, MOCK_SELECTED_LAYERS, type LayerCommands } from "../layers/layers";
import type { TemplateSettings } from "../template/settings";
import { LayersPanel } from "./LayersPanel";
import { LivePreview } from "./LivePreview";
import { menuItem, menuPanel, onDismiss } from "./ui";

type SidebarProps = {
  templateSettings: TemplateSettings;
  setTemplateSettings: SetStoreFunction<TemplateSettings>;
  previewVisible: boolean;
  layerCommands: LayerCommands;
  onStatusChange: (message: string) => void;
};

export function Sidebar(props: SidebarProps) {
  return (
    <aside class="flex min-h-0 flex-col border-r border-border bg-surface">
      <div class="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
        <input
          class="h-8 min-w-0 flex-1 rounded-md bg-transparent px-2 text-[15px] text-fg-strong outline-none transition-colors hover:bg-hover focus:bg-field focus:ring-1 focus:ring-primary"
          aria-label="Template name"
          placeholder="Untitled template"
          spellcheck={false}
          value={props.templateSettings.name}
          onInput={(event) => props.setTemplateSettings("name", event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
          }}
        />

        <SaveButton onStatusChange={props.onStatusChange} />
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <h2 class="px-5 pt-4 pb-2 text-[15px] text-fg-strong">Layers</h2>

        <LayersPanel
          layers={MOCK_LAYERS}
          selectedIds={MOCK_SELECTED_LAYERS}
          commands={props.layerCommands}
        />
      </div>

      <Show when={props.previewVisible}>
        <LivePreview settings={props.templateSettings} />
      </Show>
    </aside>
  );
}

// MOCK: saving and deleting need the server.
function SaveButton(props: { onStatusChange: (message: string) => void }) {
  const [open, setOpen] = createSignal(false);
  let ref: HTMLDivElement | undefined;
  onDismiss(() => ref, () => setOpen(false));

  const run = (message: string) => () => {
    setOpen(false);
    props.onStatusChange(message);
  };

  return (
    <div ref={ref} class="relative flex shrink-0">
      <button
        type="button"
        class="h-7 rounded-l-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-primary-alt"
        onClick={run("Save needs the server")}
      >
        Save
      </button>
      <button
        type="button"
        class={`grid h-7 w-6 place-items-center rounded-r-md border-l border-black/20 text-white transition-colors hover:bg-primary-alt ${
          open() ? "bg-primary-alt" : "bg-primary"
        }`}
        aria-label="More save options"
        aria-haspopup="menu"
        aria-expanded={open()}
        onClick={() => setOpen(!open())}
      >
        <ChevronDown size={12} />
      </button>

      <Show when={open()}>
        <div role="menu" class={`${menuPanel} absolute top-full right-0 z-10 mt-1 w-44`}>
          <button
            type="button"
            role="menuitem"
            class={`${menuItem} text-fg hover:bg-hover hover:text-fg-strong`}
            onClick={run("Save as new needs the server")}
          >
            <CopyPlus size={14} />
            Save as new
          </button>
          <span class="mx-1 my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            class={`${menuItem} text-red hover:bg-red/10`}
            onClick={run("Delete template needs the server")}
          >
            <Trash2 size={14} />
            Delete template
          </button>
        </div>
      </Show>
    </div>
  );
}
