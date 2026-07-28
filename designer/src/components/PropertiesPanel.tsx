import { ICON_H, ICON_W, ICON_X, ICON_Y } from '../icons';
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
