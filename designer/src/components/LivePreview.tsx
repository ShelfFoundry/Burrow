import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Maximize, X } from "lucide-solid";
import { findLabelSize, findPalette, type TemplateSettings } from "../template/settings";
import { IconButton, onDismiss } from "./ui";

const PREVIEW_MAX_HEIGHT = 180;

type LivePreviewProps = {
  settings: TemplateSettings;
};

type PreviewSize = { width: number; height: number };

export function LivePreview(props: LivePreviewProps) {
  const [maximized, setMaximized] = createSignal(false);

  const size = (): PreviewSize => {
    const label = findLabelSize(props.settings.labelSize);
    const short = Math.min(label.width, label.height);
    const long = Math.max(label.width, label.height);
    return props.settings.orientation === "portrait"
      ? { width: short, height: long }
      : { width: long, height: short };
  };

  const caption = () => `${size().width} × ${size().height} · ${findPalette(props.settings.palette).label}`;

  return (
    <section class="flex flex-col gap-2 border-t border-border px-5 py-4">
      <div class="-my-1 flex items-center justify-between">
        <h2 class="text-[15px] text-fg-strong">Live preview</h2>
        <IconButton label="Maximize preview" onClick={() => setMaximized(true)}>
          <Maximize size={14} />
        </IconButton>
      </div>

      <div
        class="flex items-center justify-center rounded-md bg-canvas p-3"
        style={{ height: `${PREVIEW_MAX_HEIGHT + 24}px` }}
      >
        <PreviewFrame
          size={size()}
          // Fit inside the frame: full width for wide labels, capped height for tall ones.
          width={`min(100%, ${(PREVIEW_MAX_HEIGHT * size().width) / size().height}px)`}
        />
      </div>

      <p class="text-center text-[11px] text-fg-muted">{caption()}</p>

      <Show when={maximized()}>
        <MaximizedPreview size={size()} caption={caption()} onClose={() => setMaximized(false)} />
      </Show>
    </section>
  );
}

type MaximizedPreviewProps = {
  size: PreviewSize;
  caption: string;
  onClose: () => void;
};

// Fills the window with the preview. Escape or a click outside the panel closes it.
function MaximizedPreview(props: MaximizedPreviewProps) {
  let panelRef: HTMLDivElement | undefined;
  onDismiss(() => panelRef, props.onClose);

  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex bg-black/60 p-8">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Live preview"
          class="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-surface shadow-xl shadow-black/20"
        >
          <div class="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4">
            <h2 class="text-[15px] text-fg-strong">Live preview</h2>
            <span class="text-[11px] text-fg-muted">{props.caption}</span>
            <IconButton label="Close preview" class="ml-auto" onClick={props.onClose}>
              <X size={16} />
            </IconButton>
          </div>

          <div class="flex min-h-0 flex-1 items-center justify-center bg-canvas p-6">
            <PreviewFrame
              size={props.size}
              // Overlay padding (p-8), header (h-12) and body padding (p-6) leave
              // 100vh - 10rem of height; scale the width to keep the label's aspect.
              width={`min(100%, calc((100vh - 10rem) * ${props.size.width / props.size.height}))`}
            />
          </div>
        </div>
      </div>
    </Portal>
  );
}

type PreviewFrameProps = {
  size: PreviewSize;
  width: string;
};

function PreviewFrame(props: PreviewFrameProps) {
  return (
    <div
      class="flex max-h-full items-center justify-center rounded-sm border border-dashed border-grey-600 p-3"
      style={{ "aspect-ratio": `${props.size.width} / ${props.size.height}`, width: props.width }}
    >
      <p class="text-center text-[11px] text-fg-muted">Select a product to enable live previews</p>
    </div>
  );
}
