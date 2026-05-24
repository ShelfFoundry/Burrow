import { onCleanup, onMount } from "solid-js";
import { initWebGpu } from "../gpu/webgpu";
import { createViewportLoop, type ViewportLoop, type ViewportPointerEventKind } from "../gpu/viewport-loop";
import type { EditorDocument } from "../editor/document";
import { selectionToSummary } from "../editor/selection";
import { type SelectionSummary } from "../editor/selection";

type ViewportProps = {
  document: EditorDocument,
  onStatusChange: (message: string) => void;
  onSelectionChange: (selection: SelectionSummary) => void;
};

export function Viewport(props: ViewportProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  let loop: ViewportLoop | undefined;

  onMount(async () => {
    props.onStatusChange("Viewport mounted");

    const canvas = canvasRef;
    if (!canvas) {
      props.onStatusChange("Canvas not found");
      return;
    }

    try {
      const gpuState = await initWebGpu(canvas);
      loop = createViewportLoop(canvas, gpuState, props.document, {
        onSelectionChanged: (selection, hit) => {
          if (hit.kind === "object") {
            props.onSelectionChange(selectionToSummary(props.document, selection));
            props.onStatusChange(`Selected object: ${hit.object.id}: ${hit.object.name}`);
          } else {
            props.onSelectionChange({ kind: "none" });
            props.onStatusChange("No object selected");
          }
        },
        onInteractionHit: (hit) => {
          if (hit.kind === "resize_handle") {
            props.onStatusChange(`Resize handle ${hit.handleId} on object ${hit.objectId}`);
          }
        },
      });
      loop.start();

      props.onStatusChange(
        `WebGPU loop running. Page: ${props.document.page.width}×${props.document.page.height}. Objects: ${props.document.objects.length}. Format: ${gpuState.format}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown WebGPU error";
      props.onStatusChange(`WebGPU failed: ${message}`);
    }

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
        ref={canvasRef}
        class="viewport-canvas"
        onPointerDown={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          canvas.setPointerCapture(event.pointerId);
          loop?.handlePointerEvent(toViewportPointerEvent("pointer_down", canvas, event));
        }}
        onPointerMove={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          loop?.handlePointerEvent(toViewportPointerEvent("pointer_move", canvas, event));
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          loop?.handlePointerEvent(toViewportPointerEvent("pointer_up", canvas, event));

          const pointer = loop?.getPointerState();

          if (pointer) {
            props.onStatusChange(`Screen: ${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)} | Page: ${pointer.pageX.toFixed(1)}, ${pointer.pageY.toFixed(1)}`);
          }
        }}
        onPointerCancel={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;
          loop?.handlePointerEvent(toViewportPointerEvent("pointer_cancel", canvas, event));
          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
          props.onStatusChange("Pointer canceled");
        }}
        onPointerLeave={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;
          loop?.handlePointerEvent(toViewportPointerEvent("pointer_leave", canvas, event));
        }}
      />
    </section>
  );
}
