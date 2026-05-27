import { onCleanup, onMount } from "solid-js";
import { createEngine, waitForDesignerGpuReady, resizeCanvasToDisplaySize, type Engine, type ViewportPointerEventKind } from "../wasm/engine";
import { createOdinRenderLoop, type OdinRenderLoop } from "../wasm/loop";

type ViewportProps = {
  onStatusChange: (message: string) => void;
  onDocumentRevisionChange?: (revision: number) => void;
};

export function Viewport(props: ViewportProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let engine: Engine | undefined;
  let odinLoop: OdinRenderLoop | undefined;
  let handleResize: EventListener | undefined;
  const DEBUG: boolean = window.location.search.includes("debug") || false;

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

      if (DEBUG) {
        dumpOdinDebugInfo(engine, canvas);
      }

      return ok;
    });

    odinLoop.start();
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
    <section class="viewport-panel">
      <canvas
        id="designer-canvas"
        ref={canvasRef}
        class="viewport-canvas"
        tabindex={0}
        onPointerDown={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          canvas.setPointerCapture(event.pointerId);
          const viewportEvent = toViewportPointerEvent("pointer_down", canvas, event);

          engine?.pointerDown(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.button,
            viewportEvent.buttons,
            engine.pointerModifiers(event),
          );

          if (DEBUG) {
            console.log("Selected object(s)", engine?.getSelectionIds())
            console.log("Hit", engine?.debugInteractionHit());
          }

          odinLoop?.requestRender();
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
          );
          odinLoop?.requestRender();
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const viewportEvent = toViewportPointerEvent("pointer_up", canvas, event);

          engine?.pointerUp(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.button,
            viewportEvent.buttons,
            engine.pointerModifiers(event),
          );

          odinLoop?.requestRender();

          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;
          engine?.pointerCancel();
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
