import { onCleanup, onMount } from "solid-js";
import { initWebGpu, resizeCanvasToDisplaySize } from "../gpu/webgpu";
import { createViewportLoop, type ViewportLoop, type ViewportPointerEventKind } from "../gpu/viewport-loop";
import type { EditorDocument } from "../editor/document";
import type { RectEditableProperty, SelectedObjectSnapshot } from "../editor/selection";
import { createEngine, waitForDesignerGpuReady, type Engine } from "../wasm/engine";

export type ViewportController = {
  setSelectionRectProperty: (
    property: RectEditableProperty,
    value: number,
  ) => boolean;
  undo: () => boolean;
  redo: () => boolean;
  getDocumentRevision: () => number;
  getSelectedObjectSnapshot: () => SelectedObjectSnapshot;
};

type ViewportProps = {
  document: EditorDocument,
  onStatusChange: (message: string) => void;
  onSelectedObjectChange: (snapshot: SelectedObjectSnapshot) => void;
  onControllerReady?: (controller: ViewportController) => void;
  onDocumentRevisionChange?: (revision: number) => void;
};

export function Viewport(props: ViewportProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let loop: ViewportLoop | undefined;
  let engine: Engine | undefined;

  onMount(async () => {
    props.onStatusChange("Viewport mounted");

    const canvas = canvasRef;
    if (!canvas) {
      props.onStatusChange("Canvas not found");
      return;
    }

    try {
      //const gpuState = await initWebGpu(canvas);

      resizeCanvasToDisplaySize(canvas);

      engine = await createEngine();
      const initialized = engine.init(canvas.width, canvas.height);
      const gpuReady = await waitForDesignerGpuReady(engine);

      const configured = engine.configureGpuSurface(
        canvas.width,
        canvas.height,
      );

      const cleared = engine.clearFrame();
      return;

      const pageSize = engine.getPageSize();
      const objectCount = engine.getObjectCount();


      loop = createViewportLoop(
        canvas,
        gpuState,
        props.document,
        {
          onSelectionChanged: (_selection, hit) => {
            if (hit.kind === "object") {
              props.onStatusChange(`Selected object: ${hit.object.id}: ${hit.object.name}`);
            } else {
              props.onStatusChange("No object selected");
            }
          },
          onDocumentChanged: (event) => {
            props.onSelectedObjectChange(event.selectedObject);
            props.onDocumentRevisionChange?.(event.revision);
          },
          onInteractionHit: (hit) => {
            if (hit.kind === "resize_handle") {
              props.onStatusChange(`Resize handle ${hit.handleId} on object ${hit.objectId}`);
            }
            if (hit.kind === "object") {
              props.onStatusChange(`Start move: object ${hit.objectId}`);
            }
          },
        },
        engine
      );
      loop.start();

      props.onControllerReady?.({
        setSelectionRectProperty: (property, value) => {
          return loop?.setSelectedRectProperty(property, value) ?? false;
        },
        undo: () => {
          return loop?.undo() ?? false;
        },
        redo: () => {
          return loop?.redo() ?? false;
        },
        getDocumentRevision: () => {
          return loop?.getDocumentRevision() ?? 0;
        },
        getSelectedObjectSnapshot: () => {
          return loop?.getSelectedObjectSnapshot() ?? { kind: "none" };
        },
      });

      props.onStatusChange(
        `Odin engine initialized=${initialized}. Page=${pageSize.width}×${pageSize.height}. Objects=${objectCount}. WebGPU format=${gpuState.format}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown viewport error";
      props.onStatusChange(`Viewport failed: ${message}`);
    }

    window.addEventListener("keydown", (event) => {
      const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
      const isRedo = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z";
      if (isUndo) {
        event.preventDefault();
        const ok = loop?.undo() ?? false;
        props.onStatusChange(ok ? "Undo" : "Nothing to undo");
      }
      if (isRedo) {
        event.preventDefault();
        const ok = loop?.redo() ?? false;
        props.onStatusChange(ok ? "Redo" : "Nothing to redo");
      }
    });

  });

  onCleanup(() => {
    loop?.stop();
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
          );

          loop?.handlePointerEvent(viewportEvent);
        }}
        onPointerMove={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const viewportEvent = toViewportPointerEvent("pointer_move", canvas, event);

          engine?.pointerMove(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.buttons,
          );

          loop?.handlePointerEvent(viewportEvent);
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const viewportEvent = toViewportPointerEvent("pointer_up", canvas, event);

          engine?.pointerUp(
            viewportEvent.x,
            viewportEvent.y,
            viewportEvent.button,
            viewportEvent.buttons
          );

          loop?.handlePointerEvent(viewportEvent);

          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;
          const viewportEvent = toViewportPointerEvent("pointer_cancel", canvas, event);
          engine?.pointerCancel();
          loop?.handlePointerEvent(viewportEvent);
          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerLeave={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;
          engine?.pointerLeave();
          loop?.handlePointerEvent(toViewportPointerEvent("pointer_leave", canvas, event));
        }}
      />
    </section>
  );
}
