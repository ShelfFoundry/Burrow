export type DesignerWasmExports = {
    memory?: WebAssembly.Memory;

    designer_version: () => number;
    designer_init: (width: number, height: number) => number;
    designer_is_initialzied: () => number;
    designer_frame: () => number;
    designer_gpu_is_initialized: () => number;

    designer_resize: (width: number, height: number) => void;
    designer_fit_page_to_viewport: () => void;
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

    designer_gpu_clear_frame: () => number;
    designer_render_document: () => number;
    designer_clear_objects: () => void;
    designer_add_rect: (
        x: number,
        y: number,
        width: number,
        height: number,
        r: number,
        g: number,
        b: number,
        a: number,
    ) => number;
    designer_add_full_rect: (
        x: number,
        y: number,
        width: number,
        height: number,
        fill_r: number,
        fill_g: number,
        fill_b: number,
        fill_a: number,
        stroke_r: number,
        stroke_g: number,
        stroke_b: number,
        stroke_a: number,
        stroke_width: number,
    ) => number;

    designer_gpu_has_surface: () => number;
    designer_gpu_has_adapter: () => number;
    designer_gpu_has_device: () => number;
    designer_gpu_has_queue: () => number;
    designer_gpu_configure_surface: (width: number, height: number) => number;
    designer_gpu_surface_configured: () => number;

    wgpu_alloc: (size: number) => number;
    wgpu_free: (ptr: number) => void;

    __indirect_function_table?: WebAssembly.Table;
};

export type DesignerWasm = {
    exports: DesignerWasmExports;
};

type OdinWasmMemoryInterface = {
    exports: DesignerWasmExports;
    intSize: number;

    loadPtr: (ptr: number) => number;
    loadI32: (ptr: number) => number;
    loadU32: (ptr: number) => number;
    loadU64: (ptr: number) => bigint;
    loadUint: (ptr: number) => number;
    loadB32: (ptr: number) => boolean;
    loadF32: (ptr: number) => number;
    loadF64: (ptr: number) => number;
    storeF32: (ptr: number, value: number) => void;
    storeF64: (ptr: number, value: number) => void;

    storeI32: (ptr: number, value: number) => void;
    storeUint: (ptr: number, value: number) => void;
    storeString: (ptr: number, value: string) => void;
    storePtr: (ptr: number, value: number) => void;

    loadString: (ptr: number, length: number) => string;
    loadBytes: (ptr: number, length: number) => Uint8Array;
};

declare global {
    interface Window {
        odin?: {
            WebGPUInterface?: new (memory: OdinWasmMemoryInterface) => {
                getInterface(): Record<string, (...args: any[]) => any>;
            };
        };
    }
}

export async function loadDesignerWasm(): Promise<DesignerWasm> {
    if (!window.odin?.WebGPUInterface) {
        throw new Error("Odin WebGPUInterface is missing");
    }

    const memoryBridge = createMutableOdinMemoryBridge();
    const webgpu = new window.odin.WebGPUInterface(memoryBridge);

    const env = {
        env: {},
        odin_env: {
            write() { },
            rand_bytes: crypto.getRandomValues.bind(crypto),
        },
        wgpu: webgpu.getInterface(),
    };

    const result = await WebAssembly.instantiateStreaming(fetch("/designer.wasm"), env);
    const exports = result.instance.exports as unknown as DesignerWasmExports;
    memoryBridge.exports = exports;

    return {
        exports,
    }
}

function createMutableOdinMemoryBridge(): OdinWasmMemoryInterface {
    let exports: DesignerWasmExports | undefined;

    const textDecoder = new TextDecoder();
    const textEncoder = new TextEncoder();

    function getMemory(): WebAssembly.Memory {
        const memory = exports?.memory;

        if (!memory) {
            throw new Error("WASM memory export is not available.");
        }

        return memory;
    }

    function view(): DataView {
        return new DataView(getMemory().buffer);
    }

    function bytes(): Uint8Array {
        return new Uint8Array(getMemory().buffer);
    }

    const bridge: OdinWasmMemoryInterface = {
        get exports() {
            if (!exports) {
                throw new Error("WASM exports are not attached yet.");
            }

            return exports;
        },

        set exports(nextExports: DesignerWasmExports) {
            exports = nextExports;
        },

        // js_wasm32 uses 32-bit pointers.
        intSize: 4,

        storePtr(ptr: number, value: number): void {
            view().setUint32(ptr, value, true);
        },

        loadPtr(ptr: number): number {
            return view().getUint32(ptr, true);
        },

        loadI32(ptr: number): number {
            return view().getInt32(ptr, true);
        },

        loadU32(ptr: number): number {
            return view().getUint32(ptr, true);
        },

        loadU64(ptr: number): bigint {
            return view().getBigUint64(ptr, true);
        },

        loadUint(ptr: number): number {
            return view().getUint32(ptr, true);
        },

        loadB32(ptr: number): boolean {
            return view().getUint32(ptr, true) !== 0;
        },

        loadF32(ptr: number): number {
            return view().getFloat32(ptr, true);
        },

        loadF64(ptr: number): number {
            return view().getFloat64(ptr, true);
        },

        storeF32(ptr: number, value: number): void {
            view().setFloat32(ptr, value, true);
        },

        storeF64(ptr: number, value: number): void {
            view().setFloat64(ptr, value, true);
        },

        storeI32(ptr: number, value: number): void {
            view().setInt32(ptr, value, true);
        },

        storeUint(ptr: number, value: number): void {
            view().setUint32(ptr, value, true);
        },

        storeString(ptr: number, value: string): void {
            const encoded = textEncoder.encode(value);
            bytes().set(encoded, ptr);
        },

        loadString(ptr: number, length: number): string {
            return textDecoder.decode(bytes().subarray(ptr, ptr + length));
        },

        loadBytes(ptr: number, length: number): Uint8Array {
            return bytes().slice(ptr, ptr + length);
        },
    };

    return bridge;
}
