import { createSignal, onMount } from "solid-js";
import { loadDesignerWasm } from "../wasm/designer";

export function WasmStatus() {
  const [message, setMessage] = createSignal("Loading Odin/WASM...");

  onMount(async () => {
    try {
      const wasm = await loadDesignerWasm();

      const version = wasm.exports.designer_version();
      const ok = wasm.exports.designer_init(800, 600);
      const frame = wasm.exports.designer_frame();

      const viewportWidth = wasm.exports.designer_viewport_width();
      const viewportHeight = wasm.exports.designer_viewport_width();
      const pageWidth = wasm.exports.designer_page_width();
      const pageHeight = wasm.exports.designer_page_height();
      const objectCount = wasm.exports.designer_object_count();

      console.log(viewportWidth, viewportHeight, pageWidth, pageHeight, objectCount);

      setMessage(`Odin/WASM loaded. Version=${version}, init=${ok}, viewport=${wasm.exports.designer_viewport_width()}x${wasm.exports.designer_viewport_height()}, frame=${frame}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown WASM loading error";
      setMessage(`Odin/WASM  failed: ${message}`);
    }
  });

  return <div class="wasm-status">{message()}</div>;
}
