import { createMemo, createSignal, For, onCleanup, Show, type JSX } from "solid-js";
import { Dynamic, Portal } from "solid-js/web";
import { ChevronDown, ChevronRight, Image, Slash, Square, SquareDashed, Type } from "lucide-solid";
import type {
  LayerCommands,
  LayerId,
  LayerKind,
  LayerNode,
  LayerPlacement,
} from "../layers/layers";

const ROW_INDENT = 20;
const ROW_PADDING_LEFT = 8;
const DRAG_THRESHOLD = 4;
const EDGE_SCROLL_ZONE = 24;
const EDGE_SCROLL_STEP = 8;
const AUTO_EXPAND_DELAY_MS = 600;
// Fraction of a group row's height at its top and bottom that drops beside
// the group instead of into it.
const GROUP_EDGE_ZONE = 0.25;

const LAYER_ICONS: Record<LayerKind, (props: { size: number }) => JSX.Element> = {
  text: Type,
  rect: Square,
  line: Slash,
  image: Image,
  group: SquareDashed,
};

// One visible row of the tree, in panel order.
type Row = {
  node: LayerNode;
  depth: number;
  parentId: LayerId | null;
  // Position among its siblings, front to back.
  index: number;
  siblingCount: number;
  ancestors: LayerId[];
};

type DropIndicator =
  | { kind: "line"; rowIndex: number; edge: "top" | "bottom"; depth: number }
  | { kind: "inside"; rowIndex: number };

type DropTarget = {
  placement: LayerPlacement;
  indicator: DropIndicator;
};

type DragState = {
  row: Row;
  x: number;
  y: number;
  target?: DropTarget;
};

type LayersPanelProps = {
  layers: LayerNode[];
  selectedIds: LayerId[];
  commands: LayerCommands;
};

