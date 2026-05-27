import { NumberField } from "./NumberField";

type InspectorProps = {
  onRectPropertyChange?: (
    property: "x" | "y" | "width" | "height",
    value: number,
  ) => void;
};

export function Inspector(props: InspectorProps) {
  return (
    <aside class="inspector-panel">
      <div class="document-summary">
        <h3>Document</h3>
        <div class="property-row">
          <span>Page</span>
          <strong>
            {props.document.page.width}×{props.document.page.height}
          </strong>
        </div>
        <div class="property-row">
          <span>Objects</span>
          <strong>{props.document.objects.length}</strong>
        </div>
      </div>

      <h2>Inspector</h2>

      {props.selectedObject.kind === "none" ? (
        <p class="muted">No selection</p>
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
