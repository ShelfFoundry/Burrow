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

    designer_pointer_down: (
        x: number,
        y: number,
        button: number,
        buttons: number,
    ) => void;

    designer_pointer_move: (
        x: number,
        y: number,
        buttons: number,
    ) => void;

    designer_pointer_up: (
        x: number,
        y: number,
        button: number,
        buttons: number,
    ) => void;

    designer_pointer_cancel: () => void;
    designer_pointer_leave: () => void;

    designer_pointer_x: () => number;
    designer_pointer_y: () => number;
    designer_pointer_page_x: () => number;
    designer_pointer_page_y: () => number;
    designer_pointer_buttons: () => number;
    designer_pointer_is_down: () => number;
    designer_pointer_inside: () => number;
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
