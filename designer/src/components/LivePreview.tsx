import { findLabelSize, findPalette, type TemplateSettings } from "../template/settings";

// Keep in sync with .live-preview-frame height in index.css
const PREVIEW_MAX_HEIGHT = 176;

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
    <section class="live-preview">
      <h3 class="inspector-section-title">Live preview</h3>

      <div class="live-preview-frame">
        <div
          class="live-preview-screen"
          style={{
            "aspect-ratio": `${size().width} / ${size().height}`,
            // Fit inside the frame: full width for wide labels, capped height for tall ones.
            width: `min(100%, ${(PREVIEW_MAX_HEIGHT * size().width) / size().height}px)`,
          }}
        >
          <p>Select a product to enable live previews</p>
        </div>
      </div>

      <p class="live-preview-caption">
        {size().width} × {size().height} · {findPalette(props.settings.palette).label}
      </p>
    </section>
  );
}
