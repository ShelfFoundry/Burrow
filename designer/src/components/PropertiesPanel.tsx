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
    </aside>
  );
}
