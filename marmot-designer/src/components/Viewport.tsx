import { onCleanup, onMount } from "solid-js";

type ViewportProps = {
  onStatusChange: (message: string) => void;
  onSelectionChange: (selection: { kind: "none"; }) => void;
};

export function Viewport(props: ViewportProps) {
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    props.onStatusChange("Viewport mounted");

    const canvas = canvasRef;
    if (!canvas) {
      props.onStatusChange("Canvas not found");
      return;
    }

    const context = canvas.getContext("webgpu");

    if (!context) {
      props.onStatusChange("WebGPU context not available");
      return;
    }

    props.onStatusChange("WebGPU context available");

    onCleanup(() => {
      props.onStatusChange("Viewport unmounted");
    });
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
