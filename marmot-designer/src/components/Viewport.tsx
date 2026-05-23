import { onCleanup, onMount } from "solid-js";
import { clearFrame, initWebGpu, type WebGpuState } from "../gpu/webgpu";

type ViewportProps = {
  onStatusChange: (message: string) => void;
  onSelectionChange: (selection: { kind: "none"; }) => void;
};

export function Viewport(props: ViewportProps) {
  let canvasRef: HTMLCanvasElement | undefined;

  let gpuState: WebGpuState | undefined;
  let animationFrameId = 0;
  let disposed = false;

  function frame() {
    if (disposed) {
      return;
    }

    if (gpuState) {
      clearFrame(gpuState);
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  onMount(async () => {
    props.onStatusChange("Viewport mounted");

    const canvas = canvasRef;
    if (!canvas) {
      props.onStatusChange("Canvas not found");
      return;
    }

    try {
      gpuState = await initWebGpu(canvas);

      props.onStatusChange(`WebGPU initalized. Format: ${gpuState.format}`);

      animationFrameId = requestAnimationFrame(frame);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown WebGPU error";
      props.onStatusChange(`WebGPU failed: ${message}`);
    }

  });

  onCleanup(() => {
    disposed = true;
    cancelAnimationFrame(animationFrameId);
  });

  return (
    <section class="viewport-panel">
      <canvas
        ref={canvasRef}
        class="viewport-canvas"
        onPointerDown={() => {
          props.onSelectionChange({ kind: "none" });
          props.onStatusChange("Canvas clicked");
        }}
      />
    </section>
  );
}
