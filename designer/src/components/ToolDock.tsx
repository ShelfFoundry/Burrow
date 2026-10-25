import { createSignal, For, Show, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
  ChevronsUpDown,
  Circle,
  Eye,
  Hand,
  Image,
  Minus,
  MousePointer2,
  Plus,
  QrCode,
  ScanBarcode,
  Slash,
  Square,
  Triangle,
  Type,
  Video,
} from "lucide-solid";
import { menuItem, menuPanel, onDismiss } from "./ui";

export type Tool =
  | "select"
  | "hand"
  | "text"
  | "square"
  | "line"
  | "ellipse"
  | "polygon"
  | "image"
  | "video"
  | "barcode"
  | "qr-code";

type IconComponent = (props: { size: number }) => JSX.Element;

type ToolInfo = {
  tool: Tool;
  label: string;
  icon: IconComponent;
};

type ToolGroup = {
  id: string;
  label: string;
  tools: ToolInfo[];
};

const SINGLE_TOOLS: ToolInfo[] = [
  { tool: "select", label: "Select", icon: MousePointer2 },
  { tool: "hand", label: "Hand", icon: Hand },
  { tool: "text", label: "Text", icon: Type },
];

const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "shapes",
    label: "Shapes",
    tools: [
      { tool: "square", label: "Square", icon: Square },
      { tool: "line", label: "Line", icon: Slash },
      { tool: "ellipse", label: "Ellipse", icon: Circle },
      { tool: "polygon", label: "Polygon", icon: Triangle },
    ],
  },
  {
    id: "media",
    label: "Media",
    tools: [
      { tool: "image", label: "Image", icon: Image },
      { tool: "video", label: "Video", icon: Video },
    ],
  },
  {
    id: "codes",
    label: "Codes",
    tools: [
      { tool: "barcode", label: "Barcode", icon: ScanBarcode },
      { tool: "qr-code", label: "QR Code", icon: QrCode },
    ],
  },
];

type ToolDockProps = {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  // Engine zoom factor, e.g. 2 for 200%.
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  previewVisible: boolean;
  onPreviewToggle: () => void;
};

export function ToolDock(props: ToolDockProps) {
  const [openGroup, setOpenGroup] = createSignal<string | undefined>();
  let dockRef: HTMLDivElement | undefined;

  onDismiss(() => dockRef, () => setOpenGroup(undefined));

  return (
    <div
      ref={dockRef}
      class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-surface p-1 shadow-xl shadow-black/20"
    >
      <For each={SINGLE_TOOLS}>
        {(info) => (
          <DockButton
            label={info.label}
            active={props.activeTool === info.tool}
            onClick={() => props.onToolChange(info.tool)}
          >
            <info.icon size={16} />
          </DockButton>
        )}
      </For>

      <For each={TOOL_GROUPS}>
        {(group) => (
          <ToolGroupButton
            group={group}
            activeTool={props.activeTool}
            open={openGroup() === group.id}
            onOpenChange={(open) => setOpenGroup(open ? group.id : undefined)}
            onToolChange={(tool) => {
              props.onToolChange(tool);
              setOpenGroup(undefined);
            }}
          />
        )}
      </For>

      <span class="mx-1.5 h-5 w-px bg-border" />

      <DockButton label="Zoom in" onClick={props.onZoomIn}>
        <Plus size={16} />
      </DockButton>
      <span class="w-11 text-center text-xs font-medium text-fg-strong tabular-nums">
        {Math.round(props.zoom * 100)}%
      </span>
      <DockButton label="Zoom out" onClick={props.onZoomOut}>
        <Minus size={16} />
      </DockButton>

      <DockButton
        label={props.previewVisible ? "Hide live preview" : "Show live preview"}
        active={props.previewVisible}
        onClick={props.onPreviewToggle}
      >
        <Eye size={16} />
      </DockButton>
    </div>
  );
}

type ToolGroupButtonProps = {
  group: ToolGroup;
  activeTool: Tool;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolChange: (tool: Tool) => void;
};

function ToolGroupButton(props: ToolGroupButtonProps) {
  // The button shows the group's last used tool.
  const [current, setCurrent] = createSignal(props.group.tools[0]);
  const active = () => props.group.tools.some((info) => info.tool === props.activeTool);

  return (
    <div class="relative flex items-center">
      <DockButton
        label={current().label}
        active={active()}
        onClick={() => props.onToolChange(current().tool)}
      >
        <Dynamic component={current().icon} size={16} />
      </DockButton>
      <button
        type="button"
        class={`grid h-8 w-4 place-items-center rounded-md transition-colors ${
          props.open
            ? "bg-hover text-fg-strong"
            : "text-fg-muted hover:bg-hover hover:text-fg-strong"
        }`}
        aria-label={`${props.group.label} tools`}
        aria-haspopup="menu"
        aria-expanded={props.open}
        onClick={() => props.onOpenChange(!props.open)}
      >
        <ChevronsUpDown size={10} />
      </button>

      <Show when={props.open}>
        <div
          role="menu"
          class={`${menuPanel} absolute bottom-full left-0 mb-2 w-36`}
        >
          <For each={props.group.tools}>
            {(info) => (
              <button
                type="button"
                role="menuitem"
                class={`${menuItem} ${
                  props.activeTool === info.tool
                    ? "text-primary"
                    : "text-fg hover:bg-hover hover:text-fg-strong"
                }`}
                onClick={() => {
                  setCurrent(info);
                  props.onToolChange(info.tool);
                }}
              >
                <info.icon size={14} />
                {info.label}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

type DockButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: JSX.Element;
};

function DockButton(props: DockButtonProps) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      aria-pressed={props.active}
      class={`grid size-8 place-items-center rounded-md transition-colors ${
        props.active ? "bg-field text-primary" : "text-fg hover:bg-hover hover:text-fg-strong"
      }`}
      onClick={() => props.onClick()}
    >
      {props.children}
    </button>
  );
}
