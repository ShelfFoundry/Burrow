import { findLabelSize, findPalette, type TemplateSettings } from "../template/settings";

const PREVIEW_MAX_HEIGHT = 180;

type LivePreviewProps = {
  settings: TemplateSettings;
};

export function LivePreview(props: LivePreviewProps) {
  const size = () => {
    const label = findLabelSize(props.settings.labelSize);
    const short = Math.min(label.width, label.height);
    const long = Math.max(label.width, label.height);
    return props.settings.orientation === "portrait"
      ? { width: short, height: long }
      : { width: long, height: short };
  };

  return (
    <section class="flex flex-col gap-2 border-t border-border px-5 py-4">
      <h2 class="text-[15px] text-fg-strong">Live preview</h2>

      <div
        class="flex items-center justify-center rounded-md bg-canvas p-3"
        style={{ height: `${PREVIEW_MAX_HEIGHT + 24}px` }}
      >
        <div
          class="flex max-h-full items-center justify-center rounded-sm border border-dashed border-grey-600 p-3"
          style={{
            "aspect-ratio": `${size().width} / ${size().height}`,
            // Fit inside the frame: full width for wide labels, capped height for tall ones.
            width: `min(100%, ${(PREVIEW_MAX_HEIGHT * size().width) / size().height}px)`,
          }}
        >
          <p class="text-center text-[11px] text-fg-muted">Select a product to enable live previews</p>
        </div>
      </div>

      <p class="text-center text-[11px] text-fg-muted">
        {size().width} × {size().height} · {findPalette(props.settings.palette).label}
      </p>
    </section>
  );
}
