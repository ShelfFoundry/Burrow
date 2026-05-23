export type DesignerWasmExports = {
    memory?: WebAssembly.Memory;

    designer_version: () => number;
    add_i32: (a: number, b: number) => number;
    viewport_area: (width: number, height: number) => number;

    designer_init: (width: number, height: number) => number;
    designer_resize: (width: number, height: number) => void;
    designer_frame: () => number;
    designer_viewport_width: () => number;
    designer_viewport_height: () => number;
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

    return {
        exports: result.instance.exports as unknown as DesignerWasmExports,
    };
}