export function LayersPanel(props: LayersPanelProps) {
  // Expanded groups are panel state, not document state.
  const [collapsed, setCollapsed] = createSignal<ReadonlySet<LayerId>>(new Set());
  const [drag, setDrag] = createSignal<DragState>();
  let listRef: HTMLUListElement | undefined;
  const rowRefs: HTMLElement[] = [];

  const rows = createMemo(() => flattenVisible(props.layers, collapsed()));
  const rowsById = createMemo(() => new Map(rows().map((row) => [row.node.id, row])));

  function setExpanded(id: LayerId, expanded: boolean) {
    const next = new Set(collapsed());
    if (expanded) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  }

  // Works out where a drop at this pointer position would put the dragged row.
  function findDropTarget(dragged: Row, clientX: number, clientY: number): DropTarget | undefined {
    const visible = rows();
    if (!listRef || visible.length === 0) return undefined;

    let rowIndex = visible.findIndex((_, i) => clientY < rowRefs[i].getBoundingClientRect().bottom);

    // Below the last row: the very back of the top level.
    if (rowIndex === -1) {
      const lastRoot = props.layers.length;
      return checked(dragged, {
        placement: { parentId: null, index: lastRoot },
        indicator: { kind: "line", rowIndex: visible.length - 1, edge: "bottom", depth: 0 },
      });
    }

    const row = visible[rowIndex];
    if (row.node.id === dragged.node.id || row.ancestors.includes(dragged.node.id)) {
      return undefined;
    }

    const rect = rowRefs[rowIndex].getBoundingClientRect();
    const offset = (clientY - rect.top) / rect.height;
    const isGroup = row.node.kind === "group";
    const beforeLimit = isGroup ? GROUP_EDGE_ZONE : 0.5;

    if (isGroup && offset >= GROUP_EDGE_ZONE && offset <= 1 - GROUP_EDGE_ZONE) {
      return checked(dragged, {
        placement: { parentId: row.node.id, index: 0 },
        indicator: { kind: "inside", rowIndex },
      });
    }

    if (offset < beforeLimit) {
      return checked(dragged, {
        placement: { parentId: row.parentId, index: row.index },
        indicator: { kind: "line", rowIndex, edge: "top", depth: row.depth },
      });
    }

    // Just below an open group's header is the top of that group.
    const hasVisibleChildren = isGroup && (row.node.children?.length ?? 0) > 0 && !collapsed().has(row.node.id);
    if (hasVisibleChildren) {
      return checked(dragged, {
        placement: { parentId: row.node.id, index: 0 },
        indicator: { kind: "line", rowIndex, edge: "bottom", depth: row.depth + 1 },
      });
    }

    // Below the last child of a group, moving the pointer left drops into an
    // outer level instead, one indent per level.
    const pointerDepth = Math.max(0, Math.floor((clientX - rect.left - ROW_PADDING_LEFT) / ROW_INDENT));
    let anchor = row;
    while (
      anchor.depth > pointerDepth &&
      anchor.parentId !== null &&
      anchor.index === anchor.siblingCount - 1
    ) {
      anchor = rowsById().get(anchor.parentId)!;
    }

    return checked(dragged, {
      placement: { parentId: anchor.parentId, index: anchor.index + 1 },
      indicator: { kind: "line", rowIndex, edge: "bottom", depth: anchor.depth },
    });
  }

  // Drops that leave the layer where it is aren't targets.
  function checked(dragged: Row, target: DropTarget): DropTarget | undefined {
    const { parentId, index } = target.placement;
    const unchanged =
      parentId === dragged.parentId && (index === dragged.index || index === dragged.index + 1);
    return unchanged ? undefined : target;
  }

  // Ends the drag in progress, if any. Also runs if the panel unmounts mid-drag.
  let finishDrag: (() => void) | undefined;
  onCleanup(() => finishDrag?.());

  let autoExpandTimer: ReturnType<typeof setTimeout> | undefined;
  let autoExpandId: LayerId | undefined;

  function scheduleAutoExpand(target: DropTarget | undefined) {
    const id =
      target?.indicator.kind === "inside" && collapsed().has(target.placement.parentId!)
        ? target.placement.parentId!
        : undefined;
    if (id === autoExpandId) return;

    clearTimeout(autoExpandTimer);
    autoExpandId = id;
    if (id !== undefined) {
      autoExpandTimer = setTimeout(() => setExpanded(id, true), AUTO_EXPAND_DELAY_MS);
    }
  }

  function edgeScroll(clientY: number) {
    if (!listRef) return;
    const rect = listRef.getBoundingClientRect();
    if (clientY < rect.top + EDGE_SCROLL_ZONE) listRef.scrollTop -= EDGE_SCROLL_STEP;
    else if (clientY > rect.bottom - EDGE_SCROLL_ZONE) listRef.scrollTop += EDGE_SCROLL_STEP;
  }

  // A press becomes a drag once the pointer moves past DRAG_THRESHOLD;
  // otherwise it's a click that selects.
  function onRowPointerDown(event: PointerEvent, row: Row) {
    if (event.button !== 0) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const toggle = event.ctrlKey || event.metaKey;
    let dragging = false;

    const onMove = (move: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(move.clientX - startX, move.clientY - startY) < DRAG_THRESHOLD) return;
        dragging = true;
        document.documentElement.classList.add("is-dragging");
      }

      edgeScroll(move.clientY);
      const target = findDropTarget(row, move.clientX, move.clientY);
      scheduleAutoExpand(target);
      setDrag({ row, x: move.clientX, y: move.clientY, target });
    };

    const onUp = () => {
      const target = drag()?.target;
      finish();
      if (!dragging) props.commands.select(row.node.id, toggle ? "toggle" : "replace");
      else if (target) props.commands.move(row.node.id, target.placement);
    };

    const onKeyDown = (key: KeyboardEvent) => {
      if (key.key === "Escape") finish();
    };

    const finish = () => {
      finishDrag = undefined;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove("is-dragging");
      scheduleAutoExpand(undefined);
      setDrag(undefined);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKeyDown);
    finishDrag = finish;
  }

  const indicatorStyle = (indicator: Extract<DropIndicator, { kind: "line" }>) => {
    const el = rowRefs[indicator.rowIndex];
    const top = el.offsetTop + (indicator.edge === "bottom" ? el.offsetHeight : 0);
    return {
      top: `${top - 1}px`,
      left: `${el.offsetLeft + ROW_PADDING_LEFT + indicator.depth * ROW_INDENT}px`,
    };
  };

  return (
    <>
      <ul
        ref={listRef}
        role="tree"
        aria-label="Layers"
        class="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3"
      >
        <Show when={props.layers.length === 0}>
          <li role="none" class="px-2 py-1.5 text-[13px] text-fg-muted">No objects yet</li>
        </Show>

        <For each={rows()}>
          {(row, rowIndex) => {
            const selected = () => props.selectedIds.includes(row.node.id);
            const isDragSource = () => drag()?.row.node.id === row.node.id;
            const isDropInside = () => {
              const indicator = drag()?.target?.indicator;
              return indicator?.kind === "inside" && indicator.rowIndex === rowIndex();
            };
            const isGroup = row.node.kind === "group";
            const expanded = () => !collapsed().has(row.node.id);

            return (
              <li
                ref={(el) => (rowRefs[rowIndex()] = el)}
                role="treeitem"
                aria-level={row.depth + 1}
                aria-selected={selected()}
                aria-expanded={isGroup ? expanded() : undefined}
                class={`flex h-8 cursor-grab items-center gap-1.5 rounded-md pr-2 select-none ${
                  selected()
                    ? "bg-primary text-white"
                    : "text-fg hover:bg-hover hover:text-fg-strong"
                } ${isDragSource() ? "opacity-40" : ""} ${
                  isDropInside() ? "ring-1 ring-primary ring-inset" : ""
                }`}
                style={{ "padding-left": `${ROW_PADDING_LEFT + row.depth * ROW_INDENT}px` }}
                onPointerDown={(event) => onRowPointerDown(event, row)}
              >
                <Show when={isGroup} fallback={<span class="w-3 shrink-0" />}>
                  <button
                    type="button"
                    class={`grid w-3 shrink-0 place-items-center ${
                      selected() ? "text-white/70 hover:text-white" : "text-fg-muted hover:text-fg"
                    }`}
                    aria-label={expanded() ? "Collapse" : "Expand"}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setExpanded(row.node.id, !expanded())}
                  >
                    {expanded() ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                </Show>
                <span class={`shrink-0 ${selected() ? "" : "text-fg-muted"}`}>
                  <Dynamic component={LAYER_ICONS[row.node.kind]} size={14} />
                </span>
                <span class="truncate text-[13px]">{row.node.name}</span>
              </li>
            );
          }}
        </For>

        <Show
          when={(() => {
            const indicator = drag()?.target?.indicator;
            return indicator?.kind === "line" ? indicator : undefined;
          })()}
        >
          {(indicator) => (
            <div
              class="pointer-events-none absolute right-3 flex items-center"
              style={indicatorStyle(indicator())}
            >
              <span class="-ml-1 size-2 shrink-0 rounded-full border-2 border-primary bg-surface" />
              <span class="h-0.5 flex-1 bg-primary" />
            </div>
          )}
        </Show>
      </ul>

      <Show when={drag()}>
        {(state) => (
          <Portal>
            <div
              class="pointer-events-none fixed z-50 flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg-strong shadow-xl shadow-black/20"
              style={{ left: `${state().x + 12}px`, top: `${state().y + 8}px` }}
            >
              <span class="text-fg-muted">
                <Dynamic component={LAYER_ICONS[state().row.node.kind]} size={12} />
              </span>
              {state().row.node.name}
            </div>
          </Portal>
        )}
      </Show>
    </>
  );
}

function flattenVisible(
  nodes: LayerNode[],
  collapsed: ReadonlySet<LayerId>,
  depth = 0,
  parentId: LayerId | null = null,
  ancestors: LayerId[] = [],
): Row[] {
  return nodes.flatMap((node, index) => {
    const row: Row = { node, depth, parentId, index, siblingCount: nodes.length, ancestors };
    const children =
      node.children && !collapsed.has(node.id)
        ? flattenVisible(node.children, collapsed, depth + 1, node.id, [...ancestors, node.id])
        : [];
    return [row, ...children];
  });
}
