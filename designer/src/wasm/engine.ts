import { loadDesignerWasm, type DesignerWasm } from "./designer";

export type Engine = {
    wasm: DesignerWasm;

    init: (width: number, height: number) => boolean;
    resize: (width: number, height: number) => void;
    frame: () => number;

    isInitialized: () => boolean;

    getViewportSize: () => {
        width: number;
        height: number;
    };

    getPageSize: () => {
        width: number;
        height: number;
    };

    getObjectCount: () => number;
};

export async function createEngine(): Promise<Engine> {
    const wasm = await loadDesignerWasm();

    function init(width: number, height: number): boolean {
        return wasm.exports.designer_init(width, height) !== 0;
    }

    function resize(width: number, height: number): void {
        return wasm.exports.designer_resize(width, height);
    }

    function frame(): number {
        return wasm.exports.designer_frame();
    }

    function isInitialized(): boolean {
        return wasm.exports.designer_is_initialzied() !== 0;
    }

    function getViewportSize() {
        return {
            width: wasm.exports.designer_viewport_width(),
            height: wasm.exports.designer_viewport_height(),
        };
    }

    function getPageSize() {
        return {
            width: wasm.exports.designer_page_width(),
            height: wasm.exports.designer_viewport_height(),
        };
    }

    function getObjectCount(): number {
        return wasm.exports.designer_object_count();
    }

    return {
        wasm,
        init,
        resize,
        frame,
        isInitialized,
        getViewportSize,
        getPageSize,
        getObjectCount,
    };
}
