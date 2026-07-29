import { Show } from "solid-js";
import {
  ICON_ALIGN_B,
  ICON_ALIGN_H,
  ICON_ALIGN_L,
  ICON_ALIGN_R,
  ICON_ALIGN_T,
  ICON_ALIGN_V,
  ICON_H,
  ICON_W,
  ICON_X,
  ICON_Y,
} from "../icons";
import "../styles/properties-panel.css";
import { NumberField } from "./NumberField";
import { ColorField } from "./ColorField";
import { ButtonGroup } from "./ButtonGroup";

type PropertiesPanelProps = {
  selectionIds: number[];
  onRectPropertyChange?: (
    property: "x" | "y" | "width" | "height",
    value: number,
  ) => void;
};

export function PropertiesPanel(props: PropertiesPanelProps) {
  return (
    <Show when={props.selectionIds.length}>
      <aside class="properties-panel">
        <div>
          <span class="group-label">Alignment</span>
          <div class="alignment">
            <ButtonGroup>
              <button innerHTML={ICON_ALIGN_L}></button>
              <button innerHTML={ICON_ALIGN_H}></button>
              <button innerHTML={ICON_ALIGN_R}></button>
            </ButtonGroup>
            <ButtonGroup>
              <button innerHTML={ICON_ALIGN_T}></button>
              <button innerHTML={ICON_ALIGN_V}></button>
              <button innerHTML={ICON_ALIGN_B}></button>
            </ButtonGroup>
          </div>
        </div>
        <div>
          <span class="group-label">Position</span>
          <div class="col-2">
            <div>
              <NumberField value={0} icon={ICON_X} />
            </div>
            <div>
              <NumberField value={0} icon={ICON_Y} />
            </div>
          </div>
        </div>
        <hr />
        <div>
          <span class="group-label">Dimensions</span>
          <div class="col-2">
            <div>
              <NumberField value={0} icon={ICON_W} />
            </div>
            <div>
              <NumberField value={0} icon={ICON_H} />
            </div>
          </div>
        </div>
        <hr />
        <div>
          <span class="group-label">Fill</span>
          <ColorField value={"#000000"} />
        </div>
        <hr />
        <div>
          <span class="group-label">Border</span>
          <div class="col-2">
            <ColorField value={"#000000"} label="Stroke" />
            <NumberField value={0} label="Weight" />
          </div>
        </div>
      </aside>
    </Show>
  );
}
