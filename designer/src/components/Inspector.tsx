import type { SetStoreFunction } from "solid-js/store";
import type { RectEditableProperty, SelectedObjectSnapshot } from "../wasm/engine";
import type { TemplateSettings } from "../template/settings";
import { LivePreview } from "./LivePreview";
import { NumberField } from "./NumberField";
import { TemplateSettingsPanel } from "./TemplateSettingsPanel";

type InspectorProps = {
  selectedObject: SelectedObjectSnapshot;
  templateSettings: TemplateSettings;
  setTemplateSettings: SetStoreFunction<TemplateSettings>;
  onStatusChange?: (message: string) => void;
  onRectPropertyChange?: (
    property: RectEditableProperty,
    value: number,
  ) => void;
};

export function Inspector(props: InspectorProps) {
  return (
    <aside class="inspector-panel">
      <LivePreview settings={props.templateSettings} />

      {props.selectedObject.kind === "none" ? (
        <TemplateSettingsPanel
          settings={props.templateSettings}
          setSettings={props.setTemplateSettings}
          onStatusChange={props.onStatusChange}
        />
      ) : props.selectedObject.kind === "multiple" ? (
        <p class="muted">{props.selectedObject.count} objects selected</p>
      ) : props.selectedObject.kind === "rect" ? (
        <div class="inspector-form">
          <div class="property-list">
            <div class="property-row">
              <span>ID</span>
              <strong>{props.selectedObject.id}</strong>
            </div>

            <div class="property-row">
              <span>Name</span>
              <strong>{props.selectedObject.name}</strong>
            </div>

            <div class="property-row">
              <span>Type</span>
              <strong>rect</strong>
            </div>
          </div>

          <section class="inspector-section">
            <h3 class="inspector-section-title">Geometry</h3>

            <NumberField
              label="X"
              value={props.selectedObject.x}
              onValueChange={(value) => {
                props.onRectPropertyChange?.("x", value);
              }}
            />

            <NumberField
              label="Y"
              value={props.selectedObject.y}
              onValueChange={(value) => {
                props.onRectPropertyChange?.("y", value);
              }}
            />

            <NumberField
              label="Width"
              value={props.selectedObject.width}
              onValueChange={(value) => {
                props.onRectPropertyChange?.("width", value);
              }}
            />

            <NumberField
              label="Height"
              value={props.selectedObject.height}
              onValueChange={(value) => {
                props.onRectPropertyChange?.("height", value);
              }}
            />
          </section>
        </div>
      ) : (
        <div class="property-list">
          <div class="property-row">
            <span>ID</span>
            <strong>{props.selectedObject.id}</strong>
          </div>

          <div class="property-row">
            <span>Name</span>
            <strong>{props.selectedObject.name}</strong>
          </div>

          <div class="property-row">
            <span>Type</span>
            <strong>line</strong>
          </div>

          <div class="property-row">
            <span>X1</span>
            <strong>{props.selectedObject.x1}</strong>
          </div>

          <div class="property-row">
            <span>Y1</span>
            <strong>{props.selectedObject.y1}</strong>
          </div>

          <div class="property-row">
            <span>X2</span>
            <strong>{props.selectedObject.x2}</strong>
          </div>

          <div class="property-row">
            <span>Y2</span>
            <strong>{props.selectedObject.y2}</strong>
          </div>
        </div>
      )
      }
    </aside>
  );
}
