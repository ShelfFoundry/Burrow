import { onCleanup, onMount } from "solid-js";
import { initWebGpu } from "../gpu/webgpu";
import { createViewportLoop, type ViewportLoop } from "../gpu/viewport-loop";
import type { EditorDocument } from "../editor/document";

type ViewportProps = {
  document: EditorDocument,
  onStatusChange: (message: string) => void;
  onSelectionChange: (selection: { kind: "none"; }) => void;
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
      loop = createViewportLoop(canvas, gpuState);
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

  function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
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
          const point = getCanvasPoint(canvas, event);

          loop?.pointerMove(point.x, point.y, event.buttons);
          props.onSelectionChange({ kind: "none" });
          props.onStatusChange("Canvas clicked");
        }}
        onPointerMove={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const point = getCanvasPoint(canvas, event);
          loop?.pointerMove(point.x, point.y, event.buttons);
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef;
          if (!canvas) return;

          const point = getCanvasPoint(canvas, event);
          loop?.pointerMove(point.x, point.y, event.buttons);
          props.onStatusChange(`Pointer up: ${point.x.toFixed(0)}, ${point.y.toFixed(0)}`);

          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerLeave={() => {
          loop?.pointerLeave();
        }}
      />
    </section>
  );
}
