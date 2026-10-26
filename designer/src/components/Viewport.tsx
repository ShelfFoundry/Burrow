import { createEffect, onCleanup, onMount } from "solid-js";
import {
  createEngine,
  waitForDesignerGpuReady,
  resizeCanvasToDisplaySize,
  type DocumentObject,
  type Engine,
  type EngineTool,
  type RectEditableProperty,
  type SelectedObjectSnapshot,
  type SelectionMode,
  type ViewportPointerEventKind,
} from "../wasm/engine";
import { createOdinRenderLoop, type OdinRenderLoop } from "../wasm/loop";
import type { Tool } from "./ToolDock";

// The dock's tools that the engine knows about. Picking any other tool leaves the
// engine on Select.
const ENGINE_TOOL_FOR: Partial<Record<Tool, EngineTool>> = {
  select: "select",
  hand: "pan",
  square: "rect",
  line: "line",
};

// Defaults for objects drawn with the dock's creation tools.
const NEW_OBJECT_COLOR = { r: 0, g: 0, b: 0, a: 1 };
const NEW_LINE_WIDTH = 2;

export type ViewportController = {
  setSelectionRectProperty: (
    property: RectEditableProperty,
    value: number,
  ) => boolean;
  getSelectionIds: () => number[];
  getObjects: () => DocumentObject[];
  selectObject: (id: number, mode: SelectionMode) => boolean;
};

type ViewportProps = {
  onStatusChange: (message: string) => void;
  onSelectedObjectChange?: (snapshot: SelectedObjectSnapshot) => void;
  onSelectionChange?: (ids: number[]) => void;
  onControllerReady?: (controller: ViewportController) => void;
  onDocumentRevisionChange?: (revision: number) => void;
  onZoomChange?: (zoom: number) => void;
  activeTool: Tool;
  // Called after a creation tool adds an object, so the app can switch back to Select.
  onObjectCreated?: () => void;
};

