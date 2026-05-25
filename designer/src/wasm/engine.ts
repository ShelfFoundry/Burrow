import { loadDesignerWasm, type DesignerWasm } from "./designer";

export type DesignerPointerDebugState = {
    x: number;
    y: number;
    pageX: number;
    pageY: number;
    buttons: number;
    isDown: boolean;
    inside: boolean;
};

export type Engine = {
    wasm: DesignerWasm;

    init: (width: number, height: number) => boolean;
    resize: (width: number, height: number) => void;
    fitPageToView: ()=>void;
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

    getTransform: () => {
        zoom: number;
        panX: number;
        panY: number;
    };

    getObjectCount: () => number;

    pointerDown: (
        x: number,
        y: number,
        button: number,
        buttons: number,
    ) => void;

    pointerMove: (
        x: number,
        y: number,
        buttons: number,
    ) => void;

    pointerUp: (
        x: number,
        y: number,
        button: number,
        buttons: number,
    ) => void;

    pointerCancel: () => void;
    pointerLeave: () => void;

    getPointerDebugState: () => DesignerPointerDebugState;

    clearFrame: () => boolean;
    renderEmptyPage: () => boolean;

    isGpuInitializeid: () => boolean;
    hasGpuSurface: () => boolean;
    hasGpuAdapter: () => boolean;
    hasGpuDevice: () => boolean;
    hasGpuQueue: () => boolean;
    configureGpuSurface: (width: number, height: number) => boolean;
    isGpuSurfaceConfigured: () => boolean;
};

export async function createEngine(): Promise<Engine> {
    const wasm = await loadDesignerWasm();

    function init(width: number, height: number): boolean {
        return wasm.exports.designer_init(width, height) !== 0;
    }

    function resize(width: number, height: number): void {
        return wasm.exports.designer_resize(width, height);
    }

    function fitPageToView(): void {
        return wasm.exports.designer_fit_page_to_viewport();
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
            height: wasm.exports.designer_page_height(),
        };
    }

    function getTransform() {
        return {
            zoom: wasm.exports.designer_zoom(),
            panX: wasm.exports.designer_pan_x(),
            panY: wasm.exports.designer_pan_y(),
        };
    }

    function getObjectCount(): number {
        return wasm.exports.designer_object_count();
    }

    function pointerDown(
        x: number,
        y: number,
        button: number,
        buttons: number,
    ): void {
        wasm.exports.designer_pointer_down(x, y, button, buttons);
    }

    function pointerMove(
        x: number,
        y: number,
        buttons: number,
    ): void {
        wasm.exports.designer_pointer_move(x, y, buttons);
    }

    function pointerUp(
        x: number,
        y: number,
        button: number,
        buttons: number,
    ): void {
        wasm.exports.designer_pointer_up(x, y, button, buttons);
    }

    function pointerCancel(): void {
        wasm.exports.designer_pointer_cancel();
    }

    function pointerLeave(): void {
        wasm.exports.designer_pointer_leave();
    }

    function getPointerDebugState(): DesignerPointerDebugState {
        return {
            x: wasm.exports.designer_pointer_x(),
            y: wasm.exports.designer_pointer_y(),
            pageX: wasm.exports.designer_pointer_page_x(),
            pageY: wasm.exports.designer_pointer_page_y(),
            buttons: wasm.exports.designer_pointer_buttons(),
            isDown: wasm.exports.designer_pointer_is_down() !== 0,
            inside: wasm.exports.designer_pointer_inside() !== 0,
        };
    }

    function isGpuInitializeid(): boolean {
        return wasm.exports.designer_gpu_is_initialized() !== 0;
    }

    function clearFrame(): boolean {
        return wasm.exports.designer_gpu_clear_frame() !== 0;
    }

    function renderEmptyPage(): boolean {
        return wasm.exports.designer_render_empty_page() !== 0;
    }

    function hasGpuSurface(): boolean {
        return wasm.exports.designer_gpu_has_surface() !== 0;
    }

    function hasGpuAdapter(): boolean {
        return wasm.exports.designer_gpu_has_adapter() !== 0;
    }

    function hasGpuDevice(): boolean {
        return wasm.exports.designer_gpu_has_device() !== 0;
    }

    function hasGpuQueue(): boolean {
        return wasm.exports.designer_gpu_has_queue() !== 0;
    }

    function configureGpuSurface(width: number, height: number): boolean {
        return wasm.exports.designer_gpu_configure_surface(width, height) !== 0;
    }

    function isGpuSurfaceConfigured(): boolean {
        return wasm.exports.designer_gpu_surface_configured() !== 0;
    }

    return {
        wasm,
        init,
        resize,
        fitPageToView,
        frame,
        isInitialized,
        getViewportSize,
        getPageSize,
        getObjectCount,
        getTransform,
        pointerDown,
        pointerMove,
        pointerUp,
        pointerCancel,
        pointerLeave,
        getPointerDebugState,
        isGpuInitializeid,
        clearFrame,
        hasGpuSurface,
        hasGpuAdapter,
        hasGpuDevice,
        hasGpuQueue,
        configureGpuSurface,
        isGpuSurfaceConfigured,
        renderEmptyPage,
    };
}

export async function waitForDesignerGpuReady(
    engine: Engine,
    timeoutMs = 3000,
): Promise<boolean> {
    const startedAt = performance.now();

    while (performance.now() - startedAt < timeoutMs) {
        if (
            engine.hasGpuSurface() &&
            engine.hasGpuAdapter() &&
            engine.hasGpuDevice() &&
            engine.hasGpuQueue()
        ) {
            return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 16));
    }

    return false;
}
