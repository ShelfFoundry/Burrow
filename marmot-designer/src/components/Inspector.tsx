import type { SelectionSummary } from "../App";

type InspectorProps = {
  selection: SelectionSummary;
};

export function Inspector(props: InspectorProps) {
  return (
    <aside class="inspector-panel">
      <h2>Inspector</h2>

      {props.selection.kind == "none" ? (
        <p class="muted"> No selection</p>
      ) : (
        <div class="property-list">
          <div class="property-row">
            <span>ID</span>
            <strong>{props.selection.id}</strong>
          </div>

          <div class="property-row">
            <span>Type</span>
            <strong>{props.selection.objectType}</strong>
          </div>

          <div class="property-row">
            <span>X</span>
            <strong>{props.selection.x}</strong>
          </div>

          <div class="property-row">
            <span>Y</span>
            <strong>{props.selection.y}</strong>
          </div>

          <div class="property-row">
            <span>Width</span>
            <strong>{props.selection.width}</strong>
          </div>

          <div class="property-row">
            <span>Height</span>
            <strong>{props.selection.height}</strong>
          </div>
        </div>
      )}
    </aside>
  );
}
