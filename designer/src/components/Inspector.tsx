import type { SetStoreFunction } from "solid-js/store";
import { Match, Switch } from "solid-js";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Ellipsis,
  FlipHorizontal2,
  FlipVertical2,
  Plus,
  Scan,
  TriangleRight,
} from "lucide-solid";
import type { RectEditableProperty, SelectedObjectSnapshot } from "../wasm/engine";
import type { TemplateSettings } from "../template/settings";
import { NumberField } from "./NumberField";
import { TemplateSettingsPanel } from "./TemplateSettingsPanel";
import { FieldLabel, IconButton, PanelSection, PendingInput, Swatch } from "./ui";

type InspectorProps = {
  selectedObject: SelectedObjectSnapshot;
  templateSettings: TemplateSettings;
  setTemplateSettings: SetStoreFunction<TemplateSettings>;
  onStatusChange: (message: string) => void;
  onRectPropertyChange?: (
    property: RectEditableProperty,
    value: number,
  ) => void;
};

export function Inspector(props: InspectorProps) {
  const notImplemented = (feature: string) => () =>
    props.onStatusChange(`${feature} needs engine support`);

  return (
    <aside class="absolute top-3 right-3 flex max-h-[calc(100%-1.5rem)] w-68 flex-col overflow-y-auto rounded-lg border border-border bg-surface shadow-xl shadow-black/20">
      <Switch>
        <Match when={props.selectedObject.kind === "none"}>
          <TemplateSettingsPanel
            settings={props.templateSettings}
            setSettings={props.setTemplateSettings}
            onStatusChange={props.onStatusChange}
          />
        </Match>

        <Match when={props.selectedObject.kind === "multiple" && props.selectedObject}>
          {(selected) => (
            <>
              <AlignmentSection onAlign={notImplemented} />
              <PanelSection>
                <p class="text-xs text-fg-muted">{selected().count} objects selected</p>
              </PanelSection>
            </>
          )}
        </Match>

        <Match when={props.selectedObject.kind === "rect" && props.selectedObject}>
          {(rect) => (
            <>
              <AlignmentSection onAlign={notImplemented} />

              <PanelSection title="Position">
                <div class="grid grid-cols-2 gap-1.5">
                  <NumberField
                    prefix="X"
                    label="X"
                    value={rect().x}
                    onValueChange={(value) => props.onRectPropertyChange?.("x", value)}
                  />
                  <NumberField
                    prefix="Y"
                    label="Y"
                    value={rect().y}
                    onValueChange={(value) => props.onRectPropertyChange?.("y", value)}
                  />
                </div>
              </PanelSection>

              <PanelSection title="Dimensions">
                <div class="grid grid-cols-2 gap-1.5">
                  <NumberField
                    prefix="W"
                    label="Width"
                    value={rect().width}
                    onValueChange={(value) => props.onRectPropertyChange?.("width", value)}
                  />
                  <NumberField
                    prefix="H"
                    label="Height"
                    value={rect().height}
                    onValueChange={(value) => props.onRectPropertyChange?.("height", value)}
                  />
                </div>
              </PanelSection>

              <PanelSection title="Transform">
                <div class="grid grid-cols-2 gap-1.5">
                  <PendingInput prefix={<TriangleRight size={12} />} placeholder="0°" />
                  <div class="flex gap-0.5">
                    <IconButton label="Flip vertical" onClick={notImplemented("Flip")}>
                      <FlipVertical2 size={14} />
                    </IconButton>
                    <IconButton label="Flip horizontal" onClick={notImplemented("Flip")}>
                      <FlipHorizontal2 size={14} />
                    </IconButton>
                  </div>
                </div>
              </PanelSection>

              <PanelSection title="Fill">
                <div class="grid grid-cols-2 gap-1.5">
                  <PendingInput prefix={<Swatch />} placeholder="000000" />
                </div>
              </PanelSection>

              <PanelSection
                title="Borders"
                action={
                  <IconButton label="Add border" class="-mr-1 size-5" onClick={notImplemented("Borders")}>
                    <Plus size={12} />
                  </IconButton>
                }
              >
                <div class="grid grid-cols-[1fr_1fr_auto] gap-x-1.5 gap-y-1">
                  <FieldLabel>Stroke</FieldLabel>
                  <FieldLabel>Weight</FieldLabel>
                  <span />
                  <PendingInput prefix={<Swatch />} placeholder="000000" />
                  <PendingInput placeholder="1" />
                  <IconButton label="Border sides" onClick={notImplemented("Border sides")}>
                    <Scan size={14} />
                  </IconButton>
                </div>
              </PanelSection>
            </>
          )}
        </Match>

        <Match when={props.selectedObject.kind === "line" && props.selectedObject}>
          {(line) => (
            <>
              <AlignmentSection onAlign={notImplemented} />

              <PanelSection title="Start">
                <div class="grid grid-cols-2 gap-1.5">
                  <NumberField prefix="X" label="Start X" value={line().x1} readOnly />
                  <NumberField prefix="Y" label="Start Y" value={line().y1} readOnly />
                </div>
              </PanelSection>

              <PanelSection title="End">
                <div class="grid grid-cols-2 gap-1.5">
                  <NumberField prefix="X" label="End X" value={line().x2} readOnly />
                  <NumberField prefix="Y" label="End Y" value={line().y2} readOnly />
                </div>
              </PanelSection>

              <PanelSection title="Stroke">
                <div class="grid grid-cols-2 gap-1.5">
                  <PendingInput prefix={<Swatch />} placeholder="000000" />
                  <PendingInput prefix="W" placeholder="1" />
                </div>
              </PanelSection>
            </>
          )}
        </Match>
      </Switch>
    </aside>
  );
}

function AlignmentSection(props: { onAlign: (feature: string) => () => void }) {
  return (
    <PanelSection title="Alignment">
      <div class="flex items-center gap-0.5">
        <IconButton label="Align left" onClick={props.onAlign("Align left")}>
          <AlignStartVertical size={14} />
        </IconButton>
        <IconButton label="Align horizontal centers" onClick={props.onAlign("Align center")}>
          <AlignCenterVertical size={14} />
        </IconButton>
        <IconButton label="Align right" onClick={props.onAlign("Align right")}>
          <AlignEndVertical size={14} />
        </IconButton>
        <span class="mx-1 h-4 w-px bg-border" />
        <IconButton label="Align top" onClick={props.onAlign("Align top")}>
          <AlignStartHorizontal size={14} />
        </IconButton>
        <IconButton label="Align vertical centers" onClick={props.onAlign("Align middle")}>
          <AlignCenterHorizontal size={14} />
        </IconButton>
        <IconButton label="Align bottom" onClick={props.onAlign("Align bottom")}>
          <AlignEndHorizontal size={14} />
        </IconButton>
        <IconButton label="More" class="ml-auto" onClick={props.onAlign("Distribute")}>
          <Ellipsis size={14} />
        </IconButton>
      </div>
    </PanelSection>
  );
}
