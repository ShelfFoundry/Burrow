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

      setMessage(`Odin/WASM loaded. Version=${version}, init=${ok}, viewport=${wasm.exports.designer_viewport_width()}x${wasm.exports.designer_viewport_height()}, frame=${frame}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown WASM loading error";
      setMessage(`Odin/WASM  failed: ${message}`);
    }
  });

  return <div class="wasm-status">{message()}</div>;
}
