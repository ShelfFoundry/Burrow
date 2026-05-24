import type { EditorDocument } from "../editor/document";
import type { SelectedObjectSnapshot } from "../editor/selection";

type InspectorProps = {
  selectedObject: SelectedObjectSnapshot;
  document: EditorDocument;
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

          <div class="property-row">
            <span>X</span>
            <strong>{props.selectedObject.x}</strong>
          </div>

          <div class="property-row">
            <span>Y</span>
            <strong>{props.selectedObject.y}</strong>
          </div>

          <div class="property-row">
            <span>Width</span>
            <strong>{props.selectedObject.width}</strong>
          </div>

          <div class="property-row">
            <span>Height</span>
            <strong>{props.selectedObject.height}</strong>
          </div>
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
      )}
    </aside>
  );
}
