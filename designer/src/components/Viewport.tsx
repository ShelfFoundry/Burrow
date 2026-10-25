import { onCleanup, onMount } from "solid-js";
import {
  createEngine,
  waitForDesignerGpuReady,
  resizeCanvasToDisplaySize,
  type Engine,
  type RectEditableProperty,
  type SelectedObjectSnapshot,
  type ViewportPointerEventKind,
} from "../wasm/engine";
import { createOdinRenderLoop, type OdinRenderLoop } from "../wasm/loop";
import type { Tool } from "./ToolDock";

// Defaults for objects drawn with the dock's creation tools.
const NEW_OBJECT_COLOR = { r: 0, g: 0, b: 0, a: 1 };
const NEW_SQUARE_SIZE = 100;
const NEW_LINE_WIDTH = 2;

export type ViewportController = {
  setSelectionRectProperty: (
    property: RectEditableProperty,
    value: number,
  ) => boolean;
  getSelectionIds: () => number[];
};

type ViewportProps = {
  onStatusChange: (message: string) => void;
  onSelectedObjectChange?: (snapshot: SelectedObjectSnapshot) => void;
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

  // Page-space point where the current line drag started.
  let lineStart: { x: number; y: number } | undefined;
  // Whether the current press started with a creation tool. Square switches back to
  // Select on press, so the rest of the gesture must not reach the engine's interaction.
  let creatingGesture = false;

  // While Square or Line is active, the canvas creates objects instead of selecting them.
  const isCreating = () => props.activeTool === "square" || props.activeTool === "line";

  async function startOdinRenderer(canvas: HTMLCanvasElement) {
    engine = await createEngine();
    if (!engine) {
      throw new Error("Failed to create application engine");
    }

    engine.init(canvas.width, canvas.height);
    await waitForDesignerGpuReady(engine);
    engine?.configureGpuSurface(canvas.width, canvas.height);

    engine.addRect(
      50, 50, 100, 100,
      { r: 1, g: 0, b: 0, a: 1 }
    );
    engine.addLine(
      0, 0, 50, 50,
      { r: 0, g: 1, b: 0, a: 1 },
      4
    );

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

    props.onControllerReady?.({
      setSelectionRectProperty,
      getSelectionIds: () => engine?.getSelectionIds() ?? [],
    });
  }

  // Square: a click places a default-sized square with its top-left at the pointer.
  // Line: a drag draws a line from the press point to the release point.
  function createOnPointerDown() {
    if (!engine) return;
    const point = engine.getPointerPagePosition();

    if (props.activeTool === "square") {
      finishCreation(engine.addRect(point.x, point.y, NEW_SQUARE_SIZE, NEW_SQUARE_SIZE, NEW_OBJECT_COLOR), "Rect");
    } else if (props.activeTool === "line") {
      lineStart = point;
    }
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

    props.onStatusChange(`Added ${kind} ${id}`);
    props.onObjectCreated?.();
  }

  function publishSelectedObject() {
    if (!engine) return;
    props.onSelectedObjectChange?.(engine.getSelectedObjectSnapshot());
  }

  function setSelectionRectProperty(property: RectEditableProperty, value: number): boolean {
    if (!engine) return false;

    const selected = engine.getSelectedObjectSnapshot();
    if (selected.kind !== "rect") return false;

    const next = { ...selected, [property]: value };
    const ok = engine.setRectGeometry(selected.id, next.x, next.y, next.width, next.height);

    if (ok) {
      odinLoop?.requestRender();
      publishSelectedObject();
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
          const creating = isCreating() && event.button === 0;
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
          publishSelectedObject();
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
            !(creatingGesture || isCreating()),
          );
          odinLoop?.requestRender();
          publishSelectedObject();
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const viewportEvent = toViewportPointerEvent("pointer_up", canvas, event);

          const creating = creatingGesture;
          creatingGesture = false;

          engine?.pointerUp(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.button,
            viewportEvent.buttons,
            engine.pointerModifiers(event),
            !creating,
          );

          if (creating) createOnPointerUp();

          odinLoop?.requestRender();
          publishSelectedObject();

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
          publishSelectedObject();
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
