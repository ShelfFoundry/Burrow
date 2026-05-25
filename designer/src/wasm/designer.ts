export type DesignerWasmExports = {
    memory?: WebAssembly.Memory;

    designer_version: () => number;
    designer_init: (width: number, height: number) => number;
    designer_is_initialzied: () => number;
    designer_frame: () => number;

    designer_resize: (width: number, height: number) => void;
    designer_viewport_width: () => number;
    designer_viewport_height: () => number;

    designer_page_width: () => number;
    designer_page_height: () => number;
    designer_object_count: () => number;

    designer_zoom: () => number;
    designer_pan_x: () => number;
    designer_pan_y: () => number;
};

export type DesignerWasm = {
    exports: DesignerWasmExports;
};

export async function loadDesignerWasm(): Promise<DesignerWasm> {
    const env = {
        env: {
        },
        odin_env: {
            write() { },
            rand_bytes: crypto.getRandomValues,
        }
    };

    const result = await WebAssembly.instantiateStreaming(fetch("/designer.wasm"), env);

    console.log(result.instance.exports);

    return {
        exports: result.instance.exports as unknown as DesignerWasmExports,
    };
}
