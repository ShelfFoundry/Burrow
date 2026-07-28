import { ICON_ALIGN_B, ICON_ALIGN_H, ICON_ALIGN_L, ICON_ALIGN_R, ICON_ALIGN_T, ICON_ALIGN_V, ICON_H, ICON_W, ICON_X, ICON_Y } from '../icons';
import '../styles/properties-panel.css';
import { NumberField } from "./NumberField";

type PropertiesPanelProps = {
  onRectPropertyChange?: (
    property: "x" | "y" | "width" | "height",
    value: number,
  ) => void;
};

export function PropertiesPanel(props: PropertiesPanelProps) {
  return (
    <aside class="properties-panel">
      <div>
        <span class="group-label">Alignment</span>
        <div class="alignment">
          <button-group>
            <button innerHTML={ICON_ALIGN_L}></button>
            <button innerHTML={ICON_ALIGN_H}></button>
            <button innerHTML={ICON_ALIGN_R}></button>
          </button-group>
          <button-group>
            <button innerHTML={ICON_ALIGN_T}></button>
            <button innerHTML={ICON_ALIGN_V}></button>
            <button innerHTML={ICON_ALIGN_B}></button>
          </button-group>
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
      <hr/>
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
      <hr/>
      <div>
        <span class="group-label">Fill</span>
      </div>
      <hr/>
      <div>
        <span class="group-label">Border</span>
      </div>
    </aside>
  );
}