export function Viewport(props: ViewportProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let engine: Engine | undefined;
  let odinLoop: OdinRenderLoop | undefined;
  let handleResize: EventListener | undefined;
  const DEBUG: boolean = window.location.search.includes("debug") || false;

  // Last document revision passed to onDocumentRevisionChange.
  let publishedRevision: number | undefined;

  // Page-space point where the current line drag started.
  let lineStart: { x: number; y: number } | undefined;
  // Whether the current press started an interim (JS-side) creation, so the rest of the
  // gesture skips the engine's interaction even if the tool changes mid-drag.
  let creatingGesture = false;

  // While Square or Line is active, the canvas creates objects instead of selecting them.
  const isCreating = () => props.activeTool === "square" || props.activeTool === "line";
  // Square goes through the engine's creation interaction. Line still uses the interim
  // JS placement below until the engine has a Creating_Line path.
  const usesInterimCreation = () => props.activeTool === "line";

  async function startOdinRenderer(canvas: HTMLCanvasElement) {
    engine = await createEngine();
    if (!engine) {
      throw new Error("Failed to create application engine");
    }

    engine.init(canvas.width, canvas.height);
    await waitForDesignerGpuReady(engine);
    engine?.configureGpuSurface(canvas.width, canvas.height);

    handleResize = () => {
      const resized = resizeCanvasToDisplaySize(canvas);

      if (!resized) {
        return;
      }

      engine?.resize(canvas.width, canvas.height);
      engine?.configureGpuSurface(canvas.width, canvas.height);
      odinLoop?.requestRender();
    };

    window.addEventListener("resize", handleResize);

    odinLoop = createOdinRenderLoop(() => {
      if (!engine) {
        return false;
      }

      const ok = engine.renderDocument();
      props.onZoomChange?.(engine.getTransform().zoom);

      if (DEBUG) {
        dumpOdinDebugInfo(engine, canvas);
      }

      return ok;
    });

    odinLoop.start();

    syncTool();
    publishEngineState();

    props.onControllerReady?.({
      setSelectionRectProperty,
      getSelectionIds: () => engine?.getSelectionIds() ?? [],
      getObjects: () => engine?.getObjects() ?? [],
      selectObject,
    });
  }

  function syncTool() {
    const tool = ENGINE_TOOL_FOR[props.activeTool] ?? "select";
    if (engine && !engine.setTool(tool)) {
      props.onStatusChange(`The engine rejected the ${tool} tool`);
    }
  }

  createEffect(syncTool);

  // Line: a drag draws a line from the press point to the release point.
  function createOnPointerDown() {
    if (!engine) return;
    lineStart = engine.getPointerPagePosition();
  }

  function createOnPointerUp() {
    if (!engine || !lineStart) return;
    const start = lineStart;
    const end = engine.getPointerPagePosition();
    lineStart = undefined;

    // A click without a drag has no length to draw, so stay in the Line tool.
    if (start.x === end.x && start.y === end.y) return;

    finishCreation(engine.addLine(start.x, start.y, end.x, end.y, NEW_OBJECT_COLOR, NEW_LINE_WIDTH), "Line");
  }

  // The add_* exports return 0 when the document has no room for another object.
  function finishCreation(id: number, kind: string) {
    if (id === 0) {
      props.onStatusChange(`Could not add ${kind.toLowerCase()}: the document is full`);
      return;
    }

    const name = engine?.getObjects().find((object) => object.id === id)?.name ?? `${kind} ${id}`;
    props.onStatusChange(`Added ${name}`);
    props.onObjectCreated?.();
  }

  // Pushes the engine's selection and document revision out to the app. Call it after
  // anything that might have changed either.
  function publishEngineState() {
    if (!engine) return;
    props.onSelectedObjectChange?.(engine.getSelectedObjectSnapshot());
    props.onSelectionChange?.(engine.getSelectionIds());

    const revision = engine.getDocumentRevision();
    if (revision !== publishedRevision) {
      publishedRevision = revision;
      props.onDocumentRevisionChange?.(revision);
    }
  }

  function selectObject(id: number, mode: SelectionMode): boolean {
    if (!engine) return false;

    const ok = engine.selectObjectById(id, mode);
    if (ok) {
      odinLoop?.requestRender();
      publishEngineState();
    }

    return ok;
  }

  function setSelectionRectProperty(property: RectEditableProperty, value: number): boolean {
    if (!engine) return false;

    const selected = engine.getSelectedObjectSnapshot();
    if (selected.kind !== "rect") return false;

    const next = { ...selected, [property]: value };
    const ok = engine.setRectGeometry(selected.id, next.x, next.y, next.width, next.height);

    if (ok) {
      odinLoop?.requestRender();
      publishEngineState();
    }

    return ok;
  }

  function dumpOdinDebugInfo(engine: Engine, canvas: HTMLCanvasElement) {
    const viewport = engine.getViewportSize();
    const page = engine.getPageSize();
    const transform = engine.getTransform();

    console.groupCollapsed("Odin renderer debug");

    console.group("Canvas");
    console.table({
      backingWidth: canvas.width,
      backingHeight: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
      devicePixelRatio: window.devicePixelRatio,
    });
    console.groupEnd();

    console.group("Document");
    console.table({
      pageWidth: page.width,
      pageHeight: page.height,
      objectCount: engine.getObjectCount(),
    });
    console.groupEnd();

    console.group("Viewport transform");
    console.table({
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      zoom: transform.zoom,
      panX: transform.panX,
      panY: transform.panY,
    });
    console.groupEnd();

    console.group("GPU");
    console.table({
      surface: engine.hasGpuSurface(),
      adapter: engine.hasGpuAdapter(),
      device: engine.hasGpuDevice(),
      queue: engine.hasGpuQueue(),
      configured: engine.isGpuSurfaceConfigured(),
    });
    console.groupEnd();

    console.group("First object bounds");
    console.table(engine.getFirstObjectBounds());
    console.groupEnd();

    console.groupEnd();
  }

  onMount(async () => {
    props.onStatusChange("Viewport mounted");

    const canvas = canvasRef;
    if (!canvas) {
      props.onStatusChange("Canvas not found");
      return;
    }

    try {
      resizeCanvasToDisplaySize(canvas);
      await startOdinRenderer(canvas);
      props.onStatusChange("Ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown viewport error";
      props.onStatusChange(`Viewport failed: ${message}`);
    }

    window.addEventListener("keydown", (event) => {
      const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
      const isRedo = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z";
      if (isUndo) {
        event.preventDefault();
        //const ok = loop?.undo() ?? false;
        //props.onStatusChange(ok ? "Undo" : "Nothing to undo");
      }
      if (isRedo) {
        event.preventDefault();
        //const ok = loop?.redo() ?? false;
        //props.onStatusChange(ok ? "Redo" : "Nothing to redo");
      }
    });

  });

  onCleanup(() => {
    odinLoop?.stop();
    if (handleResize) window.removeEventListener("resize", handleResize);
  });

  function toViewportPointerEvent(
    kind: ViewportPointerEventKind,
    canvas: HTMLCanvasElement,
    event: PointerEvent,
  ) {
    const point = getCanvasPoint(canvas, event);

    return {
      kind,
      pointerId: event.pointerId,
      x: point.x,
      y: point.y,
      buttons: event.buttons,
      button: event.button,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
    };
  }

  function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();

    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: cssX * scaleX,
      y: cssY * scaleY,
    };
  }

  return (
    <section class="absolute inset-0 bg-canvas">
      <canvas
        id="designer-canvas"
        ref={canvasRef}
        class={`block size-full touch-none outline-none ${isCreating() ? "cursor-crosshair" : ""}`}
        tabindex={0}
        onPointerDown={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          canvas.setPointerCapture(event.pointerId);
          const viewportEvent = toViewportPointerEvent("pointer_down", canvas, event);
          const creating = usesInterimCreation() && event.button === 0;
          creatingGesture = creating;

          engine?.pointerDown(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.button,
            viewportEvent.buttons,
            engine.pointerModifiers(event),
            !creating,
          );

          if (creating) createOnPointerDown();

          if (DEBUG) {
            console.log("Selected object(s)", engine?.getSelectionIds())
            console.log("Hit", engine?.debugInteractionHit());
          }

          odinLoop?.requestRender();
          publishEngineState();
        }}
        onPointerMove={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const viewportEvent = toViewportPointerEvent("pointer_move", canvas, event);

          engine?.pointerMove(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.buttons,
            engine.pointerModifiers(event),
            !(creatingGesture || usesInterimCreation()),
          );
          odinLoop?.requestRender();
          publishEngineState();
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const viewportEvent = toViewportPointerEvent("pointer_up", canvas, event);

          const creating = creatingGesture;
          creatingGesture = false;

          const result = engine?.pointerUp(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.button,
            viewportEvent.buttons,
            engine.pointerModifiers(event),
            !creating,
          );

          if (creating) createOnPointerUp();
          if (result === "object_created" && engine) {
            finishCreation(engine.getLastInteractionObjectId(), "Object");
          } else if (result === "document_full") {
            finishCreation(0, "Object");
          }

          odinLoop?.requestRender();
          publishEngineState();

          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;
          lineStart = undefined;
          creatingGesture = false;
          engine?.pointerCancel();
          publishEngineState();
          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerLeave={(_event) => {
          const canvas = canvasRef;
          if (!canvas) return;
          engine?.pointerLeave();
        }}
      />
    </section>
  );
}
